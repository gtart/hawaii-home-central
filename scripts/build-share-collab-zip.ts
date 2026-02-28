/**
 * Build the share-collaboration e2e artifact zip.
 *
 * Scans e2e/artifacts/share-collab-* for screenshots,
 * generates manifest.json + index.html, and zips everything.
 */
import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

// Find the artifact directory
const artifactsRoot = path.join('e2e', 'artifacts')
const dirs = fs.readdirSync(artifactsRoot)
  .filter(d => d.startsWith('share-collab-'))
  .sort()

if (dirs.length === 0) {
  console.error('No share-collab artifact directories found')
  process.exit(1)
}

// Merge all screenshots into the first directory
const targetDir = path.join(artifactsRoot, dirs[0])
for (const dir of dirs.slice(1)) {
  const srcDir = path.join(artifactsRoot, dir)
  for (const file of fs.readdirSync(srcDir)) {
    if (file.endsWith('.png')) {
      const src = path.join(srcDir, file)
      const dst = path.join(targetDir, file)
      if (!fs.existsSync(dst)) {
        fs.copyFileSync(src, dst)
      }
    }
  }
}

// Scan all screenshots
const screenshots = fs.readdirSync(targetDir)
  .filter(f => f.endsWith('.png'))
  .sort()

console.log(`Found ${screenshots.length} screenshots in ${targetDir}`)

// Build manifest entries from filenames
interface ManifestEntry {
  filename: string
  testName: string
  stepNumber: string
  route: string
  userState: string
  stepLabel: string
  previousAction: string
}

// Parse test name groups for labels
const testLabels: Record<string, { label: string; tool: string }> = {
  'mb-pdf-all': { label: 'Mood Boards — PDF Export (All Boards)', tool: 'Mood Boards' },
  'mb-pdf-selected': { label: 'Mood Boards — PDF Export (Selected Boards)', tool: 'Mood Boards' },
  'mb-public-link': { label: 'Mood Boards — Create & Visit Public Link', tool: 'Mood Boards' },
  'mb-public-scoped': { label: 'Mood Boards — Scoped Public Link', tool: 'Mood Boards' },
  'mb-public-revoke': { label: 'Mood Boards — Revoke Public Link', tool: 'Mood Boards' },
  'mb-collab-view': { label: 'Mood Boards — Collaborator VIEW', tool: 'Mood Boards' },
  'dt-pdf-all': { label: 'Decision Tracker — PDF Export (All Rooms)', tool: 'Decision Tracker' },
  'dt-pdf-selected': { label: 'Decision Tracker — PDF Export (Selected)', tool: 'Decision Tracker' },
  'dt-public-link': { label: 'Decision Tracker — Create & Visit Public Link', tool: 'Decision Tracker' },
  'dt-public-scoped': { label: 'Decision Tracker — Scoped Public Link', tool: 'Decision Tracker' },
  'dt-public-revoke': { label: 'Decision Tracker — Revoke Public Link', tool: 'Decision Tracker' },
  'dt-collab-edit': { label: 'Decision Tracker — Collaborator EDIT', tool: 'Decision Tracker' },
  'risky-share': { label: 'Risky Share Confirmation', tool: 'Cross-cutting' },
  'view-collab-no-public': { label: 'VIEW Collaborator — No Public Links Tab', tool: 'Cross-cutting' },
  'invalid-token': { label: 'Invalid Token — Error Page', tool: 'Cross-cutting' },
}

const stepDescriptions: Record<string, string[]> = {
  'mb-pdf-all': ['Mood Boards home — boards loaded', 'Share & Export modal — Export tab', 'PDF report — all boards rendered'],
  'mb-pdf-selected': ['Export tab — Kitchen Inspiration selected', 'PDF report — Kitchen only'],
  'mb-public-link': ['Public Links tab', 'Link created — card visible', 'Public mood board — anonymous view'],
  'mb-public-scoped': ['Scoped link created', 'Public page — single board'],
  'mb-public-revoke': ['Active link — before revoke', 'After revoke — link removed'],
  'mb-collab-view': ['Mood Boards as VIEW collaborator'],
  'dt-pdf-all': ['Decision Tracker home — rooms loaded', 'Share & Export modal — Export tab', 'PDF report — all rooms'],
  'dt-pdf-selected': ['Export tab — Kitchen room selected', 'PDF report — Kitchen only'],
  'dt-public-link': ['Public Links tab', 'Link created', 'Public Decision Tracker — anonymous'],
  'dt-public-scoped': ['Scoped link created — Kitchen only', 'Public page — Kitchen room'],
  'dt-public-revoke': ['Active link — before revoke', 'After revoke'],
  'dt-collab-edit': ['Decision Tracker as EDIT collaborator'],
  'risky-share': ['Risky warning — type SHARE'],
  'view-collab-no-public': ['VIEW collaborator — Export tab only'],
  'invalid-token': ['Invalid token — error page shown'],
}

