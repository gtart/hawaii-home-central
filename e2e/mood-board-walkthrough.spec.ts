/**
 * Mood Board E2E Screenshot Walkthrough
 *
 * Single test that runs the full Mood Board journey on one page instance,
 * avoiding cross-page state issues with debounced API sync.
 *
 * Screenshots captured:
 *  01. Boards home (existing state)
 *  02. Create board form
 *  03. Empty board
 *  04. Add idea form
 *  05. First idea added
 *  06. Board with multiple items
 *  07. Idea detail modal
 *  08. Typing a comment
 *  09. Comment posted
 *  10. Board comments panel
 *  11. Boards home with new board
 *  12. Board before deletion
 *  13. Board after deletion
 *  14. Board settings / final overview
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

test('Mood Board complete walkthrough', async ({ page }) => {
  // Increase timeout for the full walkthrough
  test.setTimeout(300000)

  // ── 01: Boards Home Overview ──────────────────────────────────────
  await page.goto('/app/tools/mood-boards', { waitUntil: 'networkidle' })
  await dismissOverlays(page)
  await expect(page.getByText('Mood Boards')).toBeVisible({ timeout: 15000 })
  await page.waitForTimeout(1000)

  await page.screenshot({ path: ss('01-boards-home'), fullPage: true })

  // ── 02: Create New Board ──────────────────────────────────────────
  const newBoardBtn = page.getByTestId('new-board-btn')
  await expect(newBoardBtn).toBeVisible()
  await newBoardBtn.click()
  await page.waitForTimeout(300)

  const boardNameInput = page.locator('input[placeholder="Board name..."]')
  await expect(boardNameInput).toBeVisible()

  await page.screenshot({ path: ss('02-create-board-form'), fullPage: true })

  await boardNameInput.fill('E2E Walkthrough Board')
  await page.getByRole('button', { name: 'Create', exact: true }).click()

  // Wait for navigation to the new board and save the URL
  await page.waitForURL(/board=/, { timeout: 10000 })
  await page.waitForTimeout(1500)
  const boardUrl = page.url()

  // ── 03: Empty Board State ─────────────────────────────────────────
  await page.screenshot({ path: ss('03-empty-board'), fullPage: true })

  // ── 04: Add First Text Note Idea ──────────────────────────────────
  // The text-note-btn is in the board detail header
  const textNoteBtn = page.getByTestId('text-note-btn')

  // On empty board, might show empty state with add buttons too
  if (await textNoteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await textNoteBtn.click()
  } else {
    // Try clicking "Text Note" text directly
    await page.getByText('Text Note').first().click()
  }
  await page.waitForTimeout(300)

  await page.screenshot({ path: ss('04-add-idea-form'), fullPage: true })

  const ideaNameInput = page.locator('input[placeholder="Idea name..."]')
  await expect(ideaNameInput).toBeVisible()
  await ideaNameInput.fill('Modern Kitchen Backsplash')

  const notesInput = page.locator('textarea[placeholder*="Notes"]').first()
  if (await notesInput.isVisible()) {
    await notesInput.fill('White subway tile with brass grout — very clean modern look')
  }

  await page.getByRole('button', { name: 'Add Idea' }).click()
  await page.waitForTimeout(1000)

  // ── 05: First Idea Added ──────────────────────────────────────────
  await expect(page.getByText('Modern Kitchen Backsplash')).toBeVisible()
  await page.screenshot({ path: ss('05-first-idea-added'), fullPage: true })

  // ── 06: Add More Ideas for Populated Board ────────────────────────
  // Second idea
  if (await textNoteBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await textNoteBtn.click()
  } else {
    await page.getByText('Text Note').first().click()
  }
  await page.waitForTimeout(300)
  await ideaNameInput.fill('Walnut Floating Shelves')
  if (await notesInput.isVisible()) {
    await notesInput.fill('Open shelving above the counter for display')
  }
  await page.getByRole('button', { name: 'Add Idea' }).click()
  await page.waitForTimeout(1000)

  // Third idea
  if (await textNoteBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await textNoteBtn.click()
  } else {
    await page.getByText('Text Note').first().click()
  }
  await page.waitForTimeout(300)
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

  // ── 07: Open Idea Detail Modal ────────────────────────────────────
  const firstTile = page.getByTestId('idea-tile').first()
  await expect(firstTile).toBeVisible()
  await firstTile.click()

  const modal = page.getByTestId('idea-detail-modal')
  await expect(modal).toBeVisible()
  await page.waitForTimeout(500)

  await page.screenshot({ path: ss('07-idea-detail-modal'), fullPage: true })

  // ── 08–09: Add Comment on Idea ────────────────────────────────────
  const commentInput = modal.locator('textarea[placeholder="Write a comment..."]')
  if (await commentInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await commentInput.fill("Love this option! Let's price it out with the contractor.")

    await page.screenshot({ path: ss('08-typing-comment'), fullPage: true })

    const postBtn = modal.getByRole('button', { name: 'Post' })
    if (await postBtn.isVisible()) {
      await postBtn.click()
      await page.waitForTimeout(1000)
    }

    await page.screenshot({ path: ss('09-comment-posted'), fullPage: true })
  } else {
    await page.screenshot({ path: ss('08-idea-detail-no-comment-input'), fullPage: true })
  }

  // Close modal
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  // ── 10: Board Comments Panel ──────────────────────────────────────
  const commentsBtn = page.getByTestId('comments-btn')
  if (await commentsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await commentsBtn.click()
    await page.waitForTimeout(500)

    await page.screenshot({ path: ss('10-board-comments-panel'), fullPage: true })

    // Close the comments panel by clicking its backdrop
    const backdrop = page.locator('div.fixed.inset-0').first()
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click({ force: true })
      await page.waitForTimeout(500)
    }
    // Fallback: press Escape multiple times
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  } else {
    await page.screenshot({ path: ss('10-board-no-comments-btn'), fullPage: true })
  }

  // Ensure no overlays remain
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  // ── 11: Board Overview with All Content ─────────────────────────
  await page.screenshot({ path: ss('11-board-overview-with-content'), fullPage: true })

  // ── 12–13: Delete an Idea from Board ──────────────────────────────
  await page.screenshot({ path: ss('12-board-before-delete'), fullPage: true })

  // Open the last idea tile to delete it
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

  await page.screenshot({ path: ss('13-board-after-delete'), fullPage: true })

  // ── 14: Boards Home (Final) ───────────────────────────────────────
  // Wait for sync, then navigate to boards home for the final screenshot
  await page.waitForTimeout(3000)
  await page.waitForLoadState('networkidle')

  // Use the back breadcrumb link
  const backLink = page.locator('a[href="/app/tools/mood-boards"]').first()
  if (await backLink.isVisible({ timeout: 2000 }).catch(() => false)) {
    await backLink.click()
  } else {
    await page.goto('/app/tools/mood-boards', { waitUntil: 'networkidle' })
  }
  await page.waitForTimeout(2000)

  await page.screenshot({ path: ss('14-boards-home-final'), fullPage: true })
})
