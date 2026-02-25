/**
 * Save From Web critical path e2e tests.
 * Tests bookmarklet payload parsing, image picker, save action, and success navigation.
 */
import { test, expect } from '@playwright/test'
import { screenshotPath } from './helpers/screenshot'

const BOOKMARKLET_KEY = 'hhc_bookmarklet_pending'

const MOCK_PAYLOAD = {
  title: 'Coastal Blue Backsplash Tile – Test Product',
  images: [
    { url: 'https://example.com/images/tile-1.jpg', label: 'Main product image' },
    { url: 'https://example.com/images/tile-2.jpg', label: 'Room view' },
    { url: 'https://example.com/images/tile-3.jpg', label: 'Close up' },
  ],
  url: 'https://example.com/products/coastal-blue-tile',
}

// -- Empty state: no payload --
test('save-from-web: shows setup instructions with no payload', async ({ page }, testInfo) => {
  await page.goto('/app/save-from-web', { waitUntil: 'networkidle' })

  // Should show the setup instructions (bookmarklet steps)
  await expect(page.getByText('Save to HHC')).toBeVisible()
  await expect(page.getByText('Drag this button to your bookmarks bar')).toBeVisible()

  await page.screenshot({
    path: screenshotPath('savefromweb-empty', testInfo),
    fullPage: true,
  })
})

// -- Payload present: image picker + form --
test('save-from-web: renders captured data from bookmarklet payload', async ({ page }, testInfo) => {
  // Inject payload into sessionStorage before navigating
  await page.goto('/app/save-from-web', { waitUntil: 'networkidle' })
  await page.evaluate(
    ([key, data]) => {
      sessionStorage.setItem(key, JSON.stringify(data))
    },
    [BOOKMARKLET_KEY, MOCK_PAYLOAD] as const
  )

  // Re-navigate to trigger payload parsing from sessionStorage
  await page.goto('/app/save-from-web', { waitUntil: 'networkidle' })

  // Should show captured page title
  await expect(page.getByText(MOCK_PAYLOAD.title)).toBeVisible()

  // Should show source URL
  await expect(page.getByText('example.com')).toBeVisible()

  // Should show image thumbnails (the grid)
  await expect(page.getByText('Select images')).toBeVisible()

  // Should show the "Create Idea" save button
  const saveBtn = page.getByTestId('savefromweb-save')
  await expect(saveBtn).toBeVisible()

  await page.screenshot({
    path: screenshotPath('savefromweb-with-payload', testInfo),
    fullPage: true,
  })
})

// -- Full save flow --
test('save-from-web: save creates idea and shows success', async ({ page }, testInfo) => {
  // Inject payload
  await page.goto('/app/save-from-web', { waitUntil: 'networkidle' })
  await page.evaluate(
    ([key, data]) => {
      sessionStorage.setItem(key, JSON.stringify(data))
    },
    [BOOKMARKLET_KEY, MOCK_PAYLOAD] as const
  )
  await page.goto('/app/save-from-web', { waitUntil: 'networkidle' })

  // The idea name field should be pre-filled with the page title
  const nameInput = page.locator('input[placeholder="Name this idea..."]')
  await expect(nameInput).toBeVisible()
  await expect(nameInput).toHaveValue(MOCK_PAYLOAD.title)

  // Click save (no room selected → goes to Global Unsorted)
  const saveBtn = page.getByTestId('savefromweb-save')
  await saveBtn.click()

  // Should show success state
  await expect(page.getByText('Idea saved!')).toBeVisible()

  // Should show navigation buttons
  const boardsLink = page.getByText('Go to Selection Boards')
  const roomLink = page.getByTestId('savefromweb-success-open-room')

  // At least one navigation option should be visible
  const hasBoardsLink = await boardsLink.isVisible().catch(() => false)
  const hasRoomLink = await roomLink.isVisible().catch(() => false)
  expect(hasBoardsLink || hasRoomLink).toBeTruthy()

  await page.screenshot({
    path: screenshotPath('savefromweb-success', testInfo),
    fullPage: true,
  })
})

// -- Back link --
test('save-from-web: back link navigates to Selection Boards', async ({ page }, testInfo) => {
  await page.goto('/app/save-from-web', { waitUntil: 'networkidle' })

  const backLink = page.getByText('Back to Selection Boards')
  await expect(backLink).toBeVisible()

  await backLink.click()
  await page.waitForLoadState('networkidle')

  // Should be on the Selection Boards page
  await expect(page).toHaveURL(/\/tools\/finish-decisions/)

  await page.screenshot({
    path: screenshotPath('savefromweb-back-to-boards', testInfo),
    fullPage: true,
  })
})
