import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { HybridDataPipeline, PipelineDataRecord } from './data-pipeline';
import { BlockchainLogger, BlockchainEvent } from './blockchain-logger';
import { AuditActor, AuditTarget } from '../audit/types';

/**
 * Stream Event Types
 */
export type StreamEventType = 
  | 'STREAM_CONNECTED'
  | 'STREAM_DISCONNECTED'
  | 'STREAM_ERROR'
  | 'DATA_STREAMED'
  | 'HEARTBEAT'
  | 'BUFFER_OVERFLOW'
  | 'RECONNECT_ATTEMPT';

/**
 * Stream Configuration
 */
export interface StreamConfig {
  enabled: boolean;
  websocketUrl?: string;
  duneAnalyticsEndpoint?: string;
  bufferSize: number;
  flushInterval: number; // milliseconds
  heartbeatInterval: number; // milliseconds
  reconnectAttempts: number;
  reconnectDelay: number; // milliseconds
  compression: boolean;
  authentication: {
    enabled: boolean;
    apiKey?: string;
    token?: string;
  };
}

/**
 * Stream Message
 */
export interface StreamMessage {
  id: string;
  timestamp: Date;
  type: 'GOVERNANCE' | 'TRUST_PROTOCOL' | 'CIQ_METRICS' | 'AUDIT' | 'HEARTBEAT';
  data: Record<string, any>;
  metadata: {
    source: string;
    priority: 'HIGH' | 'NORMAL' | 'LOW';
    retryCount: number;
    compressed: boolean;
  };
}

/**
 * Stream Statistics
 */
export interface StreamStats {
  connected: boolean;
  messagesStreamed: number;
  messagesPerSecond: number;
  averageLatency: number;
  errorCount: number;
  lastMessageTimestamp?: Date;
  connectionUptime: number; // milliseconds
  bufferUtilization: number; // percentage
}

/**
 * Real-Time Data Streamer
 * 
 * Provides real-time streaming of governance events and trust protocol
 * metrics to Dune Analytics dashboards for immediate visibility.
 */
export class RealTimeStreamer extends EventEmitter {
  private config: StreamConfig;
  private pipeline: HybridDataPipeline;
  private blockchainLogger: BlockchainLogger;
  private websocket?: WebSocket;
  private messageBuffer: StreamMessage[];
  private flushTimer?: NodeJS.Timeout;
  private heartbeatTimer?: NodeJS.Timeout;
  private stats: StreamStats;
  private connectionStartTime?: Date;
  private isReconnecting: boolean;

  constructor(
    config: StreamConfig,
    pipeline: HybridDataPipeline,
    blockchainLogger: BlockchainLogger
  ) {
    super();
    this.config = config;
    this.pipeline = pipeline;
    this.blockchainLogger = blockchainLogger;
    this.messageBuffer = [];
    this.isReconnecting = false;
    this.stats = {
      connected: false,
      messagesStreamed: 0,
      messagesPerSecond: 0,
      averageLatency: 0,
      errorCount: 0,
      connectionUptime: 0,
      bufferUtilization: 0
    };

    // Listen to pipeline events
    this.setupPipelineListeners();
  }

  /**
   * Start the real-time streamer
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      await this.connect();
      this.startFlushTimer();
      this.startHeartbeat();
      
      this.emit('STREAM_CONNECTED', {
        timestamp: new Date(),
        config: this.config
      });

    } catch (error) {
      this.emit('STREAM_ERROR', {
        error: error instanceof Error ? error.message : 'Connection failed',
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Stop the real-time streamer
   */
  async stop(): Promise<void> {
    this.stopTimers();
    
    if (this.websocket) {
      this.websocket.close();
      this.websocket = undefined;
    }

    // Flush remaining messages
    if (this.messageBuffer.length > 0) {
      await this.flush();
    }

    this.stats.connected = false;
    this.emit('STREAM_DISCONNECTED', {
      timestamp: new Date(),
      uptime: this.stats.connectionUptime
    });
  }

  /**
   * Stream a governance event
   */
  async streamGovernanceEvent(
    actor: AuditActor,
    eventType: string,
    data: Record<string, any>,
    options?: {
      target?: AuditTarget;
      priority?: 'HIGH' | 'NORMAL' | 'LOW';
    }
  ): Promise<void> {
    const message: StreamMessage = {
      id: this.generateMessageId(),
      timestamp: new Date(),
      type: 'GOVERNANCE',
      data: {
        eventType,
        actor,
        target: options?.target,
        ...data
      },
      metadata: {
        source: 'governance-system',
        priority: options?.priority || 'NORMAL',
        retryCount: 0,
        compressed: this.config.compression
      }
    };

    await this.queueMessage(message);
  }

