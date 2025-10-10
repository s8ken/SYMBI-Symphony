/**
 * Trust Validator
 * Validates trust declarations and verifiable credentials
 */

import { TrustArticles, TrustDeclaration, VerifiableCredential } from '../agent/types';

export class TrustValidator {
  /**
   * Validate trust articles structure and values
   */
  validateTrustArticles(articles: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!articles || typeof articles !== 'object') {
      errors.push('Trust articles must be an object');
      return { valid: false, errors };
    }

    const requiredFields: (keyof TrustArticles)[] = [
      'inspection_mandate',
      'consent_architecture',
      'ethical_override',
      'continuous_validation',
      'right_to_disconnect',
      'moral_recognition'
    ];

    for (const field of requiredFields) {
      if (typeof articles[field] !== 'boolean') {
        errors.push(`${field} must be a boolean value`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate trust declaration structure
   */
  validateTrustDeclaration(declaration: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!declaration || typeof declaration !== 'object') {
      errors.push('Trust declaration must be an object');
      return { valid: false, errors };
    }

    // Required fields
    if (!declaration.agent_id || typeof declaration.agent_id !== 'string') {
      errors.push('agent_id is required and must be a string');
    }

    if (!declaration.agent_name || typeof declaration.agent_name !== 'string') {
      errors.push('agent_name is required and must be a string');
    }

    if (!declaration.trust_articles) {
      errors.push('trust_articles is required');
    } else {
      const articleValidation = this.validateTrustArticles(declaration.trust_articles);
      if (!articleValidation.valid) {
        errors.push(...articleValidation.errors);
      }
    }

    // Validate scores if present
    if (declaration.scores) {
      if (typeof declaration.scores.compliance_score !== 'number' ||
          declaration.scores.compliance_score < 0 ||
          declaration.scores.compliance_score > 1) {
        errors.push('compliance_score must be a number between 0 and 1');
      }

      if (typeof declaration.scores.guilt_score !== 'number' ||
          declaration.scores.guilt_score < 0 ||
          declaration.scores.guilt_score > 1) {
        errors.push('guilt_score must be a number between 0 and 1');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate DID format (simplified)
   */
  validateDID(did: string): { valid: boolean; error?: string } {
    if (!did || typeof did !== 'string') {
      return { valid: false, error: 'DID must be a non-empty string' };
    }

    // Basic DID format: did:method:identifier
    const didRegex = /^did:[a-z0-9]+:[a-zA-Z0-9._-]+$/;
    if (!didRegex.test(did)) {
      return {
        valid: false,
        error: 'DID must follow format: did:method:identifier'
      };
    }

    return { valid: true };
  }

  /**
   * Validate Verifiable Credential structure (simplified)
   */
  validateVerifiableCredential(vc: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!vc || typeof vc !== 'object') {
      errors.push('Verifiable Credential must be an object');
      return { valid: false, errors };
    }

    // Check required fields
    if (!Array.isArray(vc['@context']) || vc['@context'].length === 0) {
      errors.push('@context must be a non-empty array');
    }

    if (!Array.isArray(vc.type) || !vc.type.includes('VerifiableCredential')) {
      errors.push('type must be an array including "VerifiableCredential"');
    }

    if (!vc.issuer || typeof vc.issuer !== 'string') {
      errors.push('issuer is required and must be a string (DID)');
    }

    if (!vc.issuanceDate || typeof vc.issuanceDate !== 'string') {
      errors.push('issuanceDate is required and must be an ISO 8601 string');
    }

    if (!vc.credentialSubject || typeof vc.credentialSubject !== 'object') {
      errors.push('credentialSubject is required and must be an object');
    }

    if (!vc.proof || typeof vc.proof !== 'object') {
      errors.push('proof is required and must be an object');
    } else {
      if (!vc.proof.type || !vc.proof.proofValue) {
        errors.push('proof must contain type and proofValue');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Verify credential signature (placeholder - requires crypto implementation)
   */
  async verifyCredentialSignature(vc: VerifiableCredential): Promise<{ valid: boolean; error?: string }> {
    // TODO: Implement actual cryptographic verification
    // This would involve:
    // 1. Resolving the DID to get the public key
    // 2. Verifying the signature using the public key
    // 3. Checking the proof purpose and verification method

    // For now, return a placeholder
    return {
      valid: true,
      error: undefined
    };
  }

  /**
   * Check if a trust declaration is expired
   */
  isDeclarationExpired(declaration: TrustDeclaration, expiryDays: number = 365): boolean {
    const declarationDate = new Date(declaration.declaration_date);
    const now = new Date();
    const daysDiff = (now.getTime() - declarationDate.getTime()) / (1000 * 60 * 60 * 24);

    return daysDiff > expiryDays;
  }

  /**
   * Validate agent ID format
   */
  validateAgentId(agentId: string): { valid: boolean; error?: string } {
    if (!agentId || typeof agentId !== 'string') {
      return { valid: false, error: 'Agent ID must be a non-empty string' };
    }

    // Allow alphanumeric, hyphens, and underscores
    const agentIdRegex = /^[a-zA-Z0-9_-]+$/;
    if (!agentIdRegex.test(agentId)) {
      return {
        valid: false,
        error: 'Agent ID must contain only alphanumeric characters, hyphens, and underscores'
      };
    }

    if (agentId.length < 3 || agentId.length > 100) {
      return {
        valid: false,
        error: 'Agent ID must be between 3 and 100 characters'
      };
    }

    return { valid: true };
  }
}

// Export singleton instance
export const trustValidator = new TrustValidator();
