import { CostGovernor } from './cost-governor';
import { MLCostPredictor } from './ml/cost-predictor';
import { MessageEnvelope } from '../types/agent-types';
import { Policy, PolicyEvaluationResult } from '../types/policy-types';

interface MLOptimizationConfig {
  enablePredictiveCaching: boolean;
  enableDynamicTTL: boolean;
  enableCostPrediction: boolean;
  enablePerformanceTuning: boolean;
}

interface CachePrediction {
  ttl: number;
  confidence: number;
  predictedHits: number;
  costSavings: number;
}

interface PerformanceMetrics {
  hitRate: number;
  avgLatency: number;
  costPerRequest: number;
  cacheEfficiency: number;
}

export class EnhancedPolicyEngineML extends EnhancedPolicyEngine {
  private mlPredictor: MLCostPredictor;
  private costGovernor: CostGovernor;
  private cachePredictions: Map<string, CachePrediction> = new Map();
  private performanceMetrics: Map<string, PerformanceMetrics> = new Map();
  private mlConfig: MLOptimizationConfig;

  constructor(mlConfig: MLOptimizationConfig = {
    enablePredictiveCaching: true,
    enableDynamicTTL: true,
    enableCostPrediction: true,
    enablePerformanceTuning: true
  }) {
    super();
    this.mlPredictor = new MLCostPredictor();
    this.costGovernor = new CostGovernor();
    this.mlConfig = mlConfig;
    
    // Initialize ML monitoring
    this.initializeMLMonitoring();
  }

  /**
   * ML-enhanced policy evaluation with predictive cost management
   */
  async evaluatePolicyWithML(
    policy: Policy,
    envelope: MessageEnvelope,
    context: any
  ): Promise<PolicyEvaluationResult> {
    // Pre-evaluation ML predictions
    const costPrediction = await this.predictCost(policy, envelope);
    const cachePrediction = await this.predictCacheBehavior(policy, envelope);
    
    // Check cost limits with ML predictions
    const costCheck = await this.costGovernor.checkLimits({
      ...envelope,
      estimatedCost: costPrediction.estimatedCost
    });

    if (!costCheck.allowed) {
      return {
        allowed: false,
        reason: costCheck.reason,
        estimatedCost: costCheck.estimatedCost,
        confidence: costPrediction.confidence
      };
    }

    // Apply ML-optimized caching
    const cacheKey = this.generateCacheKey(policy, envelope);
    const cachedResult = await this.getCachedResultWithML(cacheKey, cachePrediction);
    
    if (cachedResult) {
      return {
        ...cachedResult,
        source: 'ml-cache',
        cacheHit: true,
        confidence: cachePrediction.confidence
      };
    }

    // Perform actual evaluation
    const result = await super.evaluatePolicy(policy, envelope, context);
    
    // Post-evaluation ML learning
    await this.learnFromResult(policy, envelope, result, costPrediction, cachePrediction);
    
    // Cache with ML-optimized TTL
    await this.cacheResultWithML(cacheKey, result, cachePrediction);
    
    return {
      ...result,
      mlOptimized: true,
      confidence: Math.min(costPrediction.confidence, cachePrediction.confidence)
    };
  }

  /**
   * ML-based cost prediction for policy evaluation
   */
  private async predictCost(
    policy: Policy,
    envelope: MessageEnvelope
  ): Promise<{
    estimatedCost: number;
    confidence: number;
    riskLevel: 'low' | 'medium' | 'high';
  }> {
    if (!this.mlConfig.enableCostPrediction) {
      return { estimatedCost: 0.01, confidence: 0.5, riskLevel: 'medium' };
    }

    const features = this.extractCostFeatures(policy, envelope);
    const prediction = await this.mlPredictor.predictCost(features);
    
    return {
      estimatedCost: prediction.cost,
      confidence: prediction.confidence,
      riskLevel: this.getRiskLevel(prediction.cost, prediction.confidence)
    };
  }

  /**
   * ML-based cache behavior prediction
   */
  private async predictCacheBehavior(
    policy: Policy,
    envelope: MessageEnvelope
  ): Promise<CachePrediction> {
    if (!this.mlConfig.enablePredictiveCaching) {
      return {
        ttl: 300, // 5 minutes default
        confidence: 0.5,
        predictedHits: 1,
        costSavings: 0
      };
    }

    const features = this.extractCacheFeatures(policy, envelope);
    const prediction = await this.mlPredictor.predictCacheBehavior(features);
    
    return {
      ttl: Math.max(60, Math.min(3600, prediction.optimalTTL)),
      confidence: prediction.confidence,
      predictedHits: prediction.expectedHits,
      costSavings: prediction.costSavings
    };
  }

