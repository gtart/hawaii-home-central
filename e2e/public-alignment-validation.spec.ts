/**
 * Project Alignment — payload validation/coercion unit tests.
 *
 * Tests the server-side validateAndCoerceToolPayload function directly.
 * These are logic-only tests that don't need a browser or running server.
 */
import { test, expect } from '@playwright/test'
import { validateAndCoerceToolPayload } from '../src/lib/tools/validateToolPayload'

// ── Basic shape ──

test('validation: empty payload gets default shape', () => {
  const result = validateAndCoerceToolPayload('project_alignment', {})
  expect(result.valid).toBe(true)
  if (!result.valid) return
  expect(result.payload.version).toBe(1)
  expect(result.payload.nextItemNumber).toBe(1)
  expect(Array.isArray(result.payload.items)).toBe(true)
  expect((result.payload.items as unknown[]).length).toBe(0)
})

test('validation: non-object payload rejected', () => {
  const result = validateAndCoerceToolPayload('project_alignment', 'not an object')
  expect(result.valid).toBe(false)
})

test('validation: null payload rejected', () => {
  const result = validateAndCoerceToolPayload('project_alignment', null)
  expect(result.valid).toBe(false)
})

test('validation: array payload rejected', () => {
  const result = validateAndCoerceToolPayload('project_alignment', [1, 2, 3])
  expect(result.valid).toBe(false)
})

// ── Item coercion ──

test('validation: valid item passes through', () => {
  const item = {
    id: 'test-id-1',
    itemNumber: 1,
    title: 'Kitchen backsplash issue',
    type: 'scope_clarification',
    status: 'open',
    area_label: 'Kitchen',
    summary: '',
    original_expectation: '',
    current_issue: 'Unclear whether backsplash is included',
    proposed_resolution: '',
    current_agreed_answer: '',
    cost_impact_status: 'unknown',
    cost_impact_amount_text: '',
    schedule_impact_status: 'none',
    schedule_impact_text: '',
    waiting_on_role: 'contractor',
    artifact_links: [],
    photos: [],
    guest_responses: [],
    created_at: '2026-03-10T00:00:00Z',
    updated_at: '2026-03-10T00:00:00Z',
  }
  const result = validateAndCoerceToolPayload('project_alignment', {
    version: 1,
    nextItemNumber: 2,
    items: [item],
  })
  expect(result.valid).toBe(true)
  if (!result.valid) return
  const items = result.payload.items as Record<string, unknown>[]
  expect(items.length).toBe(1)
  expect(items[0].title).toBe('Kitchen backsplash issue')
  expect(items[0].status).toBe('open')
  expect(items[0].type).toBe('scope_clarification')
})

test('validation: invalid status coerced to open', () => {
  const result = validateAndCoerceToolPayload('project_alignment', {
    items: [{ id: 'x', itemNumber: 1, title: 'Test', status: 'BOGUS_STATUS', current_issue: 'test' }],
  })
  expect(result.valid).toBe(true)
  if (!result.valid) return
  const items = result.payload.items as Record<string, unknown>[]
  expect(items[0].status).toBe('open')
})

test('validation: invalid type coerced to open_question', () => {
  const result = validateAndCoerceToolPayload('project_alignment', {
    items: [{ id: 'x', itemNumber: 1, title: 'Test', type: 'INVALID_TYPE', current_issue: 'test' }],
  })
  expect(result.valid).toBe(true)
  if (!result.valid) return
  const items = result.payload.items as Record<string, unknown>[]
  expect(items[0].type).toBe('open_question')
})

test('validation: missing required strings get defaults', () => {
  const result = validateAndCoerceToolPayload('project_alignment', {
    items: [{ id: 'x' }],
  })
  expect(result.valid).toBe(true)
  if (!result.valid) return
  const items = result.payload.items as Record<string, unknown>[]
  expect(items[0].title).toBe('Untitled')
  expect(items[0].current_issue).toBe('')
  expect(items[0].area_label).toBe('')
})

