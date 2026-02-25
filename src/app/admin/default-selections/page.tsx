import type { Metadata } from 'next'
import { DefaultSelectionsEditor } from './DefaultSelectionsEditor'

export const metadata: Metadata = { title: 'Selections Config' }

export default function AdminDefaultSelectionsPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-sandstone mb-6">Selections Config</h1>
      <DefaultSelectionsEditor />
    </div>
  )
}
