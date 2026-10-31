import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './apps/web/tests',
  timeout: 30000,
  retries: 0,
  use: {
    channel: process.env.QIMEN_BROWSER_CHANNEL || undefined,
    baseURL: 'http://127.0.0.1:4196/qimen-ai/',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run preview -w @qimen/web -- --port 4196 --strictPort --base /qimen-ai/',
    url: 'http://127.0.0.1:4196/qimen-ai/',
    reuseExistingServer: false,
  },
  reporter: [['list'], ['html', { open: 'never' }]],
});
