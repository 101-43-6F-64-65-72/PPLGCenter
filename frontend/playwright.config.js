import { defineConfig, devices } from '@playwright/test';

const frontendURL = process.env.PLAYWRIGHT_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
const backendURL = process.env.PLAYWRIGHT_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5051';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list']],
  timeout: 90_000,
  use: {
    baseURL: frontendURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'powershell -ExecutionPolicy Bypass -File start_backend.ps1',
      url: 'http://localhost:5051/health',
      reuseExistingServer: true,
      timeout: 120_000,
      cwd: '..',
    },
    {
      command: 'npm run dev',
      url: frontendURL,
      reuseExistingServer: true,
      timeout: 120_000,
      cwd: '.',
      env: {
        ...process.env,
        NEXT_PUBLIC_API_BASE_URL: backendURL,
      },
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
