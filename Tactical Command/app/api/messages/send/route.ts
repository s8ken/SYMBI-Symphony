import { NextRequest, NextResponse } from 'next/server'
import { getMessageBus } from '@/lib/services/message-bus-singleton'
import { MessageEnvelopeSchema } from '@/lib/types/agent-types'

// Use the shared singleton instance
const messageBus = getMessageBus()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the message envelope
    const validationResult = MessageEnvelopeSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid message envelope', 
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
    }

    const envelope = validationResult.data

    // Send the message through the bus
    const response = await messageBus.sendMessage(envelope)

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      response: {
        msg_id: response.msg_id,
        response_to: response.response_to,
        agent_id: response.agent_id,
        content: response.content,
        confidence: response.confidence,
        escalation_required: response.escalation_required,
        classification: response.classification,
        tlp: response.tlp
      }
    })

  } catch (error) {
    console.error('Message sending error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper endpoint to create a message envelope
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      origin,
      target,
      classification,
      tlp,
      purpose,
      instructions,
      needToKnow,
      compartments,
      contextRefs,
      toolsAllowed,
      slo
    } = body

    // Validate required fields
    if (!origin || !target || !classification || !tlp || !purpose || !instructions) {
      return NextResponse.json(
        { error: 'Missing required fields: origin, target, classification, tlp, purpose, instructions' },
        { status: 400 }
      )
    }

    // Create message envelope
    const envelope = messageBus.createMessage({
      origin,
      target,
      classification,
      tlp,
      purpose,
      instructions,
      needToKnow,
      compartments,
      contextRefs,
      toolsAllowed,
      slo
    })

    return NextResponse.json({
      success: true,
      envelope
    })

  } catch (error) {
    console.error('Message creation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create message envelope',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
