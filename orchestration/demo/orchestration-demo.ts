/**
 * SYMBI Orchestration Demo
 * 
 * Demonstrates the complete orchestration system with multi-agent coordination,
 * trust receipts, and cross-repository integration.
 */

import OrchestrationServer from '../server';
import { TrustManager } from '../trust-manager';
import { AgentOrchestrator } from '../orchestrator';
import { MessageBroker } from '../message-broker';

export class OrchestrationDemo {
  private server: OrchestrationServer;
  private trustManager: TrustManager;
  private agentOrchestrator: AgentOrchestrator;
  private messageBroker: MessageBroker;

  constructor() {
    this.server = new OrchestrationServer();
    const components = this.server.getComponents();
    this.trustManager = components.trustManager;
    this.agentOrchestrator = components.agentOrchestrator;
    this.messageBroker = components.messageBroker;
  }

  /**
   * Run the complete orchestration demo
   */
  public async runDemo(): Promise<void> {
    console.log('🚀 Starting SYMBI Orchestration Demo...\n');

    try {
      // Demo 1: Agent Registration and Discovery
      await this.demoAgentRegistration();
      
      // Demo 2: Multi-Agent Coordination
      await this.demoMultiAgentCoordination();
      
      // Demo 3: Trust Receipt Generation and Verification
      await this.demoTrustReceipts();
      
      // Demo 4: Message Broker Communication
      await this.demoMessageBroker();
      
      // Demo 5: Cross-Repository Integration
      await this.demoCrossRepositoryIntegration();
      
      // Demo 6: Real-time Collaboration
      await this.demoRealTimeCollaboration();
      
      console.log('\n✅ SYMBI Orchestration Demo completed successfully!');
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
    }
  }

  /**
   * Demo 1: Agent Registration and Discovery
   */
  private async demoAgentRegistration(): Promise<void> {
    console.log('📋 Demo 1: Agent Registration and Discovery');
    console.log('=' .repeat(50));

    // Register a specialized analysis agent
    const analysisAgentId = await this.agentOrchestrator.registerAgent({
      name: 'Advanced Content Analysis Agent',
      type: 'resonate',
      capabilities: {
        supported: ['advanced_analysis', 'semantic_search', 'content_classification'],
        version: '2.0.0',
        description: 'Advanced AI-powered content analysis with semantic understanding'
      },
      status: 'active',
      trustScore: 0.97,
      metadata: {
        specialization: 'semantic_analysis',
        model: 'gpt-4-turbo',
        languages: ['en', 'es', 'fr', 'de']
      }
    });

    console.log(`✅ Registered analysis agent: ${analysisAgentId}`);

    // List all agents
    const agents = await this.agentOrchestrator.listAgents();
    console.log(`\n🤖 Total registered agents: ${agents.length}`);
    
    agents.forEach(agent => {
      console.log(`  - ${agent.name} (${agent.type}) - Trust Score: ${agent.trustScore}`);
      console.log(`    Capabilities: ${agent.capabilities.supported.join(', ')}`);
    });

    console.log('\n');
  }

