import type { ScreenshotScenario } from './types'

// Import all scenarios here. Add new ones as you create them.
import punchlistAfterQuickAdd from './punchlist-after-quick-add'
import moodBoardMoveMenu from './mood-board-move-menu'
import activityPanelToolChips from './activity-panel-tool-chips'

export const ALL_SCENARIOS: ScreenshotScenario[] = [
  punchlistAfterQuickAdd,
  moodBoardMoveMenu,
  activityPanelToolChips,
]

export function findScenario(key: string): ScreenshotScenario | undefined {
  return ALL_SCENARIOS.find((s) => s.key === key)
}
