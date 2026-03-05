import type { ScreenshotScenario } from './types'

const scenario: ScreenshotScenario = {
  key: 'activity-panel-tool-chips',
  description: 'Open Activity panel from Home and show tool filter chips',
  persona: 'full-setup',
  device: 'both',

  async run(page, snap) {
    await page.goto('/app')
    await page.waitForLoadState('networkidle')
    await snap('home-dashboard')

    // Click Activity button
    const activityBtn = page.locator('button:has-text("Activity")')
    if (await activityBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await activityBtn.click()
      await page.waitForTimeout(500)
      await snap('activity-panel-open')

      // Click "Selections" tool chip
      const selectionsChip = page.locator('button:has-text("Selections")').first()
      if (await selectionsChip.isVisible({ timeout: 3000 }).catch(() => false)) {
        await selectionsChip.click()
        await page.waitForTimeout(500)
        await snap('activity-filtered-selections')
      }
    }
  },
}

export default scenario
