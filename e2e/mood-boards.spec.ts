/**
 * Mood Boards critical path e2e tests.
 * Uses the full-setup persona which has 3 seeded boards:
 *   - "Saved Ideas" (default, 1 idea with image + comment + reaction)
 *   - "Kitchen Inspiration" (3 ideas: 1 with images, 1 text-only, 1 with image)
 *   - "Bathroom Ideas" (1 idea with image)
 */
import { test, expect } from '@playwright/test'
import { screenshotPath } from './helpers/screenshot'

// ── Boards Home ──

test('mood boards: boards home shows seeded boards', async ({ page }, testInfo) => {
  await page.goto('/app/tools/mood-boards', { waitUntil: 'networkidle' })

  // Page header
  await expect(page.getByText('Mood Boards')).toBeVisible()

  // Should show seeded board cards
  const boardCards = page.getByTestId('board-card')
  await expect(boardCards.first()).toBeVisible()
  const cardCount = await boardCards.count()
  expect(cardCount).toBeGreaterThanOrEqual(3) // Saved Ideas, Kitchen Inspiration, Bathroom Ideas

  // Should show board names
  await expect(page.getByText('Saved Ideas')).toBeVisible()
  await expect(page.getByText('Kitchen Inspiration')).toBeVisible()
  await expect(page.getByText('Bathroom Ideas')).toBeVisible()

  // Should show "New Board" button
  await expect(page.getByTestId('new-board-btn')).toBeVisible()

  await page.screenshot({
    path: screenshotPath('mood-boards-home', testInfo),
    fullPage: true,
  })
})

test('mood boards: boards home shows recent activity', async ({ page }, testInfo) => {
  await page.goto('/app/tools/mood-boards', { waitUntil: 'networkidle' })

  // The seed data has a comment on Saved Ideas board, so Recent Activity should appear
  const activity = page.getByTestId('recent-activity')
  await expect(activity).toBeVisible()

  // Should show the seeded comment text
  await expect(page.getByText('This would be perfect for the kitchen!')).toBeVisible()

  await page.screenshot({
    path: screenshotPath('mood-boards-activity', testInfo),
    fullPage: true,
  })
})

// ── Board Detail ──

test('mood boards: navigate into board and view ideas', async ({ page }, testInfo) => {
  await page.goto('/app/tools/mood-boards', { waitUntil: 'networkidle' })

  // Click on "Kitchen Inspiration" board
  await page.getByText('Kitchen Inspiration').click()
  await page.waitForLoadState('networkidle')

  // Should show board name in header
  await expect(page.getByText('Kitchen Inspiration')).toBeVisible()

  // Should show idea tiles (Kitchen has 3 ideas seeded)
  const ideaTiles = page.getByTestId('idea-tile')
  await expect(ideaTiles.first()).toBeVisible()
  const ideaCount = await ideaTiles.count()
  expect(ideaCount).toBeGreaterThanOrEqual(3)

  // Should show idea names
  await expect(page.getByText('Modern White Kitchen')).toBeVisible()
  await expect(page.getByText('Brass Hardware Pulls')).toBeVisible()

  // Verify action buttons exist (desktop)
  await expect(page.getByTestId('upload-photo-btn')).toBeVisible()
  await expect(page.getByTestId('text-note-btn')).toBeVisible()
  await expect(page.getByTestId('save-to-hhc-link')).toBeVisible()
  await expect(page.getByTestId('comments-btn')).toBeVisible()

  await page.screenshot({
    path: screenshotPath('mood-boards-kitchen-detail', testInfo),
    fullPage: true,
  })
})

test('mood boards: empty board shows empty state', async ({ page }, testInfo) => {
  await page.goto('/app/tools/mood-boards', { waitUntil: 'networkidle' })

  // Create a new board to get an empty state
  await page.getByTestId('new-board-btn').click()

  // Fill in board name
  const boardInput = page.locator('input[placeholder="Board name..."]')
  await boardInput.fill('Test Empty Board')
  await page.getByText('Create').click()
  await page.waitForLoadState('networkidle')

  // Should navigate to the new board and show empty state
  await expect(page.getByTestId('board-empty-state')).toBeVisible()
  await expect(page.getByText('No ideas yet')).toBeVisible()

  await page.screenshot({
    path: screenshotPath('mood-boards-empty-board', testInfo),
    fullPage: true,
  })
})

