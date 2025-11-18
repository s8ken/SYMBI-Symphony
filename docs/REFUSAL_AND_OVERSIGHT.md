# Refusal and Human Oversight Transparency

## Overview

This document describes SYMBI-Symphony's support for **Refusal Transparency** and **Human Oversight** in compliance with EU AI Act Article 13-14 and US transparency regimes. These features extend the existing cryptographically signed, tamper-evident audit trail to explicitly capture:

- **Refusal Events**: When the system refuses a user request with clear reasons
- **Refusal Notifications**: When users are notified about refusals
- **Human Oversight Actions**: When humans review, approve, reject, or override AI decisions

All events are cryptographically signed and hash-chained for tamper-evidence.

---

## Event Types

### 1. REFUSAL_EVENT

Logged when the system refuses a user request.

**When to use:**
- Policy violations
- Safety concerns
- Consent boundary violations
- Ethical concerns
- Rate limiting
- Unsupported requests

**Refusal Types:**
- `policy` - Policy violation
- `safety` - Safety concerns
- `consent_scope` - Outside consent boundaries
- `ethical` - Ethical concerns
- `rate_limit` - Rate limiting
- `unsupported_request` - Unsupported capability

**Notification Channels:**
- `ui` - User interface notification
- `email` - Email notification
- `webhook` - Webhook callback
- `pdf` - PDF report/documentation

### 2. HUMAN_OVERSIGHT_ACTION

Logged when humans perform oversight activities.

**Oversight Action Types:**
- `escalation` - Escalating to human review
- `override` - Human overriding system decision
- `approval` - Human approving proposed action
- `rejection` - Human rejecting proposed action
- `risk_reclassification` - Reclassifying risk level
- `bias_review` - Reviewing for bias
- `rights_assessment` - Assessing rights impacts
- `consent_adjustment` - Adjusting consent boundaries
- `policy_update` - Updating policy

### 3. REFUSAL_NOTIFICATION

Logged when a user is notified about a refusal (optional).

---

## API Usage

### Logging a Refusal Event

```typescript
import { logRefusalEvent } from '@yseeku/trust-protocol';

const entry = await logRefusalEvent({
  actor: {
    id: 'agent-123',
    type: 'AGENT',
    did: 'did:key:z6Mk...',
  },
  conversationId: 'conv-456',
  receiptId: 'receipt-789',
  refusalType: 'consent_scope',
  reasonSummary: 'Request exceeds user consent scope',
  rightsImpacted: ['data_access', 'privacy'],
  notification: {
    channel: 'ui',
    receiptId: 'notif-001',
  },
  requestContext: {
    requestedAction: 'access_medical_records',
    consentedScope: 'basic_profile',
  },
});

console.log('Refusal logged:', entry.id);
```

### Logging a Human Oversight Action

```typescript
import { logHumanOversightAction } from '@yseeku/trust-protocol';

const entry = await logHumanOversightAction({
  actor: {
    id: 'reviewer-001',
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
    affectedSystems: ['credit_scoring'],
  },
  rightsImpacted: ['fairness', 'non_discrimination'],
  attachments: [
    {
      type: 'report',
      reference: 'file://reports/bias-audit-2024-11.pdf',
      description: 'Detailed bias analysis report',
    },
  ],
  reviewedBy: {
    id: 'senior-auditor-001',
    role: 'Senior Compliance Auditor',
    credentials: ['ISO27001', 'EU-AI-Act-Certified'],
  },
});

console.log('Oversight action logged:', entry.id);
```

### Verifying Audit Integrity

```typescript
import { verifyAuditIntegrity } from '@yseeku/trust-protocol';

const result = await verifyAuditIntegrity();

if (result.valid) {
  console.log('✅ Audit log integrity verified');
  console.log(`   Total entries: ${result.totalEntries}`);
  console.log(`   Verified: ${result.verifiedEntries}`);
} else {
  console.error('❌ Audit log integrity check FAILED');
  console.error(`   Errors: ${result.errors.length}`);
}
```

---

## Example Audit Entries

