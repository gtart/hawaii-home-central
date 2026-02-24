/**
 * Public (non-auth) page screenshots & smoke tests.
 * Captures desktop, mobile, and android via Playwright projects.
 */
import { test, expect } from '@playwright/test'
import { screenshotPath } from './helpers/screenshot'

const PUBLIC_PAGES = [
  { path: '/', name: 'home' },
  { path: '/about', name: 'about' },
  { path: '/hawaii-home-renovation', name: 'renovation-guides' },
  { path: '/stories', name: 'stories' },
  { path: '/tools', name: 'tools' },
  { path: '/directory', name: 'directory' },
  { path: '/contact', name: 'contact' },
  { path: '/resources/renovation-stages', name: 'renovation-stages' },
  { path: '/login', name: 'login' },
]

for (const { path, name } of PUBLIC_PAGES) {
  test(`screenshot: ${name} (${path})`, async ({ page }, testInfo) => {
    await page.goto(path, { waitUntil: 'networkidle' })
    await expect(page).not.toHaveURL(/\/maintenance/)
    await page.screenshot({
      path: screenshotPath(name, testInfo),
      fullPage: true,
    })
  })
}

// Scroll-based journey: renovation guides hub
test('journey: browse renovation guides', async ({ page }, testInfo) => {
  await page.goto('/hawaii-home-renovation', { waitUntil: 'networkidle' })
  await page.screenshot({ path: screenshotPath('guides-hub-top', testInfo) })

  // Scroll to bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(500)
  await page.screenshot({ path: screenshotPath('guides-hub-bottom', testInfo) })

  // Click first guide card if it exists
  const firstCard = page.locator('a[href*="/hawaii-home-renovation/"]').first()
  if (await firstCard.isVisible()) {
    await firstCard.click()
    await page.waitForLoadState('networkidle')
    await page.screenshot({
      path: screenshotPath('guides-article', testInfo),
      fullPage: true,
    })
  }
})

// Journey: tools preview page
test('journey: explore tools page', async ({ page }, testInfo) => {
  await page.goto('/tools', { waitUntil: 'networkidle' })
  await page.screenshot({ path: screenshotPath('tools-page-top', testInfo) })

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(500)
  await page.screenshot({ path: screenshotPath('tools-page-bottom', testInfo) })
})
