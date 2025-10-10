/**
 * SYMBI Agent Production Framework - Main Export
 * Central export point for all agent framework components
 */

// Core Types
export * from './types';

// Agent SDK
export { SymbiAgentSDK, createAgentSDK } from './sdk';

// Agent Factory
export { AgentFactory } from './factory';

// Orchestrator
export { SymbiOrchestrator, type OrchestratorConfig } from './orchestrator';

// Convenience functions for quick setup
export { createRepositoryAgent, createWebsiteAgent, createIntegrationAgent } from './utils';

// Version information
export const SYMBI_AGENT_VERSION = '1.0.0';
export const SYMBI_AGENT_API_VERSION = 'v1';

/**
 * Initialize the SYMBI Agent Framework
 * @param config - Framework configuration
 */
export interface FrameworkConfig {
  orchestratorUrl?: string;
  apiKey?: string;
  environment?: 'development' | 'staging' | 'production';
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export function initializeFramework(config: FrameworkConfig = {}) {
  const defaultConfig: Required<FrameworkConfig> = {
    orchestratorUrl: config.orchestratorUrl || 'http://localhost:3000',
    apiKey: config.apiKey || '',
    environment: config.environment || 'development',
    logLevel: config.logLevel || 'info'
  };

  // Set global configuration
  (globalThis as any).__SYMBI_FRAMEWORK_CONFIG__ = defaultConfig;

  console.log(`SYMBI Agent Framework v${SYMBI_AGENT_VERSION} initialized`);
  console.log(`Environment: ${defaultConfig.environment}`);
  console.log(`Orchestrator URL: ${defaultConfig.orchestratorUrl}`);

  return defaultConfig;
}

/**
 * Get current framework configuration
 */
export function getFrameworkConfig(): Required<FrameworkConfig> {
  return (globalThis as any).__SYMBI_FRAMEWORK_CONFIG__ || {
    orchestratorUrl: 'http://localhost:3000',
    apiKey: '',
    environment: 'development',
    logLevel: 'info'
  };
}