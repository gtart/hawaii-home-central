import type { Metadata } from 'next'
import { SettingsEditor } from './SettingsEditor'

export const metadata: Metadata = { title: 'Settings' }

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-sandstone mb-6">
        Site Settings
      </h1>
      <SettingsEditor />
    </div>
  )
}
