import type { Metadata } from 'next'
import { LegalEditor } from './LegalEditor'

export const metadata: Metadata = { title: 'Legal' }

export default function AdminLegalPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-sandstone mb-6">Legal Pages</h1>
      <LegalEditor />
    </div>
  )
}
