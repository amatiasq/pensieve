import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: 1,
  use: {
    baseURL: 'http://localhost:1234',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      testMatch: 'mobile.spec.ts',
    },
  ],
  webServer: {
    command: 'npm start',
    port: 1234,
    reuseExistingServer: true,
  },
});
