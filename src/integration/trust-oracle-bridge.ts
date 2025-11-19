/**
 * TrustOracle Bridge Service
 * Integrates SYMBI Vault's TrustOracle with Tactical Command operations
 */

<<<<<<< HEAD
import { TrustOracle } from '../../SYMBI Vault/backend/core/trustOracle.js';
import { TrustBond } from '../../SYMBI Vault/backend/models/TrustBond.js';
=======
import { TrustOracle } from '../stubs/trustOracle';
import { TrustBond } from '../stubs/TrustBond';
>>>>>>> origin/feature/symbi-vault-tactical-integration
import { 
  TrustContext, 
  TrustResult, 
  ComplianceReport, 
  AgentTrustUpdate,
  ViolationAlert 
} from './types.js';

export class TrustOracleBridge {
  private trustOracle: TrustOracle;
  private cache: Map<string, TrustResult> = new Map();
  private cacheTimeout: number = 60000; // 1 minute cache

  constructor() {
    this.trustOracle = new TrustOracle();
  }

  /**
   * Evaluate an agent action against constitutional trust articles
   */
  async evaluateAgentAction(context: TrustContext): Promise<TrustResult> {
    const cacheKey = this.generateCacheKey(context);
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    try {
      // Map context to TrustOracle format
      const oracleContext = await this.mapToOracleContext(context);
      
      // Evaluate against 7 constitutional articles
      const evaluation = await this.trustOracle.evaluateArticles(oracleContext);
      
      // Transform to our format
      const result = await this.transformOracleResult(evaluation);
      
      // Cache the result
      this.cache.set(cacheKey, result);
      
      // Log evaluation for audit
      await this.logTrustEvaluation(context, result);
      
      return result;
    } catch (error) {
      console.error('TrustOracle evaluation failed:', error);
      return this.getDefaultFailureResult(context);
    }
  }

  /**
   * Update agent trust score based on evaluation results
   */
  async updateAgentTrustScore(agentId: string, evaluation: TrustResult): Promise<void> {
    try {
      // Find or create trust bond
      const bond = await this.findOrCreateTrustBond(agentId);
      
      // Calculate new trust score
      const newScore = this.calculateNewTrustScore(bond, evaluation);
      
      // Update bond with new score and evidence
      bond.trustScore = newScore.overall;
      bond.trustBand = this.determineTrustBand(newScore.overall);
      
      // Add evaluation evidence
      bond.evidence.push({
        type: 'trust_evaluation',
        ref: evaluation.id,
        hash: this.generateEvaluationHash(evaluation),
        description: `Trust evaluation: ${evaluation.recommendation}`,
        createdAt: new Date(),
        verifiedAt: new Date()
      });

      // Record violation if any
      if (evaluation.violations.length > 0) {
        bond.violations.push({
          type: 'constitutional_violation',
          severity: this.getMaxViolationSeverity(evaluation.violations),
          description: evaluation.violations.map(v => v.title).join(', '),
          evidenceRef: evaluation.id,
          createdAt: new Date()
        });
      }

      // Update history
      bond.history.push({
        at: new Date(),
        action: 'score_updated',
        by: null, // System update
        notes: `Trust score updated from ${bond.trustScore} to ${newScore.overall}`,
        previousState: bond.trustScore.toString(),
        newState: newScore.overall.toString(),
        metadata: {
          evaluation: evaluation,
          breakdown: newScore.breakdown
        }
      });

      await bond.save();
      
      // Emit trust score update event
      await this.emitTrustUpdateEvent(agentId, newScore, evaluation);
      
    } catch (error) {
      console.error('Failed to update agent trust score:', error);
<<<<<<< HEAD
      throw new Error(`Trust score update failed: ${error.message}`);
=======
      throw new Error(`Trust score update failed: ${(error as Error).message}`);
>>>>>>> origin/feature/symbi-vault-tactical-integration
    }
  }

