import type { Metadata } from 'next'
import { PunchlistSettingsEditor } from './PunchlistSettingsEditor'

export const metadata: Metadata = { title: 'Fix List Settings' }

export default function AdminPunchlistPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-sandstone mb-6">
        Fix List Settings
      </h1>
      <PunchlistSettingsEditor />
    </div>
  )
}
