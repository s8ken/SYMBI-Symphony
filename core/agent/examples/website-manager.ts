/**
 * Website Manager Agent Example
 * 
 * This example demonstrates how to create and configure a website manager agent
 * that can handle website deployments, monitoring, and maintenance tasks.
 */

import { AgentFactory, createAgentSDK } from '../index';
import type { WebsiteConfig, AgentConfig } from '../types';

async function createWebsiteManagerExample() {
  console.log('🌐 Creating Website Manager Agent...');

  // 1. Define website configuration
  const websiteConfig: WebsiteConfig = {
    domain: 'example.com',
    deploymentTarget: 'production',
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
    environmentVariables: {
      NODE_ENV: 'production',
      API_URL: 'https://api.example.com'
    }
  };

  // 2. Create website manager agent configuration
  const agentConfig: AgentConfig = AgentFactory.createWebsiteManager(
    'website-manager-' + Date.now(),
    'Website Manager Agent',
    websiteConfig
  );
  console.log('✅ Website agent config created:', agentConfig.id);

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
    console.log('✅ Website agent registered successfully');
  } catch (error) {
    console.error('❌ Failed to register agent:', error);
    return;
  }

  // 5. Set up task handling
  sdk.subscribeToMessages((message) => {
    console.log('📨 Received message:', message.type);
    
    if (message.type === 'task_assignment') {
      const task = message.payload;
      console.log('📋 New task assigned:', task.type);
      
      // Handle different task types
      switch (task.type) {
        case 'deployment':
          handleWebsiteDeployment(task);
          break;
        case 'monitoring':
          handleWebsiteMonitoring(task);
          break;
        case 'maintenance':
          handleWebsiteMaintenance(task);
          break;
        default:
          console.log('⚠️ Unknown task type:', task.type);
      }
    }
  });

  // 6. Send initial health check
  try {
    const healthCheck = {
      agentId: agentConfig.id,
      status: 'healthy' as const,
      lastCheck: new Date(),
      details: {
        domain: websiteConfig.domain,
        deploymentTarget: websiteConfig.deploymentTarget,
        capabilities: agentConfig.capabilities.length
      }
    };
    
    await sdk.sendHealthCheck(healthCheck);
    console.log('💓 Initial health check sent');
  } catch (error) {
    console.error('❌ Health check failed:', error);
  }

  console.log('🎉 Website Manager Agent is running!');
  return { agentConfig, sdk };
}

/**
 * Handle website deployment tasks
 */
async function handleWebsiteDeployment(task: any) {
  console.log('🚀 Handling website deployment...');
  
  try {
    console.log('  - Building website...');
    await simulateAsyncOperation(2000);
    
    console.log('  - Uploading files...');
    await simulateAsyncOperation(3000);
    
    console.log('  - Updating DNS...');
    await simulateAsyncOperation(1000);
    
    console.log('✅ Website deployment completed');
    
  } catch (error) {
    console.error('❌ Website deployment failed:', error);
  }
}

/**
 * Handle website monitoring tasks
 */
async function handleWebsiteMonitoring(task: any) {
  console.log('📊 Handling website monitoring...');
  
  try {
    console.log('  - Checking website availability...');
    await simulateAsyncOperation(1000);
    
    console.log('  - Measuring response times...');
    await simulateAsyncOperation(1500);
    
    console.log('  - Checking SSL certificate...');
    await simulateAsyncOperation(800);
    
    console.log('✅ Website monitoring completed');
    
  } catch (error) {
    console.error('❌ Website monitoring failed:', error);
  }
}

/**
 * Handle website maintenance tasks
 */
async function handleWebsiteMaintenance(task: any) {
  console.log('🔧 Handling website maintenance...');
  
  try {
    console.log('  - Updating dependencies...');
    await simulateAsyncOperation(2500);
    
    console.log('  - Clearing caches...');
    await simulateAsyncOperation(1000);
    
    console.log('  - Running security scans...');
    await simulateAsyncOperation(3000);
    
    console.log('✅ Website maintenance completed');
    
  } catch (error) {
    console.error('❌ Website maintenance failed:', error);
  }
}

/**
 * Simulate async operations for demo purposes
 */
function simulateAsyncOperation(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Example website configurations for different scenarios
 */
export const websiteExamples = {
  staticSite: {
    domain: 'static-site.com',
    deploymentTarget: 'cdn',
    buildCommand: 'npm run build:static',
    outputDirectory: 'public',
    environmentVariables: {}
  },
  
  reactApp: {
    domain: 'react-app.com',
    deploymentTarget: 'vercel',
    buildCommand: 'npm run build',
    outputDirectory: 'build',
    environmentVariables: {
      REACT_APP_API_URL: 'https://api.react-app.com'
    }
  },
  
  nextjsApp: {
    domain: 'nextjs-app.com',
    deploymentTarget: 'vercel',
    buildCommand: 'npm run build',
    outputDirectory: '.next',
    environmentVariables: {
      NEXT_PUBLIC_API_URL: 'https://api.nextjs-app.com'
    }
  }
};

// Run the example if this file is executed directly
if (require.main === module) {
  createWebsiteManagerExample().catch(console.error);
}

export { createWebsiteManagerExample };