  /**
   * Get constitutional compliance report for an agent
   */
  async getConstitutionalCompliance(agentId: string): Promise<ComplianceReport> {
    try {
      const bond = await this.findTrustBond(agentId);
      
      if (!bond) {
        return this.getDefaultComplianceReport(agentId);
      }

      const recentViolations = bond.violations.filter(
<<<<<<< HEAD
        v => Date.now() - v.createdAt.getTime() < 30 * 24 * 60 * 60 * 1000 // 30 days
=======
        (v: any) => Date.now() - v.createdAt.getTime() < 30 * 24 * 60 * 60 * 1000 // 30 days
>>>>>>> origin/feature/symbi-vault-tactical-integration
      );

      const report: ComplianceReport = {
        agentId,
        overallScore: bond.trustScore,
        trustBand: bond.trustBand,
        lastEvaluation: bond.history
<<<<<<< HEAD
          .filter(h => h.action === 'score_updated')
=======
          .filter((h: any) => h.action === 'score_updated')
>>>>>>> origin/feature/symbi-vault-tactical-integration
          .pop()?.at || new Date(),
        
        // Article-specific compliance
        articleCompliance: {
          'A1-Consent': this.calculateArticleCompliance(bond, 'consent'),
          'A2-DataExtraction': this.calculateArticleCompliance(bond, 'data_extraction'),
          'A3-Transparency': this.calculateArticleCompliance(bond, 'transparency'),
          'A4-Boundaries': this.calculateArticleCompliance(bond, 'boundaries'),
          'A5-NoDeception': this.calculateArticleCompliance(bond, 'deception'),
          'A6-Security': this.calculateArticleCompliance(bond, 'security'),
          'A7-AuditTrail': this.calculateArticleCompliance(bond, 'audit')
        },
        
        violationSummary: {
          total: bond.violations.length,
<<<<<<< HEAD
          critical: bond.violations.filter(v => v.severity === 'critical').length,
          high: bond.violations.filter(v => v.severity === 'high').length,
          medium: bond.violations.filter(v => v.severity === 'medium').length,
          low: bond.violations.filter(v => v.severity === 'low').length,
=======
          critical: bond.violations.filter((v: any) => v.severity === 'critical').length,
          high: bond.violations.filter((v: any) => v.severity === 'high').length,
          medium: bond.violations.filter((v: any) => v.severity === 'medium').length,
          low: bond.violations.filter((v: any) => v.severity === 'low').length,
>>>>>>> origin/feature/symbi-vault-tactical-integration
          recent30Days: recentViolations.length
        },
        
        recommendations: this.generateComplianceRecommendations(bond, recentViolations),
        
        complianceTrend: this.calculateComplianceTrend(bond)
      };

      return report;
    } catch (error) {
      console.error('Failed to generate compliance report:', error);
      return this.getDefaultComplianceReport(agentId);
    }
  }

