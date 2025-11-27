/**
 * OpenTelemetry Distributed Tracing for SYMBI Symphony
 * Provides end-to-end request tracing across services
 */

import { trace, context, SpanStatusCode, Span, Tracer } from '@opentelemetry/api';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';

export interface TracingConfig {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  exporterType: 'jaeger' | 'otlp' | 'console';
  jaegerEndpoint?: string;
  otlpEndpoint?: string;
  sampleRate?: number;
}

export class TracingManager {
  private provider: NodeTracerProvider | null = null;
  private tracer: Tracer | null = null;
  private config: TracingConfig;

  constructor(config: TracingConfig) {
    this.config = {
      sampleRate: 1.0,
      ...config
    };
  }

  initialize(): void {
    // Create resource with service information
    const resource = Resource.default().merge(
      new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: this.config.serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: this.config.serviceVersion,
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: this.config.environment,
      })
    );

    // Create tracer provider
    this.provider = new NodeTracerProvider({
      resource,
    });

    // Configure exporter based on type
    let exporter;
    switch (this.config.exporterType) {
      case 'jaeger':
        exporter = new JaegerExporter({
          endpoint: this.config.jaegerEndpoint || 'http://localhost:14268/api/traces',
        });
        break;
      case 'otlp':
        exporter = new OTLPTraceExporter({
          url: this.config.otlpEndpoint || 'http://localhost:4318/v1/traces',
        });
        break;
      case 'console':
      default:
        // Console exporter for development
        const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-base');
        exporter = new ConsoleSpanExporter();
        break;
    }

    // Add batch span processor
    this.provider.addSpanProcessor(new BatchSpanProcessor(exporter, {}));

    // Register the provider
    this.provider.register();

    // Get tracer instance
    this.tracer = trace.getTracer(this.config.serviceName, this.config.serviceVersion);

    // Register automatic instrumentations
    registerInstrumentations({
      instrumentations: [
        new HttpInstrumentation({
          requestHook: (span, request) => {
            span.setAttribute('http.request.headers', JSON.stringify((request as any).headers));
          },
        }),
        new ExpressInstrumentation(),
      ],
    });
  }

  getTracer(): Tracer {
    if (!this.tracer) {
      throw new Error('Tracing not initialized. Call initialize() first.');
    }
    return this.tracer;
  }

  async shutdown(): Promise<void> {
    if (this.provider) {
      await this.provider.shutdown();
    }
  }

  /**
   * Create a new span for tracing an operation
   */
  startSpan(name: string, attributes?: Record<string, any>): Span {
    const tracer = this.getTracer();
    const span = tracer.startSpan(name, {
      attributes,
    });
    return span;
  }

  /**
   * Execute a function within a traced span
   */
  async traceAsync<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    attributes?: Record<string, any>
  ): Promise<T> {
    const span = this.startSpan(name, attributes);
    const ctx = trace.setSpan(context.active(), span);

    try {
      const result = await context.with(ctx, () => fn(span));
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Execute a synchronous function within a traced span
   */
  traceSync<T>(
    name: string,
    fn: (span: Span) => T,
    attributes?: Record<string, any>
  ): T {
    const span = this.startSpan(name, attributes);
    const ctx = trace.setSpan(context.active(), span);

    try {
      const result = context.with(ctx, () => fn(span));
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Add an event to the current span
   */
  addEvent(name: string, attributes?: Record<string, any>): void {
    const span = trace.getActiveSpan();
    if (span) {
      span.addEvent(name, attributes);
    }
  }

  /**
   * Set an attribute on the current span
   */
  setAttribute(key: string, value: any): void {
    const span = trace.getActiveSpan();
    if (span) {
      span.setAttribute(key, value);
    }
  }

  /**
   * Get the current trace context for propagation
   */
  getCurrentContext(): any {
    return context.active();
  }

  /**
   * Middleware for Express to automatically trace HTTP requests
   */
  expressMiddleware() {
    return (req: any, res: any, next: any) => {
      const span = this.startSpan(`HTTP ${req.method} ${req.path}`, {
        'http.method': req.method,
        'http.url': req.url,
        'http.target': req.path,
        'http.host': req.hostname,
        'http.scheme': req.protocol,
        'http.user_agent': req.get('user-agent'),
      });

      const ctx = trace.setSpan(context.active(), span);

      // Add correlation ID from request
      const correlationId = req.headers['x-correlation-id'] || req.id;
      if (correlationId) {
        span.setAttribute('correlation.id', correlationId);
      }

      // Capture response
      const originalSend = res.send;
      res.send = function (data: any) {
        span.setAttribute('http.status_code', res.statusCode);
        span.setAttribute('http.response.size', data?.length || 0);
        
        if (res.statusCode >= 400) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: `HTTP ${res.statusCode}`,
          });
        } else {
          span.setStatus({ code: SpanStatusCode.OK });
        }
        
        span.end();
        return originalSend.call(this, data);
      };

      context.with(ctx, () => next());
    };
  }
}

// Singleton instance
let tracingManager: TracingManager | null = null;

export function initializeTracing(config: TracingConfig): TracingManager {
  if (!tracingManager) {
    tracingManager = new TracingManager(config);
    tracingManager.initialize();
  }
  return tracingManager;
}

export function getTracingManager(): TracingManager {
  if (!tracingManager) {
    throw new Error('Tracing not initialized. Call initializeTracing() first.');
  }
  return tracingManager;
}

export async function shutdownTracing(): Promise<void> {
  if (tracingManager) {
    await tracingManager.shutdown();
    tracingManager = null;
  }
}

/**
 * Decorator for tracing class methods
 */
export function Trace(spanName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const name = spanName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const manager = getTracingManager();
      return await manager.traceAsync(
        name,
        async (span) => {
          span.setAttribute('method', propertyKey);
          span.setAttribute('class', target.constructor.name);
          return await originalMethod.apply(this, args);
        }
      );
    };

    return descriptor;
  };
}