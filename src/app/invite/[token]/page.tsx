import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { TOOL_LABELS } from '@/lib/tool-registry'
import { InviteAcceptClient } from './InviteAcceptClient'

interface PageProps {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params

  try {
    const invite = await prisma.projectInvite.findUnique({
      where: { token },
      include: {
        project: { select: { name: true } },
        inviter: { select: { name: true } },
      },
    })

    if (!invite || invite.status !== 'PENDING') {
      return {
        title: 'Invite — Hawaii Home Central',
        description: 'This invite is no longer available.',
      }
    }

    const toolLabel = TOOL_LABELS[invite.toolKey] || invite.toolKey
    const inviterName = invite.inviter.name || 'Someone'
    const title = `${inviterName} invited you to ${toolLabel}`
    const description = `Join "${invite.project.name}" on Hawaii Home Central to collaborate on ${toolLabel}. ${invite.level === 'EDIT' ? 'You can view and edit.' : 'View-only access.'}`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        siteName: 'Hawaii Home Central',
        type: 'website',
      },
      twitter: {
        card: 'summary',
        title,
        description,
      },
    }
  } catch {
    return {
      title: 'Invite — Hawaii Home Central',
      description: 'You have been invited to collaborate on Hawaii Home Central.',
    }
  }
}

export default function InviteAcceptPage() {
  return <InviteAcceptClient />
}
