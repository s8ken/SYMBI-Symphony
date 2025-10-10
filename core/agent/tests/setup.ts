/**
 * Jest Test Setup
 * This file runs before each test file
 */

// Extend Jest matchers
import 'jest-extended';

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };

beforeEach(() => {
  // Reset console mocks before each test
  jest.clearAllMocks();
  
  // Optionally suppress console output in tests
  if (process.env.SUPPRESS_CONSOLE === 'true') {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    console.info = jest.fn();
    console.debug = jest.fn();
  }
});

afterEach(() => {
  // Restore console methods after each test
  if (process.env.SUPPRESS_CONSOLE === 'true') {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;
  }
});

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidAgent(): R;
      toBeValidTask(): R;
      toBeValidMessage(): R;
    }
  }
}

// Custom Jest matchers
expect.extend({
  toBeValidAgent(received) {
    const pass = received &&
      typeof received.id === 'string' &&
      typeof received.name === 'string' &&
      typeof received.type === 'string' &&
      typeof received.status === 'string';

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid agent`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid agent`,
        pass: false
      };
    }
  },

  toBeValidTask(received) {
    const pass = received &&
      typeof received.id === 'string' &&
      typeof received.type === 'string' &&
      typeof received.status === 'string' &&
      typeof received.priority === 'string';

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid task`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid task`,
        pass: false
      };
    }
  },

  toBeValidMessage(received) {
    const pass = received &&
      typeof received.id === 'string' &&
      typeof received.type === 'string' &&
      typeof received.senderId === 'string' &&
      typeof received.receiverId === 'string';

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid message`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid message`,
        pass: false
      };
    }
  }
});

// Mock external dependencies that are commonly used in tests
jest.mock('axios', () => ({
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    patch: jest.fn(() => Promise.resolve({ data: {} }))
  }
}));

// Set up fake timers for consistent testing
beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

// Increase timeout for async operations
jest.setTimeout(30000);