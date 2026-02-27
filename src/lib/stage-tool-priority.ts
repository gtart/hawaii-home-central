/**
 * Stage-to-tool priority mapping.
 *
 * Each renovation stage has a prioritized list of tools — the most relevant
 * tool for that stage comes first. Used by NextStepsCard to recommend tools
 * based on the user's current renovation stage.
 */

export interface StagePickerOption {
  id: string
  label: string
  description: string
}

/** Options shown in the stage-picker modal / onboarding flow. */
export const STAGE_PICKER_OPTIONS: StagePickerOption[] = [
  {
    id: 'plan',
    label: 'Planning',
    description: "I'm figuring out what to do and how much to spend",
  },
  {
    id: 'hire-contract',
    label: 'Hiring a Contractor',
    description: "I'm comparing bids or about to sign a contract",
  },
  {
    id: 'permits-schedule',
    label: 'Permits & Scheduling',
    description: "I'm waiting on permits or setting the timeline",
  },
  {
    id: 'decide-order',
    label: 'Choosing Finishes',
    description: "I'm selecting materials, fixtures, and colors",
  },
  {
    id: 'build-closeout',
    label: 'Building',
    description: "Construction is underway or I'm doing my final walkthrough",
  },
]

/** Valid stage IDs for validation. */
export const VALID_STAGE_IDS = STAGE_PICKER_OPTIONS.map((o) => o.id)

/** Tool priority per stage — first tool is the primary recommendation. */
export const STAGE_TOOL_PRIORITY: Record<string, string[]> = {
  plan: ['mood_boards', 'finish_decisions', 'before_you_sign', 'punchlist'],
  'hire-contract': ['before_you_sign', 'mood_boards', 'finish_decisions', 'punchlist'],
  'permits-schedule': ['finish_decisions', 'before_you_sign', 'mood_boards', 'punchlist'],
  'decide-order': ['finish_decisions', 'mood_boards', 'before_you_sign', 'punchlist'],
  'build-closeout': ['punchlist', 'finish_decisions', 'mood_boards', 'before_you_sign'],
}

/** Returns the tool priority order for a given stage, or null if stage is unknown. */
export function getToolPriority(stageId: string | null | undefined): string[] | null {
  if (!stageId) return null
  return STAGE_TOOL_PRIORITY[stageId] ?? null
}

/** Returns the display label for a stage ID. */
export function getStageLabel(stageId: string | null | undefined): string | null {
  if (!stageId) return null
  return STAGE_PICKER_OPTIONS.find((o) => o.id === stageId)?.label ?? null
}
