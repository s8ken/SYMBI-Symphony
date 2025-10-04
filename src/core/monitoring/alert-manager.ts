/**
 * Alert Manager - SYMBI Symphony
 * 
 * Comprehensive alerting system for the SYMBI AI Agent ecosystem.
 * Manages alert rules, evaluates conditions, and sends notifications.
 */

import { EventEmitter } from 'events';
import { MetricsCollector } from './metrics-collector';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'pending' | 'firing' | 'resolved' | 'silenced';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  severity: AlertSeverity;
  enabled: boolean;
  conditions: AlertCondition[];
  evaluationInterval: number; // seconds
  forDuration: number; // seconds - how long condition must be true
  labels: Record<string, string>;
  annotations: Record<string, string>;
  notificationChannels: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne';
  threshold: number;
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
  timeWindow?: number; // seconds
  labels?: Record<string, string>;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  description?: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  value: number;
  threshold: number;
  startsAt: Date;
  endsAt?: Date;
  updatedAt: Date;
  silencedUntil?: Date;
  notificationsSent: number;
  lastNotificationAt?: Date;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'pagerduty' | 'sms' | 'discord';
  config: Record<string, any>;
  enabled: boolean;
  severityFilter?: AlertSeverity[];
  labelFilter?: Record<string, string>;
  rateLimitMinutes?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertManagerConfig {
  evaluationInterval: number; // seconds
  retentionPeriod: number; // seconds
  maxAlerts: number;
  enableNotifications: boolean;
  defaultNotificationChannels: string[];
  groupingInterval: number; // seconds
  repeatInterval: number; // seconds
}

export class AlertManager extends EventEmitter {
  private rules: Map<string, AlertRule> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private channels: Map<string, NotificationChannel> = new Map();
  private config: AlertManagerConfig;
  private metricsCollector: MetricsCollector;
  private evaluationTimer: NodeJS.Timeout | null = null;
  private alertHistory: Alert[] = [];

