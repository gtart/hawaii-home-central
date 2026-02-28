/**
 * Share & Collaboration E2E Tests
 *
 * 15 journey tests covering:
 *  - Mood Boards: PDF export (all + scoped), public links (create, scoped, revoke), collaborator VIEW
 *  - Decision Tracker: PDF export (all + scoped), public links (create, scoped, revoke), collaborator EDIT
 *  - Cross-cutting: risky share confirmation, VIEW collab no Public Links tab, invalid token
 *
 * Each test creates its own browser context with the appropriate persona.
 * Screenshots are captured via e2e/helpers/capture.ts into a deterministic
 * artifact folder with manifest.json and index.html.
 */
import { test, expect, Page, Browser } from '@playwright/test'
import { PERSONAS } from './personas'
import { capture, writeManifest, getArtifactDir } from './helpers/capture'

const OWNER = PERSONAS.find((p) => p.key === 'full-setup')!
const COLLAB = PERSONAS.find((p) => p.key === 'collaborator')!

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
const MB_URL = '/app/tools/mood-boards'
const DT_URL = '/app/tools/finish-decisions'

// Disable trace for this file — manually-created contexts conflict with Playwright's
// trace recording and cause ENOENT errors on cleanup. Also increase timeout.
test.use({ trace: 'off', timeout: 90_000 })

// ─── Context Helpers ─────────────────────────────────────────

async function ownerPage(browser: Browser): Promise<Page> {
  const ctx = await browser.newContext({
    storageState: OWNER.storageStatePath,
    baseURL: BASE_URL,
  })
  return ctx.newPage()
}

async function collabPage(browser: Browser): Promise<Page> {
  const ctx = await browser.newContext({
    storageState: COLLAB.storageStatePath,
    baseURL: BASE_URL,
  })
  return ctx.newPage()
}

async function anonPage(browser: Browser): Promise<Page> {
  const ctx = await browser.newContext({ baseURL: BASE_URL })
  return ctx.newPage()
}

/** Safely close a page's browser context (swallow trace-artifact ENOENT errors) */
async function safeClose(page: Page) {
  try { await page.context().close() } catch { /* trace artifact cleanup errors are harmless */ }
}

// ─── Page Setup Helpers ─────────────────────────────────────

/** Dismiss any blocking modals that may appear on page load */
async function dismissBlockingModals(page: Page) {
  // 1. "Where are you in your renovation?" onboarding modal
  try {
    const onboarding = page.getByText('Where are you in your renovation?')
    await onboarding.waitFor({ state: 'visible', timeout: 2_000 })
    await page.keyboard.press('Escape')
    await onboarding.waitFor({ state: 'hidden', timeout: 2_000 })
  } catch {
    // Didn't appear
  }

  // 2. "Stay in the loop" email signup modal
  try {
    const stayInLoop = page.getByText('Stay in the loop')
    await stayInLoop.waitFor({ state: 'visible', timeout: 2_000 })
    await page.getByRole('button', { name: /skip for now/i }).click()
    await stayInLoop.waitFor({ state: 'hidden', timeout: 2_000 })
  } catch {
    // Didn't appear
  }
}

// ─── Modal Helpers ───────────────────────────────────────────

/** Open the Share & Export modal (button must be visible on the page) */
async function openShareExportModal(page: Page) {
  await page.getByRole('button', { name: /Share & Export/i }).click()
  // Wait for modal title
  await page.locator('h2').filter({ hasText: 'Share & Export' }).waitFor({ state: 'visible' })
}

/** Switch to Public Links tab inside the Share & Export modal */
async function switchToPublicLinksTab(page: Page) {
  await page.getByRole('button', { name: /Public Links/i }).click()
  await page.getByText('Active Links').waitFor({ state: 'visible' })
}

/**
 * Create a basic (non-risky) public link. Returns the share path (/share/{tool}/{token}).
 */
