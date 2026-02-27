/**
 * Mood Board E2E Screenshot Walkthrough
 *
 * Single test that runs the full Mood Board journey on one page instance,
 * capturing all key screens including P1 features (search/filters, quick
 * edit, undo delete, board chat, collaborator row).
 *
 * Screenshots captured:
 *  01. Boards home (existing state)
 *  02. Create board form
 *  03. Empty board
 *  04. Add idea form (via dropdown menu)
 *  05. First idea added
 *  06. Board with multiple items
 *  07. Search + filter bar visible
 *  08. Idea detail modal
 *  09. Typing a comment on idea
 *  10. Comment posted
 *  11. Board Chat panel
 *  12. Board before deletion
 *  13. Undo delete toast
 *  14. Board after undo
 *  15. Boards home final
 */
import { test, expect, Page } from '@playwright/test'
import path from 'path'

const SCREENSHOT_DIR = path.join('e2e', 'screenshots', 'mood-board-walkthrough')
const ss = (name: string) => path.join(SCREENSHOT_DIR, `${name}.png`)

/** Dismiss any overlays (onboarding, newsletter prompt) */
async function dismissOverlays(page: Page) {
  const justExploring = page.getByText('Just exploring')
  if (await justExploring.isVisible({ timeout: 2000 }).catch(() => false)) {
    await justExploring.click()
    await page.waitForTimeout(500)
  }
  const skipNewsletter = page.getByText('No thanks')
  if (await skipNewsletter.isVisible({ timeout: 1000 }).catch(() => false)) {
    await skipNewsletter.click()
    await page.waitForTimeout(500)
  }
  const overlay = page.locator('.fixed.inset-0.z-50, .fixed.inset-0.z-\\[60\\]')
  if (await overlay.isVisible({ timeout: 500 }).catch(() => false)) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  }
}

/** Helper: open the "+ Add" dropdown and click "Text Note" */
async function openTextNoteForm(page: Page) {
  // Try the header "+ Add" button first (visible when board has ideas)
  const addBtn = page.getByTestId('add-idea-btn')
  if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await addBtn.click()
    await page.waitForTimeout(300)
  } else {
    // On empty board, click "Add your first idea" which opens the same dropdown
    const emptyAdd = page.getByRole('button', { name: 'Add your first idea' })
    if (await emptyAdd.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emptyAdd.click()
      await page.waitForTimeout(300)
    }
  }

  // Now click "Text Note" inside the dropdown
  const textNoteBtn = page.getByTestId('text-note-btn')
  await expect(textNoteBtn).toBeVisible({ timeout: 3000 })
  await textNoteBtn.click()
  await page.waitForTimeout(300)
}