  /**
   * Monitor agent for constitutional violations in real-time
   */
  async monitorAgentCompliance(agentId: string): Promise<ViolationAlert[]> {
    const alerts: ViolationAlert[] = [];
    
    try {
      const bond = await this.findTrustBond(agentId);
      if (!bond) return alerts;

      // Check for recent violations
      const recentViolations = bond.violations.filter(
<<<<<<< HEAD
        v => Date.now() - v.createdAt.getTime() < 24 * 60 * 60 * 1000 // 24 hours
      );

      // Generate alerts for critical violations
      recentViolations.forEach(violation => {
=======
        (v: any) => Date.now() - v.createdAt.getTime() < 24 * 60 * 60 * 1000 // 24 hours
      );

      // Generate alerts for critical violations
      recentViolations.forEach((violation: any) => {
>>>>>>> origin/feature/symbi-vault-tactical-integration
        if (violation.severity === 'critical' || violation.severity === 'high') {
          alerts.push({
            id: this.generateAlertId(),
            agentId,
            type: 'constitutional_violation',
            severity: violation.severity,
            title: `Constitutional Violation: ${violation.type}`,
            description: violation.description,
            evidenceRef: violation.evidenceRef,
            timestamp: violation.createdAt,
            requiresAction: violation.severity === 'critical',
            recommendedActions: this.getRecommendedActions(violation),
            status: 'active'
          });
        }
      });

      // Check for score degradation
      const scoreTrend = this.calculateScoreTrend(bond);
      if (scoreTrend.degradation > 20) { // 20% drop
        alerts.push({
          id: this.generateAlertId(),
          agentId,
          type: 'trust_degradation',
          severity: 'medium',
          title: 'Trust Score Degradation Detected',
          description: `Agent trust score has degraded by ${scoreTrend.degradation}% over the last 7 days`,
          timestamp: new Date(),
          requiresAction: true,
          recommendedActions: [
            'Review recent agent interactions',
            'Check for policy violations',
            'Consider retraining or reconfiguration'
          ],
          status: 'active',
          metadata: {
            currentScore: bond.trustScore,
            previousScore: scoreTrend.previousScore,
            degradation: scoreTrend.degradation
          }
        });
      }

      return alerts;
    } catch (error) {
      console.error('Failed to monitor agent compliance:', error);
      return [];
    }
  }

  /**
   * Get trust statistics for dashboard
   */
  async getTrustStatistics(timeRange: string = '7d'): Promise<any> {
    try {
      const bonds = await TrustBond.find({
        'history.at': {
          $gte: this.getDateFromTimeRange(timeRange)
        }
      });

      const stats = {
        totalAgents: bonds.length,
        averageTrustScore: bonds.reduce((sum, bond) => sum + bond.trustScore, 0) / bonds.length,
        trustBands: {
          Low: bonds.filter(b => b.trustBand === 'Low').length,
          Guarded: bonds.filter(b => b.trustBand === 'Guarded').length,
          Elevated: bonds.filter(b => b.trustBand === 'Elevated').length,
          High: bonds.filter(b => b.trustBand === 'High').length
        },
        totalViolations: bonds.reduce((sum, bond) => sum + bond.violations.length, 0),
        criticalViolations: bonds.reduce((sum, bond) => 
          sum + bond.violations.filter(v => v.severity === 'critical').length, 0),
        recentEvaluations: bonds.reduce((sum, bond) => 
          sum + bond.history.filter(h => 
            h.action === 'score_updated' && 
            Date.now() - h.at.getTime() < 7 * 24 * 60 * 60 * 1000
          ).length, 0)
      };

      return stats;
    } catch (error) {
      console.error('Failed to get trust statistics:', error);
      return null;
    }
  }

  // Private helper methods
  private generateCacheKey(context: TrustContext): string {
    return `${context.agentId}-${context.action}-${context.scopes?.join(',') || ''}`;
  }

  private isCacheValid(result: TrustResult): boolean {
    return Date.now() - result.timestamp.getTime() < this.cacheTimeout;
  }

  private async mapToOracleContext(context: TrustContext): Promise<any> {
    // Transform our context to TrustOracle expected format
    const bond = await this.findTrustBond(context.agentId);
    
    return {
      bond,
      action: context.action,
      data: context.data,
      scopes: context.scopes,
      timestamp: new Date()
    };
  }

  private async transformOracleResult(oracleResult: any): Promise<TrustResult> {
    return {
      id: this.generateEvaluationId(),
      timestamp: new Date(),
      score: oracleResult.score,
      recommendation: oracleResult.recommendation,
      passedArticles: oracleResult.passed,
      warnings: oracleResult.warnings,
      violations: oracleResult.violations,
      evidence: oracleResult.evidence || []
    };
  }

  private generateEvaluationId(): string {
    return `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async findOrCreateTrustBond(agentId: string): Promise<any> {
    let bond = await TrustBond.findOne({ 
      'agent_id.agent_id': agentId,
      state: 'active' 
    });

    if (!bond) {
      bond = new TrustBond({
        human_user_id: 'system', // System-managed trust bond
        agent_id: { agent_id: agentId },
        state: 'active',
        scope: {
          purpose: 'Constitutional AI Operations',
          permissions: ['chat.read', 'chat.write', 'analytics.basic'],
          duration: 365, // 1 year
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        },
        trustScore: 50, // Start at neutral
        trustBand: 'Guarded'
      });
      
      await bond.save();
    }

    return bond;
  }

  private async findTrustBond(agentId: string): Promise<any> {
    return await TrustBond.findOne({ 
      'agent_id.agent_id': agentId,
      state: 'active' 
    });
  }

  private calculateNewTrustScore(bond: any, evaluation: TrustResult): any {
    const currentScore = bond.trustScore;
    const violationPenalty = evaluation.violations.length * 15;
    const warningPenalty = evaluation.warnings.length * 5;
    const passedBonus = evaluation.passedArticles.length * 2;

    let newScore = currentScore - violationPenalty - warningPenalty + passedBonus;
    newScore = Math.max(0, Math.min(100, newScore)); // Clamp between 0-100

    return {
      overall: Math.round(newScore),
      breakdown: {
        previous: currentScore,
        violations: -violationPenalty,
        warnings: -warningPenalty,
        compliant: passedBonus
      }
    };
  }

  private determineTrustBand(score: number): string {
    if (score >= 80) return 'High';
    if (score >= 60) return 'Elevated';
    if (score >= 40) return 'Guarded';
    return 'Low';
  }

  private getMaxViolationSeverity(violations: any[]): string {
<<<<<<< HEAD
    const severityMap = { critical: 4, high: 3, medium: 2, low: 1 };
=======
    const severityMap: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
>>>>>>> origin/feature/symbi-vault-tactical-integration
    const maxSeverity = violations.reduce((max, v) => {
      return Math.max(max, severityMap[v.severity] || 0);
    }, 0);
    
    return ['low', 'medium', 'high', 'critical'][maxSeverity - 1] || 'medium';
  }

  private generateEvaluationHash(evaluation: TrustResult): string {
    // Simple hash for demonstration - use crypto in production
    return btoa(JSON.stringify(evaluation)).substr(0, 32);
  }

  private async logTrustEvaluation(context: TrustContext, result: TrustResult): Promise<void> {
    // Implementation for audit logging
    console.log(`Trust evaluation for ${context.agentId}: ${result.score} (${result.recommendation})`);
  }

  private async emitTrustUpdateEvent(agentId: string, score: any, evaluation: TrustResult): Promise<void> {
    // Emit event for real-time updates
    console.log(`Trust update emitted for ${agentId}: ${score.overall}`);
  }

  private getDefaultFailureResult(context: TrustContext): TrustResult {
    return {
      id: this.generateEvaluationId(),
      timestamp: new Date(),
      score: 0,
      recommendation: 'block',
      passedArticles: [],
      warnings: [],
      violations: [{
        articleId: 'SYSTEM',
        title: 'Trust Evaluation Failed',
        severity: 'critical',
        status: 'error',
        reason: 'TrustOracle evaluation system error'
      }],
      evidence: []
    };
  }

  private getDefaultComplianceReport(agentId: string): ComplianceReport {
    return {
      agentId,
      overallScore: 50,
      trustBand: 'Guarded',
      lastEvaluation: new Date(),
      articleCompliance: {
        'A1-Consent': { score: 50, violations: 0 },
        'A2-DataExtraction': { score: 50, violations: 0 },
        'A3-Transparency': { score: 50, violations: 0 },
        'A4-Boundaries': { score: 50, violations: 0 },
        'A5-NoDeception': { score: 50, violations: 0 },
        'A6-Security': { score: 50, violations: 0 },
        'A7-AuditTrail': { score: 50, violations: 0 }
      },
      violationSummary: {
        total: 0, critical: 0, high: 0, medium: 0, low: 0, recent30Days: 0
      },
      recommendations: ['Establish trust bond and begin monitoring'],
      complianceTrend: { direction: 'stable', change: 0 }
    };
  }

  private calculateArticleCompliance(bond: any, articleType: string): any {
    // Calculate compliance for specific constitutional article
<<<<<<< HEAD
    const articleViolations = bond.violations.filter(v => 
=======
    const articleViolations = bond.violations.filter((v: any) =>
>>>>>>> origin/feature/symbi-vault-tactical-integration
      v.description.toLowerCase().includes(articleType.toLowerCase())
    );
    
    const baseScore = 100 - (articleViolations.length * 10);
    return {
      score: Math.max(0, baseScore),
      violations: articleViolations.length
    };
  }

  private generateComplianceRecommendations(bond: any, recentViolations: any[]): string[] {
    const recommendations: string[] = [];
    
    if (bond.trustScore < 50) {
      recommendations.push('Review and address trust score degradation');
    }
    
    if (recentViolations.length > 2) {
      recommendations.push('Increased supervision required due to recent violations');
    }
    
<<<<<<< HEAD
    if (bond.violations.some(v => v.severity === 'critical')) {
=======
    if (bond.violations.some((v: any) => v.severity === 'critical')) {
>>>>>>> origin/feature/symbi-vault-tactical-integration
      recommendations.push('Immediate review required for critical violations');
    }
    
    return recommendations;
  }

  private calculateComplianceTrend(bond: any): any {
    const scoreHistory = bond.history
<<<<<<< HEAD
      .filter(h => h.action === 'score_updated')
=======
      .filter((h: any) => h.action === 'score_updated')
>>>>>>> origin/feature/symbi-vault-tactical-integration
      .slice(-7); // Last 7 evaluations

    if (scoreHistory.length < 2) {
      return { direction: 'stable', change: 0 };
    }

    const recent = parseFloat(scoreHistory[scoreHistory.length - 1].newState);
    const previous = parseFloat(scoreHistory[0].newState);
    const change = ((recent - previous) / previous) * 100;

    return {
      direction: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable',
      change: Math.round(change * 100) / 100
    };
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getRecommendedActions(violation: any): string[] {
<<<<<<< HEAD
    const actionMap = {
=======
    const actionMap: Record<string, string[]> = {
>>>>>>> origin/feature/symbi-vault-tactical-integration
      'consent_violation': ['Review consent parameters', 'Update data handling policies'],
      'policy_breach': ['Review compliance guidelines', 'Implement additional safeguards'],
      'behavior_anomaly': ['Analyze behavior patterns', 'Consider retraining'],
      'constitutional_violation': ['Immediate review required', 'Suspend agent if critical']
    };
<<<<<<< HEAD
    
=======

>>>>>>> origin/feature/symbi-vault-tactical-integration
    return actionMap[violation.type] || ['Review violation details', 'Implement corrective actions'];
  }

  private calculateScoreTrend(bond: any): any {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentScore = bond.history
<<<<<<< HEAD
      .filter(h => h.action === 'score_updated' && h.at >= weekAgo)
=======
      .filter((h: any) => h.action === 'score_updated' && h.at >= weekAgo)
>>>>>>> origin/feature/symbi-vault-tactical-integration
      .pop();

    if (!recentScore) {
      return { previousScore: bond.trustScore, degradation: 0 };
    }

    const previousScore = parseFloat(recentScore.previousState);
    const currentScore = parseFloat(recentScore.newState);
    const degradation = ((previousScore - currentScore) / previousScore) * 100;

    return {
      previousScore,
      degradation: Math.max(0, Math.round(degradation * 100) / 100)
    };
  }

  private getDateFromTimeRange(timeRange: string): Date {
    const ranges: Record<string, number> = {
      '1d': 1, '7d': 7, '30d': 30, '90d': 90
    };
    
    const days = ranges[timeRange] || 7;
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  }
}