async function createBasicPublicLink(page: Page, toolKey: string): Promise<string> {
  await page.getByRole('button', { name: /New Link/i }).click()
  await page.getByText('Configure the new public link').waitFor({ state: 'visible' })

  // Accept the confirmation checkbox
  await page.locator('label').filter({ hasText: 'I understand this creates a public link' }).click()

  // Intercept API response to extract the token
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().includes('/share-token') &&
        r.request().method() === 'POST' &&
        r.status() === 201
    ),
    page.getByRole('button', { name: /Create Link/i }).click(),
  ])

  const data = await response.json()
  return `/share/${toolKey}/${data.token}`
}

/**
 * Create a scoped public link (specific boards/rooms selected).
 * Returns the share path.
 */
async function createScopedPublicLink(
  page: Page,
  toolKey: string,
  scopeType: 'Boards' | 'Rooms',
  scopeNames: string[]
): Promise<string> {
  await page.getByRole('button', { name: /New Link/i }).click()
  await page.getByText('Configure the new public link').waitFor({ state: 'visible' })

  // Switch to "Selected" mode
  await page.locator('label').filter({ hasText: `Selected ${scopeType}` }).click()

  // Select specific scope chips (target within chip container to avoid board/room cards behind modal)
  const chipContainer = page.locator('.flex.flex-wrap.gap-2')
  for (const name of scopeNames) {
    await chipContainer.locator('button').filter({ hasText: name }).click()
  }

  // Accept confirmation
  await page.locator('label').filter({ hasText: 'I understand this creates a public link' }).click()

  const [response] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().includes('/share-token') &&
        r.request().method() === 'POST' &&
        r.status() === 201
    ),
    page.getByRole('button', { name: /Create Link/i }).click(),
  ])

  const data = await response.json()
  return `/share/${toolKey}/${data.token}`
}

// ═══════════════════════════════════════════════════════════════
// MOOD BOARDS — Share & Export
// ═══════════════════════════════════════════════════════════════

