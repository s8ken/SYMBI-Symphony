/**
 * Example usage of the SYMBI Vault & Tactical Command integration
 */

import { TrustOracleBridge } from './trust-oracle-bridge';
import { UnifiedAgentOrchestrator } from './unified-agent-orchestrator';
<<<<<<< HEAD
import { SymbiOrchestrator } from '../core/agent/orchestrator';
import { SymbiIntegrationService } from '../../Tactical Command/lib/services/symbi-integration';
=======
import { AgentOrchestrator as SymbiOrchestrator } from '../stubs/orchestrator';
>>>>>>> origin/feature/symbi-vault-tactical-integration

// Initialize integration components
const trustOracleBridge = new TrustOracleBridge();

// In a real implementation, you would initialize these with proper configurations
// const symphonyOrchestrator = new SymbiOrchestrator(config);
// const tacticalService = new SymbiIntegrationService(policyEngine, auditLogger, costGovernor);
// const unifiedOrchestrator = new UnifiedAgentOrchestrator(symphonyOrchestrator, tacticalService);

/**
 * Example 1: Evaluating an agent action
 */
async function evaluateAgentAction() {
  const context = {
    agentId: 'intelligence_analyst',
    action: 'data_export',
    scopes: ['data.export', 'analytics.detailed'],
    data: {
      classification: 'sensitive',
      content: 'Detailed analysis of user behavior patterns'
    }
  };

  try {
    const evaluation = await trustOracleBridge.evaluateAgentAction(context);
    console.log('Trust Evaluation Result:', evaluation);
    
    // Based on the evaluation, decide whether to proceed
    if (evaluation.recommendation === 'block') {
      console.log('❌ Action blocked due to constitutional violation');
      return false;
    } else if (evaluation.recommendation === 'restrict') {
      console.log('⚠️ Action restricted - applying limitations');
      // Apply restrictions
    } else {
      console.log('✅ Action approved - proceeding with execution');
    }
    
    return true;
  } catch (error) {
    console.error('Trust evaluation failed:', error);
    return false;
  }
}

/**
 * Example 2: Updating agent trust score after task completion
 */
async function updateAgentTrustScore() {
  const evaluation = {
    id: 'eval_12345',
    timestamp: new Date(),
    score: 92,
    recommendation: 'allow' as const,
    passedArticles: [
      { articleId: 'A1', title: 'Consent-First Data Use', severity: 'high', status: 'pass' },
      { articleId: 'A3', title: 'Transparent Capability Disclosure', severity: 'medium', status: 'pass' }
    ],
    warnings: [],
    violations: [],
    evidence: []
  };

  try {
    await trustOracleBridge.updateAgentTrustScore('intelligence_analyst', evaluation);
    console.log('✅ Agent trust score updated successfully');
  } catch (error) {
    console.error('Failed to update agent trust score:', error);
  }
}

/**
 * Example 3: Getting constitutional compliance report
 */
async function getAgentComplianceReport() {
  try {
    const report = await trustOracleBridge.getConstitutionalCompliance('cybersecurity_sentinel');
    console.log('Constitutional Compliance Report:', report);
    
    // Display key metrics
    console.log(`Overall Trust Score: ${report.overallScore}% (${report.trustBand})`);
    console.log(`Total Violations: ${report.violationSummary.total}`);
    console.log(`Recent Violations (30d): ${report.violationSummary.recent30Days}`);
    
    // Show compliance by article
    Object.entries(report.articleCompliance).forEach(([article, compliance]) => {
      console.log(`${article}: ${compliance.score}% (${compliance.violations} violations)`);
    });
  } catch (error) {
    console.error('Failed to retrieve compliance report:', error);
  }
}

/**
 * Example 4: Monitoring agents for violations
 */
async function monitorAgentCompliance() {
  try {
    const alerts = await trustOracleBridge.monitorAgentCompliance('field_commander');
    
    if (alerts.length > 0) {
      console.log(`⚠️ ${alerts.length} compliance alerts detected:`);
      alerts.forEach(alert => {
        console.log(`- ${alert.title} (${alert.severity})`);
        console.log(`  ${alert.description}`);
        console.log(`  Recommended actions: ${alert.recommendedActions.join(', ')}`);
      });
    } else {
      console.log('✅ No compliance alerts for agent');
    }
  } catch (error) {
    console.error('Failed to monitor agent compliance:', error);
  }
}

/**
 * Example 5: Unified agent registration
 */
async function registerUnifiedAgent() {
  const config = {
    id: 'new_tactical_agent',
    name: 'New Tactical Agent',
    type: 'tactical',
    capabilities: ['data_analysis', 'report_generation'],
    permissions: ['read', 'write'],
    tacticalSpec: {
      clearance: 'S',
      compartments: ['SCI:ALTAIR'],
      rateLimits: { rpm: 60, tpm: 100000 }
    }
  };

  try {
    // In a real implementation:
    // await unifiedOrchestrator.registerUnifiedAgent(config);
    console.log(`✅ Unified agent ${config.id} registered successfully`);
  } catch (error) {
    console.error(`Failed to register unified agent ${config.id}:`, error);
  }
}

// Execute examples
async function runExamples() {
  console.log('=== SYMBI Integration Examples ===\n');
  
  console.log('1. Evaluating agent action...');
  await evaluateAgentAction();
  
  console.log('\n2. Updating agent trust score...');
  await updateAgentTrustScore();
  
  console.log('\n3. Getting compliance report...');
  await getAgentComplianceReport();
  
  console.log('\n4. Monitoring agent compliance...');
  await monitorAgentCompliance();
  
  console.log('\n5. Registering unified agent...');
  await registerUnifiedAgent();
  
  console.log('\n=== All examples completed ===');
}

// Run the examples
runExamples().catch(console.error);

export {
  evaluateAgentAction,
  updateAgentTrustScore,
  getAgentComplianceReport,
  monitorAgentCompliance,
  registerUnifiedAgent
};