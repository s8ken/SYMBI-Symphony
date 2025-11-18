import { PolicyEngine } from './policy-engine';
import { AuditLogger } from './audit-logger';
import { CostGovernor } from './cost-governor';
import { SymbiMemoryNode } from '../types/symbi-types';
/**
 * SYMBI Integration Service
 * Manages the SYMBI agent network and provides tactical coordination
 */
export declare class SymbiIntegrationService {
    private policyEngine;
    private auditLogger;
    private costGovernor;
    private agents;
    private memoryNodes;
    constructor(policyEngine: PolicyEngine, auditLogger: AuditLogger, costGovernor: CostGovernor);
    /**
     * Initialize the SYMBI agent network
     */
    initialize(): Promise<void>;
    /**
     * Set up message routing between agents
     */
    private setupMessageRouting;
    /**
     * Route messages between agents based on SYMBI specifications
     */
    private routeMessage;
    /**
     * Create a memory node for tactical intelligence
     */
    createMemoryNode(node: SymbiMemoryNode): Promise<void>;
    /**
     * Get agent status
     */
    getAgentStatus(agentId: string): any;
    /**
     * Get all active agents
     */
    getActiveAgents(): string[];
    /**
     * Send tactical command
     */
    sendTacticalCommand(command: {
        from: string;
        to: string;
        action: string;
        parameters: any;
        classification: string;
        compartments: string[];
    }): Promise<void>;
    /**
     * Query tactical intelligence
     */
    queryIntelligence(query: {
        from: string;
        to: string;
        question: string;
        context: any;
        classification: string;
        compartments: string[];
    }): Promise<any>;
}
export declare function initializeSymbiService(policyEngine: PolicyEngine, auditLogger: AuditLogger, costGovernor: CostGovernor): Promise<SymbiIntegrationService>;
export declare function getSymbiService(): SymbiIntegrationService | null;
