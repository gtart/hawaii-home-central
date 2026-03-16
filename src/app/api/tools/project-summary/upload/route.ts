import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { auth } from '@/auth'
import { ensureCurrentProject } from '@/lib/project'
import { resolveToolAccess } from '@/lib/project-access'

const MAX_SIZE = 40 * 1024 * 1024 // 40MB

/**
 * POST /api/tools/project-summary/upload
 *
 * Direct server-side upload to Vercel Blob via put().
 * Accepts multipart/form-data with a single "file" field.
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const projectId = await ensureCurrentProject(userId)
    const access = await resolveToolAccess(userId, projectId, 'project_summary')
    if (!access || access === 'VIEW') {
      return NextResponse.json({ error: 'No edit access' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Max 40MB' }, { status: 400 })
    }

    const blob = await put(`project-summary/${file.name}`, file, {
      access: 'public',
      addRandomSuffix: true,
    })

    return NextResponse.json({
      url: blob.url,
      contentType: blob.contentType,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 },
    )
  }
}
