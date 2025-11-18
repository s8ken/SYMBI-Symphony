/**
 * SYMBI Agent Production Framework - Orchestrator
 * Central orchestrator for managing agents, tasks, and communication
 */

import { 
  AgentConfig, 
  AgentStatus, 
  Task, 
  TaskStatus,
  Message, 
  AgentOrchestrator,
  MetricData,
  HealthCheck,
  AgentError,
  AgentEvent,
  Priority
} from './types';
import { requiresHumanApproval } from './oversight'

export interface OrchestratorConfig {
  id: string;
  port: number;
  databaseUrl: string;
  messageBrokerUrl?: string;
  maxAgents?: number;
  taskQueueSize?: number;
  heartbeatTimeout?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export class SymbiOrchestrator implements AgentOrchestrator {
  private config: OrchestratorConfig;
  private agents: Map<string, AgentConfig> = new Map();
  private agentStatus: Map<string, AgentStatus> = new Map();
  private tasks: Map<string, Task> = new Map();
  private taskQueue: Task[] = [];
  private messages: Map<string, Message[]> = new Map(); // agentId -> messages
  private metrics: Map<string, MetricData[]> = new Map();
  private healthChecks: Map<string, HealthCheck> = new Map();
  private errors: AgentError[] = [];
  private events: AgentEvent[] = [];
  private heartbeats: Map<string, Date> = new Map();

  constructor(config: OrchestratorConfig) {
    this.config = config;
    this.startHeartbeatMonitoring();
  }

  /**
   * Register a new agent
   */
  async registerAgent(config: AgentConfig): Promise<void> {
    if (this.agents.has(config.id)) {
      throw new Error(`Agent ${config.id} is already registered`);
    }

    if (this.config.maxAgents && this.agents.size >= this.config.maxAgents) {
      throw new Error('Maximum number of agents reached');
    }

    this.agents.set(config.id, config);
    this.agentStatus.set(config.id, 'active');
    this.messages.set(config.id, []);
    this.heartbeats.set(config.id, new Date());

    console.log(`Agent ${config.id} registered successfully`);

    // Send registration event
    await this.recordEvent({
      id: this.generateId(),
      agentId: config.id,
      type: 'agent_registered',
      payload: { agentType: config.type, agentName: config.name },
      timestamp: new Date()
    });
  }

  /**
   * Unregister an agent
   */
  async unregisterAgent(agentId: string): Promise<void> {
    if (!this.agents.has(agentId)) {
      throw new Error(`Agent ${agentId} is not registered`);
    }

    // Cancel any pending tasks for this agent
    const agentTasks = Array.from(this.tasks.values()).filter(task => task.assignedAgent === agentId);
    for (const task of agentTasks) {
      if (task.status === 'in_progress' || task.status === 'pending') {
        task.status = 'cancelled';
        task.metadata.updatedAt = new Date();
      }
    }

    this.agents.delete(agentId);
    this.agentStatus.delete(agentId);
    this.messages.delete(agentId);
    this.heartbeats.delete(agentId);

    console.log(`Agent ${agentId} unregistered successfully`);

    // Send unregistration event
    await this.recordEvent({
      id: this.generateId(),
      agentId,
      type: 'agent_unregistered',
      payload: {},
      timestamp: new Date()
    });
  }

  /**
   * Assign a task to an agent
   */
  async assignTask(task: Task): Promise<void> {
    if (requiresHumanApproval(task)) {
      task.status = 'paused'
      task.metadata.updatedAt = new Date()
      await this.recordEvent({
        id: this.generateId(),
        agentId: 'orchestrator',
        type: 'human_oversight_required',
        payload: { taskId: task.id, type: task.type, priority: task.priority },
        timestamp: new Date()
      })
      this.tasks.set(task.id, task)
      return
    }
    // Find the best agent for this task
    const availableAgents = Array.from(this.agents.values()).filter(agent => {
      const status = this.agentStatus.get(agent.id);
      return status === 'active' || status === 'idle';
    });

    if (availableAgents.length === 0) {
      // Add to queue if no agents available
      if (this.config.taskQueueSize && this.taskQueue.length >= this.config.taskQueueSize) {
        throw new Error('Task queue is full');
      }
      this.taskQueue.push(task);
      return;
    }

    // Simple assignment strategy - find agent with matching capabilities
    let selectedAgent: AgentConfig | null = null;
    for (const agent of availableAgents) {
      // Check if agent has required capabilities for this task type
      const hasCapability = agent.capabilities.some(cap => 
        this.isCapabilityCompatible(cap.name, task.type)
      );
      if (hasCapability) {
        selectedAgent = agent;
        break;
      }
    }

    if (!selectedAgent) {
      // Fallback to first available agent
      selectedAgent = availableAgents[0];
    }

    task.assignedAgent = selectedAgent.id;
    task.status = 'pending';
    task.metadata.updatedAt = new Date();
    
    this.tasks.set(task.id, task);
    this.agentStatus.set(selectedAgent.id, 'busy');

    console.log(`Task ${task.id} assigned to agent ${selectedAgent.id}`);

    // Send task assignment message
    await this.sendMessageToAgent(selectedAgent.id, {
      id: this.generateId(),
      type: 'task_assignment',
      sender: 'orchestrator',
      recipient: selectedAgent.id,
      payload: { task },
      timestamp: new Date(),
      priority: task.priority
    });
  }

  async approveTask(taskId: string, reviewerId: string, note?: string): Promise<void> {
    const task = this.tasks.get(taskId)
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }
    if (task.status !== 'paused') {
      throw new Error(`Task ${taskId} is not awaiting approval`)
    }
    await this.recordEvent({
      id: this.generateId(),
      agentId: 'orchestrator',
      type: 'human_oversight_approved',
      payload: { taskId, reviewerId, note },
      timestamp: new Date()
    })
    task.status = 'pending'
    task.metadata.updatedAt = new Date()
    await this.assignTask(task)
  }

