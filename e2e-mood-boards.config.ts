import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/results',
  workers: 1,
  timeout: 120000,
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    screenshot: 'on',
    storageState: 'e2e/.auth/persona-full-setup.json',
    launchOptions: { timeout: 60000 },
    ...devices['Desktop Chrome'],
  },
})
