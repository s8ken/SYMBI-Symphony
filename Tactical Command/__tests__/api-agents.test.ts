/**
 * Agents API Endpoint Tests
 * Tests for /api/agents/list and /api/agents/register endpoints
 */

// Mock the singleton before any imports
jest.mock('@/lib/services/message-bus-singleton', () => {
  const mockListAgents = jest.fn()
  const mockRegisterAgent = jest.fn()
  
  return {
    getMessageBus: jest.fn(() => ({
      listAgents: mockListAgents,
      registerAgent: mockRegisterAgent,
    }))
  }
})

import { NextRequest } from 'next/server'
import { GET as getAgentsList } from '@/app/api/agents/list/route'
import { POST as registerAgent, GET as getRegisteredAgents } from '@/app/api/agents/register/route'
import { AgentManifest, ClassificationLevel, TLPLevel } from '@/lib/types/agent-types'
import { getMessageBus } from '@/lib/services/message-bus-singleton'

// Get the mocked functions after import
const mockGetMessageBus = getMessageBus as jest.MockedFunction<typeof getMessageBus>
let mockListAgents: jest.MockedFunction<any>
let mockRegisterAgent: jest.MockedFunction<any>

// Mock agent data
const mockAgents: AgentManifest[] = [
  {
    id: 'overseer',
    persona: 'Tactical Overseer',
    capabilities: ['coordination', 'decision_making', 'escalation'],
    clearance: 'TS' as ClassificationLevel,
    compartments: ['TACTICAL', 'COMMAND'],
    memory_partition: 'overseer_mem',
    rate_limits: { rpm: 100, tpm: 10000 },
    guardrails: ['no_unauthorized_disclosure', 'maintain_opsec'],
    handoffs: {
      default_route: 'intel_analyst',
      escalate_on: ['policy_violation', 'security_breach']
    },
    status: 'active'
  },
  {
    id: 'intel_analyst',
    persona: 'Intelligence Analyst',
    capabilities: ['analysis', 'reporting', 'threat_assessment'],
    clearance: 'S' as ClassificationLevel,
    compartments: ['INTEL', 'ANALYSIS'],
    memory_partition: 'intel_mem',
    rate_limits: { rpm: 60, tpm: 8000 },
    guardrails: ['verify_sources', 'classification_handling'],
    handoffs: {
      default_route: 'overseer',
      escalate_on: ['high_confidence_threat', 'urgent_intel']
    },
    status: 'active'
  },
  {
    id: 'field_commander',
    persona: 'Field Commander',
    capabilities: ['tactical_planning', 'resource_allocation', 'mission_execution'],
    clearance: 'C' as ClassificationLevel,
    compartments: ['TACTICAL', 'OPERATIONS'],
    memory_partition: 'field_mem',
    rate_limits: { rpm: 80, tpm: 9000 },
    guardrails: ['rules_of_engagement', 'civilian_protection'],
    handoffs: {
      default_route: 'overseer',
      escalate_on: ['mission_critical', 'casualties']
    },
    status: 'standby'
  }
]