  /**
   * Get agent status
   */
  async getAgentStatus(agentId: string): Promise<AgentStatus> {
    const status = this.agentStatus.get(agentId);
    if (!status) {
      throw new Error(`Agent ${agentId} not found`);
    }
    return status;
  }

  /**
   * Get all registered agents
   */
  async getAllAgents(): Promise<AgentConfig[]> {
    return Array.from(this.agents.values());
  }

  /**
   * Get task status
   */
  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    return task.status;
  }

  /**
   * Update agent status
   */
  async updateAgentStatus(agentId: string, status: AgentStatus): Promise<void> {
    if (!this.agents.has(agentId)) {
      throw new Error(`Agent ${agentId} not found`);
    }

    this.agentStatus.set(agentId, status);
    this.heartbeats.set(agentId, new Date());

    // If agent becomes available, assign queued tasks
    if ((status === 'active' || status === 'idle') && this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      if (task) {
        await this.assignTask(task);
      }
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId: string, status: TaskStatus, result?: any): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.status = status;
    task.metadata.updatedAt = new Date();

    if (result) {
      task.payload.result = result;
    }

    // If task is completed or failed, make agent available
    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      const agentStatus = this.agentStatus.get(task.assignedAgent);
      if (agentStatus === 'busy') {
        this.agentStatus.set(task.assignedAgent, 'active');
      }

      // Assign next queued task if available
      if (this.taskQueue.length > 0) {
        const nextTask = this.taskQueue.shift();
        if (nextTask) {
          await this.assignTask(nextTask);
        }
      }
    }

    console.log(`Task ${taskId} status updated to ${status}`);
  }

  /**
   * Send message to a specific agent
   */
  async sendMessageToAgent(agentId: string, message: Message): Promise<void> {
    if (!this.agents.has(agentId)) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const agentMessages = this.messages.get(agentId) || [];
    agentMessages.push(message);
    this.messages.set(agentId, agentMessages);

    console.log(`Message sent to agent ${agentId}: ${message.type}`);
  }

  /**
   * Get messages for an agent
   */
  async getMessagesForAgent(agentId: string): Promise<Message[]> {
    if (!this.agents.has(agentId)) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const messages = this.messages.get(agentId) || [];
    // Clear messages after retrieval
    this.messages.set(agentId, []);
    return messages;
  }

  /**
   * Broadcast message to all agents
   */
  async broadcastMessage(message: Omit<Message, 'recipient'>): Promise<void> {
    for (const agentId of this.agents.keys()) {
      await this.sendMessageToAgent(agentId, {
        ...message,
        recipient: agentId
      } as Message);
    }
  }

  /**
   * Record agent metrics
   */
  async recordMetrics(agentId: string, metrics: MetricData[]): Promise<void> {
    if (!this.agents.has(agentId)) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const agentMetrics = this.metrics.get(agentId) || [];
    agentMetrics.push(...metrics);
    this.metrics.set(agentId, agentMetrics);

    console.log(`Recorded ${metrics.length} metrics for agent ${agentId}`);
  }

  /**
   * Record health check
   */
  async recordHealthCheck(agentId: string, healthCheck: HealthCheck): Promise<void> {
    if (!this.agents.has(agentId)) {
      throw new Error(`Agent ${agentId} not found`);
    }

    this.healthChecks.set(agentId, healthCheck);

    // Update agent status based on health check
    if (healthCheck.status === 'unhealthy') {
      await this.updateAgentStatus(agentId, 'error');
    } else if (healthCheck.status === 'healthy') {
      const currentStatus = this.agentStatus.get(agentId);
      if (currentStatus === 'error') {
        await this.updateAgentStatus(agentId, 'active');
      }
    }
  }

  /**
   * Record agent error
   */
  async recordError(error: AgentError): Promise<void> {
    this.errors.push(error);
    console.error(`Agent error recorded: ${error.agentId} - ${error.error.message}`);

    // If critical error, update agent status
    if (error.severity === 'critical') {
      await this.updateAgentStatus(error.agentId, 'error');
    }
  }

  /**
   * Record agent event
   */
  async recordEvent(event: AgentEvent): Promise<void> {
    this.events.push(event);
    console.log(`Agent event recorded: ${event.agentId} - ${event.type}`);
  }

  /**
   * Process heartbeat from agent
   */
  async processHeartbeat(agentId: string): Promise<void> {
    if (!this.agents.has(agentId)) {
      throw new Error(`Agent ${agentId} not found`);
    }

    this.heartbeats.set(agentId, new Date());
  }

  /**
   * Get system statistics
   */
  getSystemStats(): {
    totalAgents: number;
    activeAgents: number;
    totalTasks: number;
    pendingTasks: number;
    completedTasks: number;
    queuedTasks: number;
  } {
    const activeAgents = Array.from(this.agentStatus.values()).filter(
      status => status === 'active' || status === 'idle' || status === 'busy'
    ).length;

    const tasks = Array.from(this.tasks.values());
    const pendingTasks = tasks.filter(task => task.status === 'pending').length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;

    return {
      totalAgents: this.agents.size,
      activeAgents,
      totalTasks: tasks.length,
      pendingTasks,
      completedTasks,
      queuedTasks: this.taskQueue.length
    };
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeatMonitoring(): void {
    const timeout = this.config.heartbeatTimeout || 60000; // 1 minute default
    
    setInterval(() => {
      const now = new Date();
      for (const [agentId, lastHeartbeat] of this.heartbeats.entries()) {
        const timeSinceHeartbeat = now.getTime() - lastHeartbeat.getTime();
        if (timeSinceHeartbeat > timeout) {
          console.warn(`Agent ${agentId} missed heartbeat, marking as offline`);
          this.agentStatus.set(agentId, 'offline');
        }
      }
    }, timeout / 2); // Check every half timeout period
  }

  /**
   * Check if capability is compatible with task type
   */
  private isCapabilityCompatible(capabilityName: string, taskType: string): boolean {
    const compatibilityMap: Record<string, string[]> = {
      'git_operations': ['code_review', 'deployment'],
      'code_analysis': ['code_review', 'security_scan'],
      'deployment': ['deployment'],
      'monitoring': ['monitoring'],
      'security_scanning': ['security_scan'],
      'api_integration': ['integration'],
      'webhook_management': ['communication']
    };

    const compatibleTasks = compatibilityMap[capabilityName] || [];
    return compatibleTasks.includes(taskType);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Unregister all agents
    for (const agentId of this.agents.keys()) {
      await this.unregisterAgent(agentId);
    }

    console.log('Orchestrator cleanup completed');
  }
}
