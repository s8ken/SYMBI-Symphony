/**
 * Enhanced Audit Logger with Pluggable Persistence
 * 
 * Extends the original AuditLogger to support pluggable persistence backends
 * for durable storage of cryptographically signed audit entries.
 */

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
import { AuditPersistence, AuditPersistenceFactory } from './persistence';

/**
 * Enhanced Audit Configuration
 */
export interface EnhancedAuditConfig extends AuditConfig {
  persistence?: {
    type: 'memory' | 'file' | 'database' | 'stream';
    config?: any;
  };
}

/**
 * Enhanced Audit Logger with Pluggable Persistence
 * 
 * Provides cryptographically signed, tamper-evident audit logging
 * with durable storage through pluggable persistence backends.
 */
export class EnhancedAuditLogger {
  private config: EnhancedAuditConfig;
  private kms?: KMSProvider;
  private persistence: AuditPersistence;
  private lastHash: string;

  constructor(config: EnhancedAuditConfig, kms?: KMSProvider) {
    this.config = config;
    this.kms = kms;
    this.lastHash = '0'.repeat(64); // Genesis hash

    // Initialize persistence backend
    const persistenceType = config.persistence?.type || 'memory';
    const persistenceConfig = config.persistence?.config || {};
    
    this.persistence = AuditPersistenceFactory.create(persistenceType, persistenceConfig);
    
    // Initialize last hash from existing entries
    this.initializeLastHash();
  }

  /**
   * Initialize last hash from existing entries
   */
  private async initializeLastHash(): Promise<void> {
    try {
      const count = await this.persistence.count();
      if (count > 0) {
        // Get the last entry to set the correct lastHash
        const lastEntries = await this.persistence.getRange(count - 1, 1);
        if (lastEntries.length > 0) {
          this.lastHash = lastEntries[0].signature;
        }
      }
    } catch (error) {
      // If persistence doesn't support count/range, start with genesis hash
      console.warn('Could not initialize last hash from persistence:', error);
    }
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

    // Store entry using persistence backend
    await this.persistence.store(signedEntry);

    // Update last hash
    this.lastHash = signedEntry.signature;

    return signedEntry;
  }

  /**
   * Log multiple entries in batch
   */
  async logBatch(entries: Array<{
    eventType: AuditEventType;
    severity: AuditSeverity;
    actor: AuditActor;
    action: string;
    result: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
    options?: {
      target?: AuditTarget;
      details?: Record<string, any>;
      metadata?: Record<string, any>;
    };
  }>): Promise<SignedAuditEntry[]> {
    if (!this.config.enabled) {
      throw new Error('Audit logging is disabled');
    }

    const signedEntries: SignedAuditEntry[] = [];

    for (const entryData of entries) {
      // Create entry
      const entry: AuditEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        eventType: entryData.eventType,
        severity: entryData.severity,
        actor: entryData.actor,
        target: entryData.options?.target,
        action: entryData.action,
        result: entryData.result,
        details: entryData.options?.details,
        metadata: entryData.options?.metadata,
      };

      // Sign entry
      const signedEntry = await this.signEntry(entry);
      signedEntries.push(signedEntry);

      // Update last hash for next entry
      this.lastHash = signedEntry.signature;
    }

    // Store all entries in batch
    await this.persistence.storeBatch(signedEntries);

