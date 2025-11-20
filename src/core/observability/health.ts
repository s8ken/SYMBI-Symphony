/**
 * Health Check System for SYMBI Symphony
 * Provides comprehensive health monitoring for all system components
 */

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown'
}

export interface HealthCheckResult {
  status: HealthStatus;
  timestamp: string;
  duration: number;
  message?: string;
  details?: Record<string, any>;
}

export interface ComponentHealth {
  name: string;
  status: HealthStatus;
  lastCheck: string;
  uptime?: number;
  details?: Record<string, any>;
}

export interface SystemHealth {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  version: string;
  components: ComponentHealth[];
  resources: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
  };
}

export abstract class HealthCheck {
  constructor(public readonly name: string) {}

  abstract check(): Promise<HealthCheckResult>;

  protected createResult(
    status: HealthStatus,
    duration: number,
    message?: string,
    details?: Record<string, any>
  ): HealthCheckResult {
    return {
      status,
      timestamp: new Date().toISOString(),
      duration,
      message,
      details
    };
  }
}

export class DatabaseHealthCheck extends HealthCheck {
  constructor(private connectionPool: any) {
    super('database');
  }

  async check(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      // Attempt a simple query to verify database connectivity
      if (this.connectionPool && typeof this.connectionPool.query === 'function') {
        await this.connectionPool.query('SELECT 1');
        return this.createResult(
          HealthStatus.HEALTHY,
          Date.now() - start,
          'Database connection is healthy'
        );
      }
      return this.createResult(
        HealthStatus.UNKNOWN,
        Date.now() - start,
        'Database connection pool not configured'
      );
    } catch (error) {
      return this.createResult(
        HealthStatus.UNHEALTHY,
        Date.now() - start,
        `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error: error instanceof Error ? error.stack : String(error) }
      );
    }
  }
}

export class RedisHealthCheck extends HealthCheck {
  constructor(private redisClient: any) {
    super('redis');
  }

  async check(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      if (this.redisClient && typeof this.redisClient.ping === 'function') {
        await this.redisClient.ping();
        return this.createResult(
          HealthStatus.HEALTHY,
          Date.now() - start,
          'Redis connection is healthy'
        );
      }
      return this.createResult(
        HealthStatus.UNKNOWN,
        Date.now() - start,
        'Redis client not configured'
      );
    } catch (error) {
      return this.createResult(
        HealthStatus.UNHEALTHY,
        Date.now() - start,
        `Redis connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error: error instanceof Error ? error.stack : String(error) }
      );
    }
  }
}

export class AgentOrchestraHealthCheck extends HealthCheck {
  constructor(private orchestra: any) {
    super('agent-orchestra');
  }

  async check(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      if (!this.orchestra) {
        return this.createResult(
          HealthStatus.UNKNOWN,
          Date.now() - start,
          'Agent orchestra not initialized'
        );
      }

      // Check if orchestra has active agents
      const activeAgents = this.orchestra.getActiveAgents?.() || [];
      const status = activeAgents.length > 0 ? HealthStatus.HEALTHY : HealthStatus.DEGRADED;
      
      return this.createResult(
        status,
        Date.now() - start,
        `Agent orchestra has ${activeAgents.length} active agents`,
        { activeAgents: activeAgents.length }
      );
    } catch (error) {
      return this.createResult(
        HealthStatus.UNHEALTHY,
        Date.now() - start,
        `Agent orchestra check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error: error instanceof Error ? error.stack : String(error) }
      );
    }
  }
}

export class MemoryHealthCheck extends HealthCheck {
  constructor(private thresholdPercentage: number = 90) {
    super('memory');
  }

  async check(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      const usage = process.memoryUsage();
      const totalMemory = usage.heapTotal;
      const usedMemory = usage.heapUsed;
      const percentage = (usedMemory / totalMemory) * 100;

      let status = HealthStatus.HEALTHY;
      if (percentage >= this.thresholdPercentage) {
        status = HealthStatus.UNHEALTHY;
      } else if (percentage >= this.thresholdPercentage * 0.8) {
        status = HealthStatus.DEGRADED;
      }

      return this.createResult(
        status,
        Date.now() - start,
        `Memory usage at ${percentage.toFixed(2)}%`,
        {
          heapUsed: usedMemory,
          heapTotal: totalMemory,
          percentage: percentage.toFixed(2),
          external: usage.external,
          rss: usage.rss
        }
      );
    } catch (error) {
      return this.createResult(
        HealthStatus.UNHEALTHY,
        Date.now() - start,
        `Memory check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

export class HealthCheckManager {
  private checks: Map<string, HealthCheck> = new Map();
  private startTime: number = Date.now();
  private version: string;

  constructor(version: string = '1.0.0') {
    this.version = version;
  }

  registerCheck(check: HealthCheck): void {
    this.checks.set(check.name, check);
  }

  unregisterCheck(name: string): void {
    this.checks.delete(name);
  }

  async checkAll(): Promise<SystemHealth> {
    const componentResults = await Promise.all(
      Array.from(this.checks.values()).map(async (check) => {
        const result = await check.check();
        return {
          name: check.name,
          status: result.status,
          lastCheck: result.timestamp,
          uptime: result.duration,
          details: result.details
        };
      })
    );

    // Determine overall system status
    let overallStatus = HealthStatus.HEALTHY;
    if (componentResults.some(c => c.status === HealthStatus.UNHEALTHY)) {
      overallStatus = HealthStatus.UNHEALTHY;
    } else if (componentResults.some(c => c.status === HealthStatus.DEGRADED)) {
      overallStatus = HealthStatus.DEGRADED;
    } else if (componentResults.every(c => c.status === HealthStatus.UNKNOWN)) {
      overallStatus = HealthStatus.UNKNOWN;
    }

    // Get resource usage
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: this.version,
      components: componentResults,
      resources: {
        memory: {
          used: memUsage.heapUsed,
          total: memUsage.heapTotal,
          percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
        },
        cpu: {
          usage: (cpuUsage.user + cpuUsage.system) / 1000000 // Convert to seconds
        }
      }
    };
  }

  async checkComponent(name: string): Promise<HealthCheckResult | null> {
    const check = this.checks.get(name);
    if (!check) {
      return null;
    }
    return await check.check();
  }

  getRegisteredChecks(): string[] {
    return Array.from(this.checks.keys());
  }
}

// Singleton instance
let healthCheckManager: HealthCheckManager | null = null;

export function getHealthCheckManager(version?: string): HealthCheckManager {
  if (!healthCheckManager) {
    healthCheckManager = new HealthCheckManager(version);
  }
  return healthCheckManager;
}

export function resetHealthCheckManager(): void {
  healthCheckManager = null;
}