test.describe('Mood Boards — Share & Export', () => {
  test('mb-pdf-all: Export PDF with all boards', async ({ browser }) => {
    const page = await ownerPage(browser)
    const testName = 'mb-pdf-all'

    // 1. Navigate to Mood Boards
    await page.goto(MB_URL, { waitUntil: 'networkidle' })
    await dismissBlockingModals(page)
    await page.getByText('Kitchen Inspiration').waitFor({ state: 'visible', timeout: 20_000 })

    await capture(page, {
      stepLabel: 'Mood Boards home — boards loaded',
      previousAction: 'Navigate to /app/tools/mood-boards',
      userState: 'authed',
      testName,
      stabilityGuard: 'text=Kitchen Inspiration',
    })

    // 2. Open Share & Export modal
    await openShareExportModal(page)
    await capture(page, {
      stepLabel: 'Share & Export modal — Export tab (all boards)',
      previousAction: 'Click Share & Export button',
      userState: 'authed',
      testName,
      stabilityGuard: 'text=Open Print Preview',
    })

    // 3. Click "Open Print Preview" — opens new tab via window.open
    const [reportPage] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('button', { name: /Open Print Preview/i }).click(),
    ])
    // Override window.print before it auto-triggers
    await reportPage.waitForLoadState('domcontentloaded')
    await reportPage.evaluate(() => {
      window.print = () => {}
    })
    await reportPage.waitForLoadState('networkidle')

    await capture(reportPage, {
      stepLabel: 'PDF report — all boards rendered',
      previousAction: 'Click Open Print Preview',
      userState: 'authed',
      testName,
      stabilityGuard: 'text=Mood Board',
    })

    // 4. Verify report content
    await expect(reportPage.getByRole('heading', { name: 'Our Renovation' })).toBeVisible()
    // Should show multiple boards
    await expect(reportPage.getByText('Kitchen Inspiration')).toBeVisible()
    await expect(reportPage.getByText('Bathroom Ideas')).toBeVisible()

    await reportPage.close()
    await safeClose(page)
  })

  test('mb-pdf-selected: Export PDF with selected boards', async ({ browser }) => {
    const page = await ownerPage(browser)
    const testName = 'mb-pdf-selected'

    await page.goto(MB_URL, { waitUntil: 'networkidle' })
    await dismissBlockingModals(page)
    await page.getByText('Kitchen Inspiration').waitFor({ state: 'visible', timeout: 20_000 })

    // Open modal
    await openShareExportModal(page)

    // Switch to "Selected Boards"
    await page.locator('label').filter({ hasText: 'Selected Boards' }).click()
    // Select only Kitchen Inspiration (target within chip container to avoid board cards)
    await page.locator('.flex.flex-wrap.gap-2 button').filter({ hasText: 'Kitchen Inspiration' }).click()

    await capture(page, {
      stepLabel: 'Export tab — Kitchen Inspiration board selected',
      previousAction: 'Select Kitchen Inspiration board scope',
      userState: 'authed',
      testName,
    })

    // Open report
    const [reportPage] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('button', { name: /Open Print Preview/i }).click(),
    ])
    await reportPage.waitForLoadState('domcontentloaded')
    await reportPage.evaluate(() => {
      window.print = () => {}
    })
    await reportPage.waitForLoadState('networkidle')

    await capture(reportPage, {
      stepLabel: 'PDF report — Kitchen Inspiration only',
      previousAction: 'Click Open Print Preview with selected board',
      userState: 'authed',
      testName,
      stabilityGuard: 'text=Kitchen Inspiration',
    })

    // Should show Kitchen but NOT Bathroom
    await expect(reportPage.getByText('Kitchen Inspiration')).toBeVisible()
    // The report should not have Bathroom Ideas (scoped to Kitchen only)
    await expect(reportPage.getByText('Bathroom Ideas')).toBeHidden()

    await reportPage.close()
    await safeClose(page)
  })

  test('mb-public-link: Create and visit public link', async ({ browser }) => {
    const page = await ownerPage(browser)
    const testName = 'mb-public-link'

    await page.goto(MB_URL, { waitUntil: 'networkidle' })
    await dismissBlockingModals(page)
    await page.getByText('Kitchen Inspiration').waitFor({ state: 'visible', timeout: 20_000 })

    // Open modal → Public Links tab
    await openShareExportModal(page)
    await switchToPublicLinksTab(page)

    await capture(page, {
      stepLabel: 'Public Links tab — empty or with existing links',
      previousAction: 'Switch to Public Links tab',
      userState: 'authed',
      testName,
      stabilityGuard: 'text=Active Links',
    })

    // Create a basic link
    const sharePath = await createBasicPublicLink(page, 'mood_boards')

    // Wait for the link card to appear in ManageShareLinks
    await page.locator('.font-mono').filter({ hasText: '/share/' }).first().waitFor({ state: 'visible' })

    await capture(page, {
      stepLabel: 'Public link created — link card visible',
      previousAction: 'Create basic public link',
      userState: 'authed',
      testName,
    })

    // Visit the link anonymously
    const anon = await anonPage(browser)
    await anon.goto(sharePath, { waitUntil: 'networkidle' })

    // Wait for public page content (MB public page heading is "Mood Boards", not project name)
    await anon.getByRole('heading', { name: 'Mood Boards' }).waitFor({ state: 'visible', timeout: 15_000 })

    await capture(anon, {
      stepLabel: 'Public mood board page — anonymous view',
      previousAction: `Visit ${sharePath} without auth`,
      userState: 'anon',
      testName,
      stabilityGuard: 'text=Mood Boards',
    })

    // Verify public page has expected content
    await expect(anon.getByRole('heading', { name: 'Mood Boards' })).toBeVisible()

    await safeClose(anon)
    await safeClose(page)
  })

  test('mb-public-scoped: Create scoped public link', async ({ browser }) => {
    const page = await ownerPage(browser)
    const testName = 'mb-public-scoped'

    await page.goto(MB_URL, { waitUntil: 'networkidle' })
    await dismissBlockingModals(page)
    await page.getByText('Kitchen Inspiration').waitFor({ state: 'visible', timeout: 20_000 })

    await openShareExportModal(page)
    await switchToPublicLinksTab(page)

    // Create a scoped link for just Kitchen Inspiration
    const sharePath = await createScopedPublicLink(page, 'mood_boards', 'Boards', [
      'Kitchen Inspiration',
    ])

    await page.locator('.font-mono').filter({ hasText: '/share/' }).first().waitFor({ state: 'visible' })

    await capture(page, {
      stepLabel: 'Scoped link created — Kitchen Inspiration only',
      previousAction: 'Create scoped public link',
      userState: 'authed',
      testName,
    })

    // Visit anonymously
    const anon = await anonPage(browser)
    await anon.goto(sharePath, { waitUntil: 'networkidle' })
    // Scoped to 1 board — heading is the board name
    await anon.getByRole('heading', { name: 'Kitchen Inspiration' }).waitFor({ state: 'visible', timeout: 15_000 })

    await capture(anon, {
      stepLabel: 'Scoped public page — Kitchen Inspiration board only',
      previousAction: `Visit scoped link ${sharePath}`,
      userState: 'anon',
      testName,
      stabilityGuard: 'text=Kitchen Inspiration',
    })

    // Should show Kitchen content
    await expect(anon.getByRole('heading', { name: 'Kitchen Inspiration' })).toBeVisible()

    await safeClose(anon)
    await safeClose(page)
  })

  test('mb-public-revoke: Revoke public link', async ({ browser }) => {
    const page = await ownerPage(browser)
    const testName = 'mb-public-revoke'

    await page.goto(MB_URL, { waitUntil: 'networkidle' })
    await dismissBlockingModals(page)
    await page.getByText('Kitchen Inspiration').waitFor({ state: 'visible', timeout: 20_000 })

    await openShareExportModal(page)
    await switchToPublicLinksTab(page)

    // Create a link
    const sharePath = await createBasicPublicLink(page, 'mood_boards')
    await page.locator('.font-mono').filter({ hasText: '/share/' }).first().waitFor({ state: 'visible' })

    await capture(page, {
      stepLabel: 'Active link — before revoke',
      previousAction: 'Create public link',
      userState: 'authed',
      testName,
    })

    // Revoke the link — handle the native confirm dialog
    page.on('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: 'Revoke' }).last().click()

    // Wait for the link to disappear (list refreshes)
    await page.waitForTimeout(1000)

    await capture(page, {
      stepLabel: 'After revoke — link removed',
      previousAction: 'Click Revoke and confirm',
      userState: 'authed',
      testName,
    })

    // Visit the revoked link anonymously — should show error
    const anon = await anonPage(browser)
    await anon.goto(sharePath, { waitUntil: 'networkidle' })

    await capture(anon, {
      stepLabel: 'Revoked link — error page',
      previousAction: `Visit revoked link ${sharePath}`,
      userState: 'anon',
      testName,
      stabilityGuard: 'text=Link Expired or Revoked',
    })

    await expect(anon.getByText('Link Expired or Revoked')).toBeVisible()

    await safeClose(anon)
    await safeClose(page)
  })

  test('mb-collaborator-view: Collaborator VIEW sees content, no Public Links', async ({
    browser,
  }) => {
    const page = await collabPage(browser)
    const testName = 'mb-collab-view'

    await page.goto(MB_URL, { waitUntil: 'networkidle' })
    await dismissBlockingModals(page)
    await page.getByText('Kitchen Inspiration').waitFor({ state: 'visible', timeout: 20_000 })

    await capture(page, {
      stepLabel: 'Mood Boards as VIEW collaborator',
      previousAction: 'Navigate to mood boards as collaborator',
      userState: 'authed',
      testName,
      stabilityGuard: 'text=Kitchen Inspiration',
    })

    // Open Share & Export modal
    await openShareExportModal(page)

    // Should NOT have Public Links tab (collaborator is not owner)
    await expect(page.getByRole('button', { name: /Public Links/i })).toBeHidden()

    await capture(page, {
      stepLabel: 'Share & Export modal — no Public Links tab (VIEW collaborator)',
      previousAction: 'Open Share & Export as collaborator',
      userState: 'authed',
      testName,
      stabilityGuard: 'text=Open Print Preview',
    })

    // Should still have Export tab working
    await expect(page.getByRole('button', { name: /Open Print Preview/i })).toBeVisible()

    await safeClose(page)
  })
})

