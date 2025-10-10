/**
 * Tracer - SYMBI Symphony
 * 
 * Distributed tracing system for the SYMBI AI Agent ecosystem.
 * Provides comprehensive tracing capabilities for monitoring and debugging.
 */

import { EventEmitter } from 'events';

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  baggage?: Record<string, string>;
  flags?: number;
}

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags: Record<string, any>;
  logs: SpanLog[];
  references: SpanReference[];
  status: SpanStatus;
  kind: SpanKind;
  component?: string;
  service?: string;
  resource?: string;
}

export interface SpanLog {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  fields?: Record<string, any>;
}

export interface SpanReference {
  type: 'child_of' | 'follows_from';
  traceId: string;
  spanId: string;
}

export type SpanStatus = 'ok' | 'cancelled' | 'unknown' | 'invalid_argument' | 
  'deadline_exceeded' | 'not_found' | 'already_exists' | 'permission_denied' | 
  'resource_exhausted' | 'failed_precondition' | 'aborted' | 'out_of_range' | 
  'unimplemented' | 'internal' | 'unavailable' | 'data_loss' | 'unauthenticated';

export type SpanKind = 'server' | 'client' | 'producer' | 'consumer' | 'internal';

export interface TracerConfig {
  serviceName: string;
  serviceVersion?: string;
  environment?: string;
  samplingRate: number; // 0.0 to 1.0
  maxSpans: number;
  flushInterval: number; // milliseconds
  exporters: TraceExporter[];
  enableAutoInstrumentation: boolean;
  tags?: Record<string, any>;
}

export interface TraceExporter {
  type: 'console' | 'jaeger' | 'zipkin' | 'otlp' | 'datadog';
  config: Record<string, any>;
  enabled: boolean;
}

export class Tracer extends EventEmitter {
  private config: TracerConfig;
  private spans: Map<string, Span> = new Map();
  private activeSpans: Map<string, Span> = new Map();
  private flushTimer: NodeJS.Timeout | null = null;
  private spanHistory: Span[] = [];

  constructor(config: TracerConfig) {
    super();
    
    this.config = {
      ...config
    };

    this.startFlushTimer();
  }

  /**
   * Start a new span
   */
  startSpan(
    operationName: string,
    options?: {
      parentContext?: TraceContext;
      tags?: Record<string, any>;
      kind?: SpanKind;
      startTime?: number;
    }
  ): Span {
    const traceId = options?.parentContext?.traceId || this.generateTraceId();
    const spanId = this.generateSpanId();
    const parentSpanId = options?.parentContext?.spanId;
    
    // Check sampling
    if (!this.shouldSample(traceId)) {
      // Return a no-op span
      return this.createNoOpSpan(traceId, spanId, operationName);
    }

    const span: Span = {
      traceId,
      spanId,
      parentSpanId,
      operationName,
      startTime: options?.startTime || Date.now(),
      tags: {
        'service.name': this.config.serviceName,
        'service.version': this.config.serviceVersion,
        'environment': this.config.environment,
        ...this.config.tags,
        ...options?.tags
      },
      logs: [],
      references: parentSpanId ? [{
        type: 'child_of',
        traceId,
        spanId: parentSpanId
      }] : [],
      status: 'ok',
      kind: options?.kind || 'internal',
      component: this.config.serviceName
    };

    this.spans.set(spanId, span);
    this.activeSpans.set(spanId, span);
    
    this.emit('span_started', span);
    
    return span;
  }

  /**
   * Finish a span
   */
  finishSpan(span: Span, endTime?: number): void {
    if (!span || !this.spans.has(span.spanId)) {
      return;
    }

    span.endTime = endTime || Date.now();
    span.duration = span.endTime - span.startTime;
    
    this.activeSpans.delete(span.spanId);
    this.spanHistory.push({ ...span });
    
    this.emit('span_finished', span);
    
    // Remove from active spans if buffer is full
    if (this.spans.size > this.config.maxSpans) {
      const oldestSpanId = this.spans.keys().next().value;
      if (oldestSpanId) this.spans.delete(oldestSpanId);
    }
  }

  /**
   * Add tag to span
   */
  setTag(span: Span, key: string, value: any): void {
    if (!span || !this.spans.has(span.spanId)) {
      return;
    }
    
    span.tags[key] = value;
    this.emit('span_tag_set', { span, key, value });
  }

  /**
   * Add multiple tags to span
   */
  setTags(span: Span, tags: Record<string, any>): void {
    if (!span || !this.spans.has(span.spanId)) {
      return;
    }
    
    Object.assign(span.tags, tags);
    this.emit('span_tags_set', { span, tags });
  }

