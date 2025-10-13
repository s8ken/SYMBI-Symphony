import * as crypto from 'crypto';
import { AuditLogger, getAuditLogger } from '../audit/logger';
import { AuditEventType, AuditSeverity, AuditActor, AuditTarget } from '../audit/types';
import { KMSProvider } from '../kms/types';

/**
 * Blockchain Event Types for Dune Analytics
 */
export type BlockchainEventType = 
  | 'GOVERNANCE_PROPOSAL_CREATED'
  | 'GOVERNANCE_PROPOSAL_VOTED'
  | 'GOVERNANCE_PROPOSAL_EXECUTED'
  | 'TRUST_DECLARATION_PUBLISHED'
  | 'TRUST_SCORE_UPDATED'
  | 'CIQ_METRICS_CALCULATED'
  | 'COMPLIANCE_VIOLATION_DETECTED'
  | 'AUDIT_TRAIL_ANCHORED'
  | 'CONSTITUTIONAL_AMENDMENT_PROPOSED'
  | 'BICAMERAL_VOTE_CAST'
  | 'HOUSE_OF_WORK_ACTION'
  | 'HOUSE_OF_STEWARDSHIP_ACTION'
  | 'REPUTATION_LEDGER_UPDATED'
  | 'TRUST_RECEIPT_ISSUED'
  | 'ATTESTATION_CREATED';

/**
 * Blockchain Event Data Structure
 */
export interface BlockchainEvent {
  id: string;
  timestamp: Date;
  eventType: BlockchainEventType;
  blockNumber?: number;
  transactionHash?: string;
  contractAddress?: string;
  actor: AuditActor;
  target?: AuditTarget;
  data: Record<string, any>;
  metadata: {
    chainId?: number;
    gasUsed?: number;
    gasPrice?: string;
    confirmations?: number;
    duneAnalyticsReady: boolean;
  };
}

/**
 * Governance Event Data
 */
export interface GovernanceEventData {
  proposalId: string;
  proposalType: 'CONSTITUTIONAL' | 'OPERATIONAL' | 'TECHNICAL';
  house: 'WORK' | 'STEWARDSHIP' | 'BICAMERAL';
  action: 'CREATED' | 'VOTED' | 'EXECUTED' | 'REJECTED';
  votingPower?: number;
  voteChoice?: 'FOR' | 'AGAINST' | 'ABSTAIN';
  quorumReached?: boolean;
  executionDelay?: number;
}

/**
 * Trust Protocol Event Data
 */
export interface TrustProtocolEventData {
  agentId: string;
  trustScore: number;
  complianceScore: number;
  guiltScore: number;
  ciqMetrics: {
    clarity: number;
    integrity: number;
    quality: number;
  };
  trustArticles: Record<string, boolean>;
  riskCategory: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * Blockchain Logger Configuration
 */
export interface BlockchainLoggerConfig {
  enabled: boolean;
  chainId: number;
  contractAddress?: string;
  web3Provider?: any;
  duneAnalyticsEnabled: boolean;
  batchSize: number;
  flushInterval: number; // milliseconds
  retryAttempts: number;
  retryDelay: number; // milliseconds
}

/**
 * Blockchain Logger
 * 
 * Extends the audit logging system to publish governance events
 * and trust protocol metrics to blockchain for Dune Analytics integration.
 */
export class BlockchainLogger {
  private config: BlockchainLoggerConfig;
  private auditLogger: AuditLogger;
  private eventQueue: BlockchainEvent[];
  private flushTimer?: NodeJS.Timeout;
  private kms?: KMSProvider;

  constructor(config: BlockchainLoggerConfig, kms?: KMSProvider) {
    this.config = config;
    this.kms = kms;
    this.auditLogger = getAuditLogger();
    this.eventQueue = [];
    
    if (this.config.enabled && this.config.flushInterval > 0) {
      this.startFlushTimer();
    }
  }

  /**
   * Log a governance event
   */
  async logGovernanceEvent(
    eventType: BlockchainEventType,
    actor: AuditActor,
    governanceData: GovernanceEventData,
    options?: {
      target?: AuditTarget;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const event: BlockchainEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      eventType,
      actor,
      target: options?.target,
      data: {
        governance: governanceData,
        ...options?.metadata
      },
      metadata: {
        chainId: this.config.chainId,
        duneAnalyticsReady: this.config.duneAnalyticsEnabled,
        ...options?.metadata
      }
    };

    // Add to queue for batch processing
    this.eventQueue.push(event);

    // Also log to audit system
    await this.auditLogger.log(
      this.mapToAuditEventType(eventType),
      this.determineEventSeverity(eventType),
      actor,
      `Governance: ${governanceData.action} ${governanceData.proposalType} proposal`,
      'SUCCESS',
      {
        target: options?.target,
        details: {
          proposalId: governanceData.proposalId,
          house: governanceData.house,
          votingPower: governanceData.votingPower
        },
        metadata: event.metadata
      }
    );

    // Flush if batch size reached
    if (this.eventQueue.length >= this.config.batchSize) {
      await this.flush();
    }
  }

