"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogEntrySchema = exports.MessageResponseSchema = exports.AGENT_ROLES = exports.ToolFunctionSchema = exports.AgentManifestSchema = exports.MessageEnvelopeSchema = exports.TLPLevel = exports.ClassificationLevel = void 0;
const zod_1 = require("zod");
// Security Classifications
exports.ClassificationLevel = zod_1.z.enum(['U', 'C', 'S', 'TS']);
exports.TLPLevel = zod_1.z.enum(['WHITE', 'GREEN', 'AMBER', 'RED']);
// Message Envelope Schema
exports.MessageEnvelopeSchema = zod_1.z.object({
    msg_id: zod_1.z.string().uuid(),
    thread_id: zod_1.z.string().uuid(),
    ts: zod_1.z.string().datetime(),
    origin: zod_1.z.string(),
    target: zod_1.z.string(),
    classification: exports.ClassificationLevel,
    compartments: zod_1.z.array(zod_1.z.string()).optional(),
    tlp: exports.TLPLevel,
    need_to_know: zod_1.z.array(zod_1.z.string()),
    purpose: zod_1.z.string(),
    instructions: zod_1.z.string(),
    context_refs: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.enum(['mem', 'doc', 'url']),
        id: zod_1.z.string()
    })).optional(),
    tools_allowed: zod_1.z.array(zod_1.z.string()).optional(),
    slo: zod_1.z.object({
        latency_s: zod_1.z.number(),
        cost_cap_usd: zod_1.z.number()
    }).optional(),
    chain_of_custody: zod_1.z.array(zod_1.z.object({
        agent: zod_1.z.string(),
        sig: zod_1.z.string(),
        timestamp: zod_1.z.string().datetime()
    }))
});
// Agent Manifest Schema
exports.AgentManifestSchema = zod_1.z.object({
    id: zod_1.z.string(),
    persona: zod_1.z.string(),
    capabilities: zod_1.z.array(zod_1.z.string()),
    clearance: exports.ClassificationLevel,
    compartments: zod_1.z.array(zod_1.z.string()).optional(),
    memory_partition: zod_1.z.string(),
    rate_limits: zod_1.z.object({
        rpm: zod_1.z.number(),
        tpm: zod_1.z.number()
    }),
    guardrails: zod_1.z.array(zod_1.z.string()),
    handoffs: zod_1.z.object({
        default_route: zod_1.z.string(),
        escalate_on: zod_1.z.array(zod_1.z.string())
    }),
    openai_agent_id: zod_1.z.string().optional(),
    status: zod_1.z.enum(['active', 'standby', 'maintenance', 'compromised']).default('standby')
});
// Tool Function Schema
exports.ToolFunctionSchema = zod_1.z.object({
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    parameters: zod_1.z.record(zod_1.z.any()),
    clearance_required: exports.ClassificationLevel.optional(),
    compartments_required: zod_1.z.array(zod_1.z.string()).optional()
});
// Agent Roster (predefined roles)
exports.AGENT_ROLES = {
    OVERSEER: 'overseer',
    INTEL_ANALYST: 'intel_analyst',
    FIELD_COMMANDER: 'field_commander',
    CYBER_SECURITY: 'cyber_security',
    RED_TEAM: 'red_team',
    OSINT_HARVESTER: 'osint_harvester',
    LOGISTICS: 'logistics',
    PROTOCOL_OFFICER: 'protocol_officer',
    NEGOTIATOR: 'negotiator'
};
// Message Response Schema
exports.MessageResponseSchema = zod_1.z.object({
    msg_id: zod_1.z.string().uuid(),
    response_to: zod_1.z.string().uuid(),
    agent_id: zod_1.z.string(),
    content: zod_1.z.string(),
    confidence: zod_1.z.number().min(0).max(1).optional(),
    citations: zod_1.z.array(zod_1.z.object({
        source: zod_1.z.string(),
        confidence: zod_1.z.number().min(0).max(1)
    })).optional(),
    escalation_required: zod_1.z.boolean().default(false),
    next_actions: zod_1.z.array(zod_1.z.string()).optional(),
    classification: exports.ClassificationLevel,
    tlp: exports.TLPLevel,
    chain_of_custody: zod_1.z.array(zod_1.z.object({
        agent: zod_1.z.string(),
        sig: zod_1.z.string(),
        timestamp: zod_1.z.string().datetime()
    }))
});
// Audit Log Entry Schema
exports.AuditLogEntrySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    timestamp: zod_1.z.string().datetime(),
    event_type: zod_1.z.enum(['message_sent', 'message_received', 'agent_created', 'agent_updated', 'policy_violation', 'escalation']),
    agent_id: zod_1.z.string(),
    message_id: zod_1.z.string().uuid().optional(),
    classification: exports.ClassificationLevel,
    details: zod_1.z.record(zod_1.z.any()),
    signature: zod_1.z.string()
});
//# sourceMappingURL=agent-types.js.map