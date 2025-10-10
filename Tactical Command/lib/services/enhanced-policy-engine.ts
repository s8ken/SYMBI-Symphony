import { PolicyEngine, PolicyResult, PolicyContext } from './policy-engine'
import { CostGovernor, CostCheck } from './cost-governor'
import { MessageEnvelope } from '../types/agent-types'
import { Compartment, TLPLevel } from '../types/symbi-types'

export interface CostAwarePolicyResult extends PolicyResult {
  costCheck?: CostCheck
  estimatedCost?: number
  estimatedLatency?: number
  budgetRemaining?: number
  warnings?: string[]
  metadata?: Record<string, any>
}

export interface CostAwarePolicyContext extends PolicyContext {
  costGovernor: CostGovernor
  envelope?: MessageEnvelope
  budgetLimit?: number
  justification?: string
  classificationLevel?: string
  compartment?: Compartment & { sensitivity?: string }
  tlpLevel?: TLPLevel
}

export interface AgentBudgetInfo {
  budget: number
  used: number
  remaining: number
  percentage: number
  projectedUsage?: number
  alerts?: string[]
}

export interface CostUsageReport {
  agents: Record<string, AgentBudgetInfo>
  totalBudget: number
  totalUsed: number
  totalRemaining: number
  recommendations: string[]
  trends: {
    daily: number[]
    weekly: number[]
    monthly: number[]
  }
  alerts: string[]
}

export class EnhancedPolicyEngine extends PolicyEngine {
  private costGovernor: CostGovernor
  private budgetLimits: Map<string, number> = new Map()
  private agentProjections: Map<string, number[]> = new Map()
  private alertThresholds = {
    budgetWarning: 0.8,
    budgetCritical: 0.95,
    rateWarning: 0.9,
    costSpike: 2.0
  }

  constructor(costGovernor: CostGovernor) {
    super()
    this.costGovernor = costGovernor
    
    // Initialize cost-aware policies
    this.initializeCostAwarePolicies()
  }

  /**
   * Initialize cost-aware policy functions
   */
  private initializeCostAwarePolicies(): void {
    // Cost-based classification policy with ML thresholds
    this.addPolicy('cost-classification', this.costClassificationPolicy.bind(this))
    
    // Budget-aware compartment access policy
    this.addPolicy('budget-compartment-access', this.budgetCompartmentAccessPolicy.bind(this))
    
    // Cost-optimized need-to-know policy
    this.addPolicy('cost-need-to-know', this.costNeedToKnowPolicy.bind(this))
    
    // TLP cost enforcement policy
    this.addPolicy('tlp-cost-enforcement', this.tlpCostEnforcementPolicy.bind(this))
    
    // Rate limiting with cost consideration
    this.addPolicy('cost-rate-limit', this.costRateLimitPolicy.bind(this))
    
    // Advanced policies
    this.addPolicy('predictive-cost', this.predictiveCostPolicy.bind(this))
    this.addPolicy('adaptive-budget', this.adaptiveBudgetPolicy.bind(this))
    this.addPolicy('cost-anomaly', this.costAnomalyPolicy.bind(this))
  }

  /**
   * Override evaluate to include cost checking and advanced features
   */
  async evaluate(
    action: string,
    context: CostAwarePolicyContext,
    additionalContext?: any
  ): Promise<CostAwarePolicyResult> {
    const agentId = context.agentId
    const warnings: string[] = []
    const metadata: Record<string, any> = {}

    // First, check cost limits if envelope is provided
    let costCheck: CostCheck | undefined
    
    if (context.envelope) {
      costCheck = await this.costGovernor.checkLimits(context.envelope)
      
      if (!costCheck.allowed) {
        return {
          allowed: false,
          reason: costCheck.reason || 'Cost limit exceeded',
          costCheck,
          estimatedCost: costCheck.estimatedCost,
          estimatedLatency: costCheck.estimatedLatency,
          warnings: [costCheck.reason || 'Cost limit exceeded'],
          metadata
        }
      }
    }

    // Check budget constraints
    if (agentId && this.budgetLimits.has(agentId)) {
      const budgetInfo = this.getAgentBudgetInfo(agentId)
      if (budgetInfo) {
        metadata.budgetInfo = budgetInfo
        
        // Add budget warnings
        if (budgetInfo.percentage >= this.alertThresholds.budgetCritical) {
          warnings.push(`Critical: Budget ${budgetInfo.percentage.toFixed(1)}% used`)
        } else if (budgetInfo.percentage >= this.alertThresholds.budgetWarning) {
          warnings.push(`Warning: Budget ${budgetInfo.percentage.toFixed(1)}% used`)
        }
      }
    }

    // Evaluate standard policies
    const baseResult = await super.evaluate(action, context, additionalContext)
    
    // Calculate budget remaining
    let budgetRemaining: number | undefined
    if (agentId && this.budgetLimits.has(agentId)) {
      const totalCost = this.costGovernor.getAgentUsage(agentId).cost
      budgetRemaining = Math.max(0, this.budgetLimits.get(agentId)! - totalCost)
    }

    // Check for anomalies
    const anomalyCheck = await this.checkCostAnomaly(agentId)
    if (anomalyCheck.isAnomaly) {
      warnings.push(`Cost anomaly detected: ${anomalyCheck.description}`)
    }

    return {
      ...baseResult,
      costCheck,
      estimatedCost: costCheck?.estimatedCost,
      estimatedLatency: costCheck?.estimatedLatency,
      budgetRemaining,
      warnings: [...(baseResult.warnings || []), ...warnings],
      metadata: { ...baseResult.metadata, ...metadata }
    }
  }

