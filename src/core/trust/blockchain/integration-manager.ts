import { EventEmitter } from 'events';
import { BlockchainLogger, BlockchainLoggerConfig, initializeBlockchainLogger } from './blockchain-logger';
import { HybridDataPipeline, DataPipelineConfig, initializeDataPipeline } from './data-pipeline';
import { RealTimeStreamer, StreamConfig, initializeRealTimeStreamer } from './real-time-streamer';
import { AdvancedAnalytics, AnalyticsConfig, initializeAdvancedAnalytics } from './advanced-analytics';
import { AuditLogger } from '../audit/logger';
import { AuditActor, AuditTarget, AuditEventType } from '../audit/types';
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
  monitoring: {
    enabled: boolean;
    healthCheckInterval: number; // milliseconds
    alertThresholds: {
      errorRate: number; // percentage
      latency: number; // milliseconds
      bufferUtilization: number; // percentage
    };
  };
}

/**
 * Integration Statistics
 */
export interface IntegrationStats {
  status: IntegrationStatus;
  uptime: number; // milliseconds
  totalEventsProcessed: number;
  eventsPerSecond: number;
  errorCount: number;
  lastEventTimestamp?: Date;
  components: {
    blockchainLogger: {
      status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
      eventsLogged: number;
      lastLogTimestamp?: Date;
    };
    dataPipeline: {
      status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
      recordsProcessed: number;
      bufferUtilization: number;
    };
    realTimeStreamer: {
      status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
      messagesStreamed: number;
      connectionUptime: number;
    };
    analytics: {
      status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
      anomaliesDetected: number;
      predictionsGenerated: number;
    };
  };
}

/**
 * Health Check Result
 */
export interface HealthCheckResult {
  healthy: boolean;
  timestamp: Date;
  components: {
    blockchainLogger: { healthy: boolean; message?: string };
    dataPipeline: { healthy: boolean; message?: string };
    realTimeStreamer: { healthy: boolean; message?: string };
    analytics: { healthy: boolean; message?: string };
  };
  overallMessage?: string;
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
  private healthCheckTimer?: NodeJS.Timeout;
  private stats: IntegrationStats;

  constructor(config: IntegrationConfig, auditLogger: AuditLogger) {
    super();
    this.config = config;
    this.auditLogger = auditLogger;
    this.status = 'STOPPED';
    this.stats = {
      status: 'STOPPED',
      uptime: 0,
      totalEventsProcessed: 0,
      eventsPerSecond: 0,
      errorCount: 0,
      components: {
        blockchainLogger: { status: 'INACTIVE', eventsLogged: 0 },
        dataPipeline: { status: 'INACTIVE', recordsProcessed: 0, bufferUtilization: 0 },
        realTimeStreamer: { status: 'INACTIVE', messagesStreamed: 0, connectionUptime: 0 },
        analytics: { status: 'INACTIVE', anomaliesDetected: 0, predictionsGenerated: 0 }
      }
    };
  }

