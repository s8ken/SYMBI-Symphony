import { Bitstring } from './bitstring';
import {
  StatusList2021Credential,
  StatusList2021Entry,
  StatusListConfig,
  StatusCheckResult,
  StatusPurpose,
  RevocationRecord,
  StatusListMetadata,
} from './types';

/**
 * Per-list state tracking
 */
interface ListState {
  nextIndex: number;
  revocationRecords: Map<number, RevocationRecord>;
  metadata: StatusListMetadata;
  bitstring: Bitstring;
  lastPersisted: Date;
  isDirty: boolean;
}

/**
 * Storage interface for persistence
 */
export interface StatusListStorage {
  saveListState(listId: string, state: ListState): Promise<void>;
  loadListState(listId: string): Promise<ListState | null>;
  deleteListState(listId: string): Promise<void>;
  listAllLists(): Promise<string[]>;
}

/**
 * File-based storage implementation
 */
export class FileStatusListStorage implements StatusListStorage {
  private basePath: string;

  constructor(basePath: string = './data/status-lists') {
    this.basePath = basePath;
  }

  async saveListState(listId: string, state: ListState): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const dir = path.dirname(path.join(this.basePath, listId));
    await fs.mkdir(dir, { recursive: true });

    const serializedState = {
      nextIndex: state.nextIndex,
      revocationRecords: Array.from(state.revocationRecords.entries()),
      metadata: state.metadata,
      bitstring: state.bitstring.encode(),
      lastPersisted: state.lastPersisted.toISOString(),
      isDirty: false,
    };

    await fs.writeFile(
      path.join(this.basePath, `${listId}.json`),
      JSON.stringify(serializedState, null, 2)
    );
  }

  async loadListState(listId: string): Promise<ListState | null> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const data = await fs.readFile(path.join(this.basePath, `${listId}.json`), 'utf-8');
      const parsed = JSON.parse(data);

      return {
        nextIndex: parsed.nextIndex,
        revocationRecords: new Map(parsed.revocationRecords),
        metadata: parsed.metadata,
        bitstring: Bitstring.decode(parsed.bitstring),
        lastPersisted: new Date(parsed.lastPersisted),
        isDirty: false,
      };
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async deleteListState(listId: string): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    try {
      await fs.unlink(path.join(this.basePath, `${listId}.json`));
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async listAllLists(): Promise<string[]> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const files = await fs.readdir(this.basePath);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => path.basename(file, '.json'));
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }
}

/**
 * Enhanced Status List 2021 Manager with per-list state and durable storage
 */
export class EnhancedStatusListManager {
  private listStates: Map<string, ListState>;
  private config: StatusListConfig;
  private storage: StatusListStorage;
  private autoSaveInterval?: NodeJS.Timeout;
  private autoSaveIntervalMs: number;

  constructor(
    config: StatusListConfig,
    storage?: StatusListStorage,
    autoSaveIntervalMs: number = 30000 // 30 seconds
  ) {
    this.config = {
      length: 131072, // 16KB compressed (128K bits)
      ...config,
    };
    this.listStates = new Map();
    this.storage = storage || new FileStatusListStorage();
    this.autoSaveIntervalMs = autoSaveIntervalMs;

    // Start auto-save if storage is provided
    if (this.storage && autoSaveIntervalMs > 0) {
      this.startAutoSave();
    }
  }

  /**
   * Initialize a new status list with isolated state
   */
  async initializeList(listId: string): Promise<void> {
    if (this.listStates.has(listId)) {
      throw new Error(`Status list ${listId} already exists`);
    }

    // Try to load existing state first
    let state = await this.storage.loadListState(listId);
    
    if (!state) {
      // Create new state
      const bitstring = new Bitstring(this.config.length!);
      state = {
        nextIndex: 0,
        revocationRecords: new Map(),
        metadata: {
          id: listId,
          issuer: this.config.issuer,
          statusPurpose: this.config.statusPurpose,
          length: this.config.length!,
          issued: new Date(),
          totalRevoked: 0,
          totalSuspended: 0,
        },
        bitstring,
        lastPersisted: new Date(),
        isDirty: true,
      };
    }

    this.listStates.set(listId, state);
    
    // Persist immediately if new
    if (state.isDirty) {
      await this.persistList(listId);
    }
  }

  /**
   * Allocate next available index for a specific list
   */
  allocateIndex(listId: string): StatusList2021Entry {
    const state = this.getListState(listId);
    const index = state.nextIndex++;
    state.isDirty = true;

    return {
      id: `${this.config.baseUrl}/${listId}#${index}`,
      type: 'StatusList2021Entry',
      statusPurpose: this.config.statusPurpose,
      statusListIndex: index.toString(),
      statusListCredential: this.getStatusListUrl(listId),
    };
  }

