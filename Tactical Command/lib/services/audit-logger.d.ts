import { AuditLogEntry } from '../types/agent-types';
export declare class AuditLogger {
    private logs;
    private signingKey;
    private logSink;
    constructor(signingKey?: string);
    /**
     * Log an audit event
     */
    log(entry: Omit<AuditLogEntry, 'signature'>): Promise<void>;
    /**
     * Sign audit data with HMAC
     */
    sign(data: any): Promise<string>;
    /**
     * Verify audit entry signature
     */
    verify(entry: AuditLogEntry): Promise<boolean>;
    /**
     * Get audit logs with optional filtering
     */
    getLogs(filter?: {
        agentId?: string;
        eventType?: string;
        classification?: string;
        startTime?: string;
        endTime?: string;
    }): AuditLogEntry[];
    /**
     * Get audit trail for specific message
     */
    getMessageTrail(messageId: string): AuditLogEntry[];
    /**
     * Get agent activity summary
     */
    getAgentActivity(agentId: string, timeWindow?: {
        start: string;
        end: string;
    }): {
        totalEvents: number;
        eventsByType: Record<string, number>;
        messagesHandled: number;
        policyViolations: number;
        lastActivity: string | null;
    };
    /**
     * Verify audit log integrity
     */
    verifyLogIntegrity(): Promise<{
        valid: boolean;
        invalidEntries: string[];
        totalEntries: number;
    }>;
    /**
     * Export audit logs for compliance
     */
    exportLogs(format?: 'json' | 'csv', filter?: {
        classification?: string;
        startTime?: string;
        endTime?: string;
    }): string;
    /**
     * Create audit summary report
     */
    createSummaryReport(timeWindow?: {
        start: string;
        end: string;
    }): {
        period: {
            start: string;
            end: string;
        };
        totalEvents: number;
        eventsByType: Record<string, number>;
        agentActivity: Record<string, number>;
        policyViolations: number;
        topActiveAgents: Array<{
            agentId: string;
            eventCount: number;
        }>;
    };
    /**
     * Write to audit sink (file, database, etc.)
     */
    private writeToSink;
    /**
     * Set audit log sink
     */
    setLogSink(sink: string): void;
    /**
     * Clear logs (use with caution - for testing only)
     */
    clearLogs(): void;
    /**
     * Get log statistics
     */
    getStatistics(): {
        totalLogs: number;
        oldestLog: string | null;
        newestLog: string | null;
        logsByClassification: Record<string, number>;
        averageLogsPerDay: number;
    };
}
