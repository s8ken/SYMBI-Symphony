/**
 * SYMBI Orchestration Monitoring & Observability System
 * 
 * Comprehensive monitoring, metrics collection, and alerting
 * for enterprise-grade orchestration operations.
 */

import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

export interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
  type: 'counter' | 'gauge' | 'histogram' | 'timer';
}

export interface HealthCheck {
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  details?: Record<string, any>;
  responseTime?: number;
}

export interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  message: string;
  timestamp: Date;
  component: string;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    inbound: number;
    outbound: number;
  };
  processes: number;
  uptime: number;
}

export class ObservabilitySystem extends EventEmitter {
  private metrics: Map<string, Metric[]> = new Map();
  private healthChecks: Map<string, HealthCheck> = new Map();
  private alerts: Alert[] = [];
  private metricHistory: Map<string, number[]> = new Map();
  private alertThresholds: Map<string, any> = new Map();
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.setupDefaultThresholds();
    this.startMonitoring();
  }

  /**
   * Start the monitoring system
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('🔍 Starting SYMBI Observability System...');

    // System metrics collection
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.checkHealthChecks();
      this.evaluateAlerts();
      this.cleanupOldData();
    }, 5000); // Every 5 seconds

    this.emit('monitoring:started');
  }

  /**
   * Stop the monitoring system
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.emit('monitoring:stopped');
    console.log('🛑 SYMBI Observability System stopped');
  }

  /**
   * Record a metric
   */
  public recordMetric(metric: Omit<Metric, 'timestamp'>): void {
    const fullMetric: Metric = {
      ...metric,
      timestamp: new Date()
    };

    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }

    const metricList = this.metrics.get(metric.name)!;
    metricList.push(fullMetric);

    // Keep only last 1000 metrics per name
    if (metricList.length > 1000) {
      metricList.shift();
    }

    // Update historical data for trending
    if (!this.metricHistory.has(metric.name)) {
      this.metricHistory.set(metric.name, []);
    }

    const history = this.metricHistory.get(metric.name)!;
    history.push(metric.value);

    // Keep only last 100 data points for trending
    if (history.length > 100) {
      history.shift();
    }

    // Check thresholds and emit alerts
    this.checkMetricThresholds(fullMetric);

    this.emit('metric:recorded', fullMetric);
  }

  /**
   * Record a health check
   */
  public recordHealthCheck(healthCheck: HealthCheck): void {
    this.healthChecks.set(healthCheck.component, healthCheck);
    
    // Emit alert if health check fails
    if (healthCheck.status !== 'healthy') {
      this.createAlert({
        severity: healthCheck.status === 'unhealthy' ? 'critical' : 'medium',
        type: 'health_check_failed',
        message: `Health check failed for ${healthCheck.component}: ${healthCheck.status}`,
        component: healthCheck.component
      });
    }

    this.emit('health:check', healthCheck);
  }

  /**
   * Create an alert
   */
  public createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): Alert {
    const alert: Alert = {
      ...alertData,
      id: this.generateAlertId(),
      timestamp: new Date(),
      resolved: false
    };

    this.alerts.push(alert);
    this.emit('alert:created', alert);

    console.log(`🚨 ALERT [${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message}`);
    
    return alert;
  }

  /**
   * Resolve an alert
   */
  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert || alert.resolved) return false;

    alert.resolved = true;
    alert.resolvedAt = new Date();

    this.emit('alert:resolved', alert);
    console.log(`✅ ALERT RESOLVED: ${alert.type}`);

    return true;
  }

  /**
   * Get current metrics
   */
  public getMetrics(metricName?: string): Metric[] {
    if (metricName) {
      return this.metrics.get(metricName) || [];
    }

    const allMetrics: Metric[] = [];
    for (const metricList of this.metrics.values()) {
      allMetrics.push(...metricList);
    }

    return allMetrics;
  }

  /**
   * Get metric trends
   */
  public getMetricTrends(metricName: string): {
    current: number;
    average: number;
    min: number;
    max: number;
    trend: 'up' | 'down' | 'stable';
  } {
    const history = this.metricHistory.get(metricName) || [];
    if (history.length === 0) {
      return { current: 0, average: 0, min: 0, max: 0, trend: 'stable' };
    }

    const current = history[history.length - 1];
    const average = history.reduce((sum, val) => sum + val, 0) / history.length;
    const min = Math.min(...history);
    const max = Math.max(...history);

    // Calculate trend (compare last 10% with previous 10%)
    const sampleSize = Math.max(5, Math.floor(history.length * 0.1));
    const recent = history.slice(-sampleSize);
    const previous = history.slice(-sampleSize * 2, -sampleSize);
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const previousAvg = previous.length > 0 ? 
      previous.reduce((sum, val) => sum + val, 0) / previous.length : recentAvg;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    const threshold = Math.abs(recentAvg - previousAvg) / Math.max(previousAvg, 1);
    if (threshold > 0.1) {
      trend = recentAvg > previousAvg ? 'up' : 'down';
    }

    return { current, average, min, max, trend };
  }

  /**
   * Get system health status
   */
  public getSystemHealth(): {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    components: HealthCheck[];
    activeAlerts: number;
    criticalAlerts: number;
  } {
    const components = Array.from(this.healthChecks.values());
    const activeAlerts = this.alerts.filter(a => !a.resolved).length;
    const criticalAlerts = this.alerts.filter(a => !a.resolved && a.severity === 'critical').length;

    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (criticalAlerts > 0) {
      overall = 'unhealthy';
    } else if (activeAlerts > 0 || components.some(c => c.status === 'degraded')) {
      overall = 'degraded';
    } else if (components.some(c => c.status === 'unhealthy')) {
      overall = 'unhealthy';
    }

    return {
      overall,
      components,
      activeAlerts,
      criticalAlerts
    };
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): Alert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  /**
   * Get all alerts
   */
  public getAllAlerts(): Alert[] {
    return [...this.alerts];
  }

  /**
   * Export monitoring data
   */
  public exportData(): {
    metrics: Record<string, Metric[]>;
    healthChecks: Record<string, HealthCheck>;
    alerts: Alert[];
    timestamp: string;
  } {
    const metrics: Record<string, Metric[]> = {};
    for (const [name, metricList] of this.metrics) {
      metrics[name] = metricList;
    }

    const healthChecks: Record<string, HealthCheck> = {};
    for (const [component, healthCheck] of this.healthChecks) {
      healthChecks[component] = healthCheck;
    }

    return {
      metrics,
      healthChecks,
      alerts: this.alerts,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate monitoring dashboard data
   */
  public getDashboardData(): {
    systemHealth: any;
    topMetrics: Array<{ name: string; value: number; trend: string }>;
    recentAlerts: Alert[];
    systemMetrics: SystemMetrics;
  } {
    const systemHealth = this.getSystemHealth();
    const activeAlerts = this.getActiveAlerts().slice(0, 10); // Last 10 alerts

    // Get top metrics
    const topMetrics: Array<{ name: string; value: number; trend: string }> = [];
    const importantMetrics = [
      'agent_coordination_duration',
      'trust_receipt_generation_time',
      'message_processing_rate',
      'api_response_time',
      'error_rate'
    ];

    for (const metricName of importantMetrics) {
      const trend = this.getMetricTrends(metricName);
      topMetrics.push({
        name: metricName,
        value: trend.current,
        trend: trend.trend
      });
    }

    return {
      systemHealth,
      topMetrics,
      recentAlerts: activeAlerts,
      systemMetrics: this.getCurrentSystemMetrics()
    };
  }

  private setupDefaultThresholds(): void {
    // Performance thresholds
    this.alertThresholds.set('api_response_time', { warning: 1000, critical: 5000 });
    this.alertThresholds.set('agent_coordination_duration', { warning: 2000, critical: 10000 });
    this.alertThresholds.set('trust_receipt_generation_time', { warning: 100, critical: 500 });
    this.alertThresholds.set('message_processing_rate', { warning: 100, critical: 50 }); // per second
    this.alertThresholds.set('error_rate', { warning: 0.05, critical: 0.10 }); // percentage

    // System thresholds
    this.alertThresholds.set('cpu_usage', { warning: 70, critical: 90 });
    this.alertThresholds.set('memory_usage', { warning: 80, critical: 95 });
    this.alertThresholds.set('disk_usage', { warning: 80, critical: 95 });
  }

  private collectSystemMetrics(): void {
    const systemMetrics = this.getCurrentSystemMetrics();

    this.recordMetric({
      name: 'system_cpu_usage',
      value: systemMetrics.cpu,
      type: 'gauge',
      labels: { component: 'system' }
    });

    this.recordMetric({
      name: 'system_memory_usage',
      value: systemMetrics.memory,
      type: 'gauge',
      labels: { component: 'system' }
    });

    this.recordMetric({
      name: 'system_disk_usage',
      value: systemMetrics.disk,
      type: 'gauge',
      labels: { component: 'system' }
    });

    this.recordMetric({
      name: 'system_uptime',
      value: systemMetrics.uptime,
      type: 'counter',
      labels: { component: 'system' }
    });
  }

  private getCurrentSystemMetrics(): SystemMetrics {
    // Mock system metrics - in production, would use actual system monitoring
    const usage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      cpu: Math.random() * 100, // Mock CPU usage
      memory: (usage.heapUsed / usage.heapTotal) * 100,
      disk: Math.random() * 100, // Mock disk usage
      network: {
        inbound: Math.random() * 1000,
        outbound: Math.random() * 1000
      },
      processes: Math.floor(Math.random() * 50) + 10,
      uptime: process.uptime()
    };
  }

  private checkHealthChecks(): void {
    // Mock health checks - in production, would check actual components
    const components = ['api_gateway', 'agent_orchestrator', 'message_broker', 'trust_manager'];

    for (const component of components) {
      const isHealthy = Math.random() > 0.05; // 95% uptime simulation
      
      this.recordHealthCheck({
        component,
        status: isHealthy ? 'healthy' : Math.random() > 0.5 ? 'degraded' : 'unhealthy',
        timestamp: new Date(),
        responseTime: Math.random() * 1000,
        details: {
          last_check: new Date().toISOString(),
          uptime_percentage: isHealthy ? 99.5 : 85.2
        }
      });
    }
  }

  private checkMetricThresholds(metric: Metric): void {
    const thresholds = this.alertThresholds.get(metric.name);
    if (!thresholds) return;

    if (metric.type === 'gauge' || metric.type === 'counter') {
      if (thresholds.critical && metric.value >= thresholds.critical) {
        this.createAlert({
          severity: 'critical',
          type: 'metric_threshold_exceeded',
          message: `Critical threshold exceeded for ${metric.name}: ${metric.value}`,
          component: metric.labels?.component || 'unknown'
        });
      } else if (thresholds.warning && metric.value >= thresholds.warning) {
        this.createAlert({
          severity: 'medium',
          type: 'metric_threshold_exceeded',
          message: `Warning threshold exceeded for ${metric.name}: ${metric.value}`,
          component: metric.labels?.component || 'unknown'
        });
      }
    } else if (metric.type === 'timer') {
      if (thresholds.critical && metric.value >= thresholds.critical) {
        this.createAlert({
          severity: 'critical',
          type: 'performance_degradation',
          message: `Critical performance degradation in ${metric.name}: ${metric.value}ms`,
          component: metric.labels?.component || 'unknown'
        });
      } else if (thresholds.warning && metric.value >= thresholds.warning) {
        this.createAlert({
          severity: 'medium',
          type: 'performance_degradation',
          message: `Performance degradation in ${metric.name}: ${metric.value}ms`,
          component: metric.labels?.component || 'unknown'
        });
      }
    }
  }

  private evaluateAlerts(): void {
    // Auto-resolve old alerts
    const now = new Date();
    const autoResolveTime = 5 * 60 * 1000; // 5 minutes

    for (const alert of this.alerts) {
      if (!alert.resolved && (now.getTime() - alert.timestamp.getTime()) > autoResolveTime) {
        // Auto-resolve non-critical alerts
        if (alert.severity !== 'critical') {
          this.resolveAlert(alert.id);
        }
      }
    }
  }

  private cleanupOldData(): void {
    // Keep only last 24 hours of data
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const [name, metricList] of this.metrics) {
      const filtered = metricList.filter(metric => metric.timestamp > cutoffTime);
      this.metrics.set(name, filtered);
    }

    // Clean up old resolved alerts
    this.alerts = this.alerts.filter(alert => 
      !alert.resolved || (alert.resolvedAt && alert.resolvedAt > cutoffTime)
    );
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
}

export default ObservabilitySystem;