describe('Agents API Endpoints', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    
    // Get the mock functions from the mocked instance
    const mockInstance = mockGetMessageBus()
    mockListAgents = mockInstance.listAgents
    mockRegisterAgent = mockInstance.registerAgent
    
    // Set up default mock implementations
    mockListAgents.mockImplementation(() => mockAgents)
    mockRegisterAgent.mockResolvedValue(undefined)
  })

  describe('GET /api/agents/list', () => {
    it('should return all agents without filters', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/agents/list')
      
      const response = await getAgentsList(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.count).toBe(3)
      expect(data.agents).toHaveLength(3)
      expect(mockListAgents).toHaveBeenCalledTimes(1)
    })

    it('should filter agents by status', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/agents/list?status=active')
      
      const response = await getAgentsList(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.count).toBe(2) // Only active agents
      expect(data.agents.every((agent: any) => agent.status === 'active')).toBe(true)
    })

    it('should filter agents by clearance', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/agents/list?clearance=TS')
      
      const response = await getAgentsList(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.count).toBe(1) // Only TS clearance
      expect(data.agents[0].clearance).toBe('TS')
    })

    it('should filter agents by both status and clearance', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/agents/list?status=active&clearance=S')
      
      const response = await getAgentsList(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.count).toBe(1) // Only active agents with S clearance
      expect(data.agents[0].id).toBe('intel_analyst')
    })

    it('should return empty array when no agents match filters', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/agents/list?status=compromised')
      
      const response = await getAgentsList(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.count).toBe(0)
      expect(data.agents).toHaveLength(0)
    })

    it('should handle message bus errors gracefully', async () => {
      mockListAgents.mockImplementation(() => {
        throw new Error('Message bus connection failed')
      })

      const mockRequest = new NextRequest('http://localhost:3000/api/agents/list')
      
      const response = await getAgentsList(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to list agents')
      expect(data.details).toBe('Message bus connection failed')
    })

    it('should return proper agent structure', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/agents/list')
      
      const response = await getAgentsList(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      const agent = data.agents[0]
      expect(agent).toHaveProperty('id')
      expect(agent).toHaveProperty('persona')
      expect(agent).toHaveProperty('status')
      expect(agent).toHaveProperty('clearance')
      expect(agent).toHaveProperty('capabilities')
      expect(agent).toHaveProperty('memory_partition')
      expect(agent).toHaveProperty('rate_limits')
      expect(agent).toHaveProperty('compartments')
      expect(agent).toHaveProperty('guardrails')
      expect(agent).toHaveProperty('handoffs')
    })
  })

  describe('POST /api/agents/register', () => {
    const validAgentManifest = {
      id: 'test_agent',
      persona: 'Test Agent',
      capabilities: ['testing', 'validation'],
      clearance: 'C' as ClassificationLevel,
      compartments: ['TEST'],
      memory_partition: 'test_mem',
      rate_limits: { rpm: 30, tpm: 3000 },
      guardrails: ['test_safety'],
      handoffs: {
        default_route: 'overseer',
        escalate_on: ['test_failure']
      },
      status: 'standby' as const
    }

    it('should successfully register a valid agent', async () => {
      mockRegisterAgent.mockResolvedValue(undefined)

      const mockRequest = new NextRequest('http://localhost:3000/api/agents/register', {
        method: 'POST',
        body: JSON.stringify(validAgentManifest),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await registerAgent(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Agent registered successfully')
      expect(mockRegisterAgent).toHaveBeenCalledWith(validAgentManifest)
    })

    it('should reject invalid agent manifest', async () => {
      const invalidManifest = { id: 'test' } // Missing required fields

      const mockRequest = new NextRequest('http://localhost:3000/api/agents/register', {
        method: 'POST',
        body: JSON.stringify(invalidManifest)
      })

      const response = await registerAgent(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid agent manifest')
      expect(mockRegisterAgent).not.toHaveBeenCalled()
    })

    it('should handle registration errors from message bus', async () => {
      mockRegisterAgent.mockRejectedValue(new Error('Agent already exists'))

      const mockRequest = new NextRequest('http://localhost:3000/api/agents/register', {
        method: 'POST',
        body: JSON.stringify(validAgentManifest)
      })

      const response = await registerAgent(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to register agent')
      expect(data.details).toBe('Agent already exists')
    })

    it('should validate required fields', async () => {
      const manifestMissingId = { ...validAgentManifest }
      delete (manifestMissingId as any).id

      const mockRequest = new NextRequest('http://localhost:3000/api/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manifestMissingId)
      })

      const response = await registerAgent(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid agent manifest')
    })

    it('should validate clearance levels', async () => {
      const invalidClearance = {
        ...validAgentManifest,
        clearance: 'INVALID' as any
      }

      const mockRequest = new NextRequest('http://localhost:3000/api/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidClearance)
      })

      const response = await registerAgent(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid agent manifest')
    })

    it('should handle malformed JSON', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      })

      await expect(registerAgent(mockRequest)).rejects.toThrow()
    })
  })

  describe('GET /api/agents/register', () => {
    it('should return list of registered agents', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/agents/register')
      
      const response = await getRegisteredAgents()
      const data = await response.json()

      console.log('Response status:', response.status)
      console.log('Response data:', data)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.agents).toHaveLength(3)
      expect(mockListAgents).toHaveBeenCalledTimes(1)
    })

    it('should return simplified agent structure', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/agents/register')
      
      const response = await getRegisteredAgents()
      const data = await response.json()

      expect(response.status).toBe(200)
      const agent = data.agents[0]
      expect(agent).toHaveProperty('id')
      expect(agent).toHaveProperty('status')
      expect(agent).toHaveProperty('clearance')
      expect(agent).toHaveProperty('capabilities')
      expect(agent).toHaveProperty('memory_partition')
      expect(agent).toHaveProperty('rate_limits')
      // Should not include sensitive fields like openai_agent_id
    })

    it('should handle message bus errors', async () => {
      mockListAgents.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const response = await getRegisteredAgents()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to list agents')
      expect(data.details).toBe('Database connection failed')
    })
  })
})