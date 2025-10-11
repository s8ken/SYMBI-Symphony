/**
 * Audit Persistence Layer
 * 
 * Provides pluggable persistence backends for AuditLogger to support
 * durable storage of cryptographically signed audit entries.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { SignedAuditEntry, AuditQueryFilter, AuditQueryResult } from './types';

/**
 * Base interface for audit persistence backends
 */
export interface AuditPersistence {
  /**
   * Store a signed audit entry
   */
  store(entry: SignedAuditEntry): Promise<void>;

  /**
   * Store multiple entries in batch
   */
  storeBatch(entries: SignedAuditEntry[]): Promise<void>;

  /**
   * Query audit entries with filtering
   */
  query(filter?: AuditQueryFilter): Promise<AuditQueryResult>;

  /**
   * Get total count of entries
   */
  count(): Promise<number>;

  /**
   * Get entries by ID range (for pagination)
   */
  getRange(offset: number, limit: number): Promise<SignedAuditEntry[]>;

  /**
   * Verify integrity of stored entries
   */
  verifyIntegrity(): Promise<{
    valid: boolean;
    totalEntries: number;
    errors: Array<{ entryId: string; error: string }>;
  }>;

  /**
   * Export all entries
   */
  exportAll(): Promise<SignedAuditEntry[]>;

  /**
   * Import entries (with verification)
   */
  importAll(entries: SignedAuditEntry[]): Promise<void>;

  /**
   * Clear all entries (dangerous!)
   */
  clear(): Promise<void>;

  /**
   * Close/cleanup resources
   */
  close(): Promise<void>;
}

/**
 * In-memory persistence (original behavior)
 */
export class MemoryAuditPersistence implements AuditPersistence {
  private entries: SignedAuditEntry[] = [];

  async store(entry: SignedAuditEntry): Promise<void> {
    this.entries.push(entry);
  }

  async storeBatch(entries: SignedAuditEntry[]): Promise<void> {
    this.entries.push(...entries);
  }

  async query(filter?: AuditQueryFilter): Promise<AuditQueryResult> {
    let filtered = [...this.entries];

    // Apply filters
    if (filter?.startTime) {
      filtered = filtered.filter((e) => e.timestamp >= filter.startTime!);
    }
    if (filter?.endTime) {
      filtered = filtered.filter((e) => e.timestamp <= filter.endTime!);
    }
    if (filter?.eventTypes) {
      filtered = filtered.filter((e) => filter.eventTypes!.includes(e.eventType));
    }
    if (filter?.actorIds) {
      filtered = filtered.filter((e) => filter.actorIds!.includes(e.actor.id));
    }
    if (filter?.targetIds && filter.targetIds.length > 0) {
      filtered = filtered.filter((e) => e.target && filter.targetIds!.includes(e.target.id));
    }
    if (filter?.severity) {
      filtered = filtered.filter((e) => filter.severity!.includes(e.severity));
    }
    if (filter?.result) {
      filtered = filtered.filter((e) => filter.result!.includes(e.result));
    }

    // Pagination
    const total = filtered.length;
    const offset = filter?.offset || 0;
    const limit = filter?.limit || 100;
    const entries = filtered.slice(offset, offset + limit);
    const hasMore = offset + entries.length < total;

    return {
      entries,
      total,
      hasMore,
    };
  }

  async count(): Promise<number> {
    return this.entries.length;
  }

  async getRange(offset: number, limit: number): Promise<SignedAuditEntry[]> {
    return this.entries.slice(offset, offset + limit);
  }

  async verifyIntegrity(): Promise<{
    valid: boolean;
    totalEntries: number;
    errors: Array<{ entryId: string; error: string }>;
  }> {
    const errors: Array<{ entryId: string; error: string }> = [];
    
    // Check chain integrity
    for (let i = 1; i < this.entries.length; i++) {
      const current = this.entries[i];
      const previous = this.entries[i - 1];
      
      if (current.previousHash !== previous.signature) {
        errors.push({
          entryId: current.id,
          error: `Chain broken: previousHash ${current.previousHash} != previous signature ${previous.signature}`
        });
      }
    }

    return {
      valid: errors.length === 0,
      totalEntries: this.entries.length,
      errors
    };
  }

  async exportAll(): Promise<SignedAuditEntry[]> {
    return [...this.entries];
  }

  async importAll(entries: SignedAuditEntry[]): Promise<void> {
    this.entries = [...entries];
  }

  async clear(): Promise<void> {
    this.entries = [];
  }

  async close(): Promise<void> {
    // No cleanup needed for memory storage
  }
}

/**
 * File-based append-only persistence
 */
