import { v4 as uuidv4 } from 'uuid'
import { MessageEnvelope, MessageResponse, AgentManifest, AuditLogEntry, ClassificationLevel, TLPLevel } from '../types/agent-types'
import { PolicyEngine } from './policy-engine'
import { AuditLogger } from './audit-logger'
import { CostGovernor } from './cost-governor'

export class MessageBus {
  private agents: Map<string, AgentManifest> = new Map()
  private routingTable: Map<string, string[]> = new Map()
  private policyEngine: PolicyEngine
  private auditLogger: AuditLogger
  private costGovernor: CostGovernor
  private messageQueue: MessageEnvelope[] = []
  private activeThreads: Map<string, MessageEnvelope[]> = new Map()

  constructor() {
    this.policyEngine = new PolicyEngine()
    this.auditLogger = new AuditLogger()
    this.costGovernor = new CostGovernor()
    this.initializeDefaultRouting()
  }

  private initializeDefaultRouting() {
    // Default routing: all messages go through Overseer first
    this.routingTable.set('*', ['overseer'])
    this.routingTable.set('overseer', [
      'intel_analyst',
      'field_commander', 
      'cyber_security',
      'red_team',
      'osint_harvester',
      'logistics',
      'protocol_officer',
      'negotiator'
    ])
  }

  /**
   * Register an agent with the message bus
   */
  async registerAgent(manifest: AgentManifest): Promise<void> {
    // Validate manifest
    if (!this.validateAgentManifest(manifest)) {
      throw new Error(`Invalid agent manifest for ${manifest.id}`)
    }

    // Check clearance authorization
    if (!this.policyEngine.validateClearance(manifest.clearance, manifest.compartments)) {
      throw new Error(`Insufficient clearance for agent ${manifest.id}`)
    }

    this.agents.set(manifest.id, manifest)
    
    // Log registration
    await this.auditLogger.log({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      event_type: 'agent_created',
      agent_id: manifest.id,
      classification: manifest.clearance,
      details: { manifest },
      signature: await this.auditLogger.sign({ agent_id: manifest.id, action: 'register' })
    })

    console.log(`Agent ${manifest.id} registered successfully`)
  }

  /**
   * Send a message through the bus
   */
  async sendMessage(envelope: MessageEnvelope): Promise<MessageResponse> {
    // Validate message envelope
    if (!this.validateMessageEnvelope(envelope)) {
      throw new Error(`Invalid message envelope: ${envelope.msg_id}`)
    }

    // Policy checks
    const policyResult = await this.policyEngine.checkMessage(envelope)
    if (!policyResult.allowed) {
      await this.auditLogger.log({
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        event_type: 'policy_violation',
        agent_id: envelope.origin,
        message_id: envelope.msg_id,
        classification: envelope.classification,
        details: { violation: policyResult.reason },
        signature: await this.auditLogger.sign({ msg_id: envelope.msg_id, violation: policyResult.reason })
      })
      throw new Error(`Policy violation: ${policyResult.reason}`)
    }

    // Cost/latency governance
    const costCheck = await this.costGovernor.checkLimits(envelope)
    if (!costCheck.allowed) {
      throw new Error(`Cost/latency limits exceeded: ${costCheck.reason}`)
    }

    // Route message
    const targetAgent = this.agents.get(envelope.target)
    if (!targetAgent) {
      throw new Error(`Target agent not found: ${envelope.target}`)
    }

    // Add to thread tracking
    if (!this.activeThreads.has(envelope.thread_id)) {
      this.activeThreads.set(envelope.thread_id, [])
    }
    this.activeThreads.get(envelope.thread_id)!.push(envelope)

    // Log message
    await this.auditLogger.log({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      event_type: 'message_sent',
      agent_id: envelope.origin,
      message_id: envelope.msg_id,
      classification: envelope.classification,
      details: { target: envelope.target, purpose: envelope.purpose },
      signature: await this.auditLogger.sign({ msg_id: envelope.msg_id, origin: envelope.origin })
    })

    // Process message (this would integrate with OpenAI)
    const response = await this.processMessage(envelope, targetAgent)

    // Log response
    await this.auditLogger.log({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      event_type: 'message_received',
      agent_id: envelope.target,
      message_id: response.msg_id,
      classification: response.classification,
      details: { response_to: envelope.msg_id },
      signature: await this.auditLogger.sign({ msg_id: response.msg_id, agent: envelope.target })
    })

    return response
  }

