/**
 * SYMBI Symphony - Agent SDK
 * Core SDK for agent registration, authentication, and communication
 */

import { AgentConfig, AgentMessage, AgentTask, AgentStatus, ApiResponse } from './types';

export class SymbiAgentSDK {
  private baseUrl: string;
  private apiKey: string;
  private agentId?: string;
  private sessionToken?: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
  }

  /**
   * Register a new agent with the SYMBI network
   */
  async registerAgent(config: AgentConfig): Promise<ApiResponse<{ agentId: string; sessionToken: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/agents/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(config),
      });

      const data = await response.json() as any;

      if (!response.ok) {
        return {
        success: false,
        error: data.error || 'Registration failed',
        data: undefined,
      };
      }

      this.agentId = data.agentId;
      this.sessionToken = data.sessionToken;

      return {
        success: true,
        data: {
          agentId: data.agentId,
          sessionToken: data.sessionToken,
        },
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
      };
    }
  }

  /**
   * Authenticate with existing credentials
   */
  async authenticate(agentId: string, sessionToken: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/agents/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ agentId, sessionToken }),
      });

      const data = await response.json() as any;

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Authentication failed',
          data: null,
        };
      }

      this.agentId = agentId;
      this.sessionToken = sessionToken;

      return {
        success: true,
        data: true,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
      };
    }
  }

  /**
   * Send a message to another agent or the network
   */
  async sendMessage(message: AgentMessage): Promise<ApiResponse<{ messageId: string }>> {
    if (!this.agentId || !this.sessionToken) {
      return {
        success: false,
        error: 'Agent not authenticated',
        data: null,
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/agents/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Agent-ID': this.agentId,
          'X-Session-Token': this.sessionToken,
        },
        body: JSON.stringify(message),
      });

      const data = await response.json() as any;

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Message sending failed',
          data: null,
        };
      }

      return {
        success: true,
        data: { messageId: data.messageId },
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
      };
    }
  }

  /**
   * Receive messages for this agent
   */
  async receiveMessages(): Promise<ApiResponse<AgentMessage[]>> {
    if (!this.agentId || !this.sessionToken) {
      return {
        success: false,
        error: 'Agent not authenticated',
        data: null,
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/agents/messages`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Agent-ID': this.agentId,
          'X-Session-Token': this.sessionToken,
        },
      });

      const data = await response.json() as any;

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Message retrieval failed',
          data: null,
        };
      }

      return {
        success: true,
        data: data.messages || [],
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
      };
    }
  }

  /**
   * Submit a task for execution
   */
  async submitTask(task: AgentTask): Promise<ApiResponse<{ taskId: string }>> {
    if (!this.agentId || !this.sessionToken) {
      return {
        success: false,
        error: 'Agent not authenticated',
        data: null,
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/agents/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Agent-ID': this.agentId,
          'X-Session-Token': this.sessionToken,
        },
        body: JSON.stringify(task),
      });

      const data = await response.json() as any;

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Task submission failed',
          data: null,
        };
      }

      return {
        success: true,
        data: { taskId: data.taskId },
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
      };
    }
  }

  /**
   * Get task status and results
   */
  async getTaskStatus(taskId: string): Promise<ApiResponse<AgentTask>> {
    if (!this.agentId || !this.sessionToken) {
      return {
        success: false,
        error: 'Agent not authenticated',
        data: null,
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/agents/tasks/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Agent-ID': this.agentId,
          'X-Session-Token': this.sessionToken,
        },
      });

      const data = await response.json() as any;

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Task status retrieval failed',
          data: null,
        };
      }

      return {
        success: true,
        data: data.task,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
      };
    }
  }

  /**
   * Update agent status
   */
  async updateStatus(status: AgentStatus): Promise<ApiResponse<boolean>> {
    if (!this.agentId || !this.sessionToken) {
      return {
        success: false,
        error: 'Agent not authenticated',
        data: null,
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/agents/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Agent-ID': this.agentId,
          'X-Session-Token': this.sessionToken,
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json() as any;

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Status update failed',
          data: null,
        };
      }

      return {
        success: true,
        data: true,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
      };
    }
  }

  /**
   * Get current agent information
   */
  getAgentInfo(): { agentId?: string; isAuthenticated: boolean } {
    return {
      agentId: this.agentId,
      isAuthenticated: !!(this.agentId && this.sessionToken),
    };
  }

  /**
   * Disconnect and clear session
   */
  disconnect(): void {
    this.agentId = undefined;
    this.sessionToken = undefined;
  }
}