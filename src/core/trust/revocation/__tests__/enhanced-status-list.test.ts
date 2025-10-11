import { EnhancedStatusListManager, FileStatusListStorage } from '../enhanced-status-list';
import { MemoryStatusListStorage } from '../memory-storage';

describe('EnhancedStatusListManager', () => {
  let manager: EnhancedStatusListManager;
  let memoryStorage: MemoryStatusListStorage;

  beforeEach(() => {
    memoryStorage = new MemoryStatusListStorage();
    manager = new EnhancedStatusListManager(
      {
        issuer: 'did:example:issuer',
        baseUrl: 'https://example.com/status',
        statusPurpose: 'revocation',
        length: 1024,
      },
      memoryStorage,
      0 // Disable auto-save for tests
    );
  });

  afterEach(async () => {
    await manager.shutdown();
    memoryStorage.clear();
  });

  describe('List Management', () => {
    it('should initialize a new status list', async () => {
      await manager.initializeList('test-list-1');
      
      const metadata = manager.getMetadata('test-list-1');
      expect(metadata).toBeDefined();
      expect(metadata!.id).toBe('test-list-1');
      expect(metadata!.totalRevoked).toBe(0);
      expect(metadata!.totalSuspended).toBe(0);
    });

    it('should throw error when initializing duplicate list', async () => {
      await manager.initializeList('test-list-1');
      
      await expect(manager.initializeList('test-list-1')).rejects.toThrow(
        'Status list test-list-1 already exists'
      );
    });

    it('should allocate sequential indices', async () => {
      await manager.initializeList('test-list-1');
      
      const entry1 = manager.allocateIndex('test-list-1');
      const entry2 = manager.allocateIndex('test-list-1');
      
      expect(entry1.statusListIndex).toBe('0');
      expect(entry2.statusListIndex).toBe('1');
      expect(entry1.id).toBe('https://example.com/status/test-list-1#0');
      expect(entry2.id).toBe('https://example.com/status/test-list-1#1');
    });

    it('should set and check status correctly', async () => {
      await manager.initializeList('test-list-1');
      const entry = manager.allocateIndex('test-list-1');
      const index = parseInt(entry.statusListIndex);
      
      // Initially not revoked
      let status = manager.checkStatus('test-list-1', index);
      expect(status.status).toBe('active');
      
      // Revoke the credential
      await manager.setStatus('test-list-1', index, true, 'did:example:revoker', 'Test revocation');
      
      status = manager.checkStatus('test-list-1', index);
      expect(status.status).toBe('revoked');
      
      const record = manager.getRevocationRecord('test-list-1', index);
      expect(record).toBeDefined();
      expect(record!.revokedBy).toBe('did:example:revoker');
      expect(record!.reason).toBe('Test revocation');
    });
  });

  describe('Credential Generation', () => {
    it('should generate StatusList2021Credential', async () => {
      await manager.initializeList('test-list-1');
      const entry = manager.allocateIndex('test-list-1');
      const index = parseInt(entry.statusListIndex);
      await manager.setStatus('test-list-1', index, true, 'did:example:revoker');
      
      const credential = manager.generateCredential('test-list-1');
      
      expect(credential).toBeDefined();
      expect(credential.type).toContain('StatusList2021Credential');
      expect(credential.issuer).toBe('did:example:issuer');
      expect(credential.credentialSubject.type).toBe('StatusList2021');
      expect(credential.credentialSubject.statusPurpose).toBe('revocation');
      expect(typeof credential.credentialSubject.encodedList).toBe('string');
    });
  });

  describe('Persistence', () => {
    it('should persist and load list state', async () => {
      await manager.initializeList('test-list-1');
      const entry = manager.allocateIndex('test-list-1');
      const index = parseInt(entry.statusListIndex);
      await manager.setStatus('test-list-1', index, true, 'did:example:revoker', 'Test reason');
      
      // Persist the list
      await manager.persistList('test-list-1');
      
      // Create new manager with same storage
      const newManager = new EnhancedStatusListManager(
        {
          issuer: 'did:example:issuer',
          baseUrl: 'https://example.com/status',
          statusPurpose: 'revocation',
          length: 1024,
        },
        memoryStorage,
        0
      );
      
      // Initialize should load existing state
      await newManager.initializeList('test-list-1');
      
      const status = newManager.checkStatus('test-list-1', index);
      expect(status.status).toBe('revoked');
      
      const record = newManager.getRevocationRecord('test-list-1', index);
      expect(record!.reason).toBe('Test reason');
      
      await newManager.shutdown();
    });

    it('should handle multiple lists independently', async () => {
      await manager.initializeList('list-1');
      await manager.initializeList('list-2');
      
      const entry1 = manager.allocateIndex('list-1');
      const entry2 = manager.allocateIndex('list-2');
      const index1 = parseInt(entry1.statusListIndex);
      const index2 = parseInt(entry2.statusListIndex);
      
      await manager.setStatus('list-1', index1, true, 'did:example:revoker1');
      // list-2 entry remains unrevoked
      
      const status1 = manager.checkStatus('list-1', index1);
      const status2 = manager.checkStatus('list-2', index2);
      
      expect(status1.status).toBe('revoked');
      expect(status2.status).toBe('active');
      
      const metadata1 = manager.getMetadata('list-1');
      const metadata2 = manager.getMetadata('list-2');
      
      expect(metadata1!.totalRevoked).toBe(1);
      expect(metadata2!.totalRevoked).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should provide global statistics', async () => {
      await manager.initializeList('list-1');
      await manager.initializeList('list-2');
      
      const entry1 = manager.allocateIndex('list-1');
      const entry2 = manager.allocateIndex('list-2');
      const index1 = parseInt(entry1.statusListIndex);
      
      await manager.setStatus('list-1', index1, true, 'did:example:revoker');
      
      const stats = manager.getGlobalStats();
      
      expect(stats.totalLists).toBe(2);
      expect(stats.totalCredentials).toBe(2);
      expect(stats.totalRevoked).toBe(1);
      expect(stats.totalSuspended).toBe(0);
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('File Storage', () => {
    let tempDir: string;
    let fileStorage: FileStatusListStorage;

    beforeEach(() => {
      tempDir = `/tmp/test-status-lists-${Date.now()}`;
      fileStorage = new FileStatusListStorage(tempDir);
    });

    it('should persist to file system', async () => {
      const fileManager = new EnhancedStatusListManager(
        {
          issuer: 'did:example:issuer',
          baseUrl: 'https://example.com/status',
          statusPurpose: 'revocation',
          length: 1024,
        },
        fileStorage,
        0
      );

      await fileManager.initializeList('file-test-list');
      const entry = fileManager.allocateIndex('file-test-list');
      const index = parseInt(entry.statusListIndex);
      await fileManager.setStatus('file-test-list', index, true, 'did:example:revoker', 'File test');
      
      await fileManager.persistList('file-test-list');
      
      // Verify file was created
      const lists = await fileStorage.listAllLists();
      expect(lists).toContain('file-test-list');
      
      // Load in new manager
      const newFileManager = new EnhancedStatusListManager(
        {
          issuer: 'did:example:issuer',
          baseUrl: 'https://example.com/status',
          statusPurpose: 'revocation',
          length: 1024,
        },
        fileStorage,
        0
      );
      
      await newFileManager.initializeList('file-test-list');
      const status = newFileManager.checkStatus('file-test-list', index);
      expect(status.status).toBe('revoked');
      
      await fileManager.shutdown();
      await newFileManager.shutdown();
    });
  });
});