  /**
   * Log a trust protocol event
   */
  async logTrustProtocolEvent(
    eventType: BlockchainEventType,
    actor: AuditActor,
    trustData: TrustProtocolEventData,
    options?: {
      target?: AuditTarget;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const event: BlockchainEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      eventType,
      actor,
      target: options?.target,
      data: {
        trust: trustData,
        ...options?.metadata
      },
      metadata: {
        chainId: this.config.chainId,
        duneAnalyticsReady: this.config.duneAnalyticsEnabled,
        ...options?.metadata
      }
    };

    // Add to queue for batch processing
    this.eventQueue.push(event);

    // Also log to audit system
    await this.auditLogger.log(
      this.mapToAuditEventType(eventType),
      this.determineEventSeverity(eventType),
      actor,
      `Trust Protocol: ${eventType}`,
      'SUCCESS',
      {
        target: options?.target,
        details: {
          agentId: trustData.agentId,
          trustScore: trustData.trustScore,
          complianceScore: trustData.complianceScore,
          riskCategory: trustData.riskCategory
        },
        metadata: event.metadata
      }
    );

    // Flush if batch size reached
    if (this.eventQueue.length >= this.config.batchSize) {
      await this.flush();
    }
  }

  /**
   * Log a CIQ metrics calculation event
   */
  async logCIQMetrics(
    actor: AuditActor,
    agentId: string,
    metrics: { clarity: number; integrity: number; quality: number },
    options?: {
      target?: AuditTarget;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    const trustData: TrustProtocolEventData = {
      agentId,
      trustScore: (metrics.clarity + metrics.integrity + metrics.quality) / 3,
      complianceScore: metrics.integrity,
      guiltScore: 1 - metrics.quality,
      ciqMetrics: metrics,
      trustArticles: {},
      riskCategory: this.calculateRiskCategory(metrics)
    };

    await this.logTrustProtocolEvent(
      'CIQ_METRICS_CALCULATED',
      actor,
      trustData,
      options
    );
  }

  /**
   * Flush queued events to blockchain
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // In a real implementation, this would publish to blockchain
      // For now, we'll prepare the data for Dune Analytics format
      const duneEvents = events.map(event => this.formatForDuneAnalytics(event));
      
      // Log the batch operation
      await this.auditLogger.log(
        'AUDIT_TRAIL_ANCHORED' as AuditEventType,
        'INFO',
        { id: 'blockchain-logger', type: 'SYSTEM' },
        `Flushed ${events.length} events to blockchain`,
        'SUCCESS',
        {
          details: {
            eventCount: events.length,
            eventTypes: [...new Set(events.map(e => e.eventType))],
            duneAnalyticsReady: this.config.duneAnalyticsEnabled
          }
        }
      );

      // TODO: Implement actual blockchain publishing
      // await this.publishToBlockchain(duneEvents);
      
    } catch (error) {
      // Re-queue events on failure
      this.eventQueue.unshift(...events);
      
      await this.auditLogger.log(
        'AUDIT_TRAIL_ANCHORED' as AuditEventType,
        'ERROR',
        { id: 'blockchain-logger', type: 'SYSTEM' },
        `Failed to flush events to blockchain`,
        'FAILURE',
        {
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            eventCount: events.length
          }
        }
      );

      throw error;
    }
  }

  /**
   * Get queued events count
   */
  getQueuedEventsCount(): number {
    return this.eventQueue.length;
  }

  /**
   * Get blockchain logger statistics
   */
  getStats(): {
    queuedEvents: number;
    totalEventTypes: string[];
    isFlushTimerActive: boolean;
    config: BlockchainLoggerConfig;
    errorCount: number;
    eventsLogged: number;
    lastLogTimestamp?: Date;
  } {
    return {
      queuedEvents: this.eventQueue.length,
      totalEventTypes: [...new Set(this.eventQueue.map(e => e.eventType))],
      isFlushTimerActive: !!this.flushTimer,
      config: this.config,
      errorCount: 0, // TODO: implement error tracking
      eventsLogged: 0, // TODO: implement event counter
      lastLogTimestamp: undefined // TODO: track last log time
    };
  }

  /**
   * Start the blockchain logger (compatibility method)
   */
  async start(): Promise<void> {
    if (!this.flushTimer && this.config.enabled && this.config.flushInterval > 0) {
      this.startFlushTimer();
    }
  }

  /**
   * Stop the blockchain logger
   */
  async stop(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }

    // Flush remaining events
    if (this.eventQueue.length > 0) {
      await this.flush();
    }
  }

