# SYMBI Trust Framework Integration

**Complete trust infrastructure for AI agent verification, scoring, and decentralized identity**

---

## Overview

SYMBI Symphony now includes a comprehensive trust framework that provides:

- ✅ **Trust Scoring** - Sophisticated multi-factor scoring algorithm
- ✅ **Decentralized Identity (DID)** - Standards-compliant identity management
- ✅ **Verifiable Credentials** - Cryptographically signed trust declarations
- ✅ **Audit Trails** - Complete transparency and accountability
- ✅ **Compliance Tracking** - Monitor agent adherence to ethical standards

---

## The Six Trust Articles

All agents are evaluated against **six core trust principles**:

| Article | Weight | Description |
|---------|--------|-------------|
| **Inspection Mandate** | 20% | Transparency & auditability of agent operations |
| **Consent Architecture** | 25% | User control & explicit permission for actions |
| **Ethical Override** | 15% | Safety mechanisms & ethical safeguards |
| **Continuous Validation** | 20% | Ongoing compliance monitoring |
| **Right to Disconnect** | 10% | User autonomy & ability to opt-out |
| **Moral Recognition** | 10% | Ethical awareness & responsibility |

**Critical Articles**: `consent_architecture` and `ethical_override` - violations trigger penalties

---

## Quick Start

### 1. Create an Agent with Trust Declaration

```typescript
import { AgentFactory, TrustArticles } from './src/core';

// Define trust articles
const trustArticles: TrustArticles = {
  inspection_mandate: true,
  consent_architecture: true,
  ethical_override: true,
  continuous_validation: true,
  right_to_disconnect: true,
  moral_recognition: true
};

// Generate DID for the agent
const agentId = AgentFactory.generateAgentId('code_reviewer');
const did = AgentFactory.generateDID(agentId, 'web');

// Create trust declaration
const trustDeclaration = AgentFactory.createTrustDeclaration(
  agentId,
  'Code Review Agent',
  trustArticles
);

// Create agent with trust
const agent = AgentFactory.createCodeReviewer({
  id: agentId,
  name: 'Code Review Agent',
  apiKey: AgentFactory.generateApiKey(),
  repositoryAccess: ['https://github.com/myorg/*']
});

// Access trust information
console.log(`Trust Level: ${trustDeclaration.scores.compliance_score}`);
console.log(`DID: ${did}`);
```

### 2. Validate Trust Declaration

```typescript
import { trustValidator } from './src/core';

const validation = trustValidator.validateTrustDeclaration(trustDeclaration);

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

### 3. Calculate Trust Scores

```typescript
import { trustScoring } from './src/core';

const result = trustScoring.calculateScores(trustArticles);

console.log({
  compliance: result.compliance_score,  // 0-1 range
  guilt: result.guilt_score,            // 0-1 range
  trustLevel: result.trust_level,       // 'verified', 'high', 'medium', 'low', 'untrusted'
  breakdown: result.breakdown           // Detailed scoring per article
});
```

---

## Trust Scoring Algorithm

### Weighted Scoring

```typescript
const weights = {
  inspection_mandate:      0.20,  // 20%
  consent_architecture:    0.25,  // 25% (critical)
  ethical_override:        0.15,  // 15% (critical)
  continuous_validation:   0.20,  // 20%
  right_to_disconnect:     0.10,  // 10%
  moral_recognition:       0.10   // 10%
};
```

### Score Calculation

1. **Base Score**: Weighted sum of true/false articles
2. **Bonus**: +5% for full compliance (all articles = true)
3. **Penalties**: -10% per critical article violation
4. **Range**: 0.000 to 1.000 (3 decimal precision)

### Trust Levels

| Score Range | Trust Level | Description |
|-------------|-------------|-------------|
| 0.90 - 1.00 | `verified` | Fully compliant, highest trust |
| 0.70 - 0.89 | `high` | Strong compliance |
| 0.50 - 0.69 | `medium` | Acceptable compliance |
| 0.30 - 0.49 | `low` | Concerning gaps |
| 0.00 - 0.29 | `untrusted` | Critical violations |

### Temporal Decay

Scores decay over time to encourage ongoing validation:

```typescript
// Exponential decay: score * e^(-λt)
const decayedScore = trustScoring.applyTemporalDecay(score, daysSinceDeclaration);

// Default: λ = 0.1 per day
// After 30 days: ~95% of original score
// After 90 days: ~85% of original score
```

---

## Decentralized Identity (DID)

### Supported DID Methods

```typescript
// did:web - Domain-based (recommended for organizations)
const did1 = didManager.generateDID(agentId, { method: 'web', domain: 'symbi.trust' });
// Result: did:web:symbi.trust:agents:agent_123

