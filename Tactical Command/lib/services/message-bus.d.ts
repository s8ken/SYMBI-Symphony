import { MessageEnvelope, MessageResponse, AgentManifest, ClassificationLevel, TLPLevel } from '../types/agent-types';
export declare class MessageBus {
    private agents;
    private routingTable;
    private policyEngine;
    private auditLogger;
    private costGovernor;
    private messageQueue;
    private activeThreads;
    constructor();
    private initializeDefaultRouting;
    /**
     * Register an agent with the message bus
     */
    registerAgent(manifest: AgentManifest): Promise<void>;
    /**
     * Send a message through the bus
     */
    sendMessage(envelope: MessageEnvelope): Promise<MessageResponse>;
    /**
     * Process message with target agent (OpenAI integration point)
     */
    private processMessage;
    /**
     * Route message to appropriate agent based on intent
     */
    private routeMessage;
    /**
     * Get agent by ID
     */
    getAgent(agentId: string): AgentManifest | undefined;
    /**
     * List all registered agents
     */
    listAgents(): AgentManifest[];
    /**
     * Get thread history
     */
    getThreadHistory(threadId: string): MessageEnvelope[];
    /**
     * Validate message envelope
     */
    private validateMessageEnvelope;
    /**
     * Validate agent manifest
     */
    private validateAgentManifest;
    /**
     * Check if classification level is valid
     */
    private isValidClassification;
    /**
     * Create a new message envelope
     */
    createMessage(params: {
        origin: string;
        target: string;
        classification: ClassificationLevel;
        tlp: TLPLevel;
        purpose: string;
        instructions: string;
        needToKnow?: string[];
        compartments?: string[];
        contextRefs?: Array<{
            type: 'mem' | 'doc' | 'url';
            id: string;
        }>;
        toolsAllowed?: string[];
        slo?: {
            latency_s: number;
            cost_cap_usd: number;
        };
    }): MessageEnvelope;
}
