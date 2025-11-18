import { MessageEnvelope } from '../types/agent-types';
export interface CostCheck {
    allowed: boolean;
    reason?: string;
    estimatedCost?: number;
    estimatedLatency?: number;
}
export interface UsageMetrics {
    totalCost: number;
    totalRequests: number;
    totalTokens: number;
    averageLatency: number;
    costByAgent: Record<string, number>;
    requestsByAgent: Record<string, number>;
}
export declare class CostGovernor {
    private usage;
    private limits;
    private pricing;
    constructor(customLimits?: Partial<typeof CostGovernor.prototype.limits>);
    /**
     * Check if message is within cost and latency limits
     */
    checkLimits(envelope: MessageEnvelope): Promise<CostCheck>;
    /**
     * Record actual usage after request completion
     */
    recordUsage(agentId: string, metrics: {
        cost: number;
        tokens: number;
        latency: number;
    }): void;
    /**
     * Get usage metrics for an agent
     */
    getAgentUsage(agentId: string): {
        cost: number;
        requests: number;
        tokens: number;
        latencies: number[];
        lastReset: Date;
    };
    /**
     * Get overall usage metrics
     */
    getOverallUsage(): UsageMetrics;
    /**
     * Estimate cost and latency for a request
     */
    private estimateRequest;
    /**
     * Get recent request count for rate limiting
     */
    private getRecentRequests;
    /**
     * Reset daily usage metrics
     */
    private resetDailyUsage;
    /**
     * Set custom limits
     */
    setLimits(newLimits: Partial<typeof CostGovernor.prototype.limits>): void;
    /**
     * Get current limits
     */
    getLimits(): typeof CostGovernor.prototype.limits;
    /**
     * Get cost breakdown by time period
     */
    getCostBreakdown(agentId?: string): {
        today: number;
        thisWeek: number;
        thisMonth: number;
        byAgent: Record<string, number>;
    };
    /**
     * Check if agent is approaching limits
     */
    checkLimitWarnings(agentId: string): {
        costWarning: boolean;
        rateWarning: boolean;
        warnings: string[];
    };
    /**
     * Generate usage report
     */
    generateUsageReport(): {
        summary: UsageMetrics;
        agentDetails: Record<string, {
            cost: number;
            requests: number;
            tokens: number;
            averageLatency: number;
            efficiency: number;
        }>;
        recommendations: string[];
    };
}
