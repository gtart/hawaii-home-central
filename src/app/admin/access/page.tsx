import type { Metadata } from 'next'
import { AccessManager } from './AccessManager'

export const metadata: Metadata = {
  title: 'Access',
}

export default function AccessPage() {
  return <AccessManager />
}
