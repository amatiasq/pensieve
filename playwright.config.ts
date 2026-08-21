import { defineConfig, devices } from '@playwright/test';

// El 1234 es el puerto de siempre, pero es un puerto popular —LM Studio escucha
// ahí— y `reuseExistingServer` no comprueba qué hay al otro lado: si algo lo
// ocupa, la suite entera se ejecuta contra ese algo y falla por todas partes.
const port = Number(process.env.PENSIEVE_E2E_PORT ?? 1234);

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: 1,
  use: {
    baseURL: `http://localhost:${port}`,
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
    command: `npm start -- --port ${port} --strictPort`,
    port,
    reuseExistingServer: true,
  },
});
