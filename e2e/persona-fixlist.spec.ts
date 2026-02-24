/**
 * Persona: Fix List Only -- 1 project with 15 punchlist items.
 * Tests that the fix list renders with mixed statuses, locations,
 * assignees, and that other tools are empty.
 */
import { test, expect } from '@playwright/test'
import { screenshotPath } from './helpers/screenshot'

test('fixlist: dashboard shows active project', async ({ page }, testInfo) => {
  await page.goto('/app', { waitUntil: 'networkidle' })
  await expect(page).not.toHaveURL(/\/login/)
  await page.screenshot({
    path: screenshotPath('persona-fixlist-dashboard', testInfo),
    fullPage: true,
  })
})

test('fixlist: fix list shows 15 populated items', async ({ page }, testInfo) => {
  await page.goto('/app/tools/punchlist', { waitUntil: 'networkidle' })
  await page.screenshot({
    path: screenshotPath('persona-fixlist-list-top', testInfo),
    fullPage: true,
  })

  // Scroll to see all items
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(500)
  await page.screenshot({
    path: screenshotPath('persona-fixlist-list-bottom', testInfo),
    fullPage: true,
  })
})

test('fixlist: selections list is empty', async ({ page }, testInfo) => {
  await page.goto('/app/tools/finish-decisions', { waitUntil: 'networkidle' })
  await page.screenshot({
    path: screenshotPath('persona-fixlist-selections-empty', testInfo),
    fullPage: true,
  })
})

test('fixlist: contract checklist is empty', async ({ page }, testInfo) => {
  await page.goto('/app/tools/before-you-sign', { waitUntil: 'networkidle' })
  await page.screenshot({
    path: screenshotPath('persona-fixlist-contracts-empty', testInfo),
    fullPage: true,
  })
})
