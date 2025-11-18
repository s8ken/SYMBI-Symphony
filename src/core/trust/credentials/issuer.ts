/**
 * Verifiable Credential Issuer
 * 
 * Implements W3C Verifiable Credentials Data Model 1.1
 * https://www.w3.org/TR/vc-data-model/
 */

import { canonicalizeJSON } from '../crypto';
import { KMSProvider } from '../kms/types';
import { DIDDocument } from '../types';

/**
 * Verifiable Credential structure
 */
export interface VerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string | { id: string; name?: string };
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: {
    id: string;
    [key: string]: any;
  };
  credentialStatus?: {
    id: string;
    type: string;
    statusPurpose?: string;
    statusListIndex?: string;
    statusListCredential?: string;
  };
  proof?: CredentialProof;
}

/**
 * Credential Proof structure
 */
export interface CredentialProof {
  type: string;
  created: string;
  verificationMethod: string;
  proofPurpose: string;
  proofValue: string;
}

/**
 * Credential Issuance Options
 */
export interface CredentialIssuanceOptions {
  id?: string;
  expirationDate?: Date;
  credentialStatus?: {
    statusListIndex: number;
    statusListCredential: string;
  };
  additionalContexts?: string[];
  additionalTypes?: string[];
}

/**
 * Verifiable Credential Issuer
 */
export class CredentialIssuer {
  private issuerDid: string;
  private kms?: KMSProvider;

  constructor(issuerDid: string, kms?: KMSProvider) {
    this.issuerDid = issuerDid;
    this.kms = kms;
  }

