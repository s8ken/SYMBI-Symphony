/**
 * Metrics Collector - SYMBI Symphony
 * 
 * Comprehensive metrics collection and aggregation system for the SYMBI AI Agent ecosystem.
 * Supports various metric types, aggregation functions, and export formats.
 */

import { EventEmitter } from 'events';

export interface MetricValue {
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

export interface MetricDefinition {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  description: string;
  unit?: string;
  labels?: string[];
}

export interface AgentMetrics {
  agentId: string;
  taskCount: number;
  successRate: number;
  averageResponseTime: number;
  errorCount: number;
  lastActivity: Date;
  resourceUsage: {
    cpu: number;
    memory: number;
    network: number;
  };
}

export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    cached: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    iops: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
}

export interface ApplicationMetrics {
  timestamp: Date;
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  agents: {
    active: number;
    idle: number;
    total: number;
  };
  tasks: {
    pending: number;
    running: number;
    completed: number;
    failed: number;
  };
  errors: {
    count: number;
    rate: number;
    types: Record<string, number>;
  };
}

export interface MetricsConfig {
  collectionInterval: number; // milliseconds
  retentionPeriod: number; // milliseconds
  maxMetrics: number;
  enableSystemMetrics: boolean;
  enableApplicationMetrics: boolean;
  exportInterval: number; // milliseconds
  exporters: MetricsExporter[];
}

export interface MetricsExporter {
  type: 'prometheus' | 'statsd' | 'datadog' | 'newrelic' | 'console';
  config: Record<string, any>;
  enabled: boolean;
}

