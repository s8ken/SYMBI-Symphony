import { MessageEnvelope } from '../types/agent-types'

export interface CostCheck {
  allowed: boolean
  reason?: string
  estimatedCost?: number
  estimatedLatency?: number
}

export interface UsageMetrics {
  totalCost: number
  totalRequests: number
  totalTokens: number
  averageLatency: number
  costByAgent: Record<string, number>
  requestsByAgent: Record<string, number>
}

export class CostGovernor {
  private usage: Map<string, {
    cost: number
    requests: number
    tokens: number
    latencies: number[]
    lastReset: Date
  }> = new Map()

  private limits = {
    maxCostPerAgent: 100.0, // USD per day
    maxRequestsPerMinute: 60,
    maxTokensPerRequest: 100000,
    maxLatencySeconds: 30
  }

  private pricing = {
    gpt4: {
      inputTokens: 0.00003, // per token
      outputTokens: 0.00006 // per token
    },
    gpt35: {
      inputTokens: 0.0000015,
      outputTokens: 0.000002
    }
  }

  constructor(customLimits?: Partial<typeof CostGovernor.prototype.limits>) {
    if (customLimits) {
      this.limits = { ...this.limits, ...customLimits }
    }
    
    // Reset usage metrics daily
    setInterval(() => this.resetDailyUsage(), 24 * 60 * 60 * 1000)
  }

  /**
   * Check if message is within cost and latency limits
   */
  async checkLimits(envelope: MessageEnvelope): Promise<CostCheck> {
    const agentId = envelope.origin
    const usage = this.getAgentUsage(agentId)

    // Check daily cost limit
    if (usage.cost >= this.limits.maxCostPerAgent) {
      return {
        allowed: false,
        reason: `Daily cost limit exceeded for agent ${agentId}: $${usage.cost.toFixed(2)}`
      }
    }

    // Check rate limiting (requests per minute)
    const recentRequests = this.getRecentRequests(agentId, 60) // last 60 seconds
    if (recentRequests >= this.limits.maxRequestsPerMinute) {
      return {
        allowed: false,
        reason: `Rate limit exceeded for agent ${agentId}: ${recentRequests} requests in last minute`
      }
    }

    // Estimate cost and latency for this request
    const estimation = this.estimateRequest(envelope)
    
    // Check if estimated cost would exceed limit
    if (usage.cost + estimation.estimatedCost > this.limits.maxCostPerAgent) {
      return {
        allowed: false,
        reason: `Request would exceed daily cost limit`,
        estimatedCost: estimation.estimatedCost
      }
    }

    // Check SLO requirements
    if (envelope.slo) {
      if (envelope.slo.cost_cap_usd && estimation.estimatedCost > envelope.slo.cost_cap_usd) {
        return {
          allowed: false,
          reason: `Estimated cost ($${estimation.estimatedCost.toFixed(4)}) exceeds SLO limit ($${envelope.slo.cost_cap_usd})`,
          estimatedCost: estimation.estimatedCost
        }
      }

      if (envelope.slo.latency_s && estimation.estimatedLatency > envelope.slo.latency_s) {
        return {
          allowed: false,
          reason: `Estimated latency (${estimation.estimatedLatency}s) exceeds SLO limit (${envelope.slo.latency_s}s)`,
          estimatedLatency: estimation.estimatedLatency
        }
      }
    }

    return {
      allowed: true,
      estimatedCost: estimation.estimatedCost,
      estimatedLatency: estimation.estimatedLatency
    }
  }

  /**
   * Record actual usage after request completion
   */
  recordUsage(agentId: string, metrics: {
    cost: number
    tokens: number
    latency: number
  }): void {
    const usage = this.getAgentUsage(agentId)
    
    usage.cost += metrics.cost
    usage.requests += 1
    usage.tokens += metrics.tokens
    usage.latencies.push(metrics.latency)

    // Keep only last 100 latency measurements for averaging
    if (usage.latencies.length > 100) {
      usage.latencies = usage.latencies.slice(-100)
    }

    this.usage.set(agentId, usage)
  }

  /**
   * Get usage metrics for an agent
   */
  getAgentUsage(agentId: string): {
    cost: number
    requests: number
    tokens: number
    latencies: number[]
    lastReset: Date
  } {
    if (!this.usage.has(agentId)) {
      this.usage.set(agentId, {
        cost: 0,
        requests: 0,
        tokens: 0,
        latencies: [],
        lastReset: new Date()
      })
    }
    return this.usage.get(agentId)!
  }

  /**
   * Get overall usage metrics
   */
  getOverallUsage(): UsageMetrics {
    let totalCost = 0
    let totalRequests = 0
    let totalTokens = 0
    let totalLatency = 0
    let latencyCount = 0
    const costByAgent: Record<string, number> = {}
    const requestsByAgent: Record<string, number> = {}

    for (const [agentId, usage] of this.usage) {
      totalCost += usage.cost
      totalRequests += usage.requests
      totalTokens += usage.tokens
      
      costByAgent[agentId] = usage.cost
      requestsByAgent[agentId] = usage.requests

      if (usage.latencies.length > 0) {
        const avgLatency = usage.latencies.reduce((sum, lat) => sum + lat, 0) / usage.latencies.length
        totalLatency += avgLatency * usage.latencies.length
        latencyCount += usage.latencies.length
      }
    }

    return {
      totalCost,
      totalRequests,
      totalTokens,
      averageLatency: latencyCount > 0 ? totalLatency / latencyCount : 0,
      costByAgent,
      requestsByAgent
    }
  }

