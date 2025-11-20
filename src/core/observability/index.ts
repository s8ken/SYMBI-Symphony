/**
 * Observability Module - Central Export
 * Provides logging, metrics, health checks, and distributed tracing
 */

export * from './logger';
export * from './metrics';
export * from './health';
export * from './tracing';

// Re-export commonly used types and functions
export {
  Logger,
  LogLevel,
  getLogger,
  createLogger,
} from './logger';

export {
  MetricsCollector,
  getMetricsCollector,
  initializeMetrics,
} from './metrics';

export {
  HealthCheckManager,
  HealthStatus,
  getHealthCheckManager,
  DatabaseHealthCheck,
  RedisHealthCheck,
  AgentOrchestraHealthCheck,
  MemoryHealthCheck,
} from './health';

export {
  TracingManager,
  initializeTracing,
  getTracingManager,
  Trace,
} from './tracing';