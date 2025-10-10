# SYMBI AI Agent Production Framework

A comprehensive TypeScript framework for building, managing, and orchestrating AI agents in production environments. This framework provides a robust foundation for creating scalable agent systems with built-in communication, task management, and monitoring capabilities.

## 🚀 Features

- **Multi-Agent Architecture**: Support for various agent types (Repository Manager, Website Manager, Integration Manager, etc.)
- **Agent Orchestration**: Centralized orchestrator for managing agent lifecycle and task distribution
- **Real-time Communication**: Built-in messaging system for agent-to-agent communication
- **Task Management**: Sophisticated task queuing, assignment, and tracking
- **Health Monitoring**: Comprehensive health checks and performance metrics
- **Security**: Built-in authentication, authorization, and security policies
- **Extensible**: Easy to extend with custom agent types and capabilities

## 📁 Project Structure

```
core/agent/
├── types.ts          # Core type definitions and interfaces
├── sdk.ts            # Agent SDK for registration and communication
├── factory.ts        # Agent factory for creating configured agents
├── orchestrator.ts   # Central orchestrator for agent management
├── utils.ts          # Utility functions and helpers
├── index.ts          # Main entry point and exports
└── README.md         # This documentation
```

## 🏗️ Architecture Overview

### Core Components

1. **Agent SDK (`SymbiAgentSDK`)**: Provides the interface for agents to interact with the framework
2. **Agent Factory (`AgentFactory`)**: Creates and configures different types of agents
3. **Orchestrator (`SymbiOrchestrator`)**: Manages agent lifecycle, task distribution, and communication
4. **Type System**: Comprehensive TypeScript definitions for all framework components

### Agent Types

- **Repository Manager**: Manages code repositories, handles commits, PRs, and deployments
- **Website Manager**: Manages website deployments, monitoring, and maintenance
- **Integration Manager**: Handles system integrations and data synchronization
- **Orchestrator Agent**: Coordinates multiple agents and complex workflows
- **Monitoring Agent**: Tracks system performance and health metrics
- **Security Agent**: Manages security policies and threat detection

## 🚀 Quick Start

### 1. Basic Agent Creation

```typescript
import { AgentFactory, createAgentSDK } from './core/agent';

// Create a repository manager agent
const repoAgent = await AgentFactory.createRepositoryManager({
  repositoryUrl: 'https://github.com/your-org/your-repo',
  branch: 'main',
  accessToken: 'your-github-token'
});

// Create SDK instance
const sdk = createAgentSDK({
  orchestratorUrl: 'http://localhost:3000',
  agentId: repoAgent.id,
  apiKey: 'your-api-key',
  environment: 'production'
});

// Register the agent
await sdk.registerAgent(repoAgent);
```

### 2. Using the Orchestrator

```typescript
import { SymbiOrchestrator } from './core/agent';

// Initialize orchestrator
const orchestrator = new SymbiOrchestrator({
  port: 3000,
  maxConcurrentTasks: 10,
  heartbeatInterval: 30000
});

// Start the orchestrator
await orchestrator.start();

// The orchestrator will now manage registered agents
```

### 3. Task Management

```typescript
// Create a task
const task = {
  id: 'task-1',
  type: 'repository_sync',
  priority: 'high',
  payload: {
    repository: 'https://github.com/your-org/your-repo',
    branch: 'main'
  },
  requiredCapabilities: ['git_operations', 'file_management']
};

// Assign task through orchestrator
await orchestrator.assignTask(task);
```

## 🔧 Configuration

### Agent Configuration

Each agent requires specific configuration based on its type:

```typescript
// Repository Manager Configuration
const repoConfig = {
  repositoryUrl: 'https://github.com/your-org/repo',
  branch: 'main',
  accessToken: 'github_token',
  webhookUrl: 'https://your-webhook-url',
  autoMerge: false,
  reviewRequired: true
};

// Website Manager Configuration
const websiteConfig = {
  domain: 'your-website.com',
  deploymentTarget: 'production',
  buildCommand: 'npm run build',
  outputDirectory: 'dist',
  environmentVariables: {
    NODE_ENV: 'production'
  }
};

// Integration Manager Configuration
const integrationConfig = {
  sourceSystem: 'CRM',
  targetSystem: 'Database',
  mappingRules: {
    'customer_id': 'id',
    'customer_name': 'name'
  },
  syncInterval: 3600000, // 1 hour
  bidirectional: true
};
```

### SDK Configuration

```typescript
const sdkConfig = {
  orchestratorUrl: 'http://localhost:3000',
  agentId: 'unique-agent-id',
  apiKey: 'your-api-key',
  environment: 'production' // or 'development', 'staging'
};
```

## 📊 Monitoring and Health Checks

The framework includes comprehensive monitoring capabilities:

```typescript
// Health check example
const healthStatus = await sdk.healthCheck();
console.log('Agent Health:', healthStatus);

// Metrics reporting
await sdk.reportMetric({
  name: 'tasks_completed',
  value: 42,
  timestamp: Date.now(),
  tags: { agent_type: 'repository_manager' }
});

// Error reporting
await sdk.reportError({
  message: 'Failed to sync repository',
  stack: error.stack,
  severity: 'high',
  context: { repository: 'my-repo' }
});
```

## 🔐 Security

The framework includes built-in security features:

- **Authentication**: API key-based authentication for agent registration
- **Authorization**: Role-based permissions for different agent capabilities
- **Security Policies**: Configurable security rules and restrictions
- **Audit Logging**: Comprehensive logging of all agent activities

```typescript
// Security configuration example
const securityPolicy = {
  allowedDomains: ['trusted-domain.com'],
  maxRequestsPerMinute: 100,
  requireEncryption: true,
  auditLevel: 'detailed'
};
```

## 🔄 Communication

Agents can communicate with each other through the framework:

```typescript
// Send message to specific agent
await sdk.sendMessage('target-agent-id', {
  type: 'task_update',
  payload: { status: 'completed', result: 'success' }
});

// Broadcast message to all agents
await sdk.broadcastMessage({
  type: 'system_alert',
  payload: { message: 'System maintenance in 10 minutes' }
});

// Subscribe to message types
sdk.subscribe('task_assignment', (message) => {
  console.log('New task assigned:', message.payload);
});
```

## 🛠️ Extending the Framework

### Creating Custom Agent Types

```typescript
// Define custom agent template
const customAgentTemplate = {
  type: 'custom_agent' as AgentType,
  capabilities: [
    { name: 'custom_capability', description: 'Custom functionality' }
  ],
  permissions: [
    { resource: 'custom_resource', actions: ['read', 'write'] }
  ],
  config: {
    customProperty: 'default_value'
  }
};

// Register template with factory
AgentFactory.registerTemplate('custom_agent', customAgentTemplate);
```

### Custom Task Types

```typescript
// Define custom task type
type CustomTaskType = 'custom_operation';

// Handle custom tasks in your agent
sdk.subscribe('task_assignment', (message) => {
  const task = message.payload as Task;
  if (task.type === 'custom_operation') {
    // Handle your custom task
    handleCustomOperation(task);
  }
});
```

## 📚 API Reference

### Core Classes

- **`SymbiAgentSDK`**: Main SDK class for agent operations
- **`AgentFactory`**: Factory for creating configured agents
- **`SymbiOrchestrator`**: Central orchestrator for agent management

### Utility Functions

- **`createAgentSDK(config)`**: Factory function for creating SDK instances
- **`validateAgentConfig(config)`**: Validates agent configuration
- **`generateAgentId()`**: Generates unique agent identifiers
- **`createAgentFromTemplate(template, config)`**: Creates agents from templates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review example configurations

---

**SYMBI AI Agent Production Framework** - Building the future of intelligent automation.