export class FileAuditPersistence implements AuditPersistence {
  private filePath: string;
  private indexPath: string;
  private cache: SignedAuditEntry[] = [];
  private cacheLoaded = false;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.indexPath = filePath + '.index';
  }

  private async ensureCache(): Promise<void> {
    if (this.cacheLoaded) return;

    try {
      // Load existing entries
      const data = await fs.readFile(this.filePath, 'utf8');
      const lines = data.trim().split('\n').filter(line => line.trim());
      
      this.cache = lines.map(line => {
        const entry = JSON.parse(line);
        // Convert timestamp strings back to Date objects
        entry.timestamp = new Date(entry.timestamp);
        entry.signedAt = new Date(entry.signedAt);
        return entry;
      });
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist yet, start with empty cache
      this.cache = [];
    }

    this.cacheLoaded = true;
  }

  async store(entry: SignedAuditEntry): Promise<void> {
    await this.ensureCache();
    
    // Append to file
    const line = JSON.stringify(entry) + '\n';
    await fs.appendFile(this.filePath, line, 'utf8');
    
    // Update cache
    this.cache.push(entry);
  }

  async storeBatch(entries: SignedAuditEntry[]): Promise<void> {
    await this.ensureCache();
    
    // Append all entries to file
    const lines = entries.map(entry => JSON.stringify(entry) + '\n').join('');
    await fs.appendFile(this.filePath, lines, 'utf8');
    
    // Update cache
    this.cache.push(...entries);
  }

  async query(filter?: AuditQueryFilter): Promise<AuditQueryResult> {
    await this.ensureCache();
    
    let filtered = [...this.cache];

    // Apply filters (same logic as memory implementation)
    if (filter?.startTime) {
      filtered = filtered.filter((e) => e.timestamp >= filter.startTime!);
    }
    if (filter?.endTime) {
      filtered = filtered.filter((e) => e.timestamp <= filter.endTime!);
    }
    if (filter?.eventTypes) {
      filtered = filtered.filter((e) => filter.eventTypes!.includes(e.eventType));
    }
    if (filter?.actorIds) {
      filtered = filtered.filter((e) => filter.actorIds!.includes(e.actor.id));
    }
    if (filter?.targetIds && filter.targetIds.length > 0) {
      filtered = filtered.filter((e) => e.target && filter.targetIds!.includes(e.target.id));
    }
    if (filter?.severity) {
      filtered = filtered.filter((e) => filter.severity!.includes(e.severity));
    }
    if (filter?.result) {
      filtered = filtered.filter((e) => filter.result!.includes(e.result));
    }

    // Pagination
    const total = filtered.length;
    const offset = filter?.offset || 0;
    const limit = filter?.limit || 100;
    const entries = filtered.slice(offset, offset + limit);
    const hasMore = offset + entries.length < total;

    return {
      entries,
      total,
      hasMore,
    };
  }

  async count(): Promise<number> {
    await this.ensureCache();
    return this.cache.length;
  }

  async getRange(offset: number, limit: number): Promise<SignedAuditEntry[]> {
    await this.ensureCache();
    return this.cache.slice(offset, offset + limit);
  }

  async verifyIntegrity(): Promise<{
    valid: boolean;
    totalEntries: number;
    errors: Array<{ entryId: string; error: string }>;
  }> {
    await this.ensureCache();
    
    const errors: Array<{ entryId: string; error: string }> = [];
    
    // Check chain integrity
    for (let i = 1; i < this.cache.length; i++) {
      const current = this.cache[i];
      const previous = this.cache[i - 1];
      
      if (current.previousHash !== previous.signature) {
        errors.push({
          entryId: current.id,
          error: `Chain broken: previousHash ${current.previousHash} != previous signature ${previous.signature}`
        });
      }
    }

    return {
      valid: errors.length === 0,
      totalEntries: this.cache.length,
      errors
    };
  }

  async exportAll(): Promise<SignedAuditEntry[]> {
    await this.ensureCache();
    return [...this.cache];
  }

  async importAll(entries: SignedAuditEntry[]): Promise<void> {
    // Clear existing file and cache
    await this.clear();
    
    // Write all entries
    await this.storeBatch(entries);
  }

  async clear(): Promise<void> {
    try {
      await fs.unlink(this.filePath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    
    try {
      await fs.unlink(this.indexPath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    
    this.cache = [];
    this.cacheLoaded = true;
  }

  async close(): Promise<void> {
    // No cleanup needed for file storage
  }
}

/**
 * Database-based persistence (placeholder for future implementation)
 */
export class DatabaseAuditPersistence implements AuditPersistence {
  private connectionString: string;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
  }

  async store(entry: SignedAuditEntry): Promise<void> {
    // TODO: Implement database storage
    throw new Error('Database persistence not yet implemented');
  }

  async storeBatch(entries: SignedAuditEntry[]): Promise<void> {
    // TODO: Implement batch database storage
    throw new Error('Database persistence not yet implemented');
  }

  async query(filter?: AuditQueryFilter): Promise<AuditQueryResult> {
    // TODO: Implement database query
    throw new Error('Database persistence not yet implemented');
  }

  async count(): Promise<number> {
    // TODO: Implement database count
    throw new Error('Database persistence not yet implemented');
  }

  async getRange(offset: number, limit: number): Promise<SignedAuditEntry[]> {
    // TODO: Implement database range query
    throw new Error('Database persistence not yet implemented');
  }

  async verifyIntegrity(): Promise<{
    valid: boolean;
    totalEntries: number;
    errors: Array<{ entryId: string; error: string }>;
  }> {
    // TODO: Implement database integrity check
    throw new Error('Database persistence not yet implemented');
  }

  async exportAll(): Promise<SignedAuditEntry[]> {
    // TODO: Implement database export
    throw new Error('Database persistence not yet implemented');
  }

  async importAll(entries: SignedAuditEntry[]): Promise<void> {
    // TODO: Implement database import
    throw new Error('Database persistence not yet implemented');
  }

  async clear(): Promise<void> {
    // TODO: Implement database clear
    throw new Error('Database persistence not yet implemented');
  }

  async close(): Promise<void> {
    // TODO: Implement database connection cleanup
  }
}

/**
 * Stream-based persistence for real-time audit streaming
 */
export class StreamAuditPersistence implements AuditPersistence {
  private streamEndpoint: string;
  private apiKey?: string;
  private buffer: SignedAuditEntry[] = [];
  private flushInterval: number;
  private flushTimer?: NodeJS.Timeout;

  constructor(streamEndpoint: string, options: {
    apiKey?: string;
    flushInterval?: number;
  } = {}) {
    this.streamEndpoint = streamEndpoint;
    this.apiKey = options.apiKey;
    this.flushInterval = options.flushInterval || 5000;
    
    // Start periodic flush
    this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
  }

  async store(entry: SignedAuditEntry): Promise<void> {
    this.buffer.push(entry);
    
    // Flush if buffer is getting large
    if (this.buffer.length >= 100) {
      await this.flush();
    }
  }

  async storeBatch(entries: SignedAuditEntry[]): Promise<void> {
    this.buffer.push(...entries);
    await this.flush();
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    try {
      // TODO: Implement actual streaming to endpoint
      console.log(`Streaming ${entries.length} audit entries to ${this.streamEndpoint}`);
      
      // Placeholder for actual HTTP/WebSocket streaming
      // const response = await fetch(this.streamEndpoint, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
      //   },
      //   body: JSON.stringify({ entries })
      // });
      
    } catch (error) {
      // Re-add entries to buffer on failure
      this.buffer.unshift(...entries);
      throw error;
    }
  }

  async query(filter?: AuditQueryFilter): Promise<AuditQueryResult> {
    // Stream persistence doesn't support querying
    throw new Error('Query not supported for stream persistence');
  }

  async count(): Promise<number> {
    throw new Error('Count not supported for stream persistence');
  }

  async getRange(offset: number, limit: number): Promise<SignedAuditEntry[]> {
    throw new Error('Range query not supported for stream persistence');
  }

  async verifyIntegrity(): Promise<{
    valid: boolean;
    totalEntries: number;
    errors: Array<{ entryId: string; error: string }>;
  }> {
    throw new Error('Integrity verification not supported for stream persistence');
  }

  async exportAll(): Promise<SignedAuditEntry[]> {
    throw new Error('Export not supported for stream persistence');
  }

  async importAll(entries: SignedAuditEntry[]): Promise<void> {
    await this.storeBatch(entries);
  }

  async clear(): Promise<void> {
    this.buffer = [];
  }

  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    // Final flush
    await this.flush();
  }
}

/**
 * Factory for creating persistence backends
 */
export class AuditPersistenceFactory {
  static create(type: string, config: any): AuditPersistence {
    switch (type) {
      case 'memory':
        return new MemoryAuditPersistence();
      
      case 'file':
        if (!config.filePath) {
          throw new Error('File path required for file persistence');
        }
        return new FileAuditPersistence(config.filePath);
      
      case 'database':
        if (!config.connectionString) {
          throw new Error('Connection string required for database persistence');
        }
        return new DatabaseAuditPersistence(config.connectionString);
      
      case 'stream':
        if (!config.streamEndpoint) {
          throw new Error('Stream endpoint required for stream persistence');
        }
        return new StreamAuditPersistence(config.streamEndpoint, {
          apiKey: config.apiKey,
          flushInterval: config.flushInterval
        });
      
      default:
        throw new Error(`Unknown persistence type: ${type}`);
    }
  }
}