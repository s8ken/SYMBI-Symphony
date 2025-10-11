import { EventEmitter } from 'events';
import { BlockchainLogger, BlockchainLoggerConfig, initializeBlockchainLogger } from './blockchain-logger';
import { HybridDataPipeline, DataPipelineConfig, initializeDataPipeline } from './data-pipeline';
import { RealTimeStreamer, StreamConfig, initializeRealTimeStreamer } from './real-time-streamer';
import { AdvancedAnalytics, AnalyticsConfig, initializeAdvancedAnalytics } from './advanced-analytics';
import { AuditLogger } from '../audit/logger';
import { AuditActor, AuditTarget } from '../audit/types';
import { KMSProvider } from '../kms/types';

/**
 * Integration Status
 */
export type IntegrationStatus = 'INITIALIZING' | 'RUNNING' | 'PAUSED' | 'ERROR' | 'STOPPED';

/**
 * Integration Configuration
 */
export interface IntegrationConfig {
  enabled: boolean;
  blockchainLogger: BlockchainLoggerConfig;
  dataPipeline: DataPipelineConfig;
  realTimeStreaming: StreamConfig;
  analytics: AnalyticsConfig;
  kmsProvider?: KMSProvider;
}

/**
 * Integration Manager
 * 
 * Orchestrates all blockchain data logging components for seamless
 * integration with Dune Analytics dashboards.
 */
export class IntegrationManager extends EventEmitter {
  private config: IntegrationConfig;
  private auditLogger: AuditLogger;
  private blockchainLogger?: BlockchainLogger;
  private dataPipeline?: HybridDataPipeline;
  private realTimeStreamer?: RealTimeStreamer;
  private analytics?: AdvancedAnalytics;
  private status: IntegrationStatus;
  private startTime?: Date;

  constructor(config: IntegrationConfig, auditLogger: AuditLogger) {
    super();
    this.config = config;
    this.auditLogger = auditLogger;
    this.status = 'STOPPED';
  }

