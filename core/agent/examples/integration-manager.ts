/**
 * Integration Manager Agent Example
 * 
 * This example demonstrates how to create and configure an integration manager agent
 * that can handle data synchronization between different systems.
 */

import { AgentFactory, createAgentSDK } from '../index';
import type { IntegrationConfig, AgentConfig } from '../types';

async function createIntegrationManagerExample() {
  console.log('🔄 Creating Integration Manager Agent...');

  // 1. Define integration configuration
  const integrationConfig: IntegrationConfig = {
    sourceSystem: 'CRM',
    targetSystem: 'ERP',
    mappingRules: {
      'customer.id': 'client.clientId',
      'customer.name': 'client.companyName',
      'customer.email': 'client.contactEmail',
      'order.id': 'transaction.transactionId',
      'order.amount': 'transaction.totalAmount'
    },
    syncInterval: 300000, // 5 minutes
    bidirectional: true
  };

  // 2. Create integration manager agent configuration
  const agentConfig: AgentConfig = AgentFactory.createIntegrationManager(
    'integration-manager-' + Date.now(),
    'CRM-ERP Integration Manager',
    integrationConfig
  );
  console.log('✅ Integration agent config created:', agentConfig.id);

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
    console.log('✅ Integration agent registered successfully');
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
        case 'data_sync':
          handleDataSync(task);
          break;
        case 'mapping_update':
          handleMappingUpdate(task);
          break;
        case 'sync_validation':
          handleSyncValidation(task);
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
        sourceSystem: integrationConfig.sourceSystem,
        targetSystem: integrationConfig.targetSystem,
        syncInterval: integrationConfig.syncInterval,
        bidirectional: integrationConfig.bidirectional
      }
    };
    
    await sdk.sendHealthCheck(healthCheck);
    console.log('💓 Initial health check sent');
  } catch (error) {
    console.error('❌ Health check failed:', error);
  }

  // 7. Send sample metrics
  try {
    await sdk.sendMetrics([{
      name: 'integration_startup',
      value: 1,
      unit: 'count',
      timestamp: new Date(),
      tags: { 
        agent_type: 'integration_manager',
        source: integrationConfig.sourceSystem,
        target: integrationConfig.targetSystem
      }
    }]);
    console.log('📊 Startup metrics sent');
  } catch (error) {
    console.error('❌ Metrics send failed:', error);
  }

  console.log('🎉 Integration Manager Agent is running!');
  return { agentConfig, sdk };
}

/**
 * Handle data synchronization tasks
 */
async function handleDataSync(task: any) {
  console.log('🔄 Handling data synchronization...');
  
  try {
    console.log('  - Fetching source data...');
    await simulateAsyncOperation(2000);
    
    console.log('  - Applying mapping rules...');
    await simulateAsyncOperation(1500);
    
    console.log('  - Validating transformed data...');
    await simulateAsyncOperation(1000);
    
    console.log('  - Pushing to target system...');
    await simulateAsyncOperation(2500);
    
    console.log('✅ Data synchronization completed');
    
  } catch (error) {
    console.error('❌ Data synchronization failed:', error);
  }
}

/**
 * Handle mapping rule updates
 */
async function handleMappingUpdate(task: any) {
  console.log('🗺️ Handling mapping update...');
  
  try {
    console.log('  - Validating new mapping rules...');
    await simulateAsyncOperation(1000);
    
    console.log('  - Testing mapping with sample data...');
    await simulateAsyncOperation(2000);
    
    console.log('  - Applying new mapping rules...');
    await simulateAsyncOperation(1500);
    
    console.log('✅ Mapping update completed');
    
  } catch (error) {
    console.error('❌ Mapping update failed:', error);
  }
}

/**
 * Handle synchronization validation
 */
async function handleSyncValidation(task: any) {
  console.log('✅ Handling sync validation...');
  
  try {
    console.log('  - Comparing source and target data...');
    await simulateAsyncOperation(3000);
    
    console.log('  - Checking data integrity...');
    await simulateAsyncOperation(2000);
    
    console.log('  - Generating validation report...');
    await simulateAsyncOperation(1000);
    
    console.log('✅ Sync validation completed');
    
  } catch (error) {
    console.error('❌ Sync validation failed:', error);
  }
}

/**
 * Simulate async operations for demo purposes
 */
function simulateAsyncOperation(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Example integration configurations for different scenarios
 */
export const integrationExamples = {
  crmToErp: {
    sourceSystem: 'Salesforce',
    targetSystem: 'SAP',
    mappingRules: {
      'Account.Id': 'Customer.CustomerNumber',
      'Account.Name': 'Customer.CompanyName',
      'Contact.Email': 'Customer.PrimaryEmail'
    },
    syncInterval: 600000, // 10 minutes
    bidirectional: false
  },
  
  ecommerceToInventory: {
    sourceSystem: 'Shopify',
    targetSystem: 'WMS',
    mappingRules: {
      'product.id': 'item.sku',
      'product.title': 'item.description',
      'variant.inventory_quantity': 'item.quantity'
    },
    syncInterval: 300000, // 5 minutes
    bidirectional: true
  },
  
  hrToPayroll: {
    sourceSystem: 'BambooHR',
    targetSystem: 'ADP',
    mappingRules: {
      'employee.id': 'worker.employeeId',
      'employee.firstName': 'worker.givenName',
      'employee.lastName': 'worker.familyName',
      'employee.salary': 'compensation.basePay'
    },
    syncInterval: 86400000, // 24 hours
    bidirectional: false
  }
};

// Run the example if this file is executed directly
if (require.main === module) {
  createIntegrationManagerExample().catch(console.error);
}

export { createIntegrationManagerExample };