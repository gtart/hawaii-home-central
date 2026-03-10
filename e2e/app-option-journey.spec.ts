/**
 * Journey test: Selection List → Selection Detail → Option Detail (with 3 comments)
 *
 * Runs on both desktop (authenticated) and mobile (authenticated-mobile) projects
 * via the `app*.spec.ts` naming convention.
 */
import { test, expect } from '@playwright/test'
import { screenshotPath } from './helpers/screenshot'

const COMMENT_TEXTS = [
  'Love this option — the finish matches our cabinets perfectly.',
  'Can we verify the lead time? Need it before the install date.',
  'Price seems competitive. Let\'s shortlist this one.',
]

test('journey: selection list → selection → option with 3 comments', async ({ page }, testInfo) => {
  // ── Step 1: Selection List (boards page) ──
  await page.goto('/app/tools/finish-decisions', { waitUntil: 'networkidle' })
  await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 })
  // Wait for selections to render (data loaded from API)
  await page.waitForTimeout(2000)
  await page.screenshot({
    path: screenshotPath('option-journey-01-selection-list', testInfo),
    fullPage: true,
  })

  // ── Step 2: Click into the first selection ──
  // The page uses a table (desktop) or card layout (mobile) — no data-testid on rows.
  // Desktop table rows are hidden on mobile, so pick the first *visible* link.
  const allSelectionLinks = page.locator('a[href*="/decision/"]')
  await expect(allSelectionLinks.first()).toBeAttached({ timeout: 15_000 })
  // Find first visible selection link (desktop table rows are hidden on mobile)
  let selectionLink = allSelectionLinks.first()
  const count = await allSelectionLinks.count()
  for (let i = 0; i < count; i++) {
    if (await allSelectionLinks.nth(i).isVisible()) {
      selectionLink = allSelectionLinks.nth(i)
      break
    }
  }
  await selectionLink.click()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000) // allow decision detail to load
  await page.screenshot({
    path: screenshotPath('option-journey-02-selection-detail', testInfo),
    fullPage: true,
  })

  // ── Step 3: Click into the first option card ──
  // Desktop and mobile render separate grids (hidden md:block vs md:hidden).
  // Find the first *visible* idea-card to handle both viewports.
  const allOptionCards = page.getByTestId('idea-card')
  await expect(allOptionCards.first()).toBeAttached({ timeout: 10_000 })
  let optionCard = allOptionCards.first()
  const optCount = await allOptionCards.count()
  for (let i = 0; i < optCount; i++) {
    if (await allOptionCards.nth(i).isVisible()) {
      optionCard = allOptionCards.nth(i)
      break
    }
  }
  await optionCard.click()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000) // allow option detail to fully render
  await page.screenshot({
    path: screenshotPath('option-journey-03-option-detail', testInfo),
    fullPage: true,
  })

  // Verify we're on the option detail page
  await expect(page).toHaveURL(/\/decision\/.*\/option\//)

  // ── Step 4: Post 3 comments ──
  const commentInput = page.locator('textarea[placeholder="Add a comment..."]')
  const postButton = page.locator('button:has-text("Post")')

  for (let i = 0; i < COMMENT_TEXTS.length; i++) {
    // Scroll to comment area to ensure visibility
    await commentInput.scrollIntoViewIfNeeded()
    await expect(commentInput).toBeVisible({ timeout: 5000 })

    await commentInput.fill(COMMENT_TEXTS[i])
    await postButton.click()

    // Wait for comment to appear
    await page.waitForTimeout(1500)

    await page.screenshot({
      path: screenshotPath(`option-journey-04-comment-${i + 1}-posted`, testInfo),
      fullPage: true,
    })
  }

  // ── Step 5: Final view with all comments ──
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(500)
  await page.screenshot({
    path: screenshotPath('option-journey-05-all-comments', testInfo),
    fullPage: true,
  })

  // ── Step 6: Navigate back to selection detail via back link ──
  const backLink = page.locator('a').filter({ hasText: /←/ }).first()
  if (await backLink.isVisible()) {
    await backLink.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await page.screenshot({
      path: screenshotPath('option-journey-06-back-to-selection', testInfo),
      fullPage: true,
    })
  }
})
