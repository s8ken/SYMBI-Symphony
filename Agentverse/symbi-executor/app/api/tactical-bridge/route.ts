import { NextRequest, NextResponse } from 'next/server';

/**
 * Tactical Command Interface Bridge API
 * 
 * This endpoint provides a bridge between AgentVerse and tactical-command-interface,
 * allowing AgentVerse agents to directly communicate with the tactical system's
 * RAG endpoints and trust receipt verification.
 */

const TACTICAL_BASE_URL = process.env.TACTICAL_BASE_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json();

    let response;
    
    switch (action) {
      case 'rag_query':
        // Forward RAG query to tactical-command-interface
        response = await fetch(`${TACTICAL_BASE_URL}/api/rag/retrieve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.TACTICAL_API_KEY || ''}`,
          },
          body: JSON.stringify({
            query: params.query,
            top_k: params.top_k || 6,
            threshold: params.threshold || 0.7,
          }),
        });
        break;

      case 'verify_receipt':
        // Forward trust receipt verification to tactical-command-interface
        response = await fetch(`${TACTICAL_BASE_URL}/api/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.TACTICAL_API_KEY || ''}`,
          },
          body: JSON.stringify({
            intent: {
              tool: 'rag.query',
              args: {
                q: params.receipt_query,
                top_k: 3,
              },
            },
            receipt_stub: params.receipt_stub,
          }),
        });
        break;

      case 'health_check':
        // Check tactical-command-interface health
        response = await fetch(`${TACTICAL_BASE_URL}/health`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.TACTICAL_API_KEY || ''}`,
          },
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: rag_query, verify_receipt, health_check' },
          { status: 400 }
        );
    }

    if (!response.ok) {
      throw new Error(`Tactical API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      action,
      data,
      bridge_info: {
        source: 'AgentVerse-symbi-executor',
        target: 'tactical-command-interface',
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Tactical bridge error:', error);
    return NextResponse.json(
      { 
        error: 'Bridge communication failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        bridge_info: {
          source: 'AgentVerse-symbi-executor',
          target: 'tactical-command-interface',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Health check endpoint for the bridge itself
  return NextResponse.json({
    status: 'healthy',
    bridge: 'AgentVerse <-> tactical-command-interface',
    timestamp: new Date().toISOString(),
    endpoints: {
      rag_query: 'POST with { action: "rag_query", query: string, top_k?: number }',
      verify_receipt: 'POST with { action: "verify_receipt", receipt_query: string, receipt_stub: object }',
      health_check: 'POST with { action: "health_check" }',
    },
  });
}