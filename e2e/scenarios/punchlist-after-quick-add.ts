import type { ScreenshotScenario } from './types'

const scenario: ScreenshotScenario = {
  key: 'punchlist-after-quick-add',
  description: 'User adds a fix list item via Quick Capture, screenshot shows the saved state before editing',
  persona: 'full-setup',
  device: 'both',

  async run(page, snap) {
    // Navigate to the first punchlist collection
    await page.goto('/app/tools/punchlist')
    await page.waitForLoadState('networkidle')

    // Click into the first collection card (or the only one)
    const card = page.locator('[data-testid="collection-card"], .cursor-pointer').first()
    if (await card.isVisible({ timeout: 5000 }).catch(() => false)) {
      await card.click()
      await page.waitForLoadState('networkidle')
    }

    await snap('punchlist-list-view')

    // Open Quick Add (mobile: FAB, desktop: Add button)
    const fab = page.locator('button[aria-label="Add Fix"]')
    const desktopAdd = page.locator('button:has-text("Add")')
    if (await fab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await fab.click()
    } else if (await desktopAdd.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await desktopAdd.first().click()
    }

    await page.waitForTimeout(500)
    await snap('quick-add-open')

    // Type an issue description
    const input = page.locator('input[placeholder*="Describe the issue"]').first()
    await input.fill('Bathroom grout cracking near shower door')
    await snap('quick-add-typed')

    // Submit
    const addBtn = page.locator('button:has-text("Add")').last()
    await addBtn.click()
    await page.waitForTimeout(600)
    await snap('quick-add-saved')
  },
}

export default scenario
