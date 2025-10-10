import { NextRequest, NextResponse } from 'next/server'
import { getMessageBus } from '@/lib/services/message-bus-singleton'

// Use the shared singleton instance
const messageBus = getMessageBus()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const clearance = searchParams.get('clearance')
    
    let agents = messageBus.listAgents()

    // Filter by status if provided
    if (status) {
      agents = agents.filter(agent => agent.status === status)
    }

    // Filter by clearance if provided
    if (clearance) {
      agents = agents.filter(agent => agent.clearance === clearance)
    }

    return NextResponse.json({
      success: true,
      count: agents.length,
      agents: agents.map(agent => ({
        id: agent.id,
        persona: agent.persona,
        status: agent.status,
        clearance: agent.clearance,
        capabilities: agent.capabilities,
        memory_partition: agent.memory_partition,
        rate_limits: agent.rate_limits,
        compartments: agent.compartments,
        guardrails: agent.guardrails,
        handoffs: agent.handoffs,
        openai_agent_id: agent.openai_agent_id
      }))
    })

  } catch (error) {
    console.error('Error listing agents:', error)
    return NextResponse.json(
      { 
        error: 'Failed to list agents',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
