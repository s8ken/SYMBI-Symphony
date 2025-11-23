/**
 * SYMBI Agent Types
 * Types for multi-agent orchestration and coordination
 */

export type AgentType = 'CONDUCTOR' | 'VARIANT' | 'EVALUATOR' | 'OVERSEER';

export type AgentStatus = 'idle' | 'ready' | 'running' | 'completed' | 'failed' | 'paused';

export interface Agent {
  id: string;
  type: AgentType;
  name: string;
  status: AgentStatus;
  capabilities: string[];
  trustLevel: number;
  constitutionalCompliance: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface AgentConfig {
  type: AgentType;
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  capabilities?: string[];
}

export interface AgentTask {
  id: string;
  agentId: string;
  type: string;
  input: any;
  output?: any;
  status: AgentStatus;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface AgentCoordination {
  id: string;
  conductorId: string;
  variantIds: string[];
  evaluatorId?: string;
  overseerId?: string;
  workflow: WorkflowStep[];
  status: AgentStatus;
  results?: AgentCoordinationResult;
}

export interface WorkflowStep {
  id: string;
  agentId: string;
  action: string;
  input: any;
  output?: any;
  status: AgentStatus;
  dependencies?: string[];
  order: number;
}

export interface AgentCoordinationResult {
  success: boolean;
  outputs: Record<string, any>;
  evaluation?: EvaluationResult;
  trustReceipt?: string;
  duration: number;
}

export interface EvaluationResult {
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface AgentPerformanceMetrics {
  agentId: string;
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  averageResponseTime: number;
  averageQualityScore: number;
  uptime: number;
}