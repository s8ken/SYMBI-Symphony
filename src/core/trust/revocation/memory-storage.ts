import { StatusListStorage } from './enhanced-status-list';

/**
 * Memory-based storage implementation for testing
 */
export class MemoryStatusListStorage implements StatusListStorage {
  private storage: Map<string, any> = new Map();

  async saveListState(listId: string, state: any): Promise<void> {
    // Deep clone to avoid reference issues
    const serializedState = {
      nextIndex: state.nextIndex,
      revocationRecords: Array.from(state.revocationRecords.entries()),
      metadata: { ...state.metadata },
      bitstring: state.bitstring.encode(),
      lastPersisted: state.lastPersisted.toISOString(),
      isDirty: false,
    };
    
    this.storage.set(listId, JSON.parse(JSON.stringify(serializedState)));
  }

  async loadListState(listId: string): Promise<any | null> {
    const data = this.storage.get(listId);
    if (!data) {
      return null;
    }

    // Import Bitstring dynamically to avoid circular dependencies
    const { Bitstring } = await import('./bitstring');
    
    return {
      nextIndex: data.nextIndex,
      revocationRecords: new Map(data.revocationRecords),
      metadata: data.metadata,
      bitstring: Bitstring.decode(data.bitstring),
      lastPersisted: new Date(data.lastPersisted),
      isDirty: false,
    };
  }

  async deleteListState(listId: string): Promise<void> {
    this.storage.delete(listId);
  }

  async listAllLists(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }

  // Test helper methods
  clear(): void {
    this.storage.clear();
  }

  size(): number {
    return this.storage.size;
  }

  has(listId: string): boolean {
    return this.storage.has(listId);
  }
}