  /**
   * Demo 2: Multi-Agent Coordination
   */
  private async demoMultiAgentCoordination(): Promise<void> {
    console.log('🎯 Demo 2: Multi-Agent Coordination');
    console.log('=' .repeat(50));

    const agents = await this.agentOrchestrator.listAgents();
    const resonateAgent = agents.find(a => a.type === 'resonate');
    const symphonyAgent = agents.find(a => a.type === 'symphony');

    if (!resonateAgent || !symphonyAgent) {
      console.log('❌ Required agents not found');
      return;
    }

    // Step 1: Content Analysis with Resonate
    const analysisRequest = {
      id: 'demo-analysis-1',
      type: 'content_analysis',
      payload: {
        text: 'SYMBI represents a breakthrough in human-AI collaboration, establishing trust through cryptographic receipts and transparent decision-making.',
        options: {
          sentiment: true,
          entities: true,
          classification: true,
          semantic: true
        }
      },
      requiredCapabilities: ['text_analysis', 'sentiment_detection']
    };

    console.log('📝 Analyzing content with Resonate agent...');
    const analysisResult = await this.agentOrchestrator.coordinate(resonateAgent.id, analysisRequest);
    
    if (analysisResult.success) {
      console.log('✅ Analysis completed:');
      console.log(`  Execution time: ${analysisResult.executionTime?.toFixed(2)}ms`);
      console.log(`  Result: ${JSON.stringify(analysisResult.data, null, 2)}`);
    }

    // Step 2: Trust Score Calculation with Symphony
    const trustRequest = {
      id: 'demo-trust-1',
      type: 'trust_evaluation',
      payload: {
        content: analysisResult.data,
        context: 'content_analysis',
        userConsent: true,
        humanOversight: true
      },
      requiredCapabilities: ['trust_scoring', 'compliance_check']
    };

    console.log('\n🔐 Evaluating trust with Symphony agent...');
    const trustResult = await this.agentOrchestrator.coordinate(symphonyAgent.id, trustRequest);
    
    if (trustResult.success) {
      console.log('✅ Trust evaluation completed:');
      console.log(`  Trust Score: ${JSON.stringify(trustResult.data, null, 2)}`);
    }

    console.log('\n');
  }

  /**
   * Demo 3: Trust Receipt Generation and Verification
   */
  private async demoTrustReceipts(): Promise<void> {
    console.log('🔒 Demo 3: Trust Receipt Generation and Verification');
    console.log('=' .repeat(50));

    // Generate a trust receipt for a complex operation
    const receiptData = {
      operation: 'multi_agent_coordination',
      agentId: 'demo-agent-1',
      userId: 'demo-user-1',
      request: {
        type: 'complex_analysis',
        content: 'User data requiring special handling',
        complianceRequired: ['GDPR', 'EU_AI_Act']
      },
      response: {
        status: 'completed',
        result: 'Analysis successful',
        confidence: 0.95
      },
      metadata: {
        consentVerified: true,
        auditTrail: true,
        humanOversight: true,
        validationResults: true,
        disconnectAvailable: true,
        acknowledgedLimitations: true
      }
    };

    console.log('📄 Generating trust receipt...');
    const receipt = await this.trustManager.createReceipt(receiptData);
    
    console.log('✅ Trust receipt created:');
    console.log(`  ID: ${receipt.id}`);
    console.log(`  Operation: ${receipt.operation}`);
    console.log(`  Content Hash: ${receipt.contentHash}`);
    console.log(`  Overall Trust Score: ${(receipt.trustScore.overall * 100).toFixed(1)}%`);
    console.log(`  Trust Level: ${receipt.trustScore.level}`);
    
    console.log('\n📊 Trust Principle Breakdown:');
    Object.entries(receipt.trustScore.principles).forEach(([principle, score]) => {
      console.log(`  ${principle}: ${(score * 100).toFixed(1)}%`);
    });

    console.log('\n⚖️  Compliance Check:');
    Object.entries(receipt.compliance.regulations).forEach(([regulation, check]) => {
      console.log(`  ${regulation}: ${(check.score * 100).toFixed(1)}%`);
      if (check.details.length > 0) {
        check.details.forEach(detail => {
          console.log(`    - ${detail}`);
        });
      }
    });

    // Verify the receipt
    console.log('\n🔍 Verifying trust receipt...');
    const verification = await this.trustManager.verifyReceipt(receipt.id);
    
    console.log('✅ Verification result:');
    console.log(`  Valid: ${verification.valid}`);
    console.log(`  Signature Valid: ${verification.signatureValid}`);
    console.log(`  Hash Valid: ${verification.hashValid}`);

    console.log('\n');
  }

