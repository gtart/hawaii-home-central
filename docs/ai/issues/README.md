# Issue Tracking

Issues are tracked by priority level in this directory.

## Files
- `P0.md` -- Broken: users cannot complete a core task
- `P1.md` -- Degraded: feature works but poorly
- `P2.md` -- Cosmetic: visual glitches, awkward flows, missing polish

P3 items (minor polish) are tracked inline in sprint docs.

## Issue Format

```
### ID: TOOL-NNN
**Summary:** one-line description
**Platform:** desktop / mobile / both
**Tool:** which tool is affected (or "cross-tool" / "infrastructure")
**Priority:** P0 / P1 / P2
**Status:** open / investigating / fix-in-progress / resolved

**Steps to reproduce:**
1. ...
2. ...

**Expected:** what should happen
**Actual:** what happens instead

**Root cause:** (fill in after investigation)
**Files involved:** (list affected files)
**Resolution:** (commit hash + date when resolved)
```

## ID Prefixes
- `PS-` Project Summary / Plan & Changes
- `SEL-` Selections
- `FL-` Fix List
- `MB-` Mood Boards
- `CC-` Contract Checklist
- `NAV-` Navigation / sidebar
- `ACT-` Activity feed
- `AUTH-` Authentication
- `SHARE-` Sharing / public views
- `INFRA-` Infrastructure / build / deploy
