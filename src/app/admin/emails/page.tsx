import type { Metadata } from 'next'
import { EmailTemplateEditor } from './EmailTemplateEditor'

export const metadata: Metadata = { title: 'Email Templates' }

export default function AdminEmailsPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-sandstone mb-2">Email Templates</h1>
      <p className="text-cream/50 text-sm mb-8">
        Configure the email sent to collaborators when they are invited to a tool.
      </p>
      <EmailTemplateEditor />
    </div>
  )
}
