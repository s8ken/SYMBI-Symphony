import { DIDDocument } from '../types';
import {
  DIDResolver,
  DIDResolutionResult,
  DIDResolutionOptions,
  DIDResolutionMetadata,
} from './types';

/**
 * did:key DID Method Resolver
 *
 * Spec: https://w3c-ccg.github.io/did-method-key/
 *
 * The did:key method is a stateless, deterministic DID method that
 * encodes the public key directly in the DID identifier using multibase
 * and multicodec encoding.
 *
 * Format: did:key:z<multibase-encoded-multicodec-public-key>
 *
 * Supported key types:
 * - Ed25519 (0xed01) - Edwards curve digital signature
 * - secp256k1 (0xe701) - ECDSA with secp256k1 curve
 * - X25519 (0xec01) - Curve25519 for key agreement
 * - P-256 (0x1200) - NIST P-256 curve
 * - P-384 (0x1201) - NIST P-384 curve
 *
 * Note: This is a stateless resolver - no network calls or caching needed
 */
export class DidKeyResolver implements DIDResolver {
  readonly method = 'key';

  // Multicodec prefixes (varint encoded)
  private readonly MULTICODEC = {
    ED25519_PUB: 0xed01,
    SECP256K1_PUB: 0xe701,
    X25519_PUB: 0xec01,
    P256_PUB: 0x1200,
    P384_PUB: 0x1201,
  };

  // Base58btc alphabet (multibase 'z' prefix)
  private readonly BASE58_ALPHABET =
    '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

  validateDID(did: string): boolean {
    // did:key:z<base58btc-encoded-data>
    const pattern = /^did:key:z[1-9A-HJ-NP-Za-km-z]+$/;
    return pattern.test(did);
  }

  async resolve(
    did: string,
    options?: DIDResolutionOptions
  ): Promise<DIDResolutionResult> {
    const startTime = Date.now();
    const resolutionMetadata: DIDResolutionMetadata = {};

    // Validate DID format
    if (!this.validateDID(did)) {
      resolutionMetadata.error = 'invalidDid';
      resolutionMetadata.message = 'DID format is invalid for did:key method';
      resolutionMetadata.duration = Date.now() - startTime;
      return {
        didDocument: null,
        didResolutionMetadata: resolutionMetadata,
        didDocumentMetadata: {},
      };
    }

    try {
      // Extract multibase string (remove 'did:key:' prefix)
      const multibaseString = did.replace('did:key:', '');

      // Decode multibase (currently only z/base58btc supported)
      if (!multibaseString.startsWith('z')) {
        resolutionMetadata.error = 'invalidDid';
        resolutionMetadata.message = 'Only base58btc encoding (z prefix) is supported';
        resolutionMetadata.duration = Date.now() - startTime;
        return {
          didDocument: null,
          didResolutionMetadata: resolutionMetadata,
          didDocumentMetadata: {},
        };
      }

      const decoded = this.decodeBase58(multibaseString.slice(1));

      // Parse multicodec prefix (varint)
      const { codec, keyBytes } = this.parseMulticodec(decoded);

      // Generate DID document based on key type
      const didDocument = this.generateDidDocument(did, codec, keyBytes, multibaseString);

      resolutionMetadata.contentType = 'application/did+ld+json';
      resolutionMetadata.duration = Date.now() - startTime;

      return {
        didDocument,
        didResolutionMetadata: resolutionMetadata,
        didDocumentMetadata: {},
      };
    } catch (error: any) {
      resolutionMetadata.error = 'invalidDid';
      resolutionMetadata.message = error.message || 'Failed to decode did:key';
      resolutionMetadata.duration = Date.now() - startTime;

      return {
        didDocument: null,
        didResolutionMetadata: resolutionMetadata,
        didDocumentMetadata: {},
      };
    }
  }

  /**
   * Decode base58btc string to bytes
   *
   * Spec-compliant implementation that preserves leading zeros and correct byte order
   */
  private decodeBase58(encoded: string): Uint8Array {
    // Count leading '1's (represent leading zero bytes)
    let leadingZeros = 0;
    for (const char of encoded) {
      if (char === '1') {
        leadingZeros++;
      } else {
        break;
      }
    }

    // Decode the number in big-endian order
    const bytes: number[] = [];
    for (const char of encoded) {
      const index = this.BASE58_ALPHABET.indexOf(char);
      if (index === -1) {
        throw new Error(`Invalid base58 character: ${char}`);
      }

      let carry = index;
      // Process from right to left (little-endian in array)
      for (let i = 0; i < bytes.length; i++) {
        carry += bytes[i] * 58;
        bytes[i] = carry % 256;
        carry = Math.floor(carry / 256);
      }

      while (carry > 0) {
        bytes.push(carry % 256);
        carry = Math.floor(carry / 256);
      }
    }

    // Reverse to get big-endian order
    bytes.reverse();

    // Prepend leading zeros
    const result = new Uint8Array(leadingZeros + bytes.length);
    for (let i = 0; i < leadingZeros; i++) {
      result[i] = 0;
    }
    for (let i = 0; i < bytes.length; i++) {
      result[leadingZeros + i] = bytes[i];
    }

    return result;
  }

