import { NextRequest, NextResponse } from 'next/server'
import { getMessageBus } from '@/lib/services/message-bus-singleton'

export async function GET(request: NextRequest) {
  try {
    // Get the shared message bus instance
    const messageBus = getMessageBus()
    
    // Test that we can access agents registered from other routes
    const agents = messageBus.listAgents()
    
    return NextResponse.json({
      success: true,
      message: 'Shared MessageBus instance test',
      agentCount: agents.length,
      agents: agents.map(agent => ({
        id: agent.id,
        persona: agent.persona,
        clearance: agent.clearance
      }))
    })
  } catch (error) {
    console.error('Error testing shared MessageBus:', error)
    return NextResponse.json(
      { error: 'Failed to test shared MessageBus' },
      { status: 500 }
    )
  }
}
