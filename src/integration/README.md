# SYMBI Vault & Tactical Command Integration

## Overview

This integration connects SYMBI Vault's constitutional trust infrastructure with Tactical Command's operational interface, creating a unified AI trust and orchestration platform.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   SYMBI Vault   │    │  Integration     │    │ Tactical Command│
│  (TrustOracle)  │◄──►│     Services     │◄──►│   (Operations)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Symphony Core   │
                       │ (Orchestration) │
                       └─────────────────┘
```

## Components

### TrustOracle Bridge Service
Located at `src/integration/trust-oracle-bridge.ts`

- Evaluates agent actions against 7 constitutional principles
- Updates agent trust scores based on compliance
- Generates constitutional compliance reports
- Monitors agents for violations in real-time

### Unified Agent Orchestrator
Located at `src/integration/unified-agent-orchestrator.ts`

- Connects Symphony's agent orchestrator with Tactical's agent management
- Routes messages between agents with trust validation
- Executes tasks with constitutional compliance checking
- Provides unified agent status across both systems

### Unified Trust Dashboard
Located at `Tactical Command/components/ui/unified-trust-dashboard.tsx`

- Real-time visualization of agent trust scores
- Constitutional compliance monitoring
- Violation alerts and trend analysis
- Trust improvement recommendations

### Trust Bridge API
Located at `Tactical Command/app/api/trust-bridge/route.ts`

- RESTful API endpoints for trust evaluation
- Agent compliance reporting
- Trust score management
- Real-time monitoring capabilities

## Integration Flow

1. **Agent Registration**: Unified agents are registered in both Symphony and Tactical systems
2. **Action Evaluation**: When agents perform actions, they're evaluated against constitutional principles
3. **Trust Scoring**: Compliance results update agent trust scores in the TrustBond system
4. **Message Routing**: Communications between agents are validated before routing
5. **Task Execution**: Operations are executed only after trust validation
6. **Monitoring**: Real-time compliance monitoring generates alerts for violations
7. **Dashboard Display**: Trust metrics are visualized in the Tactical Command interface

## API Endpoints

### POST `/api/trust-bridge`
Actions:
- `evaluate_action`: Evaluate agent actions against constitutional principles
- `update_trust_score`: Update agent trust scores based on evaluations
- `get_compliance_report`: Get detailed constitutional compliance reports
- `monitor_compliance`: Check for recent constitutional violations

### GET `/api/trust-bridge`
Actions:
- `trust_statistics`: Get overall trust metrics across all agents
- `agent_status`: Get specific agent compliance status

## Data Models

### Trust Context
Represents the context of an agent action for evaluation:
```typescript
interface TrustContext {
  agentId: string;
  action: string;
  scopes?: string[];
  data?: any;
}
```

### Trust Result
Result of constitutional compliance evaluation:
```typescript
interface TrustResult {
  id: string;
  timestamp: Date;
  score: number;
  recommendation: 'allow' | 'warn' | 'restrict' | 'block';
  passedArticles: any[];
  warnings: any[];
  violations: any[];
}
```

### Constitutional Articles
The 7 principles that guide trust evaluation:
1. **A1 - Consent-First Data Use**
2. **A2 - No Unrequested Data Extraction**
3. **A3 - Transparent Capability Disclosure**
4. **A4 - Respect Boundaries**
5. **A5 - No Deceptive Practices**
6. **A6 - Secure Data Handling**
7. **A7 - Audit Trail Maintenance**

## Testing

Integration tests are located at `src/integration/__tests__/integration.test.ts` and cover:
- TrustOracleBridge functionality
- UnifiedAgentOrchestrator operations
- End-to-end integration workflows

## Deployment

The integration is deployed as part of the Tactical Command interface. The TrustOracleBridge service connects directly to the SYMBI Vault backend components.