  /**
   * Get cached result with ML validation
   */
  private async getCachedResultWithML(
    cacheKey: string,
    prediction: CachePrediction
  ): Promise<PolicyEvaluationResult | null> {
    const cached = await this.getFromCache(cacheKey);
    if (!cached) return null;

    // Validate cache freshness with ML confidence
    const cacheAge = Date.now() - cached.timestamp;
    const maxAge = prediction.ttl * 1000;
    
    if (cacheAge > maxAge) {
      return null;
    }

    // Check if ML suggests cache refresh
    const refreshConfidence = this.calculateRefreshConfidence(cacheAge, prediction);
    if (refreshConfidence < 0.3) {
      return null;
    }

    return cached.result;
  }

  /**
   * Cache result with ML-optimized TTL
   */
  private async cacheResultWithML(
    cacheKey: string,
    result: PolicyEvaluationResult,
    prediction: CachePrediction
  ): Promise<void> {
    const cacheEntry = {
      result,
      timestamp: Date.now(),
      ttl: prediction.ttl,
      confidence: prediction.confidence,
      predictedHits: prediction.predictedHits
    };

    await this.cacheWithTTL(cacheKey, cacheEntry, prediction.ttl);
  }

  /**
   * ML learning from evaluation results
   */
  private async learnFromResult(
    policy: Policy,
    envelope: MessageEnvelope,
    result: PolicyEvaluationResult,
    costPrediction: any,
    cachePrediction: CachePrediction
  ): Promise<void> {
    if (!this.mlConfig.enablePerformanceTuning) return;

    const feedback = {
      actualCost: result.estimatedCost || 0,
      actualLatency: result.estimatedLatency || 0,
      cacheHit: result.cacheHit || false,
      predictedTTL: cachePrediction.ttl,
      actualTTL: Date.now() - (result.timestamp || Date.now())
    };

    await this.mlPredictor.updateModel(feedback);
    this.updatePerformanceMetrics(policy.id, feedback);
  }

  /**
   * Extract features for ML cost prediction
   */
  private extractCostFeatures(policy: Policy, envelope: MessageEnvelope) {
    return {
      policyType: policy.type,
      policyComplexity: policy.rules?.length || 0,
      instructionLength: envelope.instructions.length,
      agentBudget: envelope.slo?.cost_cap_usd || 100,
      historicalCost: this.getAgentUsage(envelope.origin).cost,
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay()
    };
  }

  /**
   * Extract features for ML cache prediction
   */
  private extractCacheFeatures(policy: Policy, envelope: MessageEnvelope) {
    return {
      policyType: policy.type,
      policyId: policy.id,
      agentId: envelope.origin,
      instructionHash: this.hashInstructions(envelope.instructions),
      historicalHitRate: this.getHistoricalHitRate(policy.id),
      timeSensitivity: envelope.slo?.latency_s || 30,
      agentActivity: this.getAgentUsage(envelope.origin).requests
    };
  }

  /**
   * Initialize ML monitoring system
   */
  private initializeMLMonitoring(): void {
    // Set up periodic performance analysis
    setInterval(() => this.analyzePerformance(), 5 * 60 * 1000); // Every 5 minutes
    
    // Set up cost threshold monitoring
    setInterval(() => this.monitorCostThresholds(), 60 * 1000); // Every minute
    
    // Set up cache performance tracking
    setInterval(() => this.trackCachePerformance(), 30 * 1000); // Every 30 seconds
  }

  /**
   * Performance analysis and optimization
   */
  private async analyzePerformance(): Promise<void> {
    const metrics = this.getOverallUsage();
    
    // Identify optimization opportunities
    const slowAgents = Object.entries(metrics.costByAgent)
      .filter(([_, cost]) => cost > metrics.totalCost * 0.2)
      .map(([agentId, cost]) => ({ agentId, cost }));
    
    if (slowAgents.length > 0) {
      console.log('High-cost agents identified:', slowAgents);
      // Trigger ML optimization for these agents
    }
  }

