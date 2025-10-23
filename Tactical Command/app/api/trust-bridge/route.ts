import { NextRequest, NextResponse } from 'next/server';
import { TrustOracleBridge } from '../../../../../src/integration/trust-oracle-bridge';

/**
 * Trust Bridge API Route
 * Connects SYMBI Vault's TrustOracle with Tactical Command interface
 */

const trustOracleBridge = new TrustOracleBridge();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, agentId, context } = body;

    switch (action) {
      case 'evaluate_action':
        // Evaluate an agent action against constitutional principles
        const evaluation = await trustOracleBridge.evaluateAgentAction({
          agentId,
          action: context.action,
          scopes: context.scopes,
          data: context.data
        });
        
        return NextResponse.json({
          success: true,
          evaluation,
          timestamp: new Date().toISOString()
        });

      case 'update_trust_score':
        // Update agent trust score based on evaluation
        await trustOracleBridge.updateAgentTrustScore(agentId, context.evaluation);
        
        return NextResponse.json({
          success: true,
          message: `Trust score updated for agent ${agentId}`,
          timestamp: new Date().toISOString()
        });

      case 'get_compliance_report':
        // Get constitutional compliance report for an agent
        const report = await trustOracleBridge.getConstitutionalCompliance(agentId);
        
        return NextResponse.json({
          success: true,
          report,
          timestamp: new Date().toISOString()
        });

      case 'monitor_compliance':
        // Monitor agent for constitutional violations
        const alerts = await trustOracleBridge.monitorAgentCompliance(agentId);
        
        return NextResponse.json({
          success: true,
          alerts,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid action. Supported actions: evaluate_action, update_trust_score, get_compliance_report, monitor_compliance' 
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Trust bridge API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const agentId = searchParams.get('agentId');
    const timeRange = searchParams.get('timeRange') || '7d';

    switch (action) {
      case 'trust_statistics':
        // Get overall trust statistics
        const stats = await trustOracleBridge.getTrustStatistics(timeRange);
        
        return NextResponse.json({
          success: true,
          statistics: stats,
          timestamp: new Date().toISOString()
        });

      case 'agent_status':
        // Get specific agent trust status
        if (!agentId) {
          return NextResponse.json(
            { success: false, error: 'agentId parameter required' },
            { status: 400 }
          );
        }
        
        const compliance = await trustOracleBridge.getConstitutionalCompliance(agentId);
        
        return NextResponse.json({
          success: true,
          agentId,
          compliance,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: true,
          message: 'SYMBI Trust Bridge API is operational',
          endpoints: [
            'POST /api/trust-bridge - Evaluate actions, update scores, get reports',
            'GET /api/trust-bridge?action=trust_statistics - Get trust statistics',
            'GET /api/trust-bridge?action=agent_status&agentId=AGENT_ID - Get agent compliance'
          ],
          timestamp: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Trust bridge API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}