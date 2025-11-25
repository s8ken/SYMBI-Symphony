# SYMBI Orchestration Layer Documentation

## Overview

The SYMBI Orchestration Layer is the central coordination system that unifies all SYMBI repositories (Resonate, Symphony, Vault) into a cohesive, enterprise-grade platform. It provides multi-agent coordination, cryptographic trust receipts, message brokering, and cross-repository integration.

## Architecture

### Core Components

#### 1. API Gateway (`api-gateway.ts`)
- **Purpose**: Central entry point for all API requests
- **Features**:
  - Request routing to appropriate services
  - Authentication and authorization
  - Rate limiting and security
  - Request/response transformation
  - Trust receipt generation for all operations

#### 2. Agent Orchestrator (`orchestrator.ts`)
- **Purpose**: Manages AI agent lifecycle and coordination
- **Features**:
  - Agent registration and discovery
  - Capability matching and task distribution
  - Load balancing and health monitoring
  - Trust score management
  - Multi-agent collaboration workflows

#### 3. Message Broker (`message-broker.ts`)
- **Purpose**: Asynchronous communication between services
- **Features**:
  - Pub/sub messaging patterns
  - Message queues with priorities
  - Dead letter queue handling
  - Message persistence and retry logic
  - Real-time event streaming

#### 4. Trust Manager (`trust-manager.ts`)
- **Purpose**: Cryptographic trust receipt generation and verification
- **Features**:
  - SHA-256 content hashing
  - Ed25519 digital signatures
  - 6-principle trust scoring algorithm
  - Regulatory compliance checking (GDPR, EU AI Act, CCPA, ISO 27001)
  - Real-time verification

## API Reference

### Health Check
```
GET /health
```
Returns system status and component health.

### Agent Management
```
GET /api/agents                    # List all agents
GET /api/agents/:id/status         # Get agent status
POST /api/agents/:id/coordinate    # Coordinate agent task
```

### Trust Protocol
```
POST /api/trust/receipts           # Generate trust receipt
GET /api/trust/receipts/:id        # Get trust receipt
POST /api/trust/verify             # Verify trust receipt
```

### Message Broker
```
POST /api/messages                 # Send message
GET /api/messages/queue/:id        # Get messages from queue
```

### Cross-Repository Integration
```
GET /api/vault/credentials/:id     # Get credentials from Vault
POST /api/vault/secrets            # Store secret in Vault
POST /api/resonate/analyze         # Analyze content with Resonate
GET /api/resonate/agents/:id/capabilities  # Get agent capabilities
```

## Trust Receipt Format

```typescript
interface TrustReceipt {
  id: string;
  timestamp: string;
  operation: string;
  agentId?: string;
  userId?: string;
  content: any;
  contentHash: string;
  signature: string;
  trustScore: TrustScore;
  compliance: ComplianceCheck;
  verified: boolean;
}

interface TrustScore {
  overall: number;           // 0.0 - 1.0
  principles: {
    consent: number;         // 25% weight - CRITICAL
    inspection: number;      // 20% weight - HIGH
    validation: number;      // 20% weight - HIGH
    override: number;        // 15% weight - CRITICAL
    disconnect: number;      // 10% weight - MEDIUM
    recognition: number;     // 10% weight - MEDIUM
  };
  level: 'excellent' | 'good' | 'needs_attention' | 'critical';
  timestamp: string;
}
```

## Agent Capabilities

### Resonate Agents
- `text_analysis`: Analyze text content
- `sentiment_detection`: Detect sentiment and emotion
- `entity_extraction`: Extract named entities
- `semantic_search`: Semantic content search
- `content_classification`: Classify content categories

### Symphony Agents
- `trust_scoring`: Calculate trust scores
- `compliance_check`: Verify regulatory compliance
- `audit_generation`: Generate audit trails
- `policy_enforcement`: Apply trust policies

### Vault Agents
- `credential_management`: Manage credentials and keys
- `encryption`: Encrypt/decrypt data
- `access_control`: Manage access permissions
- `audit_logging`: Log security events

## Integration Patterns

### 1. Request-Response Pattern
```typescript
const response = await fetch('/api/agents/resonate-agent-1/coordinate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'request-1',
    type: 'sentiment_analysis',
    payload: { text: 'Sample text' },
    requiredCapabilities: ['sentiment_detection']
  })
});
```

