import { getMessageBus } from './message-bus-singleton'
import { PolicyEngine } from './policy-engine'
import { AuditLogger } from './audit-logger'
import { CostGovernor } from './cost-governor'
import { SYMBI_AGENT_SPECS } from './symbi-agents'
import { SymbiAgentSpec, SymbiMessage, SymbiMemoryNode } from '../types/symbi-types'

/**
 * SYMBI Integration Service
 * Manages the SYMBI agent network and provides tactical coordination
 */
export class SymbiIntegrationService {
  private policyEngine: PolicyEngine
  private auditLogger: AuditLogger
  private costGovernor: CostGovernor
  private agents: Map<string, SymbiAgentSpec> = new Map()
  private memoryNodes: Map<string, SymbiMemoryNode> = new Map()

  constructor(
    policyEngine: PolicyEngine,
    auditLogger: AuditLogger,
    costGovernor: CostGovernor
  ) {
    this.policyEngine = policyEngine
    this.auditLogger = auditLogger
    this.costGovernor = costGovernor
  }

  /**
   * Initialize the SYMBI agent network
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing SYMBI tactical agent network...')
    
    const messageBus = getMessageBus()
    
    // Register all SYMBI agents
    for (const [agentId, spec] of Object.entries(SYMBI_AGENT_SPECS)) {
      this.agents.set(agentId, spec)
      
      // Register with message bus
      await messageBus.registerAgent({
        id: agentId,
        persona: agentId.replace('_', ' '),
        capabilities: spec.capabilities,
        clearance: spec.clearance,
        compartments: spec.compartments || [],
        memory_partition: spec.memoryPartition,
        rate_limits: spec.rateLimits,
        guardrails: spec.guardrails,
        handoffs: spec.handoffs,
        status: spec.status
      })
      
      console.log(`✅ Registered SYMBI agent: ${agentId}`)
    }
    
    // Set up message routing
    await this.setupMessageRouting()
    
    console.log('✅ SYMBI tactical agent network initialized')
  }

  /**
   * Set up message routing between agents
   */
  private async setupMessageRouting(): Promise<void> {
    const messageBus = getMessageBus()
    messageBus.on('message', async (message: SymbiMessage) => {
      await this.routeMessage(message)
    })
  }

  /**
   * Route messages between agents based on SYMBI specifications
   */
  private async routeMessage(message: SymbiMessage): Promise<void> {
    const targetAgent = this.agents.get(message.to)
    
    if (!targetAgent) {
      await this.auditLogger.log({
        level: 'error',
        source: 'symbi-integration',
        action: 'route_message',
        details: `Unknown target agent: ${message.to}`,
        timestamp: new Date()
      })
      return
    }

    // Check clearance and compartments
    const canAccess = await this.policyEngine.checkAccess(
      message.from,
      targetAgent.clearance,
      targetAgent.compartments || []
    )

    if (!canAccess) {
      await this.auditLogger.log({
        level: 'warning',
        source: 'symbi-integration',
        action: 'access_denied',
        details: `Access denied for ${message.from} to ${message.to}`,
        timestamp: new Date()
      })
      return
    }

    // Check rate limits
    const withinLimits = await this.costGovernor.checkRateLimit(
      message.from,
      targetAgent.rateLimits
    )

    if (!withinLimits) {
      await this.auditLogger.log({
        level: 'warning',
        source: 'symbi-integration',
        action: 'rate_limit_exceeded',
        details: `Rate limit exceeded for ${message.from}`,
        timestamp: new Date()
      })
      return
    }

    const messageBus = getMessageBus()
    // Route the message
    await messageBus.sendMessage({
      from: message.from,
      to: message.to,
      content: message.payload,
      type: message.type,
      classification: message.classification,
      compartments: message.compartments
    })
  }

  /**
   * Create a memory node for tactical intelligence
   */
  async createMemoryNode(node: SymbiMemoryNode): Promise<void> {
    this.memoryNodes.set(node.id, node)
    
    await this.auditLogger.log({
      level: 'info',
      source: 'symbi-integration',
      action: 'create_memory_node',
      details: `Created memory node: ${node.id}`,
      timestamp: new Date()
    })
  }

  /**
   * Get agent status
   */
  getAgentStatus(agentId: string): any {
    const agent = this.agents.get(agentId)
    if (!agent) return null
    
    return {
      agentId,
      status: agent.status,
      capabilities: agent.capabilities,
      clearance: agent.clearance,
      compartments: agent.compartments
    }
  }

  /**
   * Get all active agents
   */
  getActiveAgents(): string[] {
    return Array.from(this.agents.keys()).filter(id => {
      const agent = this.agents.get(id)
      return agent?.status === 'active'
    })
  }

  /**
   * Send tactical command
   */
  async sendTacticalCommand(command: {
    from: string
    to: string
    action: string
    parameters: any
    classification: string
    compartments: string[]
  }): Promise<void> {
    const message: SymbiMessage = {
      id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: command.from,
      to: command.to,
      type: 'command',
      payload: {
        action: command.action,
        parameters: command.parameters
      },
      classification: command.classification,
      compartments: command.compartments,
      timestamp: new Date().toISOString(),
      chainOfCustody: [command.from]
    }

    await this.routeMessage(message)
  }

  /**
   * Query tactical intelligence
   */
  async queryIntelligence(query: {
    from: string
    to: string
    question: string
    context: any
    classification: string
    compartments: string[]
  }): Promise<any> {
    const message: SymbiMessage = {
      id: `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: query.from,
      to: query.to,
      type: 'query',
      payload: {
        question: query.question,
        context: query.context
      },
      classification: query.classification,
      compartments: query.compartments,
      timestamp: new Date().toISOString(),
      chainOfCustody: [query.from]
    }

    await this.routeMessage(message)
    
    // Return promise that resolves when response is received
    const messageBus = getMessageBus()
    return new Promise((resolve) => {
      const handler = (response: any) => {
        if (response.inReplyTo === message.id) {
          messageBus.off('message', handler)
          resolve(response.payload)
        }
      }
      messageBus.on('message', handler)
    })
  }
}

// Export singleton instance
let symbiService: SymbiIntegrationService | null = null

export async function initializeSymbiService(
  policyEngine: PolicyEngine,
  auditLogger: AuditLogger,
  costGovernor: CostGovernor
): Promise<SymbiIntegrationService> {
  if (!symbiService) {
    symbiService = new SymbiIntegrationService(
      policyEngine,
      auditLogger,
      costGovernor
    )
    await symbiService.initialize()
  }
  return symbiService
}

export function getSymbiService(): SymbiIntegrationService | null {
  return symbiService
}