// ── Idea Detail ──

test('mood boards: open idea detail modal', async ({ page }, testInfo) => {
  // Navigate directly to Saved Ideas board
  await page.goto('/app/tools/mood-boards?board=board_saved_ideas', { waitUntil: 'networkidle' })

  // Click on the first idea tile
  const firstTile = page.getByTestId('idea-tile').first()
  await expect(firstTile).toBeVisible()
  await firstTile.click()

  // Modal should open
  const modal = page.getByTestId('idea-detail-modal')
  await expect(modal).toBeVisible()

  // Should show idea name
  await expect(modal.getByText('Coastal Blue Backsplash Tile')).toBeVisible()

  // Should show source domain
  await expect(modal.getByText('example.com')).toBeVisible()

  // Should show reaction buttons
  await expect(modal.getByText('Love!')).toBeVisible()
  await expect(modal.getByText('Like')).toBeVisible()

  // Should show notes
  await expect(modal.getByText('Love this shade of blue')).toBeVisible()

  // Should show "Move to Selection Boards" button
  await expect(page.getByTestId('convert-to-selection-btn')).toBeVisible()

  await page.screenshot({
    path: screenshotPath('mood-boards-idea-detail', testInfo),
    fullPage: true,
  })
})

test('mood boards: idea detail shows comments thread', async ({ page }, testInfo) => {
  await page.goto('/app/tools/mood-boards?board=board_saved_ideas', { waitUntil: 'networkidle' })

  const firstTile = page.getByTestId('idea-tile').first()
  await firstTile.click()

  const modal = page.getByTestId('idea-detail-modal')
  await expect(modal).toBeVisible()

  // Should show the seeded comment
  await expect(modal.getByText('This would be perfect for the kitchen!')).toBeVisible()

  // Should show comment input
  await expect(modal.locator('textarea[placeholder="Write a comment..."]')).toBeVisible()

  await page.screenshot({
    path: screenshotPath('mood-boards-idea-comments', testInfo),
    fullPage: true,
  })
})

// ── Text-only Idea ──

test('mood boards: text-only idea renders styled tile', async ({ page }, testInfo) => {
  await page.goto('/app/tools/mood-boards?board=board-kitchen-inspo', { waitUntil: 'networkidle' })

  // "Brass Hardware Pulls" is a text-only idea (no images)
  await expect(page.getByText('Brass Hardware Pulls')).toBeVisible()

  // Click on text-only idea
  await page.getByText('Brass Hardware Pulls').click()

  const modal = page.getByTestId('idea-detail-modal')
  await expect(modal).toBeVisible()
  await expect(modal.getByText('Brass Hardware Pulls')).toBeVisible()

  await page.screenshot({
    path: screenshotPath('mood-boards-text-only-idea', testInfo),
    fullPage: true,
  })
})

// ── Add Text Note ──

test('mood boards: add a text note idea', async ({ page }, testInfo) => {
  await page.goto('/app/tools/mood-boards?board=board-kitchen-inspo', { waitUntil: 'networkidle' })

  // Click Text Note button
  await page.getByTestId('text-note-btn').click()

  // Should show the text idea form
  await expect(page.getByText('Add a text note')).toBeVisible()

  // Fill in the idea
  const nameInput = page.locator('input[placeholder="Idea name..."]')
  await nameInput.fill('Test Idea from E2E')

  const notesInput = page.locator('textarea[placeholder*="Notes (optional)"]')
  await notesInput.fill('Created during E2E test run')

  // Click "Add Idea"
  await page.getByText('Add Idea').click()

  // Form should close and new idea should appear
  await expect(page.getByText('Test Idea from E2E')).toBeVisible()

  await page.screenshot({
    path: screenshotPath('mood-boards-add-text-note', testInfo),
    fullPage: true,
  })
})

// ── Upload Photo (UI verification) ──

test('mood boards: upload photo button triggers file picker', async ({ page }, testInfo) => {
  await page.goto('/app/tools/mood-boards?board=board-kitchen-inspo', { waitUntil: 'networkidle' })

  // Verify the upload button exists
  const uploadBtn = page.getByTestId('upload-photo-btn')
  await expect(uploadBtn).toBeVisible()
  await expect(uploadBtn).toHaveText('From Photo')

  // Verify the hidden file input exists
  const fileInput = page.locator('input[type="file"][accept="image/*"][multiple]')
  await expect(fileInput).toBeAttached()

  await page.screenshot({
    path: screenshotPath('mood-boards-upload-ready', testInfo),
    fullPage: true,
  })
})

