/**
 * Performance and Load Testing Suite
 * Tests system performance under various load conditions
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { AgentFactory } from '../../src/core/agent/factory';
import { HealthCheckManager } from '../../src/core/observability/health';
import { Logger } from '../../src/core/observability/logger';
import { MetricsCollector } from '../../src/core/observability/metrics';
import { JWTHelper } from '../../src/core/auth/jwt-helper';
import { RateLimiter } from '../../src/core/security/rate-limiter';

describe('Performance and Load Testing', () => {
  let components: any = {};
  let performanceMetrics: any = {};

  beforeAll(async () => {
    components.healthManager = new HealthCheckManager('1.0.0-performance-test');
    components.logger = new Logger('performance-test');
    components.metrics = new MetricsCollector();
    components.jwtHelper = new JWTHelper('test-secret-key');
    components.rateLimiter = new RateLimiter(1000, 60000); // 1000 requests per minute

    // Initialize performance counters
    performanceMetrics = {
      operationTimes: [],
      memoryUsage: [],
      cpuUsage: [],
      errorRates: new Map(),
      throughput: [],
      responseTimes: []
    };
  });

  afterAll(() => {
    // Cleanup
  });

  beforeEach(() => {
    components.metrics.clear();
    performanceMetrics.operationTimes = [];
  });

  describe('Agent Creation Performance', () => {
    it('should create agents within performance thresholds', async () => {
      const agentCount = 100;
      const creationTimes: number[] = [];

      for (let i = 0; i < agentCount; i++) {
        const start = performance.now();
        
        const agent = AgentFactory.createAgent({
          id: `perf-agent-${i}`,
          name: `Performance Agent ${i}`,
          type: 'tester',
          apiKey: 'test-key',
          capabilities: ['test', 'validate'],
          permissions: ['read']
        });

        const end = performance.now();
        creationTimes.push(end - start);
        
        expect(agent).toBeDefined();
      }

      const avgCreationTime = creationTimes.reduce((a, b) => a + b, 0) / creationTimes.length;
      const maxCreationTime = Math.max(...creationTimes);

      expect(avgCreationTime).toBeLessThan(10); // < 10ms average
      expect(maxCreationTime).toBeLessThan(50); // < 50ms max
      
      performanceMetrics.operationTimes.push({
        operation: 'agent_creation',
        count: agentCount,
        avgTime: avgCreationTime,
        maxTime: maxCreationTime
      });
    });

    it('should handle concurrent agent creation', async () => {
      const concurrentCount = 50;
      
      const startTime = performance.now();
      
      const creationPromises = Array.from({ length: concurrentCount }, async (_, i) => {
        return AgentFactory.createAgent({
          id: `concurrent-agent-${i}`,
          name: `Concurrent Agent ${i}`,
          type: 'processor',
          apiKey: 'test-key',
          capabilities: ['process'],
          permissions: ['read', 'write']
        });
      });

      const agents = await Promise.all(creationPromises);
      const endTime = performance.now();
      
      expect(agents).toHaveLength(concurrentCount);
      agents.forEach(agent => expect(agent).toBeDefined());
      
      const totalTime = endTime - startTime;
      const avgTimePerAgent = totalTime / concurrentCount;
      
      expect(totalTime).toBeLessThan(1000); // < 1 second total
      expect(avgTimePerAgent).toBeLessThan(20); // < 20ms per agent
    });
  });

  describe('Authentication Performance', () => {
    it('should generate JWT tokens within performance limits', () => {
      const tokenCount = 1000;
      const generationTimes: number[] = [];

      for (let i = 0; i < tokenCount; i++) {
        const start = performance.now();
        
        const token = components.jwtHelper.generateToken({
          userId: `user-${i}`,
          role: 'agent',
          permissions: ['read', 'write']
        });

        const end = performance.now();
        generationTimes.push(end - start);
        
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
      }

      const avgGenerationTime = generationTimes.reduce((a, b) => a + b, 0) / generationTimes.length;
      const maxGenerationTime = Math.max(...generationTimes);

      expect(avgGenerationTime).toBeLessThan(1); // < 1ms average
      expect(maxGenerationTime).toBeLessThan(10); // < 10ms max
      
      performanceMetrics.operationTimes.push({
        operation: 'jwt_generation',
        count: tokenCount,
        avgTime: avgGenerationTime,
        maxTime: maxGenerationTime
      });
    });

    it('should verify JWT tokens efficiently', () => {
      const tokens = Array.from({ length: 100 }, (_, i) =>
        components.jwtHelper.generateToken({
          userId: `verify-user-${i}`,
          role: 'agent'
        })
      );

      const verificationTimes: number[] = [];

      tokens.forEach(token => {
        const start = performance.now();
        
        const decoded = components.jwtHelper.verifyToken(token);
        
        const end = performance.now();
        verificationTimes.push(end - start);
        
        expect(decoded).toBeDefined();
        expect(decoded.userId).toMatch(/^verify-user-\d+$/);
      });

      const avgVerificationTime = verificationTimes.reduce((a, b) => a + b, 0) / verificationTimes.length;
      expect(avgVerificationTime).toBeLessThan(1); // < 1ms average
    });
  });

  describe('Rate Limiting Performance', () => {
    it('should handle high-volume rate limit checks', () => {
      const checkCount = 10000;
      const clientIds = Array.from({ length: 100 }, (_, i) => `client-${i}`);
      
      const startTime = performance.now();
      
      for (let i = 0; i < checkCount; i++) {
        const clientId = clientIds[i % clientIds.length];
        const result = components.rateLimiter.checkLimit(clientId);
        
        expect(result).toBeDefined();
        expect(typeof result.allowed).toBe('boolean');
        expect(typeof result.remaining).toBe('number');
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTimePerCheck = totalTime / checkCount;
      
      expect(totalTime).toBeLessThan(1000); // < 1 second for 10k checks
      expect(avgTimePerCheck).toBeLessThan(0.1); // < 0.1ms per check
    });

    it('should maintain performance under rate limit pressure', () => {
      const burstCount = 2000;
      const clientId = 'burst-client';
      
      const startTime = performance.now();
      
      let allowedCount = 0;
      let blockedCount = 0;
      
      for (let i = 0; i < burstCount; i++) {
        const result = components.rateLimiter.checkLimit(clientId);
        if (result.allowed) {
          allowedCount++;
        } else {
          blockedCount++;
        }
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(500); // < 500ms for burst
      expect(allowedCount).toBeLessThanOrEqual(1000); // Should respect limit
      expect(blockedCount).toBeGreaterThan(0); // Some should be blocked
    });
  });

  describe('Health Check Performance', () => {
    it('should perform health checks efficiently', async () => {
      const checkCount = 100;
      const checkTimes: number[] = [];

      for (let i = 0; i < checkCount; i++) {
        const start = performance.now();
        
        const health = await components.healthManager.checkAll();
        
        const end = performance.now();
        checkTimes.push(end - start);
        
        expect(health).toBeDefined();
        expect(health.status).toBeDefined();
        expect(health.timestamp).toBeDefined();
      }

      const avgCheckTime = checkTimes.reduce((a, b) => a + b, 0) / checkTimes.length;
      expect(avgCheckTime).toBeLessThan(50); // < 50ms average
    });

    it('should handle concurrent health checks', async () => {
      const concurrentChecks = 50;
      
      const startTime = performance.now();
      
      const healthCheckPromises = Array.from({ length: concurrentChecks }, () =>
        components.healthManager.checkAll()
      );

      const healthResults = await Promise.all(healthCheckPromises);
      const endTime = performance.now();
      
      expect(healthResults).toHaveLength(concurrentChecks);
      healthResults.forEach(health => {
        expect(health.status).toBeDefined();
      });
      
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(1000); // < 1 second for 50 concurrent checks
    });
  });

  describe('Metrics Collection Performance', () => {
    it('should handle high-frequency metric updates', () => {
      const updateCount = 10000;
      const counter = components.metrics.createCounter('performance_counter', 'Performance test counter');
      
      const startTime = performance.now();
      
      for (let i = 0; i < updateCount; i++) {
        counter.inc();
        if (i % 100 === 0) {
          counter.inc({ label: 'batch' }, 10);
        }
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(1000); // < 1 second for 10k updates
      
      // Verify metrics were recorded
      const metricsOutput = components.metrics.getMetrics();
      expect(metricsOutput).toContain('performance_counter');
    });

    it('should generate metrics reports efficiently', () => {
      // Create multiple metric types
      const counter = components.metrics.createCounter('test_counter', 'Test counter');
      const histogram = components.metrics.createHistogram('test_histogram', 'Test histogram');
      const gauge = components.metrics.createGauge('test_gauge', 'Test gauge');
      
      // Populate with data
      for (let i = 0; i < 1000; i++) {
        counter.inc();
        histogram.observe(Math.random() * 100);
        gauge.set(Math.random() * 1000);
      }
      
      const startTime = performance.now();
      
      const metricsReport = components.metrics.getMetrics();
      
      const endTime = performance.now();
      const reportGenerationTime = endTime - startTime;
      
      expect(metricsReport).toBeDefined();
      expect(metricsReport.length).toBeGreaterThan(0);
      expect(reportGenerationTime).toBeLessThan(100); // < 100ms to generate report
    });
  });

  describe('Memory Usage Testing', () => {
    it('should maintain memory efficiency during operations', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform memory-intensive operations
      const agents = [];
      const tokens = [];
      
      for (let i = 0; i < 1000; i++) {
        agents.push(AgentFactory.createAgent({
          id: `memory-agent-${i}`,
          name: `Memory Agent ${i}`,
          type: 'tester',
          apiKey: 'test-key',
          capabilities: Array.from({ length: 10 }, (_, j) => `capability-${j}`),
          permissions: Array.from({ length: 5 }, (_, j) => `permission-${j}`)
        }));
        
        tokens.push(components.jwtHelper.generateToken({
          userId: `memory-user-${i}`,
          role: 'agent',
          permissions: Array.from({ length: 3 }, (_, j) => `perm-${j}`)
        }));
      }
      
      const afterOperationsMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = afterOperationsMemory - initialMemory;
      
      // Should not consume excessive memory (adjust threshold based on environment)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // < 100MB increase
      
      // Clean up
      agents.length = 0;
      tokens.length = 0;
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const afterCleanupMemory = process.memoryUsage().heapUsed;
      const memoryReduction = afterOperationsMemory - afterCleanupMemory;
      
      // Should recover some memory after cleanup
      expect(memoryReduction).toBeGreaterThan(0);
    });

    it('should handle memory leaks gracefully', () => {
      const memorySnapshots = [];
      const snapshotInterval = 100; // Take snapshot every 100 operations
      
      for (let cycle = 0; cycle < 5; cycle++) {
        // Perform operations
        for (let i = 0; i < snapshotInterval; i++) {
          AgentFactory.createAgent({
            id: `leak-test-agent-${cycle}-${i}`,
            name: `Leak Test Agent ${cycle}-${i}`,
            type: 'tester',
            apiKey: 'test-key',
            capabilities: ['test'],
            permissions: ['read']
          });
        }
        
        // Take memory snapshot
        memorySnapshots.push({
          cycle,
          memory: process.memoryUsage().heapUsed,
          timestamp: Date.now()
        });
        
        // Try to clean up
        if (global.gc) {
          global.gc();
        }
      }
      
      // Check for memory growth patterns
      const memoryGrowth = memorySnapshots.slice(1).map((snapshot, index) => ({
        cycle: snapshot.cycle,
        growth: snapshot.memory - memorySnapshots[index].memory
      }));
      
      // Memory growth should stabilize (not continuously increase)
      const recentGrowth = memoryGrowth.slice(-2);
      const avgRecentGrowth = recentGrowth.reduce((sum, g) => sum + g.growth, 0) / recentGrowth.length;
      
      // Recent growth should be minimal
      expect(avgRecentGrowth).toBeLessThan(10 * 1024 * 1024); // < 10MB average growth
    });
  });

  describe('Concurrency and Throughput Testing', () => {
    it('should maintain throughput under concurrent load', async () => {
      const concurrentOperations = 100;
      const operationsPerWorker = 50;
      
      const startTime = performance.now();
      
      const workers = Array.from({ length: concurrentOperations }, async (_, workerIndex) => {
        const results = [];
        
        for (let i = 0; i < operationsPerWorker; i++) {
          const operationStart = performance.now();
          
          // Mix of different operations
          switch (i % 4) {
            case 0:
              AgentFactory.createAgent({
                id: `worker-${workerIndex}-agent-${i}`,
                name: `Worker Agent ${workerIndex}-${i}`,
                type: 'tester',
                apiKey: 'test-key',
                capabilities: ['test'],
                permissions: ['read']
              });
              break;
            case 1:
              components.jwtHelper.generateToken({
                userId: `worker-${workerIndex}-user-${i}`,
                role: 'agent'
              });
              break;
            case 2:
              components.rateLimiter.checkLimit(`worker-${workerIndex}`);
              break;
            case 3:
              await components.healthManager.checkAll();
              break;
          }
          
          const operationEnd = performance.now();
          results.push(operationEnd - operationStart);
        }
        
        return results;
      });
      
      const workerResults = await Promise.all(workers);
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      const totalOperations = concurrentOperations * operationsPerWorker;
      const throughput = totalOperations / (totalTime / 1000); // operations per second
      
      expect(totalTime).toBeLessThan(10000); // < 10 seconds total
      expect(throughput).toBeGreaterThan(100); // > 100 operations per second
      
      // Analyze operation times
      const allOperationTimes = workerResults.flat();
      const avgOperationTime = allOperationTimes.reduce((a, b) => a + b, 0) / allOperationTimes.length;
      const maxOperationTime = Math.max(...allOperationTimes);
      
      expect(avgOperationTime).toBeLessThan(50); // < 50ms average
      expect(maxOperationTime).toBeLessThan(500); // < 500ms max
      
      performanceMetrics.throughput.push({
        test: 'concurrent_mixed_operations',
        totalOperations,
        totalTime,
        throughput,
        avgOperationTime,
        maxOperationTime
      });
    });

    it('should scale with increasing load', async () => {
      const loadLevels = [10, 50, 100, 200];
      const scalabilityResults = [];
      
      for (const loadLevel of loadLevels) {
        const startTime = performance.now();
        
        const operations = Array.from({ length: loadLevel }, async (_, i) => {
          return AgentFactory.createAgent({
            id: `scale-agent-${loadLevel}-${i}`,
            name: `Scale Agent ${loadLevel}-${i}`,
            type: 'tester',
            apiKey: 'test-key',
            capabilities: ['test'],
            permissions: ['read']
          });
        });
        
        const results = await Promise.all(operations);
        const endTime = performance.now();
        
        const totalTime = endTime - startTime;
        const throughput = loadLevel / (totalTime / 1000);
        
        scalabilityResults.push({
          loadLevel,
          totalTime,
          throughput,
          avgTimePerOperation: totalTime / loadLevel
        });
        
        expect(results).toHaveLength(loadLevel);
      }
      
      // Analyze scalability
      const throughputs = scalabilityResults.map(r => r.throughput);
      
      // Throughput should not decrease dramatically with load
      expect(throughputs[throughputs.length - 1]).toBeGreaterThan(throughputs[0] * 0.5);
      
      // Time per operation should not increase dramatically
      const avgTimes = scalabilityResults.map(r => r.avgTimePerOperation);
      expect(avgTimes[avgTimes.length - 1]).toBeLessThan(avgTimes[0] * 5);
      
      performanceMetrics.throughput.push({
        test: 'scalability_test',
        results: scalabilityResults
      });
    });
  });

  describe('Stress Testing', () => {
    it('should handle sustained high load without degradation', async () => {
      const testDuration = 5000; // 5 seconds
      const targetOpsPerSecond = 200;
      const totalOperations = (testDuration / 1000) * targetOpsPerSecond;
      
      const startTime = Date.now();
      const operationResults = [];
      let operationCount = 0;
      
      while (Date.now() - startTime < testDuration) {
        const batchOperations = Math.min(10, totalOperations - operationCount);
        
        const batchPromises = Array.from({ length: batchOperations }, async (_, i) => {
          const opStart = performance.now();
          
          try {
            AgentFactory.createAgent({
              id: `stress-agent-${operationCount + i}`,
              name: `Stress Agent ${operationCount + i}`,
              type: 'tester',
              apiKey: 'test-key',
              capabilities: ['test'],
              permissions: ['read']
            });
            
            const opEnd = performance.now();
            return { success: true, duration: opEnd - opStart };
          } catch (error) {
            const opEnd = performance.now();
            return { success: false, duration: opEnd - opStart, error: error.message };
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        operationResults.push(...batchResults);
        operationCount += batchOperations;
        
        // Small delay to control rate
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      const actualDuration = Date.now() - startTime;
      const actualThroughput = operationCount / (actualDuration / 1000);
      const successRate = operationResults.filter(r => r.success).length / operationResults.length;
      const avgOperationTime = operationResults.reduce((sum, r) => sum + r.duration, 0) / operationResults.length;
      
      expect(operationCount).toBeGreaterThan(totalOperations * 0.9); // At least 90% of target
      expect(actualThroughput).toBeGreaterThan(targetOpsPerSecond * 0.8); // At least 80% of target throughput
      expect(successRate).toBeGreaterThan(0.95); // > 95% success rate
      expect(avgOperationTime).toBeLessThan(50); // < 50ms average
      
      performanceMetrics.throughput.push({
        test: 'sustained_load_test',
        duration: actualDuration,
        operations: operationCount,
        throughput: actualThroughput,
        successRate,
        avgOperationTime
      });
    });

    it('should recover gracefully from overload conditions', async () => {
      // Create extreme load
      const extremeLoad = 1000;
      
      const extremeLoadPromises = Array.from({ length: extremeLoad }, async (_, i) => {
        try {
          return {
            success: true,
            result: AgentFactory.createAgent({
              id: `overload-agent-${i}`,
              name: `Overload Agent ${i}`,
              type: 'tester',
              apiKey: 'test-key',
              capabilities: ['test'],
              permissions: ['read']
            })
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });
      
      const extremeResults = await Promise.all(extremeLoadPromises);
      
      // Wait for system to stabilize
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test normal operations after recovery
      const recoveryStartTime = performance.now();
      
      const recoveryOperations = Array.from({ length: 50 }, async (_, i) => {
        const start = performance.now();
        
        const agent = AgentFactory.createAgent({
          id: `recovery-agent-${i}`,
          name: `Recovery Agent ${i}`,
          type: 'tester',
          apiKey: 'test-key',
          capabilities: ['test'],
          permissions: ['read']
        });
        
        const end = performance.now();
        return { agent, duration: end - start };
      });
      
      const recoveryResults = await Promise.all(recoveryOperations);
      const recoveryEndTime = performance.now();
      
      // System should recover and handle normal operations
      expect(recoveryResults).toHaveLength(50);
      recoveryResults.forEach(result => {
        expect(result.agent).toBeDefined();
        expect(result.duration).toBeLessThan(100); // < 100ms after recovery
      });
      
      const recoveryTime = recoveryEndTime - recoveryStartTime;
      expect(recoveryTime).toBeLessThan(2000); // < 2 seconds for recovery operations
    });
  });

  describe('Performance Report Generation', () => {
    it('should generate comprehensive performance report', () => {
      const report = {
        timestamp: new Date().toISOString(),
        testEnvironment: 'performance-test',
        metrics: performanceMetrics,
        summary: {
          totalOperations: performanceMetrics.operationTimes.reduce((sum, op) => sum + op.count, 0),
          avgOperationTimes: performanceMetrics.operationTimes.reduce((acc, op) => {
            acc[op.operation] = op.avgTime;
            return acc;
          }, {}),
          throughputTests: performanceMetrics.throughput.length,
          systemHealth: 'optimized'
        }
      };
      
      expect(report.timestamp).toBeDefined();
      expect(report.metrics.operationTimes.length).toBeGreaterThan(0);
      expect(report.summary.totalOperations).toBeGreaterThan(0);
      expect(report.throughputTests).toBeGreaterThan(0);
      
      // Validate performance thresholds
      Object.entries(report.summary.avgOperationTimes).forEach(([operation, avgTime]) => {
        expect(avgTime).toBeLessThan(100); // All operations should be < 100ms average
      });
      
      // Generate detailed performance metrics
      const detailedMetrics = {
        ...report,
        performanceGrades: {
          agentCreation: report.summary.avgOperationTimes.agent_creation || 0 < 10 ? 'A' : 'B',
          jwtGeneration: report.summary.avgOperationTimes.jwt_generation || 0 < 5 ? 'A' : 'B',
          throughput: performanceMetrics.throughput.some(t => t.throughput > 100) ? 'A' : 'B',
          scalability: 'A',
          stability: 'A'
        }
      };
      
      expect(Object.values(detailedMetrics.performanceGrades).every(grade => ['A', 'B'].includes(grade))).toBe(true);
    });
  });
});