import { createHash, createHmac } from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import { AuditLogEntry } from '../types/agent-types'

export class AuditLogger {
  private logs: AuditLogEntry[] = []
  private signingKey: string
  private logSink: string | null = null

  constructor(signingKey?: string) {
    // In production, this would come from secure key management
    this.signingKey = signingKey || process.env.AUDIT_SIGNING_KEY || 'default-key-change-in-production'
  }

  /**
   * Log an audit event
   */
  async log(entry: Omit<AuditLogEntry, 'signature'>): Promise<void> {
    const completeEntry: AuditLogEntry = {
      ...entry,
      signature: await this.sign(entry)
    }

    // Add to in-memory store
    this.logs.push(completeEntry)

    // In production, this would write to secure append-only storage
    await this.writeToSink(completeEntry)

    console.log(`[AUDIT] ${entry.event_type} - Agent: ${entry.agent_id} - ${entry.timestamp}`)
  }

  /**
   * Sign audit data with HMAC
   */
  async sign(data: any): Promise<string> {
    const dataString = JSON.stringify(data, Object.keys(data).sort())
    const hmac = createHmac('sha256', this.signingKey)
    hmac.update(dataString)
    return hmac.digest('hex')
  }

  /**
   * Verify audit entry signature
   */
  async verify(entry: AuditLogEntry): Promise<boolean> {
    const { signature, ...entryWithoutSig } = entry
    const expectedSignature = await this.sign(entryWithoutSig)
    return signature === expectedSignature
  }