  /**
   * Set status for a credential in a specific list
   */
  async setStatus(
    listId: string,
    index: number,
    revoked: boolean,
    revokedBy: string,
    reason?: string
  ): Promise<void> {
    const state = this.getListState(listId);
    const wasSet = state.bitstring.get(index);

    if (revoked) {
      state.bitstring.set(index);

      if (!wasSet) {
        // Record new revocation in this list's records
        const statusListCredential = this.getStatusListUrl(listId);
        state.revocationRecords.set(index, {
          credentialId: `credential-${listId}-${index}`,
          statusListIndex: index,
          revokedAt: new Date(),
          revokedBy,
          reason,
          statusListCredential,
        });

        // Update this list's metadata
        if (this.config.statusPurpose === 'revocation') {
          state.metadata.totalRevoked = (state.metadata.totalRevoked || 0) + 1;
        } else {
          state.metadata.totalSuspended = (state.metadata.totalSuspended || 0) + 1;
        }
      }
    } else {
      state.bitstring.clear(index);

      if (wasSet) {
        // Remove from this list's records
        state.revocationRecords.delete(index);

        // Update this list's metadata
        if (this.config.statusPurpose === 'revocation') {
          state.metadata.totalRevoked = Math.max(0, (state.metadata.totalRevoked || 0) - 1);
        } else {
          state.metadata.totalSuspended = Math.max(0, (state.metadata.totalSuspended || 0) - 1);
        }
      }
    }

    state.isDirty = true;
  }

  /**
   * Check credential status in a specific list
   */
  checkStatus(listId: string, index: number): StatusCheckResult {
    const state = this.getListState(listId);
    const isSet = state.bitstring.get(index);
    const purpose = this.config.statusPurpose;

    let status: 'active' | 'revoked' | 'suspended';
    if (!isSet) {
      status = 'active';
    } else {
      status = purpose === 'revocation' ? 'revoked' : 'suspended';
    }

    return {
      credentialId: `credential-${listId}-${index}`,
      status,
      statusPurpose: purpose,
      checked: new Date(),
      statusListCredential: this.getStatusListUrl(listId),
      statusListIndex: index,
    };
  }

  /**
   * Get revocation record from a specific list
   */
  getRevocationRecord(listId: string, index: number): RevocationRecord | undefined {
    const state = this.listStates.get(listId);
    return state?.revocationRecords.get(index);
  }

  /**
   * Get metadata for a specific list
   */
  getMetadata(listId: string): StatusListMetadata | undefined {
    const state = this.listStates.get(listId);
    return state?.metadata;
  }

  /**
   * Generate Status List 2021 Credential for a specific list
   */
  generateCredential(listId: string): StatusList2021Credential {
    const state = this.getListState(listId);
    
    return {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3id.org/vc/status-list/2021/v1',
      ],
      id: this.getStatusListUrl(listId),
      type: ['VerifiableCredential', 'StatusList2021Credential'],
      issuer: this.config.issuer,
      issuanceDate: state.metadata.issued.toISOString(),
      credentialSubject: {
        id: this.getStatusListUrl(listId),
        type: 'StatusList2021',
        statusPurpose: this.config.statusPurpose,
        encodedList: state.bitstring.encode(),
      },
    };
  }

  /**
   * Persist a specific list to storage
   */
  async persistList(listId: string): Promise<void> {
    const state = this.listStates.get(listId);
    if (!state || !state.isDirty) {
      return;
    }

    await this.storage.saveListState(listId, state);
    state.lastPersisted = new Date();
    state.isDirty = false;
  }

  /**
   * Persist all dirty lists to storage
   */
  async persistAll(): Promise<void> {
    const persistPromises = Array.from(this.listStates.entries())
      .filter(([_, state]) => state.isDirty)
      .map(([listId, _]) => this.persistList(listId));

    await Promise.all(persistPromises);
  }

  /**
   * Load all lists from storage
   */
  async loadAll(): Promise<void> {
    const listIds = await this.storage.listAllLists();
    
    for (const listId of listIds) {
      if (!this.listStates.has(listId)) {
        await this.initializeList(listId);
      }
    }
  }

  /**
   * Delete a list and its storage
   */
  async deleteList(listId: string): Promise<void> {
    this.listStates.delete(listId);
    await this.storage.deleteListState(listId);
  }

  /**
   * Get statistics across all lists
   */
  getGlobalStats(): {
    totalLists: number;
    totalCredentials: number;
    totalRevoked: number;
    totalSuspended: number;
    memoryUsage: number;
  } {
    let totalCredentials = 0;
    let totalRevoked = 0;
    let totalSuspended = 0;

    for (const [_, state] of this.listStates) {
      totalCredentials += state.nextIndex;
      totalRevoked += state.metadata.totalRevoked || 0;
      totalSuspended += state.metadata.totalSuspended || 0;
    }

    return {
      totalLists: this.listStates.size,
      totalCredentials,
      totalRevoked,
      totalSuspended,
      memoryUsage: process.memoryUsage().heapUsed,
    };
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    // Final persist of all dirty lists
    await this.persistAll();
  }

  // Private helper methods
  private getListState(listId: string): ListState {
    const state = this.listStates.get(listId);
    if (!state) {
      throw new Error(`Status list ${listId} not found. Call initializeList() first.`);
    }
    return state;
  }

  private getStatusListUrl(listId: string): string {
    return `${this.config.baseUrl}/${listId}`;
  }

  private startAutoSave(): void {
    this.autoSaveInterval = setInterval(async () => {
      try {
        await this.persistAll();
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, this.autoSaveIntervalMs);
  }

  private extractListId(statusListCredential: string): string {
    const url = new URL(statusListCredential);
    return url.pathname.split('/').pop() || '';
  }

  /**
   * Verify status from Status List 2021 Entry
   */
  async verifyStatus(statusEntry: StatusList2021Entry): Promise<StatusCheckResult> {
    const index = parseInt(statusEntry.statusListIndex, 10);
    const listId = this.extractListId(statusEntry.statusListCredential);

    return this.checkStatus(listId, index);
  }
}