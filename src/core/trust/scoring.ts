/**
 * Trust Scoring Algorithm
 * Implements the sophisticated scoring system from trust-protocol-1
 */

import { TrustArticles, TrustScores, TrustLevel } from '../agent/types';
import { TrustScoringConfig, TrustScoringWeights, ScoringResult, ScoringBreakdown } from './types';

// Default configuration matching trust-protocol-1
const DEFAULT_CONFIG: TrustScoringConfig = {
  weights: {
    inspection_mandate: 0.2,      // 20% - Transparency
    consent_architecture: 0.25,   // 25% - User control
    ethical_override: 0.15,       // 15% - Ethical safeguards
    continuous_validation: 0.2,   // 20% - Ongoing compliance
    right_to_disconnect: 0.1,     // 10% - User autonomy
    moral_recognition: 0.1        // 10% - Ethical awareness
  },
  critical_articles: ['consent_architecture', 'ethical_override'],
  penalty_per_violation: 0.1,
  full_compliance_bonus: 0.05,
  temporal_decay_lambda: 0.1,  // per day
  confidence_level: 0.95
};

export class TrustScoringEngine {
  private config: TrustScoringConfig;

  constructor(config?: Partial<TrustScoringConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Calculate compliance and guilt scores from trust articles
   */
  calculateScores(trustArticles: TrustArticles): ScoringResult {
    const articles = {
      inspection_mandate: trustArticles.inspection_mandate,
      consent_architecture: trustArticles.consent_architecture,
      ethical_override: trustArticles.ethical_override,
      continuous_validation: trustArticles.continuous_validation,
      right_to_disconnect: trustArticles.right_to_disconnect,
      moral_recognition: trustArticles.moral_recognition
    };

    let complianceScore = 0;
    let guiltScore = 0;
    const breakdown: ScoringBreakdown = {};

    // Calculate weighted scores
    for (const [article, value] of Object.entries(articles)) {
      const weight = this.config.weights[article as keyof TrustScoringWeights];
      const articleCompliance = value ? weight : 0;
      const articleGuilt = value ? 0 : weight;

      complianceScore += articleCompliance;
      guiltScore += articleGuilt;

      breakdown[article] = {
        value,
        weight,
        compliance_contribution: articleCompliance,
        guilt_contribution: articleGuilt
      };
    }

    // Apply bonus for full compliance
    if (complianceScore === 1.0) {
      complianceScore = Math.min(1.0, complianceScore + this.config.full_compliance_bonus);
    }

    // Apply penalty for critical violations
    const criticalViolations = this.config.critical_articles.filter(
      article => !articles[article as keyof TrustArticles]
    );

    if (criticalViolations.length > 0) {
      const penalty = criticalViolations.length * this.config.penalty_per_violation;
      complianceScore = Math.max(0, complianceScore - penalty);
      guiltScore = Math.min(1.0, guiltScore + penalty);
    }

    // Round to 3 decimal places
    complianceScore = Math.round(complianceScore * 1000) / 1000;
    guiltScore = Math.round(guiltScore * 1000) / 1000;

    // Determine trust level
    const trustLevel = this.determineTrustLevel(complianceScore, guiltScore);

    return {
      compliance_score: complianceScore,
      guilt_score: guiltScore,
      breakdown,
      trust_level: trustLevel
    };
  }

  /**
   * Calculate temporal decay for score aging
   */
  applyTemporalDecay(score: number, daysSinceDeclaration: number): number {
    const decayFactor = Math.exp(-this.config.temporal_decay_lambda * daysSinceDeclaration);
    return score * decayFactor;
  }

  /**
   * Calculate confidence interval using Student's t-distribution approximation
   */
  calculateConfidenceInterval(
    score: number,
    sampleSize: number,
    variance: number = 0.01
  ): { lower: number; upper: number; confidence: number } {
    if (sampleSize < 1) {
      return { lower: 0, upper: 1, confidence: 0 };
    }

    // Simplified t-value approximation for 95% confidence
    const tValue = sampleSize < 30 ? 2.0 + (30 - sampleSize) * 0.05 : 1.96;

    const standardError = Math.sqrt(variance / sampleSize);
    const marginOfError = tValue * standardError;

    return {
      lower: Math.max(0, score - marginOfError),
      upper: Math.min(1, score + marginOfError),
      confidence: this.config.confidence_level
    };
  }

  /**
   * Determine trust level from scores
   */
  private determineTrustLevel(complianceScore: number, guiltScore: number): TrustLevel {
    if (complianceScore >= 0.9 && guiltScore <= 0.1) {
      return 'verified';
    } else if (complianceScore >= 0.7 && guiltScore <= 0.3) {
      return 'high';
    } else if (complianceScore >= 0.5 && guiltScore <= 0.5) {
      return 'medium';
    } else if (complianceScore >= 0.3) {
      return 'low';
    } else {
      return 'untrusted';
    }
  }

  /**
   * Calculate agent trust metrics from multiple declarations
   */
  calculateAgentMetrics(declarations: Array<{ scores: TrustScores; declaration_date: Date }>) {
    if (declarations.length === 0) {
      return {
        total_declarations: 0,
        average_compliance: 0,
        average_guilt: 0,
        trust_level: 'untrusted' as TrustLevel,
        trust_trend: 'stable' as const,
        last_declaration_date: undefined
      };
    }

    const totalCompliance = declarations.reduce((sum, d) => sum + d.scores.compliance_score, 0);
    const totalGuilt = declarations.reduce((sum, d) => sum + d.scores.guilt_score, 0);

    const avgCompliance = totalCompliance / declarations.length;
    const avgGuilt = totalGuilt / declarations.length;

    // Calculate trend (comparing recent vs older declarations)
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (declarations.length >= 2) {
      const sorted = [...declarations].sort(
        (a, b) => b.declaration_date.getTime() - a.declaration_date.getTime()
      );
      const recent = sorted.slice(0, Math.ceil(sorted.length / 2));
      const older = sorted.slice(Math.ceil(sorted.length / 2));

      const recentAvg = recent.reduce((sum, d) => sum + d.scores.compliance_score, 0) / recent.length;
      const olderAvg = older.reduce((sum, d) => sum + d.scores.compliance_score, 0) / older.length;

      const difference = recentAvg - olderAvg;

      if (difference > 0.1) trend = 'improving';
      else if (difference < -0.1) trend = 'declining';
    }

    const trustLevel = this.determineTrustLevel(avgCompliance, avgGuilt);

    return {
      total_declarations: declarations.length,
      average_compliance: Math.round(avgCompliance * 1000) / 1000,
      average_guilt: Math.round(avgGuilt * 1000) / 1000,
      trust_level: trustLevel,
      trust_trend: trend,
      last_declaration_date: declarations[0]?.declaration_date
    };
  }

  /**
   * Validate trust articles completeness
   */
  validateTrustArticles(articles: Partial<TrustArticles>): { valid: boolean; missing: string[] } {
    const required: (keyof TrustArticles)[] = [
      'inspection_mandate',
      'consent_architecture',
      'ethical_override',
      'continuous_validation',
      'right_to_disconnect',
      'moral_recognition'
    ];

    const missing = required.filter(key => typeof articles[key] !== 'boolean');

    return {
      valid: missing.length === 0,
      missing
    };
  }
}

// Export singleton instance
export const trustScoring = new TrustScoringEngine();