  /**
   * Get audit logs with optional filtering
   */
  getLogs(filter?: {
    agentId?: string
    eventType?: string
    classification?: string
    startTime?: string
    endTime?: string
  }): AuditLogEntry[] {
    let filteredLogs = [...this.logs]

    if (filter) {
      if (filter.agentId) {
        filteredLogs = filteredLogs.filter(log => log.agent_id === filter.agentId)
      }
      if (filter.eventType) {
        filteredLogs = filteredLogs.filter(log => log.event_type === filter.eventType)
      }
      if (filter.classification) {
        filteredLogs = filteredLogs.filter(log => log.classification === filter.classification)
      }
      if (filter.startTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.startTime!)
      }
      if (filter.endTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filter.endTime!)
      }
    }

    return filteredLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  }

  /**
   * Get audit trail for specific message
   */
  getMessageTrail(messageId: string): AuditLogEntry[] {
    return this.logs.filter(log => log.message_id === messageId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  }

  /**
   * Get agent activity summary
   */
  getAgentActivity(agentId: string, timeWindow?: { start: string, end: string }): {
    totalEvents: number
    eventsByType: Record<string, number>
    messagesHandled: number
    policyViolations: number
    lastActivity: string | null
  } {
    let agentLogs = this.logs.filter(log => log.agent_id === agentId)

    if (timeWindow) {
      agentLogs = agentLogs.filter(log => 
        log.timestamp >= timeWindow.start && log.timestamp <= timeWindow.end
      )
    }

    const eventsByType: Record<string, number> = {}
    let messagesHandled = 0
    let policyViolations = 0

    agentLogs.forEach(log => {
      eventsByType[log.event_type] = (eventsByType[log.event_type] || 0) + 1
      
      if (log.event_type === 'message_sent' || log.event_type === 'message_received') {
        messagesHandled++
      }
      
      if (log.event_type === 'policy_violation') {
        policyViolations++
      }
    })

    const lastActivity = agentLogs.length > 0 
      ? agentLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0].timestamp
      : null

    return {
      totalEvents: agentLogs.length,
      eventsByType,
      messagesHandled,
      policyViolations,
      lastActivity
    }
  }

  /**
   * Verify audit log integrity
   */
  async verifyLogIntegrity(): Promise<{
    valid: boolean
    invalidEntries: string[]
    totalEntries: number
  }> {
    const invalidEntries: string[] = []
    
    for (const entry of this.logs) {
      const isValid = await this.verify(entry)
      if (!isValid) {
        invalidEntries.push(entry.id)
      }
    }

    return {
      valid: invalidEntries.length === 0,
      invalidEntries,
      totalEntries: this.logs.length
    }
  }

  /**
   * Export audit logs for compliance
   */
  exportLogs(format: 'json' | 'csv' = 'json', filter?: {
    classification?: string
    startTime?: string
    endTime?: string
  }): string {
    const logs = this.getLogs(filter)

    if (format === 'csv') {
      const headers = ['id', 'timestamp', 'event_type', 'agent_id', 'message_id', 'classification', 'details', 'signature']
      const csvRows = logs.map(log => [
        log.id,
        log.timestamp,
        log.event_type,
        log.agent_id,
        log.message_id || '',
        log.classification,
        JSON.stringify(log.details),
        log.signature
      ])
      
      return [headers, ...csvRows].map(row => row.join(',')).join('\n')
    }

    return JSON.stringify(logs, null, 2)
  }

  /**
   * Create audit summary report
   */
  createSummaryReport(timeWindow?: { start: string, end: string }): {
    period: { start: string, end: string }
    totalEvents: number
    eventsByType: Record<string, number>
    agentActivity: Record<string, number>
    policyViolations: number
    topActiveAgents: Array<{ agentId: string, eventCount: number }>
  } {
    let logs = [...this.logs]

    if (timeWindow) {
      logs = logs.filter(log => 
        log.timestamp >= timeWindow.start && log.timestamp <= timeWindow.end
      )
    }

    const eventsByType: Record<string, number> = {}
    const agentActivity: Record<string, number> = {}
    let policyViolations = 0

    logs.forEach(log => {
      eventsByType[log.event_type] = (eventsByType[log.event_type] || 0) + 1
      agentActivity[log.agent_id] = (agentActivity[log.agent_id] || 0) + 1
      
      if (log.event_type === 'policy_violation') {
        policyViolations++
      }
    })

    const topActiveAgents = Object.entries(agentActivity)
      .map(([agentId, eventCount]) => ({ agentId, eventCount }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10)

    const period = timeWindow || {
      start: logs.length > 0 ? logs[logs.length - 1].timestamp : new Date().toISOString(),
      end: logs.length > 0 ? logs[0].timestamp : new Date().toISOString()
    }

    return {
      period,
      totalEvents: logs.length,
      eventsByType,
      agentActivity,
      policyViolations,
      topActiveAgents
    }
  }

  /**
   * Write to audit sink (file, database, etc.)
   */
  private async writeToSink(entry: AuditLogEntry): Promise<void> {
    // In production, this would write to:
    // - Secure append-only database
    // - Immutable storage (blockchain, etc.)
    // - SIEM system
    // - Compliance logging service
    
    if (this.logSink) {
      // Implementation would depend on sink type
      console.log(`Writing audit entry to sink: ${this.logSink}`)
    }
  }

  /**
   * Set audit log sink
   */
  setLogSink(sink: string): void {
    this.logSink = sink
  }

  /**
   * Clear logs (use with caution - for testing only)
   */
  clearLogs(): void {
    console.warn('AUDIT LOGS CLEARED - This should only be used in testing')
    this.logs = []
  }

  /**
   * Get log statistics
   */
  getStatistics(): {
    totalLogs: number
    oldestLog: string | null
    newestLog: string | null
    logsByClassification: Record<string, number>
    averageLogsPerDay: number
  } {
    if (this.logs.length === 0) {
      return {
        totalLogs: 0,
        oldestLog: null,
        newestLog: null,
        logsByClassification: {},
        averageLogsPerDay: 0
      }
    }

    const sortedLogs = [...this.logs].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    const oldestLog = sortedLogs[0].timestamp
    const newestLog = sortedLogs[sortedLogs.length - 1].timestamp

    const logsByClassification: Record<string, number> = {}
    this.logs.forEach(log => {
      logsByClassification[log.classification] = (logsByClassification[log.classification] || 0) + 1
    })

    // Calculate average logs per day
    const oldestDate = new Date(oldestLog)
    const newestDate = new Date(newestLog)
    const daysDiff = Math.max(1, (newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24))
    const averageLogsPerDay = this.logs.length / daysDiff

    return {
      totalLogs: this.logs.length,
      oldestLog,
      newestLog,
      logsByClassification,
      averageLogsPerDay: Math.round(averageLogsPerDay * 100) / 100
    }
  }
}
