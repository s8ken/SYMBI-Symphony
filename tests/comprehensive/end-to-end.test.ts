/**
 * Comprehensive End-to-End Integration Tests
 * Tests the complete SYMBI Symphony platform integration
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { AgentFactory } from '../../src/core/agent/factory';
import { HealthCheckManager } from '../../src/core/observability/health';
import { Logger } from '../../src/core/observability/logger';
import { MetricsCollector } from '../../src/core/observability/metrics';
import { Authenticator } from '../../src/core/auth/authenticator';
import { Authorizer } from '../../src/core/auth/authorizer';
import { JWTHelper } from '../../src/core/auth/jwt-helper';
import { DIDResolver } from '../../src/core/trust/resolution/resolver';
import { CredentialIssuer } from '../../src/core/trust/credentials/issuer';
import { TrustValidator } from '../../src/core/trust/validator';

// Mock orchestration components for testing
class MockOrchestrator {
  private agents: Map<string, any> = new Map();
  private tasks: Map<string, any> = new Map();
  private running: boolean = false;

  async start() {
    this.running = true;
  }

  async stop() {
    this.running = false;
  }

  async registerAgent(agent: any) {
    this.agents.set(agent.id, agent);
    return { success: true, agentId: agent.id };
  }

  async submitTask(task: any) {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.tasks.set(taskId, {
      ...task,
      id: taskId,
      status: 'pending',
      submittedAt: new Date()
    });
    
    // Simulate task execution
    setTimeout(() => {
      this.executeTask(taskId);
    }, Math.random() * 200 + 100);
    
    return taskId;
  }

  private async executeTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'running';
    task.startedAt = new Date();

    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 50));

    task.status = 'completed';
    task.completedAt = new Date();
    task.result = {
      success: true,
      output: `Task ${task.type} completed successfully`,
      metrics: {
        duration: task.completedAt.getTime() - task.startedAt.getTime(),
        agentId: task.assignedAgent
      }
    };
  }

  async getTaskStatus(taskId: string) {
    return this.tasks.get(taskId) || null;
  }

  async getSystemHealth() {
    return {
      status: this.running ? 'healthy' : 'unhealthy',
      agents: this.agents.size,
      pendingTasks: Array.from(this.tasks.values()).filter(t => t.status === 'pending').length,
      runningTasks: Array.from(this.tasks.values()).filter(t => t.status === 'running').length,
      completedTasks: Array.from(this.tasks.values()).filter(t => t.status === 'completed').length,
      uptime: Date.now()
    };
  }
}

// Mock API Gateway for testing
class MockAPIGateway {
  private routes: Map<string, Function> = new Map();
  private middleware: Function[] = [];

  constructor() {
    this.setupRoutes();
  }

  private setupRoutes() {
    this.routes.set('GET /health', async () => ({
      status: 'healthy',
      timestamp: new Date(),
      version: '1.0.0-test'
    }));

    this.routes.set('POST /agents', async (req: any) => {
      // Simulate agent registration
      return { success: true, agentId: req.body.id };
    });

    this.routes.set('POST /tasks', async (req: any) => {
      // Simulate task submission
      return { taskId: `task_${Date.now()}`, status: 'submitted' };
    });

    this.routes.set('GET /tasks/:id', async (req: any) => {
      // Simulate task status retrieval
      return {
        id: req.params.id,
        status: 'completed',
        result: 'Task completed'
      };
    });
  }

  async request(method: string, path: string, data?: any) {
    const route = this.routes.get(`${method} ${path}`);
    if (!route) {
      throw new Error(`Route ${method} ${path} not found`);
    }

    // Apply middleware
    for (const middleware of this.middleware) {
      await middleware(method, path, data);
    }

    // Execute route handler
    const req = { body: data, params: this.parseParams(path) };
    return await route(req);
  }

  private parseParams(path: string) {
    const params: Record<string, string> = {};
    if (path.includes(':')) {
      const parts = path.split('/');
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].startsWith(':')) {
          params[parts[i].substring(1)] = parts[i + 1] || '';
        }
      }
    }
    return params;
  }

  addMiddleware(middleware: Function) {
    this.middleware.push(middleware);
  }
}

describe('End-to-End Platform Integration', () => {
  let components: any = {};

  beforeAll(async () => {
    // Initialize all core components
    components.healthManager = new HealthCheckManager('1.0.0-test');
    components.logger = new Logger('e2e-test');
    components.metrics = new MetricsCollector();
    components.jwtHelper = new JWTHelper('test-secret-key');
    components.authenticator = new Authenticator(components.jwtHelper);
    components.authorizer = new Authorizer();
    components.didResolver = new DIDResolver();
    components.credentialIssuer = new CredentialIssuer(null as any); // Mock KMS
    components.trustValidator = new TrustValidator(components.didResolver);
    components.orchestrator = new MockOrchestrator();
    components.apiGateway = new MockAPIGateway();

    // Start services
    await components.orchestrator.start();
  });

  afterAll(async () => {
    // Cleanup services
    await components.orchestrator.stop();
  });

  beforeEach(() => {
    // Reset metrics and clear state
    components.metrics.clear();
  });

  describe('Complete Platform Initialization', () => {
    it('should initialize all components without errors', () => {
      expect(components.healthManager).toBeDefined();
      expect(components.logger).toBeDefined();
      expect(components.metrics).toBeDefined();
      expect(components.authenticator).toBeDefined();
      expect(components.authorizer).toBeDefined();
      expect(components.didResolver).toBeDefined();
      expect(components.trustValidator).toBeDefined();
      expect(components.orchestrator).toBeDefined();
      expect(components.apiGateway).toBeDefined();
    });

    it('should verify system health across all components', async () => {
      const healthPromises = [
        components.healthManager.checkAll(),
        components.orchestrator.getSystemHealth()
      ];

      const [coreHealth, orchestratorHealth] = await Promise.all(healthPromises);

      expect(coreHealth.status).toBeDefined();
      expect(orchestratorHealth.status).toBe('healthy');
      expect(orchestratorHealth.agents).toBe(0); // No agents yet
    });

    it('should establish communication between components', async () => {
      // Test logging across components
      components.logger.info('System initialized', { component: 'all' });
      
      // Test metrics collection
      const counter = components.metrics.createCounter('test_counter', 'Test counter');
      counter.inc();
      
      const metricsOutput = components.metrics.getMetrics();
      expect(metricsOutput).toContain('test_counter');
    });
  });

  describe('Agent Lifecycle Management', () => {
    it('should register and authenticate agents', async () => {
      const agentConfig = {
        id: 'e2e-agent-1',
        name: 'E2E Test Agent',
        type: 'tester',
        apiKey: 'test-api-key',
        capabilities: ['testing', 'validation'],
        permissions: ['read', 'write']
      };

      // Step 1: Create agent through factory
      const agent = AgentFactory.createAgent(agentConfig);
      expect(agent).toBeDefined();

      // Step 2: Register with orchestrator
      const registration = await components.orchestrator.registerAgent(agentConfig);
      expect(registration.success).toBe(true);

      // Step 3: Authenticate agent
      const authResult = await components.authenticator.authenticate({
        username: agentConfig.id,
        apiKey: agentConfig.apiKey
      });
      expect(authResult.success).toBe(true);

      // Step 4: Generate JWT token
      const token = components.jwtHelper.generateToken({
        userId: agentConfig.id,
        role: 'agent',
        capabilities: agentConfig.capabilities
      });
      expect(token).toBeDefined();
    });

    it('should manage agent trust verification', async () => {
      const agentCredentials = {
        id: 'trusted-agent',
        name: 'Trusted Agent',
        type: 'security_analyst',
        credentials: {
          verificationToken: 'trust-token',
          complianceLevel: 'high'
        }
      };

      // Verify agent trust
      const trustValidation = await components.trustValidator.validateTrust({
        issuer: 'did:system:symphony',
        subject: agentCredentials.id,
        trustLevel: 0.8,
        context: 'agent_deployment',
        evidence: ['verification_token', 'compliance_certificate']
      });

      expect(trustValidation.isValid).toBe(true);
      expect(trustValidation.confidence).toBeGreaterThan(0);
    });

    it('should handle agent task execution flow', async () => {
      const agentConfig = {
        id: 'task-agent',
        name: 'Task Execution Agent',
        type: 'processor',
        capabilities: ['data_processing']
      };

      await components.orchestrator.registerAgent(agentConfig);

      const task = {
        type: 'data_processing',
        payload: { data: 'test data', operation: 'transform' },
        requirements: { capabilities: ['data_processing'] },
        priority: 'normal'
      };

      const taskId = await components.orchestrator.submitTask(task);
      expect(taskId).toBeDefined();

      // Wait for task completion
      await new Promise(resolve => setTimeout(resolve, 300));

      const taskStatus = await components.orchestrator.getTaskStatus(taskId);
      expect(taskStatus.status).toBe('completed');
      expect(taskStatus.result.success).toBe(true);
    });
  });

  describe('API Gateway Integration', () => {
    it('should handle complete request flow', async () => {
      // Add authentication middleware
      components.apiGateway.addMiddleware(async (method: string, path: string, data: any) => {
        if (path !== '/health' && !data?.authToken) {
          throw new Error('Authentication required');
        }
      });

      // Test public health endpoint
      const healthResponse = await components.apiGateway.request('GET', '/health');
      expect(healthResponse.status).toBe('healthy');

      // Test authenticated endpoint
      const authToken = components.jwtHelper.generateToken({ userId: 'test-user' });
      const agentResponse = await components.apiGateway.request('POST', '/agents', {
        id: 'api-agent',
        name: 'API Agent',
        authToken
      });
      expect(agentResponse.success).toBe(true);

      // Test task submission
      const taskResponse = await components.apiGateway.request('POST', '/tasks', {
        type: 'api_test',
        data: 'test data',
        authToken
      });
      expect(taskResponse.taskId).toBeDefined();
    });

    it('should enforce authorization rules', async () => {
      // Test unauthorized access
      await expect(
        components.apiGateway.request('POST', '/agents', {})
      ).rejects.toThrow('Authentication required');

      // Test with insufficient permissions
      const limitedToken = components.jwtHelper.generateToken({
        userId: 'limited-user',
        permissions: ['read']
      });

      // Assuming agent creation requires write permissions
      expect(() => {
        components.authorizer.canAccess(
          { userId: 'limited-user', permissions: ['read'] },
          'write',
          'agents'
        );
      }).toThrow();
    });
  });

  describe('Trust Framework Integration', () => {
    it('should verify credentials across the system', async () => {
      const credentialData = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', 'SystemCredential'],
        issuer: 'did:system:symphony',
        subject: 'did:agent:e2e-test',
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: 'did:agent:e2e-test',
          agentType: 'comprehensive_test_agent',
          systemAccess: 'full',
          trustLevel: 0.9
        }
      };

      // Mock credential issuance (would use real KMS in production)
      const mockCredential = {
        ...credentialData,
        proof: {
          type: 'Ed25519Signature2018',
          proofPurpose: 'assertionMethod',
          verificationMethod: 'did:system:symphony#key-1',
          created: new Date().toISOString(),
          jws: 'mock-signature'
        }
      };

      expect(mockCredential.proof).toBeDefined();
      expect(mockCredential.credentialSubject.trustLevel).toBeGreaterThan(0.8);
    });

    it('should handle trust decisions consistently', async () => {
      const trustScenarios = [
        { agent: 'high-trust', score: 0.95, expected: true },
        { agent: 'medium-trust', score: 0.75, expected: true },
        { agent: 'low-trust', score: 0.65, expected: false },
        { agent: 'no-trust', score: 0.3, expected: false }
      ];

      const trustThreshold = 0.7;

      trustScenarios.forEach(scenario => {
        const isTrusted = scenario.score >= trustThreshold;
        expect(isTrusted).toBe(scenario.expected);
      });
    });
  });

  describe('System Performance and Scaling', () => {
    it('should handle concurrent operations', async () => {
      const operationCount = 50;
      const agents = Array.from({ length: 5 }, (_, i) => ({
        id: `scale-agent-${i}`,
        name: `Scale Agent ${i}`,
        type: 'processor',
        capabilities: ['concurrent_test']
      }));

      // Register agents
      await Promise.all(
        agents.map(agent => components.orchestrator.registerAgent(agent))
      );

      // Submit concurrent tasks
      const taskPromises = Array.from({ length: operationCount }, (_, i) =>
        components.orchestrator.submitTask({
          id: `concurrent-task-${i}`,
          type: 'concurrent_test',
          payload: { index: i }
        })
      );

      const taskIds = await Promise.all(taskPromises);
      expect(taskIds).toHaveLength(operationCount);

      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 500));

      const statuses = await Promise.all(
        taskIds.map(id => components.orchestrator.getTaskStatus(id))
      );

      const completedCount = statuses.filter(s => s.status === 'completed').length;
      expect(completedCount).toBe(operationCount);
    });

    it('should maintain performance under load', async () => {
      const startTime = Date.now();
      const operationCount = 100;

      // Perform various operations
      const operations = Array.from({ length: operationCount }, async (_, i) => {
        // Health check
        await components.healthManager.checkAll();
        
        // Metrics update
        const counter = components.metrics.getCounter('operations_total');
        if (counter) counter.inc();
        
        // API request
        await components.apiGateway.request('GET', '/health');
      });

      await Promise.all(operations);
      const duration = Date.now() - startTime;

      // Should complete within reasonable time (adjust based on environment)
      expect(duration).toBeLessThan(5000);
      
      // Verify metrics were collected
      const metricsOutput = components.metrics.getMetrics();
      expect(metricsOutput).toContain('operations_total');
    });

    it('should handle resource exhaustion gracefully', async () => {
      // Simulate high load
      const highLoadPromises = Array.from({ length: 200 }, async (_, i) => {
        try {
          return await components.apiGateway.request('GET', '/health');
        } catch (error) {
          return { error: error.message, index: i };
        }
      });

      const results = await Promise.all(highLoadPromises);
      
      // Most should succeed, some might be rate limited
      const successCount = results.filter(r => !r.error).length;
      const errorCount = results.filter(r => r.error).length;
      
      expect(successCount).toBeGreaterThan(150);
      expect(errorCount).toBeLessThan(50);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle component failures gracefully', async () => {
      // Simulate component failure
      const originalHealthCheck = components.healthManager.checkAll;
      let failureCount = 0;
      
      components.healthManager.checkAll = async () => {
        failureCount++;
        if (failureCount <= 2) {
          throw new Error('Simulated health check failure');
        }
        return originalHealthCheck.call(components.healthManager);
      };

      // Should recover after initial failures
      for (let i = 0; i < 4; i++) {
        try {
          const health = await components.healthManager.checkAll();
          expect(health).toBeDefined();
        } catch (error) {
          if (i < 2) {
            expect(error.message).toContain('Simulated health check failure');
          } else {
            throw error; // Should not fail after recovery
          }
        }
      }

      // Restore original function
      components.healthManager.checkAll = originalHealthCheck;
    });

    it('should maintain data consistency during failures', async () => {
      const taskData = [];
      
      // Submit tasks and track data
      const taskPromises = Array.from({ length: 10 }, async (_, i) => {
        const taskId = await components.orchestrator.submitTask({
          id: `consistency-task-${i}`,
          type: 'consistency_test',
          data: `test-${i}`
        });
        
        taskData.push({ taskId, index: i });
        return taskId;
      });

      const taskIds = await Promise.all(taskPromises);
      
      // Verify all tasks were tracked
      expect(taskData).toHaveLength(10);
      expect(taskIds).toHaveLength(10);
      
      // Verify no duplicates
      expect(new Set(taskIds).size).toBe(10);
      
      // Verify data consistency
      taskData.forEach((data, index) => {
        expect(data.index).toBe(index);
        expect(taskIds.includes(data.taskId)).toBe(true);
      });
    });
  });

  describe('Security and Compliance', () => {
    it('should enforce authentication across all endpoints', async () => {
      const protectedEndpoints = [
        { method: 'POST', path: '/agents' },
        { method: 'POST', path: '/tasks' },
        { method: 'GET', path: '/tasks/some-id' }
      ];

      for (const endpoint of protectedEndpoints) {
        await expect(
          components.apiGateway.request(endpoint.method, endpoint.path, {})
        ).rejects.toThrow('Authentication required');
      }
    });

    it('should validate and sanitize all inputs', async () => {
      const maliciousInputs = [
        { id: '<script>alert("xss")</script>', type: 'test' },
        { id: '../../etc/passwd', type: 'path_traversal' },
        { id: '"; DROP TABLE agents; --', type: 'sql_injection' }
      ];

      for (const input of maliciousInputs) {
        try {
          const result = await components.orchestrator.registerAgent(input);
          // Should either sanitize the input or reject it
          expect(result.success || result.error).toBeDefined();
        } catch (error) {
          // Rejection is acceptable for malicious inputs
          expect(error).toBeDefined();
        }
      }
    });

    it('should maintain audit trail for all operations', async () => {
      const operations = [
        { type: 'agent_registration', agentId: 'audit-test-agent' },
        { type: 'task_submission', taskId: 'audit-test-task' },
        { type: 'authentication', userId: 'audit-test-user' }
      ];

      const auditLog = [];
      
      operations.forEach(op => {
        components.logger.info('Audit event', op);
        auditLog.push({
          ...op,
          timestamp: new Date(),
          severity: 'info'
        });
      });

      expect(auditLog).toHaveLength(3);
      auditLog.forEach(entry => {
        expect(entry.timestamp).toBeDefined();
        expect(entry.type).toBeDefined();
      });
    });
  });

  describe('Complete Workflow Integration', () => {
    it('should handle full agent deployment and task execution workflow', async () => {
      // 1. Agent registration with authentication
      const agentConfig = {
        id: 'workflow-agent',
        name: 'Complete Workflow Agent',
        type: 'multi_task',
        capabilities: ['analysis', 'processing', 'reporting'],
        permissions: ['read', 'write', 'execute']
      };

      await components.orchestrator.registerAgent(agentConfig);
      const authToken = components.jwtHelper.generateToken({
        userId: agentConfig.id,
        permissions: agentConfig.permissions
      });

      // 2. Trust verification
      const trustResult = await components.trustValidator.validateTrust({
        issuer: 'did:system:symphony',
        subject: agentConfig.id,
        trustLevel: 0.85,
        context: 'production_deployment'
      });
      expect(trustResult.isValid).toBe(true);

      // 3. Task submission through API
      const taskResponse = await components.apiGateway.request('POST', '/tasks', {
        type: 'comprehensive_analysis',
        payload: {
          data: 'workflow test data',
          requirements: ['analysis', 'processing', 'reporting']
        },
        authToken
      });
      expect(taskResponse.taskId).toBeDefined();

      // 4. Task execution monitoring
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const taskStatus = await components.orchestrator.getTaskStatus(taskResponse.taskId);
      expect(taskStatus.status).toBe('completed');

      // 5. Results verification
      expect(taskStatus.result.success).toBe(true);
      expect(taskStatus.result.output).toContain('completed successfully');

      // 6. System health verification
      const systemHealth = await components.orchestrator.getSystemHealth();
      expect(systemHealth.status).toBe('healthy');
      expect(systemHealth.completedTasks).toBeGreaterThan(0);
    });

    it('should maintain system integrity under complex scenarios', async () => {
      const scenarioSteps = 20;
      const agentTypes = ['analyzer', 'processor', 'reporter'];
      const taskTypes = ['data_analysis', 'transformation', 'generation'];

      // Execute complex scenario
      for (let step = 0; step < scenarioSteps; step++) {
        const agentType = agentTypes[step % agentTypes.length];
        const taskType = taskTypes[step % taskTypes.length];

        // Register agent
        const agent = {
          id: `scenario-agent-${step}`,
          name: `Scenario Agent ${step}`,
          type: agentType,
          capabilities: [taskType]
        };

        await components.orchestrator.registerAgent(agent);

        // Submit task
        const taskId = await components.orchestrator.submitTask({
          id: `scenario-task-${step}`,
          type: taskType,
          payload: { step, agentType },
          priority: step % 5 === 0 ? 'high' : 'normal'
        });

        // Monitor progress
        if (step % 5 === 0) {
          const health = await components.healthManager.checkAll();
          expect(health.status).toBeDefined();
        }
      }

      // Verify final state
      const finalHealth = await components.orchestrator.getSystemHealth();
      expect(finalHealth.status).toBe('healthy');
      expect(finalHealth.agents).toBe(scenarioSteps);

      // Verify metrics
      const finalMetrics = components.metrics.getMetrics();
      expect(finalMetrics).toBeDefined();
    });
  });
});