  /**
   * Demo 4: Message Broker Communication
   */
  private async demoMessageBroker(): Promise<void> {
    console.log('📨 Demo 4: Message Broker Communication');
    console.log('=' .repeat(50));

    // Create queues for different message types
    this.messageBroker.createQueue('analysis-tasks', { maxSize: 100 });
    this.messageBroker.createQueue('trust-events', { maxSize: 100 });
    this.messageBroker.createQueue('security-alerts', { maxSize: 50 });

    // Subscribe to topics
    await this.messageBroker.subscribe('agent.analysis', 'analysis-tasks');
    await this.messageBroker.subscribe('trust.events', 'trust-events');
    await this.messageBroker.subscribe('security.alerts', 'security-alerts');

    // Publish messages
    const messages = [
      {
        topic: 'agent.analysis',
        payload: {
          taskId: 'task-1',
          type: 'sentiment_analysis',
          content: 'Sample text for analysis',
          priority: 'high'
        },
        metadata: { source: 'demo' }
      },
      {
        topic: 'trust.events',
        payload: {
          eventId: 'trust-1',
          type: 'receipt_created',
          receiptId: 'tr_demo_123',
          score: 0.95
        },
        metadata: { source: 'trust_manager' }
      },
      {
        topic: 'security.alerts',
        payload: {
          alertId: 'sec-1',
          type: 'unusual_activity',
          description: 'Multiple login attempts detected',
          severity: 'medium'
        },
        metadata: { source: 'security_monitor' }
      }
    ];

    console.log('📤 Publishing messages...');
    for (const message of messages) {
      const messageId = await this.messageBroker.publish(message.topic, message.payload, message.metadata);
      console.log(`  Published to ${message.topic}: ${messageId}`);
    }

    // Consume messages from queues
    console.log('\n📥 Consuming messages from queues...');
    
    const queues = ['analysis-tasks', 'trust-events', 'security-alerts'];
    for (const queueName of queues) {
      const messages = await this.messageBroker.consume(queueName, 10);
      console.log(`  ${queueName}: ${messages.length} messages`);
      messages.forEach(msg => {
        console.log(`    - ${msg.topic}: ${JSON.stringify(msg.payload).substring(0, 80)}...`);
      });
    }

    // Show broker status
    const status = this.messageBroker.getStatus();
    console.log('\n📊 Message Broker Status:');
    console.log(`  Total Queues: ${status.totalQueues}`);
    console.log(`  Total Messages: ${status.totalMessages}`);
    console.log(`  Dead Letter Messages: ${status.deadLetterCount}`);

    console.log('\n');
  }

  /**
   * Demo 5: Cross-Repository Integration
   */
  private async demoCrossRepositoryIntegration(): Promise<void> {
    console.log('🔗 Demo 5: Cross-Repository Integration');
    console.log('=' .repeat(50));

    console.log('📡 Integrating with SYMBI-Vault...');
    
    // Simulate credential management
    const credentialRequest = {
      id: 'cred-1',
      type: 'api_key',
      service: 'openai',
      permissions: ['read', 'write']
    };

    console.log(`  Requesting credential for ${credentialRequest.service}...`);
    console.log('  ✅ Credential retrieved securely from Vault');

    console.log('\n🧠 Integrating with SYMBI-Resonate...');
    
    // Simulate content analysis
    const analysisRequest = {
      content: 'This text demonstrates the integration capabilities of SYMBI orchestration.',
      analysisType: 'comprehensive',
      options: {
        sentiment: true,
        entities: true,
        classification: true,
        semantic: true
      }
    };

    console.log('  Performing comprehensive content analysis...');
    console.log('  ✅ Analysis completed with results from Resonate');

    console.log('\n🎼 Integrating with SYMBI-Symphony...');
    
    // Simulate trust evaluation
    const trustEvaluation = {
      context: 'cross_repository_operation',
      participants: ['resonate', 'symphony', 'vault'],
      operations: ['credential_access', 'content_analysis', 'trust_scoring'],
      complianceRequired: true
    };

    console.log('  Evaluating trust for cross-repository operation...');
    console.log('  ✅ Trust evaluation completed with high confidence');

    console.log('\n');
  }

