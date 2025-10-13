/**
 * RAG API Endpoint Tests
 * Tests for /api/rag/retrieve endpoint including OpenAI and Weaviate integration
 */

import { NextRequest } from 'next/server'
import { setupExternalServiceMocks, cleanupExternalServiceMocks } from '../lib/mocks/external-services.mock.js'

// Mock OpenAI before importing the route
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{
          embedding: new Array(1536).fill(0).map(() => Math.random())
        }]
      })
    }
  }))
})

// Mock Weaviate before importing the route
jest.mock('weaviate-ts-client', () => ({
  client: jest.fn().mockReturnValue({
    graphql: {
      get: jest.fn().mockReturnValue({
        withClassName: jest.fn().mockReturnThis(),
        withNearVector: jest.fn().mockReturnThis(),
        withLimit: jest.fn().mockReturnThis(),
        withFields: jest.fn().mockReturnThis(),
        do: jest.fn().mockResolvedValue({
          data: {
            Get: {
              VaultDoc: [
                {
                  path: '/test/document.md',
                  title: 'Test Document',
                  chunk_index: 0,
                  content: 'This is test content for RAG retrieval',
                  updated_at: '2024-01-01T00:00:00Z',
                  metadata: '{"source": "test"}',
                  _additional: {
                    id: 'test-id-1',
                    distance: 0.1
                  }
                }
              ]
            }
          }
        })
      })
    }
  }),
  ApiKey: jest.fn().mockImplementation((key) => ({ key }))
}))

import { POST } from '@/app/api/rag/retrieve/route'

// Setup mocks before all tests
beforeAll(() => {
  setupExternalServiceMocks()
})

// Cleanup mocks after all tests
afterAll(() => {
  cleanupExternalServiceMocks()
})

// Mock environment variables
const originalEnv = process.env
beforeEach(() => {
  process.env = {
    ...originalEnv,
    OPENAI_API_KEY: 'test-openai-key',
    WEAVIATE_HOST: 'https://test-weaviate.com',
    WEAVIATE_API_KEY: 'test-weaviate-key'
  }
})

afterEach(() => {
  process.env = originalEnv
  jest.clearAllMocks()
})

describe('RAG Retrieve API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Set up environment variables
    process.env.OPENAI_API_KEY = 'test-openai-key'
    process.env.WEAVIATE_HOST = 'https://test-weaviate.com'
    process.env.WEAVIATE_API_KEY = 'test-weaviate-key'
  })
  describe('POST /api/rag/retrieve', () => {
    it('should successfully retrieve documents with default parameters', async () => {
      const mockRequest = new Request('http://localhost:3000/api/rag/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: 'test query'
        })
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('matches')
      expect(Array.isArray(data.matches)).toBe(true)
      expect(data.matches.length).toBeGreaterThan(0)
      
      // Verify match structure
      const match = data.matches[0]
      expect(match).toHaveProperty('id')
      expect(match).toHaveProperty('path')
      expect(match).toHaveProperty('title')
      expect(match).toHaveProperty('content')
      expect(match).toHaveProperty('similarity')
      expect(match).toHaveProperty('distance')
    })

    it('should handle custom top_k parameter', async () => {
      const mockRequest = new Request('http://localhost:3000/api/rag/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: 'test query',
          top_k: 3
        })
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.matches.length).toBeLessThanOrEqual(3)
    })

    it('should handle empty query', async () => {
      const mockRequest = new Request('http://localhost:3000/api/rag/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: ''
        })
      })

      const response = await POST(mockRequest)
      
      // Should still process empty query (OpenAI can handle empty strings)
      expect(response.status).toBe(200)
    })

    it('should handle missing query parameter', async () => {
      const mockRequest = new Request('http://localhost:3000/api/rag/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const response = await POST(mockRequest)
      
      // Should handle undefined query gracefully
      expect(response.status).toBe(200)
    })

    it('should handle invalid JSON in request body', async () => {
      const mockRequest = new Request('http://localhost:3000/api/rag/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      })

      // This should throw an error when trying to parse JSON
      await expect(POST(mockRequest)).rejects.toThrow()
    })

    it('should handle missing environment variables', async () => {
      // Remove required environment variables
      delete process.env.OPENAI_API_KEY
      delete process.env.WEAVIATE_HOST
      delete process.env.WEAVIATE_API_KEY

      const mockRequest = new Request('http://localhost:3000/api/rag/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: 'test query'
        })
      })

      // Should throw error due to missing API key
      await expect(POST(mockRequest)).rejects.toThrow()
    })

    it('should calculate similarity correctly from distance', async () => {
      const mockRequest = new Request('http://localhost:3000/api/rag/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: 'test query'
        })
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      // Check similarity calculation (1 - distance)
      data.matches.forEach((match: any) => {
        if (typeof match.distance === 'number') {
          expect(match.similarity).toBe(1 - match.distance)
        }
      })
    })

    it('should handle Weaviate connection errors', async () => {
      // Mock Weaviate to throw an error
      const mockWeaviate = require('weaviate-ts-client')
      mockWeaviate.client.mockReturnValue({
        graphql: {
          get: jest.fn().mockReturnValue({
            withClassName: jest.fn().mockReturnThis(),
            withNearVector: jest.fn().mockReturnThis(),
            withLimit: jest.fn().mockReturnThis(),
            withFields: jest.fn().mockReturnThis(),
            do: jest.fn().mockRejectedValue(new Error('Weaviate connection failed'))
          })
        }
      })

      const mockRequest = new Request('http://localhost:3000/api/rag/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: 'test query'
        })
      })

      await expect(POST(mockRequest)).rejects.toThrow('Weaviate connection failed')
    })

    it('should handle OpenAI API errors', async () => {
      // Mock OpenAI to throw an error
      const mockOpenAI = require('openai')
      mockOpenAI.mockImplementation(() => ({
        embeddings: {
          create: jest.fn().mockRejectedValue(new Error('OpenAI API error'))
        }
      }))

      const mockRequest = new Request('http://localhost:3000/api/rag/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: 'test query'
        })
      })

      await expect(POST(mockRequest)).rejects.toThrow('OpenAI API error')
    })

    it('should use correct embedding model', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        data: [{
          embedding: new Array(1536).fill(0).map(() => Math.random())
        }]
      })
      
      const mockOpenAI = require('openai')
      mockOpenAI.mockImplementation(() => ({
        embeddings: {
          create: mockCreate
        }
      }))

      // Reset Weaviate mock to succeed for this test
      const mockWeaviate = require('weaviate-ts-client')
      mockWeaviate.client.mockReturnValue({
        graphql: {
          get: jest.fn().mockReturnValue({
            withClassName: jest.fn().mockReturnThis(),
            withNearVector: jest.fn().mockReturnThis(),
            withLimit: jest.fn().mockReturnThis(),
            withFields: jest.fn().mockReturnThis(),
            do: jest.fn().mockResolvedValue({
              data: {
                Get: {
                  VaultDoc: [
                    {
                      path: '/test/document.md',
                      title: 'Test Document',
                      chunk_index: 0,
                      content: 'This is test content for RAG retrieval',
                      updated_at: '2024-01-01T00:00:00Z',
                      metadata: '{"source": "test"}',
                      _additional: {
                        id: 'test-id-1',
                        distance: 0.1
                      }
                    }
                  ]
                }
              }
            })
          })
        }
      })

      const mockRequest = new Request('http://localhost:3000/api/rag/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: 'test query'
        })
      })

      await POST(mockRequest)

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: 'test query'
      })
    })
  })
})