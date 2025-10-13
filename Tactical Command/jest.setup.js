import '@testing-library/jest-dom'

// Setup global fetch for Node.js environment
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock crypto for Node.js environment
const crypto = require('crypto')
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => crypto.randomUUID(),
    randomBytes: (size) => crypto.randomBytes(size),
    subtle: {
      digest: async (algorithm, data) => {
        const hash = crypto.createHash(algorithm.replace('-', '').toLowerCase())
        hash.update(data)
        return hash.digest()
      }
    }
  }
})