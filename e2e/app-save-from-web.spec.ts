/**
 * Save From Web critical path e2e tests.
 * Tests BOTH hash-based and sessionStorage payload flows,
 * decode error UI, image picker, destination selection, save, and success navigation.
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

/** Base64-encode a payload the same way the bookmarklet does */
function encodePayloadAsHash(payload: object): string {
  const json = JSON.stringify(payload)
  // Mirror the bookmarklet: btoa(unescape(encodeURIComponent(json)))
  const b64 = Buffer.from(json, 'utf-8').toString('base64')
  return `#bookmarklet=${b64}`
}

// -- Empty state: no payload --
test('save-from-web: shows setup instructions with no payload', async ({ page }, testInfo) => {
  await page.goto('/app/save-from-web', { waitUntil: 'networkidle' })

  await expect(page.getByTestId('empty-state-savefromweb')).toBeVisible()
  await expect(page.getByText('Save to HHC')).toBeVisible()
  await expect(page.getByText('Drag this button to your bookmarks bar')).toBeVisible()

  await page.screenshot({
    path: screenshotPath('savefromweb-empty', testInfo),
    fullPage: true,
  })
})

// -- Hash-based payload (primary bookmarklet flow) --
test('save-from-web: hash payload renders captured data', async ({ page }, testInfo) => {
  const hash = encodePayloadAsHash(MOCK_PAYLOAD)
  await page.goto(`/app/save-from-web${hash}`, { waitUntil: 'networkidle' })

  // Should show captured page title
  await expect(page.getByText(MOCK_PAYLOAD.title)).toBeVisible()

  // Should show source domain
  await expect(page.getByText('example.com')).toBeVisible()

  // Should show image selection area
  await expect(page.getByText('Select images')).toBeVisible()

  // Save button should be visible
  const saveBtn = page.getByTestId('savefromweb-save')
  await expect(saveBtn).toBeVisible()

  // URL hash should be cleared (prevents re-import on refresh)
  const currentUrl = page.url()
  expect(currentUrl).not.toContain('#bookmarklet=')

  await page.screenshot({
    path: screenshotPath('savefromweb-hash-payload', testInfo),
    fullPage: true,
  })
})

// -- SessionStorage fallback (same-window flow) --
test('save-from-web: sessionStorage payload renders captured data', async ({ page }, testInfo) => {
  // Inject payload into sessionStorage before navigating
  await page.goto('/app/save-from-web', { waitUntil: 'networkidle' })
  await page.evaluate(
    ([key, data]) => {
      sessionStorage.setItem(key, JSON.stringify(data))
    },
    [BOOKMARKLET_KEY, MOCK_PAYLOAD] as const
  )

  // Re-navigate to trigger payload parsing
  await page.goto('/app/save-from-web', { waitUntil: 'networkidle' })

  await expect(page.getByText(MOCK_PAYLOAD.title)).toBeVisible()
  await expect(page.getByText('example.com')).toBeVisible()

  await page.screenshot({
    path: screenshotPath('savefromweb-session-payload', testInfo),
    fullPage: true,
  })
})

// -- Decode failure shows error UI --
test('save-from-web: corrupted hash shows decode error', async ({ page }, testInfo) => {
  // Navigate with a corrupted base64 hash
  await page.goto('/app/save-from-web#bookmarklet=NOT_VALID_BASE64!!!', { waitUntil: 'networkidle' })

  // Should show error state
  await expect(page.getByTestId('decode-error-state')).toBeVisible()
  await expect(page.getByText("We couldn't read what you saved")).toBeVisible()

  // Should still show setup instructions below
  await expect(page.getByTestId('empty-state-savefromweb')).toBeVisible()

  await page.screenshot({
    path: screenshotPath('savefromweb-decode-error', testInfo),
    fullPage: true,
  })
})

// -- Hash payload with no images --
test('save-from-web: payload with no images shows hint', async ({ page }, testInfo) => {
  const noImagesPayload = {
    title: 'Text-Only Product Page',
    images: [],
    url: 'https://example.com/text-only',
  }
  const hash = encodePayloadAsHash(noImagesPayload)
  await page.goto(`/app/save-from-web${hash}`, { waitUntil: 'networkidle' })

  await expect(page.getByText(noImagesPayload.title)).toBeVisible()
  await expect(page.getByText('No images found on this page')).toBeVisible()
  await expect(page.getByText('You can still save this URL as an idea')).toBeVisible()

  await page.screenshot({
    path: screenshotPath('savefromweb-no-images', testInfo),
    fullPage: true,
  })
})

// -- Full save flow via hash --
test('save-from-web: hash save creates idea and shows success', async ({ page }, testInfo) => {
  const hash = encodePayloadAsHash(MOCK_PAYLOAD)
  await page.goto(`/app/save-from-web${hash}`, { waitUntil: 'networkidle' })

  // Name should be pre-filled
  const nameInput = page.locator('input[placeholder="Name this idea..."]')
  await expect(nameInput).toHaveValue(MOCK_PAYLOAD.title)

  // Select "Finish Selections" destination
  await page.getByText('Finish Selections').click()

  // Click save
  const saveBtn = page.getByTestId('savefromweb-save')
  await saveBtn.click()

  // Should show success
  await expect(page.getByText('Idea saved!')).toBeVisible()

  // Should have navigation options
  const roomLink = page.getByTestId('savefromweb-success-open-room')
  const selectionLink = page.getByTestId('savefromweb-success-open-selection')
  const hasRoomLink = await roomLink.isVisible().catch(() => false)
  const hasSelectionLink = await selectionLink.isVisible().catch(() => false)
  expect(hasRoomLink || hasSelectionLink).toBeTruthy()

  await page.screenshot({
    path: screenshotPath('savefromweb-hash-success', testInfo),
    fullPage: true,
  })
})

// -- Save to Mood Board via hash --
test('save-from-web: save to mood board via hash', async ({ page }, testInfo) => {
  const hash = encodePayloadAsHash(MOCK_PAYLOAD)
  await page.goto(`/app/save-from-web${hash}`, { waitUntil: 'networkidle' })

  // Select "Mood Boards" destination
  await page.getByText('Mood Boards').click()

  // Click save
  const saveBtn = page.getByTestId('savefromweb-save')
  await saveBtn.click()

  // Should show success
  await expect(page.getByText('Idea saved!')).toBeVisible()
  await expect(page.getByText('View Board')).toBeVisible()

  await page.screenshot({
    path: screenshotPath('savefromweb-mood-board-success', testInfo),
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

  await expect(page).toHaveURL(/\/tools\/finish-decisions/)

  await page.screenshot({
    path: screenshotPath('savefromweb-back-to-boards', testInfo),
    fullPage: true,
  })
})
