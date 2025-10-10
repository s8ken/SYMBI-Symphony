/**
 * SYMBI Agent Production Framework - Core Types
 * Comprehensive type definitions for the AI agent ecosystem
 */

// Core Agent Types
export type AgentType = 
  | 'repository_manager'
  | 'website_manager'
  | 'integration_manager'
  | 'orchestrator'
  | 'monitoring_agent'
  | 'security_agent';

export type AgentStatus = 
  | 'initializing'
  | 'active'
  | 'idle'
  | 'busy'
  | 'error'
  | 'maintenance'
  | 'offline';

export type TaskStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused';

export type TaskType = 
  | 'code_review'
  | 'deployment'
  | 'monitoring'
  | 'security_scan'
  | 'backup'
  | 'maintenance'
  | 'integration'
  | 'communication'
  | 'repository_sync';

export type MessageType = 
  | 'task_assignment'
  | 'status_update'
  | 'error_report'
  | 'completion_notification'
  | 'inter_agent_communication'
  | 'human_oversight_request';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

// Agent Configuration Interface
export interface AgentConfig {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  capabilities: AgentCapability[];
  permissions: AgentPermission[];
  config: {
    maxConcurrentTasks?: number;
    timeout?: number;
    retryAttempts?: number;
    heartbeatInterval?: number;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
    // Repository Manager specific
    repositoryUrl?: string;
    branch?: string;
    accessToken?: string;
    webhookUrl?: string;
    autoMerge?: boolean;
    reviewRequired?: boolean;
    // Website Manager specific
    domain?: string;
    deploymentTarget?: string;
    buildCommand?: string;
    outputDirectory?: string;
    environmentVariables?: Record<string, string>;
    // Integration Manager specific
    sourceSystem?: string;
    targetSystem?: string;
    mappingRules?: Record<string, any>;
    syncInterval?: number;
    bidirectional?: boolean;
    // Security and monitoring
    securityPolicies?: string[];
    scanTargets?: string[];
    monitoringTargets?: string[];
    alertChannels?: string[];
    // Additional configuration
    [key: string]: any;
  };
  metadata: {
    version: string;
    createdAt: Date;
    lastUpdated: Date;
    owner: string;
    environment: 'development' | 'staging' | 'production';
  };
}

// Agent Capability Interface
export interface AgentCapability {
  name: string;
  version: string;
  description?: string;
  parameters?: Record<string, any>;
  dependencies?: string[];
}

// Agent Permission Interface
export interface AgentPermission {
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
}

// Task Interface
export interface Task {
  id: string;
  type: TaskType;
  status: TaskStatus;
  priority: Priority;
  assignedAgent?: string;
  payload: Record<string, any>;
  requiredCapabilities?: string[];
  createdAt: number;
  updatedAt: number;
  metadata?: {
    deadline?: Date;
    retryCount?: number;
    parentTaskId?: string;
  };
}

// Message Interface
export interface Message {
  id: string;
  type: MessageType;
  sender: string;
  recipient: string;
  payload: Record<string, any>;
  timestamp: Date;
  priority: Priority;
  correlationId?: string;
}

// Agent Communication Interface
export interface AgentCommunication {
  sendMessage(message: Message): Promise<void>;
  receiveMessage(): Promise<Message | null>;
  broadcastMessage(message: Omit<Message, 'recipient'>): Promise<void>;
  subscribeToMessages(callback: (message: Message) => void): void;
}

// Agent Orchestrator Interface
export interface AgentOrchestrator {
  registerAgent(config: AgentConfig): Promise<void>;
  unregisterAgent(agentId: string): Promise<void>;
  assignTask(task: Task): Promise<void>;
  getAgentStatus(agentId: string): Promise<AgentStatus>;
  getAllAgents(): Promise<AgentConfig[]>;
  getTaskStatus(taskId: string): Promise<TaskStatus>;
}

// Repository Manager Specific Types
export interface RepositoryConfig {
  url: string;
  branch: string;
  accessToken: string;
  webhookUrl?: string;
  autoMerge?: boolean;
  reviewRequired?: boolean;
}

// Website Manager Specific Types
export interface WebsiteConfig {
  domain: string;
  deploymentTarget: string;
  buildCommand: string;
  outputDirectory: string;
  environmentVariables?: Record<string, string>;
}

// Integration Manager Specific Types
export interface IntegrationConfig {
  sourceSystem: string;
  targetSystem: string;
  mappingRules: Record<string, any>;
  syncInterval?: number;
  bidirectional?: boolean;
}

// Monitoring and Metrics Types
export interface MetricData {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface HealthCheck {
  agentId: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  details?: Record<string, any>;
}

// Error and Event Types
export interface AgentError {
  id: string;
  agentId: string;
  taskId?: string;
  error: Error;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

export interface AgentEvent {
  id: string;
  agentId: string;
  type: string;
  payload: Record<string, any>;
  timestamp: Date;
}

// Security and Authentication Types
export interface AgentCredentials {
  agentId: string;
  apiKey: string;
  secretKey: string;
  expiresAt?: Date;
  permissions: string[];
}

export interface SecurityPolicy {
  id: string;
  name: string;
  rules: SecurityRule[];
  enforcementLevel: 'advisory' | 'enforced' | 'strict';
}

export interface SecurityRule {
  id: string;
  condition: string;
  action: 'allow' | 'deny' | 'audit';
  description?: string;
}