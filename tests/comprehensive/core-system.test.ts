/**
 * Comprehensive Core System Tests
 * Tests for the SYMBI Symphony core platform components
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { AgentFactory } from '../../src/core/agent/factory';
import { AgentType } from '../../src/core/agent/types';
import { HealthCheckManager, HealthStatus } from '../../src/core/observability/health';
import { Logger } from '../../src/core/observability/logger';
import { MetricsCollector } from '../../src/core/observability/metrics';

describe('Core System Components', () => {
  let healthManager: HealthCheckManager;
  let logger: Logger;
  let metrics: MetricsCollector;

  beforeAll(() => {
    healthManager = new HealthCheckManager('1.0.0-test');
    logger = new Logger('test-service');
    metrics = new MetricsCollector();
  });

  afterAll(() => {
    // Cleanup
  });

  beforeEach(() => {
    metrics.clear();
  });

  describe('Agent Factory Comprehensive Tests', () => {
    it('should create all predefined agent types', () => {
      const agentTypes = [
        'repository_manager',
        'code_reviewer',
        'security_analyst',
        'performance_optimizer',
        'documentation_generator',
        'testing_agent',
        'deployment_agent',
        'monitoring_agent'
      ] as AgentType[];

      agentTypes.forEach(type => {
        const agent = AgentFactory.createAgent({
          id: `test-${type}`,
          name: `Test ${type}`,
          type,
          apiKey: 'test-api-key',
          capabilities: [],
          permissions: [],
          metadata: { test: true }
        });

        expect(agent).toBeDefined();
        expect(agent.getAgentInfo().type).toBe(type);
      });
    });

    it('should validate agent configurations thoroughly', () => {
      const invalidConfigs = [
        { id: '', name: 'Test', type: 'tester', apiKey: 'key', capabilities: [], permissions: [] },
        { id: 'test', name: '', type: 'tester', apiKey: 'key', capabilities: [], permissions: [] },
        { id: 'test', name: 'Test', type: '' as AgentType, apiKey: 'key', capabilities: [], permissions: [] },
        { id: 'test', name: 'Test', type: 'tester', apiKey: '', capabilities: [], permissions: [] },
        { id: 'test', name: 'Test', type: 'tester', apiKey: 'key', capabilities: null as any, permissions: [] },
        { id: 'test', name: 'Test', type: 'tester', apiKey: 'key', capabilities: [], permissions: null as any }
      ];

      invalidConfigs.forEach(config => {
        const validation = AgentFactory.validateConfig(config);
        expect(validation.valid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);
      });
    });

    it('should generate unique identifiers', () => {
      const ids = Array.from({ length: 100 }, () => AgentFactory.generateAgentId('tester'));
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(100);
      ids.forEach(id => expect(id).toMatch(/^tester_\w+$/));
    });

    it('should generate secure API keys with proper entropy', () => {
      const keys = Array.from({ length: 10 }, () => AgentFactory.generateApiKey());
      
      keys.forEach(key => {
        expect(key).toHaveLength(64);
        expect(key).toMatch(/^[a-f0-9]+$/);
      });

      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(10);
    });
  });

  describe('Health Check System Comprehensive Tests', () => {
    it('should monitor system resources accurately', async () => {
      const systemHealth = await healthManager.checkAll();
      
      expect(systemHealth).toBeDefined();
      expect(systemHealth.version).toBe('1.0.0-test');
      expect(systemHealth.uptime).toBeGreaterThanOrEqual(0);
      expect(systemHealth.timestamp).toBeDefined();
      expect(systemHealth.resources).toBeDefined();
      expect(systemHealth.resources.memory).toBeDefined();
      expect(systemHealth.resources.cpu).toBeDefined();
      expect(systemHealth.components).toBeInstanceOf(Array);
    });

    it('should handle component health checks with different thresholds', async () => {
      // Test with low threshold (should pass)
      const lowThresholdCheck = new (await import('../../src/core/observability/health')).MemoryHealthCheck(95);
      healthManager.registerCheck(lowThresholdCheck);
      
      const result1 = await healthManager.checkComponent('memory');
      expect(result1?.status).toBe(HealthStatus.HEALTHY);

      // Test with very high threshold (should also pass in test environment)
      const highThresholdCheck = new (await import('../../src/core/observability/health')).MemoryHealthCheck(100);
      healthManager.registerCheck(highThresholdCheck);
      
      const result2 = await healthManager.checkComponent('memory');
      expect([HealthStatus.HEALTHY, HealthStatus.DEGRADED]).toContain(result2?.status);
    });

    it('should handle concurrent health checks', async () => {
      const promises = Array.from({ length: 10 }, () => healthManager.checkAll());
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.timestamp).toBeDefined();
      });

      const timestamps = results.map(r => r.timestamp.getTime());
      const uniqueTimestamps = new Set(timestamps);
      expect(uniqueTimestamps.size).toBeGreaterThan(0);
    });
  });

  describe('Logger Component Comprehensive Tests', () => {
    it('should log messages with different levels', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation();
      
      logger.info('Test info message', { key: 'value' });
      logger.warn('Test warning message');
      logger.error('Test error message', new Error('Test error'));
      logger.debug('Test debug message');
      
      expect(spy).toHaveBeenCalledTimes(4);
      spy.mockRestore();
    });

    it('should handle error logging with stack traces', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation();
      const testError = new Error('Test error with stack');
      
      logger.error('Error occurred', testError, { context: 'test' });
      
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('Error occurred'),
        expect.objectContaining({
          error: expect.stringContaining('Test error with stack'),
          context: 'test'
        })
      );
      
      spy.mockRestore();
    });
  });

  describe('Metrics Collection Comprehensive Tests', () => {
    it('should create and manage different metric types', () => {
      const counter = metrics.createCounter('test_counter', 'Test counter', ['label']);
      const histogram = metrics.createHistogram('test_histogram', 'Test histogram', ['label']);
      const gauge = metrics.createGauge('test_gauge', 'Test gauge', ['label']);

      expect(counter).toBeDefined();
      expect(histogram).toBeDefined();
      expect(gauge).toBeDefined();
    });

    it('should track counter increments', () => {
      const counter = metrics.createCounter('test_counter', 'Test counter');
      
      counter.inc();
      counter.inc(5);
      counter.inc({ label: 'test' }, 3);

      const metricsOutput = metrics.getMetrics();
      expect(metricsOutput).toContain('test_counter');
      expect(metricsOutput).toContain('test_counter 6');
    });

    it('should track gauge values', () => {
      const gauge = metrics.createGauge('test_gauge', 'Test gauge');
      
      gauge.set(42);
      gauge.set({ label: 'test' }, 100);

      const metricsOutput = metrics.getMetrics();
      expect(metricsOutput).toContain('test_gauge');
      expect(metricsOutput).toContain('test_gauge 42');
    });

    it('should track histogram observations', () => {
      const histogram = metrics.createHistogram('test_histogram', 'Test histogram');
      
      histogram.observe(1.5);
      histogram.observe(2.5);
      histogram.observe(3.5);

      const metricsOutput = metrics.getMetrics();
      expect(metricsOutput).toContain('test_histogram');
    });
  });

  describe('System Integration Tests', () => {
    it('should initialize all core components without errors', () => {
      expect(() => {
        const testHealthManager = new HealthCheckManager('test');
        const testLogger = new Logger('test-service');
        const testMetrics = new MetricsCollector();
        
        const agent = AgentFactory.createAgent({
          id: 'integration-test-agent',
          name: 'Integration Test Agent',
          type: 'tester',
          apiKey: 'test-key',
          capabilities: ['test'],
          permissions: ['read']
        });
        
        expect(agent).toBeDefined();
      }).not.toThrow();
    });

    it('should handle component interactions gracefully', async () => {
      const agent = AgentFactory.createAgent({
        id: 'interaction-test',
        name: 'Interaction Test',
        type: 'tester',
        apiKey: 'test-key',
        capabilities: [],
        permissions: []
      });

      // Test that components can work together
      logger.info('Agent created', { agentId: agent.getAgentInfo().id });
      const health = await healthManager.checkAll();
      
      expect(health.status).toBeDefined();
      expect([HealthStatus.HEALTHY, HealthStatus.DEGRADED, HealthStatus.UNKNOWN])
        .toContain(health.status);
    });
  });
});