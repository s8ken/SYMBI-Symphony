import { MessageEnvelope, AgentManifest, ClassificationLevel } from '../types/agent-types'

export interface PolicyResult {
  allowed: boolean
  reason?: string
}

export class PolicyEngine {
  private policies: Map<string, (envelope: MessageEnvelope) => PolicyResult> = new Map()

  constructor() {
    this.initializeDefaultPolicies()
  }

  private initializeDefaultPolicies() {
    // Classification level enforcement
    this.policies.set('classification_check', (envelope) => {
      const classificationLevels = { 'U': 0, 'C': 1, 'S': 2, 'TS': 3 }
      const originAgent = this.getAgentClearance(envelope.origin)
      const targetAgent = this.getAgentClearance(envelope.target)
      
      if (!originAgent || !targetAgent) {
        return { allowed: false, reason: 'Agent clearance not found' }
      }

      const messageLevel = classificationLevels[envelope.classification]
      const originLevel = classificationLevels[originAgent]
      const targetLevel = classificationLevels[targetAgent]

      if (originLevel < messageLevel || targetLevel < messageLevel) {
        return { allowed: false, reason: 'Insufficient clearance for message classification' }
      }

      return { allowed: true }
    })

    // Compartment access control
    this.policies.set('compartment_check', (envelope) => {
      if (!envelope.compartments || envelope.compartments.length === 0) {
        return { allowed: true }
      }

      // Check if both origin and target have required compartments
      const originCompartments = this.getAgentCompartments(envelope.origin)
      const targetCompartments = this.getAgentCompartments(envelope.target)

      for (const compartment of envelope.compartments) {
        if (!originCompartments.includes(compartment) || !targetCompartments.includes(compartment)) {
          return { allowed: false, reason: `Missing compartment access: ${compartment}` }
        }
      }

      return { allowed: true }
    })

    // Need-to-know enforcement
    this.policies.set('need_to_know_check', (envelope) => {
      if (!envelope.need_to_know || envelope.need_to_know.length === 0) {
        return { allowed: true }
      }

      // Check if target agent has need-to-know for this information
      const targetNTK = this.getAgentNeedToKnow(envelope.target)
      
      for (const ntk of envelope.need_to_know) {
        if (!targetNTK.includes(ntk)) {
          return { allowed: false, reason: `Target agent lacks need-to-know: ${ntk}` }
        }
      }

      return { allowed: true }
    })

    // TLP (Traffic Light Protocol) enforcement
    this.policies.set('tlp_check', (envelope) => {
      const tlpLevels = { 'WHITE': 0, 'GREEN': 1, 'AMBER': 2, 'RED': 3 }
      const messageLevel = tlpLevels[envelope.tlp]
      
      // RED: No sharing outside organization
      if (envelope.tlp === 'RED') {
        if (!this.isInternalAgent(envelope.target)) {
          return { allowed: false, reason: 'TLP:RED - No external sharing allowed' }
        }
      }

      // AMBER: Limited sharing
      if (envelope.tlp === 'AMBER') {
        if (!this.hasAmberClearance(envelope.target)) {
          return { allowed: false, reason: 'TLP:AMBER - Target lacks amber clearance' }
        }
      }

      return { allowed: true }
    })

    // Rate limiting policy
    this.policies.set('rate_limit_check', (envelope) => {
      const originAgent = this.getAgentManifest(envelope.origin)
      if (!originAgent) {
        return { allowed: false, reason: 'Origin agent not found' }
      }

      // Check if agent is within rate limits (simplified)
      const currentRPM = this.getCurrentRPM(envelope.origin)
      if (currentRPM >= originAgent.rate_limits.rpm) {
        return { allowed: false, reason: 'Rate limit exceeded (RPM)' }
      }

      return { allowed: true }
    })
  }

  /**
   * Check message against all policies
   */
  async checkMessage(envelope: MessageEnvelope): Promise<PolicyResult> {
    for (const [policyName, policyFunc] of this.policies) {
      const result = policyFunc(envelope)
      if (!result.allowed) {
        console.warn(`Policy violation: ${policyName} - ${result.reason}`)
        return result
      }
    }

    return { allowed: true }
  }

  /**
   * Validate agent clearance level
   */
  validateClearance(clearance: ClassificationLevel, compartments?: string[]): boolean {
    // Basic clearance validation
    const validLevels = ['U', 'C', 'S', 'TS']
    if (!validLevels.includes(clearance)) {
      return false
    }

    // Validate compartments format (SCI:COMPARTMENT)
    if (compartments) {
      for (const compartment of compartments) {
        if (!compartment.startsWith('SCI:')) {
          return false
        }
      }
    }

    return true
  }

  /**
   * Add custom policy
   */
  addPolicy(name: string, policyFunc: (envelope: MessageEnvelope) => PolicyResult) {
    this.policies.set(name, policyFunc)
  }

  /**
   * Remove policy
   */
  removePolicy(name: string) {
    this.policies.delete(name)
  }

  // Helper methods (these would integrate with actual agent registry)
  private getAgentClearance(agentId: string): ClassificationLevel | null {
    // This would query the actual agent registry
    // For now, return mock data
    const mockClearances: Record<string, ClassificationLevel> = {
      'overseer': 'TS',
      'intel_analyst': 'TS',
      'field_commander': 'S',
      'cyber_security': 'TS',
      'red_team': 'S',
      'osint_harvester': 'C',
      'logistics': 'S',
      'protocol_officer': 'TS',
      'negotiator': 'S'
    }
    return mockClearances[agentId] || null
  }

  private getAgentCompartments(agentId: string): string[] {
    // Mock compartment data
    const mockCompartments: Record<string, string[]> = {
      'overseer': ['SCI:ALTAIR', 'SCI:SEASTAR'],
      'intel_analyst': ['SCI:ALTAIR'],
      'cyber_security': ['SCI:ALTAIR', 'SCI:SEASTAR'],
      'protocol_officer': ['SCI:ALTAIR', 'SCI:SEASTAR']
    }
    return mockCompartments[agentId] || []
  }

  private getAgentNeedToKnow(agentId: string): string[] {
    // Mock need-to-know data
    const mockNTK: Record<string, string[]> = {
      'intel_analyst': ['ops', 'intel_core', 'threat_analysis'],
      'field_commander': ['ops', 'mission_planning'],
      'cyber_security': ['ops', 'cyber_defense', 'threat_intel'],
      'overseer': ['ops', 'intel_core', 'mission_planning', 'cyber_defense']
    }
    return mockNTK[agentId] || []
  }

  private getAgentManifest(agentId: string): AgentManifest | null {
    // This would query the actual agent registry
    // For now, return null (will be implemented when registry is available)
    return null
  }

  private isInternalAgent(agentId: string): boolean {
    // Check if agent is internal to organization
    const internalAgents = [
      'overseer', 'intel_analyst', 'field_commander', 'cyber_security',
      'red_team', 'osint_harvester', 'logistics', 'protocol_officer', 'negotiator'
    ]
    return internalAgents.includes(agentId)
  }

  private hasAmberClearance(agentId: string): boolean {
    // Check if agent has clearance for AMBER TLP
    const clearance = this.getAgentClearance(agentId)
    return clearance === 'S' || clearance === 'TS'
  }

  private getCurrentRPM(agentId: string): number {
    // This would track actual request rates
    // For now, return 0
    return 0
  }
}
