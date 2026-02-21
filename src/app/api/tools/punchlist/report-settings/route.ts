import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getReportSettings } from '@/lib/share-tokens'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const settings = await getReportSettings()

  return NextResponse.json({
    logoUrl: settings.logoUrl,
    companyName: settings.companyName,
    reportTitle: settings.reportTitle,
    footerText: settings.footerText,
  })
}
