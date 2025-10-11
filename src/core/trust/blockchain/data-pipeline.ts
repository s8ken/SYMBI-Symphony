import { EventEmitter } from 'events';
import { BlockchainLogger, BlockchainEvent, GovernanceEventData, TrustProtocolEventData } from './blockchain-logger';
import { AuditActor, AuditTarget } from '../audit/types';

/**
 * Data Pipeline Event Types
 */
export type PipelineEventType = 
  | 'DATA_INGESTED'
  | 'DATA_TRANSFORMED'
  | 'DATA_STREAMED'
  | 'PIPELINE_ERROR'
  | 'BATCH_PROCESSED'
  | 'REAL_TIME_UPDATE';

/**
 * Pipeline Data Source
 */
export interface DataSource {
  id: string;
  name: string;
  type: 'MONGODB' | 'POSTGRES' | 'API' | 'WEBHOOK' | 'STREAM';
  connectionString?: string;
  apiEndpoint?: string;
  webhookUrl?: string;
  enabled: boolean;
  lastSync?: Date;
  metadata: Record<string, any>;
}

/**
 * Data Transformation Rule
 */
export interface TransformationRule {
  id: string;
  name: string;
  sourceField: string;
  targetField: string;
  transformation: 'DIRECT' | 'AGGREGATE' | 'CALCULATE' | 'LOOKUP' | 'CUSTOM';
  formula?: string;
  lookupTable?: Record<string, any>;
  customFunction?: (value: any, context: any) => any;
}

/**
 * Pipeline Configuration
 */
export interface DataPipelineConfig {
  enabled: boolean;
  batchSize: number;
  flushInterval: number; // milliseconds
  retryAttempts: number;
  retryDelay: number; // milliseconds
  dataSources: DataSource[];
  transformationRules: TransformationRule[];
  duneAnalyticsConfig: {
    enabled: boolean;
    apiKey?: string;
    queryIds: string[];
    refreshInterval: number; // milliseconds
  };
  realTimeStreaming: {
    enabled: boolean;
    bufferSize: number;
    flushThreshold: number;
  };
}

/**
 * Pipeline Data Record
 */
export interface PipelineDataRecord {
  id: string;
  timestamp: Date;
  sourceId: string;
  sourceType: string;
  rawData: Record<string, any>;
  transformedData?: Record<string, any>;
  duneReady: boolean;
  metadata: {
    processingTime?: number;
    transformationApplied: string[];
    errors?: string[];
  };
}

/**
 * Pipeline Statistics
 */
export interface PipelineStats {
  totalRecordsProcessed: number;
  recordsPerSecond: number;
  averageProcessingTime: number;
  errorRate: number;
  lastProcessedTimestamp?: Date;
  dataSourceStats: Record<string, {
    recordsProcessed: number;
    lastSync: Date;
    errorCount: number;
  }>;
}

/**
 * Hybrid Data Pipeline
 * 
 * Connects SYMBI operations to Dune Analytics by:
 * 1. Ingesting data from multiple sources (MongoDB, APIs, webhooks)
 * 2. Transforming data for Dune Analytics format
 * 3. Streaming data in real-time and batch modes
 * 4. Handling retries and error recovery
 */
export class HybridDataPipeline extends EventEmitter {
  private config: DataPipelineConfig;
  private blockchainLogger: BlockchainLogger;
  private dataBuffer: PipelineDataRecord[];
  private flushTimer?: NodeJS.Timeout;
  private stats: PipelineStats;
  private isProcessing: boolean;

  constructor(config: DataPipelineConfig, blockchainLogger: BlockchainLogger) {
    super();
    this.config = config;
    this.blockchainLogger = blockchainLogger;
    this.dataBuffer = [];
    this.isProcessing = false;
    this.stats = {
      totalRecordsProcessed: 0,
      recordsPerSecond: 0,
      averageProcessingTime: 0,
      errorRate: 0,
      dataSourceStats: {}
    };

    if (this.config.enabled && this.config.flushInterval > 0) {
      this.startFlushTimer();
    }
  }

  /**
   * Ingest data from a source
   */
  async ingestData(
    sourceId: string,
    data: Record<string, any>[],
    options?: {
      skipTransformation?: boolean;
      priority?: 'HIGH' | 'NORMAL' | 'LOW';
    }
  ): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const startTime = Date.now();
    const source = this.config.dataSources.find(s => s.id === sourceId);
    
    if (!source || !source.enabled) {
      throw new Error(`Data source ${sourceId} not found or disabled`);
    }

