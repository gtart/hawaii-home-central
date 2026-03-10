import type { Metadata } from 'next'
import { OptionDetailLoader } from './OptionDetailLoader'

export const metadata: Metadata = {
  title: 'Option Detail',
}

export default function OptionDetailPage() {
  return <OptionDetailLoader />
}
