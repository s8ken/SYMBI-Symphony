import { z } from 'zod'

// Security Classifications
export const ClassificationLevel = z.enum(['U', 'C', 'S', 'TS'])
export type ClassificationLevel = z.infer<typeof ClassificationLevel>

export const TLPLevel = z.enum(['WHITE', 'GREEN', 'AMBER', 'RED'])
export type TLPLevel = z.infer<typeof TLPLevel>

// Message Envelope Schema
export const MessageEnvelopeSchema = z.object({
  msg_id: z.string().uuid(),
  thread_id: z.string().uuid(),
  ts: z.string().datetime(),
  origin: z.string(),
  target: z.string(),
  classification: ClassificationLevel,
  compartments: z.array(z.string()).optional(),
  tlp: TLPLevel,
  need_to_know: z.array(z.string()),
  purpose: z.string(),
  instructions: z.string(),
  context_refs: z.array(z.object({
    type: z.enum(['mem', 'doc', 'url']),
    id: z.string()
  })).optional(),
  tools_allowed: z.array(z.string()).optional(),
  slo: z.object({
    latency_s: z.number(),
    cost_cap_usd: z.number()
  }).optional(),
  chain_of_custody: z.array(z.object({
    agent: z.string(),
    sig: z.string(),
    timestamp: z.string().datetime()
  }))
})

export type MessageEnvelope = z.infer<typeof MessageEnvelopeSchema>

// Agent Manifest Schema
export const AgentManifestSchema = z.object({
  id: z.string(),
  persona: z.string(),
  capabilities: z.array(z.string()),
  clearance: ClassificationLevel,
  compartments: z.array(z.string()).optional(),
  memory_partition: z.string(),
  rate_limits: z.object({
    rpm: z.number(),
    tpm: z.number()
  }),
  guardrails: z.array(z.string()),
  handoffs: z.object({
    default_route: z.string(),
    escalate_on: z.array(z.string())
  }),
  openai_agent_id: z.string().optional(),
  status: z.enum(['active', 'standby', 'maintenance', 'compromised']).default('standby')
})

export type AgentManifest = z.infer<typeof AgentManifestSchema>

// Tool Function Schema
export const ToolFunctionSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.record(z.any()),
  clearance_required: ClassificationLevel.optional(),
  compartments_required: z.array(z.string()).optional()
})

export type ToolFunction = z.infer<typeof ToolFunctionSchema>

// Agent Roster (predefined roles)
export const AGENT_ROLES = {
  OVERSEER: 'overseer',
  INTEL_ANALYST: 'intel_analyst', 
  FIELD_COMMANDER: 'field_commander',
  CYBER_SECURITY: 'cyber_security',
  RED_TEAM: 'red_team',
  OSINT_HARVESTER: 'osint_harvester',
  LOGISTICS: 'logistics',
  PROTOCOL_OFFICER: 'protocol_officer',
  NEGOTIATOR: 'negotiator'
} as const

export type AgentRole = typeof AGENT_ROLES[keyof typeof AGENT_ROLES]

// Message Response Schema
export const MessageResponseSchema = z.object({
  msg_id: z.string().uuid(),
  response_to: z.string().uuid(),
  agent_id: z.string(),
  content: z.string(),
  confidence: z.number().min(0).max(1).optional(),
  citations: z.array(z.object({
    source: z.string(),
    confidence: z.number().min(0).max(1)
  })).optional(),
  escalation_required: z.boolean().default(false),
  next_actions: z.array(z.string()).optional(),
  classification: ClassificationLevel,
  tlp: TLPLevel,
  chain_of_custody: z.array(z.object({
    agent: z.string(),
    sig: z.string(),
    timestamp: z.string().datetime()
  }))
})

export type MessageResponse = z.infer<typeof MessageResponseSchema>

// Audit Log Entry Schema
export const AuditLogEntrySchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  event_type: z.enum(['message_sent', 'message_received', 'agent_created', 'agent_updated', 'policy_violation', 'escalation']),
  agent_id: z.string(),
  message_id: z.string().uuid().optional(),
  classification: ClassificationLevel,
  details: z.record(z.any()),
  signature: z.string()
})

export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>