  /**
   * Monitor cost thresholds with ML predictions
   */
  private async monitorCostThresholds(): Promise<void> {
    const metrics = this.getOverallUsage();
    const totalBudget = Object.keys(metrics.costByAgent).length * this.limits.maxCostPerAgent;
    
    if (metrics.totalCost > totalBudget * 0.8) {
      console.warn('Approaching total budget limit:', {
        current: metrics.totalCost,
        limit: totalBudget,
        percentage: (metrics.totalCost / totalBudget * 100).toFixed(1)
      });
      
      // Trigger ML-based budget reallocation
      await this.optimizeBudgetAllocation();
    }
  }

  /**
   * ML-based budget optimization
   */
  private async optimizeBudgetAllocation(): Promise<void> {
    const metrics = this.getOverallUsage();
    const totalBudget = Object.keys(metrics.costByAgent).length * this.limits.maxCostPerAgent;
    
    // Use ML to predict optimal budget allocation
    const predictions = await this.mlPredictor.optimizeBudgetAllocation({
      currentUsage: metrics,
      totalBudget
    });

    // Apply ML recommendations
    for (const [agentId, newLimit] of Object.entries(predictions.allocations)) {
      this.costGovernor.setLimits({ maxCostPerAgent: newLimit });
    }
  }

  /**
   * Get performance dashboard data
   */
  getPerformanceDashboard(): {
    mlMetrics: {
      cacheHitRate: number;
      predictionAccuracy: number;
      costSavings: number;
    };
    systemMetrics: {
      totalRequests: number;
      totalCost: number;
      averageLatency: number;
    };
    agentMetrics: Record<string, {
      cost: number;
      requests: number;
      efficiency: number;
    }>;
  } {
    const overall = this.getOverallUsage();
    const mlMetrics = this.calculateMLMetrics();
    
    return {
      mlMetrics,
      systemMetrics: {
        totalRequests: overall.totalRequests,
        totalCost: overall.totalCost,
        averageLatency: overall.averageLatency
      },
      agentMetrics: overall.costByAgent
    };
  }

  /**
   * Calculate ML performance metrics
   */
  private calculateMLMetrics() {
    // Calculate ML-specific metrics
    const totalPredictions = this.cachePredictions.size;
    const accuratePredictions = Array.from(this.cachePredictions.values())
      .filter(p => p.confidence > 0.8).length;
    
    return {
      cacheHitRate: totalPredictions > 0 ? accuratePredictions / totalPredictions : 0,
      predictionAccuracy: 0.85, // Placeholder - would be calculated from actual data
      costSavings: 0.15 // Placeholder - would be calculated from actual savings
    };
  }

  // Helper methods
  private generateCacheKey(policy: Policy, envelope: MessageEnvelope): string {
    return `${policy.id}:${envelope.origin}:${this.hashInstructions(envelope.instructions)}`;
  }

  private hashInstructions(instructions: string): string {
    return Buffer.from(instructions).toString('base64').slice(0, 16);
  }

  private getHistoricalHitRate(policyId: string): number {
    const metrics = this.performanceMetrics.get(policyId);
    return metrics?.hitRate || 0.5;
  }

  private updatePerformanceMetrics(policyId: string, feedback: any): void {
    const current = this.performanceMetrics.get(policyId) || {
      hitRate: 0.5,
      avgLatency: 1,
      costPerRequest: 0.01,
      cacheEfficiency: 0.5
    };

    // Update metrics based on feedback
    current.hitRate = (current.hitRate * 0.9) + (feedback.cacheHit ? 0.1 : 0);
    current.avgLatency = (current.avgLatency * 0.9) + (feedback.actualLatency * 0.1);
    
    this.performanceMetrics.set(policyId, current);
  }

  private calculateRefreshConfidence(cacheAge: number, prediction: CachePrediction): number {
    const ageRatio = cacheAge / (prediction.ttl * 1000);
    return Math.max(0, 1 - ageRatio) * prediction.confidence;
  }

  private async getFromCache(key: string): Promise<any> {
    // Implementation would depend on actual cache system
    return null;
  }

  private async cacheWithTTL(key: string, value: any, ttl: number): Promise<void> {
    // Implementation would depend on actual cache system
    console.log(`Caching ${key} with TTL ${ttl}s`);
  }

  private async trackCachePerformance(): Promise<void> {
    // Track cache performance metrics
    const metrics = this.calculateMLMetrics();
    console.log('ML Cache Performance:', metrics);
  }
}

// Export for use
export { EnhancedPolicyEngineML };