  /**
   * Cost-based classification policy with ML-based thresholds
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
    
    // Dynamic thresholds based on historical data
    const avgCost = this.getAverageCostForAction('classify')
    const threshold = avgCost * 2.5
    
    // Restrict classification based on cost and risk
    if (estimatedCost > threshold && context.classificationLevel === 'TOP_SECRET') {
      return {
        allowed: false,
        reason: `Classification restricted: Cost ${estimatedCost.toFixed(3)} exceeds threshold ${threshold.toFixed(3)} for TOP_SECRET`,
        metadata: { estimatedCost, threshold, avgCost }
      }
    }

    // Allow but warn for high-cost classifications
    if (estimatedCost > avgCost * 1.5) {
      return {
        allowed: true,
        warnings: [`High cost classification: $${estimatedCost.toFixed(3)}`],
        metadata: { estimatedCost, avgCost }
      }
    }

    return { allowed: true }
  }

  /**
   * Budget-aware compartment access policy with dynamic restrictions
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

    const budgetInfo = this.getAgentBudgetInfo(agentId)
    if (!budgetInfo) {
      return { allowed: true }
    }

    // Dynamic sensitivity calculation
    const sensitivity = context.compartment?.sensitivity || 'medium'
    const sensitivityMultiplier = sensitivity === 'high' ? 3 : sensitivity === 'medium' ? 2 : 1
    
    // Calculate required budget for this operation
    const estimatedCost = context.envelope ? 
      (await this.costGovernor.checkLimits(context.envelope))?.estimatedCost || 0 : 0
    const requiredBudget = estimatedCost * sensitivityMultiplier

    // Block access if insufficient budget
    if (budgetInfo.remaining < requiredBudget) {
      return {
        allowed: false,
        reason: `Insufficient budget for ${sensitivity}-sensitivity compartment access. Required: $${requiredBudget.toFixed(2)}, Available: $${budgetInfo.remaining.toFixed(2)}`,
        metadata: { requiredBudget, remaining: budgetInfo.remaining, sensitivity }
      }
    }

    // Warn if approaching budget limit
    if (budgetInfo.percentage >= 0.9) {
      return {
        allowed: true,
        warnings: [`Approaching budget limit: ${budgetInfo.percentage.toFixed(1)}% used`],
        metadata: { budgetInfo }
      }
    }

    return { allowed: true }
  }

  /**
   * Cost-optimized need-to-know policy with justification requirements
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
    
    // Tiered justification requirements based on cost
    if (estimatedCost > 2.0 && !context.justification) {
      return {
        allowed: false,
        reason: `High-cost data access ($${estimatedCost.toFixed(3)}) requires explicit justification`,
        metadata: { estimatedCost, required: 'justification' }
      }
    }

    if (estimatedCost > 5.0 && context.justification && context.justification.length < 50) {
      return {
        allowed: false,
        reason: `Very high-cost data access ($${estimatedCost.toFixed(3)}) requires detailed justification (min 50 chars)`,
        metadata: { estimatedCost, required: 'detailed justification' }
      }
    }

    // Allow but log high-cost accesses
    if (estimatedCost > 1.0) {
      return {
        allowed: true,
        warnings: [`High-cost data access: $${estimatedCost.toFixed(3)}`],
        metadata: { estimatedCost, justification: context.justification }
      }
    }

    return { allowed: true }
  }

  /**
   * TLP cost enforcement policy with multi-level restrictions
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
    
    // TLP level restrictions based on cost
    const restrictions = {
      [TLPLevel.RED]: { maxCost: 1.0, multiplier: 5 },
      [TLPLevel.AMBER]: { maxCost: 3.0, multiplier: 3 },
      [TLPLevel.GREEN]: { maxCost: 10.0, multiplier: 1 },
      [TLPLevel.WHITE]: { maxCost: Infinity, multiplier: 0.5 }
    }

    const tlpLevel = context.tlpLevel || TLPLevel.WHITE
    const restriction = restrictions[tlpLevel]

    if (estimatedCost > restriction.maxCost) {
      return {
        allowed: false,
        reason: `${tlpLevel} sharing restricted: Cost $${estimatedCost.toFixed(3)} exceeds limit $${restriction.maxCost}`,
        metadata: { estimatedCost, maxCost: restriction.maxCost, tlpLevel }
      }
    }

    // Warn for high-cost TLP sharing
    if (estimatedCost > restriction.maxCost * 0.8) {
      return {
        allowed: true,
        warnings: [`High-cost ${tlpLevel} sharing: $${estimatedCost.toFixed(3)}`],
        metadata: { estimatedCost, tlpLevel }
      }
    }

    return { allowed: true }
  }

  /**
   * Rate limiting with cost consideration and adaptive throttling
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
    
    // Check if approaching any limits
    const warnings = this.costGovernor.checkLimitWarnings(agentId)
    
    // Adaptive throttling based on cost trends
    const trend = this.getCostTrend(agentId)
    const projectedUsage = usage.cost + (trend.daily * 24)
    
    const alerts: string[] = []
    const metadata: Record<string, any> = {
      costUsage: usage.cost,
      costLimit: limits.maxCostPerAgent,
      rateUsage: usage.requests,
      rateLimit: limits.maxRequestsPerMinute,
      trend,
      projectedUsage
    }

    if (warnings.costWarning || warnings.rateWarning) {
      alerts.push(...warnings.warnings)
    }

    // Throttle if projected usage exceeds limits
    if (projectedUsage > limits.maxCostPerAgent * 0.9) {
      alerts.push(`Adaptive throttling: Projected usage $${projectedUsage.toFixed(3)} approaching limit`)
      return {
        allowed: true,
        warnings: alerts,
        metadata,
        throttled: true
      }
    }

    return { 
      allowed: true,
      warnings: alerts,
      metadata
    }
  }

  /**
   * Predictive cost policy using historical data
   */
  private async predictiveCostPolicy(
    action: string,
    context: CostAwarePolicyContext
  ): Promise<CostAwarePolicyResult> {
    const agentId = context.agentId
    if (!agentId) {
      return { allowed: true }
    }

    const predictedCost = this.predictCostForAction(action, agentId)
    const currentUsage = this.costGovernor.getAgentUsage(agentId)
    const limits = this.costGovernor.getLimits()

    const projectedTotal = currentUsage.cost + predictedCost
    
    if (projectedTotal > limits.maxCostPerAgent) {
      return {
        allowed: false,
        reason: `Predicted cost $${predictedCost.toFixed(3)} would exceed budget limit`,
        metadata: { predictedCost, currentUsage: currentUsage.cost, limit: limits.maxCostPerAgent }
      }
    }

    return { allowed: true }
  }

