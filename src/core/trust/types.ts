/**
 * Trust Protocol Type Definitions
 * Re-exports from agent types for cleaner imports
 */

export type {
  TrustArticles,
  TrustScores,
  TrustDeclaration,
  TrustAuditEntry,
  TrustMetrics,
  TrustLevel,
  VerifiableCredential,
  CredentialProof,
  DIDDocument,
  VerificationMethod,
  ServiceEndpoint
} from '../agent/types';

export interface TrustScoringWeights {
  inspection_mandate: number;
  consent_architecture: number;
  ethical_override: number;
  continuous_validation: number;
  right_to_disconnect: number;
  moral_recognition: number;
}

export interface TrustScoringConfig {
  weights: TrustScoringWeights;
  critical_articles: string[];
  penalty_per_violation: number;
  full_compliance_bonus: number;
  temporal_decay_lambda: number;
  confidence_level: number;
}

export interface ScoringBreakdown {
  [article: string]: {
    value: boolean;
    weight: number;
    compliance_contribution: number;
    guilt_contribution: number;
  };
}

export interface ScoringResult {
  compliance_score: number;
  guilt_score: number;
  breakdown: ScoringBreakdown;
  trust_level: TrustLevel;
}
