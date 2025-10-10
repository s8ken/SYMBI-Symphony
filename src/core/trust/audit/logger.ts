import * as crypto from 'crypto';
import {
  AuditEntry,
  SignedAuditEntry,
  AuditConfig,
  AuditEventType,
  AuditSeverity,
  AuditActor,
  AuditTarget,
  AuditQueryFilter,
  AuditQueryResult,
  AuditIntegrityResult,
} from './types';
import { KMSProvider } from '../kms/types';
import { canonicalizeJSON } from '../crypto';

/**
 * Audit Logger
 *
 * Provides cryptographically signed, tamper-evident audit logging
 * for all trust protocol operations.
 *
 * Features:
 * - Cryptographic signatures on each entry
 * - Blockchain-style chaining (previous hash)
 * - Integrity verification
 * - Queryable audit trail
 * - Multiple storage backends
 */
export class AuditLogger {
  private config: AuditConfig;
  private kms?: KMSProvider;
  private entries: SignedAuditEntry[];
  private lastHash: string;

  constructor(config: AuditConfig, kms?: KMSProvider) {
    this.config = config;
    this.kms = kms;
    this.entries = [];
    this.lastHash = '0'.repeat(64); // Genesis hash
  }

  /**
   * Log an audit entry
   */
  async log(
    eventType: AuditEventType,
    severity: AuditSeverity,
    actor: AuditActor,
    action: string,
    result: 'SUCCESS' | 'FAILURE' | 'PARTIAL',
    options?: {
      target?: AuditTarget;
      details?: Record<string, any>;
      metadata?: Record<string, any>;
    }
  ): Promise<SignedAuditEntry> {
    if (!this.config.enabled) {
      throw new Error('Audit logging is disabled');
    }

    // Create entry
    const entry: AuditEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      eventType,
      severity,
      actor,
      target: options?.target,
      action,
      result,
      details: options?.details,
      metadata: options?.metadata,
    };

    // Sign entry
    const signedEntry = await this.signEntry(entry);

    // Store entry
    this.entries.push(signedEntry);

    // Update last hash
    this.lastHash = signedEntry.signature;

