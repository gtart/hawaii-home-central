import type { Metadata } from 'next'
import { SaveFromWebContent } from './SaveFromWebContent'

export const metadata: Metadata = {
  title: 'Save from Web — Finish Selections',
}

export default function SaveFromWebPage() {
  return <SaveFromWebContent />
}
