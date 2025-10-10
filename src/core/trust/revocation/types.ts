/**
 * W3C Status List 2021 Types
 *
 * Spec: https://www.w3.org/TR/vc-status-list/
 *
 * Status List 2021 is a privacy-preserving, space-efficient mechanism
 * for publishing the revocation or suspension status of Verifiable Credentials.
 */

/**
 * Status Purpose
 */
export type StatusPurpose = 'revocation' | 'suspension';

/**
 * Status List Credential Subject
 */
export interface StatusListCredentialSubject {
  id: string;
  type: 'StatusList2021';
  statusPurpose: StatusPurpose;
  encodedList: string; // Base64-encoded, GZIP-compressed bitstring
}

/**
 * Status List 2021 Credential
 */
export interface StatusList2021Credential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  credentialSubject: StatusListCredentialSubject;
  proof?: any;
}

/**
 * Credential Status Entry (embedded in VC)
 */
export interface StatusList2021Entry {
  id: string; // URL to status list credential + fragment
  type: 'StatusList2021Entry';
  statusPurpose: StatusPurpose;
  statusListIndex: string; // Position in bitstring
  statusListCredential: string; // URL to status list credential
}

/**
 * Status List Configuration
 */
export interface StatusListConfig {
  issuer: string;
  statusPurpose: StatusPurpose;
  length?: number; // Bitstring length (default: 131072 = 16KB compressed)
  baseUrl?: string; // Base URL for status list credentials
}

/**
 * Status Check Result
 */
export interface StatusCheckResult {
  credentialId: string;
  status: 'active' | 'revoked' | 'suspended';
  statusPurpose: StatusPurpose;
  checked: Date;
  statusListCredential: string;
  statusListIndex: number;
}

/**
 * Revocation Record
 */
export interface RevocationRecord {
  credentialId: string;
  statusListIndex: number;
  revokedAt: Date;
  revokedBy: string;
  reason?: string;
  statusListCredential: string;
}

/**
 * Status List Metadata
 */
export interface StatusListMetadata {
  id: string;
  issuer: string;
  statusPurpose: StatusPurpose;
  length: number;
  issued: Date;
  nextUpdate?: Date;
  totalRevoked?: number;
  totalSuspended?: number;
}
