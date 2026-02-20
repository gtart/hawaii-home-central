import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const DEFAULT_SUBJECT = '{{inviterName}} shared {{toolName}} with you'

const DEFAULT_BODY = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
  <h2 style="color: #1a1a1a; font-size: 22px; margin: 0 0 8px;">You've been invited to collaborate</h2>
  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
    <strong>{{inviterName}}</strong> has invited you to <strong>{{accessLevel}}</strong>
    the <strong>{{toolName}}</strong> for their project <strong>{{projectName}}</strong>
    on Hawaii Home Central.
  </p>
  <a href="{{inviteLink}}"
     style="display: inline-block; padding: 12px 28px; background: #C4A265; color: #1a1a1a; font-weight: 600; text-decoration: none; border-radius: 8px; font-size: 15px;">
    Accept Invite
  </a>
  <p style="color: #999; font-size: 13px; margin-top: 28px; line-height: 1.5;">
    This invite expires in 7 days. If you didn't expect this, you can safely ignore it.
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
