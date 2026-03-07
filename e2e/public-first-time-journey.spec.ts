/**
 * First-Time User Journey E2E Test
 *
 * Captures the full experience from non-logged-in browsing
 * through first-time user setup of Decision Boards.
 *
 * Flow:
 *   1. Public pages: Homepage, Guides, Renovation Stages, Tools, Login
 *   2. Authenticated as new-user persona (no projects)
 *   3. First-time dashboard → Create project
 *   4. Decision Boards onboarding → Create rooms + decisions
 *   5. View other tools (Mood Boards, Fix List, Contract Checklist)
 *
 * Run:
 *   PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test public-first-time-journey --project=public
 *
 * Screenshots saved to: e2e/screenshots/journey/
 */
import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const JOURNEY_DIR = path.join('e2e', 'screenshots', 'journey')

/** Sequential screenshot counter for easy ordering */
let step = 0
function shotPath(name: string): string {
  step++
  const prefix = String(step).padStart(2, '0')
  return path.join(JOURNEY_DIR, `${prefix}-${name}.png`)
}

// Route reference log: written alongside screenshots
const routeLog: string[] = []
function logRoute(name: string, url: string) {
  routeLog.push(`${String(step).padStart(2, '0')}-${name}.png → ${url}`)
}

test('first-time user journey: public → login → Decision Boards setup', async ({ browser }) => {
  test.setTimeout(120_000) // 2 minutes — this is a long journey test

  // Ensure screenshot directory exists
  fs.mkdirSync(JOURNEY_DIR, { recursive: true })

  // ========================================================================
  // Phase 1: Public browsing (no auth)
  // ========================================================================
  const publicCtx = await browser.newContext()
  const pub = await publicCtx.newPage()

  // 1. Homepage
  await pub.goto('/', { waitUntil: 'networkidle' })
  logRoute('homepage', pub.url())
  await pub.screenshot({ path: shotPath('homepage'), fullPage: true })

  // 2. Renovation Guides hub
  await pub.goto('/hawaii-home-renovation', { waitUntil: 'networkidle' })
  logRoute('renovation-guides', pub.url())
  await pub.screenshot({ path: shotPath('renovation-guides'), fullPage: true })

  // 3. Renovation Stages (Resources)
  await pub.goto('/resources/renovation-stages', { waitUntil: 'networkidle' })
  logRoute('renovation-stages', pub.url())
  await pub.screenshot({ path: shotPath('renovation-stages'), fullPage: true })

  // 4. Tools overview page
  await pub.goto('/tools', { waitUntil: 'networkidle' })
  logRoute('tools-overview', pub.url())
  await pub.screenshot({ path: shotPath('tools-overview'), fullPage: true })

  // Scroll to see all tool cards
  await pub.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await pub.waitForTimeout(500)
  logRoute('tools-overview-bottom', pub.url())
  await pub.screenshot({ path: shotPath('tools-overview-bottom'), fullPage: true })

  // 5. Login page
  await pub.goto('/login', { waitUntil: 'networkidle' })
  logRoute('login-page', pub.url())
  await pub.screenshot({ path: shotPath('login-page'), fullPage: true })

  // 6. Try accessing /app without auth → should redirect to login
  await pub.goto('/app', { waitUntil: 'networkidle' })
  logRoute('login-redirect', pub.url())
  await pub.screenshot({ path: shotPath('login-redirect'), fullPage: true })

  await publicCtx.close()

  // ========================================================================
  // Phase 2: First-time authenticated user (new-user persona)
  // ========================================================================
  const newUserStorage = path.join(__dirname, '.auth', 'persona-new-user.json')
  const authCtx = await browser.newContext({ storageState: newUserStorage })
  const page = await authCtx.newPage()

  // 8. First visit to /app → ProjectKeyWrapper shows "No projects" fallback
  await page.goto('/app', { waitUntil: 'networkidle' })
  await expect(page).not.toHaveURL(/\/login/)
  logRoute('app-no-project', page.url())
  await page.screenshot({ path: shotPath('app-no-project'), fullPage: true })

  // 8b. Handle stage picker dialog if it appears
  // (modal with "Where are you in your renovation?" and stage options)
  const stageDialog = page.getByRole('dialog', { name: /renovation/i })
  if (await stageDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
    logRoute('stage-picker-dialog', page.url())
    await page.screenshot({ path: shotPath('stage-picker-dialog'), fullPage: true })

    // Click "Choosing Finishes" stage option (most relevant for Decision Boards test)
    const finishesBtn = page.getByRole('button', { name: /Choosing Finishes/i })
    if (await finishesBtn.isVisible()) {
      await finishesBtn.click()
      await page.waitForTimeout(1000)
      await page.waitForLoadState('networkidle')
    }
  }

  // 8c. Handle newsletter signup section if it appears
  const skipNewsletter = page.getByRole('button', { name: /Skip for now/i })
  if (await skipNewsletter.isVisible({ timeout: 1000 }).catch(() => false)) {
    logRoute('newsletter-prompt', page.url())
    await page.screenshot({ path: shotPath('newsletter-prompt'), fullPage: true })
    await skipNewsletter.click()
    await page.waitForTimeout(500)
  }

  // 9. Click "Create my home" to bootstrap the first project
  const createBtn = page.getByRole('button', { name: /Create my home/i })
  const hasCreateBtn = await createBtn.isVisible({ timeout: 5000 }).catch(() => false)

  if (hasCreateBtn) {
    await createBtn.click({ force: true })
    // Wait for project creation + page re-render
    await page.waitForTimeout(3000)
    await page.waitForLoadState('networkidle')
    logRoute('app-project-created', page.url())
    await page.screenshot({ path: shotPath('app-project-created'), fullPage: true })
  } else {
    logRoute('app-dashboard-auto', page.url())
    await page.screenshot({ path: shotPath('app-dashboard-auto'), fullPage: true })
  }

  // 10. Navigate to Decision Boards
  await page.goto('/app/tools/finish-decisions', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000) // Let tool state load
  logRoute('decision-boards-initial', page.url())
  await page.screenshot({ path: shotPath('decision-boards-initial'), fullPage: true })

  // 11. Check for onboarding view ("What are you renovating?")
  const onboardingHeader = page.getByText('What are you renovating?')
  const hasOnboarding = await onboardingHeader.isVisible({ timeout: 3000 }).catch(() => false)

  if (hasOnboarding) {
    // ── Onboarding flow ──
    logRoute('onboarding-room-selector', page.url())
    await page.screenshot({ path: shotPath('onboarding-room-selector'), fullPage: true })

    // Select Kitchen (button text includes emoji: "🍳 Kitchen")
    const kitchenBtn = page.getByRole('button', { name: /Kitchen/i })
    if (await kitchenBtn.isVisible()) {
      await kitchenBtn.click()
      await page.waitForTimeout(500)
      logRoute('onboarding-kitchen-selected', page.url())
      await page.screenshot({ path: shotPath('onboarding-kitchen-selected'), fullPage: true })
    }

    // Select Bathroom (button text: "🚿 Bathroom")
    const bathroomBtn = page.getByRole('button', { name: /Bathroom/i })
    if (await bathroomBtn.isVisible()) {
      await bathroomBtn.click()
      await page.waitForTimeout(500)
      logRoute('onboarding-two-rooms-selected', page.url())
      await page.screenshot({ path: shotPath('onboarding-two-rooms-selected'), fullPage: true })
    }

    // Scroll to submit button
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(300)
    logRoute('onboarding-ready-to-create', page.url())
    await page.screenshot({ path: shotPath('onboarding-ready-to-create'), fullPage: true })

    // Click "Create Decision Boards" — wait for it to become enabled
    const createBoardsBtn = page.getByRole('button', { name: /Create Decision Boards/i })
    await expect(createBoardsBtn).toBeEnabled({ timeout: 5000 })
    if (await createBoardsBtn.isVisible()) {
      await createBoardsBtn.click()
      await page.waitForTimeout(2000)
      await page.waitForLoadState('networkidle')
      logRoute('boards-created-from-onboarding', page.url())
      await page.screenshot({ path: shotPath('boards-created-from-onboarding'), fullPage: true })
    }
  } else {
    // ── "Add a Room" tile approach (no onboarding) ──
    const addRoomBtn = page.getByText('Add a Room')
    if (await addRoomBtn.isVisible().catch(() => false)) {
      logRoute('add-room-tile-visible', page.url())
      await page.screenshot({ path: shotPath('add-room-tile-visible'), fullPage: true })

      await addRoomBtn.click()
      await page.waitForTimeout(500)
      logRoute('add-room-modal-open', page.url())
      await page.screenshot({ path: shotPath('add-room-modal-open'), fullPage: true })

      // Fill room name
      const nameInput = page.locator('input').filter({ hasText: '' }).last()
      const inputLocator = page.locator('input[type="text"]').last()
      if (await inputLocator.isVisible()) {
        await inputLocator.fill('Kitchen')
      }

      // Click "Create Room"
      const createRoomBtn = page.getByRole('button', { name: /Create Room/i })
      if (await createRoomBtn.isVisible()) {
        await createRoomBtn.click()
        await page.waitForTimeout(1500)
        await page.waitForLoadState('networkidle')
        logRoute('room-created', page.url())
        await page.screenshot({ path: shotPath('room-created'), fullPage: true })
      }
    }
  }

  // 12. View the rooms board with created rooms
  await page.goto('/app/tools/finish-decisions', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  logRoute('rooms-board-overview', page.url())
  await page.screenshot({ path: shotPath('rooms-board-overview'), fullPage: true })

  // Scroll to see everything
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(300)
  logRoute('rooms-board-bottom', page.url())
  await page.screenshot({ path: shotPath('rooms-board-bottom'), fullPage: true })

  // 13. Click into the first room card
  const firstRoomCard = page.getByTestId('room-card').first()
  if (await firstRoomCard.isVisible({ timeout: 3000 }).catch(() => false)) {
    await firstRoomCard.click()
    await page.waitForLoadState('networkidle')
    logRoute('room-detail-view', page.url())
    await page.screenshot({ path: shotPath('room-detail-view'), fullPage: true })

    // 14. Check for decisions
    const decisionCards = page.getByTestId('selection-card')
    const decisionCount = await decisionCards.count()

    if (decisionCount > 0) {
      logRoute('room-with-decisions', page.url())
      await page.screenshot({ path: shotPath('room-with-decisions'), fullPage: true })

      // Click into first decision detail
      await decisionCards.first().click()
      await page.waitForLoadState('networkidle')
      logRoute('decision-detail', page.url())
      await page.screenshot({ path: shotPath('decision-detail'), fullPage: true })

      // Scroll to bottom (comments section)
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(300)
      logRoute('decision-detail-bottom', page.url())
      await page.screenshot({ path: shotPath('decision-detail-bottom'), fullPage: true })

      // Go back to room detail
      await page.goBack()
      await page.waitForLoadState('networkidle')
    }

    // 15. Add a custom decision via "+ Decision" button
    const addDecisionBtn = page.locator('button').filter({ hasText: /Decision/i }).first()
    if (await addDecisionBtn.isVisible().catch(() => false)) {
      await addDecisionBtn.click()
      await page.waitForTimeout(500)
      logRoute('add-decision-modal', page.url())
      await page.screenshot({ path: shotPath('add-decision-modal'), fullPage: true })

      // Find the text input for decision name
      const decisionInput = page.locator('input[type="text"]')
      const inputCount = await decisionInput.count()
      for (let i = 0; i < inputCount; i++) {
        const input = decisionInput.nth(i)
        const placeholder = await input.getAttribute('placeholder')
        if (placeholder && (placeholder.includes('Countertop') || placeholder.includes('Faucet') || placeholder.includes('countertop') || placeholder.includes('e.g'))) {
          await input.fill('Flooring')
          break
        }
      }

      logRoute('add-decision-filled', page.url())
      await page.screenshot({ path: shotPath('add-decision-filled'), fullPage: true })

      // Click "Add"
      const addBtn = page.getByRole('button', { name: /^Add$/i })
      if (await addBtn.isVisible()) {
        await addBtn.click()
        await page.waitForTimeout(1000)
        logRoute('decision-added-success', page.url())
        await page.screenshot({ path: shotPath('decision-added-success'), fullPage: true })
      }
    }
  }

  // 16. Final overview of rooms board
  await page.goto('/app/tools/finish-decisions', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  logRoute('final-rooms-overview', page.url())
  await page.screenshot({ path: shotPath('final-rooms-overview'), fullPage: true })

  // 17. Quick look at other tools as first-time user
  await page.goto('/app/tools/mood-boards', { waitUntil: 'networkidle' })
  logRoute('mood-boards-first-visit', page.url())
  await page.screenshot({ path: shotPath('mood-boards-first-visit'), fullPage: true })

  await page.goto('/app/tools/punchlist', { waitUntil: 'networkidle' })
  logRoute('fix-list-first-visit', page.url())
  await page.screenshot({ path: shotPath('fix-list-first-visit'), fullPage: true })

  await page.goto('/app/tools/before-you-sign', { waitUntil: 'networkidle' })
  logRoute('contract-checklist-first-visit', page.url())
  await page.screenshot({ path: shotPath('contract-checklist-first-visit'), fullPage: true })

  await authCtx.close()

  // Write route reference log
  const logContent = routeLog.join('\n') + '\n'
  fs.writeFileSync(path.join(JOURNEY_DIR, 'ROUTE_REFERENCE.txt'), logContent)
})
