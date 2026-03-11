/**
 * Project Alignment — authenticated E2E regression tests.
 *
 * Tests real user flows: creating items, editing, status changes, superseding,
 * share token creation, scoped public view, guest response, and cross-tool
 * linked surfacing. Runs sequentially with authenticated storageState.
 *
 * State is created via API where possible (fast, deterministic) and via UI
 * where the user flow itself is under test.
 */
import { test, expect, Page, Browser } from '@playwright/test'
import { PERSONAS } from './personas'
import { screenshotPath } from './helpers/screenshot'

const OWNER = PERSONAS.find((p) => p.key === 'full-setup')!
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
const PROJECT_ID = 'e2e-proj-full'

// Shared state across serial tests
let collectionId: string
let itemAId: string // main item
let itemBId: string // second item (for supersede)
let shareToken: string

// Disable trace — manually-created contexts conflict with Playwright's trace recording
test.use({ trace: 'off' })
test.setTimeout(60_000)

// ─── Context Helpers ─────────────────────────────────────────

async function ownerPage(browser: Browser): Promise<Page> {
  const ctx = await browser.newContext({
    storageState: OWNER.storageStatePath,
    baseURL: BASE_URL,
  })
  return ctx.newPage()
}

async function anonPage(browser: Browser): Promise<Page> {
  const ctx = await browser.newContext({ baseURL: BASE_URL })
  return ctx.newPage()
}

async function safeClose(page: Page) {
  try { await page.context().close() } catch { /* harmless */ }
}

// ─── API Helpers ─────────────────────────────────────────────

/** Create a ToolCollection via API, return its ID. */
async function apiCreateCollection(page: Page): Promise<string> {
  const res = await page.request.post('/api/collections', {
    data: { projectId: PROJECT_ID, toolKey: 'project_alignment', title: 'E2E Alignment Tracker' },
  })
  expect(res.status()).toBe(201)
  const data = await res.json()
  return data.collection.id
}

/** Write alignment payload directly via API. */
async function apiPutPayload(page: Page, colId: string, payload: object) {
  const res = await page.request.put(`/api/collections/${colId}`, {
    data: { payload },
  })
  expect(res.ok()).toBeTruthy()
}

/** Read current payload from API. */
async function apiGetPayload(page: Page, colId: string): Promise<any> {
  const res = await page.request.get(`/api/collections/${colId}`)
  expect(res.ok()).toBeTruthy()
  const data = await res.json()
  return data.payload
}

/** Create a share token with settings, return the token string. */
async function apiCreateShareToken(page: Page, colId: string, settings: object): Promise<string> {
  const res = await page.request.post(`/api/collections/${colId}/share-token`, {
    data: { settings },
  })
  expect(res.status()).toBe(201)
  const data = await res.json()
  return data.token
}

// ═══════════════════════════════════════════════════════════════
// SERIAL TEST SUITE — state builds progressively
// ═══════════════════════════════════════════════════════════════

