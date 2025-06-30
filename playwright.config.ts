import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false, // E2E tests with extensions should run sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Browser extensions can have conflicts with parallel execution
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3003',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium-extension',
      use: { 
        ...devices['Desktop Chrome'],
        // Browser extension tests require specific Chrome args
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-dev-shm-usage',
            '--no-sandbox',
          ],
        },
      },
    },
  ],

  webServer: {
    command: 'pnpm test:e2e:setup',
    port: 3003,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
});