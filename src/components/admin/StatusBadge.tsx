import type { ContentStatus } from '@prisma/client'
import { Badge } from '@/components/ui/Badge'

const STATUS_STYLES: Record<ContentStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-cream/10 text-cream/60' },
  SCHEDULED: { label: 'Scheduled', className: 'bg-blue-500/20 text-blue-300' },
  PUBLISHED: { label: 'Published', className: 'bg-green-500/20 text-green-300' },
}

export function StatusBadge({ status }: { status: ContentStatus }) {
  const style = STATUS_STYLES[status]
  return <Badge className={style.className}>{style.label}</Badge>
}