  /**
   * Initialize and start the integration
   */
  async start(): Promise<void> {
    if (this.status === 'RUNNING') {
      return;
    }

    try {
      this.status = 'INITIALIZING';
      this.startTime = new Date();
      this.stats.status = 'INITIALIZING';

      // Initialize components
      await this.initializeBlockchainLogger();
      await this.initializeDataPipeline();
      await this.initializeRealTimeStreamer();
      await this.initializeAnalytics();

      // Start health monitoring
      this.startHealthMonitoring();

      this.status = 'RUNNING';
      this.stats.status = 'RUNNING';
      this.updateComponentStatus();

      this.emit('INTEGRATION_STARTED', {
        timestamp: new Date(),
        components: this.getComponentStatus()
      });

      await this.auditLogger.log(
        'SUSPICIOUS_ACTIVITY',
        'INFO',
        { id: 'integration-manager', type: 'SYSTEM' },
        'INTEGRATION_START',
        'SUCCESS',
        {
          target: { id: 'dune-analytics', type: 'EXTERNAL_SYSTEM' },
          metadata: { startTime: this.startTime }
        }
      );

    } catch (error) {
      this.status = 'ERROR';
      this.stats.status = 'ERROR';
      this.stats.errorCount++;

      await this.auditLogger.log(
        'SUSPICIOUS_ACTIVITY',
        'ERROR',
        { id: 'integration-manager', type: 'SYSTEM' },
        'INTEGRATION_START',
        'FAILURE',
        {
          target: { id: 'dune-analytics', type: 'EXTERNAL_SYSTEM' },
          metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      );

      this.emit('INTEGRATION_ERROR', {
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }

  /**
   * Stop the integration
   */
  async stop(): Promise<void> {
    if (this.status === 'STOPPED') {
      return;
    }

    try {
      this.status = 'STOPPED';
      this.stopHealthMonitoring();

      // Stop components
      if (this.analytics) {
        // await this.analytics.stop();
      }
      if (this.realTimeStreamer) {
        // await this.realTimeStreamer.stop();
      }
      if (this.dataPipeline) {
        // await this.dataPipeline.stop();
      }

      this.stats.status = 'STOPPED';
      this.updateComponentStatus();

      this.emit('INTEGRATION_STOPPED', {
        timestamp: new Date(),
        uptime: this.stats.uptime
      });

      await this.auditLogger.log(
        'SUSPICIOUS_ACTIVITY',
        'INFO',
        { id: 'integration-manager', type: 'SYSTEM' },
        'INTEGRATION_STOP',
        'SUCCESS',
        {
          target: { id: 'dune-analytics', type: 'EXTERNAL_SYSTEM' },
          metadata: { uptime: this.stats.uptime }
        }
      );

    } catch (error) {
      this.stats.errorCount++;
      
      await this.auditLogger.log(
        'SUSPICIOUS_ACTIVITY',
        'ERROR',
        { id: 'integration-manager', type: 'SYSTEM' },
        'INTEGRATION_STOP',
        'FAILURE',
        {
          target: { id: 'dune-analytics', type: 'EXTERNAL_SYSTEM' },
          metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      );

      throw error;
    }
  }

  /**
   * Pause the integration
   */
  async pause(): Promise<void> {
    if (this.status !== 'RUNNING') {
      throw new Error('Integration must be running to pause');
    }

    try {
      this.status = 'PAUSED';
      this.stats.status = 'PAUSED';

      await this.auditLogger.log(
        'SUSPICIOUS_ACTIVITY',
        'INFO',
        { id: 'integration-manager', type: 'SYSTEM' },
        'INTEGRATION_PAUSE',
        'SUCCESS',
        {
          target: { id: 'dune-analytics', type: 'EXTERNAL_SYSTEM' },
          metadata: { pausedAt: new Date() }
        }
      );

    } catch (error) {
      this.stats.errorCount++;
      
      await this.auditLogger.log(
        'SUSPICIOUS_ACTIVITY',
        'ERROR',
        { id: 'integration-manager', type: 'SYSTEM' },
        'INTEGRATION_PAUSE',
        'FAILURE',
        {
          target: { id: 'dune-analytics', type: 'EXTERNAL_SYSTEM' },
          metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      );

      throw error;
    }
  }

  /**
   * Resume the integration
   */
  async resume(): Promise<void> {
    if (this.status !== 'PAUSED') {
      throw new Error('Integration must be paused to resume');
    }

    try {
      this.status = 'RUNNING';
      this.stats.status = 'RUNNING';

      this.emit('INTEGRATION_RESUMED', {
        timestamp: new Date()
      });

      await this.auditLogger.log(
        'SUSPICIOUS_ACTIVITY',
        'INFO',
        { id: 'integration-manager', type: 'SYSTEM' },
        'INTEGRATION_RESUME',
        'SUCCESS',
        {
          target: { id: 'dune-analytics', type: 'EXTERNAL_SYSTEM' },
          metadata: { resumedAt: new Date() }
        }
      );

    } catch (error) {
      this.stats.errorCount++;
      
      await this.auditLogger.log(
        'SUSPICIOUS_ACTIVITY',
        'ERROR',
        { id: 'integration-manager', type: 'SYSTEM' },
        'INTEGRATION_RESUME',
        'FAILURE',
        {
          target: { id: 'dune-analytics', type: 'EXTERNAL_SYSTEM' },
          metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      );

      throw error;
    }
  }

  /**
   * Log a governance event through the integration
   */
  async logGovernanceEvent(
    actor: AuditActor,
    eventType: string,
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
        await this.blockchainLogger.logGovernanceEvent(actor, eventType as any, data, options);
      }

      // Ingest to data pipeline
      if (this.dataPipeline) {
        await this.dataPipeline.ingestGovernanceEvent(actor, {
          eventType: eventType as any,
          proposalId: data.proposalId,
          voterId: data.voterId,
          vote: data.vote,
          timestamp: new Date(),
          metadata: data
        }, options);
      }

      // Stream in real-time if requested
      if (options?.streamRealTime && this.realTimeStreamer) {
        await this.realTimeStreamer.streamGovernanceEvent(actor, eventType, data, options);
      }

      this.stats.totalEventsProcessed++;
      this.stats.lastEventTimestamp = new Date();
      this.updateEventsPerSecond();

    } catch (error) {
      this.stats.errorCount++;
      
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
    actor: AuditActor,
    eventType: string,
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
        await this.blockchainLogger.logTrustProtocolEvent(actor, eventType as any, data, options);
      }

      // Ingest to data pipeline
      if (this.dataPipeline) {
        await this.dataPipeline.ingestTrustProtocolEvent(actor, {
          eventType: eventType as any,
          agentId: data.agentId,
          declarationId: data.declarationId,
          complianceScore: data.complianceScore,
          trustScore: data.trustScore,
          timestamp: new Date(),
          metadata: data
        }, options);
      }

      // Stream in real-time if requested
      if (options?.streamRealTime && this.realTimeStreamer) {
        await this.realTimeStreamer.streamTrustProtocolEvent(actor, eventType, data, options);
      }

      this.stats.totalEventsProcessed++;
      this.stats.lastEventTimestamp = new Date();
      this.updateEventsPerSecond();

    } catch (error) {
      this.stats.errorCount++;
      
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
   * Perform health check
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const result: HealthCheckResult = {
      healthy: true,
      timestamp: new Date(),
      components: {
        blockchainLogger: { healthy: true },
        dataPipeline: { healthy: true },
        realTimeStreamer: { healthy: true },
        analytics: { healthy: true }
      }
    };

    try {
      // Check blockchain logger
      if (this.blockchainLogger) {
        const loggerStats = this.blockchainLogger.getStats();
        result.components.blockchainLogger.healthy = loggerStats.errorCount < 10;
        if (!result.components.blockchainLogger.healthy) {
          result.components.blockchainLogger.message = `High error count: ${loggerStats.errorCount}`;
        }
      } else {
        result.components.blockchainLogger.healthy = false;
        result.components.blockchainLogger.message = 'Not initialized';
      }

      // Check data pipeline
      if (this.dataPipeline) {
        const pipelineStats = this.dataPipeline.getStats();
        result.components.dataPipeline.healthy = pipelineStats.errorRate < 0.1; // 10% error rate threshold
        if (!result.components.dataPipeline.healthy) {
          result.components.dataPipeline.message = `High error rate: ${pipelineStats.errorRate * 100}%`;
        }
      } else {
        result.components.dataPipeline.healthy = false;
        result.components.dataPipeline.message = 'Not initialized';
      }

      // Check real-time streamer
      if (this.realTimeStreamer) {
        const streamerStats = this.realTimeStreamer.getStats();
        result.components.realTimeStreamer.healthy = streamerStats.connected;
        if (!result.components.realTimeStreamer.healthy) {
          result.components.realTimeStreamer.message = 'Not connected';
        }
      } else if (this.config.realTimeStreaming.enabled) {
        result.components.realTimeStreamer.healthy = false;
        result.components.realTimeStreamer.message = 'Not initialized';
      }

      // Check analytics
      if (this.analytics) {
        const analyticsStats = this.analytics.getStats();
        const timeSinceLastRun = Date.now() - analyticsStats.lastAnalysisRun.getTime();
        result.components.analytics.healthy = timeSinceLastRun < 2 * 60 * 60 * 1000; // 2 hours
        if (!result.components.analytics.healthy) {
          result.components.analytics.message = 'Analysis overdue';
        }
      } else if (this.config.analytics.enabled) {
        result.components.analytics.healthy = false;
        result.components.analytics.message = 'Not initialized';
      }

      // Overall health
      result.healthy = Object.values(result.components).every(c => c.healthy);
      
      if (!result.healthy) {
        result.overallMessage = 'One or more components are unhealthy';
      }

      return result;

    } catch (error) {
      result.healthy = false;
      result.overallMessage = `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      return result;
    }
  }

  /**
   * Get integration statistics
   */
  getStats(): IntegrationStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Get integration status
   */
  getStatus(): IntegrationStatus {
    return this.status;
  }

  /**
   * Initialize blockchain logger
   */
  private async initializeBlockchainLogger(): Promise<void> {
    this.blockchainLogger = initializeBlockchainLogger(this.config.blockchainLogger, this.auditLogger);
    await this.blockchainLogger.start();
    this.stats.components.blockchainLogger.status = 'ACTIVE';
  }

  /**
   * Initialize data pipeline
   */
  private async initializeDataPipeline(): Promise<void> {
    if (!this.blockchainLogger) {
      throw new Error('Blockchain logger must be initialized first');
    }
    
    this.dataPipeline = initializeDataPipeline(this.config.dataPipeline, this.blockchainLogger);
    await this.dataPipeline.start();
    this.stats.components.dataPipeline.status = 'ACTIVE';

    // Setup pipeline event listeners
    this.dataPipeline.on('DATA_INGESTED', (event) => {
      this.stats.components.dataPipeline.recordsProcessed++;
    });

    this.dataPipeline.on('PIPELINE_ERROR', (event) => {
      this.stats.errorCount++;
      this.emit('COMPONENT_ERROR', {
        component: 'dataPipeline',
        error: event.error,
        timestamp: new Date()
      });
    });
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
      await this.realTimeStreamer.start();
      this.stats.components.realTimeStreamer.status = 'ACTIVE';

      // Setup streamer event listeners
      this.realTimeStreamer.on('DATA_STREAMED', (event) => {
        this.stats.components.realTimeStreamer.messagesStreamed += event.messageCount;
      });

      this.realTimeStreamer.on('STREAM_ERROR', (event) => {
        this.stats.errorCount++;
        this.emit('COMPONENT_ERROR', {
          component: 'realTimeStreamer',
          error: event.error,
          timestamp: new Date()
        });
      });
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
      await this.analytics.start();
      this.stats.components.analytics.status = 'ACTIVE';

      // Setup analytics event listeners
      this.analytics.on('ANOMALY_DETECTED', (event) => {
        this.stats.components.analytics.anomaliesDetected++;
        this.emit('ANOMALY_DETECTED', event);
      });

      this.analytics.on('PREDICTION_GENERATED', (event) => {
        this.stats.components.analytics.predictionsGenerated++;
        this.emit('PREDICTION_GENERATED', event);
      });

      this.analytics.on('ANALYTICS_ERROR', (event) => {
        this.stats.errorCount++;
        this.emit('COMPONENT_ERROR', {
          component: 'analytics',
          error: event.error,
          timestamp: new Date()
        });
      });
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    if (!this.config.monitoring.enabled) {
      return;
    }

    this.healthCheckTimer = setInterval(async () => {
      try {
        const healthResult = await this.performHealthCheck();
        
        if (!healthResult.healthy) {
          this.emit('HEALTH_CHECK_FAILED', healthResult);
          
          // Check if we should alert
          const errorRate = this.stats.errorCount / Math.max(this.stats.totalEventsProcessed, 1);
          if (errorRate > this.config.monitoring.alertThresholds.errorRate / 100) {
            this.emit('ALERT_THRESHOLD_EXCEEDED', {
              type: 'ERROR_RATE',
              value: errorRate * 100,
              threshold: this.config.monitoring.alertThresholds.errorRate,
              timestamp: new Date()
            });
          }
        }
      } catch (error) {
        this.emit('HEALTH_CHECK_ERROR', {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        });
      }
    }, this.config.monitoring.healthCheckInterval);
  }

  /**
   * Stop health monitoring
   */
  private stopHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }

  /**
   * Update statistics
   */
  private updateStats(): void {
    if (this.startTime) {
      this.stats.uptime = Date.now() - this.startTime.getTime();
    }

    this.updateComponentStatus();
    this.updateEventsPerSecond();
  }

  /**
   * Update component status
   */
  private updateComponentStatus(): void {
    if (this.blockchainLogger) {
      const loggerStats = this.blockchainLogger.getStats();
      this.stats.components.blockchainLogger.eventsLogged = loggerStats.eventsLogged;
      this.stats.components.blockchainLogger.lastLogTimestamp = loggerStats.lastLogTimestamp;
    }

    if (this.dataPipeline) {
      const pipelineStats = this.dataPipeline.getStats();
      this.stats.components.dataPipeline.recordsProcessed = pipelineStats.totalRecordsProcessed;
      this.stats.components.dataPipeline.bufferUtilization = 
        (this.dataPipeline.getBufferedDataCount() / this.config.dataPipeline.batchSize) * 100;
    }

    if (this.realTimeStreamer) {
      const streamerStats = this.realTimeStreamer.getStats();
      this.stats.components.realTimeStreamer.messagesStreamed = streamerStats.messagesStreamed;
      this.stats.components.realTimeStreamer.connectionUptime = streamerStats.connectionUptime;
    }

    if (this.analytics) {
      const analyticsStats = this.analytics.getStats();
      this.stats.components.analytics.anomaliesDetected = analyticsStats.anomaliesDetected;
      this.stats.components.analytics.predictionsGenerated = analyticsStats.predictionsGenerated;
    }
  }

  /**
   * Update events per second calculation
   */
  private updateEventsPerSecond(): void {
    if (this.startTime && this.stats.totalEventsProcessed > 0) {
      const uptimeSeconds = (Date.now() - this.startTime.getTime()) / 1000;
      this.stats.eventsPerSecond = this.stats.totalEventsProcessed / uptimeSeconds;
    }
  }

  /**
   * Get component status summary
   */
  private getComponentStatus(): Record<string, string> {
    return {
      blockchainLogger: this.stats.components.blockchainLogger.status,
      dataPipeline: this.stats.components.dataPipeline.status,
      realTimeStreamer: this.stats.components.realTimeStreamer.status,
      analytics: this.stats.components.analytics.status
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