  /**
   * Stream a trust protocol event
   */
  async streamTrustProtocolEvent(
    actor: AuditActor,
    eventType: string,
    data: Record<string, any>,
    options?: {
      target?: AuditTarget;
      priority?: 'HIGH' | 'NORMAL' | 'LOW';
    }
  ): Promise<void> {
    const message: StreamMessage = {
      id: this.generateMessageId(),
      timestamp: new Date(),
      type: 'TRUST_PROTOCOL',
      data: {
        eventType,
        actor,
        target: options?.target,
        ...data
      },
      metadata: {
        source: 'trust-protocol',
        priority: options?.priority || 'NORMAL',
        retryCount: 0,
        compressed: this.config.compression
      }
    };

    await this.queueMessage(message);
  }

  /**
   * Stream CIQ metrics
   */
  async streamCIQMetrics(
    agentId: string,
    metrics: { clarity: number; integrity: number; quality: number },
    actor: AuditActor,
    options?: {
      target?: AuditTarget;
      priority?: 'HIGH' | 'NORMAL' | 'LOW';
    }
  ): Promise<void> {
    const message: StreamMessage = {
      id: this.generateMessageId(),
      timestamp: new Date(),
      type: 'CIQ_METRICS',
      data: {
        agentId,
        metrics,
        actor,
        target: options?.target,
        calculatedAt: new Date().toISOString()
      },
      metadata: {
        source: 'ciq-calculator',
        priority: options?.priority || 'NORMAL',
        retryCount: 0,
        compressed: this.config.compression
      }
    };

    await this.queueMessage(message);
  }

  /**
   * Queue a message for streaming
   */
  private async queueMessage(message: StreamMessage): Promise<void> {
    if (this.messageBuffer.length >= this.config.bufferSize) {
      // Buffer overflow - remove oldest messages or flush immediately
      if (message.metadata.priority === 'HIGH') {
        await this.flush();
      } else {
        this.messageBuffer.shift(); // Remove oldest message
        this.emit('BUFFER_OVERFLOW', {
          bufferSize: this.config.bufferSize,
          droppedMessage: message.id,
          timestamp: new Date()
        });
      }
    }

    this.messageBuffer.push(message);
    this.updateBufferUtilization();

    // Immediate flush for high priority messages
    if (message.metadata.priority === 'HIGH' && this.stats.connected) {
      await this.flush();
    }
  }

