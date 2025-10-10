// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['line']],
  globalSetup: require.resolve('./tests/utils/global-setup.js'),
  use: {
    baseURL: 'http://localhost:3002',
    storageState: 'playwright/.auth/ycq.json',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    // Safari can be flaky: give it more time and retries
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      retries: 2,
      timeout: 45_000,
      expect: { timeout: 10_000 },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    // iPhone can be flaky: give it more time and retries
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
      retries: 2,
      timeout: 45_000,
    },
  ],

  // Make sure servers are actually ready before tests start
  webServer: [
    {
      name: 'backend',
      command: 'node backend/server.js',
      url: 'http://localhost:5001/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      name: 'frontend',
      command: 'cd frontend && PORT=3002 npm start',
      url: 'http://localhost:3002',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});