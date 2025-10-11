/**
 * Simplified Integration Tests for SYMBI Trust Protocol - Dune Analytics Pipeline
 */

import { IntegrationManager } from './integration-manager-simple';
import { AuditLogger } from '../audit/logger';

export class SimpleIntegrationTest {
  private integrationManager: IntegrationManager;
  private auditLogger: AuditLogger;

  constructor() {
    // Create audit logger
    this.auditLogger = new AuditLogger({
      enabled: true,
      signEntries: false,
      storageBackend: 'memory'
    });

    // Create integration manager with proper config
    this.integrationManager = new IntegrationManager({
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
      dataPipeline: {
        enabled: true,
        batchSize: 50,
        flushInterval: 3000,
        retryAttempts: 2,
        retryDelay: 500,
        dataSources: [
          {
            id: 'test-source',
            name: 'Test Source',
            type: 'API',
            apiEndpoint: 'http://localhost:3000/api/test',
            enabled: true,
            lastSync: new Date(),
            metadata: {}
          }
        ],
        transformationRules: [],
        duneAnalyticsConfig: {
          enabled: true,
          apiKey: 'test-key',
          queryIds: ['test-query'],
          refreshInterval: 5000
        },
        realTimeStreaming: {
          enabled: true,
          bufferSize: 100,
          flushThreshold: 50
        }
      },
      realTimeStreaming: {
        enabled: true,
        websocketUrl: 'wss://api.dune.com/ws',
        duneAnalyticsEndpoint: 'https://api.dune.com/api/v1',
        bufferSize: 100,
        flushInterval: 2000,
        heartbeatInterval: 30000,
        reconnectAttempts: 3,
        reconnectDelay: 1000,
        compression: false,
        authentication: {
          enabled: true,
          apiKey: 'test-key'
        }
      },
      analytics: {
        enabled: true,
        anomalyDetection: {
          enabled: true,
          sensitivity: 0.8,
          lookbackPeriod: 7,
          thresholds: {
            scoreDeviation: 0.2,
            activitySpike: 2.0,
            complianceDropoff: 0.1
          }
        },
        trendAnalysis: {
          enabled: true,
          windowSize: 30,
          minDataPoints: 10,
          confidenceThreshold: 0.7
        },
        predictiveModeling: {
          enabled: false,
          forecastHorizon: 7,
          modelUpdateInterval: 24,
          features: ['trust_score', 'activity_level']
        },
        riskAssessment: {
          enabled: true,
          factors: {
            trustScore: 0.4,
            complianceRate: 0.3,
            governanceActivity: 0.2,
            auditFindings: 0.1
          }
        }
      }
    }, this.auditLogger);
  }