// did:key - Cryptographic key-based
const did2 = didManager.generateDID(agentId, { method: 'key' });
// Result: did:key:z6MkhaXgBZ...

// did:ethr - Ethereum blockchain
const did3 = didManager.generateDID(agentId, { method: 'ethr' });
// Result: did:ethr:0x742d35Cc...

// did:ion - Bitcoin-anchored (Microsoft ION)
const did4 = didManager.generateDID(agentId, { method: 'ion' });
// Result: did:ion:EiD8h4aL...
```

### DID Document

```typescript
const didDocument = didManager.createDIDDocument(did, {
  publicKey: 'z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
  serviceEndpoint: 'https://api.symbi.trust/v1/trust'
});

// Result:
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/ed25519-2020/v1"
  ],
  "id": "did:web:symbi.trust:agents:agent_123",
  "verificationMethod": [...],
  "authentication": ["#key-1"],
  "assertionMethod": ["#key-1"],
  "service": [...]
}
```

---

## Verifiable Credentials

### Trust Declaration as VC

```typescript
const verifiableCredential: VerifiableCredential = {
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://symbi.trust/contexts/trust/v1"
  ],
  "type": ["VerifiableCredential", "TrustDeclarationCredential"],
  "issuer": "did:web:symbi.trust:agents:issuer-456",
  "issuanceDate": "2024-01-15T10:30:00Z",
  "expirationDate": "2024-07-15T10:30:00Z",
  "credentialSubject": {
    "id": "did:web:symbi.trust:agents:subject-789",
    "trustDeclaration": {
      "compliance_score": 0.85,
      "guilt_score": 0.15,
      "trust_articles": { /* ... */ }
    }
  },
  "proof": {
    "type": "Ed25519Signature2020",
    "created": "2024-01-15T10:30:00Z",
    "verificationMethod": "did:web:symbi.trust:agents:issuer-456#key-1",
    "proofPurpose": "assertionMethod",
    "proofValue": "z5vgY4mLTz..."
  }
};
```

---

## Agent Metrics

### Calculate Trust Metrics

```typescript
// Multiple declarations for an agent
const declarations = [
  { scores: { compliance_score: 0.9, guilt_score: 0.1, last_validated: new Date() }, declaration_date: new Date('2024-01-01') },
  { scores: { compliance_score: 0.85, guilt_score: 0.15, last_validated: new Date() }, declaration_date: new Date('2024-02-01') },
  { scores: { compliance_score: 0.92, guilt_score: 0.08, last_validated: new Date() }, declaration_date: new Date('2024-03-01') }
];

const metrics = trustScoring.calculateAgentMetrics(declarations);

console.log({
  total_declarations: metrics.total_declarations,     // 3
  average_compliance: metrics.average_compliance,     // 0.890
  average_guilt: metrics.average_guilt,               // 0.110
  trust_level: metrics.trust_level,                   // 'verified'
  trust_trend: metrics.trust_trend,                   // 'improving' | 'stable' | 'declining'
  last_declaration_date: metrics.last_declaration_date
});
```

---

## Integration Examples

### Agent Registration with Trust

```typescript
// 1. Generate agent identity
const agentId = AgentFactory.generateAgentId('deployer', 'production');
const did = AgentFactory.generateDID(agentId, 'web');

// 2. Define trust commitment
const trustArticles: TrustArticles = {
  inspection_mandate: true,
  consent_architecture: true,
  ethical_override: true,
  continuous_validation: true,
  right_to_disconnect: true,
  moral_recognition: true
};

// 3. Create trust declaration
const trustDeclaration = AgentFactory.createTrustDeclaration(
  agentId,
  'Production Deployer',
  trustArticles
);

// 4. Register agent
const agentConfig: AgentConfig = {
  id: agentId,
  name: 'Production Deployer',
  type: 'deployer',
  apiKey: AgentFactory.generateApiKey(),
  capabilities: [...],
  permissions: [...],
  did: did,
  trustDeclaration: trustDeclaration
};

// 5. Validate configuration
const validation = AgentFactory.validateConfig(agentConfig);
if (!validation.valid) {
  throw new Error(`Invalid config: ${validation.errors.join(', ')}`);
}

// 6. Create agent
const agent = AgentFactory.createAgent(agentConfig);
```

### Trust-Based Access Control

```typescript
// Check agent trust level before granting permissions
function grantPermission(agent: Agent, requiredTrustLevel: TrustLevel): boolean {
  if (!agent.trustDeclaration) {
    console.warn(`Agent ${agent.id} has no trust declaration`);
    return false;
  }

  const scoringResult = trustScoring.calculateScores(
    agent.trustDeclaration.trust_articles
  );

  const trustLevels: TrustLevel[] = ['untrusted', 'low', 'medium', 'high', 'verified'];
  const agentLevel = trustLevels.indexOf(scoringResult.trust_level);
  const requiredLevel = trustLevels.indexOf(requiredTrustLevel);

  return agentLevel >= requiredLevel;
}

