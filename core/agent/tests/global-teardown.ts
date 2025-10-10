/**
 * Global Test Teardown
 * This file runs once after all tests
 */

export default async (): Promise<void> => {
  console.log('🧹 Cleaning up test environment...');

  // Clean up test database or external services if needed
  // Close any open connections
  // Remove temporary files

  // Reset environment variables
  delete process.env.MOCK_EXTERNAL_SERVICES;
  delete process.env.SUPPRESS_CONSOLE;

  console.log('✅ Test environment cleanup complete');
};