/**
 * On-demand screenshot runner.
 *
 * Usage:
 *   # Run a specific scenario (desktop + mobile):
 *   SCENARIO=punchlist-after-quick-add npx playwright test e2e/app-screenshot.spec.ts
 *
 *   # Run ALL scenarios:
 *   SCENARIO=all npx playwright test e2e/app-screenshot.spec.ts
 *
 *   # List available scenarios:
 *   SCENARIO=list npx playwright test e2e/app-screenshot.spec.ts
 *
 * Screenshots land in: e2e/artifacts/screenshots-{date}/
 * An index.html is generated for easy browsing.
 */
import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { ALL_SCENARIOS, findScenario } from './scenarios'
import { capture, writeManifest, getArtifactDir } from './helpers/capture'

const requestedKey = process.env.SCENARIO || ''

// Override artifact dir for screenshot scenarios
const DATE_STAMP = new Date().toISOString().slice(0, 10).replace(/-/g, '')
const SCREENSHOT_DIR = path.join('e2e', 'artifacts', `screenshots-${DATE_STAMP}`)
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

function scenariosToRun() {
  if (requestedKey === 'all') return ALL_SCENARIOS
  if (requestedKey === 'list' || !requestedKey) return []
  // Support comma-separated keys
  const keys = requestedKey.split(',').map((k) => k.trim())
  return keys.map((k) => {
    const s = findScenario(k)
    if (!s) throw new Error(`Unknown scenario: "${k}". Available: ${ALL_SCENARIOS.map((s) => s.key).join(', ')}`)
    return s
  })
}

const scenarios = scenariosToRun()

if (scenarios.length === 0) {
  test('list available scenarios', async () => {
    const list = ALL_SCENARIOS.map((s) => `  ${s.key} — ${s.description}`).join('\n')
    console.log(`\nAvailable scenarios:\n${list}\n`)
    console.log('Usage: SCENARIO=<key> npx playwright test e2e/app-screenshot.spec.ts')
    console.log('       SCENARIO=all npx playwright test e2e/app-screenshot.spec.ts')
    console.log('       SCENARIO=key1,key2 npx playwright test e2e/app-screenshot.spec.ts\n')
  })
} else {
  for (const scenario of scenarios) {
    test(`screenshot: ${scenario.key}`, async ({ page }, testInfo) => {
      const device = testInfo.project.name.includes('mobile') ? 'mobile'
        : testInfo.project.name.includes('android') ? 'mobile'
        : 'desktop'

      // Skip if scenario specifies a specific device
      if (scenario.device === 'desktop' && device !== 'desktop') {
        test.skip()
        return
      }
      if (scenario.device === 'mobile' && device !== 'mobile') {
        test.skip()
        return
      }

      let stepNum = 0

      const snap = async (label: string): Promise<string> => {
        stepNum++
        const stepStr = String(stepNum).padStart(2, '0')
        const filename = `${scenario.key}-${device}-${stepStr}-${label}.png`
        const filepath = path.join(SCREENSHOT_DIR, filename)

        await page.waitForTimeout(300) // let animations settle
        await page.screenshot({ path: filepath, fullPage: false })

        // Also use the manifest-tracked capture
        await capture(page, {
          stepLabel: label,
          previousAction: `Step ${stepNum} of scenario "${scenario.key}"`,
          userState: 'authed',
          testName: `${scenario.key}-${device}`,
        })

        return filepath
      }

      await scenario.run(page, snap)
    })
  }

  test.afterAll(() => {
    const { indexPath } = writeManifest()
    console.log(`\nScreenshots saved to: ${SCREENSHOT_DIR}/`)
    console.log(`Manifest + gallery: ${indexPath}\n`)
  })
}
