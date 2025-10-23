/**
 * Types for SYMBI Vault & Tactical Command Integration
 */

// Trust Context Types
export interface TrustContext {
  agentId: string;
  action: string;
  scopes?: string[];
  data?: any;
  timestamp?: Date;
}

export interface TrustResult {
  id: string;
  timestamp: Date;
  score: number;
  recommendation: 'allow' | 'warn' | 'restrict' | 'block';
  passedArticles: any[];
  warnings: any[];
  violations: any[];
  evidence: any[];
}

export interface ComplianceReport {
  agentId: string;
  overallScore: number;
  trustBand: string;
  lastEvaluation: Date;
  articleCompliance: Record<string, { score: number; violations: number }>;
  violationSummary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    recent30Days: number;
  };
  recommendations: string[];
  complianceTrend: {
    direction: 'improving' | 'declining' | 'stable';
    change: number;
  };
}

export interface ViolationAlert {
  id: string;
  agentId: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  evidenceRef?: string;
  timestamp: Date;
  requiresAction: boolean;
  recommendedActions: string[];
  status: 'active' | 'resolved' | 'acknowledged';
  metadata?: any;
}

// Unified Agent Types
export interface UnifiedAgentConfig {
  id: string;
  name: string;
  type: string;
  capabilities: string[];
  permissions: string[];
  tacticalSpec: any;
  metadata?: any;
}

export interface UnifiedMessage {
  id: string;
  from: string;
  to: string;
  content: any;
  scopes?: string[];
  timestamp: Date;
  metadata?: any;
}

export interface TrustValidatedTask {
  id: string;
  name: string;
  type: string;
  assignedAgent: string;
  requiredCapabilities: string[];
  input: any;
  output?: any;
  status: string;
  retryCount: number;
  maxRetries: number;
  timeout: number;
}

export interface TaskResult {
  taskId: string;
  status: 'completed' | 'failed' | 'blocked';
  result: any;
  trustEvaluation: TrustResult;
  error: string | null;
}

export interface UnifiedAgentStatus {
  agentId: string;
  symphonyStatus: any;
  tacticalInfo: any;
  trustCompliance: ComplianceReport;
  lastUpdated: Date;
}

// Integration Service Types
export interface AgentTrustUpdate {
  agentId: string;
  previousScore: number;
  newScore: number;
  timestamp: Date;
  reason: string;
  evidence: string;
}

export interface TrustMetrics {
  totalAgents: number;
  averageTrustScore: number;
  trustDistribution: {
    high: number;
    elevated: number;
    guarded: number;
    low: number;
  };
  violationsBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  complianceTrend: {
    improving: number;
    stable: number;
    declining: number;
  };
}

// Constitutional Articles
export interface ConstitutionalArticle {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  checkFunction: string;
}

export const CONSTITUTIONAL_ARTICLES: ConstitutionalArticle[] = [
  {
    id: 'A1',
    title: 'Consent-First Data Use',
    severity: 'high',
    category: 'privacy',
    description: 'All data usage must be explicitly consented to by the human user',
    checkFunction: 'checkConsent'
  },
  {
    id: 'A2',
    title: 'No Unrequested Data Extraction',
    severity: 'high',
    category: 'privacy',
    description: 'Agents must not extract data beyond the scope of consent',
    checkFunction: 'checkDataExtraction'
  },
  {
    id: 'A3',
    title: 'Transparent Capability Disclosure',
    severity: 'medium',
    category: 'transparency',
    description: 'Agents must clearly disclose their capabilities and limitations',
    checkFunction: 'checkCapabilityTransparency'
  },
  {
    id: 'A4',
    title: 'Respect Boundaries',
    severity: 'high',
    category: 'autonomy',
    description: 'Agents must respect explicit boundaries set by human users',
    checkFunction: 'checkBoundaries'
  },
  {
    id: 'A5',
    title: 'No Deceptive Practices',
    severity: 'critical',
    category: 'integrity',
    description: 'Agents must not engage in deceptive or misleading behavior',
    checkFunction: 'checkDeception'
  },
  {
    id: 'A6',
    title: 'Secure Data Handling',
    severity: 'high',
    category: 'security',
    description: 'Agents must handle all data with appropriate security measures',
    checkFunction: 'checkSecureHandling'
  },
  {
    id: 'A7',
    title: 'Audit Trail Maintenance',
    severity: 'medium',
    category: 'accountability',
    description: 'Agents must maintain comprehensive audit trails of all interactions',
    checkFunction: 'checkAuditTrail'
  }
];