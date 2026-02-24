import type { TestInfo } from '@playwright/test'
import path from 'path'

/**
 * Maps a Playwright project name to a screenshot subdirectory.
 *   - contains 'android' -> 'android'
 *   - contains 'mobile'  -> 'mobile'
 *   - everything else     -> 'desktop'
 */
function getDeviceFolder(projectName: string): string {
  if (projectName.includes('android')) return 'android'
  if (projectName.includes('mobile')) return 'mobile'
  return 'desktop'
}

/**
 * Build the full screenshot path with device-specific subdirectory.
 *
 * Usage:
 *   test('my test', async ({ page }, testInfo) => {
 *     await page.screenshot({ path: screenshotPath('home', testInfo) })
 *   })
 *
 * Produces: e2e/screenshots/desktop/home.png (or mobile/, android/)
 */
export function screenshotPath(name: string, testInfo: TestInfo): string {
  const deviceFolder = getDeviceFolder(testInfo.project.name)
  return path.join('e2e', 'screenshots', deviceFolder, `${name}.png`)
}
