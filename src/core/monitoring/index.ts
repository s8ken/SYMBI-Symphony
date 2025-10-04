/**
 * Monitoring Module - SYMBI Symphony
 * 
 * Comprehensive monitoring, logging, metrics collection, alerting, and distributed tracing
 * for the SYMBI AI Agent ecosystem.
 */

export * from './metrics-collector';
export * from './logger';
export * from './alert-manager';
export * from './tracer';

// Convenience exports
export { MetricsCollector } from './metrics-collector';
export { Logger } from './logger';
export { AlertManager } from './alert-manager';
export { Tracer } from './tracer';

// Create default instances
export const defaultMetricsCollector = new MetricsCollector();
export const defaultLogger = new Logger();
export const defaultAlertManager = new AlertManager(defaultMetricsCollector);
export const defaultTracer = Tracer.getInstance();

// Convenience functions
export function createLogger(config?: any) {
  return new Logger(config);
}

export function createMetricsCollector(config?: any) {
  return new MetricsCollector(config);
}

export function createAlertManager(metricsCollector?: MetricsCollector) {
  return new AlertManager(metricsCollector || defaultMetricsCollector);
}

export function createTracer(config?: any) {
  return Tracer.getInstance(config);
}