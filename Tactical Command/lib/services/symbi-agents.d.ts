import { AgentManifest } from '../types/agent-types';
/**
 * SYMBI Agent Specifications v1
 * Based on SYMBI's tactical agent framework
 */
export declare const SYMBI_AGENT_SPECS: Record<string, AgentManifest>;
/**
 * Get agent specification by ID
 */
export declare function getSymbiAgentSpec(agentId: string): AgentManifest | undefined;
/**
 * Get all SYMBI agent specifications
 */
export declare function getAllSymbiAgentSpecs(): AgentManifest[];
/**
 * Validate agent against SYMBI specifications
 */
export declare function validateSymbiAgent(agentId: string): boolean;
/**
 * Get agents by clearance level
 */
export declare function getAgentsByClearance(clearance: string): AgentManifest[];
/**
 * Get agents by compartment
 */
export declare function getAgentsByCompartment(compartment: string): AgentManifest[];
/**
 * Initialize all SYMBI agents in the message bus
 */
export declare function initializeSymbiAgents(messageBus: any): Promise<void>;