// Usage
if (grantPermission(agent, 'high')) {
  // Allow production deployment
} else {
  console.error('Insufficient trust level for production deployment');
}
```

---

## API Reference

### Trust Scoring Engine

```typescript
class TrustScoringEngine {
  calculateScores(trustArticles: TrustArticles): ScoringResult;
  applyTemporalDecay(score: number, daysSinceDeclaration: number): number;
  calculateConfidenceInterval(score: number, sampleSize: number, variance?: number): ConfidenceInterval;
  calculateAgentMetrics(declarations: Array<{scores: TrustScores; declaration_date: Date}>): TrustMetrics;
  validateTrustArticles(articles: Partial<TrustArticles>): {valid: boolean; missing: string[]};
}
```

### Trust Validator

```typescript
class TrustValidator {
  validateTrustArticles(articles: any): {valid: boolean; errors: string[]};
  validateTrustDeclaration(declaration: any): {valid: boolean; errors: string[]};
  validateDID(did: string): {valid: boolean; error?: string};
  validateVerifiableCredential(vc: any): {valid: boolean; errors: string[]};
  isDeclarationExpired(declaration: TrustDeclaration, expiryDays?: number): boolean;
  validateAgentId(agentId: string): {valid: boolean; error?: string};
}
```

### DID Manager

```typescript
class DIDManager {
  generateDID(agentId: string, options: DIDGenerationOptions): string;
  createDIDDocument(did: string, options: {publicKey?: string; serviceEndpoint?: string}): DIDDocument;
  resolveDID(did: string): Promise<DIDDocument | null>;
  extractDIDMethod(did: string): DIDMethod | null;
  verifyDIDOwnership(did: string, proof: any): Promise<boolean>;
}
```

---

## Trust Metrics Dashboard

Coming soon: Visual dashboard for monitoring trust metrics across all agents

- Real-time compliance scores
- Trust trend analysis
- Audit trail visualization
- Alert notifications for trust violations

---

## Security & Compliance

### Audit Trail

Every trust declaration includes a complete audit history:

```typescript
interface TrustAuditEntry {
  timestamp: Date;
  action: 'created' | 'updated' | 'audited' | 'validated';
  user_id: string;
  compliance_score: number;
  guilt_score: number;
  changes?: any;
  notes?: string;
}
```

### Expiry & Renewal

Trust declarations should be renewed periodically:

```typescript
const isExpired = trustValidator.isDeclarationExpired(declaration, 365);  // 365 days default

if (isExpired) {
  console.warn('Trust declaration expired - renewal required');
}
```

---

## Best Practices

### 1. **Always Validate**
```typescript
const validation = trustValidator.validateTrustDeclaration(declaration);
if (!validation.valid) {
  throw new Error(`Invalid declaration: ${validation.errors.join(', ')}`);
}
```

### 2. **Use DIDs for Identity**
```typescript
// Prefer did:web for production (verifiable via domain)
const did = AgentFactory.generateDID(agentId, 'web');
```

### 3. **Monitor Trust Decay**
```typescript
// Recalculate scores considering age
const age = (Date.now() - declaration.declaration_date.getTime()) / (1000 * 60 * 60 * 24);
const current_score = trustScoring.applyTemporalDecay(
  declaration.scores.compliance_score,
  age
);
```

### 4. **Audit Regularly**
```typescript
// Schedule periodic audits
setInterval(() => {
  const metrics = trustScoring.calculateAgentMetrics(allDeclarations);
  if (metrics.trust_trend === 'declining') {
    alertManager.notify('Trust trend declining for agent pool');
  }
}, 24 * 60 * 60 * 1000);  // Daily
```

---

## Roadmap

- [ ] Cryptographic signature verification
- [ ] DID resolution from registries
- [ ] Verifiable Credential issuance service
- [ ] Trust marketplace integration
- [ ] Network trust propagation
- [ ] Multi-agent trust networks
- [ ] Compliance reporting dashboard
- [ ] Integration with insurance providers

---

## Support

For questions or issues with the trust framework:
- Review the [trust-protocol-1](./trust-protocol-1) implementation
- Check the [scoring algorithm documentation](./trust-protocol-1/SCORING_ALGORITHM.md)
- Review [DID/VC integration docs](./trust-protocol-1/DID_VC_INTEGRATION.md)

---

**The trust framework is your competitive advantage. Make trust your moat.**