  /**
   * Process message with target agent (OpenAI integration point)
   */
  private async processMessage(envelope: MessageEnvelope, agent: AgentManifest): Promise<MessageResponse> {
    // This is where we'll integrate with OpenAI
    // For now, return a mock response
    const newCustodyEntry = {
      agent: agent.id,
      sig: await this.auditLogger.sign({ msg_id: envelope.msg_id, agent: agent.id }),
      timestamp: new Date().toISOString()
    }

    const response: MessageResponse = {
      msg_id: uuidv4(),
      response_to: envelope.msg_id,
      agent_id: agent.id,
      content: `Processing request: ${envelope.instructions}`,
      confidence: 0.85,
      escalation_required: false,
      classification: envelope.classification,
      tlp: envelope.tlp,
      chain_of_custody: [
        ...envelope.chain_of_custody,
        newCustodyEntry
      ]
    }

    return response
  }

  /**
   * Route message to appropriate agent based on intent
   */
  private routeMessage(envelope: MessageEnvelope): string {
    // Simple routing logic - can be enhanced with ML-based intent detection
    const purpose = envelope.purpose.toLowerCase()
    
    if (purpose.includes('intel') || purpose.includes('analysis')) {
      return 'intel_analyst'
    }
    if (purpose.includes('cyber') || purpose.includes('security')) {
      return 'cyber_security'
    }
    if (purpose.includes('ops') || purpose.includes('mission')) {
      return 'field_commander'
    }
    if (purpose.includes('osint') || purpose.includes('collection')) {
      return 'osint_harvester'
    }
    
    // Default to overseer for routing decisions
    return 'overseer'
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): AgentManifest | undefined {
    return this.agents.get(agentId)
  }

  /**
   * List all registered agents
   */
  listAgents(): AgentManifest[] {
    return Array.from(this.agents.values())
  }

  /**
   * Get thread history
   */
  getThreadHistory(threadId: string): MessageEnvelope[] {
    return this.activeThreads.get(threadId) || []
  }

  /**
   * Validate message envelope
   */
  private validateMessageEnvelope(envelope: MessageEnvelope): boolean {
    try {
      // Check required fields
      if (!envelope.msg_id || !envelope.origin || !envelope.target) {
        return false
      }

      // Validate classification levels
      if (!this.isValidClassification(envelope.classification)) {
        return false
      }

      // Check agent exists
      if (!this.agents.has(envelope.origin)) {
        return false
      }

      return true
    } catch (error) {
      console.error('Message validation error:', error)
      return false
    }
  }

  /**
   * Validate agent manifest
   */
  private validateAgentManifest(manifest: AgentManifest): boolean {
    try {
      // Check required fields
      if (!manifest.id || !manifest.persona || !manifest.clearance) {
        return false
      }

      // Validate clearance
      if (!this.isValidClassification(manifest.clearance)) {
        return false
      }

      return true
    } catch (error) {
      console.error('Manifest validation error:', error)
      return false
    }
  }

  /**
   * Check if classification level is valid
   */
  private isValidClassification(level: ClassificationLevel): boolean {
    return ['U', 'C', 'S', 'TS'].includes(level)
  }

  /**
   * Create a new message envelope
   */
  createMessage(params: {
    origin: string
    target: string
    classification: ClassificationLevel
    tlp: TLPLevel
    purpose: string
    instructions: string
    needToKnow?: string[]
    compartments?: string[]
    contextRefs?: Array<{ type: 'mem' | 'doc' | 'url', id: string }>
    toolsAllowed?: string[]
    slo?: { latency_s: number, cost_cap_usd: number }
  }): MessageEnvelope {
    const threadId = uuidv4()
    
    return {
      msg_id: uuidv4(),
      thread_id: threadId,
      ts: new Date().toISOString(),
      origin: params.origin,
      target: params.target,
      classification: params.classification,
      compartments: params.compartments,
      tlp: params.tlp,
      need_to_know: params.needToKnow || [],
      purpose: params.purpose,
      instructions: params.instructions,
      context_refs: params.contextRefs,
      tools_allowed: params.toolsAllowed,
      slo: params.slo,
      chain_of_custody: [{
        agent: params.origin,
        sig: '', // Will be signed by audit logger
        timestamp: new Date().toISOString()
      }]
    }
  }
}
