/**
 * Cryptographic Verification Module
 * Ed25519 and secp256k1 signature verification with canonicalization
 *
 * P0 CRITICAL: Required for pilot
 */

import * as crypto from 'crypto';

export type SignatureAlgorithm = 'Ed25519' | 'ES256K' | 'RS256';

export interface SignatureVerificationResult {
  valid: boolean;
  algorithm: SignatureAlgorithm;
  error?: string;
  verificationMethod?: string;
}

export interface CanonicalizeOptions {
  method: 'JCS' | 'URDNA2015';
}

/**
 * Canonicalize JSON for deterministic signing
 * Uses JSON Canonicalization Scheme (JCS) RFC 8785
 */
export function canonicalizeJSON(data: any, options: CanonicalizeOptions = { method: 'JCS' }): string {
  if (options.method === 'JCS') {
    return canonicalizeJCS(data);
  } else {
    // URDNA2015 for RDF - placeholder for future implementation
    throw new Error('URDNA2015 not yet implemented');
  }
}

/**
 * JSON Canonicalization Scheme (RFC 8785)
 * Deterministic JSON serialization for cryptographic operations
 */
function canonicalizeJCS(data: any): string {
  if (data === null) {
    return 'null';
  }

  if (typeof data === 'boolean') {
    return data ? 'true' : 'false';
  }

  if (typeof data === 'number') {
    // IEEE 754 canonical representation
    if (Number.isFinite(data)) {
      let str = data.toString();
      // Handle scientific notation consistently
      if (str.includes('e') || str.includes('E')) {
        const num = Number(data);
        str = num.toExponential();
      }
      return str;
    }
    throw new Error('Cannot canonicalize non-finite number');
  }

  if (typeof data === 'string') {
    return JSON.stringify(data);
  }

  if (Array.isArray(data)) {
    const elements = data.map(item => canonicalizeJCS(item));
    return '[' + elements.join(',') + ']';
  }

  if (typeof data === 'object') {
    // Sort keys lexicographically
    const keys = Object.keys(data).sort();
    const pairs = keys.map(key => {
      const value = canonicalizeJCS(data[key]);
      return JSON.stringify(key) + ':' + value;
    });
    return '{' + pairs.join(',') + '}';
  }

  throw new Error(`Cannot canonicalize type: ${typeof data}`);
}

/**
 * Verify Ed25519 signature
 * Used for DID documents and verifiable credentials
 */