  /**
   * Issue a verifiable credential
   */
  async issue(
    subjectDid: string,
    claims: Record<string, any>,
    options?: CredentialIssuanceOptions
  ): Promise<VerifiableCredential> {
    // Generate credential ID
    const credentialId = options?.id || this.generateCredentialId();

    // Build credential
    const credential: VerifiableCredential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        ...(options?.additionalContexts || []),
      ],
      id: credentialId,
      type: ['VerifiableCredential', ...(options?.additionalTypes || [])],
      issuer: this.issuerDid,
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: subjectDid,
        ...claims,
      },
    };

    // Add expiration date if provided
    if (options?.expirationDate) {
      credential.expirationDate = options.expirationDate.toISOString();
    }

    // Add credential status if provided
    if (options?.credentialStatus) {
      credential.credentialStatus = {
        id: `${options.credentialStatus.statusListCredential}#${options.credentialStatus.statusListIndex}`,
        type: 'StatusList2021Entry',
        statusPurpose: 'revocation',
        statusListIndex: options.credentialStatus.statusListIndex.toString(),
        statusListCredential: options.credentialStatus.statusListCredential,
      };
    }

    // Sign credential if KMS is available
    if (this.kms) {
      const proof = await this.createProof(credential);
      credential.proof = proof;
    }

    return credential;
  }

  /**
   * Issue a trust declaration credential
   */
  async issueTrustDeclaration(
    agentDid: string,
    trustArticles: {
      inspection_mandate: boolean;
      consent_architecture: boolean;
      ethical_override: boolean;
      continuous_validation: boolean;
      right_to_disconnect: boolean;
      moral_recognition: boolean;
    },
    trustScore: number,
    options?: CredentialIssuanceOptions
  ): Promise<VerifiableCredential> {
    const claims = {
      trustArticles,
      trustScore,
      trustLevel: this.calculateTrustLevel(trustScore),
      evaluatedAt: new Date().toISOString(),
    };

    return this.issue(agentDid, claims, {
      ...options,
      additionalContexts: ['https://symbi.world/contexts/trust/v1'],
      additionalTypes: ['TrustDeclarationCredential'],
    });
  }

  /**
   * Create cryptographic proof for credential
   */
  private async createProof(credential: VerifiableCredential): Promise<CredentialProof> {
    if (!this.kms) {
      throw new Error('KMS provider required for signing');
    }

    // Canonicalize credential (without proof)
    const canonicalized = canonicalizeJSON(credential);

    // Sign with KMS
    const signature = await this.kms.sign(Buffer.from(canonicalized, 'utf-8'));

    // Create proof
    const proof: CredentialProof = {
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      verificationMethod: `${this.issuerDid}#key-1`,
      proofPurpose: 'assertionMethod',
      proofValue: signature.toString('base64'),
    };

    return proof;
  }

  /**
   * Generate unique credential ID
   */
  private generateCredentialId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `urn:uuid:${timestamp}-${random}`;
  }

  /**
   * Calculate trust level from score
   */
  private calculateTrustLevel(score: number): string {
    if (score >= 0.9) return 'verified';
    if (score >= 0.7) return 'high';
    if (score >= 0.5) return 'medium';
    if (score >= 0.3) return 'low';
    return 'untrusted';
  }

  /**
   * Verify a verifiable credential
   */
  async verify(credential: VerifiableCredential): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Validate required fields
    if (!credential['@context']) {
      errors.push('Missing @context');
    }
    if (!credential.id) {
      errors.push('Missing id');
    }
    if (!credential.type || !Array.isArray(credential.type)) {
      errors.push('Missing or invalid type');
    }
    if (!credential.issuer) {
      errors.push('Missing issuer');
    }
    if (!credential.issuanceDate) {
      errors.push('Missing issuanceDate');
    }
    if (!credential.credentialSubject) {
      errors.push('Missing credentialSubject');
    }

    // Validate @context includes required context
    if (credential['@context']) {
      const contexts = Array.isArray(credential['@context'])
        ? credential['@context']
        : [credential['@context']];
      
      if (!contexts.includes('https://www.w3.org/2018/credentials/v1')) {
        errors.push('@context must include https://www.w3.org/2018/credentials/v1');
      }
    }

    // Validate type includes VerifiableCredential
    if (credential.type && Array.isArray(credential.type)) {
      if (!credential.type.includes('VerifiableCredential')) {
        errors.push('type must include VerifiableCredential');
      }
    }

    // Validate dates
    if (credential.issuanceDate) {
      const issuanceDate = new Date(credential.issuanceDate);
      if (isNaN(issuanceDate.getTime())) {
        errors.push('Invalid issuanceDate format');
      }
    }

    if (credential.expirationDate) {
      const expirationDate = new Date(credential.expirationDate);
      if (isNaN(expirationDate.getTime())) {
        errors.push('Invalid expirationDate format');
      }

      // Check if expired
      if (expirationDate < new Date()) {
        errors.push('Credential has expired');
      }
    }

    // Verify proof if present and KMS available
    if (credential.proof && this.kms) {
      try {
        const proofValid = await this.verifyProof(credential);
        if (!proofValid) {
          errors.push('Invalid cryptographic proof');
        }
      } catch (error: any) {
        errors.push(`Proof verification failed: ${error.message}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Verify cryptographic proof
   */
  private async verifyProof(credential: VerifiableCredential): Promise<boolean> {
    if (!credential.proof || !this.kms) {
      return false;
    }

    // Extract proof
    const proof = credential.proof;
    const proofValue = Buffer.from(proof.proofValue, 'base64');

    // Create credential without proof for verification
    const credentialWithoutProof = { ...credential };
    delete credentialWithoutProof.proof;

    // Canonicalize
    const canonicalized = canonicalizeJSON(credentialWithoutProof);

    // Verify signature
    return this.kms.verify(
      Buffer.from(canonicalized, 'utf-8'),
      proofValue
    );
  }

  /**
   * Revoke a credential (update status list)
   */
  async revoke(credentialId: string): Promise<void> {
    // This would update the status list credential
    // Implementation depends on status list management
    throw new Error('Revocation requires status list management - see status-list.ts');
  }
}

/**
 * Helper function to create credential issuer
 */
export function createCredentialIssuer(
  issuerDid: string,
  kms?: KMSProvider
): CredentialIssuer {
  return new CredentialIssuer(issuerDid, kms);
}