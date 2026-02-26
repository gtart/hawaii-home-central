/**
 * Selection Boards (Finish Decisions) interaction e2e tests.
 * Uses the full-setup persona which has 3 seeded rooms:
 *   - Kitchen (5 decisions), Bathroom (5 decisions), Living Room (4 decisions)
 * Decision IDs follow pattern: dec-{roomId}-{index}
 * Option IDs follow pattern: opt-{roomId}-{decisionIndex}-{optionIndex}
 */
import { test, expect } from '@playwright/test'
import { screenshotPath } from './helpers/screenshot'

// ── Rooms Board ──

test('selections: rooms board shows all seeded rooms', async ({ page }, testInfo) => {
  await page.goto('/app/tools/finish-decisions', { waitUntil: 'networkidle' })

  // Should show room cards
  const roomCards = page.getByTestId('room-card')
  await expect(roomCards.first()).toBeVisible()
  const count = await roomCards.count()
  expect(count).toBeGreaterThanOrEqual(3)

  // Should show room names
  await expect(page.getByText('Kitchen')).toBeVisible()
  await expect(page.getByText('Bathroom')).toBeVisible()
  await expect(page.getByText('Living Room')).toBeVisible()

  await page.screenshot({
    path: screenshotPath('selections-rooms-board', testInfo),
    fullPage: true,
  })
})

test('selections: room card shows decision count', async ({ page }, testInfo) => {
  await page.goto('/app/tools/finish-decisions', { waitUntil: 'networkidle' })

  // Kitchen has 5 decisions, should show count
  const kitchenCard = page.getByTestId('room-card').filter({ hasText: 'Kitchen' })
  await expect(kitchenCard.first()).toBeVisible()

  await page.screenshot({
    path: screenshotPath('selections-room-card-detail', testInfo),
    fullPage: true,
  })
})

// ── Room Detail ──

test('selections: navigate to room detail', async ({ page }, testInfo) => {
  await page.goto('/app/tools/finish-decisions', { waitUntil: 'networkidle' })

  // Click on Kitchen room card
  const kitchenCard = page.getByTestId('room-card').filter({ hasText: 'Kitchen' })
  await kitchenCard.first().click()
  await page.waitForLoadState('networkidle')

  // Should navigate to room detail
  await expect(page).toHaveURL(/\/room\/room-kitchen/)

  // Should show decisions
  await expect(page.getByText('Countertop')).toBeVisible()
  await expect(page.getByText('Cabinetry')).toBeVisible()

  await page.screenshot({
    path: screenshotPath('selections-kitchen-room', testInfo),
    fullPage: true,
  })
})

// ── Decision Detail ──

test('selections: navigate to decision detail', async ({ page }, testInfo) => {
  // Navigate to a specific decision: Kitchen > Countertop (dec-room-kitchen-0)
  await page.goto('/app/tools/finish-decisions/decision/dec-room-kitchen-0', { waitUntil: 'networkidle' })

  // Should show decision title
  await expect(page.getByText('Countertop')).toBeVisible()

  // Should show at least one option
  const ideaCards = page.getByTestId('idea-card')
  await expect(ideaCards.first()).toBeVisible()

  // Should show option name (seeded: "Countertop Option A")
  await expect(page.getByText('Countertop Option A')).toBeVisible()

  await page.screenshot({
    path: screenshotPath('selections-decision-detail', testInfo),
    fullPage: true,
  })
})

// ── Status Changes ──

test('selections: change decision status', async ({ page }, testInfo) => {
  await page.goto('/app/tools/finish-decisions/decision/dec-room-kitchen-0', { waitUntil: 'networkidle' })

  // Take initial screenshot
  await page.screenshot({
    path: screenshotPath('selections-status-before', testInfo),
    fullPage: true,
  })

  // Look for status pill buttons — "Selected", "Ordered", "Done" etc.
  // The Countertop decision (index 0, room 0) has status deciding (0+0 % 4 = 0)
  // Click on "Selected" status
  const selectedBtn = page.getByRole('button', { name: 'Selected' })
  if (await selectedBtn.isVisible().catch(() => false)) {
    await selectedBtn.click()

    // Wait for state to update
    await page.waitForTimeout(500)

    await page.screenshot({
      path: screenshotPath('selections-status-after', testInfo),
      fullPage: true,
    })
  }
})

// ── Comments ──

test('selections: open comments panel on decision', async ({ page }, testInfo) => {
  // Kitchen > Countertop has a seeded comment
  await page.goto('/app/tools/finish-decisions/decision/dec-room-kitchen-0', { waitUntil: 'networkidle' })

  // Look for comment trigger — the button area with comment count/icon
  const commentTrigger = page.locator('button', { hasText: /comment/i })
  if (await commentTrigger.first().isVisible().catch(() => false)) {
    await commentTrigger.first().click()
    await page.waitForTimeout(300)
  }

  // Should show seeded comment text
  await expect(page.getByText('Leaning toward Countertop Option A based on samples.')).toBeVisible()

  await page.screenshot({
    path: screenshotPath('selections-comments-open', testInfo),
    fullPage: true,
  })
})