  constructor(
    metricsCollector: MetricsCollector,
    config?: Partial<AlertManagerConfig>
  ) {
    super();
    
    this.metricsCollector = metricsCollector;
    this.config = {
      evaluationInterval: 30, // 30 seconds
      retentionPeriod: 7 * 24 * 60 * 60, // 7 days
      maxAlerts: 1000,
      enableNotifications: true,
      defaultNotificationChannels: [],
      groupingInterval: 300, // 5 minutes
      repeatInterval: 3600, // 1 hour
      ...config
    };

    this.initializeDefaultRules();
    this.startEvaluation();
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'High CPU Usage',
        description: 'System CPU usage is above 80%',
        severity: 'high',
        enabled: true,
        conditions: [{
          metric: 'system_cpu_usage',
          operator: 'gt',
          threshold: 80,
          aggregation: 'avg',
          timeWindow: 300 // 5 minutes
        }],
        evaluationInterval: 60,
        forDuration: 300,
        labels: { component: 'system' },
        annotations: { 
          summary: 'High CPU usage detected',
          description: 'System CPU usage has been above 80% for 5 minutes'
        },
        notificationChannels: []
      },
      {
        name: 'High Memory Usage',
        description: 'System memory usage is above 90%',
        severity: 'critical',
        enabled: true,
        conditions: [{
          metric: 'system_memory_usage',
          operator: 'gt',
          threshold: 0.9 * 8 * 1024 * 1024 * 1024, // 90% of 8GB
          aggregation: 'avg',
          timeWindow: 180 // 3 minutes
        }],
        evaluationInterval: 30,
        forDuration: 180,
        labels: { component: 'system' },
        annotations: { 
          summary: 'Critical memory usage',
          description: 'System memory usage has exceeded 90%'
        },
        notificationChannels: []
      },
      {
        name: 'Agent Task Failure Rate',
        description: 'Agent task failure rate is above 10%',
        severity: 'medium',
        enabled: true,
        conditions: [{
          metric: 'agent_task_count',
          operator: 'gt',
          threshold: 0.1, // 10% failure rate
          aggregation: 'avg',
          timeWindow: 600, // 10 minutes
          labels: { status: 'failed' }
        }],
        evaluationInterval: 120,
        forDuration: 600,
        labels: { component: 'agent' },
        annotations: { 
          summary: 'High agent task failure rate',
          description: 'Agent task failure rate has exceeded 10% over the last 10 minutes'
        },
        notificationChannels: []
      },
      {
        name: 'HTTP Error Rate',
        description: 'HTTP 5xx error rate is above 5%',
        severity: 'high',
        enabled: true,
        conditions: [{
          metric: 'http_requests_total',
          operator: 'gt',
          threshold: 0.05, // 5% error rate
          aggregation: 'avg',
          timeWindow: 300,
          labels: { status_code: '5xx' }
        }],
        evaluationInterval: 60,
        forDuration: 300,
        labels: { component: 'api' },
        annotations: { 
          summary: 'High HTTP error rate',
          description: 'HTTP 5xx error rate has exceeded 5%'
        },
        notificationChannels: []
      }
    ];

    defaultRules.forEach(rule => {
      this.addRule(rule);
    });
  }

  /**
   * Add alert rule
   */
  addRule(rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = this.generateId();
    const now = new Date();
    
    const alertRule: AlertRule = {
      ...rule,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.rules.set(id, alertRule);
    this.emit('rule_added', alertRule);
    
    return id;
  }

  /**
   * Update alert rule
   */
  updateRule(id: string, updates: Partial<AlertRule>): boolean {
    const rule = this.rules.get(id);
    if (!rule) {
      return false;
    }

    const updatedRule = {
      ...rule,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date()
    };

    this.rules.set(id, updatedRule);
    this.emit('rule_updated', updatedRule);
    
    return true;
  }

  /**
   * Remove alert rule
   */
  removeRule(id: string): boolean {
    const rule = this.rules.get(id);
    if (!rule) {
      return false;
    }

    this.rules.delete(id);
    
    // Remove associated alerts
    const alertsToRemove = Array.from(this.alerts.values())
      .filter(alert => alert.ruleId === id);
    
    alertsToRemove.forEach(alert => {
      this.alerts.delete(alert.id);
    });

    this.emit('rule_removed', rule);
    
    return true;
  }

  /**
   * Get alert rule
   */
  getRule(id: string): AlertRule | undefined {
    return this.rules.get(id);
  }

  /**
   * Get all alert rules
   */
  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Add notification channel
   */
  addChannel(channel: Omit<NotificationChannel, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = this.generateId();
    const now = new Date();
    
    const notificationChannel: NotificationChannel = {
      ...channel,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.channels.set(id, notificationChannel);
    this.emit('channel_added', notificationChannel);
    
    return id;
  }

  /**
   * Update notification channel
   */
  updateChannel(id: string, updates: Partial<NotificationChannel>): boolean {
    const channel = this.channels.get(id);
    if (!channel) {
      return false;
    }

    const updatedChannel = {
      ...channel,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date()
    };

    this.channels.set(id, updatedChannel);
    this.emit('channel_updated', updatedChannel);
    
    return true;
  }

  /**
   * Remove notification channel
   */
  removeChannel(id: string): boolean {
    const channel = this.channels.get(id);
    if (!channel) {
      return false;
    }

    this.channels.delete(id);
    this.emit('channel_removed', channel);
    
    return true;
  }

  /**
   * Get notification channel
   */
  getChannel(id: string): NotificationChannel | undefined {
    return this.channels.get(id);
  }

  /**
   * Get all notification channels
   */
  getChannels(): NotificationChannel[] {
    return Array.from(this.channels.values());
  }

  /**
   * Start alert evaluation
   */
  private startEvaluation(): void {
    if (this.evaluationTimer) {
      clearInterval(this.evaluationTimer);
    }

    this.evaluationTimer = setInterval(() => {
      this.evaluateRules();
      this.cleanup();
    }, this.config.evaluationInterval * 1000);
  }

  /**
   * Stop alert evaluation
   */
  stopEvaluation(): void {
    if (this.evaluationTimer) {
      clearInterval(this.evaluationTimer);
      this.evaluationTimer = null;
    }
  }

  /**
   * Evaluate all alert rules
   */
  private async evaluateRules(): Promise<void> {
    for (const rule of this.rules.values()) {
      if (!rule.enabled) {
        continue;
      }

      try {
        await this.evaluateRule(rule);
      } catch (error) {
        this.emit('evaluation_error', { rule, error });
      }
    }
  }

  /**
   * Evaluate single alert rule
   */
  private async evaluateRule(rule: AlertRule): Promise<void> {
    const conditionResults = await Promise.all(
      rule.conditions.map(condition => this.evaluateCondition(condition))
    );

    const allConditionsMet = conditionResults.every(result => result.met);
    const maxValue = Math.max(...conditionResults.map(r => r.value));

    const existingAlert = Array.from(this.alerts.values())
      .find(alert => alert.ruleId === rule.id && alert.status !== 'resolved');

    if (allConditionsMet) {
      if (existingAlert) {
        // Update existing alert
        this.updateAlert(existingAlert, maxValue);
      } else {
        // Create new alert
        this.createAlert(rule, maxValue, conditionResults[0].threshold);
      }
    } else if (existingAlert) {
      // Resolve existing alert
      this.resolveAlert(existingAlert);
    }
  }

  /**
   * Evaluate alert condition
   */
  private async evaluateCondition(condition: AlertCondition): Promise<{
    met: boolean;
    value: number;
    threshold: number;
  }> {
    const timeWindow = condition.timeWindow || 300; // Default 5 minutes
    const since = Date.now() - (timeWindow * 1000);
    
    const metricValues = this.metricsCollector.getMetric(condition.metric, since);
    
    if (metricValues.length === 0) {
      return { met: false, value: 0, threshold: condition.threshold };
    }

    // Filter by labels if specified
    const filteredValues = condition.labels ? 
      metricValues.filter(mv => {
        if (!mv.labels) return false;
        return Object.entries(condition.labels!).every(([key, value]) => 
          mv.labels![key] === value
        );
      }) : metricValues;

    if (filteredValues.length === 0) {
      return { met: false, value: 0, threshold: condition.threshold };
    }

    // Apply aggregation
    let value: number;
    const values = filteredValues.map(mv => mv.value);
    
    switch (condition.aggregation || 'avg') {
      case 'avg':
        value = values.reduce((sum, val) => sum + val, 0) / values.length;
        break;
      case 'sum':
        value = values.reduce((sum, val) => sum + val, 0);
        break;
      case 'min':
        value = Math.min(...values);
        break;
      case 'max':
        value = Math.max(...values);
        break;
      case 'count':
        value = values.length;
        break;
      default:
        value = values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    // Evaluate condition
    let met = false;
    switch (condition.operator) {
      case 'gt':
        met = value > condition.threshold;
        break;
      case 'gte':
        met = value >= condition.threshold;
        break;
      case 'lt':
        met = value < condition.threshold;
        break;
      case 'lte':
        met = value <= condition.threshold;
        break;
      case 'eq':
        met = value === condition.threshold;
        break;
      case 'ne':
        met = value !== condition.threshold;
        break;
    }

    return { met, value, threshold: condition.threshold };
  }

  /**
   * Create new alert
   */
  private createAlert(rule: AlertRule, value: number, threshold: number): void {
    const id = this.generateId();
    const now = new Date();
    
    const alert: Alert = {
      id,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      status: 'pending',
      message: rule.annotations.summary || rule.name,
      description: rule.annotations.description || rule.description,
      labels: { ...rule.labels },
      annotations: { ...rule.annotations },
      value,
      threshold,
      startsAt: now,
      updatedAt: now,
      notificationsSent: 0
    };

    this.alerts.set(id, alert);
    this.alertHistory.push({ ...alert });
    
    this.emit('alert_created', alert);

    // Check if alert should fire immediately or wait for forDuration
    if (rule.forDuration === 0) {
      this.fireAlert(alert);
    }
  }

  /**
   * Update existing alert
   */
  private updateAlert(alert: Alert, value: number): void {
    const rule = this.rules.get(alert.ruleId);
    if (!rule) {
      return;
    }

    const now = new Date();
    const timeSinceStart = now.getTime() - alert.startsAt.getTime();
    
    alert.value = value;
    alert.updatedAt = now;

    // Fire alert if forDuration has passed and not already firing
    if (alert.status === 'pending' && timeSinceStart >= (rule.forDuration * 1000)) {
      this.fireAlert(alert);
    }

    this.alerts.set(alert.id, alert);
    this.emit('alert_updated', alert);
  }

  /**
   * Fire alert (change status to firing and send notifications)
   */
  private fireAlert(alert: Alert): void {
    alert.status = 'firing';
    alert.updatedAt = new Date();
    
    this.alerts.set(alert.id, alert);
    this.emit('alert_firing', alert);

    if (this.config.enableNotifications) {
      this.sendNotifications(alert);
    }
  }

  /**
   * Resolve alert
   */
  private resolveAlert(alert: Alert): void {
    alert.status = 'resolved';
    alert.endsAt = new Date();
    alert.updatedAt = new Date();
    
    this.alerts.set(alert.id, alert);
    this.emit('alert_resolved', alert);

    if (this.config.enableNotifications) {
      this.sendNotifications(alert);
    }
  }

  /**
   * Silence alert
   */
  silenceAlert(alertId: string, duration: number): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.status = 'silenced';
    alert.silencedUntil = new Date(Date.now() + duration * 1000);
    alert.updatedAt = new Date();
    
    this.alerts.set(alertId, alert);
    this.emit('alert_silenced', alert);
    
    return true;
  }

  /**
   * Send notifications for alert
   */
  private async sendNotifications(alert: Alert): Promise<void> {
    const rule = this.rules.get(alert.ruleId);
    if (!rule) {
      return;
    }

    const channelIds = rule.notificationChannels.length > 0 ? 
      rule.notificationChannels : this.config.defaultNotificationChannels;

    for (const channelId of channelIds) {
      const channel = this.channels.get(channelId);
      if (!channel || !channel.enabled) {
        continue;
      }

      // Check severity filter
      if (channel.severityFilter && !channel.severityFilter.includes(alert.severity)) {
        continue;
      }

      // Check label filter
      if (channel.labelFilter) {
        const labelMatch = Object.entries(channel.labelFilter).every(([key, value]) => 
          alert.labels[key] === value
        );
        if (!labelMatch) {
          continue;
        }
      }

      // Check rate limit
      if (channel.rateLimitMinutes && alert.lastNotificationAt) {
        const timeSinceLastNotification = Date.now() - alert.lastNotificationAt.getTime();
        if (timeSinceLastNotification < (channel.rateLimitMinutes * 60 * 1000)) {
          continue;
        }
      }

      try {
        await this.sendNotification(channel, alert);
        
        alert.notificationsSent++;
        alert.lastNotificationAt = new Date();
        
        this.emit('notification_sent', { channel, alert });
      } catch (error) {
        this.emit('notification_error', { channel, alert, error });
      }
    }
  }

  /**
   * Send notification to specific channel
   */
  private async sendNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    const message = this.formatNotificationMessage(alert);
    
    switch (channel.type) {
      case 'email':
        await this.sendEmailNotification(channel.config, alert, message);
        break;
      case 'slack':
        await this.sendSlackNotification(channel.config, alert, message);
        break;
      case 'webhook':
        await this.sendWebhookNotification(channel.config, alert, message);
        break;
      case 'pagerduty':
        await this.sendPagerDutyNotification(channel.config, alert, message);
        break;
      case 'sms':
        await this.sendSMSNotification(channel.config, alert, message);
        break;
      case 'discord':
        await this.sendDiscordNotification(channel.config, alert, message);
        break;
      default:
        throw new Error(`Unsupported notification channel type: ${channel.type}`);
    }
  }

  /**
   * Format notification message
   */
  private formatNotificationMessage(alert: Alert): string {
    const status = alert.status.toUpperCase();
    const severity = alert.severity.toUpperCase();
    
    let message = `[${status}] ${severity}: ${alert.message}\n`;
    
    if (alert.description) {
      message += `Description: ${alert.description}\n`;
    }
    
    message += `Value: ${alert.value.toFixed(2)} (threshold: ${alert.threshold})\n`;
    message += `Started: ${alert.startsAt.toISOString()}\n`;
    
    if (alert.endsAt) {
      message += `Ended: ${alert.endsAt.toISOString()}\n`;
    }
    
    if (Object.keys(alert.labels).length > 0) {
      message += `Labels: ${JSON.stringify(alert.labels)}\n`;
    }
    
    return message;
  }

  /**
   * Send email notification (placeholder)
   */
  private async sendEmailNotification(config: any, alert: Alert, message: string): Promise<void> {
    console.log(`Would send email notification: ${message}`);
  }

  /**
   * Send Slack notification (placeholder)
   */
  private async sendSlackNotification(config: any, alert: Alert, message: string): Promise<void> {
    console.log(`Would send Slack notification: ${message}`);
  }

  /**
   * Send webhook notification (placeholder)
   */
  private async sendWebhookNotification(config: any, alert: Alert, message: string): Promise<void> {
    console.log(`Would send webhook notification to ${config.url}: ${message}`);
  }

  /**
   * Send PagerDuty notification (placeholder)
   */
  private async sendPagerDutyNotification(config: any, alert: Alert, message: string): Promise<void> {
    console.log(`Would send PagerDuty notification: ${message}`);
  }

  /**
   * Send SMS notification (placeholder)
   */
  private async sendSMSNotification(config: any, alert: Alert, message: string): Promise<void> {
    console.log(`Would send SMS notification: ${message}`);
  }

  /**
   * Send Discord notification (placeholder)
   */
  private async sendDiscordNotification(config: any, alert: Alert, message: string): Promise<void> {
    console.log(`Would send Discord notification: ${message}`);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.status === 'firing' || alert.status === 'pending');
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Get alert by ID
   */
  getAlert(id: string): Alert | undefined {
    return this.alerts.get(id);
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit?: number): Alert[] {
    const history = [...this.alertHistory].reverse();
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * Clean up old alerts and history
   */
  private cleanup(): void {
    const cutoff = Date.now() - (this.config.retentionPeriod * 1000);
    
    // Remove old resolved alerts
    for (const [id, alert] of this.alerts.entries()) {
      if (alert.status === 'resolved' && alert.endsAt && alert.endsAt.getTime() < cutoff) {
        this.alerts.delete(id);
      }
    }
    
    // Limit alert history
    if (this.alertHistory.length > this.config.maxAlerts) {
      this.alertHistory = this.alertHistory.slice(-this.config.maxAlerts);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get configuration
   */
  getConfig(): AlertManagerConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<AlertManagerConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Restart evaluation if interval changed
    if (updates.evaluationInterval) {
      this.startEvaluation();
    }
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalRules: number;
    enabledRules: number;
    totalChannels: number;
    enabledChannels: number;
    activeAlerts: number;
    totalAlerts: number;
    alertsByStatus: Record<AlertStatus, number>;
    alertsBySeverity: Record<AlertSeverity, number>;
  } {
    const activeAlerts = this.getActiveAlerts();
    const allAlerts = this.getAllAlerts();
    
    const alertsByStatus: Record<AlertStatus, number> = {
      pending: 0,
      firing: 0,
      resolved: 0,
      silenced: 0
    };
    
    const alertsBySeverity: Record<AlertSeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };
    
    allAlerts.forEach(alert => {
      alertsByStatus[alert.status]++;
      alertsBySeverity[alert.severity]++;
    });
    
    return {
      totalRules: this.rules.size,
      enabledRules: Array.from(this.rules.values()).filter(r => r.enabled).length,
      totalChannels: this.channels.size,
      enabledChannels: Array.from(this.channels.values()).filter(c => c.enabled).length,
      activeAlerts: activeAlerts.length,
      totalAlerts: allAlerts.length,
      alertsByStatus,
      alertsBySeverity
    };
  }

  /**
   * Destroy the alert manager
   */
  destroy(): void {
    this.stopEvaluation();
    this.rules.clear();
    this.alerts.clear();
    this.channels.clear();
    this.alertHistory = [];
    this.removeAllListeners();
  }
}