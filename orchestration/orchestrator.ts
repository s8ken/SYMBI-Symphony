/**
 * SYMBI Agent Orchestrator
 * 
 * Manages the lifecycle and coordination of AI agents across the SYMBI ecosystem.
 * Handles agent registration, capability matching, and task distribution.
 */

import { EventEmitter } from 'events';
import { AgentRequest, AgentResponse, AgentCapabilities, AgentStatus } from '../shared/types/src';

export interface Agent {
  id: string;
  name: string;
  type: 'resonate' | 'symphony' | 'vault' | 'external';
  capabilities: AgentCapabilities;
  status: AgentStatus;
  endpoint?: string;
  lastSeen: Date;
  trustScore: number;
  metadata: Record<string, any>;
}

export class AgentOrchestrator extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private taskQueue: AgentRequest[] = [];
  private activeTasks: Map<string, AgentRequest> = new Map();

  constructor() {
    super();
    this.setupEventHandlers();
    this.startHealthCheck();
  }

  private setupEventHandlers(): void {
    this.on('agent:registered', (agent: Agent) => {
      console.log(`Agent registered: ${agent.name} (${agent.id})`);
    });

    this.on('agent:unregistered', (agentId: string) => {
      console.log(`Agent unregistered: ${agentId}`);
    });

    this.on('task:completed', (taskId: string, result: AgentResponse) => {
      console.log(`Task completed: ${taskId}`);
      this.activeTasks.delete(taskId);
    });
  }

  /**
   * Register a new agent with the orchestrator
   */
  public async registerAgent(agent: Omit<Agent, 'id' | 'lastSeen'>): Promise<string> {
    const agentId = this.generateAgentId(agent);
    const fullAgent: Agent = {
      ...agent,
      id: agentId,
      lastSeen: new Date(),
      status: 'active'
    };

    this.agents.set(agentId, fullAgent);
    this.emit('agent:registered', fullAgent);
    
    return agentId;
  }

  /**
   * Unregister an agent
   */
  public async unregisterAgent(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }

    this.agents.delete(agentId);
    this.emit('agent:unregistered', agentId);
    
    return true;
  }

  /**
   * Coordinate a task with the best available agent
   */
  public async coordinate(agentId: string, request: AgentRequest): Promise<AgentResponse> {
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    if (agent.status !== 'active') {
      throw new Error(`Agent not active: ${agentId} (status: ${agent.status})`);
    }

    // Check if agent has required capabilities
    if (!this.hasCapabilities(agent, request.requiredCapabilities)) {
      throw new Error(`Agent lacks required capabilities: ${agentId}`);
    }

    // Update last seen
    agent.lastSeen = new Date();
    this.agents.set(agentId, agent);

    // Execute the request
    const response = await this.executeRequest(agent, request);
    
    // Update agent based on execution result
    this.updateAgentMetrics(agentId, response);
    
    return response;
  }

  /**
   * Find the best agent for a given task
   */
  public async findBestAgent(request: AgentRequest): Promise<Agent | null> {
    const candidates = Array.from(this.agents.values())
      .filter(agent => 
        agent.status === 'active' &&
        this.hasCapabilities(agent, request.requiredCapabilities)
      )
      .sort((a, b) => {
        // Sort by trust score and capability match
        const aScore = this.calculateAgentScore(a, request);
        const bScore = this.calculateAgentScore(b, request);
        return bScore - aScore;
      });

    return candidates.length > 0 ? candidates[0] : null;
  }

  /**
   * List all registered agents
   */
  public async listAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  /**
   * Get agent status
   */
  public async getAgentStatus(agentId: string): Promise<AgentStatus | null> {
    const agent = this.agents.get(agentId);
    return agent ? agent.status : null;
  }

  /**
   * Get orchestrator status
   */
  public getStatus(): any {
    return {
      totalAgents: this.agents.size,
      activeAgents: Array.from(this.agents.values()).filter(a => a.status === 'active').length,
      queuedTasks: this.taskQueue.length,
      activeTasks: this.activeTasks.size
    };
  }

  private async executeRequest(agent: Agent, request: AgentRequest): Promise<AgentResponse> {
    try {
      // This would integrate with the actual agent endpoint
      // For now, we'll simulate a response
      
      const response: AgentResponse = {
        success: true,
        data: this.generateMockResponse(agent, request),
        agentId: agent.id,
        timestamp: new Date().toISOString(),
        executionTime: Math.random() * 1000, // Mock execution time
        metadata: {
          agentType: agent.type,
          capabilities: agent.capabilities
        }
      };

      this.emit('task:completed', request.id, response);
      
      return response;
    } catch (error) {
      const errorResponse: AgentResponse = {
        success: false,
        error: error.message,
        agentId: agent.id,
        timestamp: new Date().toISOString(),
        executionTime: 0
      };

      this.emit('task:failed', request.id, errorResponse);
      
      return errorResponse;
    }
  }

  private hasCapabilities(agent: Agent, required: string[]): boolean {
    if (!required || required.length === 0) {
      return true;
    }

    return required.every(cap => 
      agent.capabilities.supported.includes(cap)
    );
  }

  private calculateAgentScore(agent: Agent, request: AgentRequest): number {
    let score = agent.trustScore;

    // Add bonus for capability match
    const capabilityMatch = request.requiredCapabilities.filter(cap => 
      agent.capabilities.supported.includes(cap)
    ).length / Math.max(request.requiredCapabilities.length, 1);
    
    score += capabilityMatch * 0.3;

    // Add bonus for recent activity
    const hoursSinceLastSeen = (Date.now() - agent.lastSeen.getTime()) / (1000 * 60 * 60);
    const activityScore = Math.max(0, 1 - hoursSinceLastSeen / 24); // Decay over 24 hours
    score += activityScore * 0.2;

    return score;
  }

  private updateAgentMetrics(agentId: string, response: AgentResponse): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    // Update trust score based on response
    if (response.success) {
      agent.trustScore = Math.min(1.0, agent.trustScore + 0.01);
    } else {
      agent.trustScore = Math.max(0.0, agent.trustScore - 0.05);
    }

    this.agents.set(agentId, agent);
  }

  private generateAgentId(agent: Omit<Agent, 'id' | 'lastSeen'>): string {
    const prefix = agent.type.substring(0, 3).toUpperCase();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${timestamp}-${random}`;
  }

  private generateMockResponse(agent: Agent, request: AgentRequest): any {
    // Mock response generation based on agent type and request
    switch (agent.type) {
      case 'resonate':
        return {
          analysis: 'Content analyzed by Resonate',
          sentiment: 0.8,
          entities: ['entity1', 'entity2'],
          confidence: 0.95
        };
      
      case 'symphony':
        return {
          orchestration: 'Task orchestrated by Symphony',
          trustReceipt: {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            score: 0.92
          }
        };
      
      case 'vault':
        return {
          secret: 'Secret retrieved from Vault',
          access: 'granted',
          timestamp: new Date().toISOString()
        };
      
      default:
        return {
          message: 'Request processed by external agent',
          agentId: agent.id
        };
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private startHealthCheck(): void {
    setInterval(() => {
      this.performHealthCheck();
    }, 60000); // Every minute
  }

  private performHealthCheck(): void {
    const now = new Date();
    const timeoutMs = 5 * 60 * 1000; // 5 minutes

    for (const [agentId, agent] of this.agents) {
      if (now.getTime() - agent.lastSeen.getTime() > timeoutMs) {
        if (agent.status === 'active') {
          agent.status = 'inactive';
          this.agents.set(agentId, agent);
          console.log(`Agent marked inactive due to timeout: ${agentId}`);
        }
      }
    }
  }
}