  /**
   * Log to span
   */
  log(span: Span, level: 'debug' | 'info' | 'warn' | 'error', message: string, fields?: Record<string, any>): void {
    if (!span || !this.spans.has(span.spanId)) {
      return;
    }
    
    const logEntry: SpanLog = {
      timestamp: Date.now(),
      level,
      message,
      fields
    };
    
    span.logs.push(logEntry);
    this.emit('span_logged', { span, log: logEntry });
  }

  /**
   * Set span status
   */
  setStatus(span: Span, status: SpanStatus): void {
    if (!span || !this.spans.has(span.spanId)) {
      return;
    }
    
    span.status = status;
    this.emit('span_status_set', { span, status });
  }

  /**
   * Record an error in span
   */
  recordError(span: Span, error: Error): void {
    if (!span || !this.spans.has(span.spanId)) {
      return;
    }
    
    this.setTag(span, 'error', true);
    this.setTag(span, 'error.message', error.message);
    this.setTag(span, 'error.name', error.name);
    
    if (error.stack) {
      this.setTag(span, 'error.stack', error.stack);
    }
    
    this.log(span, 'error', `Error: ${error.message}`, {
      error: error.name,
      stack: error.stack
    });
    
    this.setStatus(span, 'internal');
  }

  /**
   * Create trace context from span
   */
  createContext(span: Span): TraceContext {
    return {
      traceId: span.traceId,
      spanId: span.spanId,
      parentSpanId: span.parentSpanId
    };
  }

  /**
   * Extract context from headers (for HTTP tracing)
   */
  extractContext(headers: Record<string, string>): TraceContext | null {
    const traceId = headers['x-trace-id'] || headers['traceparent']?.split('-')[1];
    const spanId = headers['x-span-id'] || headers['traceparent']?.split('-')[2];
    
    if (!traceId || !spanId) {
      return null;
    }
    
    return {
      traceId,
      spanId,
      parentSpanId: headers['x-parent-span-id']
    };
  }

  /**
   * Inject context into headers (for HTTP tracing)
   */
  injectContext(context: TraceContext, headers: Record<string, string>): void {
    headers['x-trace-id'] = context.traceId;
    headers['x-span-id'] = context.spanId;
    
    if (context.parentSpanId) {
      headers['x-parent-span-id'] = context.parentSpanId;
    }
    
    // W3C Trace Context format
    headers['traceparent'] = `00-${context.traceId}-${context.spanId}-01`;
  }

  /**
   * Get active span by ID
   */
  getActiveSpan(spanId: string): Span | undefined {
    return this.activeSpans.get(spanId);
  }

  /**
   * Get all active spans
   */
  getActiveSpans(): Span[] {
    return Array.from(this.activeSpans.values());
  }

  /**
   * Get span by ID
   */
  getSpan(spanId: string): Span | undefined {
    return this.spans.get(spanId);
  }

  /**
   * Get spans by trace ID
   */
  getSpansByTrace(traceId: string): Span[] {
    return Array.from(this.spans.values())
      .filter(span => span.traceId === traceId);
  }

