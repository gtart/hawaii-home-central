import { test, expect, type Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

type ReviewScope =
  | 'everything'
  | 'homepage'
  | 'plan-summary'
  | 'selections'
  | 'fix-list'
  | 'mood-boards'
  | 'contract-checklist'
  | 'list'

interface ManifestEntry {
  filename: string
  route: string
  viewport: string
  device: 'desktop' | 'mobile'
  scope: string
  stepLabel: string
}

interface FlowContext {
  page: Page
  device: 'desktop' | 'mobile'
  snap: (slug: string, stepLabel: string, fullPage?: boolean) => Promise<void>
}

const SCOPE = ((process.env.UI_REVIEW_SCOPE || 'list').trim() || 'list') as ReviewScope
const RUN_ID = (process.env.UI_REVIEW_RUN_ID || new Date().toISOString().replace(/[:.]/g, '-')).replace(/[^a-zA-Z0-9_-]/g, '-')
const ARTIFACT_DIR = path.join('e2e', 'artifacts', `ui-review-${RUN_ID}-${SCOPE}`)

const manifestEntries: ManifestEntry[] = []

fs.mkdirSync(ARTIFACT_DIR, { recursive: true })

async function snapFactory(page: Page, device: 'desktop' | 'mobile', scope: string) {
  return async (slug: string, stepLabel: string, fullPage = false) => {
    await page.waitForTimeout(500)
    const filename = `${device}-${scope}-${slug}.png`
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, filename),
      fullPage,
      timeout: 20000,
    })
    const viewport = page.viewportSize()
    manifestEntries.push({
      filename,
      route: (() => {
        try {
          return new URL(page.url()).pathname
        } catch {
          return page.url()
        }
      })(),
      viewport: viewport ? `${viewport.width}x${viewport.height}` : 'unknown',
      device,
      scope,
      stepLabel,
    })
  }
}

async function openFirstVisibleLink(page: Page, selector: string): Promise<boolean> {
  const links = page.locator(selector)
  const count = await links.count()
  for (let i = 0; i < count; i++) {
    const link = links.nth(i)
    if (await link.isVisible().catch(() => false)) {
      await link.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1200)
      return true
    }
  }
  return false
}

async function reviewHomepage({ page, snap }: FlowContext) {
  await page.goto('/app', { waitUntil: 'networkidle' })
  await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 })
  await snap('01-home-top', 'Homepage top')
  await page.evaluate(() => window.scrollTo(0, 700))
  await snap('02-home-mid', 'Homepage mid-scroll')
}

async function reviewPlanSummary({ page, snap }: FlowContext) {
  await page.goto('/app/tools/project-summary', { waitUntil: 'networkidle' })
  await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 })
  await snap('01-plan-list', 'Plan & Changes landing')

  const openedCollection = await openFirstVisibleLink(page, 'a[href*="/app/tools/project-summary/"]')
  if (!openedCollection) return

  await snap('02-plan-collection-top', 'Plan & Changes collection top')
  await page.evaluate(() => window.scrollTo(0, 900))
  await snap('03-plan-collection-mid', 'Plan & Changes collection mid-scroll')

  const changeLinkOpened = await openFirstVisibleLink(page, 'a[href*="/change/"]')
  if (changeLinkOpened) {
    await snap('04-plan-change-detail-top', 'Plan & Changes change detail top')
  }
}

async function reviewSelections({ page, snap }: FlowContext) {
  await page.goto('/app/tools/finish-decisions', { waitUntil: 'networkidle' })
  await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 })
  await snap('01-selections-list-top', 'Selections list top')
  await page.evaluate(() => window.scrollTo(0, 700))
  await snap('02-selections-list-mid', 'Selections list mid-scroll')

  const decisionOpened = await openFirstVisibleLink(page, 'a[href*="/decision/"]')
  if (!decisionOpened) return

  await snap('03-selection-detail-top', 'Selection detail top')
  await page.evaluate(() => window.scrollTo(0, 700))
  await snap('04-selection-detail-mid', 'Selection detail mid-scroll')

  const optionOpened = await openFirstVisibleLink(page, '[data-testid="idea-card"], a[href*="/option/"]')
  if (optionOpened) {
    await snap('05-option-detail-top', 'Option detail top')
    await page.evaluate(() => window.scrollTo(0, 700))
    await snap('06-option-detail-mid', 'Option detail mid-scroll')
  }
}