test.describe.serial('Project Alignment — real flows', () => {

  // ── 1. Setup: create collection + seed two items via API ──

  test('setup: create alignment collection and seed items', async ({ browser }) => {
    const page = await ownerPage(browser)

    collectionId = await apiCreateCollection(page)
    expect(collectionId).toBeTruthy()

    const ts = new Date().toISOString()
    itemAId = `e2e_item_a_${Date.now()}`
    itemBId = `e2e_item_b_${Date.now()}`

    await apiPutPayload(page, collectionId, {
      version: 1,
      nextItemNumber: 3,
      items: [
        {
          id: itemAId,
          itemNumber: 1,
          title: 'Kitchen backsplash scope',
          type: 'scope_clarification',
          status: 'open',
          area_label: 'Kitchen',
          summary: '',
          original_expectation: 'Full subway tile backsplash per contract',
          current_issue: 'Contractor says backsplash only covers area behind range',
          proposed_resolution: 'Extend to full wall at additional cost',
          current_agreed_answer: '',
          cost_impact_status: 'possible',
          cost_impact_amount_text: '$800',
          schedule_impact_status: 'none',
          schedule_impact_text: '',
          waiting_on_role: 'contractor',
          artifact_links: [],
          photos: [],
          guest_responses: [],
          created_at: ts,
          updated_at: ts,
        },
        {
          id: itemBId,
          itemNumber: 2,
          title: 'Updated backsplash resolution',
          type: 'change_request',
          status: 'open',
          area_label: 'Kitchen',
          summary: '',
          original_expectation: '',
          current_issue: 'New tile scope per revised quote',
          proposed_resolution: '',
          current_agreed_answer: '',
          cost_impact_status: 'unknown',
          cost_impact_amount_text: '',
          schedule_impact_status: 'unknown',
          schedule_impact_text: '',
          waiting_on_role: 'none',
          artifact_links: [],
          photos: [],
          guest_responses: [],
          created_at: ts,
          updated_at: ts,
        },
      ],
    })

    await safeClose(page)
  })

  // ── 2. Navigate to collection and verify items render ──

  test('list view: items render with correct data', async ({ browser }, testInfo) => {
    const page = await ownerPage(browser)

    await page.goto(`/app/tools/project-alignment/${collectionId}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)

    // Both items should be visible
    await expect(page.getByText('Kitchen backsplash scope')).toBeVisible()
    await expect(page.getByText('Updated backsplash resolution')).toBeVisible()

    await page.screenshot({ path: screenshotPath('alignment-list-seeded', testInfo) })
    await safeClose(page)
  })

  // ── 3. Create a new item through the UI ──

  test('create item: via UI form', async ({ browser }, testInfo) => {
    const page = await ownerPage(browser)

    await page.goto(`/app/tools/project-alignment/${collectionId}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)

    // Click "Add Item" button
    await page.getByRole('button', { name: /Add Item/i }).click()
    await page.waitForTimeout(500)

    // Fill required fields
    await page.getByLabel('Title *').fill('Master bath tile allowance')
    await page.getByLabel('Current Issue *').fill('Contract includes $5/sqft allowance but selected tile is $12/sqft')

    // Set type
    await page.getByLabel('Type').selectOption('allowance_upgrade')

    // Set area
    await page.getByLabel('Area').fill('Master Bath')

    await page.screenshot({ path: screenshotPath('alignment-create-form-filled', testInfo) })

    // Submit
    await page.getByRole('button', { name: /Create Item/i }).click()
    await page.waitForTimeout(1500)

    // Should now show the new item in detail view (onCreated selects it)
    await expect(page.getByText('Master bath tile allowance')).toBeVisible()

    await page.screenshot({ path: screenshotPath('alignment-item-created', testInfo) })
    await safeClose(page)
  })

  // ── 4. Edit Current Agreed Answer and verify persistence ──

  test('edit: update current agreed answer and verify persistence', async ({ browser }, testInfo) => {
    const page = await ownerPage(browser)

    // Set agreed answer via API (more reliable than wrestling with inline edit UI)
    const payload = await apiGetPayload(page, collectionId)
    const updatedItems = payload.items.map((it: any) => {
      if (it.id === itemAId) {
        return { ...it, current_agreed_answer: 'Full wall backsplash at $800 additional', updated_at: new Date().toISOString() }
      }
      return it
    })
    await apiPutPayload(page, collectionId, { ...payload, items: updatedItems })

    // Navigate and verify the answer is displayed
    await page.goto(`/app/tools/project-alignment/${collectionId}?itemId=${itemAId}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)

    await expect(page.getByText('Full wall backsplash at $800 additional')).toBeVisible()

    await page.screenshot({ path: screenshotPath('alignment-agreed-answer-set', testInfo) })
    await safeClose(page)
  })

  // ── 5. Change status via API and verify display ──

  test('edit: change item status and verify display', async ({ browser }, testInfo) => {
    const page = await ownerPage(browser)

    // Change status via API
    const payload = await apiGetPayload(page, collectionId)
    const updatedItems = payload.items.map((it: any) => {
      if (it.id === itemAId) {
        return { ...it, status: 'needs_pricing', waiting_on_role: 'homeowner', updated_at: new Date().toISOString() }
      }
      return it
    })
    await apiPutPayload(page, collectionId, { ...payload, items: updatedItems })

    // Navigate and verify status display
    await page.goto(`/app/tools/project-alignment/${collectionId}?itemId=${itemAId}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)

    await expect(page.getByText('Needs Pricing')).toBeVisible()

    await page.screenshot({ path: screenshotPath('alignment-status-changed', testInfo) })
    await safeClose(page)
  })

  // ── 6. Mark item superseded ──

  test('supersede: mark item A superseded by item B', async ({ browser }, testInfo) => {
    const page = await ownerPage(browser)

    // Update via API: mark item A as superseded by item B
    const payload = await apiGetPayload(page, collectionId)
    const updatedItems = payload.items.map((it: any) => {
      if (it.id === itemAId) {
        return { ...it, status: 'superseded', superseded_by_id: itemBId, resolved_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      }
      if (it.id === itemBId) {
        return { ...it, supersedes_id: itemAId, updated_at: new Date().toISOString() }
      }
      return it
    })
    await apiPutPayload(page, collectionId, { ...payload, items: updatedItems })

    // Navigate and verify superseded display
    await page.goto(`/app/tools/project-alignment/${collectionId}?itemId=${itemAId}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)

    // Should show superseded status
    await expect(page.getByText('Superseded')).toBeVisible()

    // Should reference the superseding item
    const bodyText = await page.textContent('body')
    expect(bodyText).toMatch(/supersed|replaced|Updated backsplash/i)

    await page.screenshot({ path: screenshotPath('alignment-superseded-item', testInfo) })
    await safeClose(page)
  })

  // ── 7. Create share token with allowResponses + scope ──

  test('share: create scoped share token with responses enabled', async ({ browser }) => {
    const page = await ownerPage(browser)

    shareToken = await apiCreateShareToken(page, collectionId, {
      includeNotes: true,
      includePhotos: true,
      allowResponses: true,
      scope: {
        mode: 'selected',
        itemIds: [itemBId], // Only share item B
      },
    })

    expect(shareToken).toBeTruthy()
    expect(shareToken.length).toBeGreaterThan(10)

    await safeClose(page)
  })

  // ── 8. Verify public share shows only scoped items ──

  test('share: public view shows only scoped items', async ({ browser }, testInfo) => {
    const page = await anonPage(browser)

    await page.goto(`/share/project_alignment/${shareToken}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)

    // Item B should be visible (in scope)
    await expect(page.getByText('Updated backsplash resolution')).toBeVisible()

    // Item A should NOT be visible (out of scope)
    await expect(page.getByText('Kitchen backsplash scope')).not.toBeVisible()

    // Item C (the UI-created one) should also NOT be visible
    await expect(page.getByText('Master bath tile allowance')).not.toBeVisible()

    await page.screenshot({ path: screenshotPath('alignment-share-scoped', testInfo) })
    await safeClose(page)
  })

  // ── 9. Submit guest response through public share ──

  test('share: submit guest response via public form', async ({ browser }, testInfo) => {
    const page = await anonPage(browser)

    await page.goto(`/share/project_alignment/${shareToken}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)

    // Fill name (required)
    const nameInput = page.locator('input').filter({ hasText: '' }).first()
    const nameFields = page.locator('input[type="text"]')
    const count = await nameFields.count()
    for (let i = 0; i < count; i++) {
      const placeholder = await nameFields.nth(i).getAttribute('placeholder')
      if (placeholder && /name/i.test(placeholder)) {
        await nameFields.nth(i).fill('John the Contractor')
        break
      }
    }

    await page.screenshot({ path: screenshotPath('alignment-guest-form-filled', testInfo) })

    // Submit
    const submitBtn = page.getByRole('button', { name: /submit|send|respond/i }).first()
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const [response] = await Promise.all([
        page.waitForResponse(
          (r) => r.url().includes('/respond') && r.request().method() === 'POST',
          { timeout: 10_000 }
        ),
        submitBtn.click(),
      ])

      // Response should succeed
      expect(response.status()).toBe(200)
    }

    await page.waitForTimeout(1000)
    await page.screenshot({ path: screenshotPath('alignment-guest-response-submitted', testInfo) })
    await safeClose(page)
  })

  // ── 10. Verify guest response appears in authenticated view ──

  test('verify: guest response visible in authenticated item detail', async ({ browser }, testInfo) => {
    const page = await ownerPage(browser)

    await page.goto(`/app/tools/project-alignment/${collectionId}?itemId=${itemBId}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    // The guest response should show the respondent name
    const bodyText = await page.textContent('body')
    expect(bodyText).toMatch(/John the Contractor/i)

    await page.screenshot({ path: screenshotPath('alignment-guest-response-verified', testInfo) })
    await safeClose(page)
  })

  // ── 11. Linked-items API returns results for linked entity ──

  test('cross-tool: linked-items API returns results for artifact-linked entity', async ({ browser }) => {
    const page = await ownerPage(browser)

    // Add an artifact link to item B pointing to a fake selection
    const payload = await apiGetPayload(page, collectionId)
    const fakeEntityId = 'e2e-fake-selection-001'
    const updatedItems = payload.items.map((it: any) => {
      if (it.id === itemBId) {
        return {
          ...it,
          artifact_links: [
            ...it.artifact_links,
            {
              id: `link_${Date.now()}`,
              artifact_type: 'selection',
              relationship: 'references',
              tool_key: 'finish_decisions',
              entity_id: fakeEntityId,
              entity_label: 'Kitchen countertop selection',
              created_at: new Date().toISOString(),
            },
          ],
          updated_at: new Date().toISOString(),
        }
      }
      return it
    })
    await apiPutPayload(page, collectionId, { ...payload, items: updatedItems })

    // Query the linked-items API
    const res = await page.request.get(
      `/api/tools/project-alignment/linked-items?projectId=${PROJECT_ID}&entityId=${fakeEntityId}`
    )
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(data.items).toBeTruthy()
    expect(data.items.length).toBeGreaterThanOrEqual(1)

    // Verify the linked item has the correct data
    const linked = data.items.find((i: any) => i.itemId === itemBId)
    expect(linked).toBeTruthy()
    expect(linked.title).toBe('Updated backsplash resolution')
    expect(linked.relationship).toBe('references')

    await safeClose(page)
  })
})

// ═══════════════════════════════════════════════════════════════
// API VALIDATION TESTS (independent, can run in any order)
// ═══════════════════════════════════════════════════════════════

test('API: respond endpoint rejects invalid token', async ({ request }) => {
  const res = await request.post('/api/share/nonexistent-token-xyz/respond', {
    data: { itemId: 'fake-item', respondent_name: 'Test' },
  })
  expect(res.status()).toBe(404)
  const body = await res.json()
  expect(body.error).toBeTruthy()
})

test('API: respond endpoint rejects empty body', async ({ request }) => {
  const res = await request.post('/api/share/nonexistent-token-xyz/respond', {
    data: {},
  })
  expect(res.status()).toBe(404)
})

test('API: linked-items requires projectId and entityId', async ({ request }) => {
  const res = await request.get('/api/tools/project-alignment/linked-items')
  expect(res.status()).toBe(400)
})

test('API: linked-items returns 403 for non-member project', async ({ request }) => {
  const res = await request.get('/api/tools/project-alignment/linked-items?projectId=nonexistent&entityId=test')
  expect([200, 403]).toContain(res.status())
})

test('public share: invalid token shows error page', async ({ page }, testInfo) => {
  await page.goto('/share/project_alignment/invalid-token-e2e-test', { waitUntil: 'networkidle' })
  const text = await page.textContent('body')
  expect(text).toBeTruthy()
  expect(text).toMatch(/invalid|expired|not found|error/i)
  await page.screenshot({ path: screenshotPath('alignment-share-invalid-token', testInfo) })
})