    return signedEntry;
  }

  /**
   * Query audit log
   */
  async query(filter?: AuditQueryFilter): Promise<AuditQueryResult> {
    let filtered = [...this.entries];

    // Apply filters
    if (filter?.startTime) {
      filtered = filtered.filter((e) => e.timestamp >= filter.startTime!);
    }
    if (filter?.endTime) {
      filtered = filtered.filter((e) => e.timestamp <= filter.endTime!);
    }
    if (filter?.eventTypes) {
      filtered = filtered.filter((e) => filter.eventTypes!.includes(e.eventType));
    }
    if (filter?.actorIds) {
      filtered = filtered.filter((e) => filter.actorIds!.includes(e.actor.id));
    }
    if (filter?.targetIds && filter.targetIds.length > 0) {
      filtered = filtered.filter((e) => e.target && filter.targetIds!.includes(e.target.id));
    }
    if (filter?.severity) {
      filtered = filtered.filter((e) => filter.severity!.includes(e.severity));
    }
    if (filter?.result) {
      filtered = filtered.filter((e) => filter.result!.includes(e.result));
    }

    // Pagination
    const total = filtered.length;
    const offset = filter?.offset || 0;
    const limit = filter?.limit || 100;
    const entries = filtered.slice(offset, offset + limit);
    const hasMore = offset + entries.length < total;

    return {
      entries,
      total,
      hasMore,
    };
  }

  /**
   * Verify integrity of audit log
   */
  async verifyIntegrity(): Promise<AuditIntegrityResult> {
    const result: AuditIntegrityResult = {
      valid: true,
      totalEntries: this.entries.length,
      verifiedEntries: 0,
      failedEntries: 0,
      brokenChain: false,
      errors: [],
    };

    if (this.entries.length === 0) {
      return result;
    }

    let previousHash = '0'.repeat(64); // Genesis hash

    for (const entry of this.entries) {
      // Verify hash chain
      if (entry.previousHash !== previousHash) {
        result.valid = false;
        result.brokenChain = true;
        result.errors.push({
          entryId: entry.id,
          error: `Hash chain broken: expected ${previousHash}, got ${entry.previousHash}`,
        });
        result.failedEntries++;
        continue;
      }

      // Verify signature
      try {
        const verified = await this.verifySignature(entry);
        if (verified) {
          result.verifiedEntries++;
          previousHash = entry.signature;
        } else {
          result.valid = false;
          result.failedEntries++;
          result.errors.push({
            entryId: entry.id,
            error: 'Signature verification failed',
          });
        }
      } catch (error: any) {
        result.valid = false;
        result.failedEntries++;
        result.errors.push({
          entryId: entry.id,
          error: `Signature verification error: ${error.message}`,
        });
      }
    }

    return result;
  }

  /**
   * Get audit statistics
   */
  getStats(): {
    totalEntries: number;
    entriesByType: Record<AuditEventType, number>;
    entriesBySeverity: Record<AuditSeverity, number>;
    successRate: number;
    recentEntries: SignedAuditEntry[];
  } {
    const entriesByType: any = {};
    const entriesBySeverity: any = {};
    let successCount = 0;

    for (const entry of this.entries) {
      // By type
      entriesByType[entry.eventType] = (entriesByType[entry.eventType] || 0) + 1;

      // By severity
      entriesBySeverity[entry.severity] = (entriesBySeverity[entry.severity] || 0) + 1;

      // Success rate
      if (entry.result === 'SUCCESS') {
        successCount++;
      }
    }

    const successRate = this.entries.length > 0 ? successCount / this.entries.length : 0;
    const recentEntries = this.entries.slice(-10);

    return {
      totalEntries: this.entries.length,
      entriesByType,
      entriesBySeverity,
      successRate,
      recentEntries,
    };
  }

  /**
   * Export audit log
   */
  exportLog(): SignedAuditEntry[] {
    return [...this.entries];
  }

  /**
   * Import audit log (with verification)
   */
  async importLog(entries: SignedAuditEntry[]): Promise<void> {
    // Clear existing entries
    this.entries = [];
    this.lastHash = '0'.repeat(64);

    // Add entries
    for (const entry of entries) {
      this.entries.push(entry);
      this.lastHash = entry.signature;
    }

    // Verify integrity
    const integrity = await this.verifyIntegrity();
    if (!integrity.valid) {
      throw new Error(
        `Imported audit log failed integrity check: ${integrity.errors.length} errors`
      );
    }
  }

  /**
   * Sign an audit entry
   */
  private async signEntry(entry: AuditEntry): Promise<SignedAuditEntry> {
    const signedEntry: SignedAuditEntry = {
      ...entry,
      previousHash: this.lastHash,
      signature: '',
      signedBy: '',
      signedAt: new Date(),
    };

    if (this.config.signEntries && this.kms && this.config.signingKeyId) {
      // Canonicalize entry for signing
      const canonical = canonicalizeJSON({
        id: signedEntry.id,
        timestamp: signedEntry.timestamp.toISOString(),
        eventType: signedEntry.eventType,
        severity: signedEntry.severity,
        actor: signedEntry.actor,
        target: signedEntry.target,
        action: signedEntry.action,
        result: signedEntry.result,
        details: signedEntry.details,
        metadata: signedEntry.metadata,
        previousHash: signedEntry.previousHash,
      });

      // Sign with KMS
      const signature = await this.kms.sign(
        this.config.signingKeyId,
        Buffer.from(canonical, 'utf8')
      );

      signedEntry.signature = signature.toString('base64');
      signedEntry.signedBy = this.config.signingKeyId;
    } else {
      // Hash-only mode (no cryptographic signature)
      const hash = crypto.createHash('sha256');
      hash.update(JSON.stringify(signedEntry));
      hash.update(this.lastHash);
      signedEntry.signature = hash.digest('hex');
      signedEntry.signedBy = 'hash-only';
    }

    return signedEntry;
  }

  /**
   * Verify signature of an audit entry
   */
  private async verifySignature(entry: SignedAuditEntry): Promise<boolean> {
    if (entry.signedBy === 'hash-only') {
      // Hash verification
      const testEntry = { ...entry };
      delete (testEntry as any).signature;

      const hash = crypto.createHash('sha256');
      hash.update(JSON.stringify(testEntry));
      hash.update(entry.previousHash);
      const computed = hash.digest('hex');

      return computed === entry.signature;
    }

    if (!this.kms) {
      throw new Error('KMS not available for signature verification');
    }

    // Canonicalize entry
    const canonical = canonicalizeJSON({
      id: entry.id,
      timestamp: entry.timestamp instanceof Date ? entry.timestamp.toISOString() : entry.timestamp,
      eventType: entry.eventType,
      severity: entry.severity,
      actor: entry.actor,
      target: entry.target,
      action: entry.action,
      result: entry.result,
      details: entry.details,
      metadata: entry.metadata,
      previousHash: entry.previousHash,
    });

    // Verify with KMS
    const signature = Buffer.from(entry.signature, 'base64');
    return await this.kms.verify(entry.signedBy, Buffer.from(canonical, 'utf8'), signature);
  }

  /**
   * Clear audit log (dangerous!)
   */
  clear(): void {
    this.entries = [];
    this.lastHash = '0'.repeat(64);
  }
}

/**
 * Global audit logger instance
 */
let globalLogger: AuditLogger | null = null;

/**
 * Initialize global audit logger
 */
export function initializeAuditLogger(config: AuditConfig, kms?: KMSProvider): AuditLogger {
  globalLogger = new AuditLogger(config, kms);
  return globalLogger;
}

/**
 * Get global audit logger
 */
export function getAuditLogger(): AuditLogger {
  if (!globalLogger) {
    throw new Error('Audit logger not initialized');
  }
  return globalLogger;
}

/**
 * Set global audit logger
 */
export function setAuditLogger(logger: AuditLogger): void {
  globalLogger = logger;
}
