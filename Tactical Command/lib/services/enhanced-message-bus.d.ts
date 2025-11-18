import { MessageBus } from './message-bus';
import { PolicyEngine } from './policy-engine';
import { CostGovernor } from './cost-governor';
import { AuditLogger } from './audit-logger';
import { MessageEnvelope } from '../types/agent-types';
export interface EnhancedMessageBusConfig {
    enablePolicyChecks?: boolean;
    enableCostGovernance?: boolean;
    enableAuditLogging?: boolean;
    maxRetries?: number;
    circuitBreakerThreshold?: number;
    priorityQueue?: boolean;
}
export interface PolicyCheckResult {
    allowed: boolean;
    reason?: string;
    violations?: string[];
}
export interface CostCheckResult {
    allowed: boolean;
    estimatedCost?: number;
    estimatedLatency?: number;
    reason?: string;
}
export interface MessageProcessingResult {
    success: boolean;
    messageId: string;
    policyCheck?: PolicyCheckResult;
    costCheck?: CostCheckResult;
    processingTime?: number;
    error?: string;
}
export declare class EnhancedMessageBus extends MessageBus {
    private policyEngine;
    private costGovernor;
    private auditLogger;
    private config;
    private circuitBreakerState;
    private priorityQueues;
    private processingQueue;
    constructor(config?: EnhancedMessageBusConfig);
    /**
     * Enhanced send method with policy and cost checks
     */
    send(envelope: MessageEnvelope): Promise<MessageProcessingResult>;
    /**
     * Perform comprehensive policy checks
     */
    private performPolicyCheck;
    /**
     * Perform cost and latency checks
     */
    private performCostCheck;
    /**
     * Queue message with priority support
     */
    private queueMessage;
    /**
     * Handle policy violations
     */
    private handlePolicyViolation;
    /**
     * Handle cost limit exceeded
     */
    private handleCostLimitExceeded;
    /**
     * Circuit breaker management
     */
    private isCircuitBreakerOpen;
    /**
     * Record failure for circuit breaker
     */
    recordFailure(agentId: string): void;
    /**
     * Record success for circuit breaker
     */
    recordSuccess(agentId: string): void;
    /**
     * Get usage statistics
     */
    getUsageStats(): {
        totalMessages: number;
        policyViolations: number;
        costLimitExceeded: number;
        circuitBreakers: Record<string, any>;
        agentStats: Record<string, {
            messages: number;
            cost: number;
            violations: number;
        }>;
    };
    /**
     * Generate unique message ID
     */
    private generateMessageId;
    /**
     * Get cost governor instance for external access
     */
    getCostGovernor(): CostGovernor;
    /**
     * Get policy engine instance for external access
     */
    getPolicyEngine(): PolicyEngine;
    /**
     * Get audit logger instance for external access
     */
    getAuditLogger(): AuditLogger;
}
