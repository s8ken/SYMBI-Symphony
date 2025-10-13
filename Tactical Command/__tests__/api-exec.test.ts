/**
 * Exec API Endpoint Tests
 * Tests for /api/exec endpoint with HMAC signature verification and intent handling
 */

import { NextRequest } from 'next/server'
import { POST as execHandler } from '@/app/api/exec/route'
import crypto from 'crypto'

// Mock environment variables
const mockEnv = {
  SYMBI_SHARED_SECRET: 'test-secret-key',
  BASE_URL: 'http://localhost:3000',
  ED25519_PRIV_HEX: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
}

// Set up environment variables before importing the route
Object.assign(process.env, mockEnv)

// Mock global fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: jest.fn(() => 'test-session-id-12345'),
  randomBytes: jest.fn(() => Buffer.from('test-hash-bytes', 'utf8'))
}))

describe('Exec API Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset environment variables
    Object.assign(process.env, mockEnv)
    global.fetch = mockFetch
    global.crypto = {
      randomUUID: jest.fn(() => 'test-session-id-12345'),
      randomBytes: jest.fn(() => Buffer.from('test-hash-bytes', 'utf8')),
      subtle: {
        digest: jest.fn().mockResolvedValue(new ArrayBuffer(32))
      }
    }
  })

  afterEach(() => {
    // Clean up environment variables
    Object.keys(mockEnv).forEach(key => {
      delete process.env[key]
    })
  })

  const createValidHmac = (intent: any): string => {
    return crypto
      .createHmac('sha256', mockEnv.SYMBI_SHARED_SECRET)
      .update(JSON.stringify(intent))
      .digest('hex')
  }

  describe('HMAC Signature Verification', () => {
    it('should accept valid HMAC signature', async () => {
      const intent = { type: 'rag.query', query: 'test query', top_k: 5 }
      const validHmac = createValidHmac(intent)

      // Mock successful RAG response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          matches: [
            { content: 'test result 1', score: 0.95 },
            { content: 'test result 2', score: 0.87 }
          ]
        })
      })

      const mockRequest = new NextRequest('http://localhost:3000/api/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent,
          hmac_signature: validHmac
        })
      })

      const response = await execHandler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.matches).toHaveLength(2)
      expect(data.receipt_stub).toBeDefined()
      expect(data.receipt_stub.session_id).toBe('test-session-id-12345')
    })

    it('should reject invalid HMAC signature', async () => {
      const intent = { type: 'rag.query', query: 'test query' }
      const invalidHmac = 'invalid-hmac-signature'

      const mockRequest = new NextRequest('http://localhost:3000/api/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent,
          hmac_signature: invalidHmac
        })
      })

      const response = await execHandler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('invalid_signature')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should reject missing HMAC signature', async () => {
      const intent = { type: 'rag.query', query: 'test query' }

      const mockRequest = new NextRequest('http://localhost:3000/api/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent })
      })

      const response = await execHandler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('invalid_signature')
    })

    it('should handle tampered intent data', async () => {
      const originalIntent = { type: 'rag.query', query: 'original query' }
      const tamperedIntent = { type: 'rag.query', query: 'tampered query' }
      const validHmacForOriginal = createValidHmac(originalIntent)

      const mockRequest = new NextRequest('http://localhost:3000/api/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: tamperedIntent,
          hmac_signature: validHmacForOriginal
        })
      })

      const response = await execHandler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('invalid_signature')
    })
  })

  describe('RAG Query Intent', () => {
    it('should handle successful RAG query with default parameters', async () => {
      const intent = { type: 'rag.query', query: 'test query' }
      const validHmac = createValidHmac(intent)

      const mockRagResponse = {
        matches: [
          { content: 'result 1', score: 0.95, metadata: { source: 'doc1' } },
          { content: 'result 2', score: 0.87, metadata: { source: 'doc2' } }
        ]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRagResponse
      })

      const mockRequest = new NextRequest('http://localhost:3000/api/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent,
          hmac_signature: validHmac
        })
      })

      const response = await execHandler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.matches).toEqual(mockRagResponse.matches)
      expect(data.receipt_stub).toMatchObject({
        session_id: 'test-session-id-12345',
        intent_type: 'rag.query',
        query: 'test query',
        matches_count: 2
      })
      expect(data.receipt_stub.signature).toMatch(/^ed25519:/)
      expect(data.next).toBeNull()

      // Verify RAG endpoint was called with correct parameters
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/rag/retrieve',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: 'test query',
            top_k: 6 // default value
          })
        }
      )
    })

    it('should handle RAG query with custom top_k parameter', async () => {
      const intent = { type: 'rag.query', query: 'custom query', top_k: 10 }
      const validHmac = createValidHmac(intent)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ matches: [] })
      })

      const mockRequest = new NextRequest('http://localhost:3000/api/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent,
          hmac_signature: validHmac
        })
      })

      const response = await execHandler(mockRequest)
      
      expect(response.status).toBe(200)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/rag/retrieve',
        expect.objectContaining({
          body: JSON.stringify({
            q: 'custom query',
            top_k: 10
          })
        })
      )
    })

    it('should handle RAG endpoint failure', async () => {
      const intent = { type: 'rag.query', query: 'failing query' }
      const validHmac = createValidHmac(intent)

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const mockRequest = new NextRequest('http://localhost:3000/api/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent,
          hmac_signature: validHmac
        })
      })

      const response = await execHandler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('rag_failed')
    })

    it('should handle RAG endpoint network error', async () => {
      const intent = { type: 'rag.query', query: 'network error query' }
      const validHmac = createValidHmac(intent)

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const mockRequest = new NextRequest('http://localhost:3000/api/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent,
          hmac_signature: validHmac
        })
      })

      const response = await execHandler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('internal_error')
    })

    it('should handle empty RAG results', async () => {
      const intent = { type: 'rag.query', query: 'no results query' }
      const validHmac = createValidHmac(intent)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ matches: [] })
      })

      const mockRequest = new NextRequest('http://localhost:3000/api/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent,
          hmac_signature: validHmac
        })
      })

      const response = await execHandler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.matches).toEqual([])
      expect(data.receipt_stub.matches_count).toBe(0)
    })
  })

  describe('Unsupported Intent Types', () => {
    it('should reject unsupported intent type', async () => {
      const intent = { type: 'unsupported.action', data: 'test' }
      const validHmac = createValidHmac(intent)

      const mockRequest = new NextRequest('http://localhost:3000/api/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent,
          hmac_signature: validHmac
        })
      })

      const response = await execHandler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('unsupported_intent')
      expect(data.supported).toEqual(['rag.query'])
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle missing intent type', async () => {
      const intent = { query: 'test query' } // missing type
      const validHmac = createValidHmac(intent)

      const mockRequest = new NextRequest('http://localhost:3000/api/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent,
          hmac_signature: validHmac
        })
      })

      const response = await execHandler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('unsupported_intent')
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed JSON request', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      })

      const response = await execHandler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('internal_error')
    })

    it('should handle missing environment variables', async () => {
      delete process.env.SYMBI_SHARED_SECRET

      const intent = { type: 'rag.query', query: 'test' }
      const mockRequest = new NextRequest('http://localhost:3000/api/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent,
          hmac_signature: 'test-hmac'
        })
      })

      const response = await execHandler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('internal_error')
    })

    it('should handle missing BASE_URL environment variable', async () => {
      delete process.env.BASE_URL
      
      const intent = { type: 'rag.query', query: 'test query' }
      const validHmac = createValidHmac(intent)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ matches: [] })
      })

      const mockRequest = new NextRequest('http://localhost:3000/api/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent,
          hmac_signature: validHmac
        })
      })

      const response = await execHandler(mockRequest)
      
      expect(response.status).toBe(200)
      // Should use default BASE_URL
      expect(mockFetch).toHaveBeenCalledWith(
        'https://symbi-exec.vercel.app/api/rag/retrieve',
        expect.any(Object)
      )
    })
  })

  describe('Receipt Generation', () => {
    it('should generate proper receipt structure', async () => {
      const intent = { type: 'rag.query', query: 'receipt test' }
      const validHmac = createValidHmac(intent)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          matches: [{ content: 'test', score: 0.9 }]
        })
      })

      const mockRequest = new NextRequest('http://localhost:3000/api/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent,
          hmac_signature: validHmac
        })
      })

      const response = await execHandler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.receipt_stub).toMatchObject({
        session_id: expect.any(String),
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        intent_type: 'rag.query',
        query: 'receipt test',
        matches_count: 1,
        hash_self: expect.any(String),
        signature: expect.stringMatching(/^ed25519:/)
      })
    })

    it('should include truncated private key in signature', async () => {
      const intent = { type: 'rag.query', query: 'signature test' }
      const validHmac = createValidHmac(intent)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ matches: [] })
      })

      const mockRequest = new NextRequest('http://localhost:3000/api/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent,
          hmac_signature: validHmac
        })
      })

      const response = await execHandler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.receipt_stub.signature).toMatch(/^ed25519:[a-f0-9]+:abcdef1234567890\.\.\./)
    })
  })
})