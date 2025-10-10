import { AsyncLocalStorage } from 'async_hooks';

interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operation: string;
  startTime: number;
  metadata: Record<string, any>;
}

class SymbiTracer {
  private static instance: SymbiTracer;
  private storage = new AsyncLocalStorage<TraceContext>();
  private spans: Map<string, TraceContext> = new Map();

  static getInstance(): SymbiTracer {
    if (!SymbiTracer.instance) {
      SymbiTracer.instance = new SymbiTracer();
    }
    return SymbiTracer.instance;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  startTrace(operation: string, metadata: Record<string, any> = {}): TraceContext {
    const traceId = this.generateId();
    const spanId = this.generateId();
    
    const context: TraceContext = {
      traceId,
      spanId,
      operation,
      startTime: Date.now(),
      metadata
    };

    this.spans.set(spanId, context);
    this.storage.enterWith(context);
    
    return context;
  }

  startSpan(operation: string, metadata: Record<string, any> = {}): TraceContext {
    const parentContext = this.storage.getStore();
    const spanId = this.generateId();
    
    const context: TraceContext = {
      traceId: parentContext?.traceId || this.generateId(),
      spanId,
      parentSpanId: parentContext?.spanId,
      operation,
      startTime: Date.now(),
      metadata
    };

    this.spans.set(spanId, context);
    this.storage.enterWith(context);
    
    return context;
  }

  endSpan(spanId: string, metadata: Record<string, any> = {}) {
    const span = this.spans.get(spanId);
    if (!span) return;

    const duration = Date.now() - span.startTime;
    
    // Log span completion
    console.log(JSON.stringify({
      type: 'span',
      traceId: span.traceId,
      spanId: span.spanId,
      parentSpanId: span.parentSpanId,
      operation: span.operation,
      duration_ms: duration,
      metadata: { ...span.metadata, ...metadata }
    }));

    this.spans.delete(spanId);
  }

  getCurrentContext(): TraceContext | undefined {
    return this.storage.getStore();
  }

  // ML-specific tracing
  traceMLPrediction(model: string, input: any, output: any) {
    const context = this.getCurrentContext();
    return this.startSpan('ml_prediction', {
      model,
      input_length: JSON.stringify(input).length,
      output_length: JSON.stringify(output).length,
      trace_context: context
    });
  }

  // Policy-specific tracing
  tracePolicyCheck(policyId: string, action: string, result: any) {
    const context = this.getCurrentContext();
    return this.startSpan('policy_check', {
      policy_id: policyId,
      action,
      result,
      trace_context: context
    });
  }

  // Message bus tracing
  traceMessageSend(message: any) {
    const context = this.getCurrentContext();
    return this.startSpan('message_send', {
      message_id: message.msg_id,
      thread_id: message.thread_id,
      target: message.target,
      trace_context: context
    });
  }

  traceMessageReceive(message: any) {
    const context = this.getCurrentContext();
    return this.startSpan('message_receive', {
      message_id: message.msg_id,
      thread_id: message.thread_id,
      origin: message.origin,
      trace_context: context
    });
  }
}

export const tracer = SymbiTracer.getInstance();
export default tracer;
