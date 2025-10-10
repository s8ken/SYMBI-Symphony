/**
 * SYMBI Agent Production Framework - Core SDK
 * Main SDK for agent registration, authentication, and communication
 */

import { 
  AgentConfig, 
  AgentStatus, 
  Task, 
  Message, 
  AgentCommunication, 
  AgentCredentials,
  MetricData,
  HealthCheck,
  AgentError,
  AgentEvent
} from './types';

export interface SymbiAgentSDKConfig {
  orchestratorUrl: string;
  agentId: string;
  apiKey: string;
  environment: 'development' | 'staging' | 'production';
  retryAttempts?: number;
  timeout?: number;
  heartbeatInterval?: number;
}

export class SymbiAgentSDK implements AgentCommunication {
  private config: SymbiAgentSDKConfig;
  private isRegistered: boolean = false;
  private heartbeatTimer?: NodeJS.Timeout;
  private messageHandlers: Map<string, (message: Message) => void> = new Map();

  constructor(config: SymbiAgentSDKConfig) {
    this.config = config;
  }

  /**
   * Register the agent with the orchestrator
   */
  async registerAgent(agentConfig: AgentConfig): Promise<void> {
    try {
      const response = await fetch(`${this.config.orchestratorUrl}/agents/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(agentConfig),
      });

      if (!response.ok) {
        throw new Error(`Registration failed: ${response.statusText}`);
      }

      this.isRegistered = true;
      this.startHeartbeat();
      
      console.log(`Agent ${agentConfig.id} registered successfully`);
    } catch (error) {
      console.error('Agent registration failed:', error);
      throw error;
    }
  }

  /**
   * Unregister the agent from the orchestrator
   */
  async unregisterAgent(): Promise<void> {
    try {
      const response = await fetch(`${this.config.orchestratorUrl}/agents/${this.config.agentId}/unregister`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Unregistration failed: ${response.statusText}`);
      }

      this.isRegistered = false;
      this.stopHeartbeat();
      
      console.log(`Agent ${this.config.agentId} unregistered successfully`);
    } catch (error) {
      console.error('Agent unregistration failed:', error);
      throw error;
    }
  }

  /**
   * Update agent status
   */
  async updateStatus(status: AgentStatus): Promise<void> {
    try {
      const response = await fetch(`${this.config.orchestratorUrl}/agents/${this.config.agentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`Status update failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Status update failed:', error);
      throw error;
    }
  }

  /**
   * Get assigned tasks
   */
  async getTasks(): Promise<Task[]> {
    try {
      const response = await fetch(`${this.config.orchestratorUrl}/agents/${this.config.agentId}/tasks`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get tasks: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get tasks:', error);
      throw error;
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId: string, status: string, result?: any): Promise<void> {
    try {
      const response = await fetch(`${this.config.orchestratorUrl}/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({ status, result }),
      });

      if (!response.ok) {
        throw new Error(`Task status update failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Task status update failed:', error);
      throw error;
    }
  }

  /**
   * Send a message to another agent
   */
  async sendMessage(message: Message): Promise<void> {
    try {
      const response = await fetch(`${this.config.orchestratorUrl}/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`Message send failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Message send failed:', error);
      throw error;
    }
  }

  /**
   * Receive messages for this agent
   */
  async receiveMessage(): Promise<Message | null> {
    try {
      const response = await fetch(`${this.config.orchestratorUrl}/agents/${this.config.agentId}/messages`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        if (response.status === 204) {
          return null; // No messages
        }
        throw new Error(`Message receive failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Message receive failed:', error);
      throw error;
    }
  }

  /**
   * Broadcast a message to all agents
   */
  async broadcastMessage(message: Omit<Message, 'recipient'>): Promise<void> {
    try {
      const response = await fetch(`${this.config.orchestratorUrl}/messages/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`Broadcast failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Broadcast failed:', error);
      throw error;
    }
  }

  /**
   * Subscribe to messages with a callback
   */
  subscribeToMessages(callback: (message: Message) => void): void {
    const handlerId = Math.random().toString(36).substr(2, 9);
    this.messageHandlers.set(handlerId, callback);

    // Start polling for messages
    const pollMessages = async () => {
      try {
        const message = await this.receiveMessage();
        if (message) {
          callback(message);
        }
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    };

    // Poll every 5 seconds
    const interval = setInterval(pollMessages, 5000);
    
    // Store interval for cleanup
    this.messageHandlers.set(`${handlerId}_interval`, interval as any);
  }

  /**
   * Send metrics data
   */
  async sendMetrics(metrics: MetricData[]): Promise<void> {
    try {
      const response = await fetch(`${this.config.orchestratorUrl}/agents/${this.config.agentId}/metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({ metrics }),
      });

      if (!response.ok) {
        throw new Error(`Metrics send failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Metrics send failed:', error);
      throw error;
    }
  }

  /**
   * Send health check data
   */
  async sendHealthCheck(healthCheck: HealthCheck): Promise<void> {
    try {
      const response = await fetch(`${this.config.orchestratorUrl}/agents/${this.config.agentId}/health`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(healthCheck),
      });

      if (!response.ok) {
        throw new Error(`Health check send failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Health check send failed:', error);
      throw error;
    }
  }

  /**
   * Report an error
   */
  async reportError(error: AgentError): Promise<void> {
    try {
      const response = await fetch(`${this.config.orchestratorUrl}/agents/${this.config.agentId}/errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(error),
      });

      if (!response.ok) {
        throw new Error(`Error report failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error report failed:', error);
      throw error;
    }
  }

  /**
   * Send an event
   */
  async sendEvent(event: AgentEvent): Promise<void> {
    try {
      const response = await fetch(`${this.config.orchestratorUrl}/agents/${this.config.agentId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`Event send failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Event send failed:', error);
      throw error;
    }
  }

  /**
   * Start heartbeat to orchestrator
   */
  private startHeartbeat(): void {
    const interval = this.config.heartbeatInterval || 30000; // 30 seconds default
    
    this.heartbeatTimer = setInterval(async () => {
      try {
        await fetch(`${this.config.orchestratorUrl}/agents/${this.config.agentId}/heartbeat`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
        });
      } catch (error) {
        console.error('Heartbeat failed:', error);
      }
    }, interval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.stopHeartbeat();
    
    // Clear message handlers
    for (const [key, handler] of this.messageHandlers.entries()) {
      if (key.endsWith('_interval')) {
        clearInterval(handler as any);
      }
    }
    this.messageHandlers.clear();

    if (this.isRegistered) {
      await this.unregisterAgent();
    }
  }
}

/**
 * Factory function to create a new SymbiAgentSDK instance
 */
export function createAgentSDK(config: SymbiAgentSDKConfig): SymbiAgentSDK {
  return new SymbiAgentSDK(config);
}