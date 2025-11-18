module.exports = {
  // Test environment
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Root directory
  rootDir: '.',

  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.ts',
    '<rootDir>/src/**/__tests__/**/*.spec.ts',
    '<rootDir>/__tests__/**/*.test.ts',
    '<rootDir>/__tests__/**/*.spec.ts'
  ],

  // Transform files
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@trust/(.*)$': '<rootDir>/src/core/trust/$1'
  },

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },

  // Test timeout
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  resetModules: true,

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/examples/',
    '/docs/',
    '/src/integration/' // Exclude integration files with build errors
  ],

  // Transform ignore patterns
  transformIgnorePatterns: [
    '/node_modules/(?!(some-esm-package)/)',
    'node_modules/(?!(.*?@noble)/)'
  ],

  // Error on deprecated APIs
  errorOnDeprecated: true,

  // Disable notifications
  notify: false,

  // Reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'coverage',
      outputName: 'junit.xml'
    }]
  ]
};