export class MetricsCollector extends EventEmitter {
  private metrics: Map<string, MetricValue[]> = new Map();
  private definitions: Map<string, MetricDefinition> = new Map();
  private config: MetricsConfig;
  private collectionTimer: NodeJS.Timeout | null = null;
  private exportTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<MetricsConfig>) {
    super();
    
    this.config = {
      collectionInterval: 5000, // 5 seconds
      retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
      maxMetrics: 10000,
      enableSystemMetrics: true,
      enableApplicationMetrics: true,
      exportInterval: 60000, // 1 minute
      exporters: [],
      ...config
    };

    this.initializeDefaultMetrics();
    this.startCollection();
  }

  /**
   * Initialize default metric definitions
   */
  private initializeDefaultMetrics(): void {
    const defaultMetrics: MetricDefinition[] = [
      {
        name: 'agent_task_count',
        type: 'counter',
        description: 'Total number of tasks processed by agents',
        labels: ['agent_id', 'status']
      },
      {
        name: 'agent_response_time',
        type: 'histogram',
        description: 'Agent response time in milliseconds',
        unit: 'ms',
        labels: ['agent_id', 'task_type']
      },
      {
        name: 'system_cpu_usage',
        type: 'gauge',
        description: 'System CPU usage percentage',
        unit: 'percent'
      },
      {
        name: 'system_memory_usage',
        type: 'gauge',
        description: 'System memory usage in bytes',
        unit: 'bytes'
      },
      {
        name: 'http_requests_total',
        type: 'counter',
        description: 'Total HTTP requests',
        labels: ['method', 'status_code', 'endpoint']
      },
      {
        name: 'http_request_duration',
        type: 'histogram',
        description: 'HTTP request duration in milliseconds',
        unit: 'ms',
        labels: ['method', 'endpoint']
      }
    ];

    defaultMetrics.forEach(metric => {
      this.definitions.set(metric.name, metric);
    });
  }

  /**
   * Record a counter metric
   */
  recordCounter(name: string, value: number = 1, labels?: Record<string, string>): void {
    this.recordMetric(name, value, labels);
  }

  /**
   * Record a gauge metric
   */
  recordGauge(name: string, value: number, labels?: Record<string, string>): void {
    this.recordMetric(name, value, labels);
  }

  /**
   * Record a histogram metric
   */
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    this.recordMetric(name, value, labels);
  }

  /**
   * Record a timing metric
   */
  recordTiming(name: string, startTime: number, labels?: Record<string, string>): void {
    const duration = Date.now() - startTime;
    this.recordMetric(name, duration, labels);
  }

  /**
   * Record a generic metric
   */
  private recordMetric(name: string, value: number, labels?: Record<string, string>): void {
    const metricValue: MetricValue = {
      value,
      timestamp: Date.now(),
      labels
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name)!;
    values.push(metricValue);

    // Limit the number of stored values
    if (values.length > this.config.maxMetrics) {
      values.splice(0, values.length - this.config.maxMetrics);
    }

    this.emit('metric_recorded', { name, value: metricValue });
  }

  /**
   * Get metric values
   */
  getMetric(name: string, since?: number): MetricValue[] {
    const values = this.metrics.get(name) || [];
    
    if (since) {
      return values.filter(v => v.timestamp >= since);
    }
    
    return values;
  }

  /**
   * Get all metric names
   */
  getMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }

  /**
   * Calculate metric statistics
   */
  getMetricStats(name: string, since?: number): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const values = this.getMetric(name, since);
    
    if (values.length === 0) {
      return null;
    }

    const sortedValues = values.map(v => v.value).sort((a, b) => a - b);
    const sum = sortedValues.reduce((acc, val) => acc + val, 0);

    return {
      count: values.length,
      sum,
      avg: sum / values.length,
      min: sortedValues[0],
      max: sortedValues[sortedValues.length - 1],
      p50: this.percentile(sortedValues, 0.5),
      p95: this.percentile(sortedValues, 0.95),
      p99: this.percentile(sortedValues, 0.99)
    };
  }

  /**
   * Calculate percentile
   */
  private percentile(sortedValues: number[], p: number): number {
    const index = Math.ceil(sortedValues.length * p) - 1;
    return sortedValues[Math.max(0, index)];
  }

  /**
   * Collect system metrics
   */
  private async collectSystemMetrics(): Promise<void> {
    if (!this.config.enableSystemMetrics) {
      return;
    }

    try {
      // CPU usage (simplified - in real implementation would use system calls)
      const cpuUsage = Math.random() * 100; // Mock data
      this.recordGauge('system_cpu_usage', cpuUsage);

      // Memory usage (simplified - in real implementation would use system calls)
      const memoryUsage = Math.random() * 8 * 1024 * 1024 * 1024; // Mock data
      this.recordGauge('system_memory_usage', memoryUsage);

      // Disk usage
      const diskUsage = Math.random() * 100 * 1024 * 1024 * 1024; // Mock data
      this.recordGauge('system_disk_usage', diskUsage);

    } catch (error) {
      this.emit('error', error);
    }
  }

  /**
   * Collect application metrics
   */
  private async collectApplicationMetrics(): Promise<void> {
    if (!this.config.enableApplicationMetrics) {
      return;
    }

    try {
      // Active agents count
      const activeAgents = Math.floor(Math.random() * 10); // Mock data
      this.recordGauge('active_agents_count', activeAgents);

      // Pending tasks count
      const pendingTasks = Math.floor(Math.random() * 50); // Mock data
      this.recordGauge('pending_tasks_count', pendingTasks);

    } catch (error) {
      this.emit('error', error);
    }
  }

  /**
   * Start metric collection
   */
  private startCollection(): void {
    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
    }

    this.collectionTimer = setInterval(async () => {
      await this.collectSystemMetrics();
      await this.collectApplicationMetrics();
      this.cleanup();
    }, this.config.collectionInterval);

    // Start export timer
    if (this.exportTimer) {
      clearInterval(this.exportTimer);
    }

    this.exportTimer = setInterval(() => {
      this.exportMetrics();
    }, this.config.exportInterval);
  }

  /**
   * Stop metric collection
   */
  stopCollection(): void {
    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
      this.collectionTimer = null;
    }

    if (this.exportTimer) {
      clearInterval(this.exportTimer);
      this.exportTimer = null;
    }
  }

  /**
   * Clean up old metrics
   */
  private cleanup(): void {
    const cutoff = Date.now() - this.config.retentionPeriod;

    for (const [name, values] of this.metrics.entries()) {
      const filteredValues = values.filter(v => v.timestamp >= cutoff);
      this.metrics.set(name, filteredValues);
    }
  }

  /**
   * Export metrics to configured exporters
   */
  private async exportMetrics(): Promise<void> {
    for (const exporter of this.config.exporters) {
      if (!exporter.enabled) {
        continue;
      }

      try {
        await this.exportToExporter(exporter);
      } catch (error) {
        this.emit('export_error', { exporter: exporter.type, error });
      }
    }
  }

  /**
   * Export to specific exporter
   */
  private async exportToExporter(exporter: MetricsExporter): Promise<void> {
    switch (exporter.type) {
      case 'prometheus':
        this.exportToPrometheus(exporter.config);
        break;
      case 'console':
        this.exportToConsole();
        break;
      default:
        throw new Error(`Unsupported exporter type: ${exporter.type}`);
    }
  }

  /**
   * Export to Prometheus format
   */
  private exportToPrometheus(config: any): string {
    let output = '';

    for (const [name, definition] of this.definitions.entries()) {
      const values = this.metrics.get(name) || [];
      
      if (values.length === 0) {
        continue;
      }

      // Add metric help and type
      output += `# HELP ${name} ${definition.description}\n`;
      output += `# TYPE ${name} ${definition.type}\n`;

      // Add metric values
      for (const value of values.slice(-1)) { // Only latest value for Prometheus
        let metricLine = name;
        
        if (value.labels && Object.keys(value.labels).length > 0) {
          const labelPairs = Object.entries(value.labels)
            .map(([key, val]) => `${key}="${val}"`)
            .join(',');
          metricLine += `{${labelPairs}}`;
        }
        
        metricLine += ` ${value.value} ${value.timestamp}\n`;
        output += metricLine;
      }
      
      output += '\n';
    }

    return output;
  }

  /**
   * Export to console
   */
  private exportToConsole(): void {
    console.log('\n=== Metrics Report ===');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    for (const name of this.getMetricNames()) {
      const stats = this.getMetricStats(name);
      if (stats) {
        console.log(`${name}: count=${stats.count}, avg=${stats.avg.toFixed(2)}, p95=${stats.p95.toFixed(2)}`);
      }
    }
    
    console.log('=====================\n');
  }

  /**
   * Add exporter
   */
  addExporter(exporter: MetricsExporter): void {
    this.config.exporters.push(exporter);
  }

  /**
   * Remove exporter
   */
  removeExporter(type: string): void {
    this.config.exporters = this.config.exporters.filter(e => e.type !== type);
  }

  /**
   * Get current configuration
   */
  getConfig(): MetricsConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<MetricsConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Restart collection with new config
    this.startCollection();
  }

  /**
   * Get metrics summary
   */
  getSummary(): {
    totalMetrics: number;
    totalValues: number;
    oldestTimestamp: number | null;
    newestTimestamp: number | null;
  } {
    let totalValues = 0;
    let oldestTimestamp: number | null = null;
    let newestTimestamp: number | null = null;

    for (const values of this.metrics.values()) {
      totalValues += values.length;
      
      if (values.length > 0) {
        const oldest = values[0].timestamp;
        const newest = values[values.length - 1].timestamp;
        
        if (oldestTimestamp === null || oldest < oldestTimestamp) {
          oldestTimestamp = oldest;
        }
        
        if (newestTimestamp === null || newest > newestTimestamp) {
          newestTimestamp = newest;
        }
      }
    }

    return {
      totalMetrics: this.metrics.size,
      totalValues,
      oldestTimestamp,
      newestTimestamp
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Destroy the metrics collector
   */
  destroy(): void {
    this.stopCollection();
    this.clear();
    this.removeAllListeners();
  }
}