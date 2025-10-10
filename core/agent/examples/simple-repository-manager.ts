/**
 * Simple Repository Manager Agent Example
 * 
 * This example demonstrates basic usage of the AI Agent Production Framework
 * for creating a repository manager agent.
 */

import { AgentFactory, createAgentSDK } from '../index';
import type { RepositoryConfig, AgentConfig } from '../types';

async function createSimpleRepositoryManager() {
  console.log('🚀 Creating Simple Repository Manager...');

  // 1. Define repository configuration
  const repositoryConfig: RepositoryConfig = {
    url: 'https://github.com/your-org/your-repo',
    branch: 'main',
    accessToken: process.env.GITHUB_TOKEN || 'your-github-token',
    webhookUrl: 'https://your-domain.com/webhooks/github',
    autoMerge: false,
    reviewRequired: true
  };

  // 2. Create repository manager agent configuration
  const agentConfig: AgentConfig = AgentFactory.createRepositoryManager(
    'repo-manager-' + Date.now(),
    'Simple Repository Manager',
    repositoryConfig
  );
  console.log('✅ Repository agent config created:', agentConfig.id);

  // 3. Create SDK instance
  const sdk = createAgentSDK({
    orchestratorUrl: process.env.ORCHESTRATOR_URL || 'http://localhost:3000',
    agentId: agentConfig.id,
    apiKey: process.env.AGENT_API_KEY || 'your-api-key',
    environment: (process.env.NODE_ENV as any) || 'development'
  });

  // 4. Register the agent
  try {
    await sdk.registerAgent(agentConfig);
    console.log('✅ Agent registered successfully');
  } catch (error) {
    console.error('❌ Failed to register agent:', error);
    return;
  }

  // 5. Set up message handling
  sdk.subscribeToMessages((message) => {
    console.log('📨 Received message:', message.type);
    
    if (message.type === 'task_assignment') {
      console.log('📋 New task assigned:', message.payload);
      // Handle task assignment here
    }
  });

  // 6. Send a health check
  try {
    const healthCheck = {
      agentId: agentConfig.id,
      status: 'healthy' as const,
      lastCheck: new Date(),
      details: {
        version: '1.0.0',
        capabilities: agentConfig.capabilities.length
      }
    };
    
    await sdk.sendHealthCheck(healthCheck);
    console.log('💓 Health check sent successfully');
  } catch (error) {
    console.error('❌ Health check failed:', error);
  }

  // 7. Send sample metrics
  try {
    await sdk.sendMetrics([{
      name: 'agent_startup',
      value: 1,
      unit: 'count',
      timestamp: new Date(),
      tags: { 
        agent_type: 'repository_manager',
        version: '1.0.0'
      }
    }]);
    console.log('📊 Metrics sent successfully');
  } catch (error) {
    console.error('❌ Metrics send failed:', error);
  }

  console.log('🎉 Simple Repository Manager is running!');
  return { agentConfig, sdk };
}

/**
 * Example configuration for different environments
 */
export const exampleConfigs = {
  development: {
    orchestratorUrl: 'http://localhost:3000',
    environment: 'development' as const,
    logLevel: 'debug'
  },
  staging: {
    orchestratorUrl: 'https://staging-orchestrator.example.com',
    environment: 'staging' as const,
    logLevel: 'info'
  },
  production: {
    orchestratorUrl: 'https://orchestrator.example.com',
    environment: 'production' as const,
    logLevel: 'error'
  }
};

/**
 * Example task handlers
 */
export const taskHandlers = {
  repository_sync: async (taskPayload: any) => {
    console.log('🔄 Handling repository sync:', taskPayload);
    // Implement repository sync logic
    return { status: 'completed', message: 'Repository synced successfully' };
  },
  
  code_review: async (taskPayload: any) => {
    console.log('👀 Handling code review:', taskPayload);
    // Implement code review logic
    return { status: 'completed', message: 'Code review completed' };
  },
  
  deployment: async (taskPayload: any) => {
    console.log('🚀 Handling deployment:', taskPayload);
    // Implement deployment logic
    return { status: 'completed', message: 'Deployment successful' };
  }
};

// Run the example if this file is executed directly
if (require.main === module) {
  createSimpleRepositoryManager().catch(console.error);
}

export { createSimpleRepositoryManager };