// ═══════════════════════════════════════════════════════════════
// DECISION TRACKER — Share & Export
// ═══════════════════════════════════════════════════════════════

test.describe('Decision Tracker — Share & Export', () => {
  test('dt-pdf-all: Export PDF with all rooms', async ({ browser }) => {
    const page = await ownerPage(browser)
    const testName = 'dt-pdf-all'

    await page.goto(DT_URL, { waitUntil: 'networkidle' })
    await dismissBlockingModals(page)
    await page.locator('[data-testid="room-card"]').first().waitFor({ state: 'visible', timeout: 20_000 })

    await capture(page, {
      stepLabel: 'Decision Tracker home — rooms loaded',
      previousAction: 'Navigate to /app/tools/finish-decisions',
      userState: 'authed',
      testName,
      stabilityGuard: '[data-testid="room-card"]',
    })

    // Open Share & Export
    await openShareExportModal(page)
    await capture(page, {
      stepLabel: 'Share & Export modal — Export tab (all rooms)',
      previousAction: 'Click Share & Export button',
      userState: 'authed',
      testName,
      stabilityGuard: 'text=Open Print Preview',
    })

    // Open report
    const [reportPage] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('button', { name: /Open Print Preview/i }).click(),
    ])
    await reportPage.waitForLoadState('domcontentloaded')
    await reportPage.evaluate(() => {
      window.print = () => {}
    })
    await reportPage.waitForLoadState('networkidle')

    await capture(reportPage, {
      stepLabel: 'PDF report — all rooms rendered',
      previousAction: 'Click Open Print Preview',
      userState: 'authed',
      testName,
      stabilityGuard: 'text=Our Renovation',
    })

    // Verify all 3 rooms appear (use .first() to avoid strict mode — room names may repeat in decisions)
    await expect(reportPage.getByText('Kitchen').first()).toBeVisible()
    await expect(reportPage.getByText('Bathroom').first()).toBeVisible()
    await expect(reportPage.getByText('Living Room').first()).toBeVisible()

    await reportPage.close()
    await safeClose(page)
  })

  test('dt-pdf-selected: Export PDF with selected rooms', async ({ browser }) => {
    const page = await ownerPage(browser)
    const testName = 'dt-pdf-selected'

    await page.goto(DT_URL, { waitUntil: 'networkidle' })
    await dismissBlockingModals(page)
    await page.locator('[data-testid="room-card"]').first().waitFor({ state: 'visible', timeout: 20_000 })

    await openShareExportModal(page)

    // Select only Kitchen (scope chips may have emoji prefix, so target within chip container)
    await page.locator('label').filter({ hasText: 'Selected Rooms' }).click()
    await page.locator('.flex.flex-wrap.gap-2 button').filter({ hasText: 'Kitchen' }).click()

    await capture(page, {
      stepLabel: 'Export tab — Kitchen room selected',
      previousAction: 'Select Kitchen room scope',
      userState: 'authed',
      testName,
    })

    const [reportPage] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('button', { name: /Open Print Preview/i }).click(),
    ])
    await reportPage.waitForLoadState('domcontentloaded')
    await reportPage.evaluate(() => {
      window.print = () => {}
    })
    await reportPage.waitForLoadState('networkidle')

    await capture(reportPage, {
      stepLabel: 'PDF report — Kitchen room only',
      previousAction: 'Click Open Print Preview with selected room',
      userState: 'authed',
      testName,
      stabilityGuard: 'text=Kitchen',
    })

    await expect(reportPage.getByText('Kitchen').first()).toBeVisible()

    await reportPage.close()
    await safeClose(page)
  })

  test('dt-public-link: Create and visit public link', async ({ browser }) => {
    const page = await ownerPage(browser)
    const testName = 'dt-public-link'

    await page.goto(DT_URL, { waitUntil: 'networkidle' })
    await dismissBlockingModals(page)
    await page.locator('[data-testid="room-card"]').first().waitFor({ state: 'visible', timeout: 20_000 })

    await openShareExportModal(page)
    await switchToPublicLinksTab(page)

    await capture(page, {
      stepLabel: 'Public Links tab — Decision Tracker',
      previousAction: 'Switch to Public Links tab',
      userState: 'authed',
      testName,
      stabilityGuard: 'text=Active Links',
    })

    const sharePath = await createBasicPublicLink(page, 'finish_decisions')
    await page.locator('.font-mono').filter({ hasText: '/share/' }).first().waitFor({ state: 'visible' })

    await capture(page, {
      stepLabel: 'Public link created — link card visible',
      previousAction: 'Create basic public link',
      userState: 'authed',
      testName,
    })

    // Visit anonymously
    const anon = await anonPage(browser)
    await anon.goto(sharePath, { waitUntil: 'networkidle' })
    await anon.getByRole('heading', { name: 'Our Renovation' }).waitFor({ state: 'visible', timeout: 15_000 })

    await capture(anon, {
      stepLabel: 'Public Decision Tracker page — anonymous view',
      previousAction: `Visit ${sharePath} without auth`,
      userState: 'anon',
      testName,
      stabilityGuard: 'text=Our Renovation',
    })

    await expect(anon.getByRole('heading', { name: 'Our Renovation' })).toBeVisible()
    // Should show rooms
    await expect(anon.getByText('Kitchen').first()).toBeVisible()

    await safeClose(anon)
    await safeClose(page)
  })

  test('dt-public-scoped: Create scoped public link', async ({ browser }) => {
    const page = await ownerPage(browser)
    const testName = 'dt-public-scoped'

    await page.goto(DT_URL, { waitUntil: 'networkidle' })
    await dismissBlockingModals(page)
    await page.locator('[data-testid="room-card"]').first().waitFor({ state: 'visible', timeout: 20_000 })

    await openShareExportModal(page)
    await switchToPublicLinksTab(page)

    const sharePath = await createScopedPublicLink(page, 'finish_decisions', 'Rooms', ['Kitchen'])
    await page.locator('.font-mono').filter({ hasText: '/share/' }).first().waitFor({ state: 'visible' })

    await capture(page, {
      stepLabel: 'Scoped link created — Kitchen room only',
      previousAction: 'Create scoped public link for Kitchen',
      userState: 'authed',
      testName,
    })

    const anon = await anonPage(browser)
    await anon.goto(sharePath, { waitUntil: 'networkidle' })
    await anon.getByRole('heading', { name: 'Our Renovation' }).waitFor({ state: 'visible', timeout: 15_000 })

    await capture(anon, {
      stepLabel: 'Scoped public page — Kitchen room only',
      previousAction: `Visit scoped link ${sharePath}`,
      userState: 'anon',
      testName,
      stabilityGuard: 'text=Our Renovation',
    })

    await expect(anon.getByText('Kitchen').first()).toBeVisible()

    await safeClose(anon)
    await safeClose(page)
  })

  test('dt-public-revoke: Revoke public link', async ({ browser }) => {
    const page = await ownerPage(browser)
    const testName = 'dt-public-revoke'

    await page.goto(DT_URL, { waitUntil: 'networkidle' })
    await dismissBlockingModals(page)
    await page.locator('[data-testid="room-card"]').first().waitFor({ state: 'visible', timeout: 20_000 })

    await openShareExportModal(page)
    await switchToPublicLinksTab(page)

    const sharePath = await createBasicPublicLink(page, 'finish_decisions')
    await page.locator('.font-mono').filter({ hasText: '/share/' }).first().waitFor({ state: 'visible' })

    await capture(page, {
      stepLabel: 'Active link — before revoke',
      previousAction: 'Create public link',
      userState: 'authed',
      testName,
    })

    // Revoke
    page.on('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: 'Revoke' }).last().click()
    await page.waitForTimeout(1000)

    await capture(page, {
      stepLabel: 'After revoke — link removed',
      previousAction: 'Click Revoke and confirm',
      userState: 'authed',
      testName,
    })

    const anon = await anonPage(browser)
    await anon.goto(sharePath, { waitUntil: 'networkidle' })

    await capture(anon, {
      stepLabel: 'Revoked link — error page',
      previousAction: `Visit revoked link ${sharePath}`,
      userState: 'anon',
      testName,
      stabilityGuard: 'text=Link Expired or Revoked',
    })

    await expect(anon.getByText('Link Expired or Revoked')).toBeVisible()

    await safeClose(anon)
    await safeClose(page)
  })

  test('dt-collaborator-edit: Collaborator EDIT sees content and can interact', async ({
    browser,
  }) => {
    const page = await collabPage(browser)
    const testName = 'dt-collab-edit'

    await page.goto(DT_URL, { waitUntil: 'networkidle' })
    await dismissBlockingModals(page)
    await page.locator('[data-testid="room-card"]').first().waitFor({ state: 'visible', timeout: 20_000 })

    await capture(page, {
      stepLabel: 'Decision Tracker as EDIT collaborator — rooms visible',
      previousAction: 'Navigate to decision tracker as collaborator',
      userState: 'authed',
      testName,
      stabilityGuard: '[data-testid="room-card"]',
    })

    // Verify rooms are visible
    await expect(page.getByText('Kitchen').first()).toBeVisible()
    await expect(page.getByText('Bathroom').first()).toBeVisible()
    await expect(page.getByText('Living Room').first()).toBeVisible()

    // Navigate into a room to verify EDIT access
    await page.locator('[data-testid="room-card"]').first().click()
    await page.waitForLoadState('networkidle')

    await capture(page, {
      stepLabel: 'Room detail — EDIT collaborator can view decisions',
      previousAction: 'Click first room card',
      userState: 'authed',
      testName,
    })

    // Open Share & Export — should NOT have Public Links tab
    await openShareExportModal(page)

    await expect(page.getByRole('button', { name: /Public Links/i })).toBeHidden()

    await capture(page, {
      stepLabel: 'Share & Export modal — no Public Links tab (EDIT collaborator)',
      previousAction: 'Open Share & Export as EDIT collaborator',
      userState: 'authed',
      testName,
      stabilityGuard: 'text=Open Print Preview',
    })

    await safeClose(page)
  })
})

