import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 15000,
  retries: 0,
  workers: 1,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'echo "Using existing dev server"',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
});