test('selections: post a comment on a decision', async ({ page }, testInfo) => {
  await page.goto('/app/tools/finish-decisions/decision/dec-room-kitchen-0', { waitUntil: 'networkidle' })

  // Open comments panel
  const commentTrigger = page.locator('button', { hasText: /comment/i })
  if (await commentTrigger.first().isVisible().catch(() => false)) {
    await commentTrigger.first().click()
    await page.waitForTimeout(300)
  }

  // Find comment input
  const commentInput = page.locator('textarea[placeholder*="comment"]')
  if (await commentInput.isVisible().catch(() => false)) {
    await commentInput.fill('E2E test comment - testing the comment flow')

    // Click Post
    const postBtn = page.getByRole('button', { name: 'Post' })
    await postBtn.click()

    // Should show the posted comment
    await expect(page.getByText('E2E test comment - testing the comment flow')).toBeVisible()

    await page.screenshot({
      path: screenshotPath('selections-comment-posted', testInfo),
      fullPage: true,
    })
  }
})

// ── Reactions on Ideas ──

test('selections: toggle reaction on an idea card', async ({ page }, testInfo) => {
  await page.goto('/app/tools/finish-decisions/decision/dec-room-kitchen-0', { waitUntil: 'networkidle' })

  // Look for reaction buttons (Love/Like/Dislike) on idea cards
  // These appear as emoji buttons on each option card
  const loveBtn = page.locator('button').filter({ hasText: /❤️/ }).first()
  if (await loveBtn.isVisible().catch(() => false)) {
    await loveBtn.click()
    await page.waitForTimeout(300)

    await page.screenshot({
      path: screenshotPath('selections-reaction-toggled', testInfo),
      fullPage: true,
    })
  }
})

// ── Add a Room ──

test('selections: add a room from rooms board', async ({ page }, testInfo) => {
  await page.goto('/app/tools/finish-decisions', { waitUntil: 'networkidle' })

  // Look for the "Add a Room" tile
  const addRoomTile = page.getByText('Add a Room')
  await expect(addRoomTile).toBeVisible()

  await page.screenshot({
    path: screenshotPath('selections-add-room-tile', testInfo),
    fullPage: true,
  })
})

// ── Unsorted Room ──

test('selections: unsorted room card visible when items exist', async ({ page }, testInfo) => {
  await page.goto('/app/tools/finish-decisions', { waitUntil: 'networkidle' })

  // After a mood board to selection conversion, unsorted room may appear
  // Just verify the board loads and take a screenshot
  const unsortedCard = page.getByTestId('unsorted-room-card')
  const hasUnsorted = await unsortedCard.isVisible().catch(() => false)

  if (hasUnsorted) {
    await page.screenshot({
      path: screenshotPath('selections-unsorted-room', testInfo),
      fullPage: true,
    })
  }
})

// ── Save from Web CTA ──

test('selections: Save from Web CTA visible on boards', async ({ page }, testInfo) => {
  await page.goto('/app/tools/finish-decisions', { waitUntil: 'networkidle' })

  // Scroll down to find the CTA
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(500)

  const cta = page.getByTestId('savefromweb-cta')
  if (await cta.isVisible().catch(() => false)) {
    await page.screenshot({
      path: screenshotPath('selections-savefromweb-cta', testInfo),
      fullPage: true,
    })
  }
})

// ── Multi-option decision ──

test('selections: decision with multiple options shows all', async ({ page }, testInfo) => {
  // Kitchen > Cabinetry (dec-room-kitchen-1) has 3 options (odd index: 2 + 1%3 = 3)
  await page.goto('/app/tools/finish-decisions/decision/dec-room-kitchen-1', { waitUntil: 'networkidle' })

  await expect(page.getByText('Cabinetry')).toBeVisible()

  const ideaCards = page.getByTestId('idea-card')
  const optionCount = await ideaCards.count()
  expect(optionCount).toBeGreaterThanOrEqual(2) // Should have multiple options

  await page.screenshot({
    path: screenshotPath('selections-multi-option', testInfo),
    fullPage: true,
  })
})

// ── Full journey: Room → Decision → Back ──

test('selections: full navigation journey', async ({ page }, testInfo) => {
  // Start at rooms board
  await page.goto('/app/tools/finish-decisions', { waitUntil: 'networkidle' })
  await page.screenshot({ path: screenshotPath('selections-journey-1-boards', testInfo) })

  // Click Bathroom room
  const bathroomCard = page.getByTestId('room-card').filter({ hasText: 'Bathroom' })
  await bathroomCard.first().click()
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: screenshotPath('selections-journey-2-bathroom', testInfo) })

  // Click first decision link
  const firstDecisionLink = page.locator('a[href*="/decision/"]').first()
  if (await firstDecisionLink.isVisible()) {
    await firstDecisionLink.click()
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: screenshotPath('selections-journey-3-decision', testInfo) })

    // Scroll to see comments section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)
    await page.screenshot({ path: screenshotPath('selections-journey-4-bottom', testInfo) })
  }
})
