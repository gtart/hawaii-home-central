import { redirect } from 'next/navigation'

export default function ResponsibilityMatrixRedirect() {
  redirect('/app/tools/before-you-sign?tab=handoffs')
}
