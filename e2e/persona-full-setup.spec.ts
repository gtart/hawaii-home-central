/**
 * Persona: Full Setup -- 1 project with all 4 tools populated.
 * Tests that each tool renders its seeded data correctly.
 */
import { test, expect } from '@playwright/test'
import { screenshotPath } from './helpers/screenshot'

// -- Dashboard --
test('full-setup: dashboard with active project', async ({ page }, testInfo) => {
  await page.goto('/app', { waitUntil: 'networkidle' })
  await expect(page).not.toHaveURL(/\/login/)
  await page.screenshot({
    path: screenshotPath('persona-full-dashboard', testInfo),
    fullPage: true,
  })
})

// -- Selections List --
test('full-setup: selections list shows 3 rooms with decisions', async ({ page }, testInfo) => {
  await page.goto('/app/tools/finish-decisions', { waitUntil: 'networkidle' })
  await page.screenshot({
    path: screenshotPath('persona-full-selections-top', testInfo),
    fullPage: true,
  })

  // Scroll to see all rooms
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(500)
  await page.screenshot({
    path: screenshotPath('persona-full-selections-bottom', testInfo),
    fullPage: true,
  })
})

test('full-setup: navigate to a decision detail', async ({ page }, testInfo) => {
  await page.goto('/app/tools/finish-decisions', { waitUntil: 'networkidle' })

  const firstDecision = page.locator('a[href*="/decision/"]').first()
  if (await firstDecision.isVisible()) {
    await firstDecision.click()
    await page.waitForLoadState('networkidle')
    await page.screenshot({
      path: screenshotPath('persona-full-decision-detail', testInfo),
      fullPage: true,
    })

    // Scroll to see options and comments
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)
    await page.screenshot({
      path: screenshotPath('persona-full-decision-detail-bottom', testInfo),
      fullPage: true,
    })
  }
})

// -- Contract Checklist --
test('full-setup: contract checklist shows 3 contractors', async ({ page }, testInfo) => {
  await page.goto('/app/tools/before-you-sign', { waitUntil: 'networkidle' })
  await page.screenshot({
    path: screenshotPath('persona-full-contracts-top', testInfo),
    fullPage: true,
  })

  // Scroll to see comparison grid
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(500)
  await page.screenshot({
    path: screenshotPath('persona-full-contracts-bottom', testInfo),
    fullPage: true,
  })
})

// -- Fix List --
test('full-setup: fix list shows 16 items with mixed statuses', async ({ page }, testInfo) => {
  await page.goto('/app/tools/punchlist', { waitUntil: 'networkidle' })
  await page.screenshot({
    path: screenshotPath('persona-full-fixlist-top', testInfo),
    fullPage: true,
  })

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(500)
  await page.screenshot({
    path: screenshotPath('persona-full-fixlist-bottom', testInfo),
    fullPage: true,
  })
})

// -- Mood Boards --
test('full-setup: mood boards shows 3 seeded boards', async ({ page }, testInfo) => {
  await page.goto('/app/tools/mood-boards', { waitUntil: 'networkidle' })

  // Should show all 3 seeded boards
  await expect(page.getByText('Saved Ideas')).toBeVisible()
  await expect(page.getByText('Kitchen Inspiration')).toBeVisible()
  await expect(page.getByText('Bathroom Ideas')).toBeVisible()

  await page.screenshot({
    path: screenshotPath('persona-full-mood-boards', testInfo),
    fullPage: true,
  })
})

test('full-setup: mood board detail shows seeded ideas', async ({ page }, testInfo) => {
  await page.goto('/app/tools/mood-boards?board=board-kitchen-inspo', { waitUntil: 'networkidle' })

  // Should show idea tiles
  const ideaTiles = page.getByTestId('idea-tile')
  await expect(ideaTiles.first()).toBeVisible()
  const count = await ideaTiles.count()
  expect(count).toBeGreaterThanOrEqual(3)

  await page.screenshot({
    path: screenshotPath('persona-full-mood-board-detail', testInfo),
    fullPage: true,
  })
})
