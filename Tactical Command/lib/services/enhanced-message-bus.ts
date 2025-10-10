import { MessageBus } from './message-bus'
import { PolicyEngine } from './policy-engine'
import { CostGovernor } from './cost-governor'
import { AuditLogger } from './audit-logger'
import { MessageEnvelope } from '../types/agent-types'

export interface EnhancedMessageBusConfig {
  enablePolicyChecks?: boolean
  enableCostGovernance?: boolean
  enableAuditLogging?: boolean
  maxRetries?: number
  circuitBreakerThreshold?: number
  priorityQueue?: boolean
}

export interface PolicyCheckResult {
  allowed: boolean
  reason?: string
  violations?: string[]
}

export interface CostCheckResult {
  allowed: boolean
  estimatedCost?: number
  estimatedLatency?: number
  reason?: string
}

export interface MessageProcessingResult {
  success: boolean
  messageId: string
  policyCheck?: PolicyCheckResult
  costCheck?: CostCheckResult
  processingTime?: number
  error?: string
}

export class EnhancedMessageBus extends MessageBus {
  private policyEngine: PolicyEngine
  private costGovernor: CostGovernor
  private auditLogger: AuditLogger
  private config: Required<EnhancedMessageBusConfig>
  
  // Circuit breaker state
  private circuitBreakerState: Map<string, {
    failures: number
    lastFailure: Date
    isOpen: boolean
    nextRetry: Date
  }> = new Map()

  // Priority queues
  private priorityQueues: Map<number, MessageEnvelope[]> = new Map()
  private processingQueue: MessageEnvelope[] = []

  constructor(config: EnhancedMessageBusConfig = {}) {
    super()
    
    this.config = {
      enablePolicyChecks: true,
      enableCostGovernance: true,
      enableAuditLogging: true,
      maxRetries: 3,
      circuitBreakerThreshold: 5,
      priorityQueue: true,
      ...config
    }

    this.policyEngine = new PolicyEngine()
    this.costGovernor = new CostGovernor()
    this.auditLogger = new AuditLogger()
  }

