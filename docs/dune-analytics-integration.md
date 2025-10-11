# SYMBI Trust Protocol - Dune Analytics Integration

## Overview

This document provides comprehensive guidance for integrating the SYMBI Trust Protocol with Dune Analytics to enable real-time governance monitoring, trust metrics visualization, and predictive analytics dashboards.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Components](#components)
3. [Setup and Configuration](#setup-and-configuration)
4. [Usage Guide](#usage-guide)
5. [SQL Queries](#sql-queries)
6. [Dashboard Examples](#dashboard-examples)
7. [Monitoring and Troubleshooting](#monitoring-and-troubleshooting)
8. [API Reference](#api-reference)

## Architecture Overview

The SYMBI-Dune Analytics integration consists of several interconnected components that work together to provide seamless data flow from trust protocol operations to analytical dashboards:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ SYMBI Trust     │    │ Blockchain       │    │ Dune Analytics  │
│ Protocol        │───▶│ Logger           │───▶│ Dashboards      │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       ▲
         │              ┌──────────────────┐             │
         │              │ Hybrid Data      │             │
         └─────────────▶│ Pipeline         │─────────────┘
                        │                  │
                        └──────────────────┘
                                 │
                        ┌──────────────────┐
                        │ Real-Time        │
                        │ Streamer         │
                        └──────────────────┘
                                 │
                        ┌──────────────────┐
                        │ Advanced         │
                        │ Analytics        │
                        └──────────────────┘
```

### Key Features

- **Real-time Data Streaming**: Live updates of governance events and trust metrics
- **Blockchain Integration**: Cryptographically signed audit trails with tamper-evident logging
- **Advanced Analytics**: Anomaly detection, trend analysis, and predictive modeling
- **Scalable Architecture**: Handles high-volume data with batching and buffering
- **Error Recovery**: Robust error handling with retry mechanisms and circuit breakers

## Components

### 1. BlockchainLogger

**Purpose**: Logs governance events and trust protocol metrics to blockchain with Dune Analytics formatting.

**Key Features**:
- Cryptographically signed event logging
- Batch processing for efficiency
- Automatic retry mechanisms
- Dune Analytics data formatting

**Configuration**:
```typescript
const blockchainConfig: BlockchainLoggerConfig = {
  enabled: true,
  chainId: 1, // Ethereum mainnet
  contractAddress: '0x...', // Optional contract address
  duneAnalyticsEnabled: true,
  batchSize: 100,
  flushInterval: 5000, // 5 seconds
  retryAttempts: 3,
  retryDelay: 1000 // 1 second
};
```

### 2. HybridDataPipeline

**Purpose**: Manages data ingestion, transformation, and delivery to Dune Analytics.

**Key Features**:
- Multi-source data ingestion
- Configurable transformation rules
- Real-time and batch processing
- Buffer management and overflow handling

**Configuration**:
```typescript
const pipelineConfig: DataPipelineConfig = {
  sources: [
    {
      id: 'blockchain-logger',
      type: 'BLOCKCHAIN',
      endpoint: 'internal://blockchain-logger',
      pollInterval: 5000,
      batchSize: 100
    }
  ],
  transformationRules: [
    {
      sourceType: 'BLOCKCHAIN',
      targetFormat: 'DUNE_ANALYTICS',
      mappings: {
        'event_type': 'eventType',
        'block_time': 'timestamp',
        'event_data': 'data'
      }
    }
  ],
  duneConfig: {
    apiKey: process.env.DUNE_API_KEY,
    workspaceId: process.env.DUNE_WORKSPACE_ID,
    batchSize: 50,
    retryAttempts: 3
  },
  enableRealTime: true,
  bufferSize: 1000
};
```

### 3. RealTimeStreamer

**Purpose**: Provides real-time streaming of events to Dune Analytics dashboards.

**Key Features**:
- WebSocket-based real-time communication
- Message queuing and batching
- Automatic reconnection handling
- Priority-based message routing

### 4. AdvancedAnalytics

**Purpose**: Performs advanced analytics on trust protocol data.

**Key Features**:
- Anomaly detection using statistical models
- Trend analysis and pattern recognition
- Predictive modeling for governance outcomes
- Risk assessment and compliance monitoring

### 5. IntegrationManager

**Purpose**: Orchestrates all components and provides a unified interface.

**Key Features**:
- Component lifecycle management
- Health monitoring and status reporting
- Event coordination and routing
- Error handling and recovery

## Setup and Configuration

### Prerequisites

1. **Dune Analytics Account**: Sign up at [dune.com](https://dune.com)
2. **API Access**: Obtain Dune Analytics API key and workspace ID
3. **Node.js Environment**: Version 16+ recommended
4. **Environment Variables**: Configure required environment variables

### Environment Variables

Create a `.env` file in your project root:

```bash
# Dune Analytics Configuration
DUNE_API_KEY=your_dune_api_key_here
DUNE_WORKSPACE_ID=your_workspace_id_here

# Blockchain Configuration
BLOCKCHAIN_NETWORK=ethereum
BLOCKCHAIN_RPC_URL=https://mainnet.infura.io/v3/your_project_id

# Integration Settings
ENABLE_REAL_TIME_STREAMING=true
ENABLE_ADVANCED_ANALYTICS=true
LOG_LEVEL=info
```

### Installation

1. **Install Dependencies**:
```bash
npm install
```

2. **Initialize Components**:
```typescript
import { 
  initializeIntegrationManager,
  IntegrationConfig 
} from './src/core/trust/blockchain/integration-manager-simple';
import { AuditLogger } from './src/core/trust/audit/logger';

// Create audit logger
const auditLogger = new AuditLogger({
  enabled: true,
  signEntries: true,
  storageBackend: 'database'
});

// Configure integration
const config: IntegrationConfig = {
  enabled: true,
  blockchainLogger: {
    enabled: true,
    chainId: 1,
    duneAnalyticsEnabled: true,
    batchSize: 100,
    flushInterval: 5000,
    retryAttempts: 3,
    retryDelay: 1000
  },
  // ... other configurations
};

// Initialize integration manager
const integrationManager = initializeIntegrationManager(config, auditLogger);
```

3. **Start Integration**:
```typescript
await integrationManager.start();
```

## Usage Guide

### Logging Governance Events

```typescript
// Log a governance proposal creation
await integrationManager.logGovernanceEvent(
  'GOVERNANCE_PROPOSAL_CREATED',
  { id: 'agent-123', type: 'AGENT' }, // actor
  {
    proposalId: 'prop-456',
    proposer: 'agent-123',
    title: 'Constitutional Amendment Proposal',
    description: 'Proposal to update trust scoring algorithm',
    votingPeriod: 604800, // 7 days in seconds
    quorum: 0.1 // 10% quorum requirement
  },
  {
    target: { id: 'prop-456', type: 'GOVERNANCE_PROPOSAL' },
    priority: 'HIGH',
    streamRealTime: true
  }
);
```

### Logging Trust Protocol Events

```typescript
// Log a trust declaration
await integrationManager.logTrustProtocolEvent(
  'TRUST_DECLARATION_PUBLISHED',
  { id: 'agent-123', type: 'AGENT' }, // actor
  {
    declarationId: 'trust-789',
    declarant: 'agent-123',
    target: 'agent-456',
    trustScore: 0.85,
    confidenceScore: 0.9,
    evidence: ['interaction-1', 'interaction-2', 'interaction-3']
  },
  {
    target: { id: 'agent-456', type: 'AGENT' },
    priority: 'NORMAL',
    streamRealTime: true
  }
);
```

### Monitoring Integration Status

```typescript
// Get current status
const status = integrationManager.getStatus();
console.log('Integration Status:', status);

// Get detailed statistics
const stats = integrationManager.getStats();
console.log('Integration Stats:', stats);

// Listen for events
integrationManager.on('INTEGRATION_STARTED', (event) => {
  console.log('Integration started:', event);
});

integrationManager.on('INTEGRATION_ERROR', (error) => {
  console.error('Integration error:', error);
});
```

## SQL Queries

The integration includes pre-built SQL queries for common analytics use cases. These queries are located in `src/core/trust/blockchain/dune-queries.sql`.

### Key Queries

#### 1. Governance Proposal Activity
```sql
SELECT 
    DATE_TRUNC('day', block_time) as date,
    COUNT(*) as total_proposals,
    COUNT(CASE WHEN event_data->>'status' = 'ACTIVE' THEN 1 END) as active_proposals,
    COUNT(CASE WHEN event_data->>'status' = 'EXECUTED' THEN 1 END) as executed_proposals
FROM symbi_governance_events 
WHERE event_type = 'GOVERNANCE_PROPOSAL_CREATED'
    AND block_time >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', block_time)
ORDER BY date DESC;
```

#### 2. Trust Score Distribution
```sql
SELECT 
    CASE 
        WHEN CAST(event_data->>'trust_score' AS DECIMAL) >= 0.9 THEN 'Excellent (0.9-1.0)'
        WHEN CAST(event_data->>'trust_score' AS DECIMAL) >= 0.7 THEN 'Good (0.7-0.89)'
        WHEN CAST(event_data->>'trust_score' AS DECIMAL) >= 0.5 THEN 'Fair (0.5-0.69)'
        ELSE 'Poor (0-0.49)'
    END as trust_level,
    COUNT(*) as agent_count,
    AVG(CAST(event_data->>'trust_score' AS DECIMAL)) as avg_score
FROM symbi_trust_events 
WHERE event_type = 'TRUST_SCORE_UPDATED'
    AND block_time >= NOW() - INTERVAL '7 days'
GROUP BY 1
ORDER BY avg_score DESC;
```

#### 3. Voting Participation Metrics
```sql
SELECT 
    event_data->>'proposal_id' as proposal_id,
    COUNT(*) as total_votes,
    COUNT(CASE WHEN event_data->>'vote' = 'FOR' THEN 1 END) as votes_for,
    COUNT(CASE WHEN event_data->>'vote' = 'AGAINST' THEN 1 END) as votes_against,
    ROUND(
        COUNT(CASE WHEN event_data->>'vote' = 'FOR' THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) as approval_rate
FROM symbi_governance_events 
WHERE event_type = 'GOVERNANCE_VOTE_CAST'
    AND block_time >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY total_votes DESC;
```

## Dashboard Examples

### 1. Governance Overview Dashboard

**Metrics to Display**:
- Total proposals (last 30 days)
- Active proposals
- Voting participation rate
- Proposal success rate
- Top proposers by activity

**Visualizations**:
- Time series chart of proposal creation
- Pie chart of proposal statuses
- Bar chart of voting participation
- Leaderboard of active participants

### 2. Trust Protocol Health Dashboard

**Metrics to Display**:
- Average trust score across network
- Trust score distribution
- Trust declaration frequency
- Agent activity levels
- Compliance violations

**Visualizations**:
- Histogram of trust score distribution
- Time series of average trust scores
- Heatmap of agent interactions
- Alert panel for compliance issues

### 3. Advanced Analytics Dashboard

**Metrics to Display**:
- Anomaly detection results
- Trend analysis insights
- Predictive model outputs
- Risk assessment scores
- Pattern discovery results

**Visualizations**:
- Anomaly timeline with severity indicators
- Trend charts with confidence intervals
- Prediction accuracy metrics
- Risk score distribution
- Pattern correlation matrix

## Monitoring and Troubleshooting

### Health Checks

The integration provides built-in health monitoring:

```typescript
// Perform health check
const healthStatus = await integrationManager.performHealthCheck();

if (healthStatus.overall === 'HEALTHY') {
  console.log('All systems operational');
} else {
  console.log('Issues detected:', healthStatus.issues);
}
```

### Common Issues and Solutions

#### 1. Connection Failures

**Symptoms**: WebSocket disconnections, API timeouts
**Solutions**:
- Check network connectivity
- Verify API credentials
- Review rate limiting settings
- Check Dune Analytics service status

#### 2. Data Processing Delays

**Symptoms**: Delayed dashboard updates, queue buildup
**Solutions**:
- Increase batch sizes
- Reduce flush intervals
- Scale processing resources
- Optimize transformation rules

#### 3. Memory Issues

**Symptoms**: High memory usage, buffer overflows
**Solutions**:
- Reduce buffer sizes
- Increase flush frequency
- Implement data archiving
- Monitor memory usage patterns

### Logging and Debugging

Enable detailed logging for troubleshooting:

```typescript
// Set log level
process.env.LOG_LEVEL = 'debug';

// Enable component-specific logging
const config = {
  // ... other config
  logging: {
    level: 'debug',
    components: ['blockchain-logger', 'data-pipeline', 'real-time-streamer']
  }
};
```

### Performance Monitoring

Monitor key performance metrics:

- **Event Processing Rate**: Events processed per second
- **Queue Depth**: Number of queued events
- **Error Rate**: Percentage of failed operations
- **Latency**: Time from event creation to dashboard display
- **Memory Usage**: RAM consumption by components
- **Network Throughput**: Data transfer rates

## API Reference

### IntegrationManager

#### Methods

##### `start(): Promise<void>`
Initializes and starts all integration components.

##### `stop(): Promise<void>`
Gracefully stops all components and cleans up resources.

##### `logGovernanceEvent(eventType, actor, data, options?): Promise<void>`
Logs a governance event to the blockchain and data pipeline.

**Parameters**:
- `eventType`: Type of governance event
- `actor`: Actor performing the action
- `data`: Event-specific data
- `options`: Optional configuration (target, priority, streaming)

##### `logTrustProtocolEvent(eventType, actor, data, options?): Promise<void>`
Logs a trust protocol event to the blockchain and data pipeline.

##### `getStatus(): IntegrationStatus`
Returns the current integration status.

##### `getStats(): IntegrationStats`
Returns detailed statistics about the integration.

#### Events

The IntegrationManager extends EventEmitter and emits the following events:

- `INTEGRATION_STARTED`: Fired when integration starts successfully
- `INTEGRATION_STOPPED`: Fired when integration stops
- `INTEGRATION_ERROR`: Fired when an error occurs
- `COMPONENT_STATUS_CHANGED`: Fired when a component status changes
- `DATA_PROCESSED`: Fired when data is successfully processed
- `ANOMALY_DETECTED`: Fired when an anomaly is detected

### BlockchainLogger

#### Methods

##### `logGovernanceEvent(eventType, actor, data, options?): Promise<void>`
Logs a governance event to the blockchain.

##### `logTrustProtocolEvent(eventType, actor, data, options?): Promise<void>`
Logs a trust protocol event to the blockchain.

##### `logCIQMetrics(actor, agentId, metrics, options?): Promise<void>`
Logs CIQ (Coherence, Intelligence, Quality) metrics.

##### `flush(): Promise<void>`
Manually flushes queued events to the blockchain.

##### `getStats(): BlockchainLoggerStats`
Returns logger statistics including queue depth and processing rates.

### Data Types

#### BlockchainEventType
```typescript
type BlockchainEventType = 
  | 'GOVERNANCE_PROPOSAL_CREATED'
  | 'GOVERNANCE_PROPOSAL_VOTED'
  | 'GOVERNANCE_PROPOSAL_EXECUTED'
  | 'TRUST_DECLARATION_PUBLISHED'
  | 'TRUST_SCORE_UPDATED'
  | 'CIQ_METRICS_CALCULATED'
  // ... other event types
```

#### AuditActor
```typescript
interface AuditActor {
  id: string;
  type: 'USER' | 'AGENT' | 'SYSTEM' | 'SERVICE';
  did?: string;
  ipAddress?: string;
  userAgent?: string;
}
```

#### AuditTarget
```typescript
interface AuditTarget {
  type: string;
  id: string;
  attributes?: Record<string, any>;
}
```

## Best Practices

### 1. Event Design

- **Use Consistent Naming**: Follow established event type conventions
- **Include Sufficient Context**: Provide enough data for meaningful analysis
- **Maintain Data Quality**: Validate data before logging
- **Consider Privacy**: Avoid logging sensitive information

### 2. Performance Optimization

- **Batch Operations**: Use batching for high-volume scenarios
- **Optimize Queries**: Design efficient SQL queries for dashboards
- **Monitor Resources**: Track memory and CPU usage
- **Scale Horizontally**: Use multiple instances for high load

### 3. Error Handling

- **Implement Retries**: Use exponential backoff for transient failures
- **Circuit Breakers**: Prevent cascade failures
- **Graceful Degradation**: Continue operating with reduced functionality
- **Comprehensive Logging**: Log errors with sufficient context

### 4. Security

- **Secure API Keys**: Use environment variables and secret management
- **Validate Inputs**: Sanitize all input data
- **Audit Access**: Log all access to sensitive operations
- **Regular Updates**: Keep dependencies up to date

## Conclusion

The SYMBI Trust Protocol - Dune Analytics integration provides a powerful platform for monitoring, analyzing, and visualizing trust protocol operations. By following this documentation, you can successfully implement and maintain a robust analytics infrastructure that supports data-driven decision making in decentralized governance systems.

For additional support or questions, please refer to the project repository or contact the development team.