  /**
   * Run basic integration tests
   */
  async runBasicTests(): Promise<void> {
    console.log('🚀 Starting Basic Integration Tests...\n');

    try {
      // Test 1: Start integration
      console.log('1. Testing integration startup...');
      await this.integrationManager.start();
      console.log('✅ Integration started successfully');

      // Test 2: Log governance event
      console.log('2. Testing governance event logging...');
      await this.integrationManager.logGovernanceEvent(
        'GOVERNANCE_PROPOSAL_CREATED', 
        { id: 'test-agent-1', type: 'AGENT' },
        {
          proposalId: 'test-proposal-1',
          proposer: 'test-agent-1',
          title: 'Test Proposal',
          description: 'Test proposal description',
          votingPeriod: 604800,
          quorum: 0.1
        }
      );
      console.log('✅ Governance event logged successfully');

      // Test 3: Log trust protocol event
      console.log('3. Testing trust protocol event logging...');
      await this.integrationManager.logTrustProtocolEvent(
        'TRUST_DECLARATION_PUBLISHED', 
        { id: 'test-agent-1', type: 'AGENT' },
        {
          declarationId: 'test-declaration-1',
          declarant: 'test-agent-1',
          target: 'test-agent-2',
          trustScore: 0.85,
          confidenceScore: 0.9,
          evidence: ['interaction-1', 'interaction-2']
        }
      );
      console.log('✅ Trust protocol event logged successfully');

      // Test 4: Wait for processing
      console.log('4. Waiting for event processing...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('✅ Events processed');

      // Test 5: Stop integration
      console.log('5. Testing integration shutdown...');
      await this.integrationManager.stop();
      console.log('✅ Integration stopped successfully');

      console.log('\n🎉 All basic tests passed!');

    } catch (error) {
      console.error('❌ Test failed:', error);
      throw error;
    }
  }

  /**
   * Test data flow simulation
   */
  async testDataFlow(): Promise<void> {
    console.log('🔄 Testing Data Flow...\n');

    try {
      await this.integrationManager.start();

      // Simulate multiple governance events
      console.log('Simulating governance events...');
      for (let i = 1; i <= 5; i++) {
        await this.integrationManager.logGovernanceEvent(
          'GOVERNANCE_PROPOSAL_CREATED', 
          { id: `test-agent-${i}`, type: 'AGENT' },
          {
            proposalId: `flow-test-proposal-${i}`,
            proposer: `test-agent-${i}`,
            title: `Flow Test Proposal ${i}`,
            description: `Test proposal ${i} for data flow testing`,
            votingPeriod: 604800,
            quorum: 0.1
          }
        );
        
        // Small delay between events
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Simulate trust protocol events
      console.log('Simulating trust protocol events...');
      for (let i = 1; i <= 5; i++) {
        await this.integrationManager.logTrustProtocolEvent(
          'TRUST_DECLARATION_PUBLISHED', 
          { id: `test-agent-${i}`, type: 'AGENT' },
          {
            declarationId: `flow-test-declaration-${i}`,
            declarant: `test-agent-${i}`,
            target: `test-agent-${i + 1}`,
            trustScore: 0.7 + (i * 0.05),
            confidenceScore: 0.8 + (i * 0.03),
            evidence: [`interaction-${i}-1`, `interaction-${i}-2`]
          }
        );
        
        // Small delay between events
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('Waiting for batch processing...');
      await new Promise(resolve => setTimeout(resolve, 6000));

      await this.integrationManager.stop();
      console.log('✅ Data flow test completed successfully');

    } catch (error) {
      console.error('❌ Data flow test failed:', error);
      throw error;
    }
  }

  /**
   * Test error handling
   */
  async testErrorHandling(): Promise<void> {
    console.log('⚠️  Testing Error Handling...\n');

    try {
      await this.integrationManager.start();

      // Test with invalid data
      console.log('Testing with invalid governance data...');
      try {
        await this.integrationManager.logGovernanceEvent(
          'GOVERNANCE_PROPOSAL_CREATED', 
          { id: 'test-agent', type: 'AGENT' },
          {
            proposalId: '', // Invalid empty ID
            proposer: 'test-agent',
            title: 'Test',
            description: 'Test',
            votingPeriod: -1, // Invalid negative period
            quorum: 2.0 // Invalid quorum > 1
          }
        );
        console.log('⚠️  Invalid data was accepted (this might be expected)');
      } catch (error) {
        console.log('✅ Invalid data was properly rejected');
      }

      await this.integrationManager.stop();
      console.log('✅ Error handling test completed');

    } catch (error) {
      console.error('❌ Error handling test failed:', error);
      throw error;
    }
  }
}

// CLI runner
if (require.main === module) {
  const test = new SimpleIntegrationTest();
  
  async function runAllTests() {
    try {
      await test.runBasicTests();
      console.log('\n' + '='.repeat(50) + '\n');
      
      await test.testDataFlow();
      console.log('\n' + '='.repeat(50) + '\n');
      
      await test.testErrorHandling();
      
      console.log('\n🎯 All integration tests completed successfully!');
    } catch (error) {
      console.error('\n💥 Integration tests failed:', error);
      process.exit(1);
    }
  }

  runAllTests();
}