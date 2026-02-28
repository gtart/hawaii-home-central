import path from 'path'

/**
 * E2E test persona definitions.
 *
 * Each persona has a deterministic userId that must match exactly between:
 *   1. scripts/seed-e2e-personas.ts (Prisma upserts)
 *   2. e2e/auth.setup.ts (JWT encoding)
 *   3. playwright.config.ts (project storageState)
 *
 * IMPORTANT: If you change a userId here, you must also update
 * scripts/seed-e2e-personas.ts (which duplicates these values because
 * scripts/ cannot import from e2e/).
 */

export interface PersonaConfig {
  /** Short kebab-case key used in file names and project names */
  key: string
  /** Display name encoded into the JWT */
  name: string
  /** Email encoded into the JWT */
  email: string
  /** Deterministic user ID -- must match the seeded DB row */
  userId: string
  /** Absolute path to the storageState JSON file */
  storageStatePath: string
  /** Regex to match this persona's test files */
  testMatch: RegExp
}

const authDir = path.join(__dirname, '.auth')

export const PERSONAS: PersonaConfig[] = [
  {
    key: 'new-user',
    name: 'New User',
    email: 'e2e-new-user@test.hhc.local',
    userId: 'e2e-persona-new-user',
    storageStatePath: path.join(authDir, 'persona-new-user.json'),
    testMatch: /persona-new-user\.spec\.ts/,
  },
  {
    key: 'fixlist',
    name: 'Fix List User',
    email: 'e2e-fixlist@test.hhc.local',
    userId: 'e2e-persona-fixlist',
    storageStatePath: path.join(authDir, 'persona-fixlist.json'),
    testMatch: /persona-fixlist\.spec\.ts/,
  },
  {
    key: 'two-projects',
    name: 'Two Projects User',
    email: 'e2e-two-projects@test.hhc.local',
    userId: 'e2e-persona-two-projects',
    storageStatePath: path.join(authDir, 'persona-two-projects.json'),
    testMatch: /persona-two-projects\.spec\.ts/,
  },
  {
    key: 'full-setup',
    name: 'Full Setup User',
    email: 'e2e-full-setup@test.hhc.local',
    userId: 'e2e-persona-full-setup',
    storageStatePath: path.join(authDir, 'persona-full-setup.json'),
    testMatch: /persona-full-setup\.spec\.ts/,
  },
  {
    key: 'collaborator',
    name: 'Collaborator User',
    email: 'e2e-collaborator@test.hhc.local',
    userId: 'e2e-persona-collaborator',
    storageStatePath: path.join(authDir, 'persona-collaborator.json'),
    testMatch: /share-collaboration\.spec\.ts/,
  },
]

/**
 * The "full-setup" persona is used as the default for:
 *  - authenticated / authenticated-mobile / authenticated-android projects
 *  - backward-compat user.json alias
 */
export const DEFAULT_PERSONA = PERSONAS.find((p) => p.key === 'full-setup')!
