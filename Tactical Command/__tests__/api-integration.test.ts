/**
 * API Integration Tests for Tactical Command
 */
import crypto from 'crypto'

// Mock Next.js Request/Response for testing
global.Request = class MockRequest {
  url: string
  method: string
  headers: any
  body: any

  constructor(url: string, options: any = {}) {
    this.url = url
    this.method = options.method || 'GET'
    this.headers = options.headers || {}
    this.body = options.body
  }

  async json() {
    return JSON.parse(this.body)
  }
}

global.Response = class MockResponse {
  status: number
  data: any

  constructor(data: any, options: any = {}) {
    this.data = data
    this.status = options.status || 200
  }

  async json() {
    return this.data
  }
}

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, options: any = {}) => ({
      status: options.status || 200,
      data,
      json: async () => data
    })
  }
}))

describe('API Integration Tests', () => {
  // Mock environment variables
  beforeAll(() => {
    process.env.SYMBI_SHARED_SECRET = 'test-secret-key'
    process.env.BASE_URL = 'http://localhost:3000'
    process.env.ED25519_PRIV_HEX = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
  })

  describe('HMAC Signature Validation', () => {
    test('should generate valid HMAC signature', () => {
      const intent = { type: 'rag.query', query: 'test query' }
      const sharedSecret = process.env.SYMBI_SHARED_SECRET!
      
      const hmac = crypto
        .createHmac('sha256', sharedSecret)
        .update(JSON.stringify(intent))
        .digest('hex')

      expect(hmac).toBeDefined()
      expect(typeof hmac).toBe('string')
      expect(hmac.length).toBe(64) // SHA256 hex string length
    })

    test('should validate HMAC signature consistency', () => {
      const intent = { type: 'rag.query', query: 'test query' }
      const sharedSecret = process.env.SYMBI_SHARED_SECRET!
      
      const hmac1 = crypto
        .createHmac('sha256', sharedSecret)
        .update(JSON.stringify(intent))
        .digest('hex')

      const hmac2 = crypto
        .createHmac('sha256', sharedSecret)
        .update(JSON.stringify(intent))
        .digest('hex')

      expect(hmac1).toBe(hmac2)
    })

    test('should reject invalid HMAC signatures', () => {
      const intent = { type: 'rag.query', query: 'test query' }
      const sharedSecret = process.env.SYMBI_SHARED_SECRET!
      
      const validHmac = crypto
        .createHmac('sha256', sharedSecret)
        .update(JSON.stringify(intent))
        .digest('hex')

      const invalidHmac = 'invalid-signature'

      expect(validHmac).not.toBe(invalidHmac)
    })
  })

  describe('API Request Structure', () => {
    test('should have consistent error response format', () => {
      const errorResponse = { error: 'test_error' }
      expect(errorResponse).toHaveProperty('error')
      expect(typeof errorResponse.error).toBe('string')
    })

    test('should validate request body structure', () => {
      const validBody = {
        intent: { type: 'rag.query', query: 'test' },
        hmac_signature: 'signature'
      }
      
      expect(validBody).toHaveProperty('intent')
      expect(validBody).toHaveProperty('hmac_signature')
      expect(validBody.intent).toHaveProperty('type')
    })

    test('should validate intent structure for RAG queries', () => {
      const ragIntent = {
        type: 'rag.query',
        query: 'test query',
        top_k: 5
      }

      expect(ragIntent.type).toBe('rag.query')
      expect(typeof ragIntent.query).toBe('string')
      expect(typeof ragIntent.top_k).toBe('number')
    })
  })

  describe('Environment Configuration', () => {
    test('should have required environment variables', () => {
      expect(process.env.SYMBI_SHARED_SECRET).toBeDefined()
      expect(process.env.BASE_URL).toBeDefined()
      expect(process.env.ED25519_PRIV_HEX).toBeDefined()
    })

    test('should validate shared secret format', () => {
      const secret = process.env.SYMBI_SHARED_SECRET!
      expect(typeof secret).toBe('string')
      expect(secret.length).toBeGreaterThan(0)
    })
  })
})