test('validation: non-array fields coerced to arrays', () => {
  const result = validateAndCoerceToolPayload('project_alignment', {
    items: [{
      id: 'x',
      itemNumber: 1,
      title: 'Test',
      artifact_links: 'not_an_array',
      photos: null,
      guest_responses: 123,
    }],
  })
  expect(result.valid).toBe(true)
  if (!result.valid) return
  const items = result.payload.items as Record<string, unknown>[]
  expect(Array.isArray(items[0].artifact_links)).toBe(true)
  expect(Array.isArray(items[0].photos)).toBe(true)
  expect(Array.isArray(items[0].guest_responses)).toBe(true)
})

test('validation: invalid cost/schedule impact coerced to unknown/unknown', () => {
  const result = validateAndCoerceToolPayload('project_alignment', {
    items: [{
      id: 'x',
      cost_impact_status: 'BOGUS',
      schedule_impact_status: 'INVALID',
    }],
  })
  expect(result.valid).toBe(true)
  if (!result.valid) return
  const items = result.payload.items as Record<string, unknown>[]
  expect(items[0].cost_impact_status).toBe('unknown')
  expect(items[0].schedule_impact_status).toBe('unknown')
})

test('validation: invalid waiting_on_role coerced to none', () => {
  const result = validateAndCoerceToolPayload('project_alignment', {
    items: [{
      id: 'x',
      waiting_on_role: 'the_king',
    }],
  })
  expect(result.valid).toBe(true)
  if (!result.valid) return
  const items = result.payload.items as Record<string, unknown>[]
  expect(items[0].waiting_on_role).toBe('none')
})

test('validation: non-object items are filtered out', () => {
  const result = validateAndCoerceToolPayload('project_alignment', {
    items: [
      { id: 'valid', title: 'OK' },
      'not an object',
      42,
      null,
      { id: 'also-valid', title: 'Also OK' },
    ],
  })
  expect(result.valid).toBe(true)
  if (!result.valid) return
  const items = result.payload.items as Record<string, unknown>[]
  expect(items.length).toBe(2)
})

test('validation: nextItemNumber computed from items if missing', () => {
  const result = validateAndCoerceToolPayload('project_alignment', {
    items: [
      { id: 'a', itemNumber: 1 },
      { id: 'b', itemNumber: 2 },
      { id: 'c', itemNumber: 3 },
    ],
  })
  expect(result.valid).toBe(true)
  if (!result.valid) return
  expect(result.payload.nextItemNumber).toBe(4)
})

test('validation: optional Phase 1.5 fields preserved when valid', () => {
  const result = validateAndCoerceToolPayload('project_alignment', {
    items: [{
      id: 'x',
      what_changed: 'Countertop material changed',
      what_did_not_change: 'Layout unchanged',
      whats_still_open: 'Price TBD',
      superseded_by_id: 'newer-item',
      answer_updated_at: '2026-03-10T00:00:00Z',
    }],
  })
  expect(result.valid).toBe(true)
  if (!result.valid) return
  const items = result.payload.items as Record<string, unknown>[]
  expect(items[0].what_changed).toBe('Countertop material changed')
  expect(items[0].what_did_not_change).toBe('Layout unchanged')
  expect(items[0].whats_still_open).toBe('Price TBD')
  expect(items[0].superseded_by_id).toBe('newer-item')
  expect(items[0].answer_updated_at).toBe('2026-03-10T00:00:00Z')
})

test('validation: optional fields omitted when invalid', () => {
  const result = validateAndCoerceToolPayload('project_alignment', {
    items: [{
      id: 'x',
      what_changed: 42,         // not a string
      superseded_by_id: true,   // not a string
      answer_updated_at: null,  // not a string
    }],
  })
  expect(result.valid).toBe(true)
  if (!result.valid) return
  const items = result.payload.items as Record<string, unknown>[]
  expect(items[0].what_changed).toBeUndefined()
  expect(items[0].superseded_by_id).toBeUndefined()
  expect(items[0].answer_updated_at).toBeUndefined()
})
