import type { ScreenshotScenario } from './types'

const scenario: ScreenshotScenario = {
  key: 'mood-board-move-menu',
  description: 'Open a mood board idea and show the Move menu (portal fix verification)',
  persona: 'full-setup',
  device: 'both',

  async run(page, snap) {
    await page.goto('/app/tools/mood-boards')
    await page.waitForLoadState('networkidle')

    // Click first collection
    const card = page.locator('.cursor-pointer').first()
    if (await card.isVisible({ timeout: 5000 }).catch(() => false)) {
      await card.click()
      await page.waitForLoadState('networkidle')
    }

    await snap('mood-board-list')

    // Click first idea card to open detail modal
    const ideaCard = page.locator('[data-testid="idea-card"]').first()
    if (await ideaCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await ideaCard.click()
      await page.waitForTimeout(500)
      await snap('idea-detail-modal')

      // Click Move button
      const moveBtn = page.locator('button:has-text("Move")')
      if (await moveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await moveBtn.click()
        await page.waitForTimeout(300)
        await snap('move-menu-open')
      }
    }
  },
}

export default scenario
