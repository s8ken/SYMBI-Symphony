/**
 * Shared Bus API Endpoint Tests
 * Tests for /api/test/shared-bus endpoint to verify MessageBus singleton behavior
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/test/shared-bus/route'

// Mock the message bus singleton
// Mock functions that will be extracted from the mocked instance
let mockListAgents: jest.Mock

jest.mock('@/lib/services/message-bus-singleton', () => ({
  getMessageBus: jest.fn(() => ({
    listAgents: jest.fn(),
  }))
}))

// Extract mock functions from the mocked instance
const { getMessageBus } = require('@/lib/services/message-bus-singleton')
mockListAgents = getMessageBus().listAgents

// Mock agent data for testing
const mockAgents: AgentManifest[] = [
  {
    id: 'overseer',
    persona: 'Strategic Command and Control Agent',
    capabilities: ['command', 'coordination', 'strategic_planning'],
    clearance: 'TS' as ClassificationLevel,
    compartments: ['COMMAND', 'STRATEGIC'],
    memory_partition: 'overseer_memory',
    rate_limits: {
      rpm: 100,
      tpm: 10000
    },
    guardrails: ['no_unauthorized_disclosure', 'maintain_opsec'],
    handoffs: {
      default_route: 'intel_analyst',
      escalate_on: ['security_breach', 'mission_critical']
    },
    openai_agent_id: 'asst_overseer_123',
    status: 'active'
  },
  {
    id: 'intel_analyst',
    persona: 'Intelligence Analysis Specialist',
    capabilities: ['analysis', 'threat_assessment', 'reporting'],
    clearance: 'S' as ClassificationLevel,
    compartments: ['INTEL', 'ANALYSIS'],
    memory_partition: 'intel_memory',
    rate_limits: {
      rpm: 60,
      tpm: 8000
    },
    guardrails: ['verify_sources', 'classification_handling'],
    handoffs: {
      default_route: 'field_commander',
      escalate_on: ['high_confidence_threat', 'urgent_intel']
    },
    openai_agent_id: 'asst_intel_456',
    status: 'active'
  },
  {
    id: 'field_commander',
    persona: 'Tactical Operations Commander',
    capabilities: ['tactical_planning', 'resource_allocation', 'mission_execution'],
    clearance: 'C' as ClassificationLevel,
    compartments: ['TACTICAL', 'OPERATIONS'],
    memory_partition: 'field_memory',
    rate_limits: {
      rpm: 80,
      tpm: 9000
    },
    guardrails: ['mission_parameters', 'rules_of_engagement'],
    handoffs: {
      default_route: 'logistics',
      escalate_on: ['mission_failure', 'casualty_event']
    },
    status: 'standby'
  }
]

describe('Shared Bus API Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Extract mock functions from the mocked instance
    const { getMessageBus } = require('@/lib/services/message-bus-singleton')
    mockListAgents = getMessageBus().listAgents
    
    mockListAgents.mockReturnValue(mockAgents)
  })

  describe('GET /api/test/shared-bus', () => {
    it('should successfully retrieve agents from shared MessageBus instance', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test/shared-bus', {
        method: 'GET'
      })

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Shared MessageBus instance test')
      expect(data.agentCount).toBe(3)
      expect(data.agents).toHaveLength(3)
      expect(mockListAgents).toHaveBeenCalledTimes(1)
    })

    it('should return correct agent information structure', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test/shared-bus', {
        method: 'GET'
      })

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(data.agents[0]).toEqual({
        id: 'overseer',
        persona: 'Strategic Command and Control Agent',
        clearance: 'TS'
      })
      expect(data.agents[1]).toEqual({
        id: 'intel_analyst',
        persona: 'Intelligence Analysis Specialist',
        clearance: 'S'
      })
      expect(data.agents[2]).toEqual({
        id: 'field_commander',
        persona: 'Tactical Operations Commander',
        clearance: 'C'
      })
    })

    it('should handle empty agent list', async () => {
      mockListAgents.mockReturnValue([])

      const mockRequest = new NextRequest('http://localhost:3000/api/test/shared-bus', {
        method: 'GET'
      })

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.agentCount).toBe(0)
      expect(data.agents).toHaveLength(0)
    })

    it('should handle single agent in the bus', async () => {
      const singleAgent = [mockAgents[0]]
      mockListAgents.mockReturnValue(singleAgent)

      const mockRequest = new NextRequest('http://localhost:3000/api/test/shared-bus', {
        method: 'GET'
      })

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.agentCount).toBe(1)
      expect(data.agents).toHaveLength(1)
      expect(data.agents[0].id).toBe('overseer')
    })

    it('should handle MessageBus errors gracefully', async () => {
      mockListAgents.mockImplementation(() => {
        throw new Error('MessageBus connection failed')
      })

      const mockRequest = new NextRequest('http://localhost:3000/api/test/shared-bus', {
        method: 'GET'
      })

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to test shared MessageBus')
    })

    it('should handle agents with missing optional fields', async () => {
      const agentsWithMissingFields = [
        {
          id: 'minimal_agent',
          persona: 'Minimal Test Agent',
          capabilities: ['basic'],
          clearance: 'U' as ClassificationLevel,
          memory_partition: 'minimal_memory',
          rate_limits: {
            rpm: 10,
            tpm: 1000
          },
          guardrails: [],
          handoffs: {
            default_route: 'overseer',
            escalate_on: []
          },
          status: 'active'
          // Missing optional fields: compartments, openai_agent_id
        }
      ]

      mockListAgents.mockReturnValue(agentsWithMissingFields)

      const mockRequest = new NextRequest('http://localhost:3000/api/test/shared-bus', {
        method: 'GET'
      })

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.agentCount).toBe(1)
      expect(data.agents[0]).toEqual({
        id: 'minimal_agent',
        persona: 'Minimal Test Agent',
        clearance: 'U'
      })
    })

    it('should verify singleton behavior by checking consistent agent count', async () => {
      // First call
      const mockRequest1 = new NextRequest('http://localhost:3000/api/test/shared-bus', {
        method: 'GET'
      })

      const response1 = await GET(mockRequest1)
      const data1 = await response1.json()

      // Second call should return same data (singleton behavior)
      const mockRequest2 = new NextRequest('http://localhost:3000/api/test/shared-bus', {
        method: 'GET'
      })

      const response2 = await GET(mockRequest2)
      const data2 = await response2.json()

      expect(data1.agentCount).toBe(data2.agentCount)
      expect(data1.agents).toEqual(data2.agents)
      expect(mockListAgents).toHaveBeenCalledTimes(2)
    })

    it('should handle agents with different clearance levels', async () => {
      const mixedClearanceAgents = [
        { ...mockAgents[0], clearance: 'TS' as ClassificationLevel },
        { ...mockAgents[1], clearance: 'S' as ClassificationLevel },
        { ...mockAgents[2], clearance: 'C' as ClassificationLevel },
        { 
          ...mockAgents[0], 
          id: 'unclassified_agent',
          persona: 'Public Information Agent',
          clearance: 'U' as ClassificationLevel 
        }
      ]

      mockListAgents.mockReturnValue(mixedClearanceAgents)

      const mockRequest = new NextRequest('http://localhost:3000/api/test/shared-bus', {
        method: 'GET'
      })

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.agentCount).toBe(4)
      
      const clearanceLevels = data.agents.map((agent: any) => agent.clearance)
      expect(clearanceLevels).toContain('TS')
      expect(clearanceLevels).toContain('S')
      expect(clearanceLevels).toContain('C')
      expect(clearanceLevels).toContain('U')
    })

    it('should handle agents with special characters in persona', async () => {
      const specialCharAgents = [
        {
          ...mockAgents[0],
          id: 'special_agent',
          persona: 'Agent with Special Chars: @#$%^&*()[]{}|\\:";\'<>?,./',
          clearance: 'C' as ClassificationLevel
        }
      ]

      mockListAgents.mockReturnValue(specialCharAgents)

      const mockRequest = new NextRequest('http://localhost:3000/api/test/shared-bus', {
        method: 'GET'
      })

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.agents[0].persona).toBe('Agent with Special Chars: @#$%^&*()[]{}|\\:";\'<>?,./')
    })

    it('should handle agents with Unicode characters in persona', async () => {
      const unicodeAgents = [
        {
          ...mockAgents[0],
          id: 'unicode_agent',
          persona: 'Agent Unicode: 测试 🔒 Ñoël café résumé',
          clearance: 'C' as ClassificationLevel
        }
      ]

      mockListAgents.mockReturnValue(unicodeAgents)

      const mockRequest = new NextRequest('http://localhost:3000/api/test/shared-bus', {
        method: 'GET'
      })

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.agents[0].persona).toBe('Agent Unicode: 测试 🔒 Ñoël café résumé')
    })

    it('should handle large number of agents efficiently', async () => {
      // Create a large array of agents to test performance
      const largeAgentList = Array.from({ length: 100 }, (_, index) => ({
        ...mockAgents[0],
        id: `agent_${index}`,
        persona: `Test Agent ${index}`,
        clearance: (['U', 'C', 'S', 'TS'] as ClassificationLevel[])[index % 4]
      }))

      mockListAgents.mockReturnValue(largeAgentList)

      const mockRequest = new NextRequest('http://localhost:3000/api/test/shared-bus', {
        method: 'GET'
      })

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.agentCount).toBe(100)
      expect(data.agents).toHaveLength(100)
      expect(data.agents[0].id).toBe('agent_0')
      expect(data.agents[99].id).toBe('agent_99')
    })
  })

  describe('MessageBus Singleton Verification', () => {
    it('should demonstrate singleton behavior across multiple calls', async () => {
      // Simulate multiple concurrent requests
      const requests = Array.from({ length: 5 }, () => 
        new NextRequest('http://localhost:3000/api/test/shared-bus', { method: 'GET' })
      )

      const responses = await Promise.all(
        requests.map(request => GET(request))
      )

      const dataPromises = responses.map(response => response.json())
      const allData = await Promise.all(dataPromises)

      // All responses should be successful
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })

      // All responses should have the same agent count (singleton behavior)
      const agentCounts = allData.map(data => data.agentCount)
      expect(new Set(agentCounts).size).toBe(1) // All counts should be the same

      // MessageBus.listAgents should have been called 5 times (once per request)
      expect(mockListAgents).toHaveBeenCalledTimes(5)
    })

    it('should maintain state consistency across requests', async () => {
      // First request
      const request1 = new NextRequest('http://localhost:3000/api/test/shared-bus', {
        method: 'GET'
      })
      const response1 = await GET(request1)
      const data1 = await response1.json()

      // Modify mock to simulate agent registration between requests
      const updatedAgents = [...mockAgents, {
        ...mockAgents[0],
        id: 'new_agent',
        persona: 'Newly Registered Agent',
        clearance: 'C' as ClassificationLevel
      }]
      mockListAgents.mockReturnValue(updatedAgents)

      // Second request should reflect the updated state
      const request2 = new NextRequest('http://localhost:3000/api/test/shared-bus', {
        method: 'GET'
      })
      const response2 = await GET(request2)
      const data2 = await response2.json()

      expect(data1.agentCount).toBe(3)
      expect(data2.agentCount).toBe(4)
      expect(data2.agents.some((agent: any) => agent.id === 'new_agent')).toBe(true)
    })
  })
})