export async function verifyEd25519Signature(
  data: any,
  signatureMultibase: string,
  publicKeyMultibase: string,
  options?: CanonicalizeOptions
): Promise<SignatureVerificationResult> {
  try {
    // Canonicalize the data
    const canonical = canonicalizeJSON(data, options);
    const message = Buffer.from(canonical, 'utf8');

    // Decode multibase (assuming 'z' prefix for base58btc)
    if (!signatureMultibase.startsWith('z') || !publicKeyMultibase.startsWith('z')) {
      return {
        valid: false,
        algorithm: 'Ed25519',
        error: 'Invalid multibase encoding (expected base58btc with z prefix)'
      };
    }

    // Remove 'z' prefix and decode base58
    const signature = base58Decode(signatureMultibase.substring(1));
    const publicKey = base58Decode(publicKeyMultibase.substring(1));

    // Ed25519 verification using Node.js crypto
    const isValid = crypto.verify(
      null, // Ed25519 doesn't use a hash function
      message,
      {
        key: Buffer.concat([
          Buffer.from([0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00]), // ASN.1 prefix
          publicKey
        ]),
        format: 'der',
        type: 'spki'
      },
      signature
    );

    return {
      valid: isValid,
      algorithm: 'Ed25519'
    };
  } catch (error) {
    return {
      valid: false,
      algorithm: 'Ed25519',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Verify secp256k1 signature (for Ethereum DIDs)
 * ES256K algorithm
 */
export async function verifySecp256k1Signature(
  data: any,
  signature: string,
  publicKey: string,
  options?: CanonicalizeOptions
): Promise<SignatureVerificationResult> {
  try {
    // Canonicalize the data
    const canonical = canonicalizeJSON(data, options);
    const message = Buffer.from(canonical, 'utf8');

    // Hash the message with SHA-256 (ES256K uses SHA-256)
    const hash = crypto.createHash('sha256').update(message).digest();

    // Decode signature and public key (hex format for Ethereum)
    const sigBuffer = Buffer.from(signature, 'hex');
    const pubKeyBuffer = Buffer.from(publicKey, 'hex');

    // secp256k1 verification
    const isValid = crypto.verify(
      'sha256',
      hash,
      {
        key: pubKeyBuffer,
        format: 'der',
        type: 'spki'
      },
      sigBuffer
    );

    return {
      valid: isValid,
      algorithm: 'ES256K'
    };
  } catch (error) {
    return {
      valid: false,
      algorithm: 'ES256K',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Verify RSA signature (RS256)
 * For backward compatibility with JWT systems
 */
export async function verifyRSASignature(
  data: any,
  signature: string,
  publicKey: string,
  options?: CanonicalizeOptions
): Promise<SignatureVerificationResult> {
  try {
    const canonical = canonicalizeJSON(data, options);
    const message = Buffer.from(canonical, 'utf8');

    const isValid = crypto.verify(
      'sha256',
      message,
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST
      },
      Buffer.from(signature, 'base64')
    );

    return {
      valid: isValid,
      algorithm: 'RS256'
    };
  } catch (error) {
    return {
      valid: false,
      algorithm: 'RS256',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Verify a verifiable credential proof
 */
export async function verifyCredentialProof(
  credential: any,
  options?: CanonicalizeOptions
): Promise<SignatureVerificationResult> {
  if (!credential.proof) {
    return {
      valid: false,
      algorithm: 'Ed25519',
      error: 'No proof found in credential'
    };
  }

  const proof = credential.proof;

  // Create a copy without the proof for verification
  const credentialWithoutProof = { ...credential };
  delete credentialWithoutProof.proof;

  // Determine algorithm from proof type
  switch (proof.type) {
    case 'Ed25519Signature2020':
      return verifyEd25519Signature(
        credentialWithoutProof,
        proof.proofValue,
        proof.verificationMethod, // This should resolve to public key
        options
      );

    case 'EcdsaSecp256k1Signature2019':
      return verifySecp256k1Signature(
        credentialWithoutProof,
        proof.proofValue,
        proof.verificationMethod,
        options
      );

    case 'RsaSignature2018':
    case 'JsonWebSignature2020':
      return verifyRSASignature(
        credentialWithoutProof,
        proof.jws || proof.proofValue,
        proof.verificationMethod,
        options
      );

    default:
      return {
        valid: false,
        algorithm: 'Ed25519',
        error: `Unsupported proof type: ${proof.type}`
      };
  }
}

/**
 * Base58 decoding (Bitcoin alphabet)
 * Used for multibase 'z' prefix
 */
function base58Decode(encoded: string): Buffer {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const base = BigInt(58);

  let result = BigInt(0);
  for (let i = 0; i < encoded.length; i++) {
    const digit = ALPHABET.indexOf(encoded[i]);
    if (digit < 0) {
      throw new Error(`Invalid base58 character: ${encoded[i]}`);
    }
    result = result * base + BigInt(digit);
  }

  // Convert to buffer
  const hex = result.toString(16);
  return Buffer.from(hex.length % 2 ? '0' + hex : hex, 'hex');
}

/**
 * Generate crypto-secure random bytes
 * Use this instead of Math.random() for keys/nonces
 */
export function generateSecureRandom(length: number): Buffer {
  return crypto.randomBytes(length);
}

/**
 * Generate crypto-secure API key
 * Replacement for Math.random() based generation
 */
export function generateSecureApiKey(length: number = 64): string {
  const bytes = generateSecureRandom(length);
  return bytes.toString('base64url');
}

/**
 * Generate nonce for replay protection
 */
export function generateNonce(): string {
  return generateSecureRandom(16).toString('base64url');
}

/**
 * Timing-safe string comparison
 * Prevents timing attacks on tokens/secrets
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
