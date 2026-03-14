import { NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { auth } from '@/auth'
import { ensureCurrentProject } from '@/lib/project'
import { resolveToolAccess } from '@/lib/project-access'

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]

const MAX_SIZE = 40 * 1024 * 1024 // 40MB

/**
 * POST /api/tools/mood-boards/upload
 *
 * Token handler for client-side uploads via @vercel/blob/client.
 * Client generates thumbnails via /api/generate-thumbnail after upload.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await auth()
        if (!session?.user?.id) {
          throw new Error('Unauthorized')
        }

        const userId = session.user.id
        const projectId = await ensureCurrentProject(userId)
        const access = await resolveToolAccess(userId, projectId, 'mood_boards')
        if (!access || access === 'VIEW') {
          throw new Error('No edit access')
        }

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_SIZE,
        }
      },
      onUploadCompleted: async () => {
        // Thumbnails are generated client-side via /api/generate-thumbnail
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 400 },
    )
  }
}
