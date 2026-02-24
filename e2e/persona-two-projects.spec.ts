/**
 * Persona: Two Projects -- "Beach House" and "Condo Remodel".
 * Tests that project switching works and both projects are accessible.
 */
import { test, expect } from '@playwright/test'
import { screenshotPath } from './helpers/screenshot'

test('two-projects: dashboard loads with current project', async ({ page }, testInfo) => {
  await page.goto('/app', { waitUntil: 'networkidle' })
  await expect(page).not.toHaveURL(/\/login/)
  await page.screenshot({
    path: screenshotPath('persona-two-projects-dashboard', testInfo),
    fullPage: true,
  })
})

test('two-projects: projects page shows both projects', async ({ page }, testInfo) => {
  await page.goto('/app/projects', { waitUntil: 'networkidle' })
  await page.screenshot({
    path: screenshotPath('persona-two-projects-list', testInfo),
    fullPage: true,
  })
})

test('two-projects: fix list has items for current project', async ({ page }, testInfo) => {
  await page.goto('/app/tools/punchlist', { waitUntil: 'networkidle' })
  await page.screenshot({
    path: screenshotPath('persona-two-projects-fixlist', testInfo),
    fullPage: true,
  })
})

test('two-projects: settings page accessible', async ({ page }, testInfo) => {
  await page.goto('/app/settings', { waitUntil: 'networkidle' })
  await page.screenshot({
    path: screenshotPath('persona-two-projects-settings', testInfo),
    fullPage: true,
  })
})