  /**
   * Parse multicodec prefix from varint-encoded data
   *
   * Supports 1-2 byte varints as used in multicodec
   */
  private parseMulticodec(data: Uint8Array): { codec: number; keyBytes: Uint8Array } {
    // Proper varint parsing (supports up to 2 bytes for common cases)
    let codec: number;
    let offset: number;

    if ((data[0] & 0x80) === 0) {
      // Single byte varint
      codec = data[0];
      offset = 1;
    } else if (data.length >= 2) {
      // Two byte varint
      // For multicodec 0xed01:
      // First byte: 0xed (11101101) - MSB set means continuation
      // Second byte: 0x01 (00000001) - MSB clear means end
      // The actual value is the two bytes combined as big-endian: 0xed01 = 60673
      codec = (data[0] << 8) | data[1];
      offset = 2;
    } else {
      throw new Error('Invalid multicodec prefix');
    }

    const keyBytes = data.slice(offset);
    return { codec, keyBytes };
  }

  /**
   * Generate DID document from parsed multicodec data
   */
  private generateDidDocument(
    did: string,
    codec: number,
    keyBytes: Uint8Array,
    multibaseString: string
  ): DIDDocument {
    // Key ID (fragment identifier for the verification method)
    const keyId = `${did}#${multibaseString}`;

    // Determine key type and verification relationships based on multicodec
    let keyType: string;
    let verificationRelationships: string[];

    switch (codec) {
      case this.MULTICODEC.ED25519_PUB:
        if (keyBytes.length !== 32) {
          throw new Error('Ed25519 public key must be 32 bytes');
        }
        keyType = 'Ed25519VerificationKey2020';
        verificationRelationships = [
          'authentication',
          'assertionMethod',
          'capabilityDelegation',
          'capabilityInvocation',
        ];
        break;

      case this.MULTICODEC.SECP256K1_PUB:
        if (keyBytes.length !== 33 && keyBytes.length !== 65) {
          throw new Error('secp256k1 public key must be 33 or 65 bytes (compressed or uncompressed)');
        }
        keyType = 'EcdsaSecp256k1VerificationKey2019';
        verificationRelationships = [
          'authentication',
          'assertionMethod',
          'capabilityDelegation',
          'capabilityInvocation',
        ];
        break;

      case this.MULTICODEC.X25519_PUB:
        if (keyBytes.length !== 32) {
          throw new Error('X25519 public key must be 32 bytes');
        }
        keyType = 'X25519KeyAgreementKey2020';
        verificationRelationships = ['keyAgreement'];
        break;

      case this.MULTICODEC.P256_PUB:
        keyType = 'JsonWebKey2020';
        verificationRelationships = ['authentication', 'assertionMethod'];
        break;

      case this.MULTICODEC.P384_PUB:
        keyType = 'JsonWebKey2020';
        verificationRelationships = ['authentication', 'assertionMethod'];
        break;

      default:
        throw new Error(`Unsupported multicodec: 0x${codec.toString(16)}`);
    }

    // Build verification method
    const verificationMethod = {
      id: keyId,
      type: keyType,
      controller: did,
      publicKeyMultibase: multibaseString,
    };

    // Build DID document
    const didDocument: DIDDocument = {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1',
        'https://w3id.org/security/suites/secp256k1-2019/v1',
        'https://w3id.org/security/suites/x25519-2020/v1',
        'https://w3id.org/security/suites/jws-2020/v1',
      ],
      id: did,
      verificationMethod: [verificationMethod],
      authentication: [],
      assertionMethod: [],
    };

    // Add key to appropriate verification relationships
    for (const relationship of verificationRelationships) {
      if (relationship === 'authentication') {
        didDocument.authentication.push(keyId);
      } else if (relationship === 'assertionMethod') {
        didDocument.assertionMethod.push(keyId);
      } else if (relationship === 'keyAgreement') {
        if (!didDocument.keyAgreement) didDocument.keyAgreement = [];
        didDocument.keyAgreement.push(keyId);
      } else if (relationship === 'capabilityInvocation') {
        if (!didDocument.capabilityInvocation) didDocument.capabilityInvocation = [];
        didDocument.capabilityInvocation.push(keyId);
      } else if (relationship === 'capabilityDelegation') {
        if (!didDocument.capabilityDelegation) didDocument.capabilityDelegation = [];
        didDocument.capabilityDelegation.push(keyId);
      }
    }

    return didDocument;
  }

  /**
   * Helper to create did:key from raw Ed25519 public key
   */
  static fromEd25519PublicKey(publicKeyBytes: Uint8Array): string {
    if (publicKeyBytes.length !== 32) {
      throw new Error('Ed25519 public key must be 32 bytes');
    }

    // Prepend Ed25519 multicodec prefix (0xed01)
    const prefixed = new Uint8Array(34);
    prefixed[0] = 0xed;
    prefixed[1] = 0x01;
    prefixed.set(publicKeyBytes, 2);

    // Encode with base58btc
    const encoded = DidKeyResolver.prototype.encodeBase58(prefixed);

    return `did:key:z${encoded}`;
  }

  /**
   * Encode bytes to base58btc
   */
  private encodeBase58(data: Uint8Array): string {
    const digits = [0];

    for (const byte of data) {
      let carry = byte;
      for (let i = 0; i < digits.length; i++) {
        carry += digits[i] << 8;
        digits[i] = carry % 58;
        carry = Math.floor(carry / 58);
      }

      while (carry > 0) {
        digits.push(carry % 58);
        carry = Math.floor(carry / 58);
      }
    }

    // Convert to base58 string (reverse order)
    return digits
      .reverse()
      .map((d) => this.BASE58_ALPHABET[d])
      .join('');
  }
}