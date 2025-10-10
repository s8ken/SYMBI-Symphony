/**
 * Global Test Setup
 * This file runs once before all tests
 */

import { config } from 'dotenv';
import path from 'path';

export default async (): Promise<void> => {
  // Load test environment variables
  config({ path: path.resolve(__dirname, '../.env.test') });

  // Set global test environment
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'silent';
  process.env.SUPPRESS_CONSOLE = 'true';

  // Initialize test database or external services if needed
  console.log('🧪 Setting up test environment...');

  // Mock external services
  process.env.MOCK_EXTERNAL_SERVICES = 'true';
  process.env.ORCHESTRATOR_URL = 'http://localhost:3000';
  process.env.AGENT_API_KEY = 'test-api-key';

  // Set up test timeouts
  process.env.REQUEST_TIMEOUT = '5000';
  process.env.HEALTH_CHECK_INTERVAL = '1000';

  console.log('✅ Test environment setup complete');
};