  /**
   * Get span history
   */
  getSpanHistory(limit?: number): Span[] {
    const history = [...this.spanHistory].reverse();
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Stop flush timer
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Flush spans to exporters
   */
  flush(): void {
    const finishedSpans = Array.from(this.spans.values())
      .filter(span => span.endTime !== undefined);
    
    if (finishedSpans.length === 0) {
      return;
    }

    for (const exporter of this.config.exporters) {
      if (!exporter.enabled) {
        continue;
      }

      try {
        this.exportSpans(exporter, finishedSpans);
      } catch (error) {
        this.emit('export_error', { exporter: exporter.type, error });
      }
    }

    // Remove exported spans
    finishedSpans.forEach(span => {
      this.spans.delete(span.spanId);
    });
  }

  /**
   * Export spans to specific exporter
   */
  private async exportSpans(exporter: TraceExporter, spans: Span[]): Promise<void> {
    switch (exporter.type) {
      case 'console':
        this.exportToConsole(spans);
        break;
      case 'jaeger':
        await this.exportToJaeger(exporter.config, spans);
        break;
      case 'zipkin':
        await this.exportToZipkin(exporter.config, spans);
        break;
      case 'otlp':
        await this.exportToOTLP(exporter.config, spans);
        break;
      case 'datadog':
        await this.exportToDatadog(exporter.config, spans);
        break;
      default:
        throw new Error(`Unsupported exporter type: ${exporter.type}`);
    }
  }

  /**
   * Export to console
   */
  private exportToConsole(spans: Span[]): void {
    console.log('\n=== Trace Export ===');
    console.log(`Exporting ${spans.length} spans`);
    
    for (const span of spans) {
      console.log(`Span: ${span.operationName}`);
      console.log(`  Trace ID: ${span.traceId}`);
      console.log(`  Span ID: ${span.spanId}`);
      console.log(`  Duration: ${span.duration}ms`);
      console.log(`  Status: ${span.status}`);
      console.log(`  Tags: ${JSON.stringify(span.tags)}`);
      
      if (span.logs.length > 0) {
        console.log(`  Logs: ${span.logs.length} entries`);
      }
      
      console.log('');
    }
    
    console.log('==================\n');
  }

  /**
   * Export to Jaeger (placeholder)
   */
  private async exportToJaeger(config: any, spans: Span[]): Promise<void> {
    console.log(`Would export ${spans.length} spans to Jaeger at ${config.endpoint}`);
  }

  /**
   * Export to Zipkin (placeholder)
   */
  private async exportToZipkin(config: any, spans: Span[]): Promise<void> {
    console.log(`Would export ${spans.length} spans to Zipkin at ${config.endpoint}`);
  }

  /**
   * Export to OTLP (placeholder)
   */
  private async exportToOTLP(config: any, spans: Span[]): Promise<void> {
    console.log(`Would export ${spans.length} spans to OTLP at ${config.endpoint}`);
  }

  /**
   * Export to Datadog (placeholder)
   */
  private async exportToDatadog(config: any, spans: Span[]): Promise<void> {
    console.log(`Would export ${spans.length} spans to Datadog`);
  }

  /**
   * Check if trace should be sampled
   */
  private shouldSample(traceId: string): boolean {
    if (this.config.samplingRate >= 1.0) {
      return true;
    }
    
    if (this.config.samplingRate <= 0.0) {
      return false;
    }
    
    // Use trace ID for consistent sampling decision
    const hash = this.hashTraceId(traceId);
    return (hash % 100) < (this.config.samplingRate * 100);
  }

  /**
   * Hash trace ID for sampling
   */
  private hashTraceId(traceId: string): number {
    let hash = 0;
    for (let i = 0; i < traceId.length; i++) {
      const char = traceId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Generate trace ID
   */
  private generateTraceId(): string {
    return Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  /**
   * Generate span ID
   */
  private generateSpanId(): string {
    return Array.from({ length: 16 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  /**
   * Create no-op span (for when sampling is disabled)
   */
  private createNoOpSpan(traceId: string, spanId: string, operationName: string): Span {
    return {
      traceId,
      spanId,
      operationName,
      startTime: Date.now(),
      tags: {},
      logs: [],
      references: [],
      status: 'ok',
      kind: 'internal'
    };
  }

  /**
   * Add exporter
   */
  addExporter(exporter: TraceExporter): void {
    this.config.exporters.push(exporter);
  }

  /**
   * Remove exporter
   */
  removeExporter(type: string): void {
    this.config.exporters = this.config.exporters.filter(e => e.type !== type);
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<TracerConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Restart flush timer if interval changed
    if (updates.flushInterval) {
      this.startFlushTimer();
    }
  }

  /**
   * Get configuration
   */
  getConfig(): TracerConfig {
    return { ...this.config };
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalSpans: number;
    activeSpans: number;
    finishedSpans: number;
    spansByStatus: Record<SpanStatus, number>;
    spansByKind: Record<SpanKind, number>;
    averageDuration: number;
    totalDuration: number;
  } {
    const allSpans = Array.from(this.spans.values());
    const finishedSpans = allSpans.filter(span => span.endTime !== undefined);
    
    const spansByStatus: Record<SpanStatus, number> = {} as any;
    const spansByKind: Record<SpanKind, number> = {} as any;
    
    let totalDuration = 0;
    
    allSpans.forEach(span => {
      spansByStatus[span.status] = (spansByStatus[span.status] || 0) + 1;
      spansByKind[span.kind] = (spansByKind[span.kind] || 0) + 1;
      
      if (span.duration) {
        totalDuration += span.duration;
      }
    });
    
    return {
      totalSpans: allSpans.length,
      activeSpans: this.activeSpans.size,
      finishedSpans: finishedSpans.length,
      spansByStatus,
      spansByKind,
      averageDuration: finishedSpans.length > 0 ? totalDuration / finishedSpans.length : 0,
      totalDuration
    };
  }

  /**
   * Clear all spans
   */
  clear(): void {
    this.spans.clear();
    this.activeSpans.clear();
    this.spanHistory = [];
  }

  /**
   * Destroy the tracer
   */
  destroy(): void {
    this.flush();
    this.stopFlushTimer();
    this.clear();
    this.removeAllListeners();
  }
}