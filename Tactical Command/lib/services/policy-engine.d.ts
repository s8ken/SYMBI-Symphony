import { MessageEnvelope, ClassificationLevel } from '../types/agent-types';
export interface PolicyResult {
    allowed: boolean;
    reason?: string;
}
export declare class PolicyEngine {
    private policies;
    constructor();
    private initializeDefaultPolicies;
    /**
     * Check message against all policies
     */
    checkMessage(envelope: MessageEnvelope): Promise<PolicyResult>;
    /**
     * Validate agent clearance level
     */
    validateClearance(clearance: ClassificationLevel, compartments?: string[]): boolean;
    /**
     * Add custom policy
     */
    addPolicy(name: string, policyFunc: (envelope: MessageEnvelope) => PolicyResult): void;
    /**
     * Remove policy
     */
    removePolicy(name: string): void;
    private getAgentClearance;
    private getAgentCompartments;
    private getAgentNeedToKnow;
    private getAgentManifest;
    private isInternalAgent;
    private hasAmberClearance;
    private getCurrentRPM;
}
