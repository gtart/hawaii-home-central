/**
 * Improved screenshot capture helper with manifest support.
 *
 * Fixes from prior pipeline:
 *  1. Viewport screenshots by default (not fullPage) — avoids fixed-header glitches
 *  2. Stability guards — waits for explicit selector before capturing
 *  3. manifest.json with metadata per screenshot
 *  4. Route-sanitized filenames with step numbers
 *  5. Deterministic artifact folder
 */
import { Page, Locator } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ManifestEntry {
  filename: string
  route: string
  timestamp: string
  viewport: string
  userState: 'anon' | 'authed'
  stepLabel: string
  previousAction: string
  testName: string
}

export interface CaptureOpts {
  stepLabel: string
  previousAction: string
  userState: 'anon' | 'authed'
  testName: string
  /** Optional: screenshot a specific element instead of the viewport */
  element?: Locator
  /** Optional: wait for this selector to be visible before capturing (stability guard) */
  stabilityGuard?: string
  /** Optional: hide elements matching these selectors before capturing (e.g. fixed headers) */
  hideSelectors?: string[]
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const DATE_STAMP = new Date().toISOString().slice(0, 10).replace(/-/g, '')
const ARTIFACT_DIR = path.join('e2e', 'artifacts', `share-collab-${DATE_STAMP}`)

// Ensure artifact dir exists at import time
fs.mkdirSync(ARTIFACT_DIR, { recursive: true })

// Accumulated manifest entries across all tests in this run
const manifestEntries: ManifestEntry[] = []

// Per-test step counters (keyed by testName)
const stepCounters = new Map<string, number>()

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getArtifactDir(): string {
  return ARTIFACT_DIR
}

export function getAllEntries(): ManifestEntry[] {
  return manifestEntries
}

/**
 * Capture a viewport screenshot with full metadata tracking.
 *
 * Usage:
 *   await capture(page, {
 *     stepLabel: 'Mood Boards home loaded',
 *     previousAction: 'Navigate to /app/tools/mood-boards',
 *     userState: 'authed',
 *     testName: 'mb-pdf-all',
 *     stabilityGuard: '[data-testid="board-card"]',
 *   })
 */
export async function capture(page: Page, opts: CaptureOpts): Promise<string> {
  // Increment step counter for this test
  const count = (stepCounters.get(opts.testName) ?? 0) + 1
  stepCounters.set(opts.testName, count)

  // Stability guard: wait for selector to be visible
  if (opts.stabilityGuard) {
    await page.locator(opts.stabilityGuard).first().waitFor({
      state: 'visible',
      timeout: 15_000,
    })
  }

  // Let any animations/transitions settle
  await page.waitForTimeout(300)

  // Hide elements that cause glitches (fixed headers, overlays)
  if (opts.hideSelectors?.length) {
    for (const sel of opts.hideSelectors) {
      await page.locator(sel).evaluateAll((els) => {
        els.forEach((el) => ((el as HTMLElement).style.display = 'none'))
      }).catch(() => {}) // ignore if not found
    }
  }

  // Build filename: {testName}-{stepNum}-{sanitizedRoute}.png
  const route = safeUrl(page.url())
  const sanitizedRoute = route.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'root'
  const stepNum = String(count).padStart(2, '0')
  const filename = `${opts.testName}-${stepNum}-${sanitizedRoute}.png`
  const filepath = path.join(ARTIFACT_DIR, filename)

  // Take screenshot
  if (opts.element) {
    await opts.element.screenshot({ path: filepath })
  } else {
    // Viewport screenshot (NOT fullPage) — avoids fixed-header duplication
    await page.screenshot({ path: filepath, fullPage: false })
  }

  // Restore hidden elements
  if (opts.hideSelectors?.length) {
    for (const sel of opts.hideSelectors) {
      await page.locator(sel).evaluateAll((els) => {
        els.forEach((el) => ((el as HTMLElement).style.display = ''))
      }).catch(() => {})
    }
  }

  // Record manifest entry
  const viewport = page.viewportSize()
  const entry: ManifestEntry = {
    filename,
    route,
    timestamp: new Date().toISOString(),
    viewport: viewport ? `${viewport.width}x${viewport.height}` : 'unknown',
    userState: opts.userState,
    stepLabel: opts.stepLabel,
    previousAction: opts.previousAction,
    testName: opts.testName,
  }
  manifestEntries.push(entry)

  return filepath
}

/**
 * Write manifest.json + index.html to the artifact directory.
 * Call this once after all tests complete (e.g. in test.afterAll).
 */
export function writeManifest(): { manifestPath: string; indexPath: string } {
  const manifest = {
    generatedAt: new Date().toISOString(),
    build: 'production',
    artifactDir: ARTIFACT_DIR,
    totalScreenshots: manifestEntries.length,
    entries: manifestEntries,
  }

  const manifestPath = path.join(ARTIFACT_DIR, 'manifest.json')
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

  const indexPath = path.join(ARTIFACT_DIR, 'index.html')
  fs.writeFileSync(indexPath, generateIndexHtml(manifestEntries))

  return { manifestPath, indexPath }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeUrl(raw: string): string {
  try {
    return new URL(raw).pathname
  } catch {
    return raw
  }
}

function generateIndexHtml(entries: ManifestEntry[]): string {
  // Group by testName
  const groups = new Map<string, ManifestEntry[]>()
  for (const e of entries) {
    const list = groups.get(e.testName) ?? []
    list.push(e)
    groups.set(e.testName, list)
  }

  const sections = Array.from(groups.entries())
    .map(([testName, items]) => {
      const rows = items
        .map(
          (e) => `
      <tr>
        <td><a href="${e.filename}"><img src="${e.filename}" width="320" loading="lazy" /></a></td>
        <td>
          <strong>${escHtml(e.stepLabel)}</strong><br />
          <small>Route: <code>${escHtml(e.route)}</code></small><br />
          <small>Previous: ${escHtml(e.previousAction)}</small><br />
          <small>Viewport: ${e.viewport} &middot; ${e.userState} &middot; ${e.timestamp}</small>
        </td>
      </tr>`
        )
        .join('\n')

      return `
    <h2>${escHtml(testName)}</h2>
    <table border="0" cellpadding="8" cellspacing="0">
      ${rows}
    </table>`
    })
    .join('\n')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Share &amp; Collaboration E2E Screenshots</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 24px; background: #f5f5f5; }
    h1 { color: #333; }
    h2 { color: #555; margin-top: 32px; border-bottom: 2px solid #ddd; padding-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; }
    tr { border-bottom: 1px solid #e0e0e0; vertical-align: top; }
    td { padding: 12px 8px; }
    img { border: 1px solid #ddd; border-radius: 4px; }
    code { background: #e8e8e8; padding: 2px 4px; border-radius: 3px; font-size: 12px; }
    small { color: #888; }
  </style>
</head>
<body>
  <h1>Share &amp; Collaboration E2E Screenshots</h1>
  <p>Generated: ${new Date().toISOString()} &middot; ${entries.length} screenshots</p>
  ${sections}
</body>
</html>`
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
