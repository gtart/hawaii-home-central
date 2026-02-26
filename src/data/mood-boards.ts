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

export interface Board {
  id: string
  name: string
  ideas: Idea[]
  comments?: MoodBoardComment[]
  isDefault?: boolean // true only for "Inbox" (default landing board)
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

export function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

export function now(): string {
  return new Date().toISOString()
}
