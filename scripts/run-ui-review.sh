#!/usr/bin/env bash
set -euo pipefail

SCOPE="${1:-list}"
TARGET="${2:-both}"
RUN_ID="${UI_REVIEW_RUN_ID:-$(date +%Y%m%d-%H%M%S)}"
ARTIFACT_DIR="e2e/artifacts/ui-review-${RUN_ID}-${SCOPE}"

PROJECT_ARGS=()
case "$TARGET" in
  desktop)
    PROJECT_ARGS=(--project=authenticated)
    ;;
  mobile)
    PROJECT_ARGS=(--project=authenticated-mobile)
    ;;
  both)
    PROJECT_ARGS=(--project=authenticated --project=authenticated-mobile)
    ;;
  *)
    echo "Unknown target: $TARGET" >&2
    echo "Usage: scripts/run-ui-review.sh <scope> [desktop|mobile|both]" >&2
    exit 1
    ;;
esac

if [[ "$SCOPE" == "list" ]]; then
  echo "Available UI review scopes:"
  echo "  everything"
  echo "  homepage"
  echo "  plan-summary"
  echo "  selections"
  echo "  fix-list"
  echo "  mood-boards"
  echo "  contract-checklist"
  echo
  echo "Usage:"
  echo "  ./scripts/run-ui-review.sh <scope> [desktop|mobile|both]"
  echo "  PLAYWRIGHT_BASE_URL=\"https://www.hawaiihomecentral.com\" ./scripts/run-ui-review.sh everything both"
  exit 0
fi

if [[ -z "${PLAYWRIGHT_BASE_URL:-}" ]]; then
  NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
  NODE_MINOR="$(node -p 'process.versions.node.split(".")[1]')"
  if (( NODE_MAJOR < 20 )) || { (( NODE_MAJOR == 20 )) && (( NODE_MINOR < 9 )); }; then
    echo "Local UI review needs Node.js >= 20.9.0 because Next.js 16 will not start on Node $(node -v)." >&2
    echo "Either switch Node versions first, or run against an existing app URL with PLAYWRIGHT_BASE_URL." >&2
    exit 1
  fi
fi

UI_REVIEW_SCOPE="$SCOPE" UI_REVIEW_RUN_ID="$RUN_ID" npx playwright test e2e/app-ui-review.spec.ts "${PROJECT_ARGS[@]}"

# Merge per-device partial manifests into a single manifest.json + index.html.
# Each Playwright project writes manifest-desktop.json / manifest-mobile.json to avoid overwrites.
node -e "
const fs = require('fs');
const path = require('path');
const dir = '$ARTIFACT_DIR';
const partials = fs.readdirSync(dir).filter(f => /^manifest-(desktop|mobile)\.json$/.test(f));
if (partials.length === 0) { console.log('No partial manifests found.'); process.exit(0); }
const allEntries = [];
let scope = '', runId = '';
for (const p of partials) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, p), 'utf-8'));
  scope = data.scope; runId = data.runId;
  allEntries.push(...data.entries);
}
fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({
  generatedAt: new Date().toISOString(), scope, runId, artifactDir: dir,
  totalScreenshots: allEntries.length, entries: allEntries,
}, null, 2));
const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
const rows = allEntries.map(e => '<tr><td><a href=\"' + e.filename + '\"><img src=\"' + e.filename + '\" loading=\"lazy\" style=\"max-width:100%;height:auto;border:1px solid #333;border-radius:6px;\" /></a></td><td><strong>' + esc(e.stepLabel) + '</strong><br/><code>' + esc(e.route) + '</code><br/><small>' + e.device + ' · ' + e.viewport + ' · ' + e.scope + '</small></td></tr>').join('\n');
fs.writeFileSync(path.join(dir, 'index.html'), '<!DOCTYPE html><html><head><meta charset=\"utf-8\" /><title>HHC UI Review</title><style>body{font-family:system-ui,sans-serif;max-width:1400px;margin:0 auto;padding:24px;background:#1a1a1a;color:#e0e0e0}h1{color:#fff}table{width:100%;border-collapse:collapse}tr{border-bottom:1px solid #333;vertical-align:top}td{padding:16px 8px}td:first-child{width:60%}code{background:#333;padding:2px 6px;border-radius:3px;font-size:12px;color:#8cf}small{color:#888}</style></head><body><h1>HHC UI Review</h1><p>Scope: ' + esc(scope) + ' · Run: ' + esc(runId) + ' · ' + allEntries.length + ' screenshots</p><table>' + rows + '</table></body></html>');
console.log('Merged ' + partials.length + ' partial(s) into manifest.json + index.html (' + allEntries.length + ' screenshots)');
"

ZIP_PATH="$(python3 scripts/build-ui-review-zip.py "$ARTIFACT_DIR")"

echo
echo "UI review scope: $SCOPE"
echo "Artifacts: $ARTIFACT_DIR"
echo "Zip: $ZIP_PATH"
echo "Write findings to: docs/ai/ui-reviews/findings/$(date +%F)-${SCOPE}-codex.md"
echo
