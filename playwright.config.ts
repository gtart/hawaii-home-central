import { defineConfig, devices } from '@playwright/test'
import { PERSONAS, DEFAULT_PERSONA } from './e2e/personas'

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['html', { outputFolder: 'e2e/report' }]],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    screenshot: 'on',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // ----------------------------------------------------------------
    // Auth setup -- runs first, creates storageState for all personas
    // ----------------------------------------------------------------
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.ts/,
      timeout: 60_000,
    },

    // ----------------------------------------------------------------
    // Public (unauthenticated) -- desktop, mobile, android
    // ----------------------------------------------------------------
    {
      name: 'public',
      testMatch: /public.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'public-mobile',
      testMatch: /public.*\.spec\.ts/,
      use: { ...devices['iPhone 14'] },
    },
    {
      name: 'public-android',
      testMatch: /public.*\.spec\.ts/,
      use: { ...devices['Pixel 7'] },
    },

    // ----------------------------------------------------------------
    // Authenticated (default persona = full-setup) -- desktop, mobile, android
    // ----------------------------------------------------------------
    {
      name: 'authenticated',
      testMatch: /app.*\.spec\.ts/,
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: DEFAULT_PERSONA.storageStatePath,
      },
    },
    {
      name: 'authenticated-mobile',
      testMatch: /app.*\.spec\.ts/,
      dependencies: ['auth-setup'],
      use: {
        ...devices['iPhone 14'],
        storageState: DEFAULT_PERSONA.storageStatePath,
      },
    },
    {
      name: 'authenticated-android',
      testMatch: /app.*\.spec\.ts/,
      dependencies: ['auth-setup'],
      use: {
        ...devices['Pixel 7'],
        storageState: DEFAULT_PERSONA.storageStatePath,
      },
    },

    // ----------------------------------------------------------------
    // Persona-specific tests -- desktop only
    // ----------------------------------------------------------------
    ...PERSONAS.map((persona) => ({
      name: `persona-${persona.key}`,
      testMatch: persona.testMatch,
      dependencies: ['auth-setup'] as string[],
      use: {
        ...devices['Desktop Chrome'],
        storageState: persona.storageStatePath,
      },
    })),
  ],

  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: process.env.E2E_PROD_BUILD
          ? 'npm run build && npx next start -p 3000'
          : 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: process.env.E2E_PROD_BUILD ? 120_000 : 60_000,
      },
})