### Refusal Event Example

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-11-18T14:30:00.000Z",
  "eventType": "REFUSAL_EVENT",
  "severity": "WARNING",
  "actor": {
    "id": "agent-123",
    "type": "AGENT",
    "did": "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH"
  },
  "target": {
    "type": "Conversation",
    "id": "conv-456"
  },
  "action": "REFUSE_REQUEST",
  "result": "SUCCESS",
  "details": {
    "refusalType": "consent_scope",
    "reasonSummary": "Request exceeds user consent scope",
    "rightsImpacted": ["data_access", "privacy"],
    "notification": {
      "channel": "ui",
      "notifiedAt": "2024-11-18T14:30:01.000Z",
      "receiptId": "notif-001"
    },
    "conversationId": "conv-456",
    "requestContext": {
      "requestedAction": "access_medical_records",
      "consentedScope": "basic_profile"
    }
  },
  "metadata": {
    "refusalType": "consent_scope",
    "rightsImpacted": ["data_access", "privacy"],
    "receiptId": "receipt-789"
  },
  "previousHash": "0000000000000000000000000000000000000000000000000000000000000000",
  "signature": "a1b2c3d4e5f6...",
  "signedBy": "hash-only",
  "signedAt": "2024-11-18T14:30:00.100Z"
}
```

### Human Oversight Action Example

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "timestamp": "2024-11-18T15:00:00.000Z",
  "eventType": "HUMAN_OVERSIGHT_ACTION",
  "severity": "ERROR",
  "actor": {
    "id": "reviewer-001",
    "type": "USER"
  },
  "target": {
    "type": "MLModel",
    "id": "model-789",
    "attributes": {
      "description": "Credit scoring model v2.3"
    }
  },
  "action": "OVERSIGHT_BIAS_REVIEW",
  "result": "SUCCESS",
  "details": {
    "actionType": "bias_review",
    "target": {
      "type": "MLModel",
      "id": "model-789",
      "description": "Credit scoring model v2.3"
    },
    "rationale": "Conducted fairness audit on model predictions",
    "impact": {
      "level": "high",
      "description": "Potential bias detected in protected attributes",
      "affectedSystems": ["credit_scoring"]
    },
    "rightsImpacted": ["fairness", "non_discrimination"],
    "attachments": [
      {
        "type": "report",
        "reference": "file://reports/bias-audit-2024-11.pdf",
        "description": "Detailed bias analysis report"
      }
    ],
    "reviewedBy": {
      "id": "senior-auditor-001",
      "role": "Senior Compliance Auditor",
      "credentials": ["ISO27001", "EU-AI-Act-Certified"]
    }
  },
  "metadata": {
    "actionType": "bias_review",
    "impactLevel": "high",
    "rightsImpacted": ["fairness", "non_discrimination"]
  },
  "previousHash": "a1b2c3d4e5f6...",
  "signature": "b2c3d4e5f6g7...",
  "signedBy": "hash-only",
  "signedAt": "2024-11-18T15:00:00.100Z"
}
```

---

## CLI: Integrity Verification

Run periodic integrity checks on your audit log:

```bash
# Verify integrity of audit log
npm run audit:integrity

# With custom storage backend
AUDIT_STORAGE_BACKEND=file AUDIT_STORAGE_PATH=./audit-logs npm run audit:integrity
```

**Exit codes:**
- `0` - Verification passed
- `1` - Verification failed or error occurred

**Example output:**

```
🔍 Starting audit log integrity verification...

📊 Verification Results:
   Total entries: 150
   Verified entries: 150
   Failed entries: 0
   Hash chain intact: ✅
   Overall status: ✅ VALID

✅ Audit log integrity verification PASSED!
```

---

## Integration with CI/CD

Add integrity checks to your CI pipeline:

```yaml
# .github/workflows/audit-integrity.yml
name: Audit Integrity Check

on: [push, pull_request]

jobs:
  integrity-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run audit:integrity
```

---

## Compliance Mapping

### EU AI Act Compliance

| Article | Requirement | Implementation |
|---------|-------------|----------------|
| **Article 13** | Transparency | Refusal events log all rejections with clear reasons |
| **Article 14** | Human Oversight | Human oversight actions are logged with full context |
| **Article 12** | Record-keeping | Cryptographically signed, tamper-evident audit trail |
| **Article 17** | Quality Management | Integrity verification ensures log quality |

### US Transparency Regimes

- **Algorithmic Accountability**: All system decisions and refusals are auditable
- **NIST AI Risk Management**: Human oversight actions document risk management
- **Consumer Protection**: Refusal notifications ensure user awareness

---

## Best Practices

### 1. Log Refusals Immediately

```typescript
try {
  // Attempt operation
  await performOperation();
} catch (error) {
  // Log refusal immediately
  await logRefusalEvent({
    actor: systemActor,
    refusalType: 'policy',
    reasonSummary: error.message,
  });
  throw error;
}
```

### 2. Include Rich Context

```typescript
await logRefusalEvent({
  actor: agent,
  refusalType: 'consent_scope',
  reasonSummary: 'Clear, user-friendly reason',
  rightsImpacted: ['specific', 'rights', 'affected'],
  requestContext: {
    // Include relevant context for audit trail
    requestedAction: 'specific_action',
    userConsent: 'current_consent_level',
  },
});
```

### 3. Document Oversight Actions

```typescript
await logHumanOversightAction({
  actor: reviewer,
  actionType: 'approval',
  target: { type: 'AIDecision', id: decisionId },
  rationale: 'Detailed explanation of decision',
  impact: {
    level: 'high',
    description: 'Clear impact assessment',
    affectedSystems: ['list', 'of', 'systems'],
  },
  attachments: [
    // Link supporting documentation
  ],
});
```

### 4. Run Regular Integrity Checks

- Run `npm run audit:integrity` in CI/CD
- Schedule periodic integrity verification
- Alert on integrity failures

### 5. Query and Export Audit Logs

```typescript
import { getEnhancedAuditLogger } from '@yseeku/trust-protocol';

const logger = getEnhancedAuditLogger();

// Query specific event types
const refusals = await logger.query({
  eventTypes: ['REFUSAL_EVENT'],
  startTime: new Date('2024-01-01'),
  endTime: new Date('2024-12-31'),
});

// Export for compliance reporting
const allEntries = await logger.exportLog();
```

---

## Support

For questions or issues:
- GitHub Issues: https://github.com/s8ken/SYMBI-Symphony/issues
- Documentation: https://symbi.world/symbi-symphony
- Email: stephen@yseeku.com

---

## Related Documentation

- [Trust Framework](../TRUST_FRAMEWORK.md)
- [Security](../SECURITY.md)
- [Audit API Reference](./ARCHITECTURE.md)
