/**
 * Messages API Endpoint Tests
 * Tests for /api/messages/send endpoint
 */

// Mock message bus with inline implementation to avoid hoisting issues
jest.mock('@/lib/services/message-bus-singleton', () => {
  const mockSendMessage = jest.fn()
  const mockCreateMessage = jest.fn()
  const mockListAgents = jest.fn()
  
  return {
    getMessageBus: jest.fn(() => ({
      sendMessage: mockSendMessage,
      createMessage: mockCreateMessage,
      listAgents: mockListAgents
    }))
  }
})

import { NextRequest } from 'next/server'
import { POST, PUT } from '@/app/api/messages/send/route'
import { MessageEnvelope, MessageResponse, CreateMessageRequest } from '@/lib/types/message-types'
import { getMessageBus } from '@/lib/services/message-bus-singleton'

// Get the mocked message bus for test assertions
const mockGetMessageBus = getMessageBus as jest.MockedFunction<typeof getMessageBus>
let mockSendMessage: jest.MockedFunction<any>
let mockCreateMessage: jest.MockedFunction<any>
let mockListAgents: jest.MockedFunction<any>

// Mock message envelope data
const validMessageEnvelope: MessageEnvelope = {
  msg_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  thread_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d480',
  ts: '2024-01-15T10:30:00Z',
  origin: 'overseer',
  target: 'intel_analyst',
  classification: 'S' as ClassificationLevel,
  tlp: 'AMBER' as TLPLevel,
  purpose: 'intelligence_request',
  instructions: 'Analyze the provided intelligence data and provide threat assessment',
  need_to_know: ['INTEL', 'ANALYSIS'],
  compartments: ['TACTICAL', 'INTEL'],
  context_refs: [
    { type: 'doc' as const, id: 'doc-456' },
    { type: 'doc' as const, id: 'report-789' }
  ],
  tools_allowed: ['analysis', 'reporting'],
  slo: {
    latency_s: 300,
    cost_cap_usd: 10.0
  },
  chain_of_custody: [
    {
      agent: 'overseer',
      sig: 'mock-signature-123',
      timestamp: '2024-01-15T10:30:00Z'
    }
  ]
}

const mockMessageResponse = {
  msg_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d481',
  response_to: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  agent_id: 'intel_analyst',
  content: 'Analysis complete. Threat level assessed as moderate.',
  confidence: 0.85,
  escalation_required: false,
  classification: 'S' as ClassificationLevel,
  tlp: 'AMBER' as TLPLevel,
  chain_of_custody: [
    {
      agent: 'intel_analyst',
      sig: 'mock-response-signature-456',
      timestamp: '2024-01-15T10:35:00Z'
    }
  ]
}

