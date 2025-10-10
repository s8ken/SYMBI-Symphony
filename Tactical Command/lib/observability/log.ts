interface LogEntry {
  ts: string;
  level: 'info' | 'warn' | 'error';
  event: string;
  symbi_request_id?: string;
  ml_request_id?: string;
  thread_id?: string;
  msg_id?: string;
  tenant_id?: string;
  agent_id?: string;
  model?: string;
  cost?: number;
  duration_ms?: number;
  anomaly_score?: number;
  metadata?: Record<string, any>;
}

class SymbiLogger {
  private static instance: SymbiLogger;
  private logLevel: string = process.env.LOG_LEVEL || 'info';
  private enableStructured: boolean = process.env.STRUCTURED_LOGS === 'true';

  static getInstance(): SymbiLogger {
    if (!SymbiLogger.instance) {
      SymbiLogger.instance = new SymbiLogger();
    }
    return SymbiLogger.instance;
  }

  private shouldLog(level: string): boolean {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    return levels[level as keyof typeof levels] <= levels[this.logLevel as keyof typeof levels];
  }

  private formatLog(entry: LogEntry): string {
    if (this.enableStructured) {
      return JSON.stringify(entry);
    }
    return `[${entry.level.toUpperCase()}] ${entry.ts} - ${entry.event} ${entry.metadata ? JSON.stringify(entry.metadata) : ''}`;
  }

  log(level: 'info' | 'warn' | 'error', event: string, metadata?: Partial<LogEntry>) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      ts: new Date().toISOString(),
      level,
      event,
      ...metadata
    };

    console.log(this.formatLog(entry));
  }

  info(event: string, metadata?: Partial<LogEntry>) {
    this.log('info', event, metadata);
  }

  warn(event: string, metadata?: Partial<LogEntry>) {
    this.log('warn', event, metadata);
  }

  error(event: string, metadata?: Partial<LogEntry>) {
    this.log('error', event, metadata);
  }

  // ML-specific logging
  logMLPrediction(requestId: string, model: string, cost: number, duration: number, metadata?: any) {
    this.info('ml_prediction', {
      ml_request_id: requestId,
      model,
      cost,
      duration_ms: duration,
      metadata
    });
  }

  logAnomalyDetection(requestId: string, score: number, threshold: number, metadata?: any) {
    this.info('anomaly_detected', {
      ml_request_id: requestId,
      anomaly_score: score,
      metadata: { threshold, ...metadata }
    });
  }

  // Policy-specific logging
  logPolicyTrigger(policyId: string, trigger: string, metadata?: any) {
    this.info('policy_triggered', {
      event: `policy_${trigger}`,
      metadata: { policy_id: policyId, ...metadata }
    });
  }

  logPolicyBlock(policyId: string, reason: string, metadata?: any) {
    this.warn('policy_blocked', {
      metadata: { policy_id: policyId, reason, ...metadata }
    });
  }

  logPolicySuggestion(policyId: string, suggestion: string, metadata?: any) {
    this.info('policy_suggestion', {
      metadata: { policy_id: policyId, suggestion, ...metadata }
    });
  }
}

export const logger = SymbiLogger.getInstance();
export default logger;
