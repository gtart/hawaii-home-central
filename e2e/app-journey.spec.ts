/**
 * Authenticated app page screenshots & user journeys.
 * Runs with storageState from auth.setup.ts so the user
 * is already logged in with a valid NextAuth session.
 */
import { test, expect } from '@playwright/test'
import { screenshotPath } from './helpers/screenshot'

// -- Dashboard / App Home --
test('screenshot: app dashboard', async ({ page }, testInfo) => {
  await page.goto('/app', { waitUntil: 'networkidle' })
  await expect(page).not.toHaveURL(/\/login/)
  await page.screenshot({
    path: screenshotPath('app-dashboard', testInfo),
    fullPage: true,
  })
})

// -- Settings --
test('screenshot: settings page', async ({ page }, testInfo) => {
  await page.goto('/app/settings', { waitUntil: 'networkidle' })
  await page.screenshot({
    path: screenshotPath('app-settings', testInfo),
    fullPage: true,
  })
})

// -- Selections List Tool --
test('journey: selections list tool', async ({ page }, testInfo) => {
  await page.goto('/app/tools/finish-decisions', { waitUntil: 'networkidle' })
  await page.screenshot({
    path: screenshotPath('selections-list', testInfo),
    fullPage: true,
  })

  // Click first decision card if one exists
  const firstDecision = page.locator('a[href*="/decision/"]').first()
  if (await firstDecision.isVisible()) {
    await firstDecision.click()
    await page.waitForLoadState('networkidle')
    await page.screenshot({
      path: screenshotPath('selections-decision-detail', testInfo),
      fullPage: true,
    })

    // Scroll to bottom to capture comments section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)
    await page.screenshot({
      path: screenshotPath('selections-decision-bottom', testInfo),
      fullPage: true,
    })
  }
})

// -- Contract Checklist (Before You Sign) --
test('journey: contract checklist tool', async ({ page }, testInfo) => {
  await page.goto('/app/tools/before-you-sign', { waitUntil: 'networkidle' })
  await page.screenshot({
    path: screenshotPath('contract-checklist', testInfo),
    fullPage: true,
  })

  // Scroll to bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(500)
  await page.screenshot({
    path: screenshotPath('contract-checklist-bottom', testInfo),
  })
})

// -- Fix List (Punchlist) --
test('journey: fix list tool', async ({ page }, testInfo) => {
  await page.goto('/app/tools/punchlist', { waitUntil: 'networkidle' })
  await page.screenshot({
    path: screenshotPath('fix-list', testInfo),
    fullPage: true,
  })

  // Scroll to bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(500)
  await page.screenshot({
    path: screenshotPath('fix-list-bottom', testInfo),
  })
})

// -- Projects --
test('screenshot: projects page', async ({ page }, testInfo) => {
  await page.goto('/app/projects', { waitUntil: 'networkidle' })
  await page.screenshot({
    path: screenshotPath('app-projects', testInfo),
    fullPage: true,
  })
})

// -- Full navigation journey --
test('journey: navigate between tools', async ({ page }, testInfo) => {
  // Start at dashboard
  await page.goto('/app', { waitUntil: 'networkidle' })
  await page.screenshot({ path: screenshotPath('journey-start', testInfo) })

  // Navigate to Selections List
  const selectionsLink = page.locator('a[href*="/tools/finish-decisions"]').first()
  if (await selectionsLink.isVisible()) {
    await selectionsLink.click()
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: screenshotPath('journey-selections', testInfo) })
  }

  // Navigate to Fix List
  const fixListLink = page.locator('a[href*="/tools/punchlist"]').first()
  if (await fixListLink.isVisible()) {
    await fixListLink.click()
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: screenshotPath('journey-fixlist', testInfo) })
  }

  // Navigate back to dashboard via logo or home link
  const homeLink = page.locator('a[href="/app"]').first()
  if (await homeLink.isVisible()) {
    await homeLink.click()
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: screenshotPath('journey-back-home', testInfo) })
  }
})
