import { NextRequest, NextResponse } from 'next/server'
import { getMessageBus } from '@/lib/services/message-bus-singleton'
import { AgentManifestSchema } from '@/lib/types/agent-types'

// Use the shared singleton instance
const messageBus = getMessageBus()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the agent manifest
    const validationResult = AgentManifestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid agent manifest', 
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
    }

    const manifest = validationResult.data

    // Register the agent
    await messageBus.registerAgent(manifest)

    return NextResponse.json({
      success: true,
      message: `Agent ${manifest.id} registered successfully`,
      agent: {
        id: manifest.id,
        status: manifest.status,
        clearance: manifest.clearance,
        capabilities: manifest.capabilities
      }
    })

  } catch (error) {
    console.error('Agent registration error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to register agent',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const agents = messageBus.listAgents()
    
    return NextResponse.json({
      success: true,
      agents: agents.map(agent => ({
        id: agent.id,
        status: agent.status,
        clearance: agent.clearance,
        capabilities: agent.capabilities,
        memory_partition: agent.memory_partition,
        rate_limits: agent.rate_limits
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
