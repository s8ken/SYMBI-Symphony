import { PolicyEngine, PolicyResult, PolicyContext } from './policy-engine'
import { CostGovernor, CostCheck } from './cost-governor'
import { MessageEnvelope } from '../types/agent-types'
import { Compartment, TLPLevel } from '../types/symbi-types'
import { Logger } from './logger'
import { MetricsCollector } from './metrics-collector'
import { CacheManager } from './cache-manager'
import { CircuitBreaker } from './circuit-breaker'

export interface CostAwarePolicyResult extends PolicyResult {
  costCheck?: CostCheck
  estimatedCost?: number
  estimatedLatency?: number
  budgetRemaining?: number
  performanceMetrics?: {
    cacheHit?: boolean
    processingTime?: number
    circuitBreakerStatus?: string
  }
}

export interface CostAwarePolicyContext extends PolicyContext {
  costGovernor: CostGovernor
  envelope?: MessageEnvelope
  budgetLimit?: number
  performanceContext?: {
    useCache?: boolean
    bypassCircuitBreaker?: boolean
  }
}

export interface PolicyPerformanceMetrics {
  policyName: string
  executionTime: number
  cacheHit: boolean
  costImpact: number
  success: boolean
}

export class EnhancedPolicyEngine extends PolicyEngine {
  private costGovernor: CostGovernor
  private logger: Logger
  private metrics: MetricsCollector
  private cache: CacheManager
  private circuitBreaker: CircuitBreaker
  private budgetLimits: Map<string, number> = new Map()
  private performanceMetrics: Map<string, PolicyPerformanceMetrics[]> = new Map()
  private readonly CACHE_TTL = 300000 // 5 minutes
  private readonly MAX_METRICS_HISTORY = 1000