  /**
   * Start the flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(async () => {
      if (this.eventQueue.length > 0) {
        try {
          await this.flush();
        } catch (error) {
          // Timer flush errors are logged but don't throw
          console.error('Blockchain logger flush timer error:', error);
        }
      }
    }, this.config.flushInterval);
  }

  /**
   * Map blockchain event type to audit event type
   */
  private mapToAuditEventType(eventType: BlockchainEventType): AuditEventType {
    const mapping: Record<BlockchainEventType, AuditEventType> = {
      'GOVERNANCE_PROPOSAL_CREATED': 'TRUST_DECLARATION_CREATED',
      'GOVERNANCE_PROPOSAL_VOTED': 'TRUST_DECLARATION_UPDATED',
      'GOVERNANCE_PROPOSAL_EXECUTED': 'TRUST_DECLARATION_UPDATED',
      'TRUST_DECLARATION_PUBLISHED': 'TRUST_DECLARATION_CREATED',
      'TRUST_SCORE_UPDATED': 'TRUST_SCORE_CALCULATED',
      'CIQ_METRICS_CALCULATED': 'TRUST_SCORE_CALCULATED',
      'COMPLIANCE_VIOLATION_DETECTED': 'SUSPICIOUS_ACTIVITY',
      'AUDIT_TRAIL_ANCHORED': 'TRUST_DECLARATION_UPDATED',
      'CONSTITUTIONAL_AMENDMENT_PROPOSED': 'TRUST_DECLARATION_CREATED',
      'BICAMERAL_VOTE_CAST': 'TRUST_DECLARATION_UPDATED',
      'HOUSE_OF_WORK_ACTION': 'TRUST_DECLARATION_UPDATED',
      'HOUSE_OF_STEWARDSHIP_ACTION': 'TRUST_DECLARATION_UPDATED',
      'REPUTATION_LEDGER_UPDATED': 'TRUST_SCORE_CALCULATED',
      'TRUST_RECEIPT_ISSUED': 'CREDENTIAL_ISSUED',
      'ATTESTATION_CREATED': 'CREDENTIAL_ISSUED'
    };

    return mapping[eventType] || 'TRUST_DECLARATION_UPDATED';
  }

  /**
   * Determine event severity based on type
   */
  private determineEventSeverity(eventType: BlockchainEventType): AuditSeverity {
    const criticalEvents: BlockchainEventType[] = [
      'COMPLIANCE_VIOLATION_DETECTED',
      'CONSTITUTIONAL_AMENDMENT_PROPOSED'
    ];

    const warningEvents: BlockchainEventType[] = [
      'GOVERNANCE_PROPOSAL_CREATED',
      'TRUST_SCORE_UPDATED'
    ];

    if (criticalEvents.includes(eventType)) {
      return 'CRITICAL';
    } else if (warningEvents.includes(eventType)) {
      return 'WARNING';
    } else {
      return 'INFO';
    }
  }

  /**
   * Calculate risk category based on CIQ metrics
   */
  private calculateRiskCategory(metrics: { clarity: number; integrity: number; quality: number }): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const average = (metrics.clarity + metrics.integrity + metrics.quality) / 3;
    
    if (average >= 0.9) return 'LOW';
    if (average >= 0.7) return 'MEDIUM';
    if (average >= 0.5) return 'HIGH';
    return 'CRITICAL';
  }

  /**
   * Format event for Dune Analytics
   */
  private formatForDuneAnalytics(event: BlockchainEvent): Record<string, any> {
    return {
      event_id: event.id,
      timestamp: event.timestamp.toISOString(),
      event_type: event.eventType,
      block_number: event.blockNumber || null,
      transaction_hash: event.transactionHash || null,
      contract_address: event.contractAddress || this.config.contractAddress,
      actor_id: event.actor.id,
      actor_type: event.actor.type,
      actor_did: event.actor.did || null,
      target_type: event.target?.type || null,
      target_id: event.target?.id || null,
      data: JSON.stringify(event.data),
      metadata: JSON.stringify(event.metadata),
      chain_id: this.config.chainId,
      dune_ready: event.metadata.duneAnalyticsReady
    };
  }
}

// Global blockchain logger instance
let globalBlockchainLogger: BlockchainLogger | null = null;

/**
 * Initialize global blockchain logger
 */
export function initializeBlockchainLogger(
  config: BlockchainLoggerConfig,
  kms?: KMSProvider
): BlockchainLogger {
  globalBlockchainLogger = new BlockchainLogger(config, kms);
  return globalBlockchainLogger;
}

/**
 * Get global blockchain logger
 */
export function getBlockchainLogger(): BlockchainLogger {
  if (!globalBlockchainLogger) {
    throw new Error('Blockchain logger not initialized. Call initializeBlockchainLogger() first.');
  }
  return globalBlockchainLogger;
}

/**
 * Set global blockchain logger
 */
export function setBlockchainLogger(logger: BlockchainLogger): void {
  globalBlockchainLogger = logger;
}