import type { Page } from '@playwright/test'

export interface ScreenshotScenario {
  /** Unique scenario key, used in filename and CLI */
  key: string
  /** Human-readable description */
  description: string
  /** Which persona to use (default: 'full-setup') */
  persona?: string
  /** Device: 'desktop' | 'mobile' | 'both' (default: 'both') */
  device?: 'desktop' | 'mobile' | 'both'
  /**
   * The scenario steps. Each step can navigate, interact, and capture.
   * Receives a `snap` helper that captures a named screenshot.
   */
  run: (
    page: Page,
    snap: (label: string) => Promise<string>,
  ) => Promise<void>
}
