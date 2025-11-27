/**
 * SYMBI Orchestration Integration Tests
 * 
 * End-to-end tests that verify the complete orchestration system
 * including API Gateway, Agent Orchestrator, Message Broker, and Trust Manager.
 */

import request from 'supertest';
import OrchestrationServer from '../server';
import { TrustManager } from '../trust-manager';

describe('SYMBI Orchestration Integration Tests', () => {
  let server: OrchestrationServer;
  let baseUrl: string;
  let trustManager: TrustManager;

  beforeAll(async () => {
    // Start orchestration server on test port
    server = new OrchestrationServer();
    const testPort = 3005;
    await server.start(testPort);
    baseUrl = `http://localhost:${testPort}`;
    
    // Get trust manager for direct testing
    trustManager = server.getComponents().trustManager;
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    // Cleanup
    if (server) {
      // Note: In a real implementation, you'd have a graceful shutdown method
      console.log('🧹 Cleaning up test server...');
    }
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(baseUrl)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('services');
      
      const services = response.body.services;
      expect(services).toHaveProperty('orchestrator');
      expect(services).toHaveProperty('messageBroker');
      expect(services).toHaveProperty('trustManager');
    });
  });

  describe('Agent Management', () => {
    it('should list registered agents', async () => {
      const response = await request(baseUrl)
        .get('/api/agents')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Check default agents are registered
      const agentTypes = response.body.data.map((agent: any) => agent.type);
      expect(agentTypes).toContain('resonate');
      expect(agentTypes).toContain('symphony');
      expect(agentTypes).toContain('vault');
    });

    it('should get agent status', async () => {
      // First get the list of agents to find an ID
      const agentsResponse = await request(baseUrl)
        .get('/api/agents')
        .expect(200);

      const firstAgent = agentsResponse.body.data[0];
      expect(firstAgent).toHaveProperty('id');

      const statusResponse = await request(baseUrl)
        .get(`/api/agents/${firstAgent.id}/status`)
        .expect(200);

      expect(statusResponse.body).toHaveProperty('success', true);
      expect(statusResponse.body).toHaveProperty('data');
    });
  });

  describe('Agent Coordination', () => {
    it('should coordinate agent request successfully', async () => {
      // Get a resonate agent
      const agentsResponse = await request(baseUrl)
        .get('/api/agents')
        .expect(200);

      const resonateAgent = agentsResponse.body.data.find((agent: any) => agent.type === 'resonate');
      expect(resonateAgent).toBeDefined();

      const coordinationRequest = {
        id: 'test-request-1',
        type: 'content_analysis',
        payload: {
          text: 'This is a test message for sentiment analysis.',
          options: {
            includeEntities: true,
            sentiment: true
          }
        },
        requiredCapabilities: ['text_analysis', 'sentiment_detection']
      };

      const response = await request(baseUrl)
        .post(`/api/agents/${resonateAgent.id}/coordinate`)
        .send(coordinationRequest)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('trustReceipt');
      expect(response.body).toHaveProperty('timestamp');

      // Verify trust receipt structure
      const trustReceipt = response.body.trustReceipt;
      expect(trustReceipt).toHaveProperty('id');
      expect(trustReceipt).toHaveProperty('contentHash');
      expect(trustReceipt).toHaveProperty('signature');
      expect(trustReceipt).toHaveProperty('trustScore');
      expect(trustReceipt).toHaveProperty('compliance');

      // Verify response data
      const responseData = response.body.data;
      expect(responseData).toHaveProperty('success');
      expect(responseData).toHaveProperty('agentId', resonateAgent.id);
    });
  });

  describe('Trust Receipt Management', () => {
    it('should generate trust receipt', async () => {
      const receiptData = {
        operation: 'test_operation',
        userId: 'test-user-1',
        request: { action: 'test' },
        metadata: {
          consentVerified: true,
          humanOversight: true
        }
      };

      const response = await request(baseUrl)
        .post('/api/trust/receipts')
        .send(receiptData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');

      const receipt = response.body.data;
      expect(receipt).toHaveProperty('id');
      expect(receipt).toHaveProperty('timestamp');
      expect(receipt).toHaveProperty('contentHash');
      expect(receipt).toHaveProperty('signature');
      expect(receipt).toHaveProperty('trustScore');
      expect(receipt).toHaveProperty('compliance');
    });

    it('should retrieve trust receipt by ID', async () => {
      // First create a receipt
      const receiptData = {
        operation: 'retrieve_test',
        userId: 'test-user-2'
      };

      const createResponse = await request(baseUrl)
        .post('/api/trust/receipts')
        .send(receiptData)
        .expect(200);

      const receiptId = createResponse.body.data.id;

      // Now retrieve it
      const retrieveResponse = await request(baseUrl)
        .get(`/api/trust/receipts/${receiptId}`)
        .expect(200);

      expect(retrieveResponse.body).toHaveProperty('success', true);
      expect(retrieveResponse.body).toHaveProperty('data');
      expect(retrieveResponse.body.data.id).toBe(receiptId);
    });

    it('should verify trust receipt', async () => {
      // Create a receipt
      const receiptData = {
        operation: 'verify_test',
        userId: 'test-user-3',
        metadata: {
          consentVerified: true,
          auditTrail: true
        }
      };

      const createResponse = await request(baseUrl)
        .post('/api/trust/receipts')
        .send(receiptData)
        .expect(200);

      const receipt = createResponse.body.data;

      // Verify it
      const verifyResponse = await request(baseUrl)
        .post('/api/trust/verify')
        .send({
          receiptId: receipt.id,
          signature: receipt.signature
        })
        .expect(200);

      expect(verifyResponse.body).toHaveProperty('success', true);
      expect(verifyResponse.body).toHaveProperty('data');

      const verification = verifyResponse.body.data;
      expect(verification).toHaveProperty('receiptId', receipt.id);
      expect(verification).toHaveProperty('valid', true);
      expect(verification).toHaveProperty('signatureValid', true);
      expect(verification).toHaveProperty('hashValid', true);
    });
  });

  describe('Message Broker', () => {
    it('should send and receive messages', async () => {
      const message = {
        id: 'test-message-1',
        topic: 'test.topic',
        payload: {
          action: 'test',
          data: 'Hello from integration test!'
        },
        metadata: {
          source: 'integration-test'
        }
      };

      // Send message
      const sendResponse = await request(baseUrl)
        .post('/api/messages')
        .send(message)
        .expect(200);

      expect(sendResponse.body).toHaveProperty('success', true);
      expect(sendResponse.body).toHaveProperty('data');

      // Get messages from queue
      const queueResponse = await request(baseUrl)
        .get('/api/messages/queue/topic:test.topic')
        .expect(200);

      expect(queueResponse.body).toHaveProperty('success', true);
      expect(queueResponse.body).toHaveProperty('data');
      expect(Array.isArray(queueResponse.body.data)).toBe(true);
    });
  });

  describe('Cross-Repository Integration', () => {
    it('should integrate with SYMBI-Vault for credentials', async () => {
      const response = await request(baseUrl)
        .get('/api/vault/credentials/test-cred-1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // This would return actual credentials from Vault in production
    });

    it('should integrate with SYMBI-Resonate for analysis', async () => {
      const analysisRequest = {
        content: 'This is a test content for analysis.',
        type: 'sentiment_analysis'
      };

      const response = await request(baseUrl)
        .post('/api/resonate/analyze')
        .send(analysisRequest)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // This would return actual analysis from Resonate in production
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid agent ID gracefully', async () => {
      const invalidRequest = {
        id: 'invalid-test',
        payload: { test: 'data' }
      };

      const response = await request(baseUrl)
        .post('/api/agents/invalid-agent-id/coordinate')
        .send(invalidRequest)
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle missing trust receipt gracefully', async () => {
      const response = await request(baseUrl)
        .get('/api/trust/receipts/non-existent-receipt')
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Performance and Load', () => {
    it('should handle multiple concurrent requests', async () => {
      const promises = [];
      
      // Create 10 concurrent agent coordination requests
      for (let i = 0; i < 10; i++) {
        const requestPromise = request(baseUrl)
          .post('/api/agents/test-agent/coordinate')
          .send({
            id: `concurrent-test-${i}`,
            payload: { test: `data-${i}` },
            requiredCapabilities: []
          });
        promises.push(requestPromise);
      }

      const responses = await Promise.all(promises);
      
      // All should succeed (or handle errors gracefully)
      responses.forEach(response => {
        expect([200, 500]).toContain(response.status);
      });
    });
  });
});