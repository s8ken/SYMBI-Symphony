/**
 * SYMBI Agent Framework Types
 * Based on SYMBI's tactical agent specifications
 */
export interface SymbiAgentSpec {
    id: string;
    persona: string;
    capabilities: string[];
    clearance: string;
    compartments: string[];
    memoryPartition: string;
    rateLimits: {
        rpm: number;
        tpm: number;
    };
    guardrails: string[];
    handoffs: {
        defaultRoute: string;
        escalateOn: string[];
    };
    status: 'active' | 'inactive' | 'maintenance';
}
export interface SymbiMessage {
    id: string;
    from: string;
    to: string;
    type: 'command' | 'query' | 'response' | 'alert';
    payload: any;
    classification: string;
    compartments: string[];
    timestamp: string;
    chainOfCustody: string[];
}
export interface SymbiMemoryNode {
    id: string;
    agentId: string;
    type: 'tactical' | 'strategic' | 'intelligence' | 'operational';
    data: any;
    classification: string;
    compartments: string[];
    ttl?: number;
    createdAt: string;
    updatedAt: string;
}
export interface SymbiAgentStatus {
    agentId: string;
    status: 'active' | 'inactive' | 'maintenance';
    lastHeartbeat: string;
    processedMessages: number;
    errors: number;
    memoryUsage: number;
}