    try {
      const records: PipelineDataRecord[] = data.map(item => ({
        id: item.id || this.generateRecordId(),
        timestamp: new Date(item.timestamp || Date.now()),
        sourceId,
        sourceType: source.type,
        rawData: item,
        duneReady: false,
        metadata: {
          transformationApplied: [],
          errors: []
        }
      }));

      // Apply transformations if not skipped
      if (!options?.skipTransformation) {
        for (const record of records) {
          await this.transformRecord(record);
        }
      }

      // Add to buffer
      this.dataBuffer.push(...records);

      // Update stats
      this.updateDataSourceStats(sourceId, records.length, Date.now() - startTime);

      // Emit event
      this.emit('DATA_INGESTED', {
        sourceId,
        recordCount: records.length,
        processingTime: Date.now() - startTime
      });

      // Flush if threshold reached
      if (this.config.realTimeStreaming.enabled && 
          this.dataBuffer.length >= this.config.realTimeStreaming.flushThreshold) {
        await this.flush();
      }

    } catch (error) {
      this.emit('PIPELINE_ERROR', {
        sourceId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Ingest governance event
   */
  async ingestGovernanceEvent(
    actor: AuditActor,
    governanceData: GovernanceEventData,
    options?: {
      target?: AuditTarget;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    const eventData = {
      id: this.generateRecordId(),
      timestamp: Date.now(),
      type: 'GOVERNANCE_EVENT',
      actor,
      governance: governanceData,
      target: options?.target,
      metadata: options?.metadata || {}
    };

    await this.ingestData('governance-events', [eventData]);

    // Also log to blockchain logger
    await this.blockchainLogger.logGovernanceEvent(
      'GOVERNANCE_PROPOSAL_CREATED', // This would be determined by governanceData.action
      actor,
      governanceData,
      options
    );
  }

  /**
   * Ingest trust protocol event
   */
  async ingestTrustProtocolEvent(
    actor: AuditActor,
    trustData: TrustProtocolEventData,
    options?: {
      target?: AuditTarget;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    const eventData = {
      id: this.generateRecordId(),
      timestamp: Date.now(),
      type: 'TRUST_PROTOCOL_EVENT',
      actor,
      trust: trustData,
      target: options?.target,
      metadata: options?.metadata || {}
    };

    await this.ingestData('trust-protocol-events', [eventData]);

    // Also log to blockchain logger
    await this.blockchainLogger.logTrustProtocolEvent(
      'TRUST_SCORE_UPDATED',
      actor,
      trustData,
      options
    );
  }

  /**
   * Transform a data record
   */
  private async transformRecord(record: PipelineDataRecord): Promise<void> {
    const startTime = Date.now();
    const transformedData: Record<string, any> = { ...record.rawData };

    try {
      // Apply transformation rules
      for (const rule of this.config.transformationRules) {
        if (record.rawData[rule.sourceField] !== undefined) {
          const transformedValue = await this.applyTransformation(
            record.rawData[rule.sourceField],
            rule,
            record
          );
          transformedData[rule.targetField] = transformedValue;
          record.metadata.transformationApplied.push(rule.id);
        }
      }

      // Add Dune Analytics specific fields
      transformedData.dune_event_id = record.id;
      transformedData.dune_timestamp = record.timestamp.toISOString();
      transformedData.dune_source_type = record.sourceType;
      transformedData.dune_source_id = record.sourceId;

      record.transformedData = transformedData;
      record.duneReady = true;
      record.metadata.processingTime = Date.now() - startTime;

      this.emit('DATA_TRANSFORMED', {
        recordId: record.id,
        sourceId: record.sourceId,
        processingTime: record.metadata.processingTime
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transformation error';
      record.metadata.errors?.push(errorMessage);
      record.duneReady = false;

      this.emit('PIPELINE_ERROR', {
        recordId: record.id,
        sourceId: record.sourceId,
        error: errorMessage,
        timestamp: new Date()
      });
    }
  }

  /**
   * Apply a specific transformation rule
   */
  private async applyTransformation(
    value: any,
    rule: TransformationRule,
    context: PipelineDataRecord
  ): Promise<any> {
    switch (rule.transformation) {
      case 'DIRECT':
        return value;

      case 'AGGREGATE':
        // For aggregation, we'd need to look at historical data
        // This is a simplified implementation
        return Array.isArray(value) ? value.reduce((sum, v) => sum + (Number(v) || 0), 0) : value;

      case 'CALCULATE':
        if (rule.formula) {
          // Simple formula evaluation (in production, use a safe expression evaluator)
          try {
            return eval(rule.formula.replace(/\{value\}/g, String(value)));
          } catch {
            return value;
          }
        }
        return value;

      case 'LOOKUP':
        return rule.lookupTable?.[String(value)] || value;

      case 'CUSTOM':
        if (rule.customFunction) {
          return rule.customFunction(value, context);
        }
        return value;

      default:
        return value;
    }
  }

  /**
   * Flush buffered data
   */
  async flush(): Promise<void> {
    if (this.dataBuffer.length === 0 || this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    const startTime = Date.now();
    const records = [...this.dataBuffer];
    this.dataBuffer = [];

    try {
      // Prepare data for Dune Analytics
      const duneReadyRecords = records.filter(r => r.duneReady);
      const duneData = duneReadyRecords
        .map(r => r.transformedData)
        .filter((data): data is Record<string, any> => data !== undefined);

      // In a real implementation, this would send data to Dune Analytics
      // For now, we'll simulate the process
      await this.sendToDuneAnalytics(duneData);

      // Update stats
      this.stats.totalRecordsProcessed += records.length;
      this.stats.lastProcessedTimestamp = new Date();
      this.stats.averageProcessingTime = 
        (this.stats.averageProcessingTime + (Date.now() - startTime)) / 2;

      this.emit('BATCH_PROCESSED', {
        recordCount: records.length,
        duneReadyCount: duneReadyRecords.length,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      // Re-queue records on failure
      this.dataBuffer.unshift(...records);
      
      this.emit('PIPELINE_ERROR', {
        error: error instanceof Error ? error.message : 'Flush error',
        recordCount: records.length,
        timestamp: new Date()
      });

      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Send data to Dune Analytics (placeholder implementation)
   */
  private async sendToDuneAnalytics(data: Record<string, any>[]): Promise<void> {
    if (!this.config.duneAnalyticsConfig.enabled || data.length === 0) {
      return;
    }

    // TODO: Implement actual Dune Analytics API integration
    // This would involve:
    // 1. Formatting data according to Dune's requirements
    // 2. Making API calls to Dune's ingestion endpoints
    // 3. Handling rate limits and retries
    // 4. Updating query refresh schedules

    console.log(`[DUNE ANALYTICS] Would send ${data.length} records to Dune Analytics`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    this.emit('DATA_STREAMED', {
      recordCount: data.length,
      destination: 'DUNE_ANALYTICS',
      timestamp: new Date()
    });
  }

  /**
   * Get pipeline statistics
   */
  getStats(): PipelineStats {
    return { ...this.stats };
  }

  /**
   * Get buffered data count
   */
  getBufferedDataCount(): number {
    return this.dataBuffer.length;
  }

  /**
   * Start real-time streaming
   */
  startRealTimeStreaming(): void {
    if (!this.config.realTimeStreaming.enabled) {
      this.config.realTimeStreaming.enabled = true;
      this.emit('REAL_TIME_UPDATE', {
        status: 'STARTED',
        timestamp: new Date()
      });
    }
  }

  /**
   * Stop real-time streaming
   */
  stopRealTimeStreaming(): void {
    if (this.config.realTimeStreaming.enabled) {
      this.config.realTimeStreaming.enabled = false;
      this.emit('REAL_TIME_UPDATE', {
        status: 'STOPPED',
        timestamp: new Date()
      });
    }
  }

  /**
   * Stop the pipeline
   */
  async stop(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }

    // Flush remaining data
    if (this.dataBuffer.length > 0) {
      await this.flush();
    }

    this.stopRealTimeStreaming();
  }

  /**
   * Start the flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(async () => {
      if (this.dataBuffer.length > 0) {
        try {
          await this.flush();
        } catch (error) {
          // Timer flush errors are logged but don't throw
          console.error('Pipeline flush timer error:', error);
        }
      }
    }, this.config.flushInterval);
  }

  /**
   * Update data source statistics
   */
  private updateDataSourceStats(sourceId: string, recordCount: number, processingTime: number): void {
    if (!this.stats.dataSourceStats[sourceId]) {
      this.stats.dataSourceStats[sourceId] = {
        recordsProcessed: 0,
        lastSync: new Date(),
        errorCount: 0
      };
    }

    this.stats.dataSourceStats[sourceId].recordsProcessed += recordCount;
    this.stats.dataSourceStats[sourceId].lastSync = new Date();
  }

  /**
   * Generate a unique record ID
   */
  private generateRecordId(): string {
    return `pipeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global pipeline instance
let globalPipeline: HybridDataPipeline | null = null;

/**
 * Initialize global data pipeline
 */
export function initializeDataPipeline(
  config: DataPipelineConfig,
  blockchainLogger: BlockchainLogger
): HybridDataPipeline {
  globalPipeline = new HybridDataPipeline(config, blockchainLogger);
  return globalPipeline;
}

/**
 * Get global data pipeline
 */
export function getDataPipeline(): HybridDataPipeline {
  if (!globalPipeline) {
    throw new Error('Data pipeline not initialized. Call initializeDataPipeline() first.');
  }
  return globalPipeline;
}

/**
 * Set global data pipeline
 */
export function setDataPipeline(pipeline: HybridDataPipeline): void {
  globalPipeline = pipeline;
}