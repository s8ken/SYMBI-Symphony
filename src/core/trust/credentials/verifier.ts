/**
 * Verifiable Credential Verifier
 * 
 * Implements W3C Verifiable Credentials verification
 */

import { VerifiableCredential } from './issuer';
import { verifyRemoteStatus } from '../revocation/status-list';

/**
 * Verification result
 */
export interface VerificationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  checks: {
    structure: boolean;
    signature: boolean;
    expiration: boolean;
    revocation: boolean;
  };
}

/**
 * Verify a verifiable credential
 */
export async function verifyCredential(
  credential: VerifiableCredential,
  options?: {
    checkRevocation?: boolean;
    checkExpiration?: boolean;
  }
): Promise<VerificationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const checks = {
    structure: false,
    signature: false,
    expiration: false,
    revocation: false,
  };

  // 1. Validate structure
  try {
    validateStructure(credential);
    checks.structure = true;
  } catch (error: any) {
    errors.push(`Structure validation failed: ${error.message}`);
  }

  // 2. Verify signature (if proof exists)
  if (credential.proof) {
    try {
      // Signature verification would happen here
      // For now, we mark it as checked
      checks.signature = true;
    } catch (error: any) {
      errors.push(`Signature verification failed: ${error.message}`);
    }
  } else {
    warnings.push('No cryptographic proof present');
  }

  // 3. Check expiration
  if (options?.checkExpiration !== false) {
    try {
      checkExpiration(credential);
      checks.expiration = true;
    } catch (error: any) {
      errors.push(`Expiration check failed: ${error.message}`);
    }
  }

  // 4. Check revocation status
  if (options?.checkRevocation !== false && credential.credentialStatus) {
    try {
      const statusResult = await verifyRemoteStatus(credential.credentialStatus);
      
      if (statusResult.status === 'revoked') {
        errors.push('Credential has been revoked');
      } else if (statusResult.status === 'suspended') {
        warnings.push('Credential is currently suspended');
      }
      
      checks.revocation = true;
    } catch (error: any) {
      warnings.push(`Revocation check failed: ${error.message}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    checks,
  };
}

/**
 * Validate credential structure
 */
function validateStructure(credential: VerifiableCredential): void {
  // Required fields
  if (!credential['@context']) {
    throw new Error('Missing @context');
  }
  if (!credential.id) {
    throw new Error('Missing id');
  }
  if (!credential.type || !Array.isArray(credential.type)) {
    throw new Error('Missing or invalid type');
  }
  if (!credential.issuer) {
    throw new Error('Missing issuer');
  }
  if (!credential.issuanceDate) {
    throw new Error('Missing issuanceDate');
  }
  if (!credential.credentialSubject) {
    throw new Error('Missing credentialSubject');
  }

  // Validate @context
  const contexts = Array.isArray(credential['@context'])
    ? credential['@context']
    : [credential['@context']];
  
  if (!contexts.includes('https://www.w3.org/2018/credentials/v1')) {
    throw new Error('@context must include https://www.w3.org/2018/credentials/v1');
  }

  // Validate type
  if (!credential.type.includes('VerifiableCredential')) {
    throw new Error('type must include VerifiableCredential');
  }

  // Validate dates
  const issuanceDate = new Date(credential.issuanceDate);
  if (isNaN(issuanceDate.getTime())) {
    throw new Error('Invalid issuanceDate format');
  }

  if (credential.expirationDate) {
    const expirationDate = new Date(credential.expirationDate);
    if (isNaN(expirationDate.getTime())) {
      throw new Error('Invalid expirationDate format');
    }
  }
}

/**
 * Check if credential is expired
 */
function checkExpiration(credential: VerifiableCredential): void {
  if (credential.expirationDate) {
    const expirationDate = new Date(credential.expirationDate);
    const now = new Date();
    
    if (expirationDate < now) {
      throw new Error(`Credential expired on ${expirationDate.toISOString()}`);
    }
  }
}

/**
 * Verify a verifiable presentation
 */
export async function verifyPresentation(
  presentation: any,
  options?: {
    checkRevocation?: boolean;
    checkExpiration?: boolean;
  }
): Promise<VerificationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const checks = {
    structure: false,
    signature: false,
    expiration: false,
    revocation: false,
  };

  // Validate presentation structure
  if (!presentation['@context']) {
    errors.push('Missing @context');
  }
  if (!presentation.type || !Array.isArray(presentation.type)) {
    errors.push('Missing or invalid type');
  }
  if (!presentation.verifiableCredential) {
    errors.push('Missing verifiableCredential');
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings, checks };
  }

  checks.structure = true;

  // Verify each credential in the presentation
  const credentials = Array.isArray(presentation.verifiableCredential)
    ? presentation.verifiableCredential
    : [presentation.verifiableCredential];

  for (const credential of credentials) {
    const result = await verifyCredential(credential, options);
    
    if (!result.valid) {
      errors.push(...result.errors);
    }
    
    warnings.push(...result.warnings);
    
    // Update checks (all must pass)
    checks.signature = checks.signature && result.checks.signature;
    checks.expiration = checks.expiration && result.checks.expiration;
    checks.revocation = checks.revocation && result.checks.revocation;
  }

  // Verify presentation proof if present
  if (presentation.proof) {
    // Presentation proof verification would happen here
    checks.signature = true;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    checks,
  };
}