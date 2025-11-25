/**
 * SYMBI Orchestration Server
 * 
 * Main server that starts the API gateway and orchestration services.
 * Integrates all SYMBI components into a unified system.
 */

import dotenv from 'dotenv';
import ApiGateway from './api-gateway';
import { AgentOrchestrator } from './orchestrator';
import { MessageBroker } from './message-broker';
import { TrustManager } from './trust-manager';

// Load environment variables
dotenv.config();

export class OrchestrationServer {
  private apiGateway: ApiGateway;
  private agentOrchestrator: AgentOrchestrator;
  private messageBroker: MessageBroker;
  private trustManager: TrustManager;
  private isShuttingDown = false;

  constructor() {
    this.apiGateway = new ApiGateway();
    this.agentOrchestrator = new AgentOrchestrator();
    this.messageBroker = new MessageBroker();
    this.trustManager = new TrustManager();
    
    this.setupGracefulShutdown();
    this.setupDefaultAgents();
  }

  /**
   * Start the orchestration server
   */
  public async start(port: number = 3001): Promise<void> {
    console.log('🚀 Starting SYMBI Orchestration Server...');
    
    try {
      // Start the API gateway
      this.apiGateway.start(port);
      
      console.log(`✅ SYMBI Orchestration Server running on port ${port}`);
      console.log('📊 Health check available at: http://localhost:' + port + '/health');
      console.log('🔍 API documentation available at: http://localhost:' + port + '/api');
      
      // Log system status
      await this.logSystemStatus();
      
    } catch (error) {
      console.error('❌ Failed to start orchestration server:', error);
      process.exit(1);
    }
  }

  /**
   * Setup default agents for demonstration
   */
  private async setupDefaultAgents(): Promise<void> {
    try {
      // Register a Resonate agent
      await this.agentOrchestrator.registerAgent({
        name: 'Content Analysis Agent',
        type: 'resonate',
        capabilities: {
          supported: ['text_analysis', 'sentiment_detection', 'entity_extraction'],
          version: '1.0.0',
          description: 'Analyzes text content for sentiment and entities'
        },
        status: 'active',
        trustScore: 0.95,
        metadata: {
          endpoint: 'http://localhost:3002',
          specialization: 'content_analysis'
        }
      });

      // Register a Symphony agent
      await this.agentOrchestrator.registerAgent({
        name: 'Trust Orchestrator Agent',
        type: 'symphony',
        capabilities: {
          supported: ['trust_scoring', 'compliance_check', 'audit_generation'],
          version: '1.0.0',
          description: 'Manages trust scores and compliance checking'
        },
        status: 'active',
        trustScore: 0.98,
        metadata: {
          endpoint: 'http://localhost:3003',
          specialization: 'trust_management'
        }
      });

      // Register a Vault agent
      await this.agentOrchestrator.registerAgent({
        name: 'Security Agent',
        type: 'vault',
        capabilities: {
          supported: ['credential_management', 'encryption', 'access_control'],
          version: '1.0.0',
          description: 'Manages credentials and access control'
        },
        status: 'active',
        trustScore: 1.0,
        metadata: {
          endpoint: 'http://localhost:3004',
          specialization: 'security'
        }
      });

      console.log('✅ Default agents registered successfully');
      
    } catch (error) {
      console.error('❌ Failed to setup default agents:', error);
    }
  }

  /**
   * Log system status
   */
  private async logSystemStatus(): Promise<void> {
    const orchestratorStatus = this.agentOrchestrator.getStatus();
    const brokerStatus = this.messageBroker.getStatus();
    const trustStatus = this.trustManager.getStatus();

    console.log('\n📊 System Status:');
    console.log('  🤖 Agents:', orchestratorStatus.totalAgents, 'registered,', orchestratorStatus.activeAgents, 'active');
    console.log('  📨 Message Broker:', brokerStatus.totalQueues, 'queues,', brokerStatus.totalMessages, 'messages');
    console.log('  🔐 Trust Manager:', trustStatus.totalReceipts, 'receipts, avg score:', trustStatus.averageTrustScore.toFixed(2));
    console.log('');
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) return;
      
      this.isShuttingDown = true;
      console.log(`\n🔄 Received ${signal}, shutting down gracefully...`);
      
      try {
        // Add cleanup logic here if needed
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon
  }

  /**
   * Get server components (for testing)
   */
  public getComponents() {
    return {
      apiGateway: this.apiGateway,
      agentOrchestrator: this.agentOrchestrator,
      messageBroker: this.messageBroker,
      trustManager: this.trustManager
    };
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new OrchestrationServer();
  const port = parseInt(process.env.ORCHESTRATION_PORT || '3001', 10);
  server.start(port);
}

export default OrchestrationServer;