  /**
   * Flush message buffer
   */
  private async flush(): Promise<void> {
    if (this.messageBuffer.length === 0 || !this.stats.connected) {
      return;
    }

    const messages = [...this.messageBuffer];
    this.messageBuffer = [];
    this.updateBufferUtilization();

    try {
      const startTime = Date.now();
      
      // Send messages via WebSocket or HTTP
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        await this.sendViaWebSocket(messages);
      } else {
        await this.sendViaHTTP(messages);
      }

      // Update stats
      const latency = Date.now() - startTime;
      this.stats.messagesStreamed += messages.length;
      this.stats.averageLatency = (this.stats.averageLatency + latency) / 2;
      this.stats.lastMessageTimestamp = new Date();

      this.emit('DATA_STREAMED', {
        messageCount: messages.length,
        latency,
        timestamp: new Date()
      });

    } catch (error) {
      // Re-queue messages on failure
      this.messageBuffer.unshift(...messages);
      this.stats.errorCount++;
      
      this.emit('STREAM_ERROR', {
        error: error instanceof Error ? error.message : 'Flush failed',
        messageCount: messages.length,
        timestamp: new Date()
      });

      // Attempt reconnection if WebSocket failed
      if (this.websocket && this.websocket.readyState !== WebSocket.OPEN) {
        this.attemptReconnection();
      }
    }
  }

  /**
   * Send messages via WebSocket
   */
  private async sendViaWebSocket(messages: StreamMessage[]): Promise<void> {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const payload = {
      type: 'BATCH_STREAM',
      timestamp: new Date().toISOString(),
      messages: messages.map(msg => this.config.compression ? this.compressMessage(msg) : msg)
    };

    return new Promise((resolve, reject) => {
      this.websocket!.send(JSON.stringify(payload), (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Send messages via HTTP
   */
  private async sendViaHTTP(messages: StreamMessage[]): Promise<void> {
    if (!this.config.duneAnalyticsEndpoint) {
      throw new Error('Dune Analytics endpoint not configured');
    }

    const payload = {
      messages: messages.map(msg => this.config.compression ? this.compressMessage(msg) : msg)
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.config.authentication.enabled && this.config.authentication.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.authentication.apiKey}`;
    }

    // In a real implementation, this would use fetch or axios
    // For now, we'll simulate the HTTP request
    console.log(`[HTTP STREAM] Sending ${messages.length} messages to ${this.config.duneAnalyticsEndpoint}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  /**
   * Connect to WebSocket
   */
  private async connect(): Promise<void> {
    if (!this.config.websocketUrl) {
      return; // HTTP-only mode
    }

    return new Promise((resolve, reject) => {
      this.websocket = new WebSocket(this.config.websocketUrl!);
      
      this.websocket.on('open', () => {
        this.stats.connected = true;
        this.connectionStartTime = new Date();
        this.isReconnecting = false;
        resolve();
      });

      this.websocket.on('error', (error) => {
        this.stats.errorCount++;
        reject(error);
      });

      this.websocket.on('close', () => {
        this.stats.connected = false;
        if (!this.isReconnecting) {
          this.attemptReconnection();
        }
      });

      this.websocket.on('message', (data) => {
        // Handle server messages (acknowledgments, errors, etc.)
        try {
          const message = JSON.parse(data.toString());
          this.handleServerMessage(message);
        } catch (error) {
          console.error('Failed to parse server message:', error);
        }
      });
    });
  }

  /**
   * Handle server messages
   */
  private handleServerMessage(message: any): void {
    switch (message.type) {
      case 'ACK':
        // Message acknowledged
        break;
      case 'ERROR':
        this.emit('STREAM_ERROR', {
          error: message.error,
          timestamp: new Date()
        });
        break;
      case 'PONG':
        // Heartbeat response
        break;
      default:
        console.log('Unknown server message:', message);
    }
  }

  /**
   * Attempt reconnection
   */
  private async attemptReconnection(): Promise<void> {
    if (this.isReconnecting || !this.config.enabled) {
      return;
    }

    this.isReconnecting = true;
    let attempts = 0;

    while (attempts < this.config.reconnectAttempts && this.isReconnecting) {
      attempts++;
      
      this.emit('RECONNECT_ATTEMPT', {
        attempt: attempts,
        maxAttempts: this.config.reconnectAttempts,
        timestamp: new Date()
      });

      try {
        await new Promise(resolve => setTimeout(resolve, this.config.reconnectDelay));
        await this.connect();
        break;
      } catch (error) {
        if (attempts >= this.config.reconnectAttempts) {
          this.emit('STREAM_ERROR', {
            error: 'Max reconnection attempts reached',
            timestamp: new Date()
          });
          this.isReconnecting = false;
        }
      }
    }
  }

  /**
   * Setup pipeline event listeners
   */
  private setupPipelineListeners(): void {
    this.pipeline.on('DATA_INGESTED', async (event) => {
      // Stream high-priority data immediately
      if (event.priority === 'HIGH') {
        await this.streamGovernanceEvent(
          { id: 'pipeline', type: 'SYSTEM' },
          'DATA_INGESTED',
          event,
          { priority: 'HIGH' }
        );
      }
    });

    this.pipeline.on('BATCH_PROCESSED', async (event) => {
      await this.streamGovernanceEvent(
        { id: 'pipeline', type: 'SYSTEM' },
        'BATCH_PROCESSED',
        event
      );
    });
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(async () => {
      if (this.messageBuffer.length > 0) {
        try {
          await this.flush();
        } catch (error) {
          // Timer flush errors are logged but don't throw
          console.error('Stream flush timer error:', error);
        }
      }
    }, this.config.flushInterval);
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
      }
      
      // Update connection uptime
      if (this.connectionStartTime) {
        this.stats.connectionUptime = Date.now() - this.connectionStartTime.getTime();
      }

      this.emit('HEARTBEAT', {
        connected: this.stats.connected,
        uptime: this.stats.connectionUptime,
        timestamp: new Date()
      });
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop all timers
   */
  private stopTimers(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  /**
   * Update buffer utilization
   */
  private updateBufferUtilization(): void {
    this.stats.bufferUtilization = (this.messageBuffer.length / this.config.bufferSize) * 100;
  }

  /**
   * Compress message (placeholder implementation)
   */
  private compressMessage(message: StreamMessage): StreamMessage {
    // In a real implementation, this would use compression algorithms
    // For now, we'll just mark it as compressed
    return {
      ...message,
      metadata: {
        ...message.metadata,
        compressed: true
      }
    };
  }

  /**
   * Generate message ID
   */
  private generateMessageId(): string {
    return `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get stream statistics
   */
  getStats(): StreamStats {
    return { ...this.stats };
  }

  /**
   * Get buffered message count
   */
  getBufferedMessageCount(): number {
    return this.messageBuffer.length;
  }
}

// Global streamer instance
let globalStreamer: RealTimeStreamer | null = null;

/**
 * Initialize global real-time streamer
 */
export function initializeRealTimeStreamer(
  config: StreamConfig,
  pipeline: HybridDataPipeline,
  blockchainLogger: BlockchainLogger
): RealTimeStreamer {
  globalStreamer = new RealTimeStreamer(config, pipeline, blockchainLogger);
  return globalStreamer;
}

/**
 * Get global real-time streamer
 */
export function getRealTimeStreamer(): RealTimeStreamer {
  if (!globalStreamer) {
    throw new Error('Real-time streamer not initialized. Call initializeRealTimeStreamer() first.');
  }
  return globalStreamer;
}

/**
 * Set global real-time streamer
 */
export function setRealTimeStreamer(streamer: RealTimeStreamer): void {
  globalStreamer = streamer;
}