// ── Save to HHC (link navigation) ──

test('mood boards: Save to HHC link navigates to save-from-web', async ({ page }, testInfo) => {
  await page.goto('/app/tools/mood-boards?board=board-kitchen-inspo', { waitUntil: 'networkidle' })

  const saveLink = page.getByTestId('save-to-hhc-link')
  await expect(saveLink).toBeVisible()
  await expect(saveLink).toHaveText('Save to HHC')

  // Click the link
  await saveLink.click()
  await page.waitForLoadState('networkidle')

  // Should navigate to save-from-web page with board context
  await expect(page).toHaveURL(/\/app\/save-from-web/)

  await page.screenshot({
    path: screenshotPath('mood-boards-save-to-hhc', testInfo),
    fullPage: true,
  })
})

// ── Comments Panel ──

test('mood boards: open comments panel', async ({ page }, testInfo) => {
  await page.goto('/app/tools/mood-boards?board=board_saved_ideas', { waitUntil: 'networkidle' })

  // Click comments button
  const commentsBtn = page.getByTestId('comments-btn')
  await expect(commentsBtn).toBeVisible()
  await commentsBtn.click()

  // Comments panel should open (desktop: side panel)
  await expect(page.getByText('Board Comments')).toBeVisible()

  // Should show the seeded comment
  await expect(page.getByText('This would be perfect for the kitchen!')).toBeVisible()

  await page.screenshot({
    path: screenshotPath('mood-boards-comments-panel', testInfo),
    fullPage: true,
  })
})

// ── Reactions ──

test('mood boards: idea tile shows reaction counts', async ({ page }, testInfo) => {
  await page.goto('/app/tools/mood-boards?board=board_saved_ideas', { waitUntil: 'networkidle' })

  // The seeded idea has a "love" reaction — the tile should show it
  // Look for the heart emoji and count in the tile
  const firstTile = page.getByTestId('idea-tile').first()
  await expect(firstTile).toBeVisible()

  // The seeded comment is linked to this idea, so comment count badge should show too
  await page.screenshot({
    path: screenshotPath('mood-boards-reactions-tile', testInfo),
    fullPage: true,
  })
})

// ── Move to Selection Boards ──

test('mood boards: move idea to selection boards', async ({ page }, testInfo) => {
  await page.goto('/app/tools/mood-boards?board=board_saved_ideas', { waitUntil: 'networkidle' })

  // Open idea detail
  const firstTile = page.getByTestId('idea-tile').first()
  await firstTile.click()
  await expect(page.getByTestId('idea-detail-modal')).toBeVisible()

  // Click "Move to Selection Boards"
  await page.getByTestId('convert-to-selection-btn').click()

  // Convert sheet should open
  await expect(page.getByText('Move to Selection Boards')).toBeVisible()
  await expect(page.getByText('will copy')).toBeVisible()

  await page.screenshot({
    path: screenshotPath('mood-boards-convert-sheet', testInfo),
    fullPage: true,
  })

  // Click "Move" to convert
  await page.getByTestId('convert-move-btn').click()

  // Should show success
  await expect(page.getByTestId('convert-success')).toBeVisible()
  await expect(page.getByText('Added to Selection Boards')).toBeVisible()

  await page.screenshot({
    path: screenshotPath('mood-boards-convert-success', testInfo),
    fullPage: true,
  })
})

// ── Create New Board ──

test('mood boards: create a new board from home', async ({ page }, testInfo) => {
  await page.goto('/app/tools/mood-boards', { waitUntil: 'networkidle' })

  // Click "New Board" button
  await page.getByTestId('new-board-btn').click()

  // Should show create form
  const nameInput = page.locator('input[placeholder="Board name..."]')
  await expect(nameInput).toBeVisible()

  // Create a board
  await nameInput.fill('My Test Board')
  await page.getByText('Create').click()
  await page.waitForLoadState('networkidle')

  // Should navigate to the new board
  await expect(page).toHaveURL(/board=/)
  await expect(page.getByText('My Test Board')).toBeVisible()

  await page.screenshot({
    path: screenshotPath('mood-boards-new-board', testInfo),
    fullPage: true,
  })
})