describe('Messages API Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Extract mock functions from the mocked instance
    const mockInstance = mockGetMessageBus()
    mockSendMessage = mockInstance.sendMessage
    mockCreateMessage = mockInstance.createMessage
    mockListAgents = mockInstance.listAgents
    
    // Set up default mock implementations
    mockSendMessage.mockResolvedValue(mockMessageResponse)
    mockCreateMessage.mockReturnValue(validMessageEnvelope)
  })

  describe('POST /api/messages/send', () => {
    it('should successfully send a valid message envelope', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validMessageEnvelope)
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Message sent successfully')
      expect(data.response).toMatchObject({
        msg_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d481',
        response_to: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        agent_id: 'intel_analyst',
        content: 'Analysis complete. Threat level assessed as moderate.',
        confidence: 0.85,
        escalation_required: false,
        classification: 'S',
        tlp: 'AMBER'
      })
      expect(mockSendMessage).toHaveBeenCalledWith(validMessageEnvelope)
    })

    it('should reject invalid message envelope - missing required fields', async () => {
      const invalidEnvelope = {
        msg_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d482',
        thread_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d483',
        ts: '2024-01-15T10:30:00Z',
        origin: 'overseer',
        // Missing target, classification, tlp, purpose, instructions, need_to_know, chain_of_custody
        compartments: ['INTEL']
      }

      const mockRequest = new NextRequest('http://localhost:3000/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidEnvelope)
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid message envelope')
      expect(data.details).toBeDefined()
      expect(Array.isArray(data.details)).toBe(true)
      expect(mockSendMessage).not.toHaveBeenCalled()
    })

    it('should reject invalid classification level', async () => {
      const invalidEnvelope = {
        ...validMessageEnvelope,
        classification: 'INVALID_LEVEL' as any
      }

      const mockRequest = new NextRequest('http://localhost:3000/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidEnvelope)
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid message envelope')
      expect(mockSendMessage).not.toHaveBeenCalled()
    })

    it('should reject invalid TLP level', async () => {
      const invalidEnvelope = {
        ...validMessageEnvelope,
        tlp: 'INVALID_TLP' as any
      }

      const mockRequest = new NextRequest('http://localhost:3000/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidEnvelope)
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid message envelope')
      expect(mockSendMessage).not.toHaveBeenCalled()
    })

    it('should handle message bus errors', async () => {
      mockSendMessage.mockRejectedValue(new Error('Agent not available'))

      const mockRequest = new NextRequest('http://localhost:3000/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validMessageEnvelope)
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to send message')
      expect(data.details).toBe('Agent not available')
    })

    it('should handle malformed JSON', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to send message')
    })

    it('should validate array fields correctly', async () => {
      const envelopeWithInvalidArrays = {
        ...validMessageEnvelope,
        need_to_know: 'not-an-array', // Should be array
        compartments: ['VALID', 123] // Should be array of strings
      }

      const mockRequest = new NextRequest('http://localhost:3000/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(envelopeWithInvalidArrays)
      })

      const response = await sendMessage(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid message envelope')
      expect(mockSendMessage).not.toHaveBeenCalled()
    })

    it('should validate SLO field as object', async () => {
      const envelopeWithInvalidSLO = {
        ...validMessageEnvelope,
        slo: 'not-an-object'
      }

      const mockRequest = new NextRequest('http://localhost:3000/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(envelopeWithInvalidSLO)
      })

      const response = await sendMessage(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid message envelope')
      expect(mockSendMessage).not.toHaveBeenCalled()
    })

    it('should handle optional fields correctly', async () => {
      const minimalEnvelope = {
        msg_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d484',
        thread_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d485',
        ts: '2024-01-15T10:30:00Z',
        origin: 'overseer',
        target: 'intel_analyst',
        classification: 'C' as ClassificationLevel,
        tlp: 'GREEN' as TLPLevel,
        purpose: 'status_check',
        instructions: 'Provide status update',
        need_to_know: ['STATUS'],
        chain_of_custody: [
          {
            agent: 'overseer',
            sig: 'mock-minimal-signature',
            timestamp: '2024-01-15T10:30:00Z'
          }
        ]
        // Optional fields omitted: compartments, context_refs, tools_allowed, slo
      }

      const mockRequest = new NextRequest('http://localhost:3000/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(minimalEnvelope)
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockSendMessage).toHaveBeenCalledWith(minimalEnvelope)
    })
  })

  describe('PUT /api/messages/send', () => {
    const validCreateRequest = {
        origin: 'overseer',
        target: 'intel_analyst',
        classification: 'S',
        tlp: 'AMBER',
        purpose: 'intelligence_request',
        instructions: 'Analyze the provided intelligence data',
        need_to_know: ['INTEL', 'ANALYSIS'],
        compartments: ['TACTICAL', 'INTEL'],
        context_refs: [{ type: 'doc', id: 'doc-456' }],
        tools_allowed: ['analysis'],
        slo: {
          latency_s: 300,
          cost_cap_usd: 10.0
        }
      }

    it('should successfully create a message envelope', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/messages/send', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validCreateRequest)
      })

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.envelope).toEqual(validMessageEnvelope)
      expect(mockCreateMessage).toHaveBeenCalledWith(validCreateRequest)
    })

    it('should reject request missing required fields', async () => {
      const incompleteRequest = {
          origin: 'overseer',
          target: 'intel_analyst',
          // Missing classification, tlp, purpose, instructions
          need_to_know: ['INTEL']
        }

      const mockRequest = new NextRequest('http://localhost:3000/api/messages/send', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incompleteRequest)
      })

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required fields: origin, target, classification, tlp, purpose, instructions')
      expect(mockCreateMessage).not.toHaveBeenCalled()
    })

    it('should handle each missing required field', async () => {
      const requiredFields = ['origin', 'target', 'classification', 'tlp', 'purpose', 'instructions']
      
      for (const fieldToOmit of requiredFields) {
        const incompleteRequest = { ...validCreateRequest }
        delete (incompleteRequest as any)[fieldToOmit]

        const mockRequest = new NextRequest('http://localhost:3000/api/messages/send', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(incompleteRequest)
        })

        const response = await PUT(mockRequest)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('Missing required fields')
      }
    })

    it('should handle message bus creation errors', async () => {
      mockCreateMessage.mockImplementation(() => {
        throw new Error('Invalid agent configuration')
      })

      const mockRequest = new NextRequest('http://localhost:3000/api/messages/send', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validCreateRequest)
      })

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create message envelope')
      expect(data.details).toBe('Invalid agent configuration')
    })

    it('should handle malformed JSON in PUT request', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/messages/send', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      })

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create message envelope')
    })

    it('should create envelope with optional fields', async () => {
      const minimalRequest = {
        origin: 'overseer',
        target: 'intel_analyst',
        classification: 'C',
        tlp: 'GREEN',
        purpose: 'status_check',
        instructions: 'Provide status update'
        // Optional fields omitted
      }

      const mockRequest = new NextRequest('http://localhost:3000/api/messages/send', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(minimalRequest)
      })

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockCreateMessage).toHaveBeenCalledWith(minimalRequest)
    })

    it('should handle empty string values for required fields', async () => {
      const requestWithEmptyStrings = {
        ...validCreateRequest,
        origin: '',
        target: '',
        classification: '',
        tlp: '',
        purpose: '',
        instructions: ''
      }

      const mockRequest = new NextRequest('http://localhost:3000/api/messages/send', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestWithEmptyStrings)
      })

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required fields: origin, target, classification, tlp, purpose, instructions')
    })
  })

  describe('Message Envelope Validation Edge Cases', () => {
    it('should handle extremely long instructions', async () => {
      const longInstructions = 'A'.repeat(10000) // Very long string
      const envelopeWithLongInstructions = {
        ...validMessageEnvelope,
        instructions: longInstructions
      }

      const mockRequest = new NextRequest('http://localhost:3000/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(envelopeWithLongInstructions)
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      // Should still be valid if it passes schema validation
      expect(response.status).toBe(200)
      expect(mockSendMessage).toHaveBeenCalledWith(envelopeWithLongInstructions)
    })

    it('should handle special characters in message fields', async () => {
      const envelopeWithSpecialChars = {
        ...validMessageEnvelope,
        instructions: 'Analyze data with special chars: @#$%^&*()[]{}|\\:";\'<>?,./',
        purpose: 'test_with_special_chars'
      }

      const mockRequest = new NextRequest('http://localhost:3000/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(envelopeWithSpecialChars)
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockSendMessage).toHaveBeenCalledWith(envelopeWithSpecialChars)
    })

    it('should handle Unicode characters in message fields', async () => {
      const envelopeWithUnicode = {
        ...validMessageEnvelope,
        instructions: 'Analyze data: 测试 🔒 Ñoël café résumé',
        purpose: 'unicode_test'
      }

      const mockRequest = new NextRequest('http://localhost:3000/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(envelopeWithUnicode)
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockSendMessage).toHaveBeenCalledWith(envelopeWithUnicode)
    })
  })
})