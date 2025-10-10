import OpenAI from 'openai'
import { MessageEnvelope, MessageResponse, AgentManifest } from '../types/agent-types'
import { v4 as uuidv4 } from 'uuid'

export class OpenAIService {
  private client: OpenAI
  private agentAssistants: Map<string, string> = new Map() // agentId -> assistantId

  constructor(apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY
    })
  }

  /**
   * Create an OpenAI Assistant for an agent
   */
  async createAgentAssistant(manifest: AgentManifest): Promise<string> {
    try {
      const assistant = await this.client.beta.assistants.create({
        name: manifest.id.replace('_', ' ').toUpperCase(),
        description: `${manifest.persona} - Clearance: ${manifest.clearance}`,
        instructions: this.buildSystemPrompt(manifest),
        model: this.selectModel(manifest),
        tools: this.buildTools(manifest.capabilities),
        metadata: {
          agent_id: manifest.id,
          clearance: manifest.clearance,
          compartments: manifest.compartments?.join(',') || '',
          role: manifest.id
        }
      })

      this.agentAssistants.set(manifest.id, assistant.id)
      return assistant.id

    } catch (error) {
      console.error(`Failed to create assistant for agent ${manifest.id}:`, error)
      throw error
    }
  }

  /**
   * Process a message with the appropriate OpenAI agent
   */
  async processMessage(envelope: MessageEnvelope, agent: AgentManifest): Promise<MessageResponse> {
    try {
      // Get or create assistant for this agent
      let assistantId = this.agentAssistants.get(agent.id)
      if (!assistantId) {
        assistantId = await this.createAgentAssistant(agent)
      }

      // Create a thread for this conversation
      const thread = await this.client.beta.threads.create({
        metadata: {
          thread_id: envelope.thread_id,
          classification: envelope.classification,
          tlp: envelope.tlp
        }
      })

      // Add the message to the thread
      await this.client.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: this.formatMessageForAgent(envelope, agent)
      })

      // Run the assistant
      const run = await this.client.beta.threads.runs.create(thread.id, {
        assistant_id: assistantId,
        instructions: this.buildContextualInstructions(envelope, agent),
        metadata: {
          msg_id: envelope.msg_id,
          origin: envelope.origin,
          classification: envelope.classification
        }
      })

      // Wait for completion
      const completedRun = await this.waitForRunCompletion(thread.id, run.id)

      // Get the response
      const messages = await this.client.beta.threads.messages.list(thread.id)
      const assistantMessage = messages.data.find(msg => 
        msg.role === 'assistant' && 
        msg.created_at > (completedRun.created_at || 0)
      )

      if (!assistantMessage || !assistantMessage.content[0]) {
        throw new Error('No response from assistant')
      }

      const content = assistantMessage.content[0]
      const responseText = content.type === 'text' ? content.text.value : 'Non-text response'

      // Parse response for confidence and escalation flags
      const parsedResponse = this.parseAgentResponse(responseText, agent)

      // Build response envelope
      const response: MessageResponse = {
        msg_id: uuidv4(),
        response_to: envelope.msg_id,
        agent_id: agent.id,
        content: parsedResponse.content,
        confidence: parsedResponse.confidence,
        citations: parsedResponse.citations,
        escalation_required: parsedResponse.escalationRequired,
        next_actions: parsedResponse.nextActions,
        classification: envelope.classification,
        tlp: envelope.tlp,
        chain_of_custody: [
          ...envelope.chain_of_custody,
          {
            agent: agent.id,
            sig: '', // Will be signed by audit logger
            timestamp: new Date().toISOString()
          }
        ]
      }

      return response

    } catch (error) {
      console.error(`OpenAI processing error for agent ${agent.id}:`, error)
      
      // Return error response
      return {
        msg_id: uuidv4(),
        response_to: envelope.msg_id,
        agent_id: agent.id,
        content: `Error processing request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0,
        escalation_required: true,
        classification: envelope.classification,
        tlp: envelope.tlp,
        chain_of_custody: [
          ...envelope.chain_of_custody,
          {
            agent: agent.id,
            sig: '',
            timestamp: new Date().toISOString()
          }
        ]
      }
    }
  }

  /**
   * Build system prompt for agent
   */
  private buildSystemPrompt(manifest: AgentManifest): string {
    const basePrompt = `You are ${manifest.id.replace('_', ' ').toUpperCase()}, a tactical AI agent.

PERSONA: ${manifest.persona}

SECURITY CLEARANCE: ${manifest.clearance}
${manifest.compartments ? `COMPARTMENTS: ${manifest.compartments.join(', ')}` : ''}

CAPABILITIES: ${manifest.capabilities.join(', ')}

GUARDRAILS:
${manifest.guardrails.map(rule => `- ${rule}`).join('\n')}

OPERATIONAL GUIDELINES:
- Always maintain security protocols appropriate to your clearance level
- Provide confidence scores (0-1) for your assessments
- Cite sources when available
- Flag for escalation when confidence < 0.35 or when encountering conflicting information
- Follow chain of custody requirements
- Respect need-to-know principles

RESPONSE FORMAT:
Your responses should be structured as follows:
1. Executive Summary (2-3 sentences)
2. Detailed Analysis
3. Confidence Score: [0.0-1.0]
4. Sources/Citations (if applicable)
5. Recommended Actions
6. Escalation Flag: [YES/NO] with reason if yes

Remember: You are operating in a classified environment. Maintain operational security at all times.`

    return basePrompt
  }

  /**
   * Build contextual instructions for specific message
   */
  private buildContextualInstructions(envelope: MessageEnvelope, agent: AgentManifest): string {
    let instructions = `MISSION CONTEXT:
Purpose: ${envelope.purpose}
Classification: ${envelope.classification}
TLP: ${envelope.tlp}
Need-to-Know: ${envelope.need_to_know.join(', ')}

SPECIFIC INSTRUCTIONS:
${envelope.instructions}

`

    if (envelope.context_refs && envelope.context_refs.length > 0) {
      instructions += `CONTEXT REFERENCES:
${envelope.context_refs.map(ref => `- ${ref.type}: ${ref.id}`).join('\n')}

`
    }

    if (envelope.tools_allowed && envelope.tools_allowed.length > 0) {
      instructions += `AUTHORIZED TOOLS: ${envelope.tools_allowed.join(', ')}

`
    }

    if (envelope.slo) {
      instructions += `SERVICE LEVEL OBJECTIVES:
- Max Latency: ${envelope.slo.latency_s} seconds
- Cost Cap: $${envelope.slo.cost_cap_usd}

`
    }

    instructions += `Execute your analysis according to your role and capabilities. Maintain security protocols and provide a structured response.`

    return instructions
  }

  /**
   * Format message content for agent processing
   */
  private formatMessageForAgent(envelope: MessageEnvelope, agent: AgentManifest): string {
    return `[CLASSIFIED MESSAGE - ${envelope.classification}/${envelope.tlp}]

FROM: ${envelope.origin}
TO: ${envelope.target}
PURPOSE: ${envelope.purpose}
THREAD: ${envelope.thread_id}

INSTRUCTIONS:
${envelope.instructions}

${envelope.context_refs ? `
CONTEXT REFERENCES:
${envelope.context_refs.map(ref => `- ${ref.type}: ${ref.id}`).join('\n')}
` : ''}

[END MESSAGE]`
  }

  /**
   * Parse agent response for structured data
   */
  private parseAgentResponse(responseText: string, agent: AgentManifest): {
    content: string
    confidence?: number
    citations?: Array<{ source: string, confidence: number }>
    escalationRequired: boolean
    nextActions?: string[]
  } {
    // Extract confidence score
    const confidenceMatch = responseText.match(/Confidence Score:\s*([0-9.]+)/i)
    const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : undefined

    // Extract escalation flag
    const escalationMatch = responseText.match(/Escalation Flag:\s*(YES|NO)/i)
    const escalationRequired = escalationMatch ? escalationMatch[1].toUpperCase() === 'YES' : false

    // Extract recommended actions
    const actionsMatch = responseText.match(/Recommended Actions:?\s*\n((?:[-•]\s*.+\n?)*)/i)
    const nextActions = actionsMatch ? 
      actionsMatch[1].split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^[-•]\s*/, '').trim()) : undefined

    return {
      content: responseText,
      confidence,
      escalationRequired,
      nextActions
    }
  }

  /**
   * Select appropriate model based on agent requirements
   */
  private selectModel(manifest: AgentManifest): string {
    // Use GPT-4 for high-clearance agents or complex analysis
    if (manifest.clearance === 'TS' || manifest.capabilities.includes('analysis')) {
      return 'gpt-4-1106-preview'
    }
    
    // Use GPT-3.5 for routine operations
    return 'gpt-3.5-turbo-1106'
  }

  /**
   * Build tools array for agent capabilities
   */
  private buildTools(capabilities: string[]): any[] {
    const tools: any[] = []

    if (capabilities.includes('rag.search') || capabilities.includes('rag.retrieve')) {
      tools.push({
        type: 'function',
        function: {
          name: 'search_knowledge_base',
          description: 'Search the intelligence knowledge base for relevant information',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              classification_filter: { type: 'string', description: 'Filter by classification level' }
            },
            required: ['query']
          }
        }
      })
    }

    if (capabilities.includes('timeline.build')) {
      tools.push({
        type: 'function',
        function: {
          name: 'build_timeline',
          description: 'Create a timeline of events from available data',
          parameters: {
            type: 'object',
            properties: {
              start_date: { type: 'string', description: 'Start date for timeline' },
              end_date: { type: 'string', description: 'End date for timeline' },
              entities: { type: 'array', items: { type: 'string' }, description: 'Entities to track' }
            },
            required: ['start_date', 'end_date']
          }
        }
      })
    }

    return tools
  }

  /**
   * Wait for OpenAI run completion
   */
  private async waitForRunCompletion(threadId: string, runId: string, maxWaitTime = 30000): Promise<any> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < maxWaitTime) {
      // TODO: Fix OpenAI API call - using simplified approach for now
      const run = await this.client.beta.threads.runs.retrieve(threadId, runId)
      
      if (run.status === 'completed') {
        return run
      }
      
      if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
        throw new Error(`Run ${run.status}: ${run.last_error?.message || 'Unknown error'}`)
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    throw new Error('Run timed out')
  }

  /**
   * Get assistant for agent
   */
  getAssistantId(agentId: string): string | undefined {
    return this.agentAssistants.get(agentId)
  }

  /**
   * Update agent assistant
   */
  async updateAgentAssistant(manifest: AgentManifest): Promise<void> {
    const assistantId = this.agentAssistants.get(manifest.id)
    if (!assistantId) {
      throw new Error(`No assistant found for agent ${manifest.id}`)
    }

    await this.client.beta.assistants.update(assistantId, {
      name: manifest.id.replace('_', ' ').toUpperCase(),
      description: `${manifest.persona} - Clearance: ${manifest.clearance}`,
      instructions: this.buildSystemPrompt(manifest),
      tools: this.buildTools(manifest.capabilities),
      metadata: {
        agent_id: manifest.id,
        clearance: manifest.clearance,
        compartments: manifest.compartments?.join(',') || '',
        role: manifest.id
      }
    })
  }

  /**
   * Delete agent assistant
   */
  async deleteAgentAssistant(agentId: string): Promise<void> {
    const assistantId = this.agentAssistants.get(agentId)
    if (assistantId) {
      await this.client.beta.assistants.delete(assistantId)
      this.agentAssistants.delete(agentId)
    }
  }
}