  /**
   * Estimate cost and latency for a request
   */
  private estimateRequest(envelope: MessageEnvelope): {
    estimatedCost: number
    estimatedLatency: number
  } {
    // Estimate based on instruction length and complexity
    const instructionLength = envelope.instructions.length
    const estimatedInputTokens = Math.ceil(instructionLength / 4) // rough estimate: 4 chars per token
    const estimatedOutputTokens = Math.min(estimatedInputTokens * 0.5, 4000) // assume response is 50% of input, max 4k tokens

    // Use GPT-4 pricing as default (more expensive, safer estimate)
    const estimatedCost = 
      (estimatedInputTokens * this.pricing.gpt4.inputTokens) +
      (estimatedOutputTokens * this.pricing.gpt4.outputTokens)

    // Estimate latency based on token count and complexity
    const baseLatency = 2 // base 2 seconds
    const tokenLatency = (estimatedInputTokens + estimatedOutputTokens) / 1000 // 1 second per 1k tokens
    const complexityMultiplier = envelope.tools_allowed ? envelope.tools_allowed.length * 0.5 : 1
    
    const estimatedLatency = baseLatency + tokenLatency * complexityMultiplier

    return {
      estimatedCost: Math.max(0.001, estimatedCost), // minimum cost
      estimatedLatency: Math.min(estimatedLatency, this.limits.maxLatencySeconds)
    }
  }

  /**
   * Get recent request count for rate limiting
   */
  private getRecentRequests(agentId: string, windowSeconds: number): number {
    // This is a simplified implementation
    // In production, you'd use a sliding window or token bucket
    const usage = this.usage.get(agentId)
    if (!usage) return 0

    // For now, just check if we're within the window and return request count
    // A proper implementation would track timestamps of individual requests
    const now = new Date()
    const windowStart = new Date(now.getTime() - windowSeconds * 1000)
    
    // Simplified: assume all requests in current minute
    return usage.requests
  }

  /**
   * Reset daily usage metrics
   */
  private resetDailyUsage(): void {
    console.log('Resetting daily usage metrics')
    for (const [agentId, usage] of this.usage) {
      this.usage.set(agentId, {
        cost: 0,
        requests: 0,
        tokens: 0,
        latencies: [],
        lastReset: new Date()
      })
    }
  }

  /**
   * Set custom limits
   */
  setLimits(newLimits: Partial<typeof CostGovernor.prototype.limits>): void {
    this.limits = { ...this.limits, ...newLimits }
  }

  /**
   * Get current limits
   */
  getLimits(): typeof CostGovernor.prototype.limits {
    return { ...this.limits }
  }

  /**
   * Get cost breakdown by time period
   */
  getCostBreakdown(agentId?: string): {
    today: number
    thisWeek: number
    thisMonth: number
    byAgent: Record<string, number>
  } {
    // Simplified implementation - in production would track historical data
    const usage = agentId ? 
      (this.usage.get(agentId) ? { [agentId]: this.usage.get(agentId)! } : {}) :
      Object.fromEntries(this.usage)

    const today = Object.values(usage).reduce((sum, u) => sum + u.cost, 0)
    
    return {
      today,
      thisWeek: today, // simplified
      thisMonth: today, // simplified
      byAgent: Object.fromEntries(
        Object.entries(usage).map(([id, u]) => [id, u.cost])
      )
    }
  }

  /**
   * Check if agent is approaching limits
   */
  checkLimitWarnings(agentId: string): {
    costWarning: boolean
    rateWarning: boolean
    warnings: string[]
  } {
    const usage = this.getAgentUsage(agentId)
    const warnings: string[] = []
    
    const costPercentage = (usage.cost / this.limits.maxCostPerAgent) * 100
    const costWarning = costPercentage > 80

    if (costWarning) {
      warnings.push(`Cost usage at ${costPercentage.toFixed(1)}% of daily limit`)
    }

    const recentRequests = this.getRecentRequests(agentId, 60)
    const ratePercentage = (recentRequests / this.limits.maxRequestsPerMinute) * 100
    const rateWarning = ratePercentage > 80

    if (rateWarning) {
      warnings.push(`Rate usage at ${ratePercentage.toFixed(1)}% of per-minute limit`)
    }

    return {
      costWarning,
      rateWarning,
      warnings
    }
  }

  /**
   * Generate usage report
   */
  generateUsageReport(): {
    summary: UsageMetrics
    agentDetails: Record<string, {
      cost: number
      requests: number
      tokens: number
      averageLatency: number
      efficiency: number
    }>
    recommendations: string[]
  } {
    const summary = this.getOverallUsage()
    const agentDetails: Record<string, any> = {}
    const recommendations: string[] = []

    for (const [agentId, usage] of this.usage) {
      const avgLatency = usage.latencies.length > 0 
        ? usage.latencies.reduce((sum, lat) => sum + lat, 0) / usage.latencies.length
        : 0

      const efficiency = usage.requests > 0 ? usage.cost / usage.requests : 0

      agentDetails[agentId] = {
        cost: usage.cost,
        requests: usage.requests,
        tokens: usage.tokens,
        averageLatency: avgLatency,
        efficiency
      }

      // Generate recommendations
      if (efficiency > 0.1) {
        recommendations.push(`Agent ${agentId} has high cost per request ($${efficiency.toFixed(4)})`)
      }
      if (avgLatency > 10) {
        recommendations.push(`Agent ${agentId} has high average latency (${avgLatency.toFixed(2)}s)`)
      }
    }

    return {
      summary,
      agentDetails,
      recommendations
    }
  }
}
