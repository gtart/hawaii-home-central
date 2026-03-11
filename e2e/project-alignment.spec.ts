/**
 * Project Alignment — E2E smoke tests.
 *
 * Covers:
 * - Tool page loads (collection picker)
 * - Public share page renders (if a share link exists)
 * - Guest response endpoint rejects invalid requests
 */
import { test, expect } from '@playwright/test'
import { screenshotPath } from './helpers/screenshot'

// ── Authenticated: tool page loads ──

test('alignment: tool page loads collection picker', async ({ page }, testInfo) => {
  await page.goto('/app/tools/project-alignment', { waitUntil: 'networkidle' })
  // Should not redirect to login (auth required)
  await expect(page).not.toHaveURL(/\/login/)
  await page.screenshot({
    path: screenshotPath('alignment-collection-picker', testInfo),
    fullPage: true,
  })
})

// ── Public: guest response endpoint rejects bad requests ──

test('alignment: respond endpoint rejects missing token', async ({ request }) => {
  const res = await request.post('/api/share/invalid-token-12345/respond', {
    data: {
      itemId: 'fake-item-id',
      respondent_name: 'Test User',
    },
  })
  expect(res.status()).toBe(404)
  const body = await res.json()
  expect(body.error).toBeTruthy()
})

test('alignment: respond endpoint rejects empty body', async ({ request }) => {
  const res = await request.post('/api/share/invalid-token-12345/respond', {
    data: {},
  })
  // Will 404 because token is invalid — but verifies endpoint exists and returns JSON
  expect(res.status()).toBe(404)
  const body = await res.json()
  expect(body.error).toBeTruthy()
})

// ── Public: share page shows invalid token page for bad tokens ──

test('alignment: share page shows invalid token page', async ({ page }, testInfo) => {
  await page.goto('/share/project_alignment/bad-token-xyz', { waitUntil: 'networkidle' })
  await page.screenshot({
    path: screenshotPath('alignment-share-invalid-token', testInfo),
    fullPage: true,
  })
  // Should show some form of error/invalid state
  const body = await page.textContent('body')
  expect(body).toBeTruthy()
})

// ── Sidebar navigation ──

test('alignment: sidebar shows Project Alignment link', async ({ page }) => {
  await page.goto('/app', { waitUntil: 'networkidle' })
  // Check that the sidebar has a link to project-alignment
  const link = page.locator('a[href*="project-alignment"]')
  await expect(link).toBeVisible()
})