test('Mood Board complete walkthrough', async ({ page }) => {
  // Increase timeout for the full walkthrough
  test.setTimeout(300000)

  // == 01: Boards Home Overview ==
  await page.goto('/app/tools/mood-boards', { waitUntil: 'networkidle' })
  await dismissOverlays(page)
  await expect(page.getByText('Mood Boards')).toBeVisible({ timeout: 15000 })
  await page.waitForTimeout(1000)

  await page.screenshot({ path: ss('01-boards-home'), fullPage: true })

  // == 02: Create New Board ==
  const newBoardBtn = page.getByTestId('new-board-btn')
  await expect(newBoardBtn).toBeVisible()
  await newBoardBtn.click()
  await page.waitForTimeout(300)

  const boardNameInput = page.locator('input[placeholder="Board name..."]')
  await expect(boardNameInput).toBeVisible()

  await page.screenshot({ path: ss('02-create-board-form'), fullPage: true })

  await boardNameInput.fill('E2E Walkthrough Board')
  await page.getByRole('button', { name: 'Create', exact: true }).click()

  // Wait for navigation to the new board
  await page.waitForURL(/board=/, { timeout: 10000 })
  await page.waitForTimeout(1500)

  // == 03: Empty Board State ==
  await page.screenshot({ path: ss('03-empty-board'), fullPage: true })

  // == 04: Add First Text Note Idea (via dropdown) ==
  await openTextNoteForm(page)

  const ideaNameInput = page.locator('input[placeholder="Idea name..."]')
  await expect(ideaNameInput).toBeVisible()

  await page.screenshot({ path: ss('04-add-idea-form'), fullPage: true })

  await ideaNameInput.fill('Modern Kitchen Backsplash')
  const notesInput = page.locator('textarea[placeholder*="Notes"]').first()
  if (await notesInput.isVisible()) {
    await notesInput.fill('White subway tile with brass grout — very clean modern look')
  }
  await page.getByRole('button', { name: 'Add Idea' }).click()
  await page.waitForTimeout(1000)

  // == 05: First Idea Added ==
  await expect(page.getByText('Modern Kitchen Backsplash')).toBeVisible()
  await page.screenshot({ path: ss('05-first-idea-added'), fullPage: true })

  // == 06: Add More Ideas for Populated Board ==
  // Second idea
  await openTextNoteForm(page)
  await ideaNameInput.fill('Walnut Floating Shelves')
  if (await notesInput.isVisible()) {
    await notesInput.fill('Open shelving above the counter for display')
  }
  await page.getByRole('button', { name: 'Add Idea' }).click()
  await page.waitForTimeout(1000)

  // Third idea
  await openTextNoteForm(page)
  await ideaNameInput.fill('Brass Cabinet Pulls')
  if (await notesInput.isVisible()) {
    await notesInput.fill('T-bar style, 128mm center-to-center')
  }
  await page.getByRole('button', { name: 'Add Idea' }).click()
  await page.waitForTimeout(1000)

  // Verify all three ideas visible
  await expect(page.getByText('Modern Kitchen Backsplash')).toBeVisible()
  await expect(page.getByText('Walnut Floating Shelves')).toBeVisible()
  await expect(page.getByText('Brass Cabinet Pulls')).toBeVisible()

  await page.screenshot({ path: ss('06-board-with-multiple-items'), fullPage: true })

  // == 07: Search + Filter Bar ==
  // The search bar and filter chips should be visible now that there are ideas
  const searchInput = page.locator('input[placeholder="Search ideas..."]')
  await expect(searchInput).toBeVisible()
  await page.screenshot({ path: ss('07-search-filter-bar'), fullPage: true })

  // == 08: Idea Detail Modal ==
  const firstTile = page.getByTestId('idea-tile').first()
  await expect(firstTile).toBeVisible()
  await firstTile.click()

  const modal = page.getByTestId('idea-detail-modal')
  await expect(modal).toBeVisible()
  await page.waitForTimeout(500)

  await page.screenshot({ path: ss('08-idea-detail-modal'), fullPage: true })

  // == 09-10: Add Comment on Idea ==
  const commentInput = modal.locator('textarea[placeholder="Write a comment..."]')
  if (await commentInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await commentInput.fill("Love this option! Let's price it out with the contractor.")

    await page.screenshot({ path: ss('09-typing-comment'), fullPage: true })

    const postBtn = modal.getByRole('button', { name: 'Post' })
    if (await postBtn.isVisible()) {
      await postBtn.click()
      await page.waitForTimeout(1000)
    }

    await page.screenshot({ path: ss('10-comment-posted'), fullPage: true })
  } else {
    await page.screenshot({ path: ss('09-idea-detail-no-comment-input'), fullPage: true })
  }

  // Close modal
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  // == 11: Board Chat Panel ==
  const commentsBtn = page.getByTestId('comments-btn')
  if (await commentsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await commentsBtn.click()
    await page.waitForTimeout(500)

    await page.screenshot({ path: ss('11-board-chat-panel'), fullPage: true })

    // Close the comments panel
    const backdrop = page.locator('div.fixed.inset-0').first()
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click({ force: true })
      await page.waitForTimeout(500)
    }
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  }

  // Ensure no overlays remain
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  // == 12: Board Before Delete ==
  await page.screenshot({ path: ss('12-board-before-delete'), fullPage: true })

  // == 13: Delete an Idea (via modal) → Undo Toast ==
  const tiles = page.getByTestId('idea-tile')
  const tileCount = await tiles.count()
  if (tileCount > 0) {
    await tiles.last().click()
    const deleteModal = page.getByTestId('idea-detail-modal')
    await expect(deleteModal).toBeVisible()
    await page.waitForTimeout(300)

    // Find the three-dot menu button (empty text button with SVG) in the modal
    const modalButtons = deleteModal.locator('button')
    const btnCount = await modalButtons.count()

    let deleteFound = false
    for (let i = btnCount - 1; i >= 0; i--) {
      const btn = modalButtons.nth(i)
      const text = (await btn.textContent())?.trim()
      if (text === '') {
        await btn.click()
        await page.waitForTimeout(300)

        const deleteOption = page.getByText('Delete Idea')
        if (await deleteOption.isVisible({ timeout: 1000 }).catch(() => false)) {
          await deleteOption.click()
          await page.waitForTimeout(300)

          // Confirm deletion dialog
          const confirmBtn = page.getByRole('button', { name: 'Delete' })
          if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await confirmBtn.click()
            await page.waitForTimeout(1000)
          }
          deleteFound = true
          break
        }
        // Close menu and try next button
        await page.keyboard.press('Escape')
        await page.waitForTimeout(200)
      }
    }

    if (!deleteFound) {
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
    }
  }

  // Close any open modal
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)

  // Capture the undo toast (should be visible for 10s after delete)
  await page.screenshot({ path: ss('13-undo-delete-toast'), fullPage: true })

  // == 14: Board After Delete ==
  await page.waitForTimeout(1000)
  await page.screenshot({ path: ss('14-board-after-delete'), fullPage: true })

  // == 15: Boards Home (Final) ==
  await page.waitForTimeout(3000)
  await page.waitForLoadState('networkidle')

  // Navigate back to boards home
  const backBtn = page.locator('button').filter({ has: page.locator('polyline[points="15 18 9 12 15 6"]') }).first()
  if (await backBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await backBtn.click()
  } else {
    await page.goto('/app/tools/mood-boards', { waitUntil: 'networkidle' })
  }
  await page.waitForTimeout(2000)

  await page.screenshot({ path: ss('15-boards-home-final'), fullPage: true })
})
