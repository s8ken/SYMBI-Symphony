/**
 * SYMBI Orchestration API Gateway
 * 
 * Central coordination layer that manages communication between:
 * - SYMBI-Resonate (Agent Coordination)
 * - SYMBI-Vault (Trust & Security)
 * - SYMBI-Symphony (Core Protocol)
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AgentOrchestrator } from './orchestrator';
import { MessageBroker } from './message-broker';
import { TrustManager } from './trust-manager';
import { ApiResponse, AgentRequest, TrustReceipt } from '../shared/types/src';

export class ApiGateway {
  private app: express.Application;
  private orchestrator: AgentOrchestrator;
  private messageBroker: MessageBroker;
  private trustManager: TrustManager;

  constructor() {
    this.app = express();
    this.orchestrator = new AgentOrchestrator();
    this.messageBroker = new MessageBroker();
    this.trustManager = new TrustManager();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.'
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          orchestrator: this.orchestrator.getStatus(),
          messageBroker: this.messageBroker.getStatus(),
          trustManager: this.trustManager.getStatus()
        }
      });
    });

    // Agent orchestration endpoints
    this.app.post('/api/agents/:agentId/coordinate', 
      this.coordinateAgent.bind(this)
    );
    
    this.app.get('/api/agents', this.listAgents.bind(this));
    this.app.get('/api/agents/:agentId/status', this.getAgentStatus.bind(this));

    // Trust protocol endpoints
    this.app.post('/api/trust/receipts', this.generateTrustReceipt.bind(this));
    this.app.get('/api/trust/receipts/:receiptId', this.getTrustReceipt.bind(this));
    this.app.post('/api/trust/verify', this.verifyTrustReceipt.bind(this));

    // Message broker endpoints
    this.app.post('/api/messages', this.sendMessage.bind(this));
    this.app.get('/api/messages/queue/:queueId', this.getMessages.bind(this));

    // Vault integration endpoints
    this.app.get('/api/vault/credentials/:id', this.getCredentials.bind(this));
    this.app.post('/api/vault/secrets', this.storeSecret.bind(this));

    // Resonate integration endpoints
    this.app.post('/api/resonate/analyze', this.analyzeContent.bind(this));
    this.app.get('/api/resonate/agents/:id/capabilities', this.getAgentCapabilities.bind(this));
  }

  private async coordinateAgent(req: Request, res: Response): Promise<void> {
    try {
      const { agentId } = req.params;
      const request: AgentRequest = req.body;

      // Generate trust receipt for this operation
      const trustReceipt = await this.trustManager.createReceipt({
        operation: 'agent_coordination',
        agentId,
        request,
        timestamp: new Date().toISOString()
      });

      // Coordinate through orchestrator
      const result = await this.orchestrator.coordinate(agentId, request);

      // Send message to broker for async processing
      await this.messageBroker.publish('agent.coordination', {
        agentId,
        request,
        result,
        trustReceiptId: trustReceipt.id
      });

      const response: ApiResponse = {
        success: true,
        data: result,
        trustReceipt,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      this.handleError(res, error, 'Agent coordination failed');
    }
  }

  private async listAgents(req: Request, res: Response): Promise<void> {
    try {
      const agents = await this.orchestrator.listAgents();
      res.json({ success: true, data: agents });
    } catch (error) {
      this.handleError(res, error, 'Failed to list agents');
    }
  }

  private async getAgentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { agentId } = req.params;
      const status = await this.orchestrator.getAgentStatus(agentId);
      res.json({ success: true, data: status });
    } catch (error) {
      this.handleError(res, error, 'Failed to get agent status');
    }
  }

  private async generateTrustReceipt(req: Request, res: Response): Promise<void> {
    try {
      const receiptData = req.body;
      const receipt = await this.trustManager.createReceipt(receiptData);
      res.json({ success: true, data: receipt });
    } catch (error) {
      this.handleError(res, error, 'Failed to generate trust receipt');
    }
  }

  private async getTrustReceipt(req: Request, res: Response): Promise<void> {
    try {
      const { receiptId } = req.params;
      const receipt = await this.trustManager.getReceipt(receiptId);
      res.json({ success: true, data: receipt });
    } catch (error) {
      this.handleError(res, error, 'Failed to get trust receipt');
    }
  }

  private async verifyTrustReceipt(req: Request, res: Response): Promise<void> {
    try {
      const { receiptId, signature } = req.body;
      const verification = await this.trustManager.verifyReceipt(receiptId, signature);
      res.json({ success: true, data: verification });
    } catch (error) {
      this.handleError(res, error, 'Failed to verify trust receipt');
    }
  }

  private async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const message = req.body;
      await this.messageBroker.publish(message.topic, message);
      res.json({ success: true, data: { messageId: message.id } });
    } catch (error) {
      this.handleError(res, error, 'Failed to send message');
    }
  }

  private async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { queueId } = req.params;
      const messages = await this.messageBroker.consume(queueId);
      res.json({ success: true, data: messages });
    } catch (error) {
      this.handleError(res, error, 'Failed to get messages');
    }
  }

  private async getCredentials(req: Request, res: Response): Promise<void> {
    try {
      // This would integrate with SYMBI-Vault
      res.json({ success: true, data: { message: 'Credentials from Vault' } });
    } catch (error) {
      this.handleError(res, error, 'Failed to get credentials');
    }
  }

  private async storeSecret(req: Request, res: Response): Promise<void> {
    try {
      // This would integrate with SYMBI-Vault
      res.json({ success: true, data: { message: 'Secret stored in Vault' } });
    } catch (error) {
      this.handleError(res, error, 'Failed to store secret');
    }
  }

  private async analyzeContent(req: Request, res: Response): Promise<void> {
    try {
      // This would integrate with SYMBI-Resonate
      const { content } = req.body;
      res.json({ success: true, data: { analysis: 'Content analysis from Resonate' } });
    } catch (error) {
      this.handleError(res, error, 'Failed to analyze content');
    }
  }

  private async getAgentCapabilities(req: Request, res: Response): Promise<void> {
    try {
      // This would integrate with SYMBI-Resonate
      const { id } = req.params;
      res.json({ success: true, data: { capabilities: 'Agent capabilities from Resonate' } });
    } catch (error) {
      this.handleError(res, error, 'Failed to get agent capabilities');
    }
  }

  private setupErrorHandling(): void {
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Unhandled error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    });
  }

  private handleError(res: Response, error: any, message: string): void {
    console.error(`${message}:`, error);
    res.status(500).json({
      success: false,
      error: message,
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }

  public start(port: number = 3000): void {
    this.app.listen(port, () => {
      console.log(`SYMBI API Gateway running on port ${port}`);
    });
  }
}

// Export for use in main application
export default ApiGateway;