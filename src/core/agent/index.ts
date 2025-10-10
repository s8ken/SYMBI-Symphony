/**
 * Agent Module - SYMBI Symphony
 * 
 * Core agent management, orchestration, and communication capabilities
 * for the SYMBI AI Agent ecosystem.
 */

import { SymbiAgentSDK } from './sdk';
import { AgentFactory } from './factory';

export * from './types';
export * from './sdk';
export * from './factory';

// Convenience exports
export { SymbiAgentSDK } from './sdk';
export { AgentFactory } from './factory';

// Create default instances
export const defaultAgentFactory = AgentFactory;
export const defaultAgentSDK = new SymbiAgentSDK("http://localhost:3000", "default-api-key");

// Convenience functions
export function createAgent(config: any) {
  return AgentFactory.createAgent(config);
}

export function createAgentSDK(config?: any) {
  return new SymbiAgentSDK(config?.baseUrl || "http://localhost:3000", config?.apiKey || "default-api-key");
}

export function createAgentFactory(config?: any) {
  return AgentFactory;
}