const entries: ManifestEntry[] = screenshots.map(filename => {
  // Parse: {testName}-{stepNum}-{route}.png
  const match = filename.match(/^(.+?)-(\d{2})-(.+)\.png$/)
  if (!match) return { filename, testName: 'unknown', stepNumber: '00', route: '?', userState: 'unknown', stepLabel: filename, previousAction: '' }

  const [, testName, stepNum, routePart] = match
  const route = '/' + routePart.replace(/-/g, '/')
  const isAnon = route.includes('/share/')
  const stepIdx = parseInt(stepNum, 10) - 1
  const descriptions = stepDescriptions[testName] || []
  const stepLabel = descriptions[stepIdx] || `Step ${stepNum}`

  return {
    filename,
    testName,
    stepNumber: stepNum,
    route,
    userState: isAnon ? 'anon' : 'authed',
    stepLabel,
    previousAction: stepIdx === 0 ? 'Navigate to page' : descriptions[stepIdx - 1] || 'Previous step',
  }
})

// Write manifest.json
const manifest = {
  generatedAt: new Date().toISOString(),
  artifactDir: targetDir,
  totalScreenshots: entries.length,
  passingTests: ['mb-pdf-all', 'mb-pdf-selected', 'mb-public-link', 'mb-public-scoped', 'dt-pdf-all', 'dt-public-link', 'invalid-token'],
  entries,
}

const manifestPath = path.join(targetDir, 'manifest.json')
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
console.log(`Wrote ${manifestPath}`)

// Write index.html
const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const groups = new Map<string, ManifestEntry[]>()
for (const e of entries) {
  const list = groups.get(e.testName) ?? []
  list.push(e)
  groups.set(e.testName, list)
}

const sections = Array.from(groups.entries()).map(([testName, items]) => {
  const info = testLabels[testName] || { label: testName, tool: 'Unknown' }
  const passed = manifest.passingTests.includes(testName)
  const statusBadge = passed
    ? '<span style="background:#22c55e;color:white;padding:2px 8px;border-radius:4px;font-size:11px;">PASS</span>'
    : '<span style="background:#666;color:white;padding:2px 8px;border-radius:4px;font-size:11px;">PARTIAL</span>'

  const rows = items.map(e => `
    <tr>
      <td><a href="${e.filename}"><img src="${e.filename}" width="400" loading="lazy" /></a></td>
      <td>
        <strong>${escHtml(e.stepLabel)}</strong><br />
        <small>Route: <code>${escHtml(e.route)}</code></small><br />
        <small>Previous: ${escHtml(e.previousAction)}</small><br />
        <small>User: ${e.userState}</small>
      </td>
    </tr>`).join('\n')

  return `
    <h2>${statusBadge} ${escHtml(info.label)}</h2>
    <p style="color:#888;font-size:12px;">Tool: ${escHtml(info.tool)} &middot; Test: ${escHtml(testName)}</p>
    <table border="0" cellpadding="8" cellspacing="0" style="width:100%;">
      ${rows}
    </table>`
}).join('\n')

const indexHtml = `<!DOCTYPE html>
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
    .summary { background: white; padding: 16px 24px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #ddd; }
    .summary h3 { margin: 0 0 8px 0; color: #333; }
  </style>
</head>
<body>
  <h1>Share &amp; Collaboration E2E Screenshots</h1>
  <div class="summary">
    <h3>Test Results</h3>
    <p>${manifest.passingTests.length} of 15 tests passed &middot; ${entries.length} screenshots captured &middot; Generated ${new Date().toISOString().slice(0,10)}</p>
    <p><strong>Passing:</strong> MB PDF All, MB PDF Selected, MB Public Link, MB Public Scoped, DT PDF All, DT Public Link, Invalid Token</p>
    <p><strong>Needs fix:</strong> Revoke tests (stale links), Collaborator tests (email modal), DT scope chips (emoji prefix), Risky share</p>
  </div>
  ${sections}
</body>
</html>`

const indexPath = path.join(targetDir, 'index.html')
fs.writeFileSync(indexPath, indexHtml)
console.log(`Wrote ${indexPath}`)

// Create tar.gz (zip not available on this system)
const archiveName = `share-collab-e2e-${dirs[0].replace('share-collab-', '')}.tar.gz`
const archivePath = path.join(artifactsRoot, archiveName)
execSync(`tar -czf "${path.resolve(archivePath)}" -C "${path.dirname(targetDir)}" "${path.basename(targetDir)}"`)
console.log(`\nArchive created: ${archivePath}`)
console.log(`  ${entries.length} screenshots + manifest.json + index.html`)

const stats = fs.statSync(archivePath)
console.log(`  Size: ${(stats.size / 1024 / 1024).toFixed(1)} MB`)
