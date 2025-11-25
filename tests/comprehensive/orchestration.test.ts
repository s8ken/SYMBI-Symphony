/**
 * Comprehensive Orchestration Layer Tests
 * Tests for API gateway, message broker, orchestrator, and trust manager
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { APIGateway } from '../../orchestration/api-gateway';
import { MessageBroker } from '../../orchestration/message-broker';
import { Orchestrator } from '../../orchestration/orchestrator';
import { TrustManager } from '../../orchestration/trust-manager';

describe('Orchestration Layer Components', () => {
  let apiGateway: APIGateway;
  let messageBroker: MessageBroker;
  let orchestrator: Orchestrator;
  let trustManager: TrustManager;

  beforeAll(async () => {
    // Initialize orchestration components
    apiGateway = new APIGateway({
      port: 3001,
      cors: true,
      rateLimiting: { enabled: true, windowMs: 60000, max: 100 }
    });

    messageBroker = new MessageBroker({
      type: 'memory', // Use in-memory for testing
      persistence: false
    });

    orchestrator = new Orchestrator({
      messageBroker,
      maxConcurrentAgents: 10,
      taskTimeout: 30000
    });

    trustManager = new TrustManager({
      trustThreshold: 0.7,
      verificationRequired: true
    });

    // Start services
    await apiGateway.start();
    await messageBroker.start();
    await orchestrator.start();
    await trustManager.start();
  });

  afterAll(async () => {
    // Cleanup services
    await trustManager.stop();
    await orchestrator.stop();
    await messageBroker.stop();
    await apiGateway.stop();
  });

  beforeEach(() => {
    // Reset state for each test
    messageBroker.clearQueues();
    orchestrator.clearActiveTasks();
  });

  describe('API Gateway Tests', () => {
    it('should handle HTTP requests and responses', async () => {
      const response = await fetch('http://localhost:3001/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.ok).toBe(true);
      const health = await response.json();
      expect(health.status).toBeDefined();
    });

    it('should implement rate limiting', async () => {
      const promises = Array.from({ length: 150 }, () =>
        fetch('http://localhost:3001/api/test', {
          method: 'GET',
          headers: { 'X-Client-ID': 'rate-limit-test' }
        })
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should handle CORS headers correctly', async () => {
      const response = await fetch('http://localhost:3001/api/test', {
        method: 'OPTIONS',
        headers: { Origin: 'http://localhost:3000' }
      });

      expect(response.headers.get('access-control-allow-origin')).toBeDefined();
    });

    it('should validate API keys for protected routes', async () => {
      const response = await fetch('http://localhost:3001/api/protected', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer invalid-key' }
      });

      expect(response.status).toBe(401);
    });

    it('should route requests to correct handlers', async () => {
      const endpoints = [
        { path: '/api/agents', expectedStatus: 200 },
        { path: '/api/tasks', expectedStatus: 200 },
        { path: '/api/trust', expectedStatus: 200 },
        { path: '/api/nonexistent', expectedStatus: 404 }
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(`http://localhost:3001${endpoint.path}`);
        expect(response.status).toBe(endpoint.expectedStatus);
      }
    });
  });

  describe('Message Broker Tests', () => {
    it('should publish and subscribe to messages', async () => {
      let receivedMessage: any = null;

      const subscription = await messageBroker.subscribe('test-topic', (message) => {
        receivedMessage = message;
      });

      await messageBroker.publish('test-topic', {
        type: 'test',
        payload: { data: 'test message' }
      });

      // Wait for message delivery
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(receivedMessage).toBeDefined();
      expect(receivedMessage.payload.data).toBe('test message');

      await subscription.unsubscribe();
    });

    it('should handle multiple subscribers', async () => {
      const messages: any[] = [];
      const subscriberCount = 3;

      const subscriptions = await Promise.all(
        Array.from({ length: subscriberCount }, async (_, i) => {
          return messageBroker.subscribe('multi-test', (message) => {
            messages.push({ subscriber: i, message });
          });
        })
      );

      await messageBroker.publish('multi-test', {
        type: 'broadcast',
        payload: { data: 'broadcast message' }
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(messages).toHaveLength(subscriberCount);
      messages.forEach(msg => {
        expect(msg.message.payload.data).toBe('broadcast message');
      });

      await Promise.all(subscriptions.map(sub => sub.unsubscribe()));
    });

    it('should support message filtering', async () => {
      let filteredMessage: any = null;

      await messageBroker.subscribe('filter-test', (message) => {
        filteredMessage = message;
      }, { filter: { type: 'important' } });

      await messageBroker.publish('filter-test', { type: 'normal', payload: {} });
      await messageBroker.publish('filter-test', { type: 'important', payload: {} });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(filteredMessage).toBeDefined();
      expect(filteredMessage.type).toBe('important');
    });

    it('should handle message persistence when enabled', async () => {
      const persistentBroker = new MessageBroker({
        type: 'memory',
        persistence: true
      });
      await persistentBroker.start();

      await persistentBroker.publish('persistent-topic', {
        type: 'persistent',
        payload: { data: 'should persist' }
      });

      const messages = await persistentBroker.getQueuedMessages('persistent-topic');
      expect(messages.length).toBeGreaterThan(0);

      await persistentBroker.stop();
    });

    it('should implement backpressure handling', async () => {
      const maxMessages = 100;
      const broker = new MessageBroker({
        type: 'memory',
        maxQueueSize: maxMessages
      });
      await broker.start();

      // Fill the queue
      for (let i = 0; i < maxMessages + 10; i++) {
        await broker.publish('backpressure-test', { id: i });
      }

      const queueSize = await broker.getQueueSize('backpressure-test');
      expect(queueSize).toBeLessThanOrEqual(maxMessages);

      await broker.stop();
    });
  });

  describe('Orchestrator Tests', () => {
    it('should register and manage agents', async () => {
      const agentConfig = {
        id: 'test-agent-1',
        name: 'Test Agent',
        type: 'tester',
        capabilities: ['test', 'validate'],
        endpoint: 'http://localhost:3002'
      };

      await orchestrator.registerAgent(agentConfig);
      const agents = await orchestrator.getRegisteredAgents();
      
      expect(agents.some(a => a.id === agentConfig.id)).toBe(true);
    });

    it('should distribute tasks to appropriate agents', async () => {
      // Register a test agent
      await orchestrator.registerAgent({
        id: 'task-agent',
        name: 'Task Agent',
        type: 'tester',
        capabilities: ['task_processing'],
        endpoint: 'http://localhost:3003'
      });

      const task = {
        id: 'test-task-1',
        type: 'task_processing',
        payload: { data: 'test data' },
        requirements: { capabilities: ['task_processing'] }
      };

      const taskId = await orchestrator.submitTask(task);
      expect(taskId).toBeDefined();

      // Wait for task assignment
      await new Promise(resolve => setTimeout(resolve, 100));

      const taskStatus = await orchestrator.getTaskStatus(taskId);
      expect(taskStatus).toBeDefined();
      expect(['assigned', 'running', 'completed']).toContain(taskStatus.status);
    });

    it('should handle task timeouts', async () => {
      const task = {
        id: 'timeout-task',
        type: 'long_running',
        payload: { data: 'test' },
        requirements: { capabilities: ['processing'] },
        timeout: 100 // 100ms timeout
      };

      const taskId = await orchestrator.submitTask(task);
      
      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 200));

      const taskStatus = await orchestrator.getTaskStatus(taskId);
      expect(taskStatus.status).toBe('timeout');
    });

    it('should implement load balancing across agents', async () => {
      // Register multiple agents
      const agents = Array.from({ length: 3 }, (_, i) => ({
        id: `load-balance-agent-${i}`,
        name: `Load Balance Agent ${i}`,
        type: 'processor',
        capabilities: ['processing'],
        endpoint: `http://localhost:300${4 + i}`
      }));

      for (const agent of agents) {
        await orchestrator.registerAgent(agent);
      }

      // Submit multiple tasks
      const tasks = Array.from({ length: 10 }, (_, i) => ({
        id: `load-task-${i}`,
        type: 'processing',
        payload: { data: `task-${i}` },
        requirements: { capabilities: ['processing'] }
      }));

      const taskIds = await Promise.all(
        tasks.map(task => orchestrator.submitTask(task))
      );

      // Check load distribution
      const assignments = await Promise.all(
        taskIds.map(id => orchestrator.getTaskAssignment(id))
      );

      const agentCounts = assignments.reduce((acc, assignment) => {
        acc[assignment.agentId] = (acc[assignment.agentId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Tasks should be distributed across agents
      expect(Object.keys(agentCounts).length).toBeGreaterThan(1);
    });

    it('should handle agent failures and retries', async () => {
      // Register an agent that will fail
      await orchestrator.registerAgent({
        id: 'failing-agent',
        name: 'Failing Agent',
        type: 'unreliable',
        capabilities: ['failing_operation'],
        endpoint: 'http://localhost:3999' // Non-existent endpoint
      });

      const task = {
        id: 'retry-task',
        type: 'failing_operation',
        payload: { data: 'test' },
        requirements: { capabilities: ['failing_operation'] },
        retryPolicy: { maxRetries: 3, backoffMs: 50 }
      };

      const taskId = await orchestrator.submitTask(task);
      
      // Wait for retries
      await new Promise(resolve => setTimeout(resolve, 500));

      const taskStatus = await orchestrator.getTaskStatus(taskId);
      expect(taskStatus.status).toBe('failed');
      expect(taskStatus.retryCount).toBe(3);
    });

    it('should monitor agent health', async () => {
      await orchestrator.registerAgent({
        id: 'healthy-agent',
        name: 'Healthy Agent',
        type: 'monitoring',
        capabilities: ['health_check'],
        endpoint: 'http://localhost:3004'
      });

      // Wait for health check
      await new Promise(resolve => setTimeout(resolve, 1000));

      const agentHealth = await orchestrator.getAgentHealth('healthy-agent');
      expect(agentHealth.status).toBeDefined();
      expect(['healthy', 'unhealthy', 'unknown']).toContain(agentHealth.status);
    });
  });

  describe('Trust Manager Tests', () => {
    it('should verify agent trust before registration', async () => {
      const untrustedAgent = {
        id: 'untrusted-agent',
        name: 'Untrusted Agent',
        type: 'unknown',
        credentials: { invalid: true }
      };

      const trustResult = await trustManager.verifyAgentTrust(untrustedAgent);
      expect(trustResult.trusted).toBe(false);
      expect(trustResult.reason).toBeDefined();
    });

    it('should evaluate trust scores dynamically', async () => {
      const agentMetrics = {
        id: 'scoring-agent',
        successfulTasks: 95,
        totalTasks: 100,
        securityViolations: 0,
        complianceScore: 0.9,
        peerEndorsements: 15
      };

      const trustScore = await trustManager.calculateTrustScore(agentMetrics);
      expect(trustScore).toBeGreaterThan(0);
      expect(trustScore).toBeLessThanOrEqual(1);
      expect(trustScore).toBeGreaterThan(0.7); // Should pass threshold
    });

    it('should handle trust revocation', async () => {
      const agentId = 'revoke-agent';
      
      // Initially trust the agent
      await trustManager.grantTrust(agentId, {
        level: 0.8,
        expiresAt: new Date(Date.now() + 60000)
      });

      let trustStatus = await trustManager.getTrustStatus(agentId);
      expect(trustStatus.trusted).toBe(true);

      // Revoke trust
      await trustManager.revokeTrust(agentId, 'security violation');

      trustStatus = await trustManager.getTrustStatus(agentId);
      expect(trustStatus.trusted).toBe(false);
      expect(trustStatus.revocationReason).toBe('security violation');
    });

    it('should validate task execution trust', async () => {
      const taskContext = {
        taskId: 'trust-task',
        agentId: 'trusted-agent',
        taskType: 'secure_operation',
        sensitivity: 'high',
        requiresCredentials: true
      };

      const validation = await trustManager.validateTaskExecution(taskContext);
      expect(validation).toBeDefined();
      expect(validation.authorized).toBeDefined();
    });

    it('should implement trust decay over time', async () => {
      const agentId = 'decay-agent';
      
      // Grant initial high trust
      await trustManager.grantTrust(agentId, { level: 0.9 });

      // Simulate time passing (in real implementation)
      const decayedScore = await trustManager.applyTrustDecay(agentId, 0.1);
      expect(decayedScore).toBeLessThan(0.9);
    });
  });

  describe('Orchestration Integration Tests', () => {
    it('should coordinate complete task execution workflow', async () => {
      // 1. Register trusted agent
      const agentConfig = {
        id: 'integration-agent',
        name: 'Integration Agent',
        type: 'processor',
        capabilities: ['integration_test'],
        credentials: { trustLevel: 'high' }
      };

      const agentTrust = await trustManager.verifyAgentTrust(agentConfig);
      expect(agentTrust.trusted).toBe(true);

      await orchestrator.registerAgent(agentConfig);

      // 2. Submit task through API gateway
      const taskPayload = {
        type: 'integration_test',
        payload: { testData: 'integration test' }
      };

      const response = await fetch('http://localhost:3001/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskPayload)
      });

      expect(response.ok).toBe(true);
      const taskResult = await response.json();
      expect(taskResult.taskId).toBeDefined();

      // 3. Monitor task execution
      const taskId = taskResult.taskId;
      let taskStatus = await orchestrator.getTaskStatus(taskId);
      
      // Wait for completion
      let attempts = 0;
      while (taskStatus.status !== 'completed' && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        taskStatus = await orchestrator.getTaskStatus(taskId);
        attempts++;
      }

      expect(taskStatus.status).toBe('completed');

      // 4. Verify trust score was updated
      const updatedTrust = await trustManager.getTrustStatus(agentConfig.id);
      expect(updatedTrust.trusted).toBe(true);
    });

    it('should handle cascading failures gracefully', async () => {
      // Register unreliable agents
      const unreliableAgents = Array.from({ length: 3 }, (_, i) => ({
        id: `unreliable-${i}`,
        name: `Unreliable Agent ${i}`,
        type: 'processor',
        capabilities: ['process'],
        endpoint: `http://localhost:399${i}` // Non-existent endpoints
      }));

      for (const agent of unreliableAgents) {
        await orchestrator.registerAgent(agent);
      }

      // Submit critical task
      const task = {
        id: 'critical-task',
        type: 'process',
        payload: { critical: true },
        requirements: { reliability: 'high' }
      };

      const taskId = await orchestrator.submitTask(task);
      
      // Wait for failure handling
      await new Promise(resolve => setTimeout(resolve, 1000));

      const taskStatus = await orchestrator.getTaskStatus(taskId);
      expect(['failed', 'escalated']).toContain(taskStatus.status);

      // Verify incident was logged
      const incidents = await orchestrator.getIncidents();
      expect(incidents.length).toBeGreaterThan(0);
    });

    it('should scale under load', async () => {
      const agentCount = 5;
      const taskCount = 50;

      // Register agents
      for (let i = 0; i < agentCount; i++) {
        await orchestrator.registerAgent({
          id: `scale-agent-${i}`,
          name: `Scale Agent ${i}`,
          type: 'processor',
          capabilities: ['scale_test'],
          endpoint: `http://localhost:301${i}`
        });
      }

      // Submit tasks concurrently
      const taskPromises = Array.from({ length: taskCount }, (_, i) =>
        orchestrator.submitTask({
          id: `scale-task-${i}`,
          type: 'scale_test',
          payload: { index: i }
        })
      );

      const taskIds = await Promise.all(taskPromises);
      expect(taskIds).toHaveLength(taskCount);

      // Monitor completion
      const startTime = Date.now();
      let completedCount = 0;

      while (completedCount < taskCount && Date.now() - startTime < 10000) {
        const statuses = await Promise.all(
          taskIds.map(id => orchestrator.getTaskStatus(id))
        );
        completedCount = statuses.filter(s => s.status === 'completed').length;
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      expect(completedCount).toBe(taskCount);
    });
  });
});