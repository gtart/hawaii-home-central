import type { Metadata } from 'next'
import { SaveFromWebContent } from './SaveFromWebContent'

export const metadata: Metadata = {
  title: 'Save to HHC — Finish Selections',
}

export default function SaveFromWebPage() {
  return <SaveFromWebContent />
}