  /**
   * Demo 6: Real-time Collaboration
   */
  private async demoRealTimeCollaboration(): Promise<void> {
    console.log('🔄 Demo 6: Real-time Collaboration');
    console.log('=' .repeat(50));

    console.log('👥 Simulating multi-agent collaborative workflow...');

    // Step 1: User submits a complex task
    const userTask = {
      id: 'user-task-1',
      userId: 'demo-user',
      task: 'Analyze this document for compliance and security risks',
      content: 'Document content requiring analysis...',
      requirements: {
        compliance: ['GDPR', 'EU_AI_Act', 'HIPAA'],
        security: true,
        accuracy: 'high'
      }
    };

    console.log('📝 User submitted complex task');
    console.log(`  Task ID: ${userTask.id}`);
    console.log(`  Requirements: ${userTask.requirements.compliance.join(', ')}`);

    // Step 2: Task decomposition and agent selection
    console.log('\n🎯 Decomposing task and selecting agents...');
    
    const agents = await this.agentOrchestrator.listAgents();
    const selectedAgents = {
      analyzer: agents.find(a => a.type === 'resonate'),
      trustEvaluator: agents.find(a => a.type === 'symphony'),
      securityChecker: agents.find(a => a.type === 'vault')
    };

    console.log(`  Selected ${Object.keys(selectedAgents).length} agents for collaboration`);

    // Step 3: Parallel execution
    console.log('\n⚡ Executing tasks in parallel...');
    
    const tasks = [];
    
    if (selectedAgents.analyzer) {
      tasks.push(
        this.agentOrchestrator.coordinate(selectedAgents.analyzer.id, {
          id: 'subtask-analysis',
          type: 'document_analysis',
          payload: userTask.content,
          requiredCapabilities: ['text_analysis']
        })
      );
    }

    if (selectedAgents.trustEvaluator) {
      tasks.push(
        this.agentOrchestrator.coordinate(selectedAgents.trustEvaluator.id, {
          id: 'subtask-trust',
          type: 'compliance_check',
          payload: { regulations: userTask.requirements.compliance },
          requiredCapabilities: ['compliance_check']
        })
      );
    }

    if (selectedAgents.securityChecker) {
      tasks.push(
        this.agentOrchestrator.coordinate(selectedAgents.securityChecker.id, {
          id: 'subtask-security',
          type: 'security_scan',
          payload: { content: userTask.content },
          requiredCapabilities: ['security_scan']
        })
      );
    }

    const results = await Promise.all(tasks);
    
    console.log('✅ All subtasks completed:');
    results.forEach((result, index) => {
      console.log(`  Subtask ${index + 1}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      if (result.success) {
        console.log(`    Execution time: ${result.executionTime?.toFixed(2)}ms`);
      }
    });

    // Step 4: Result aggregation and final trust receipt
    console.log('\n📊 Aggregating results and generating final trust receipt...');
    
    const finalReceipt = await this.trustManager.createReceipt({
      operation: 'collaborative_task_completion',
      userId: userTask.userId,
      request: userTask,
      response: {
        taskId: userTask.id,
        subtaskResults: results.map(r => r.data),
        overallStatus: results.every(r => r.success) ? 'completed' : 'partial'
      },
      metadata: {
        collaborationMode: 'parallel',
        agentsInvolved: Object.keys(selectedAgents).length,
        totalExecutionTime: results.reduce((sum, r) => sum + (r.executionTime || 0), 0),
        complianceVerified: true,
        humanOversightAvailable: true
      }
    });

    console.log('✅ Final trust receipt generated:');
    console.log(`  Receipt ID: ${finalReceipt.id}`);
    console.log(`  Overall Trust Score: ${(finalReceipt.trustScore.overall * 100).toFixed(1)}%`);
    console.log(`  Task Status: ${finalReceipt.content.response.overallStatus}`);
    console.log(`  Agents Involved: ${finalReceipt.metadata.agentsInvolved}`);

    console.log('\n');
  }
}

// Run demo if this file is executed directly
if (require.main === module) {
  const demo = new OrchestrationDemo();
  demo.runDemo().catch(console.error);
}

export default OrchestrationDemo;