/**
 * Unified Agent Orchestrator
 * Connects Symphony's SymbiOrchestrator with Tactical Command's SymbiIntegrationService
 */

import { AgentOrchestrator as SymbiOrchestrator } from '../stubs/orchestrator';
import { SymbiAgentSpec } from '../stubs/symbi-integration';

// Define SymbiIntegrationService interface locally for now
interface SymbiIntegrationService {
  initialize(): Promise<void>;
}
import {
  UnifiedAgentConfig,
  UnifiedMessage,
  TrustValidatedTask,
  TaskResult,
  UnifiedAgentStatus,
  TrustResult
} from './types.js';
import { TrustOracleBridge } from './trust-oracle-bridge.js';

export class UnifiedAgentOrchestrator {
  private symphonyOrchestrator: SymbiOrchestrator;
  private tacticalService: SymbiIntegrationService;
  private trustOracleBridge: TrustOracleBridge;

  constructor(
    symphonyOrchestrator: SymbiOrchestrator,
    tacticalService: SymbiIntegrationService
  ) {
    this.symphonyOrchestrator = symphonyOrchestrator;
    this.tacticalService = tacticalService;
    this.trustOracleBridge = new TrustOracleBridge();
  }

  /**
   * Register a unified agent that works across both Symphony and Tactical systems
   */
  async registerUnifiedAgent(config: UnifiedAgentConfig): Promise<void> {
    try {
      // Register with Symphony orchestrator
      await this.symphonyOrchestrator.registerAgent({
        id: config.id,
        name: config.name,
        capabilities: config.capabilities,
        permissions: config.permissions,
        metadata: {
          ...config.metadata,
          type: config.type,
          tacticalSpec: config.tacticalSpec
        }
      });

      // Register with Tactical service
      await this.tacticalService.initialize();

      console.log(`✅ Unified agent ${config.id} registered successfully`);
    } catch (error) {
      console.error(`❌ Failed to register unified agent ${config.id}:`, error);
      throw new Error(`Unified agent registration failed: ${(error as Error).message}`);
    }
  }

  /**
   * Route messages between agents with trust validation
   */
  async routeMessage(message: UnifiedMessage): Promise<void> {
    try {
      // Validate message against constitutional principles
      const trustContext = {
        agentId: message.from,
        action: 'message_routing',
        scopes: message.scopes,
        data: {
          content: message.content,
          recipient: message.to,
          classification: 'communication'
        }
      };

      const trustEvaluation = await this.trustOracleBridge.evaluateAgentAction(trustContext);

      // Block message if trust evaluation recommends blocking
      if (trustEvaluation.recommendation === 'block') {
        console.warn(`🚫 Message blocked due to trust violation from ${message.from} to ${message.to}`);
        throw new Error('Message blocked due to constitutional violation');
      }

      // Route through Tactical service for policy enforcement
      // Note: In a full implementation, we would need to access the tactical service instance
      // For now, we'll simulate the routing
      console.log(`📨 Routing message from ${message.from} to ${message.to} with trust validation`);
      
      // Forward to Symphony orchestrator for actual routing
      // This would typically involve the message bus system
      await this.forwardMessageToSymphony(message);

    } catch (error) {
      console.error('Message routing failed:', error);
      throw error;
    }
  }

