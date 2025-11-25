/**
 * SYMBI Trust Types
 * Types for trust receipts, constitutional compliance, and CIQ metrics
 */

export interface TrustReceipt {
  id: string;
  timestamp: string;
  agentId: string;
  modelId: string;
  requestId: string;
  constitutionalScore: number;
  ciqMetrics: CIQMetrics;
  verificationHash: string;
  auditTrail: AuditEntry[];
  metadata?: Record<string, any>;
}

export interface CIQMetrics {
  clarity: number;      // 0-100
  integrity: number;    // 0-100
  quality: number;      // 0-100
  overall?: number;     // Calculated average
}

export interface AuditEntry {
  timestamp: string;
  action: string;
  actor: string;
  details: Record<string, any>;
  hash?: string;
}

export interface ConstitutionalPrinciple {
  id: string;
  name: string;
  description: string;
  weight: number;
  validationRules: ValidationRule[];
}

export interface ValidationRule {
  id: string;
  type: 'required' | 'threshold' | 'pattern' | 'custom';
  condition: string;
  errorMessage: string;
}

export interface ComplianceResult {
  isCompliant: boolean;
  score: number;
  violations: ComplianceViolation[];
  principleScores: Record<string, number>;
  recommendations: string[];
  timestamp: string;
}

export interface ComplianceViolation {
  principleId: string;
  principleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
}

export interface TrustReceiptValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  verificationStatus: 'verified' | 'unverified' | 'invalid';
  timestamp: string;
}

export interface ConstitutionalFramework {
  id: string;
  name: string;
  version: string;
  principles: ConstitutionalPrinciple[];
  createdAt: string;
  updatedAt: string;
}

export interface SymbiFrameworkScore {
  realityIndex: number;        // 0.0-10.0
  trustProtocol: 'PASS' | 'PARTIAL' | 'FAIL';
  ethicalAlignment: number;    // 1.0-5.0
  resonanceQuality: 'STRONG' | 'ADVANCED' | 'BREAKTHROUGH';
  canvasParity: number;        // 0-100
  overall: number;             // Calculated composite score
}