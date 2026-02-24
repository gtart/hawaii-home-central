/**
 * Persona: New User -- no projects at all.
 * Tests the empty/onboarding state the app shows when a user
 * has been bootstrapped but has zero projects.
 */
import { test, expect } from '@playwright/test'
import { screenshotPath } from './helpers/screenshot'

test('new user: dashboard shows empty/onboarding state', async ({ page }, testInfo) => {
  await page.goto('/app', { waitUntil: 'networkidle' })
  await expect(page).not.toHaveURL(/\/login/)
  await page.screenshot({
    path: screenshotPath('persona-new-user-dashboard', testInfo),
    fullPage: true,
  })
})

test('new user: projects page shows no projects', async ({ page }, testInfo) => {
  await page.goto('/app/projects', { waitUntil: 'networkidle' })
  await page.screenshot({
    path: screenshotPath('persona-new-user-projects', testInfo),
    fullPage: true,
  })
})

test('new user: fix list tool shows empty state', async ({ page }, testInfo) => {
  await page.goto('/app/tools/punchlist', { waitUntil: 'networkidle' })
  await page.screenshot({
    path: screenshotPath('persona-new-user-fixlist', testInfo),
    fullPage: true,
  })
})

test('new user: selections list shows empty state', async ({ page }, testInfo) => {
  await page.goto('/app/tools/finish-decisions', { waitUntil: 'networkidle' })
  await page.screenshot({
    path: screenshotPath('persona-new-user-selections', testInfo),
    fullPage: true,
  })
})

test('new user: contract checklist shows empty state', async ({ page }, testInfo) => {
  await page.goto('/app/tools/before-you-sign', { waitUntil: 'networkidle' })
  await page.screenshot({
    path: screenshotPath('persona-new-user-contracts', testInfo),
    fullPage: true,
  })
})
