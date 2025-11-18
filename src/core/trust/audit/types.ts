/**
 * Audit Log Types
 *
 * Cryptographically signed audit trail for trust operations
 */

/**
 * Audit event types
 */
export type AuditEventType =
  | 'TRUST_DECLARATION_CREATED'
  | 'TRUST_DECLARATION_UPDATED'
  | 'TRUST_SCORE_CALCULATED'
  | 'CREDENTIAL_ISSUED'
  | 'CREDENTIAL_VERIFIED'
  | 'CREDENTIAL_REVOKED'
  | 'CREDENTIAL_SUSPENDED'
  | 'DID_CREATED'
  | 'DID_UPDATED'
  | 'DID_RESOLVED'
  | 'KEY_CREATED'
  | 'KEY_ROTATED'
  | 'KEY_DISABLED'
  | 'AUTHENTICATION_SUCCESS'
  | 'AUTHENTICATION_FAILURE'
  | 'AUTHORIZATION_DENIED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'HUMAN_OVERSIGHT_ACTION'
  | 'REFUSAL_EVENT'
  | 'REFUSAL_NOTIFICATION';

/**
 * Audit event severity
 */
export type AuditSeverity = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

/**
 * Actor performing the action
 */
export interface AuditActor {
  id: string;
  type: 'USER' | 'AGENT' | 'SYSTEM' | 'SERVICE';
  did?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Target resource of the action
 */
export interface AuditTarget {
  type: string; // e.g., 'TrustDeclaration', 'VerifiableCredential', 'DID', 'Key'
  id: string;
  attributes?: Record<string, any>;
}

/**
 * Audit log entry (before signing)
 */
export interface AuditEntry {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  severity: AuditSeverity;
  actor: AuditActor;
  target?: AuditTarget;
  action: string;
  result: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  details?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Signed audit log entry
 */
export interface SignedAuditEntry extends AuditEntry {
  previousHash: string; // Hash of previous entry (blockchain-style)
  signature: string; // Cryptographic signature of this entry
  signedBy: string; // Key ID used for signing
  signedAt: Date;
}

/**
 * Audit log configuration
 */
export interface AuditConfig {
  enabled: boolean;
  signEntries: boolean;
  signingKeyId?: string;
  storageBackend: 'memory' | 'file' | 'database' | 'stream';
  storagePath?: string;
  retentionDays?: number;
  autoArchive?: boolean;
}

/**
 * Audit query filter
 */
export interface AuditQueryFilter {
  startTime?: Date;
  endTime?: Date;
  eventTypes?: AuditEventType[];
  actorIds?: string[];
  targetIds?: string[];
  severity?: AuditSeverity[];
  result?: ('SUCCESS' | 'FAILURE' | 'PARTIAL')[];
  limit?: number;
  offset?: number;
}

/**
 * Audit query result
 */
export interface AuditQueryResult {
  entries: SignedAuditEntry[];
  total: number;
  hasMore: boolean;
}

/**
 * Audit integrity check result
 */
export interface AuditIntegrityResult {
  valid: boolean;
  totalEntries: number;
  verifiedEntries: number;
  failedEntries: number;
  brokenChain: boolean;
  errors: Array<{
    entryId: string;
    error: string;
  }>;
}
