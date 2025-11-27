/**
 * SYMBI Agent Orchestrator
 * 
 * Manages the lifecycle and coordination of AI agents across the SYMBI ecosystem.
 * Handles agent registration, capability matching, and task distribution.
 */

import { EventEmitter } from 'events';
import { AgentRequest, AgentResponse, AgentCapabilities, AgentStatus } from '../shared/types/src';

// HTTP client for making requests to agent endpoints
interface HttpClientOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

class HttpClient {
  private defaultOptions: HttpClientOptions = {
    timeout: 10000, // 10 seconds
    retries: 3,
    retryDelay: 1000 // 1 second
  };

  async request(url: string, options: RequestInit & HttpClientOptions = {}): Promise<any> {
    const { timeout, retries, retryDelay, ...fetchOptions } = { ...this.defaultOptions, ...options };

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;

        if (attempt < retries && this.isRetryableError(error)) {
          console.warn(`Request attempt ${attempt + 1} failed, retrying in ${retryDelay}ms:`, error.message);
          await this.delay(retryDelay);
          continue;
        }

        break;
      }
    }

    throw new Error(`Request failed after ${retries + 1} attempts: ${lastError.message}`);
  }

  private isRetryableError(error: any): boolean {
    // Retry on network errors, timeouts, and server errors (5xx)
    return error.name === 'AbortError' ||
           error.message.includes('fetch') ||
           error.message.includes('network') ||
           error.message.includes('ECONNREFUSED') ||
           error.message.includes('ENOTFOUND') ||
           (error.message.includes('HTTP') && error.message.includes('5'));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

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
    const startTime = Date.now();

    try {
      // Make actual HTTP request to agent endpoint
      const endpoint = agent.metadata.endpoint;
      if (!endpoint) {
        throw new Error(`Agent ${agent.id} has no endpoint configured`);
      }

      // Prepare request payload
      const requestPayload = {
        id: request.id,
        type: agent.type,
        capabilities: request.requiredCapabilities,
        data: request.data,
        metadata: request.metadata
      };

      // Make HTTP request to agent
      const agentResponse = await this.httpClient.request(`${endpoint}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SYMBI-Orchestrator/1.0'
        },
        body: JSON.stringify(requestPayload),
        timeout: 15000 // 15 seconds for agent requests
      });

      const executionTime = Date.now() - startTime;

      const response: AgentResponse = {
        success: true,
        data: agentResponse,
        agentId: agent.id,
        timestamp: new Date().toISOString(),
        executionTime,
        metadata: {
          agentType: agent.type,
          capabilities: agent.capabilities,
          endpoint: endpoint
        }
      };

      this.emit('task:completed', request.id, response);

      return response;
    } catch (error) {
      const executionTime = Date.now() - startTime;

      const errorResponse: AgentResponse = {
        success: false,
        error: `Agent request failed: ${error.message}`,
        agentId: agent.id,
        timestamp: new Date().toISOString(),
        executionTime,
        metadata: {
          agentType: agent.type,
          endpoint: agent.metadata.endpoint
        }
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
        if (agent.status !== 'failed') {
          agent.status = 'failed';
          this.agents.set(agentId, agent);
          console.log(`Agent marked failed due to timeout: ${agentId}`);
        }
      }
    }
  }
}