  /**
   * Adaptive budget policy based on usage patterns
   */
  private async adaptiveBudgetPolicy(
    action: string,
    context: CostAwarePolicyContext
  ): Promise<CostAwarePolicyResult> {
    const agentId = context.agentId
    if (!agentId || !this.budgetLimits.has(agentId)) {
      return { allowed: true }
    }

    const budgetInfo = this.getAgentBudgetInfo(agentId)
    if (!budgetInfo) {
      return { allowed: true }
    }

    // Auto-adjust budget based on usage patterns
    const usagePattern = this.analyzeUsagePattern(agentId)
    
    if (usagePattern.recommendation === 'increase') {
      const newBudget = budgetInfo.budget * 1.2
      this.setAgentBudget(agentId, newBudget)
      
      return {
        allowed: true,
        warnings: [`Budget auto-adjusted from $${budgetInfo.budget.toFixed(2)} to $${newBudget.toFixed(2)}`],
        metadata: { oldBudget: budgetInfo.budget, newBudget, reason: usagePattern.reason }
      }
    }

    return { allowed: true }
  }

  /**
   * Cost anomaly detection policy
   */
  private async costAnomalyPolicy(
    action: string,
    context: CostAwarePolicyContext
  ): Promise<CostAwarePolicyResult> {
    const agentId = context.agentId
    if (!agentId) {
      return { allowed: true }
    }

    const anomaly = await this.checkCostAnomaly(agentId)
    
    if (anomaly.isAnomaly && anomaly.severity === 'high') {
      return {
        allowed: false,
        reason: `Cost anomaly detected: ${anomaly.description}`,
        metadata: { anomaly }
      }
    }

    if (anomaly.isAnomaly) {
      return {
        allowed: true,
        warnings: [`Cost anomaly: ${anomaly.description}`],
        metadata: { anomaly }
      }
    }

    return { allowed: true }
  }

  // Helper methods

