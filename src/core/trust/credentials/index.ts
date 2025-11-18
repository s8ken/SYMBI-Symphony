/**
 * Verifiable Credentials Module
 * 
 * Exports credential issuance and verification functionality
 */

export {
  CredentialIssuer,
  createCredentialIssuer,
  VerifiableCredential,
  CredentialProof,
  CredentialIssuanceOptions,
} from './issuer';

export {
  verifyCredential,
  verifyPresentation,
} from './verifier';