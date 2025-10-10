/**
 * Core Module - SYMBI Symphony
 * 
 * Central exports for all core SYMBI Symphony functionality
 */

// Core modules
export * from './agent';
export * from './auth';
export * from './monitoring';
export * from './trust';

// Re-export key types and classes for convenience
export type {
  Agent,
  AgentConfig,
  AgentType,
  AgentStatus,
  TrustArticles,
  TrustDeclaration,
  TrustScores,
  TrustMetrics,
  TrustLevel
} from './agent';

export type {
  AuthConfig,
  User,
  Role,
  Permission
} from './auth';

export {
  MetricsCollector,
  Logger,
  AlertManager,
  Tracer
} from './monitoring';

export {
  trustScoring,
  trustValidator,
  didManager
} from './trust';