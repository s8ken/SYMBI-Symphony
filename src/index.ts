/**
 * SYMBI Symphony - Unified AI Agent Orchestration Framework
 * 
 * A comprehensive platform for creating, managing, and orchestrating AI agents
 * with advanced authentication, monitoring, and collaboration capabilities.
 * 
 * @version 1.0.0
 * @author SYMBI AI
 * @license MIT
 */

// Export all core modules
export * from './core';

// Re-export commonly used types and classes for convenience
export type {
  Agent,
  AgentConfig,
  AgentStatus,
  AgentMessage,
  AgentTask,
  AuthConfig,
  User,
  Role,
  Permission,
  MetricValue,
  TraceContext
} from './core';

export {
  SymbiAgentSDK,
  AgentFactory,
  Authenticator,
  Authorizer,
  JwtHelper,
  MetricsCollector,
  Logger,
  AlertManager,
  Tracer
} from './core';