    return signedEntries;
  }

  /**
   * Query audit log
   */
  async query(filter?: AuditQueryFilter): Promise<AuditQueryResult> {
    return await this.persistence.query(filter);
  }

  /**
   * Get total count of entries
   */
  async count(): Promise<number> {
    return await this.persistence.count();
  }

  /**
   * Verify integrity of audit log
   */
  async verifyIntegrity(): Promise<AuditIntegrityResult> {
    const persistenceResult = await this.persistence.verifyIntegrity();
    
    // Get all entries for signature verification
    const allEntries = await this.persistence.exportAll();
    
    const errors: Array<{ entryId: string; error: string }> = [
      ...persistenceResult.errors
    ];
    
    let verifiedEntries = 0;
    let failedEntries = 0;

    // Verify signatures
    for (const entry of allEntries) {
      try {
        const isValid = await this.verifySignature(entry);
        if (isValid) {
          verifiedEntries++;
        } else {
          failedEntries++;
          errors.push({
            entryId: entry.id,
            error: 'Invalid signature'
          });
        }
      } catch (error: any) {
        failedEntries++;
        errors.push({
          entryId: entry.id,
          error: `Signature verification failed: ${error.message}`
        });
      }
    }

    return {
      valid: errors.length === 0,
      totalEntries: allEntries.length,
      verifiedEntries,
      failedEntries,
      brokenChain: !persistenceResult.valid,
      errors
    };
  }

  /**
   * Get audit statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    entriesByType: Record<AuditEventType, number>;
    entriesBySeverity: Record<AuditSeverity, number>;
    successRate: number;
    recentEntries: SignedAuditEntry[];
  }> {
    const allEntries = await this.persistence.exportAll();
    
    const entriesByType: any = {};
    const entriesBySeverity: any = {};
    let successCount = 0;

    for (const entry of allEntries) {
      // By type
      entriesByType[entry.eventType] = (entriesByType[entry.eventType] || 0) + 1;

      // By severity
      entriesBySeverity[entry.severity] = (entriesBySeverity[entry.severity] || 0) + 1;

      // Success rate
      if (entry.result === 'SUCCESS') {
        successCount++;
      }
    }

    const successRate = allEntries.length > 0 ? successCount / allEntries.length : 0;
    const recentEntries = allEntries.slice(-10);

    return {
      totalEntries: allEntries.length,
      entriesByType,
      entriesBySeverity,
      successRate,
      recentEntries,
    };
  }

  /**
   * Export audit log
   */
  async exportLog(): Promise<SignedAuditEntry[]> {
    return await this.persistence.exportAll();
  }

  /**
   * Import audit log (with verification)
   */
  async importLog(entries: SignedAuditEntry[]): Promise<void> {
    // Import entries
    await this.persistence.importAll(entries);

    // Update last hash
    if (entries.length > 0) {
      this.lastHash = entries[entries.length - 1].signature;
    } else {
      this.lastHash = '0'.repeat(64);
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
   * Archive old entries (if supported by persistence backend)
   */
  async archiveOldEntries(beforeDate: Date): Promise<number> {
    // Get entries to archive
    const entriesToArchive = await this.query({
      endTime: beforeDate,
      limit: 10000 // Process in batches
    });

    if (entriesToArchive.entries.length === 0) {
      return 0;
    }

    // TODO: Implement archival logic based on persistence backend
    // For now, this is a placeholder
    console.log(`Would archive ${entriesToArchive.entries.length} entries before ${beforeDate}`);
    
    return entriesToArchive.entries.length;
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
  async clear(): Promise<void> {
    await this.persistence.clear();
    this.lastHash = '0'.repeat(64);
  }

  /**
   * Close and cleanup resources
   */
  async close(): Promise<void> {
    await this.persistence.close();
  }
}

/**
 * Global enhanced audit logger instance
 */
let globalEnhancedLogger: EnhancedAuditLogger | null = null;

/**
 * Initialize global enhanced audit logger
 */
export function initializeEnhancedAuditLogger(
  config: EnhancedAuditConfig, 
  kms?: KMSProvider
): EnhancedAuditLogger {
  globalEnhancedLogger = new EnhancedAuditLogger(config, kms);
  return globalEnhancedLogger;
}

/**
 * Get global enhanced audit logger
 */
export function getEnhancedAuditLogger(): EnhancedAuditLogger {
  if (!globalEnhancedLogger) {
    throw new Error('Enhanced audit logger not initialized');
  }
  return globalEnhancedLogger;
}

/**
 * Set global enhanced audit logger
 */
export function setEnhancedAuditLogger(logger: EnhancedAuditLogger): void {
  globalEnhancedLogger = logger;
}

/**
 * Helper function to log refusal events
 */
export async function logRefusalEvent(params: {
  actor: AuditActor;
  conversationId?: string;
  receiptId?: string;
  refusalType: import('./refusal-taxonomy').RefusalType;
  reasonSummary: string;
  rightsImpacted?: string[];
  notification?: {
    channel: import('./refusal-taxonomy').RefusalNotificationChannel;
    notifiedAt?: Date;
    receiptId?: string;
  };
  requestContext?: Record<string, any>;
}): Promise<SignedAuditEntry> {
  const logger = getEnhancedAuditLogger();
  
  const details: import('./refusal-taxonomy').RefusalEventDetails = {
    refusalType: params.refusalType,
    reasonSummary: params.reasonSummary,
    rightsImpacted: params.rightsImpacted,
    notification: params.notification ? {
      channel: params.notification.channel,
      notifiedAt: params.notification.notifiedAt || new Date(),
      receiptId: params.notification.receiptId,
    } : undefined,
    conversationId: params.conversationId,
    requestContext: params.requestContext,
  };

  return await logger.log(
    'REFUSAL_EVENT',
    'WARNING',
    params.actor,
    'REFUSE_REQUEST',
    'SUCCESS',
    {
      target: params.conversationId ? {
        type: 'Conversation',
        id: params.conversationId,
      } : undefined,
      details,
      metadata: {
        refusalType: params.refusalType,
        rightsImpacted: params.rightsImpacted,
        receiptId: params.receiptId,
      },
    }
  );
}

/**
 * Helper function to log human oversight actions
 */
export async function logHumanOversightAction(params: {
  actor: AuditActor;
  actionType: import('./oversight-taxonomy').OversightActionType;
  target: {
    type: string;
    id: string;
    description?: string;
  };
  rationale: string;
  impact: {
    level: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedSystems?: string[];
  };
  rightsImpacted?: string[];
  attachments?: Array<{
    type: string;
    reference: string;
    description?: string;
  }>;
  reviewedBy?: {
    id: string;
    role: string;
    credentials?: string[];
  };
}): Promise<SignedAuditEntry> {
  const logger = getEnhancedAuditLogger();
  
  const details: import('./oversight-taxonomy').OversightActionDetails = {
    actionType: params.actionType,
    target: params.target,
    rationale: params.rationale,
    impact: params.impact,
    rightsImpacted: params.rightsImpacted,
    attachments: params.attachments,
    reviewedBy: params.reviewedBy,
  };

  // Map impact level to severity
  const severityMap: Record<string, AuditSeverity> = {
    low: 'INFO',
    medium: 'WARNING',
    high: 'ERROR',
    critical: 'CRITICAL',
  };

  return await logger.log(
    'HUMAN_OVERSIGHT_ACTION',
    severityMap[params.impact.level],
    params.actor,
    `OVERSIGHT_${params.actionType.toUpperCase()}`,
    'SUCCESS',
    {
      target: {
        type: params.target.type,
        id: params.target.id,
        attributes: params.target.description ? { description: params.target.description } : undefined,
      },
      details,
      metadata: {
        actionType: params.actionType,
        impactLevel: params.impact.level,
        rightsImpacted: params.rightsImpacted,
      },
    }
  );
}

/**
 * Verify the integrity of the audit log
 * Convenience function that uses the global enhanced logger
 */
export async function verifyAuditIntegrity(): Promise<AuditIntegrityResult> {
  const logger = getEnhancedAuditLogger();
  return await logger.verifyIntegrity();
}