  constructor(costGovernor: CostGovernor) {
    super()
    this.costGovernor = costGovernor
    this.logger = new Logger('EnhancedPolicyEngine')
    this.metrics = new MetricsCollector()
    this.cache = new CacheManager()
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 30000,
      monitoringPeriod: 60000
    })
    
    // Initialize cost-aware policies
    this.initializeCostAwarePolicies()
    this.initializePerformanceMonitoring()
  }

  /**
   * Initialize cost-aware policy functions
   */
  private initializeCostAwarePolicies(): void {
    // Cost-based classification policy
    this.addPolicy('cost-classification', this.costClassificationPolicy.bind(this))
    
    // Budget-aware compartment access policy
    this.addPolicy('budget-compartment-access', this.budgetCompartmentAccessPolicy.bind(this))
    
    // Cost-optimized need-to-know policy
    this.addPolicy('cost-need-to-know', this.costNeedToKnowPolicy.bind(this))
    
    // TLP cost enforcement policy
    this.addPolicy('tlp-cost-enforcement', this.tlpCostEnforcementPolicy.bind(this))
    
    // Rate limiting with cost consideration
    this.addPolicy('cost-rate-limit', this.costRateLimitPolicy.bind(this))
    
    // Performance-optimized data access policy
    this.addPolicy('performance-data-access', this.performanceDataAccessPolicy.bind(this))
    
    // Circuit breaker aware policy
    this.addPolicy('circuit-breaker-aware', this.circuitBreakerAwarePolicy.bind(this))
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    this.metrics.registerMetric('policy_execution_time', 'histogram')
    this.metrics.registerMetric('policy_cache_hit_rate', 'gauge')
    this.metrics.registerMetric('policy_cost_impact', 'histogram')
    this.metrics.registerMetric('policy_failure_rate', 'gauge')
  }

  /**
   * Override evaluate to include cost checking and performance optimization
   */
  async evaluate(
    action: string,
    context: CostAwarePolicyContext,
    additionalContext?: any
  ): Promise<CostAwarePolicyResult> {
    const startTime = Date.now()
    const cacheKey = this.generateCacheKey(action, context)
    
    try {
      // Check cache first
      if (context.performanceContext?.useCache !== false) {
        const cached = await this.cache.get<CostAwarePolicyResult>(cacheKey)
        if (cached) {
          this.recordMetrics(action, Date.now() - startTime, true, 0, true)
          return {
            ...cached,
            performanceMetrics: {
              cacheHit: true,
              processingTime: Date.now() - startTime
            }
          }
        }
      }

      // Check circuit breaker
      if (!context.performanceContext?.bypassCircuitBreaker && !this.circuitBreaker.isClosed()) {
        return {
          allowed: false,
          reason: 'Circuit breaker is open - policy evaluation temporarily disabled',
          performanceMetrics: {
            cacheHit: false,
            processingTime: Date.now() - startTime,
            circuitBreakerStatus: this.circuitBreaker.getState()
          }
        }
      }

      // First, check cost limits if envelope is provided
      let costCheck: CostCheck | undefined
      
      if (context.envelope) {
        costCheck = await this.costGovernor.checkLimits(context.envelope)
        
        if (!costCheck.allowed) {
          this.recordMetrics(action, Date.now() - startTime, false, costCheck.estimatedCost || 0, false)
          return {
            allowed: false,
            reason: costCheck.reason || 'Cost limit exceeded',
            costCheck,
            estimatedCost: costCheck.estimatedCost,
            estimatedLatency: costCheck.estimatedLatency,
            performanceMetrics: {
              cacheHit: false,
              processingTime: Date.now() - startTime
            }
          }
        }
      }

      // Evaluate standard policies with circuit breaker protection
      const baseResult = await this.circuitBreaker.execute(async () => {
        return await super.evaluate(action, context, additionalContext)
      })

      // Calculate budget remaining
      let budgetRemaining: number | undefined
      if (context.agentId && this.budgetLimits.has(context.agentId)) {
        const totalCost = this.costGovernor.getAgentUsage(context.agentId).cost
        budgetRemaining = this.budgetLimits.get(context.agentId)! - totalCost
      }

      const result: CostAwarePolicyResult = {
        ...baseResult,
        costCheck,
        estimatedCost: costCheck?.estimatedCost,
        estimatedLatency: costCheck?.estimatedLatency,
        budgetRemaining,
        performanceMetrics: {
          cacheHit: false,
          processingTime: Date.now() - startTime,
          circuitBreakerStatus: this.circuitBreaker.getState()
        }
      }

      // Cache successful results
      if (result.allowed) {
        await this.cache.set(cacheKey, result, this.CACHE_TTL)
      }

      this.recordMetrics(action, Date.now() - startTime, false, costCheck?.estimatedCost || 0, result.allowed)
      
      return result

    } catch (error) {
      this.logger.error('Policy evaluation failed', { action, error: error.message })
      this.recordMetrics(action, Date.now() - startTime, false, 0, false)
      
      return {
        allowed: false,
        reason: 'Policy evaluation error',
        performanceMetrics: {
          cacheHit: false,
          processingTime: Date.now() - startTime,
          circuitBreakerStatus: this.circuitBreaker.getState()
        }
      }
    }
  }

  /**
   * Generate cache key for policy evaluation
   */
  private generateCacheKey(action: string, context: CostAwarePolicyContext): string {
    const keyParts = [
      action,
      context.agentId,
      context.compartment?.id,
      context.classificationLevel,
      context.tlpLevel,
      context.envelope?.messageId
    ].filter(Boolean)
    
    return `policy:${keyParts.join(':')}`
  }

  /**
   * Record performance metrics
   */
  private recordMetrics(
    policyName: string,
    executionTime: number,
    cacheHit: boolean,
    costImpact: number,
    success: boolean
  ): void {
    this.metrics.record('policy_execution_time', executionTime)
    this.metrics.record('policy_cache_hit_rate', cacheHit ? 1 : 0)
    this.metrics.record('policy_cost_impact', costImpact)
    this.metrics.record('policy_failure_rate', success ? 0 : 1)

    // Store detailed metrics
    if (!this.performanceMetrics.has(policyName)) {
      this.performanceMetrics.set(policyName, [])
    }
    
    const metrics = this.performanceMetrics.get(policyName)!
    metrics.push({
      policyName,
      executionTime,
      cacheHit,
      costImpact,
      success
    })
    
    // Keep only recent metrics
    if (metrics.length > this.MAX_METRICS_HISTORY) {
      metrics.shift()
    }
  }

  /**
   * Cost-based classification policy
   * Restricts classification levels based on cost thresholds
   */
  private async costClassificationPolicy(
    action: string,
    context: CostAwarePolicyContext
  ): Promise<CostAwarePolicyResult> {
    if (action !== 'classify') {
      return { allowed: true }
    }

    const estimatedCost = context.envelope ? 
      (await this.costGovernor.checkLimits(context.envelope))?.estimatedCost || 0 : 0
    
    // Dynamic cost thresholds based on agent budget
    const agentBudget = context.agentId ? this.budgetLimits.get(context.agentId) : undefined
    const costThreshold = agentBudget ? Math.min(0.5, agentBudget * 0.1) : 0.5
    
    // Restrict classification based on cost
    if (estimatedCost > costThreshold && context.classificationLevel === 'TOP_SECRET') {
      return {
        allowed: false,
        reason: `High cost operation (${estimatedCost.toFixed(3)}) restricted for TOP_SECRET classification (threshold: ${costThreshold})`
      }
    }

    return { allowed: true }
  }

  /**
   * Budget-aware compartment access policy
   * Restricts compartment access based on remaining budget
   */
  private async budgetCompartmentAccessPolicy(
    action: string,
    context: CostAwarePolicyContext
  ): Promise<CostAwarePolicyResult> {
    if (action !== 'access-compartment') {
      return { allowed: true }
    }

    const agentId = context.agentId
    if (!agentId || !this.budgetLimits.has(agentId)) {
      return { allowed: true }
    }

    const budgetLimit = this.budgetLimits.get(agentId)!
    const currentUsage = this.costGovernor.getAgentUsage(agentId)
    const remainingBudget = budgetLimit - currentUsage.cost

    // Dynamic sensitivity threshold based on remaining budget
    const sensitivityThreshold = remainingBudget < 5 ? 'medium' : 'high'
    
    if (remainingBudget < 10 && context.compartment?.sensitivity === sensitivityThreshold) {
      return {
        allowed: false,
        reason: `Insufficient budget for ${sensitivityThreshold}-sensitivity compartment. Remaining: $${remainingBudget.toFixed(2)}`
      }
    }

    return { allowed: true }
  }

  /**
   * Cost-optimized need-to-know policy
   * Implements need-to-know with cost considerations
   */
  private async costNeedToKnowPolicy(
    action: string,
    context: CostAwarePolicyContext
  ): Promise<CostAwarePolicyResult> {
    if (action !== 'access-data') {
      return { allowed: true }
    }

    const estimatedCost = context.envelope ? 
      (await this.costGovernor.checkLimits(context.envelope))?.estimatedCost || 0 : 0
    
    // For high-cost operations, require explicit justification and approval
    const costThreshold = context.agentId ? 
      (this.budgetLimits.get(context.agentId) || 100) * 0.05 : 1.0
    
    if (estimatedCost > costThreshold) {
      if (!context.justification || context.justification.length < 50) {
        return {
          allowed: false,
          reason: `High-cost data access (${estimatedCost.toFixed(3)}) requires detailed justification (min 50 chars)`
        }
      }
      
      // Additional approval for very high costs
      if (estimatedCost > costThreshold * 2) {
        return {
          allowed: false,
          reason: `Very high-cost operation (${estimatedCost.toFixed(3)}) requires manager approval`,
          metadata: { requiresApproval: true }
        }
      }
    }

    return { allowed: true }
  }

  /**
   * TLP cost enforcement policy
   * Enforces TLP levels with cost-based restrictions
   */
  private async tlpCostEnforcementPolicy(
    action: string,
    context: CostAwarePolicyContext
  ): Promise<CostAwarePolicyResult> {
    if (action !== 'share-tlp') {
      return { allowed: true }
    }

    const estimatedCost = context.envelope ? 
      (await this.costGovernor.checkLimits(context.envelope))?.estimatedCost || 0 : 0
    
    // Dynamic TLP cost thresholds
    const agentBudget = context.agentId ? this.budgetLimits.get(context.agentId) : undefined
    const tlpThreshold = agentBudget ? Math.min(2.0, agentBudget * 0.02) : 2.0
    
    if (context.tlpLevel === TLPLevel.RED && estimatedCost > tlpThreshold) {
      return {
        allowed: false,
        reason: `TLP RED sharing blocked for high-cost operation (${estimatedCost.toFixed(3)} > ${tlpThreshold})`
      }
    }

    return { allowed: true }
  }

  /**
   * Rate limiting with cost consideration
   * Implements rate limiting that considers both requests and cost
   */
  private async costRateLimitPolicy(
    action: string,
    context: CostAwarePolicyContext
  ): Promise<CostAwarePolicyResult> {
    if (action !== 'send-message') {
      return { allowed: true }
    }

    const agentId = context.agentId
    if (!agentId) {
      return { allowed: true }
    }

    const usage = this.costGovernor.getAgentUsage(agentId)
    const limits = this.costGovernor.getLimits()
    
    // Check rate limits
    const rateWarning = usage.requests >= limits.maxRequestsPerMinute * 0.8
    const costWarning = usage.cost >= limits.maxCostPerAgent * 0.8
    
    if (rateWarning || costWarning) {
      const warnings = []
      if (rateWarning) warnings.push(`Rate limit approaching: ${usage.requests}/${limits.maxRequestsPerMinute}`)
      if (costWarning) warnings.push(`Cost limit approaching: $${usage.cost.toFixed(2)}/$${limits.maxCostPerAgent}`)
      
      return {
        allowed: true,
        warnings,
        metadata: {
          rateUsage: usage.requests,
          rateLimit: limits.maxRequestsPerMinute,
          costUsage: usage.cost,
          costLimit: limits.maxCostPerAgent
        }
      }
    }

    return { allowed: true }
  }

  /**
   * Performance-optimized data access policy
   * Optimizes data access patterns based on performance metrics
   */
  private async performanceDataAccessPolicy(
    action: string,
    context: CostAwarePolicyContext
  ): Promise<CostAwarePolicyResult> {
    if (action !== 'access-data') {
      return { allowed: true }
    }

    // Check performance history for this data type
    const dataType = context.dataType || 'default'
    const metrics = this.performanceMetrics.get(dataType) || []
    
    if (metrics.length > 0) {
      const avgExecutionTime = metrics.reduce((sum, m) => sum + m.executionTime, 0) / metrics.length
      const failureRate = metrics.filter(m => !m.success).length / metrics.length
      
      // Recommend caching for slow operations
      if (avgExecutionTime > 1000 && failureRate < 0.1) {
        return {
          allowed: true,
          metadata: {
            recommendation: 'enable-caching',
            avgExecutionTime,
            failureRate
          }
        }
      }
      
      // Block if failure rate is too high
      if (failureRate > 0.3) {
        return {
          allowed: false,
          reason: `High failure rate (${(failureRate * 100).toFixed(1)}%) for data type ${dataType}`
        }
      }
    }

    return { allowed: true }
  }

  /**
   * Circuit breaker aware policy
   * Makes decisions based on circuit breaker state
   */
  private async circuitBreakerAwarePolicy(
    action: string,
    context: CostAwarePolicyContext
  ): Promise<CostAwarePolicyResult> {
    const state = this.circuitBreaker.getState()
    
    if (state === 'open') {
      return {
        allowed: false,
        reason: 'Circuit breaker is open - system under stress',
        metadata: { circuitBreakerState: state }
      }
    }
    
    if (state === 'half-open') {
      return {
        allowed: true,
        warnings: ['System recovering - expect degraded performance'],
        metadata: { circuitBreakerState: state }
      }
    }

    return { allowed: true }
  }

  /**
   * Set budget limit for an agent
   */
  setAgentBudget(agentId: string, budget: number): void {
    this.budgetLimits.set(agentId, budget)
    this.logger.info(`Set budget for agent ${agentId}: $${budget}`)
  }

  /**
   * Get agent budget information
   */
  getAgentBudgetInfo(agentId: string): {
    budget: number
    used: number
    remaining: number
    percentage: number
    lastUpdated: Date
  } | null {
    if (!this.budgetLimits.has(agentId)) {
      return null
    }

    const budget = this.budgetLimits.get(agentId)!
    const usage = this.costGovernor.getAgentUsage(agentId)
    const remaining = Math.max(0, budget - usage.cost)
    const percentage = (usage.cost / budget) * 100

    return {
      budget,
      used: usage.cost,
      remaining,
      percentage,
      lastUpdated: new Date()
    }
  }

  /**
   * Get comprehensive cost usage report
   */
  getCostUsageReport(): {
    agents: Record<string, {
      budget: number
      used: number
      remaining: number
      percentage: number
      lastUpdated: Date
    }>
    totalBudget: number
    totalUsed: number
    totalRemaining: number
    recommendations: string[]
    performanceMetrics: {
      averagePolicyExecutionTime: number
      cacheHitRate: number
      circuitBreakerStatus: string
    }
  } {
    const agents: Record<string, any> = {}
    let totalBudget = 0
    let totalUsed = 0

    for (const [agentId, budget] of this.budgetLimits) {
      const info = this.getAgentBudgetInfo(agentId)
      if (info) {
        agents[agentId] = info
        totalBudget += budget
        totalUsed += info.used
      }
    }

    const costReport = this.costGovernor.generateUsageReport()
    
    // Calculate performance metrics
    const allMetrics = Array.from(this.performanceMetrics.values()).flat()
    const avgExecutionTime = allMetrics.length > 0 
      ? allMetrics.reduce((sum, m) => sum + m.executionTime, 0) / allMetrics.length 
      : 0
    
    const cacheHitRate = allMetrics.length > 0
      ? allMetrics.filter(m => m.cacheHit).length / allMetrics.length
      : 0

    return {
      agents,
      totalBudget,
      totalUsed,
      totalRemaining: totalBudget - totalUsed,
      recommendations: costReport.recommendations,
      performanceMetrics: {
        averagePolicyExecutionTime: avgExecutionTime,
        cacheHitRate,
        circuitBreakerStatus: this.circuitBreaker.getState()
      }
    }
  }

  /**
   * Get performance metrics for a specific policy
   */
  getPolicyPerformanceMetrics(policyName: string): PolicyPerformanceMetrics[] {
    return this.performanceMetrics.get(policyName) || []
  }

  /**
   * Get system health status
   */
  getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy'
    circuitBreaker: string
    cacheHitRate: number
    averageLatency: number
    activePolicies: number
  } {
    const allMetrics = Array.from(this.performanceMetrics.values()).flat()
    const avgLatency = allMetrics.length > 0 
      ? allMetrics.reduce((sum, m) => sum + m.executionTime, 0) / allMetrics.length 
      : 0
    
    const cacheHitRate = allMetrics.length > 0
      ? allMetrics.filter(m => m.cacheHit).length / allMetrics.length
      : 0

    const circuitBreakerState = this.circuitBreaker.getState()
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    
    if (circuitBreakerState === 'open') {
      status = 'unhealthy'
    } else if (avgLatency > 2000 || cacheHitRate < 0.5) {
      status = 'degraded'
    }

    return {
      status,
      circuitBreaker: circuitBreakerState,
      cacheHitRate,
      averageLatency: avgLatency,
      activePolicies: this.performanceMetrics.size
    }
  }

  /**
   * Update cost limits
   */
  updateCostLimits(newLimits: Parameters<CostGovernor['setLimits']>[0]): void {
    this.costGovernor.setLimits(newLimits)
    this.logger.info('Updated cost limits', newLimits)
  }

  /**
   * Clear cache for specific policies or all
   */
  async clearCache(pattern?: string): Promise<void> {
    if (pattern) {
      await this.cache.deletePattern(`policy:${pattern}`)
    } else {
      await this.cache.clear()
    }
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset()
    this.logger.info('Circuit breaker reset')
  }
}
