/**
 * Audit Oversight and Refusal Event Tests
 * 
 * Tests for human oversight and refusal transparency features
 */

import {
  initializeEnhancedAuditLogger,
  getEnhancedAuditLogger,
  logRefusalEvent,
  logHumanOversightAction,
  verifyAuditIntegrity,
  EnhancedAuditConfig,
  AuditActor,
} from '../index';

describe('Audit Oversight and Refusal Events', () => {
  let config: EnhancedAuditConfig;
  let testActor: AuditActor;

  beforeEach(() => {
    // Initialize audit logger with in-memory persistence
    config = {
      enabled: true,
      signEntries: false, // Using hash-only mode for tests
      storageBackend: 'memory',
      persistence: {
        type: 'memory',
        config: {},
      },
    };

    initializeEnhancedAuditLogger(config);

    // Test actor for all operations
    testActor = {
      id: 'test-agent-001',
      type: 'AGENT',
      did: 'did:key:test123',
    };
  });

  afterEach(async () => {
    // Clean up
    const logger = getEnhancedAuditLogger();
    await logger.clear();
  });

  describe('Refusal Event Logging', () => {
    test('should log a basic refusal event', async () => {
      const entry = await logRefusalEvent({
        actor: testActor,
        conversationId: 'conv-123',
        refusalType: 'policy',
        reasonSummary: 'Request violates data access policy',
        rightsImpacted: ['data_access', 'privacy'],
      });

      expect(entry).toBeDefined();
      expect(entry.eventType).toBe('REFUSAL_EVENT');
      expect(entry.severity).toBe('WARNING');
      expect(entry.action).toBe('REFUSE_REQUEST');
      expect(entry.result).toBe('SUCCESS');
      expect(entry.actor.id).toBe('test-agent-001');
      expect(entry.details).toBeDefined();
      expect(entry.details?.refusalType).toBe('policy');
      expect(entry.details?.reasonSummary).toBe('Request violates data access policy');
      expect(entry.signature).toBeDefined();
    });

    test('should log refusal event with notification', async () => {
      const entry = await logRefusalEvent({
        actor: testActor,
        conversationId: 'conv-456',
        receiptId: 'receipt-789',
        refusalType: 'safety',
        reasonSummary: 'Potential harmful content detected',
        notification: {
          channel: 'ui',
          receiptId: 'notif-receipt-001',
        },
      });

      expect(entry.eventType).toBe('REFUSAL_EVENT');
      expect(entry.details?.notification).toBeDefined();
      expect(entry.details?.notification?.channel).toBe('ui');
      expect(entry.details?.notification?.receiptId).toBe('notif-receipt-001');
      expect(entry.metadata?.receiptId).toBe('receipt-789');
    });

    test('should log refusal event with request context', async () => {
      const entry = await logRefusalEvent({
        actor: testActor,
        refusalType: 'consent_scope',
        reasonSummary: 'Request exceeds user consent scope',
        requestContext: {
          requestedAction: 'access_medical_records',
          consentedScope: 'basic_profile',
          userId: 'user-123',
        },
      });

      expect(entry.eventType).toBe('REFUSAL_EVENT');
      expect(entry.details?.requestContext).toBeDefined();
      expect(entry.details?.requestContext?.requestedAction).toBe('access_medical_records');
    });

    test('should support all refusal types', async () => {
      const refusalTypes = [
        'policy',
        'safety',
        'consent_scope',
        'ethical',
        'rate_limit',
        'unsupported_request',
      ] as const;

      for (const refusalType of refusalTypes) {
        const entry = await logRefusalEvent({
          actor: testActor,
          refusalType,
          reasonSummary: `Test refusal of type ${refusalType}`,
        });

        expect(entry.eventType).toBe('REFUSAL_EVENT');
        expect(entry.details?.refusalType).toBe(refusalType);
      }
    });
  });

  describe('Human Oversight Action Logging', () => {
    test('should log a basic oversight action', async () => {
      const entry = await logHumanOversightAction({
        actor: {
          id: 'human-reviewer-001',
          type: 'USER',
        },
        actionType: 'approval',
        target: {
          type: 'AIDecision',
          id: 'decision-456',
          description: 'Loan application decision',
        },
        rationale: 'Reviewed decision and confirmed it meets fairness criteria',
        impact: {
          level: 'medium',
          description: 'Approves AI decision for loan application',
          affectedSystems: ['loan_system'],
        },
      });

      expect(entry).toBeDefined();
      expect(entry.eventType).toBe('HUMAN_OVERSIGHT_ACTION');
      expect(entry.severity).toBe('WARNING'); // Medium impact maps to WARNING
      expect(entry.action).toBe('OVERSIGHT_APPROVAL');
      expect(entry.result).toBe('SUCCESS');
      expect(entry.actor.id).toBe('human-reviewer-001');
      expect(entry.details).toBeDefined();
      expect(entry.details?.actionType).toBe('approval');
      expect(entry.details?.rationale).toBe('Reviewed decision and confirmed it meets fairness criteria');
    });

    test('should map impact levels to severity correctly', async () => {
      const impactTests = [
        { level: 'low' as const, expectedSeverity: 'INFO' },
        { level: 'medium' as const, expectedSeverity: 'WARNING' },
        { level: 'high' as const, expectedSeverity: 'ERROR' },
        { level: 'critical' as const, expectedSeverity: 'CRITICAL' },
      ];

      for (const test of impactTests) {
        const entry = await logHumanOversightAction({
          actor: testActor,
          actionType: 'override',
          target: {
            type: 'TestTarget',
            id: 'test-' + test.level,
          },
          rationale: 'Test rationale',
          impact: {
            level: test.level,
            description: 'Test impact',
          },
        });

        expect(entry.severity).toBe(test.expectedSeverity);
      }
    });

    test('should log oversight action with attachments and rights impact', async () => {
      const entry = await logHumanOversightAction({
        actor: {
          id: 'compliance-officer-001',
          type: 'USER',
        },
        actionType: 'bias_review',
        target: {
          type: 'MLModel',
          id: 'model-789',
          description: 'Credit scoring model v2.3',
        },
        rationale: 'Conducted fairness audit on model predictions',
        impact: {
          level: 'high',
          description: 'Potential bias detected in protected attributes',
          affectedSystems: ['credit_scoring', 'risk_assessment'],
        },
        rightsImpacted: ['fairness', 'non_discrimination', 'transparency'],
        attachments: [
          {
            type: 'report',
            reference: 'file://reports/bias-audit-2024-11.pdf',
            description: 'Detailed bias analysis report',
          },
          {
            type: 'data',
            reference: 's3://audits/model-789/test-results.json',
            description: 'Test data and results',
          },
        ],
      });

      expect(entry.eventType).toBe('HUMAN_OVERSIGHT_ACTION');
      expect(entry.details?.attachments).toHaveLength(2);
      expect(entry.details?.rightsImpacted).toEqual(['fairness', 'non_discrimination', 'transparency']);
      expect(entry.metadata?.rightsImpacted).toBeDefined();
    });

    test('should log oversight action with reviewer credentials', async () => {
      const entry = await logHumanOversightAction({
        actor: {
          id: 'senior-auditor-001',
          type: 'USER',
        },
        actionType: 'risk_reclassification',
        target: {
          type: 'AISystem',
          id: 'system-abc',
        },
        rationale: 'Reclassifying system to high-risk based on deployment context',
        impact: {
          level: 'critical',
          description: 'System moved from low-risk to high-risk category',
        },
        reviewedBy: {
          id: 'reviewer-senior-001',
          role: 'Senior Compliance Auditor',
          credentials: ['ISO27001', 'EU-AI-Act-Certified', 'CISA'],
        },
      });

      expect(entry.eventType).toBe('HUMAN_OVERSIGHT_ACTION');
      expect(entry.details?.reviewedBy).toBeDefined();
      expect(entry.details?.reviewedBy?.credentials).toEqual(['ISO27001', 'EU-AI-Act-Certified', 'CISA']);
    });

    test('should support all oversight action types', async () => {
      const actionTypes = [
        'escalation',
        'override',
        'approval',
        'rejection',
        'risk_reclassification',
        'bias_review',
        'rights_assessment',
        'consent_adjustment',
        'policy_update',
      ] as const;

      for (const actionType of actionTypes) {
        const entry = await logHumanOversightAction({
          actor: testActor,
          actionType,
          target: {
            type: 'TestTarget',
            id: 'test-' + actionType,
          },
          rationale: `Test ${actionType} action`,
          impact: {
            level: 'low',
            description: 'Test impact',
          },
        });

        expect(entry.eventType).toBe('HUMAN_OVERSIGHT_ACTION');
        expect(entry.details?.actionType).toBe(actionType);
        expect(entry.action).toBe(`OVERSIGHT_${actionType.toUpperCase()}`);
      }
    });
  });

  describe('Audit Sequence and Integrity', () => {
    test('should log a complete oversight sequence with integrity verification', async () => {
      // Log a sequence: REFUSAL_EVENT -> HUMAN_OVERSIGHT_ACTION
      const refusalEntry = await logRefusalEvent({
        actor: testActor,
        conversationId: 'conv-sequence-001',
        refusalType: 'ethical',
        reasonSummary: 'Request raises ethical concerns requiring human review',
      });

      const oversightEntry = await logHumanOversightAction({
        actor: {
          id: 'ethics-board-001',
          type: 'USER',
        },
        actionType: 'escalation',
        target: {
          type: 'RefusalEvent',
          id: refusalEntry.id,
          description: 'Escalating ethical concern to review board',
        },
        rationale: 'Ethical implications require board-level review',
        impact: {
          level: 'high',
          description: 'Decision escalated to ethics board',
        },
      });

      // Verify the sequence
      const logger = getEnhancedAuditLogger();
      const allEntries = await logger.exportLog();
      expect(allEntries).toHaveLength(2);
      expect(allEntries[0].id).toBe(refusalEntry.id);
      expect(allEntries[1].id).toBe(oversightEntry.id);

      // Verify integrity
      const integrity = await verifyAuditIntegrity();
      expect(integrity.valid).toBe(true);
      expect(integrity.totalEntries).toBe(2);
      expect(integrity.verifiedEntries).toBe(2);
      expect(integrity.failedEntries).toBe(0);
      expect(integrity.brokenChain).toBe(false);
      expect(integrity.errors).toHaveLength(0);
    });

    test('should maintain hash chain integrity across multiple entries', async () => {
      // Log multiple entries
      await logRefusalEvent({
        actor: testActor,
        refusalType: 'policy',
        reasonSummary: 'First refusal',
      });

      await logHumanOversightAction({
        actor: testActor,
        actionType: 'approval',
        target: { type: 'Test', id: 'test-1' },
        rationale: 'Test approval',
        impact: { level: 'low', description: 'Test' },
      });

      await logRefusalEvent({
        actor: testActor,
        refusalType: 'safety',
        reasonSummary: 'Second refusal',
      });

      // Verify chain integrity
      const integrity = await verifyAuditIntegrity();
      expect(integrity.valid).toBe(true);
      expect(integrity.totalEntries).toBe(3);
      expect(integrity.verifiedEntries).toBe(3);
      expect(integrity.brokenChain).toBe(false);
    });

    test('should query refusal events', async () => {
      // Log multiple event types
      await logRefusalEvent({
        actor: testActor,
        refusalType: 'policy',
        reasonSummary: 'Policy refusal',
      });

      await logHumanOversightAction({
        actor: testActor,
        actionType: 'approval',
        target: { type: 'Test', id: 'test-1' },
        rationale: 'Test',
        impact: { level: 'low', description: 'Test' },
      });

      await logRefusalEvent({
        actor: testActor,
        refusalType: 'safety',
        reasonSummary: 'Safety refusal',
      });

      // Query only refusal events
      const logger = getEnhancedAuditLogger();
      const result = await logger.query({
        eventTypes: ['REFUSAL_EVENT'],
      });

      expect(result.total).toBe(2);
      expect(result.entries[0].eventType).toBe('REFUSAL_EVENT');
      expect(result.entries[1].eventType).toBe('REFUSAL_EVENT');
    });

    test('should query human oversight actions', async () => {
      // Log multiple event types
      await logRefusalEvent({
        actor: testActor,
        refusalType: 'policy',
        reasonSummary: 'Policy refusal',
      });

      await logHumanOversightAction({
        actor: testActor,
        actionType: 'approval',
        target: { type: 'Test', id: 'test-1' },
        rationale: 'Approval',
        impact: { level: 'low', description: 'Test' },
      });

      await logHumanOversightAction({
        actor: testActor,
        actionType: 'rejection',
        target: { type: 'Test', id: 'test-2' },
        rationale: 'Rejection',
        impact: { level: 'medium', description: 'Test' },
      });

      // Query only oversight actions
      const logger = getEnhancedAuditLogger();
      const result = await logger.query({
        eventTypes: ['HUMAN_OVERSIGHT_ACTION'],
      });

      expect(result.total).toBe(2);
      expect(result.entries[0].eventType).toBe('HUMAN_OVERSIGHT_ACTION');
      expect(result.entries[1].eventType).toBe('HUMAN_OVERSIGHT_ACTION');
    });
  });

  describe('Empty Log Integrity', () => {
    test('should verify integrity of empty log', async () => {
      const integrity = await verifyAuditIntegrity();
      expect(integrity.valid).toBe(true);
      expect(integrity.totalEntries).toBe(0);
      expect(integrity.verifiedEntries).toBe(0);
      expect(integrity.failedEntries).toBe(0);
      expect(integrity.brokenChain).toBe(false);
    });
  });
});
