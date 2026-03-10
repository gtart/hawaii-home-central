import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const DEFAULT_SUBJECT = '{{inviterName}} shared {{toolName}} with you on Hawaii Home Central'

const DEFAULT_BODY = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #333;">
  <div style="margin-bottom: 32px;">
    <span style="font-size: 18px; font-weight: 700; color: #C4A265;">Hawaii Home Central</span>
  </div>
  <h2 style="color: #1a1a1a; font-size: 22px; margin: 0 0 8px;">You\u2019ve been invited to collaborate</h2>
  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
    <strong>{{inviterName}}</strong> has invited you to <strong>{{accessLevel}}</strong>
    their <strong>{{toolName}}</strong> for <strong>{{projectName}}</strong>.
  </p>
  <a href="{{inviteLink}}"
     style="display: inline-block; padding: 14px 32px; background: #C4A265; color: #1a1a1a; font-weight: 600; text-decoration: none; border-radius: 8px; font-size: 15px;">
    Accept Invite
  </a>
  <div style="margin-top: 32px; padding: 20px; background: #f7f5f2; border-radius: 8px;">
    <p style="color: #666; font-size: 13px; line-height: 1.6; margin: 0 0 8px;">
      <strong>How to get started:</strong> Click the button above and sign in with your Google account.
      Your access has been set up automatically\u2014no approval needed.
    </p>
    <p style="color: #888; font-size: 13px; line-height: 1.6; margin: 0;">
      Hawaii Home Central helps homeowners track renovation decisions, manage fix lists,
      and collaborate with their team\u2014all in one place.
    </p>
  </div>
  <p style="color: #aaa; font-size: 12px; margin-top: 24px; line-height: 1.5;">
    This invite expires in 7 days. If you didn\u2019t expect this, you can safely ignore it.
  </p>
</div>
`.trim()

export interface InviteEmailParams {
  toEmail: string
  inviterName: string
  toolName: string
  accessLevel: string
  projectName: string
  inviteLink: string
}

/** Replace all {{variableName}} placeholders in a template string. */
function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => vars[key] ?? match)
}

/**
 * Load the admin-configured email template from SiteSettings.
 * Falls back to hardcoded defaults if settings are missing.
 */
async function loadTemplate(): Promise<{ subject: string; body: string; from: string }> {
  const keys = ['invite_email_subject', 'invite_email_body', 'email_from_address']
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: keys } },
  })

  const map = new Map(settings.map((s) => [s.key, s.value]))

  return {
    subject: map.get('invite_email_subject') || DEFAULT_SUBJECT,
    body: map.get('invite_email_body') || DEFAULT_BODY,
    from:
      map.get('email_from_address') ||
      process.env.RESEND_FROM_EMAIL ||
      'Hawaii Home Central <noreply@hawaiihomecentral.com>',
  }
}

/**
 * Send an invite email. Fails silently (logs error, does not throw).
 * If RESEND_API_KEY is not set, logs the email to console instead.
 */
export async function sendInviteEmail(params: InviteEmailParams): Promise<void> {
  const vars: Record<string, string> = {
    inviterName: params.inviterName,
    toolName: params.toolName,
    accessLevel: params.accessLevel,
    projectName: params.projectName,
    inviteLink: params.inviteLink,
  }

  const template = await loadTemplate()
  const subject = interpolate(template.subject, vars)
  const html = interpolate(template.body, vars)

  if (!resend) {
    console.log('[email] RESEND_API_KEY not set. Would send:', {
      to: params.toEmail,
      from: template.from,
      subject,
    })
    return
  }

  try {
    const { error } = await resend.emails.send({
      from: template.from,
      to: [params.toEmail],
      subject,
      html,
    })

    if (error) {
      console.error('[email] Resend API error:', error)
    }
  } catch (err) {
    console.error('[email] Failed to send invite email:', err)
  }
}
