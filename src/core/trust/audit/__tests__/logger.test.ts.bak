import { AuditLogger } from '../logger';
import { AuditConfig, AuditEventType } from '../types';

describe('Audit Logger Tests', () => {
  let auditLogger: AuditLogger;
  let config: AuditConfig;

  beforeEach(() => {
    config = {
      enabled: true,
      signEntries: false,
      signingKeyId: '',
      persistence: {
        type: 'memory',
        config: {}
      }
    };
    
    auditLogger = new AuditLogger(config);
  });

  test('should initialize audit logger', () => {
    expect(auditLogger).toBeDefined();
    expect(auditLogger.getStats().totalEntries).toBe(0);
  });

  test('should log audit entry', async () => {
    const entry = await auditLogger.log(
      'TRUST_SCORE_CALCULATED',
      'INFO',
      { id: 'test-agent', type: 'AGENT' },
      'UPDATE_TRUST_SCORE',
      'SUCCESS',
      {
        details: { trustScore: 0.95 },
        metadata: { source: 'test' }
      }
    );

    expect(entry.id).toBeDefined();
    expect(entry.timestamp).toBeDefined();
    expect(entry.eventType).toBe('TRUST_SCORE_CALCULATED');
    expect(entry.actor.id).toBe('test-agent');
    expect(entry.result).toBe('SUCCESS');
    expect(entry.signature).toBeDefined();
  });

  test('should query audit log', async () => {
    // Log a few entries
    await auditLogger.log(
      'TRUST_SCORE_CALCULATED',
      'INFO',
      { id: 'agent-1', type: 'AGENT' },
      'UPDATE_TRUST_SCORE',
      'SUCCESS'
    );

    await auditLogger.log(
      'TRUST_DECLARATION_UPDATED',
      'INFO',
      { id: 'agent-2', type: 'AGENT' },
      'PUBLISH_DECLARATION',
      'SUCCESS'
    );

    // Query entries
    const result = await auditLogger.query({
      eventTypes: ['TRUST_SCORE_CALCULATED' as AuditEventType]
    });

    expect(result.total).toBe(1);
    expect(result.entries[0].eventType).toBe('TRUST_SCORE_CALCULATED');
  });

  test('should verify integrity', async () => {
    // Log a few entries
    await auditLogger.log(
      'TRUST_SCORE_CALCULATED',
      'INFO',
      { id: 'agent-1', type: 'AGENT' },
      'UPDATE_TRUST_SCORE',
      'SUCCESS'
    );

    await auditLogger.log(
      'TRUST_DECLARATION_UPDATED',
      'INFO',
      { id: 'agent-2', type: 'AGENT' },
      'PUBLISH_DECLARATION',
      'SUCCESS'
    );

    // Verify integrity
    const integrity = await auditLogger.verifyIntegrity();
    
    expect(integrity.valid).toBe(true);
    expect(integrity.totalEntries).toBe(2);
    expect(integrity.verifiedEntries).toBe(2);
    expect(integrity.failedEntries).toBe(0);
    expect(integrity.brokenChain).toBe(false);
  });

  test('should export and import log', async () => {
    // Log an entry
    const entry = await auditLogger.log(
      'TRUST_SCORE_CALCULATED',
      'INFO',
      { id: 'test-agent', type: 'AGENT' },
      'UPDATE_TRUST_SCORE',
      'SUCCESS'
    );

    // Export log
    const exported = auditLogger.exportLog();
    expect(exported).toHaveLength(1);
    expect(exported[0].id).toBe(entry.id);

    // Create new logger and import
    const newLogger = new AuditLogger(config);
    await newLogger.importLog(exported);
    
    const imported = newLogger.exportLog();
    expect(imported).toHaveLength(1);
    expect(imported[0].id).toBe(entry.id);
  });

  test('should get statistics', async () => {
    // Log entries
    await auditLogger.log(
      'TRUST_SCORE_CALCULATED',
      'INFO',
      { id: 'agent-1', type: 'AGENT' },
      'UPDATE_TRUST_SCORE',
      'SUCCESS'
    );

    await auditLogger.log(
      'TRUST_DECLARATION_UPDATED',
      'ERROR',
      { id: 'agent-2', type: 'AGENT' },
      'PUBLISH_DECLARATION',
      'FAILURE'
    );

    const stats = auditLogger.getStats();
    
    expect(stats.totalEntries).toBe(2);
    expect(stats.successRate).toBe(0.5); // 1 success, 1 failure
  });
});