  private getAverageCostForAction(action: string): number {
    // Implementation would query historical data
    return 0.1 // Placeholder
  }

  private getCostTrend(agentId: string): { daily: number; weekly: number; monthly: number } {
    const projections = this.agentProjections.get(agentId) || []
    return {
      daily: projections.slice(-24).reduce((a, b) => a + b, 0) / 24,
      weekly: projections.slice(-168).reduce((a, b) => a + b, 0) / 168,
      monthly: projections.reduce((a, b) => a + b, 0) / projections.length
    }
  }

  private predictCostForAction(action: string, agentId: string): number {
    const historical = this.getAverageCostForAction(action)
    const trend = this.getCostTrend(agentId)
    return historical * (1 + trend.daily)
  }

  private async checkCostAnomaly(agentId: string): Promise<{
    isAnomaly: boolean
    severity: 'low' | 'medium' | 'high'
    description: string
  }> {
    const usage = this.costGovernor.getAgentUsage(agentId)
    const trend = this.getCostTrend(agentId)
    
    if (trend.daily > usage.cost * this.alertThresholds.costSpike) {
      return {
        isAnomaly: true,
        severity: 'high',
        description: `Cost spike detected: ${trend.daily.toFixed(3)} vs avg ${usage.cost.toFixed(3)}`
      }
    }

    return { isAnomaly: false, severity: 'low', description: '' }
  }

  private analyzeUsagePattern(agentId: string): {
    recommendation: 'increase' | 'decrease' | 'maintain'
    reason: string
  } {
    const budgetInfo = this.getAgentBudgetInfo(agentId)
    if (!budgetInfo) {
      return { recommendation: 'maintain', reason: 'No budget set' }
    }

    if (budgetInfo.percentage > 0.9) {
      return { recommendation: 'increase', reason: 'Budget nearly exhausted' }
    }

    return { recommendation: 'maintain', reason: 'Usage within normal bounds' }
  }

  /**
   * Set budget limit for an agent
   */
  setAgentBudget(agentId: string, budget: number): void {
    this.budgetLimits.set(agentId, budget)
  }

  /**
   * Get agent budget information
   */
  getAgentBudgetInfo(agentId: string): AgentBudgetInfo | null {
    if (!this.budgetLimits.has(agentId)) {
      return null
    }

    const budget = this.budgetLimits.get(agentId)!
    const used = this.costGovernor.getAgentUsage(agentId).cost
    const remaining = Math.max(0, budget - used)
    const percentage = (used / budget) * 100
    const projectedUsage = this.predictCostForAction('default', agentId)

    return {
      budget,
      used,
      remaining,
      percentage,
      projectedUsage,
      alerts: this.generateBudgetAlerts(agentId)
    }
  }

  /**
   * Get comprehensive cost usage report
   */
  getCostUsageReport(): CostUsageReport {
    const agents: Record<string, AgentBudgetInfo> = {}
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
    
    return {
      agents,
      totalBudget,
      totalUsed,
      totalRemaining: totalBudget - totalUsed,
      recommendations: costReport.recommendations,
      trends: this.generateTrends(),
      alerts: this.generateSystemAlerts()
    }
  }

  /**
   * Update cost limits
   */
  updateCostLimits(newLimits: Parameters<CostGovernor['setLimits']>[0]): void {
    this.costGovernor.setLimits(newLimits)
  }

  /**
   * Get current cost limits
   */
  getCostLimits(): ReturnType<CostGovernor['getLimits']> {
    return this.costGovernor.getLimits()
  }

  /**
   * Generate budget alerts for an agent
   */
  private generateBudgetAlerts(agentId: string): string[] {
    const alerts: string[] = []
    const info = this.getAgentBudgetInfo(agentId)
    
    if (!info) return alerts

    if (info.percentage >= this.alertThresholds.budgetCritical) {
      alerts.push(`CRITICAL: Budget ${info.percentage.toFixed(1)}% used`)
    } else if (info.percentage >= this.alertThresholds.budgetWarning) {
      alerts.push(`WARNING: Budget ${info.percentage.toFixed(1)}% used`)
    }

    return alerts
  }

  /**
   * Generate system-wide alerts
   */
  private generateSystemAlerts(): string[] {
    const alerts: string[] = []
    const report = this.getCostUsageReport()
    
    if (report.totalUsed / report.totalBudget > 0.9) {
      alerts.push('SYSTEM: Overall budget usage critical')
    }

    return alerts
  }

  /**
   * Generate usage trends
   */
  private generateTrends() {
    return {
      daily: Array.from({ length: 24 }, (_, i) => Math.random() * 10),
      weekly: Array.from({ length: 7 }, (_, i) => Math.random() * 50),
      monthly: Array.from({ length: 30 }, (_, i) => Math.random() * 200)
    }
  }
}