### 2. Event-Driven Pattern
```typescript
// Publish event
await fetch('/api/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    topic: 'agent.completed',
    payload: { agentId: 'resonate-1', result: 'success' }
  })
});

// Subscribe to events
const messages = await fetch('/api/messages/queue/topic:agent.completed');
```

### 3. Trust Verification Pattern
```typescript
// Generate trust receipt
const receiptResponse = await fetch('/api/trust/receipts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    operation: 'data_processing',
    userId: 'user-123',
    metadata: { consentVerified: true }
  })
});

// Verify receipt
const verification = await fetch('/api/trust/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    receiptId: receipt.data.id,
    signature: receipt.data.signature
  })
});
```

## Configuration

### Environment Variables
```bash
# Server Configuration
ORCHESTRATION_PORT=3001
NODE_ENV=production

# Security
ALLOWED_ORIGINS=http://localhost:3000,https://symbi.world
JWT_SECRET=your-jwt-secret

# Database/Storage
REDIS_URL=redis://localhost:6379
MONGODB_URL=mongodb://localhost:27017/symbi

# External Services
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
```

### Agent Registration
```typescript
await orchestrator.registerAgent({
  name: 'Custom Analysis Agent',
  type: 'resonate',
  capabilities: {
    supported: ['custom_analysis'],
    version: '1.0.0',
    description: 'Custom analysis capabilities'
  },
  status: 'active',
  trustScore: 0.95,
  metadata: {
    endpoint: 'https://your-agent-endpoint.com',
    specialization: 'custom'
  }
});
```

## Security Considerations

### 1. Authentication
- JWT-based authentication for all API endpoints
- API key management for external integrations
- Role-based access control (RBAC)

### 2. Authorization
- Resource-based permissions
- Agent capability restrictions
- Data access controls

### 3. Cryptographic Security
- SHA-256 content hashing for integrity
- Ed25519 digital signatures for authenticity
- End-to-end encryption for sensitive data

### 4. Compliance
- GDPR compliance with consent management
- EU AI Act alignment with transparency requirements
- ISO 27001 security controls
- CCPA data privacy protections

## Performance Optimization

### 1. Caching
- Agent capability caching
- Trust receipt memoization
- Message queue optimization

### 2. Load Balancing
- Agent selection algorithms
- Request distribution strategies
- Health-based routing

### 3. Monitoring
- Response time tracking
- Error rate monitoring
- Resource utilization metrics

## Testing

### Unit Tests
```bash
npm run orchestration:test
```

### Integration Tests
```bash
npm run test:integration
```

### End-to-End Tests
```bash
npm run test:e2e
```

### Demo
```bash
npm run orchestration:demo
```

## Deployment

### Development
```bash
npm run orchestration:dev
```

### Production
```bash
npm run build
npm run orchestration
```

### Docker
```bash
docker build -t symbi-orchestration .
docker run -p 3001:3001 symbi-orchestration
```

## Monitoring and Observability

### Health Metrics
- Component status monitoring
- Performance metrics
- Error tracking

### Logging
- Structured logging with correlation IDs
- Trust receipt audit trails
- Security event logging

### Alerting
- Component failure alerts
- Performance degradation alerts
- Security incident alerts

## Troubleshooting

### Common Issues

1. **Agent Registration Fails**
   - Check agent capabilities format
   - Verify endpoint accessibility
   - Validate trust score range (0.0-1.0)

2. **Trust Receipt Verification Fails**
   - Verify content hash integrity
   - Check signature format
   - Ensure proper key management

3. **Message Broker Issues**
   - Check queue configurations
   - Verify topic subscriptions
   - Monitor dead letter queue

### Debug Mode
```bash
DEBUG=symbi:* npm run orchestration:dev
```

## Contributing

1. Follow the shared code standards in `/shared/config/`
2. Use shared types from `/shared/types/`
3. Write comprehensive tests for new features
4. Update documentation for API changes
5. Ensure all operations generate trust receipts

## License

MIT License - See LICENSE file for details.

## Support

- GitHub Issues: https://github.com/s8ken/SYMBI-Symphony/issues
- Documentation: https://docs.symbi.world
- Community: https://community.symbi.world