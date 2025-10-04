/**
 * Logger - SYMBI Symphony
 * 
 * Comprehensive logging system for the SYMBI AI Agent ecosystem.
 * Supports structured logging, multiple outputs, and context management.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type LogCategory = 'system' | 'agent' | 'task' | 'auth' | 'api' | 'security' | 'performance' | 'audit';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  context?: LogContext;
  error?: Error;
  traceId?: string;
  spanId?: string;
  userId?: string;
  agentId?: string;
  taskId?: string;
  requestId?: string;
}

export interface LogContext {
  component?: string;
  operation?: string;
  correlationId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface LoggerConfig {
  level: LogLevel;
  outputs: LogOutput[];
  format: 'json' | 'text' | 'structured';
  enableColors: boolean;
  enableTimestamp: boolean;
  enableStackTrace: boolean;
  bufferSize: number;
  flushInterval: number; // milliseconds
  maxFileSize: number; // bytes
  maxFiles: number;
  context?: LogContext;
}

export interface LogOutput {
  type: 'console' | 'file' | 'elasticsearch' | 'cloudwatch' | 'datadog' | 'webhook';
  config: Record<string, any>;
  enabled: boolean;
  level?: LogLevel;
  categories?: LogCategory[];
}

export class Logger extends EventEmitter {
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private context: LogContext = {};

  private static readonly LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4
  };

  private static readonly COLORS: Record<LogLevel, string> = {
    debug: '\x1b[36m', // Cyan
    info: '\x1b[32m',  // Green
    warn: '\x1b[33m',  // Yellow
    error: '\x1b[31m', // Red
    fatal: '\x1b[35m'  // Magenta
  };

  private static readonly RESET_COLOR = '\x1b[0m';

  constructor(config?: Partial<LoggerConfig>) {
    super();
    
    this.config = {
      level: 'info',
      outputs: [{ type: 'console', config: {}, enabled: true }],
      format: 'structured',
      enableColors: true,
      enableTimestamp: true,
      enableStackTrace: true,
      bufferSize: 100,
      flushInterval: 5000, // 5 seconds
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      ...config
    };

    if (this.config.context) {
      this.context = { ...this.config.context };
    }

    this.startFlushTimer();
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: any, context?: LogContext): void {
    this.log('debug', 'system', message, data, context);
  }

  /**
   * Log info message
   */
  info(message: string, data?: any, context?: LogContext): void {
    this.log('info', 'system', message, data, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any, context?: LogContext): void {
    this.log('warn', 'system', message, data, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | any, context?: LogContext): void {
    const errorObj = error instanceof Error ? error : undefined;
    const data = error instanceof Error ? undefined : error;
    this.log('error', 'system', message, data, context, errorObj);
  }

  /**
   * Log fatal message
   */
  fatal(message: string, error?: Error | any, context?: LogContext): void {
    const errorObj = error instanceof Error ? error : undefined;
    const data = error instanceof Error ? undefined : error;
    this.log('fatal', 'system', message, data, context, errorObj);
  }

  /**
   * Log agent-related message
   */
  agent(level: LogLevel, message: string, agentId: string, data?: any, context?: LogContext): void {
    const agentContext = { ...context, agentId };
    this.log(level, 'agent', message, data, agentContext);
  }

  /**
   * Log task-related message
   */
  task(level: LogLevel, message: string, taskId: string, data?: any, context?: LogContext): void {
    const taskContext = { ...context, taskId };
    this.log(level, 'task', message, data, taskContext);
  }

  /**
   * Log authentication-related message
   */
  auth(level: LogLevel, message: string, userId?: string, data?: any, context?: LogContext): void {
    const authContext = { ...context, userId };
    this.log(level, 'auth', message, data, authContext);
  }

  /**
   * Log API-related message
   */
  api(level: LogLevel, message: string, requestId?: string, data?: any, context?: LogContext): void {
    const apiContext = { ...context, requestId };
    this.log(level, 'api', message, data, apiContext);
  }

  /**
   * Log security-related message
   */
  security(level: LogLevel, message: string, data?: any, context?: LogContext): void {
    this.log(level, 'security', message, data, context);
  }

  /**
   * Log performance-related message
   */
  performance(level: LogLevel, message: string, data?: any, context?: LogContext): void {
    this.log(level, 'performance', message, data, context);
  }

  /**
   * Log audit message
   */
  audit(message: string, data?: any, context?: LogContext): void {
    this.log('info', 'audit', message, data, context);
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: any,
    context?: LogContext,
    error?: Error
  ): void {
    // Check if log level is enabled
    if (Logger.LOG_LEVELS[level] < Logger.LOG_LEVELS[this.config.level]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      data,
      context: { ...this.context, ...context },
      error,
      traceId: context?.correlationId || this.context.correlationId,
      spanId: context?.sessionId || this.context.sessionId,
      userId: (context as any)?.userId,
      agentId: (context as any)?.agentId,
      taskId: (context as any)?.taskId,
      requestId: (context as any)?.requestId
    };

    this.buffer.push(entry);

    // Emit log event
    this.emit('log', entry);

    // Flush if buffer is full
    if (this.buffer.length >= this.config.bufferSize) {
      this.flush();
    }

    // Immediate flush for fatal errors
    if (level === 'fatal') {
      this.flush();
    }
  }

  /**
   * Set logging context
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear logging context
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * Get current context
   */
  getContext(): LogContext {
    return { ...this.context };
  }

  /**
   * Create child logger with additional context
   */
  child(context: LogContext): Logger {
    const childConfig = {
      ...this.config,
      context: { ...this.context, ...context }
    };
    
    return new Logger(childConfig);
  }

  /**
   * Flush buffered log entries
   */
  flush(): void {
    if (this.buffer.length === 0) {
      return;
    }

    const entries = [...this.buffer];
    this.buffer = [];

    for (const output of this.config.outputs) {
      if (!output.enabled) {
        continue;
      }

      // Filter by level and category
      const filteredEntries = entries.filter(entry => {
        const levelMatch = !output.level || 
          Logger.LOG_LEVELS[entry.level] >= Logger.LOG_LEVELS[output.level];
        const categoryMatch = !output.categories || 
          output.categories.includes(entry.category);
        
        return levelMatch && categoryMatch;
      });

      if (filteredEntries.length === 0) {
        continue;
      }

      try {
        this.writeToOutput(output, filteredEntries);
      } catch (error) {
        this.emit('error', error);
      }
    }
  }

  /**
   * Write entries to specific output
   */
  private writeToOutput(output: LogOutput, entries: LogEntry[]): void {
    switch (output.type) {
      case 'console':
        this.writeToConsole(entries);
        break;
      case 'file':
        this.writeToFile(output.config, entries);
        break;
      case 'elasticsearch':
        this.writeToElasticsearch(output.config, entries);
        break;
      case 'cloudwatch':
        this.writeToCloudWatch(output.config, entries);
        break;
      case 'datadog':
        this.writeToDatadog(output.config, entries);
        break;
      case 'webhook':
        this.writeToWebhook(output.config, entries);
        break;
      default:
        throw new Error(`Unsupported output type: ${output.type}`);
    }
  }

  /**
   * Write to console
   */
  private writeToConsole(entries: LogEntry[]): void {
    for (const entry of entries) {
      const formatted = this.formatEntry(entry, 'console');
      console.log(formatted);
    }
  }

  /**
   * Write to file
   */
  private writeToFile(config: any, entries: LogEntry[]): void {
    const filePath = config.path || './logs/app.log';
    const dir = path.dirname(filePath);

    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const content = entries
      .map(entry => this.formatEntry(entry, 'file'))
      .join('\n') + '\n';

    fs.appendFileSync(filePath, content);

    // Check file size and rotate if necessary
    this.rotateFileIfNeeded(filePath);
  }

  /**
   * Write to Elasticsearch
   */
  private async writeToElasticsearch(config: any, entries: LogEntry[]): Promise<void> {
    // Implementation would depend on Elasticsearch client
    // This is a placeholder for the actual implementation
    console.log(`Would write ${entries.length} entries to Elasticsearch`);
  }

  /**
   * Write to CloudWatch
   */
  private async writeToCloudWatch(config: any, entries: LogEntry[]): Promise<void> {
    // Implementation would depend on AWS SDK
    // This is a placeholder for the actual implementation
    console.log(`Would write ${entries.length} entries to CloudWatch`);
  }

  /**
   * Write to Datadog
   */
  private async writeToDatadog(config: any, entries: LogEntry[]): Promise<void> {
    // Implementation would depend on Datadog client
    // This is a placeholder for the actual implementation
    console.log(`Would write ${entries.length} entries to Datadog`);
  }

  /**
   * Write to webhook
   */
  private async writeToWebhook(config: any, entries: LogEntry[]): Promise<void> {
    // Implementation would use HTTP client to send to webhook
    // This is a placeholder for the actual implementation
    console.log(`Would write ${entries.length} entries to webhook ${config.url}`);
  }

  /**
   * Format log entry
   */
  private formatEntry(entry: LogEntry, outputType: string): string {
    switch (this.config.format) {
      case 'json':
        return JSON.stringify(entry);
      case 'text':
        return this.formatAsText(entry, outputType === 'console');
      case 'structured':
        return this.formatAsStructured(entry, outputType === 'console');
      default:
        return JSON.stringify(entry);
    }
  }

  /**
   * Format as plain text
   */
  private formatAsText(entry: LogEntry, useColors: boolean): string {
    const timestamp = this.config.enableTimestamp ? 
      entry.timestamp.toISOString() : '';
    
    const level = entry.level.toUpperCase();
    const coloredLevel = useColors && this.config.enableColors ? 
      `${Logger.COLORS[entry.level]}${level}${Logger.RESET_COLOR}` : level;
    
    const parts = [timestamp, coloredLevel, `[${entry.category}]`, entry.message];
    
    if (entry.context?.component) {
      parts.push(`(${entry.context.component})`);
    }
    
    return parts.filter(Boolean).join(' ');
  }

  /**
   * Format as structured text
   */
  private formatAsStructured(entry: LogEntry, useColors: boolean): string {
    const timestamp = this.config.enableTimestamp ? 
      entry.timestamp.toISOString() : '';
    
    const level = entry.level.toUpperCase();
    const coloredLevel = useColors && this.config.enableColors ? 
      `${Logger.COLORS[entry.level]}${level}${Logger.RESET_COLOR}` : level;
    
    let formatted = `${timestamp} ${coloredLevel} [${entry.category}] ${entry.message}`;
    
    // Add context information
    if (entry.agentId) formatted += ` agentId=${entry.agentId}`;
    if (entry.taskId) formatted += ` taskId=${entry.taskId}`;
    if (entry.userId) formatted += ` userId=${entry.userId}`;
    if (entry.requestId) formatted += ` requestId=${entry.requestId}`;
    if (entry.traceId) formatted += ` traceId=${entry.traceId}`;
    
    // Add data if present
    if (entry.data) {
      formatted += ` data=${JSON.stringify(entry.data)}`;
    }
    
    // Add error if present
    if (entry.error) {
      formatted += ` error=${entry.error.message}`;
      if (this.config.enableStackTrace && entry.error.stack) {
        formatted += `\n${entry.error.stack}`;
      }
    }
    
    return formatted;
  }

  /**
   * Rotate file if it exceeds max size
   */
  private rotateFileIfNeeded(filePath: string): void {
    try {
      const stats = fs.statSync(filePath);
      
      if (stats.size >= this.config.maxFileSize) {
        const ext = path.extname(filePath);
        const base = path.basename(filePath, ext);
        const dir = path.dirname(filePath);
        
        // Rotate existing files
        for (let i = this.config.maxFiles - 1; i > 0; i--) {
          const oldFile = path.join(dir, `${base}.${i}${ext}`);
          const newFile = path.join(dir, `${base}.${i + 1}${ext}`);
          
          if (fs.existsSync(oldFile)) {
            if (i === this.config.maxFiles - 1) {
              fs.unlinkSync(oldFile); // Delete oldest file
            } else {
              fs.renameSync(oldFile, newFile);
            }
          }
        }
        
        // Move current file to .1
        const rotatedFile = path.join(dir, `${base}.1${ext}`);
        fs.renameSync(filePath, rotatedFile);
      }
    } catch (error) {
      this.emit('error', error);
    }
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Stop flush timer
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Add output
   */
  addOutput(output: LogOutput): void {
    this.config.outputs.push(output);
  }

  /**
   * Remove output
   */
  removeOutput(type: string): void {
    this.config.outputs = this.config.outputs.filter(o => o.type !== type);
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Restart flush timer if interval changed
    if (updates.flushInterval) {
      this.startFlushTimer();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /**
   * Destroy the logger
   */
  destroy(): void {
    this.flush();
    this.stopFlushTimer();
    this.removeAllListeners();
  }
}