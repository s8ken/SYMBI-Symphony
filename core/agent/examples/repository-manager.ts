/**
 * Repository Manager Agent Example
 * 
 * This example demonstrates how to create and configure a repository manager agent
 * that can handle Git operations, code reviews, and deployment tasks.
 */

import { AgentFactory, createAgentSDK, SymbiOrchestrator } from '../index';
import type { RepositoryConfig, Task } from '../types';

async function createRepositoryManagerExample() {
  console.log('🚀 Creating Repository Manager Agent...');
  const startTime = Date.now();

  // 1. Define repository configuration
  const repositoryConfig: RepositoryConfig = {
    url: 'https://github.com/your-org/your-repo',
    branch: 'main',
    accessToken: process.env.GITHUB_TOKEN || 'your-github-token',
    webhookUrl: 'https://your-domain.com/webhooks/github',
    autoMerge: false,
    reviewRequired: true
  };

  // 2. Create repository manager agent
  const repoAgent = AgentFactory.createRepositoryManager(repositoryConfig);
  console.log('✅ Repository agent created:', repoAgent.id);

  // 3. Create SDK instance
  const sdk = createAgentSDK({
    orchestratorUrl: process.env.ORCHESTRATOR_URL || 'http://localhost:3000',
    agentId: repoAgent.id,
    apiKey: process.env.AGENT_API_KEY || 'your-api-key',
    environment: (process.env.NODE_ENV as any) || 'development'
  });

  // 4. Register the agent
  try {
    await sdk.registerAgent(repoAgent);
    console.log('✅ Agent registered successfully');
  } catch (error) {
    console.error('❌ Failed to register agent:', error);
    return;
  }

  // 5. Set up task handlers
  sdk.subscribeToMessages(async (message) => {
    if (message.type === 'task_assignment') {
      const task = message.payload as Task;
      console.log('📋 New task received:', task.type);

      switch (task.type) {
        case 'repository_sync':
          await handleRepositorySync(task);
          break;
        case 'code_review':
          await handleCodeReview(task);
          break;
        case 'deployment':
          await handleDeployment(task);
          break;
        default:
          console.log('⚠️ Unknown task type:', task.type);
      }
    }
  });

  // 6. Set up health monitoring
  setInterval(async () => {
    try {
      const healthCheck = {
         agentId: repoAgent.id,
         status: 'healthy' as const,
         lastCheck: new Date(),
         details: {
           uptime: Date.now() - startTime,
           memoryUsage: process.memoryUsage().heapUsed,
           tasksCompleted: Math.floor(Math.random() * 10)
         }
       };
       
       await sdk.sendHealthCheck(healthCheck);
       console.log('💓 Health check sent:', healthCheck.status);
       
       // Report metrics
       await sdk.sendMetrics([{
         name: 'repository_operations',
         value: Math.floor(Math.random() * 10),
         timestamp: new Date(),
         tags: { 
           agent_type: 'repository_manager',
           repository: repositoryConfig.url 
         }
       }]);
    } catch (error) {
      console.error('❌ Health check failed:', error);
    }
  }, 30000); // Every 30 seconds

  console.log('🎉 Repository Manager Agent is running!');
  return { agent: repoAgent, sdk };
}

/**
 * Handle repository synchronization tasks
 */
async function handleRepositorySync(task: Task) {
  console.log('🔄 Handling repository sync...');
  
  try {
    // Simulate repository sync operations
    console.log('  - Fetching latest changes...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('  - Checking for conflicts...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('  - Updating local repository...');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Update task status
    await updateTaskStatus(task.id, 'completed', 'Repository synchronized successfully');
    console.log('✅ Repository sync completed');
    
  } catch (error) {
    console.error('❌ Repository sync failed:', error);
    await updateTaskStatus(task.id, 'failed', `Sync failed: ${error}`);
  }
}

/**
 * Handle code review tasks
 */
async function handleCodeReview(task: Task) {
  console.log('👀 Handling code review...');
  
  try {
    const { pullRequestId, repository } = task.payload;
    
    console.log(`  - Reviewing PR #${pullRequestId} in ${repository}...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('  - Running automated checks...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('  - Generating review comments...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await updateTaskStatus(task.id, 'completed', 'Code review completed with suggestions');
    console.log('✅ Code review completed');
    
  } catch (error) {
    console.error('❌ Code review failed:', error);
    await updateTaskStatus(task.id, 'failed', `Review failed: ${error}`);
  }
}

/**
 * Handle deployment tasks
 */
async function handleDeployment(task: Task) {
  console.log('🚀 Handling deployment...');
  
  try {
    const { environment, branch } = task.payload;
    
    console.log(`  - Deploying ${branch} to ${environment}...`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('  - Running build process...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('  - Deploying to target environment...');
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    console.log('  - Running post-deployment checks...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await updateTaskStatus(task.id, 'completed', `Deployment to ${environment} successful`);
    console.log('✅ Deployment completed');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    await updateTaskStatus(task.id, 'failed', `Deployment failed: ${error}`);
  }
}

/**
 * Update task status (this would typically communicate with the orchestrator)
 */
async function updateTaskStatus(taskId: string, status: string, message: string) {
  console.log(`📊 Task ${taskId} status: ${status} - ${message}`);
  // In a real implementation, this would send status updates to the orchestrator
}

/**
 * Example of creating sample tasks for testing
 */
export function createSampleTasks(): Task[] {
  return [
    {
      id: 'task-repo-sync-1',
      type: 'repository_sync',
      status: 'pending',
      priority: 'medium',
      payload: {
        repository: 'https://github.com/your-org/your-repo',
        branch: 'main'
      },
      requiredCapabilities: ['git_operations', 'file_management'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'task-code-review-1',
      type: 'code_review',
      status: 'pending',
      priority: 'high',
      payload: {
        repository: 'https://github.com/your-org/your-repo',
        pullRequestId: 42,
        author: 'developer@company.com'
      },
      requiredCapabilities: ['code_analysis', 'git_operations'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'task-deployment-1',
      type: 'deployment',
      status: 'pending',
      priority: 'high',
      payload: {
        repository: 'https://github.com/your-org/your-repo',
        branch: 'main',
        environment: 'production',
        buildCommand: 'npm run build'
      },
      requiredCapabilities: ['deployment', 'build_management'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ];
}

// Run the example if this file is executed directly
if (require.main === module) {
  createRepositoryManagerExample().catch(console.error);
}

export { createRepositoryManagerExample };