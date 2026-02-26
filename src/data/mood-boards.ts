// ============================================================================
// Mood Boards — Types & Helpers
// ============================================================================

export interface MoodBoardComment {
  id: string
  text: string
  authorName: string
  authorEmail: string
  createdAt: string
  refIdeaId?: string
  refIdeaLabel?: string
}

export type ReactionType = 'love' | 'like' | 'dislike'

export interface IdeaReaction {
  userId: string // email
  userName: string
  reaction: ReactionType
}

export const REACTION_CONFIG: Record<
  ReactionType,
  { emoji: string; label: string }
> = {
  love: { emoji: '\u2764\uFE0F', label: 'Love!' },
  like: { emoji: '\uD83D\uDC4D', label: 'Like' },
  dislike: { emoji: '\uD83D\uDC4E', label: "Don't Like" },
}

export interface IdeaImage {
  id: string
  url: string
  thumbnailUrl?: string
  label?: string
  sourceUrl?: string
}

export interface Idea {
  id: string
  name: string
  notes: string
  images: IdeaImage[]
  heroImageId: string | null
  sourceUrl: string
  sourceTitle: string
  tags: string[]
  reactions?: IdeaReaction[]
  createdAt: string
  updatedAt: string
}

export type BoardAccessLevel = 'edit' | 'view'

export interface BoardAccess {
  email: string
  level: BoardAccessLevel
}

export interface Board {
  id: string
  name: string
  ideas: Idea[]
  comments?: MoodBoardComment[]
  isDefault?: boolean // true only for "Inbox" (default landing board)
  createdBy?: string // email of board creator
  visibility?: 'everyone' | 'invite-only' // default: 'everyone'
  access?: BoardAccess[] // only used when visibility === 'invite-only'
  createdAt: string
  updatedAt: string
}

export interface MoodBoardPayload {
  version: 1
  boards: Board[]
}

// ============================================================================
// Defaults & Helpers
// ============================================================================

export const DEFAULT_PAYLOAD: MoodBoardPayload = { version: 1, boards: [] }

const DEFAULT_BOARD_ID = 'board_saved_ideas'

export function ensureDefaultBoard(boards: Board[]): Board[] {
  if (boards.some((b) => b.isDefault)) return boards
  const ts = new Date().toISOString()
  return [
    {
      id: DEFAULT_BOARD_ID,
      name: 'Inbox',
      ideas: [],
      isDefault: true,
      createdAt: ts,
      updatedAt: ts,
    },
    ...boards,
  ]
}

export function findDefaultBoard(boards: Board[]): Board | undefined {
  return boards.find((b) => b.isDefault)
}

export function isDefaultBoard(board: Board): boolean {
  return board.isDefault === true
}

/**
 * Resolve what level of access a user has to a specific board.
 * Returns 'edit' | 'view' | null (null = invisible/no access).
 *
 * @param board        The board to check
 * @param userEmail    Current user's email
 * @param toolAccess   The user's tool-level access ('EDIT' | 'VIEW' | 'OWNER')
 */
export function resolveBoardAccess(
  board: Board,
  userEmail: string,
  toolAccess: string
): 'edit' | 'view' | null {
  // Default boards are always visible to everyone
  if (board.isDefault) {
    return toolAccess === 'VIEW' ? 'view' : 'edit'
  }

  // If board is not invite-only, follow tool-level access
  if (board.visibility !== 'invite-only') {
    return toolAccess === 'VIEW' ? 'view' : 'edit'
  }

  // Board creator always has edit (capped at tool level)
  if (board.createdBy === userEmail) {
    return toolAccess === 'VIEW' ? 'view' : 'edit'
  }

  // Check board-level ACL
  const match = board.access?.find((a) => a.email === userEmail)
  if (!match) return null // invisible

  // Cap at tool-level access
  if (toolAccess === 'VIEW') return 'view'
  return match.level
}

export function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

export function now(): string {
  return new Date().toISOString()
}