async function reviewFixList({ page, snap }: FlowContext) {
  await page.goto('/app/tools/punchlist', { waitUntil: 'networkidle' })
  await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 })
  await snap('01-fix-list-top', 'Fix List top')
  await page.evaluate(() => window.scrollTo(0, 700))
  await snap('02-fix-list-mid', 'Fix List mid-scroll')
}

async function reviewMoodBoards({ page, snap }: FlowContext) {
  await page.goto('/app/tools/mood-boards', { waitUntil: 'networkidle' })
  await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 })
  await snap('01-mood-boards-top', 'Mood Boards top')
  await page.evaluate(() => window.scrollTo(0, 700))
  await snap('02-mood-boards-mid', 'Mood Boards mid-scroll')
}

async function reviewContractChecklist({ page, snap }: FlowContext) {
  await page.goto('/app/tools/before-you-sign', { waitUntil: 'networkidle' })
  await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 })
  await snap('01-contract-checklist-top', 'Contract Checklist top')
  await page.evaluate(() => window.scrollTo(0, 700))
  await snap('02-contract-checklist-mid', 'Contract Checklist mid-scroll')
}

const FLOWS: Record<Exclude<ReviewScope, 'list' | 'everything'>, (ctx: FlowContext) => Promise<void>> = {
  homepage: reviewHomepage,
  'plan-summary': reviewPlanSummary,
  selections: reviewSelections,
  'fix-list': reviewFixList,
  'mood-boards': reviewMoodBoards,
  'contract-checklist': reviewContractChecklist,
}

function scopesToRun(): Array<Exclude<ReviewScope, 'list'>> {
  if (SCOPE === 'everything') {
    return ['homepage', 'plan-summary', 'selections', 'fix-list', 'mood-boards', 'contract-checklist']
  }
  if (SCOPE === 'list') return []
  return [SCOPE]
}

if (SCOPE === 'list') {
  test('list ui review scopes', async () => {
    console.log('\nAvailable UI review scopes:')
    console.log('  everything')
    console.log('  homepage')
    console.log('  plan-summary')
    console.log('  selections')
    console.log('  fix-list')
    console.log('  mood-boards')
    console.log('  contract-checklist')
    console.log('\nRun with: UI_REVIEW_SCOPE=<scope> npx playwright test e2e/app-ui-review.spec.ts --project=authenticated --project=authenticated-mobile\n')
  })
} else {
  const scopes = scopesToRun()
  for (const scope of scopes) {
    test(`ui review: ${scope}`, async ({ page }, testInfo) => {
      const device: 'desktop' | 'mobile' = testInfo.project.name.includes('mobile') || testInfo.project.name.includes('android')
        ? 'mobile'
        : 'desktop'
      const snap = await snapFactory(page, device, scope)
      await FLOWS[scope]({ page, device, snap })
    })
  }

  test.afterAll(() => {
    if (manifestEntries.length === 0) return

    // Write a per-device partial manifest so dual-device runs don't overwrite each other.
    // The shell wrapper merges all partials into manifest.json + index.html after Playwright exits.
    const device = manifestEntries[0].device
    const partialPath = path.join(ARTIFACT_DIR, `manifest-${device}.json`)
    fs.writeFileSync(partialPath, JSON.stringify({
      generatedAt: new Date().toISOString(),
      scope: SCOPE,
      runId: RUN_ID,
      device,
      entries: manifestEntries,
    }, null, 2))

    console.log(`\nUI review partial written: ${partialPath} (${manifestEntries.length} screenshots)`)
  })
}

function escHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