  /**
   * Initialize and start the integration
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      throw new Error('Integration is disabled in configuration');
    }

    try {
      this.status = 'INITIALIZING';
      this.startTime = new Date();
      
      // Log integration start
      await this.auditLogger.log(
        'TRUST_DECLARATION_CREATED',
        'INFO',
        { id: 'integration-manager', type: 'SYSTEM' },
        'INTEGRATION_START',
        'SUCCESS',
        {
          target: { id: 'dune-analytics', type: 'EXTERNAL_SYSTEM' },
          details: { config: this.config }
        }
      );

      // Initialize components in order
      await this.initializeBlockchainLogger();
      await this.initializeDataPipeline();
      await this.initializeRealTimeStreamer();
      await this.initializeAnalytics();

      this.status = 'RUNNING';

      this.emit('INTEGRATION_STARTED', {
        timestamp: new Date(),
        components: this.getComponentStatus()
      });

    } catch (error) {
      this.status = 'ERROR';
      
      await this.auditLogger.log(
        'AUTHENTICATION_FAILURE',
        'ERROR',
        { id: 'integration-manager', type: 'SYSTEM' },
        'INTEGRATION_START',
        'FAILURE',
        {
          target: { id: 'dune-analytics', type: 'EXTERNAL_SYSTEM' },
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      );

      this.emit('INTEGRATION_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });

      throw error;
    }
  }

  /**
   * Stop the integration
   */
  async stop(): Promise<void> {
    try {
      this.status = 'STOPPED';

      // Stop components in reverse order
      if (this.analytics) {
        await this.analytics.stop();
      }
      if (this.realTimeStreamer) {
        await this.realTimeStreamer.stop();
      }
      if (this.dataPipeline) {
        await this.dataPipeline.stop();
      }

      this.emit('INTEGRATION_STOPPED', {
        timestamp: new Date(),
        uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0
      });

      await this.auditLogger.log(
        'TRUST_DECLARATION_UPDATED',
        'INFO',
        { id: 'integration-manager', type: 'SYSTEM' },
        'INTEGRATION_STOP',
        'SUCCESS',
        {
          target: { id: 'dune-analytics', type: 'EXTERNAL_SYSTEM' },
          details: { uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0 }
        }
      );

    } catch (error) {
      await this.auditLogger.log(
        'AUTHENTICATION_FAILURE',
        'ERROR',
        { id: 'integration-manager', type: 'SYSTEM' },
        'INTEGRATION_STOP',
        'FAILURE',
        {
          target: { id: 'dune-analytics', type: 'EXTERNAL_SYSTEM' },
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      );

      throw error;
    }
  }

  /**
   * Log a governance event through the integration
   */
  async logGovernanceEvent(
    eventType: string,
    actor: AuditActor,
    data: Record<string, any>,
    options?: {
      target?: AuditTarget;
      priority?: 'HIGH' | 'NORMAL' | 'LOW';
      streamRealTime?: boolean;
    }
  ): Promise<void> {
    if (this.status !== 'RUNNING') {
      throw new Error('Integration is not running');
    }

    try {
      // Log to blockchain
      if (this.blockchainLogger) {
        await this.blockchainLogger.logGovernanceEvent(
          eventType as any,
          actor,
          {
            proposalId: data.proposalId || '',
            proposalType: data.proposalType || 'OPERATIONAL',
            house: data.house || 'BICAMERAL',
            action: data.action || 'CREATED',
            votingPower: data.votingPower,
            voteChoice: data.voteChoice,
            quorumReached: data.quorumReached,
            executionDelay: data.executionDelay
          },
          options
        );
      }

      // Ingest to data pipeline
      if (this.dataPipeline) {
        await this.dataPipeline.ingestGovernanceEvent(
          actor,
          {
            proposalId: data.proposalId || '',
            proposalType: data.proposalType || 'OPERATIONAL',
            house: data.house || 'BICAMERAL',
            action: data.action || 'CREATED',
            votingPower: data.votingPower,
            voteChoice: data.voteChoice,
            quorumReached: data.quorumReached,
            executionDelay: data.executionDelay
          },
          options
        );
      }

      // Stream in real-time if requested
      if (options?.streamRealTime && this.realTimeStreamer) {
        await this.realTimeStreamer.streamGovernanceEvent(actor, eventType, data, options);
      }

    } catch (error) {
      this.emit('EVENT_PROCESSING_ERROR', {
        eventType,
        actor,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });

      throw error;
    }
  }

  /**
   * Log a trust protocol event through the integration
   */
  async logTrustProtocolEvent(
    eventType: string,
    actor: AuditActor,
    data: Record<string, any>,
    options?: {
      target?: AuditTarget;
      priority?: 'HIGH' | 'NORMAL' | 'LOW';
      streamRealTime?: boolean;
    }
  ): Promise<void> {
    if (this.status !== 'RUNNING') {
      throw new Error('Integration is not running');
    }

    try {
      // Log to blockchain
      if (this.blockchainLogger) {
        await this.blockchainLogger.logTrustProtocolEvent(
          eventType as any,
          actor,
          {
            agentId: data.agentId || '',
            trustScore: data.trustScore || 0,
            complianceScore: data.complianceScore || 0,
            guiltScore: data.guiltScore || 0,
            ciqMetrics: data.ciqMetrics || { clarity: 0, integrity: 0, quality: 0 },
            trustArticles: data.trustArticles || {},
            riskCategory: data.riskCategory || 'LOW'
          },
          options
        );
      }

      // Ingest to data pipeline
      if (this.dataPipeline) {
        await this.dataPipeline.ingestTrustProtocolEvent(
          actor,
          {
            agentId: data.agentId || '',
            trustScore: data.trustScore || 0,
            complianceScore: data.complianceScore || 0,
            guiltScore: data.guiltScore || 0,
            ciqMetrics: data.ciqMetrics || { clarity: 0, integrity: 0, quality: 0 },
            trustArticles: data.trustArticles || {},
            riskCategory: data.riskCategory || 'LOW'
          },
          options
        );
      }

      // Stream in real-time if requested
      if (options?.streamRealTime && this.realTimeStreamer) {
        await this.realTimeStreamer.streamTrustProtocolEvent(actor, eventType, data, options);
      }

    } catch (error) {
      this.emit('EVENT_PROCESSING_ERROR', {
        eventType,
        actor,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });

      throw error;
    }
  }

  /**
   * Get integration status
   */
  getStatus(): IntegrationStatus {
    return this.status;
  }

  /**
   * Get basic statistics
   */
  getStats(): {
    status: IntegrationStatus;
    uptime: number;
    components: Record<string, string>;
  } {
    return {
      status: this.status,
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
      components: this.getComponentStatus()
    };
  }

  /**
   * Initialize blockchain logger
   */
  private async initializeBlockchainLogger(): Promise<void> {
    this.blockchainLogger = initializeBlockchainLogger(
      this.config.blockchainLogger,
      this.config.kmsProvider
    );
  }

  /**
   * Initialize data pipeline
   */
  private async initializeDataPipeline(): Promise<void> {
    if (!this.blockchainLogger) {
      throw new Error('Blockchain logger must be initialized first');
    }
    
    this.dataPipeline = initializeDataPipeline(
      this.config.dataPipeline,
      this.blockchainLogger
    );
  }

  /**
   * Initialize real-time streamer
   */
  private async initializeRealTimeStreamer(): Promise<void> {
    if (!this.dataPipeline || !this.blockchainLogger) {
      throw new Error('Data pipeline and blockchain logger must be initialized first');
    }

    if (this.config.realTimeStreaming.enabled) {
      this.realTimeStreamer = initializeRealTimeStreamer(
        this.config.realTimeStreaming,
        this.dataPipeline,
        this.blockchainLogger
      );
    }
  }

  /**
   * Initialize analytics
   */
  private async initializeAnalytics(): Promise<void> {
    if (!this.dataPipeline || !this.blockchainLogger) {
      throw new Error('Data pipeline and blockchain logger must be initialized first');
    }

    if (this.config.analytics.enabled) {
      this.analytics = initializeAdvancedAnalytics(
        this.config.analytics,
        this.dataPipeline,
        this.blockchainLogger
      );
    }
  }

  /**
   * Get component status summary
   */
  private getComponentStatus(): Record<string, string> {
    return {
      blockchainLogger: this.blockchainLogger ? 'ACTIVE' : 'INACTIVE',
      dataPipeline: this.dataPipeline ? 'ACTIVE' : 'INACTIVE',
      realTimeStreamer: this.realTimeStreamer ? 'ACTIVE' : 'INACTIVE',
      analytics: this.analytics ? 'ACTIVE' : 'INACTIVE'
    };
  }
}

// Global integration manager instance
let globalIntegrationManager: IntegrationManager | null = null;

/**
 * Initialize global integration manager
 */
export function initializeIntegrationManager(
  config: IntegrationConfig,
  auditLogger: AuditLogger
): IntegrationManager {
  globalIntegrationManager = new IntegrationManager(config, auditLogger);
  return globalIntegrationManager;
}

/**
 * Get global integration manager
 */
export function getIntegrationManager(): IntegrationManager {
  if (!globalIntegrationManager) {
    throw new Error('Integration manager not initialized. Call initializeIntegrationManager() first.');
  }
  return globalIntegrationManager;
}

/**
 * Set global integration manager
 */
export function setIntegrationManager(manager: IntegrationManager): void {
  globalIntegrationManager = manager;
}