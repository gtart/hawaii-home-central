import type { Metadata } from 'next'
import { OverlayContent } from './OverlayContent'

export const metadata: Metadata = {
  title: 'Save to HHC',
  robots: { index: false, follow: false },
}

export default function OverlayPage() {
  return <OverlayContent />
}
