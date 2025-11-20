/**
 * Integration tests for health check system
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  HealthCheckManager,
  HealthStatus,
  MemoryHealthCheck,
  DatabaseHealthCheck,
  RedisHealthCheck,
} from '../../src/core/observability/health';

describe('Health Check System Integration Tests', () => {
  let healthManager: HealthCheckManager;

  beforeAll(() => {
    healthManager = new HealthCheckManager('1.0.0-test');
  });

  afterAll(() => {
    // Cleanup
  });

  describe('Memory Health Check', () => {
    it('should check memory usage', async () => {
      const memoryCheck = new MemoryHealthCheck(90);
      healthManager.registerCheck(memoryCheck);

      const result = await healthManager.checkComponent('memory');
      
      expect(result).toBeDefined();
      expect(result?.status).toBeDefined();
      expect(result?.timestamp).toBeDefined();
      expect(result?.duration).toBeGreaterThanOrEqual(0);
    });

    it('should report healthy status when memory is below threshold', async () => {
      const memoryCheck = new MemoryHealthCheck(99); // Very high threshold
      healthManager.registerCheck(memoryCheck);

      const result = await healthManager.checkComponent('memory');
      
      expect(result?.status).toBe(HealthStatus.HEALTHY);
    });
  });

  describe('System Health Check', () => {
    it('should check all registered components', async () => {
      const memoryCheck = new MemoryHealthCheck(90);
      healthManager.registerCheck(memoryCheck);

      const systemHealth = await healthManager.checkAll();
      
      expect(systemHealth).toBeDefined();
      expect(systemHealth.status).toBeDefined();
      expect(systemHealth.timestamp).toBeDefined();
      expect(systemHealth.uptime).toBeGreaterThanOrEqual(0);
      expect(systemHealth.version).toBe('1.0.0-test');
      expect(systemHealth.components).toBeInstanceOf(Array);
      expect(systemHealth.components.length).toBeGreaterThan(0);
      expect(systemHealth.resources).toBeDefined();
      expect(systemHealth.resources.memory).toBeDefined();
      expect(systemHealth.resources.cpu).toBeDefined();
    });

    it('should report overall status based on component statuses', async () => {
      const systemHealth = await healthManager.checkAll();
      
      // Should be healthy or degraded, not unhealthy in test environment
      expect([HealthStatus.HEALTHY, HealthStatus.DEGRADED, HealthStatus.UNKNOWN])
        .toContain(systemHealth.status);
    });
  });

  describe('Health Check Manager', () => {
    it('should register and unregister checks', () => {
      const memoryCheck = new MemoryHealthCheck(90);
      
      healthManager.registerCheck(memoryCheck);
      expect(healthManager.getRegisteredChecks()).toContain('memory');
      
      healthManager.unregisterCheck('memory');
      expect(healthManager.getRegisteredChecks()).not.toContain('memory');
    });

    it('should return null for non-existent component', async () => {
      const result = await healthManager.checkComponent('non-existent');
      expect(result).toBeNull();
    });
  });
});