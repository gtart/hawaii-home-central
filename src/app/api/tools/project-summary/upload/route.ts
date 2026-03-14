import { NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { auth } from '@/auth'
import { ensureCurrentProject } from '@/lib/project'
import { resolveToolAccess } from '@/lib/project-access'

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const MAX_SIZE = 40 * 1024 * 1024 // 40MB

/**
 * POST /api/tools/project-summary/upload
 *
 * Token handler for client-side uploads via @vercel/blob/client.
 * The browser uploads directly to Vercel Blob, bypassing the 4.5MB
 * serverless body limit.
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
        const access = await resolveToolAccess(userId, projectId, 'project_summary')
        if (!access || access === 'VIEW') {
          throw new Error('No edit access')
        }

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_SIZE,
        }
      },
      onUploadCompleted: async () => {
        // No server-side processing needed for project-summary docs
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