  /**
   * Enhanced send method with policy and cost checks
   */
  async send(envelope: MessageEnvelope): Promise<MessageProcessingResult> {
    const startTime = Date.now()
    const messageId = envelope.id || this.generateMessageId()
    
    try {
      // Audit log entry
      if (this.config.enableAuditLogging) {
        await this.auditLogger.logMessage('RECEIVED', envelope)
      }

      // Policy checks
      let policyCheck: PolicyCheckResult | undefined
      if (this.config.enablePolicyChecks) {
        policyCheck = await this.performPolicyCheck(envelope)
        if (!policyCheck.allowed) {
          await this.handlePolicyViolation(envelope, policyCheck)
          return {
            success: false,
            messageId,
            policyCheck,
            error: policyCheck.reason
          }
        }
      }

      // Cost checks
      let costCheck: CostCheckResult | undefined
      if (this.config.enableCostGovernance) {
        costCheck = await this.performCostCheck(envelope)
        if (!costCheck.allowed) {
          await this.handleCostLimitExceeded(envelope, costCheck)
          return {
            success: false,
            messageId,
            costCheck,
            error: costCheck.reason
          }
        }
      }

      // Check circuit breaker
      if (this.isCircuitBreakerOpen(envelope.origin)) {
        return {
          success: false,
          messageId,
          error: 'Circuit breaker is open for agent'
        }
      }

      // Queue for processing
      await this.queueMessage(envelope)
      
      const processingTime = Date.now() - startTime
      
      // Audit log success
      if (this.config.enableAuditLogging) {
        await this.auditLogger.logMessage('ACCEPTED', envelope, {
          policyCheck,
          costCheck,
          processingTime
        })
      }

      return {
        success: true,
        messageId,
        policyCheck,
        costCheck,
        processingTime
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      await this.auditLogger.logMessage('ERROR', envelope, {
        error: errorMessage
      })

      return {
        success: false,
        messageId,
        error: errorMessage
      }
    }
  }

  /**
   * Perform comprehensive policy checks
   */
  private async performPolicyCheck(envelope: MessageEnvelope): Promise<PolicyCheckResult> {
    const violations: string[] = []

    // Check classification level
    if (envelope.classification) {
      const classificationCheck = await this.policyEngine.checkClassificationAccess(
        envelope.origin,
        envelope.classification as ClassificationLevel
      )
      if (!classificationCheck.allowed) {
        violations.push(`Classification access denied: ${classificationCheck.reason}`)
      }
    }

    // Check compartment access
    if (envelope.compartment) {
      const compartmentCheck = await this.policyEngine.checkCompartmentAccess(
        envelope.origin,
        envelope.compartment
      )
      if (!compartmentCheck.allowed) {
        violations.push(`Compartment access denied: ${compartmentCheck.reason}`)
      }
    }

    // Check need-to-know
    if (envelope.recipients && envelope.recipients.length > 0) {
      for (const recipient of envelope.recipients) {
        const needToKnowCheck = await this.policyEngine.checkNeedToKnow(
          envelope.origin,
          recipient,
          envelope.instructions
        )
        if (!needToKnowCheck.allowed) {
          violations.push(`Need-to-know violation for recipient ${recipient}: ${needToKnowCheck.reason}`)
        }
      }
    }

    // Check TLP protocol
    if (envelope.tlp) {
      const tlpCheck = await this.policyEngine.checkTLPCompliance(
        envelope.origin,
        envelope.tlp as TLPLevel,
        envelope.recipients || []
      )
      if (!tlpCheck.allowed) {
        violations.push(`TLP violation: ${tlpCheck.reason}`)
      }
    }

    // Check rate limiting
    const rateLimitCheck = await this.policyEngine.checkRateLimit(
      envelope.origin,
      'send_message'
    )
    if (!rateLimitCheck.allowed) {
      violations.push(`Rate limit exceeded: ${rateLimitCheck.reason}`)
    }

    return {
      allowed: violations.length === 0,
      reason: violations.length > 0 ? 'Policy violations detected' : undefined,
      violations
    }
  }

  /**
   * Perform cost and latency checks
   */
  private async performCostCheck(envelope: MessageEnvelope): Promise<CostCheckResult> {
    const costCheck = await this.costGovernor.checkLimits(envelope)
    
    return {
      allowed: costCheck.allowed,
      estimatedCost: costCheck.estimatedCost,
      estimatedLatency: costCheck.estimatedLatency,
      reason: costCheck.reason
    }
  }

  /**
   * Queue message with priority support
   */
  private async queueMessage(envelope: MessageEnvelope): Promise<void> {
    if (this.config.priorityQueue && envelope.priority !== undefined) {
      const priority = envelope.priority
      if (!this.priorityQueues.has(priority)) {
        this.priorityQueues.set(priority, [])
      }
      this.priorityQueues.get(priority)!.push(envelope)
      
      // Sort priorities and process highest first
      const sortedPriorities = Array.from(this.priorityQueues.keys()).sort((a, b) => b - a)
      for (const priority of sortedPriorities) {
        const queue = this.priorityQueues.get(priority)!
        while (queue.length > 0) {
          const message = queue.shift()!
          await super.send(message)
        }
      }
    } else {
      await super.send(envelope)
    }
  }

  /**
   * Handle policy violations
   */
  private async handlePolicyViolation(
    envelope: MessageEnvelope,
    policyCheck: PolicyCheckResult
  ): Promise<void> {
    await this.auditLogger.logMessage('POLICY_VIOLATION', envelope, {
      violations: policyCheck.violations,
      reason: policyCheck.reason
    })

    // Notify administrators
    console.warn(`Policy violation by agent ${envelope.origin}:`, policyCheck.violations)
  }

  /**
   * Handle cost limit exceeded
   */
  private async handleCostLimitExceeded(
    envelope: MessageEnvelope,
    costCheck: CostCheckResult
  ): Promise<void> {
    await this.auditLogger.logMessage('COST_LIMIT_EXCEEDED', envelope, {
      estimatedCost: costCheck.estimatedCost,
      estimatedLatency: costCheck.estimatedLatency,
      reason: costCheck.reason
    })

    // Notify administrators
    console.warn(`Cost limit exceeded for agent ${envelope.origin}:`, costCheck.reason)
  }

  /**
   * Circuit breaker management
   */
  private isCircuitBreakerOpen(agentId: string): boolean {
    const state = this.circuitBreakerState.get(agentId)
    if (!state) return false

    if (state.isOpen) {
      if (new Date() < state.nextRetry) {
        return true
      } else {
        // Half-open state - allow one request
        state.isOpen = false
        state.failures = 0
      }
    }

    return false
  }

  /**
   * Record failure for circuit breaker
   */
  recordFailure(agentId: string): void {
    let state = this.circuitBreakerState.get(agentId)
    if (!state) {
      state = {
        failures: 0,
        lastFailure: new Date(),
        isOpen: false,
        nextRetry: new Date()
      }
    }

    state.failures++
    state.lastFailure = new Date()

    if (state.failures >= this.config.circuitBreakerThreshold) {
      state.isOpen = true
      state.nextRetry = new Date(Date.now() + 60000) // 1 minute
    }

    this.circuitBreakerState.set(agentId, state)
  }

  /**
   * Record success for circuit breaker
   */
  recordSuccess(agentId: string): void {
    const state = this.circuitBreakerState.get(agentId)
    if (state) {
      state.failures = 0
      state.isOpen = false
    }
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): {
    totalMessages: number
    policyViolations: number
    costLimitExceeded: number
    circuitBreakers: Record<string, any>
    agentStats: Record<string, {
      messages: number
      cost: number
      violations: number
    }>
  } {
    const agentStats: Record<string, any> = {}
    
    // This would need to be implemented based on actual usage tracking
    return {
      totalMessages: 0,
      policyViolations: 0,
      costLimitExceeded: 0,
      circuitBreakers: Object.fromEntries(this.circuitBreakerState),
      agentStats
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get cost governor instance for external access
   */
  getCostGovernor(): CostGovernor {
    return this.costGovernor
  }

  /**
   * Get policy engine instance for external access
   */
  getPolicyEngine(): PolicyEngine {
    return this.policyEngine
  }

  /**
   * Get audit logger instance for external access
   */
  getAuditLogger(): AuditLogger {
    return this.auditLogger
  }
}
