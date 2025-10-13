// Mock setup for external services used in RAG tests

export function setupExternalServiceMocks() {
  // Mock environment variables for external services
  process.env.OPENAI_API_KEY = 'test-openai-key'
  process.env.WEAVIATE_URL = 'http://localhost:8080'
  process.env.WEAVIATE_API_KEY = 'test-weaviate-key'
}

export function cleanupExternalServiceMocks() {
  // Clean up any mock state if needed
  // This function is called after all tests to ensure clean state
}