  /**
   * Execute tasks with trust validation
   */
  async executeTrustValidatedTask(task: TrustValidatedTask): Promise<TaskResult> {
    try {
      // Validate task against constitutional principles
      const trustContext = {
        agentId: task.assignedAgent,
        action: task.type,
        scopes: task.requiredCapabilities,
        data: {
          input: task.input,
          classification: 'operational'
        }
      };

      const trustEvaluation = await this.trustOracleBridge.evaluateAgentAction(trustContext);

      // Handle trust evaluation recommendation
      switch (trustEvaluation.recommendation) {
        case 'block':
          console.warn(`🚫 Task blocked due to trust violation for agent ${task.assignedAgent}`);
          return {
            taskId: task.id,
            status: 'blocked',
            result: null,
            trustEvaluation,
            error: 'Task blocked due to constitutional violation'
          };

        case 'restrict':
          console.warn(`⚠️ Task restricted due to trust concerns for agent ${task.assignedAgent}`);
          // Apply restrictions (implementation would depend on task type)
          break;

        case 'warn':
          console.warn(`🔔 Task execution with warnings for agent ${task.assignedAgent}`);
          // Log warnings but continue execution
          break;

        case 'allow':
          console.log(`✅ Task allowed for agent ${task.assignedAgent}`);
          break;
      }

      // Execute task through Symphony orchestrator
      const taskResult = await this.executeTaskInSymphony(task);

      // Update agent trust score based on task completion
      await this.trustOracleBridge.updateAgentTrustScore(
        task.assignedAgent, 
        trustEvaluation
      );

      return {
        taskId: task.id,
        status: 'completed',
        result: taskResult,
        trustEvaluation,
        error: null
      };

    } catch (error) {
      console.error(`Task execution failed for ${task.id}:`, error);

      // Record failure in trust evaluation
      const failureEvaluation: TrustResult = {
        id: `eval_${Date.now()}_failure`,
        timestamp: new Date(),
        score: 0,
        recommendation: 'block',
        passedArticles: [],
        warnings: [],
        violations: [{
          articleId: 'SYSTEM',
          title: 'Task Execution Failure',
          severity: 'high',
          status: 'error',
          reason: (error as Error).message
        }],
        evidence: []
      };

      await this.trustOracleBridge.updateAgentTrustScore(
        task.assignedAgent, 
        failureEvaluation
      );

      return {
        taskId: task.id,
        status: 'failed',
        result: null,
        trustEvaluation: failureEvaluation,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get unified agent status combining Symphony and Tactical information
   */
  async getUnifiedAgentStatus(agentId: string): Promise<UnifiedAgentStatus> {
    try {
      // Get status from Symphony orchestrator
      const symphonyStatus = await this.getAgentStatusFromSymphony(agentId);
      
      // Get trust compliance from TrustOracle bridge
      const complianceReport = await this.trustOracleBridge.getConstitutionalCompliance(agentId);
      
      // Get tactical agent info
      const tacticalInfo = await this.getAgentInfoFromTactical(agentId);

      return {
        agentId,
        symphonyStatus,
        tacticalInfo,
        trustCompliance: complianceReport,
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error(`Failed to get unified status for agent ${agentId}:`, error);
      throw new Error(`Unable to retrieve unified agent status: ${(error as Error).message}`);
    }
  }

  /**
   * Monitor all agents for trust compliance violations
   */
  async monitorAllAgents(): Promise<void> {
    try {
      // Get all registered agents from Symphony
      const agents = await this.getAllAgentsFromSymphony();
      
      // Monitor each agent for compliance
      for (const agent of agents) {
        const alerts = await this.trustOracleBridge.monitorAgentCompliance(agent.id);
        
        if (alerts.length > 0) {
          console.warn(`⚠️ Compliance alerts for agent ${agent.id}:`, alerts);
          // In a real implementation, we would route these alerts to the appropriate system
        }
      }

    } catch (error) {
      console.error('Agent monitoring failed:', error);
    }
  }

  // Private helper methods
  private async forwardMessageToSymphony(message: UnifiedMessage): Promise<void> {
    // In a full implementation, this would forward the message to Symphony's message bus
    console.log(`🔄 Forwarding message to Symphony for agent ${message.to}`);
    // Implementation would depend on the specific message bus system used
  }

  private async executeTaskInSymphony(task: TrustValidatedTask): Promise<any> {
    // In a full implementation, this would execute the task through Symphony's task system
    console.log(`🔄 Executing task ${task.id} in Symphony`);
    // Simulate task execution
    return {
      output: `Task ${task.id} executed successfully`,
      duration: Math.random() * 1000,
      resources: ['compute', 'memory']
    };
  }

  private async getAgentStatusFromSymphony(agentId: string): Promise<any> {
    // In a full implementation, this would retrieve the agent status from Symphony
    console.log(`🔄 Retrieving status for agent ${agentId} from Symphony`);
    // Simulate status retrieval
    return {
      status: 'active',
      health: 'good',
      lastHeartbeat: new Date()
    };
  }

  private async getAgentInfoFromTactical(agentId: string): Promise<any> {
    // In a full implementation, this would retrieve agent info from Tactical Command
    console.log(`🔄 Retrieving tactical info for agent ${agentId}`);
    // Simulate tactical info retrieval
    return {
      clearance: 'S',
      compartments: ['SCI:ALTAIR'],
      rateLimits: { rpm: 60, tpm: 100000 }
    };
  }

  private async getAllAgentsFromSymphony(): Promise<any[]> {
    // In a full implementation, this would retrieve all agents from Symphony
    console.log('🔄 Retrieving all agents from Symphony');
    // Simulate agent list retrieval
    return [
      { id: 'intelligence_analyst', type: 'tactical' },
      { id: 'cybersecurity_sentinel', type: 'tactical' },
      { id: 'field_commander', type: 'tactical' }
    ];
  }
}