// ═══════════════════════════════════════════════════════════════
// CROSS-CUTTING
// ═══════════════════════════════════════════════════════════════

test.describe('Cross-cutting', () => {
  test('risky-share-confirmation: Notes + all scopes triggers risky flow', async ({
    browser,
  }) => {
    const page = await ownerPage(browser)
    const testName = 'risky-share'

    // Use Mood Boards (has 3 scopes: Saved Ideas default excluded, Kitchen, Bathroom = 2 visible)
    // Actually risky requires 3+ scopes. MB has boards: Saved Ideas (default), Kitchen Inspo, Bathroom Ideas.
    // Non-default boards: Kitchen Inspo + Bathroom Ideas = 2 scopes. Risky needs >= 3.
    // Use Decision Tracker instead (3 rooms: Kitchen, Bathroom, Living Room)
    await page.goto(DT_URL, { waitUntil: 'networkidle' })
    await dismissBlockingModals(page)
    await page.locator('[data-testid="room-card"]').first().waitFor({ state: 'visible', timeout: 20_000 })

    await openShareExportModal(page)
    await switchToPublicLinksTab(page)

    // Start creating a new link
    await page.getByRole('button', { name: /New Link/i }).click()
    await page.getByText('Configure the new public link').waitFor({ state: 'visible' })

    // Enable notes to trigger risky mode (all rooms + notes + 3 scopes)
    await page.locator('label').filter({ hasText: 'Notes' }).first().click()

    // Should show risky warning
    await page.getByText('Type SHARE to confirm').waitFor({ state: 'visible' })

    await capture(page, {
      stepLabel: 'Risky share warning — type SHARE to confirm',
      previousAction: 'Enable notes with all rooms (3 scopes = risky)',
      userState: 'authed',
      testName,
      stabilityGuard: 'text=Type SHARE to confirm',
    })

    // Create button should be disabled
    await expect(page.getByRole('button', { name: /Create Link/i })).toBeDisabled()

    // Type SHARE
    await page.getByPlaceholder('Type SHARE to confirm').fill('SHARE')

    await capture(page, {
      stepLabel: 'SHARE typed — Create Link enabled',
      previousAction: 'Type SHARE in confirmation field',
      userState: 'authed',
      testName,
    })

    // Now the Create Link button should be enabled
    await expect(page.getByRole('button', { name: /Create Link/i })).toBeEnabled()

    // Create the link
    const [response] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes('/share-token') &&
          r.request().method() === 'POST' &&
          r.status() === 201
      ),
      page.getByRole('button', { name: /Create Link/i }).click(),
    ])

    await page.waitForTimeout(500)

    await capture(page, {
      stepLabel: 'Risky link created successfully',
      previousAction: 'Click Create Link after SHARE confirmation',
      userState: 'authed',
      testName,
    })

    await safeClose(page)
  })

  test('view-collaborator-no-public-tab: VIEW collaborator cannot access Public Links', async ({
    browser,
  }) => {
    const page = await collabPage(browser)
    const testName = 'view-collab-no-public'

    // Mood Boards — collaborator has VIEW access
    await page.goto(MB_URL, { waitUntil: 'networkidle' })
    await dismissBlockingModals(page)
    await page.getByText('Kitchen Inspiration').waitFor({ state: 'visible', timeout: 20_000 })

    await openShareExportModal(page)

    await capture(page, {
      stepLabel: 'VIEW collaborator modal — only Export tab',
      previousAction: 'Open Share & Export as VIEW collaborator',
      userState: 'authed',
      testName,
      stabilityGuard: 'text=Open Print Preview',
    })

    // Verify no Public Links tab
    await expect(page.getByRole('button', { name: /Public Links/i })).toHaveCount(0)

    // Export tab should still work
    await expect(page.getByText('Include notes')).toBeVisible()
    await expect(page.getByRole('button', { name: /Open Print Preview/i })).toBeVisible()

    await safeClose(page)
  })

  test('invalid-token: Bogus share token shows error page', async ({ browser }) => {
    const page = await anonPage(browser)
    const testName = 'invalid-token'

    await page.goto('/share/mood_boards/totally-bogus-token-12345', { waitUntil: 'networkidle' })

    await capture(page, {
      stepLabel: 'Invalid token — error page shown',
      previousAction: 'Visit /share/mood_boards/totally-bogus-token-12345',
      userState: 'anon',
      testName,
      stabilityGuard: 'text=Link Expired or Revoked',
    })

    await expect(page.getByText('Link Expired or Revoked')).toBeVisible()
    await expect(
      page.getByText('This shared link is no longer valid')
    ).toBeVisible()

    await safeClose(page)
  })
})

// ─── Write manifest after all tests ──────────────────────────

test.afterAll(() => {
  const { manifestPath, indexPath } = writeManifest()
  console.log(`\n📸 Screenshots: ${getArtifactDir()}`)
  console.log(`📋 Manifest: ${manifestPath}`)
  console.log(`🌐 Index: ${indexPath}`)
})
