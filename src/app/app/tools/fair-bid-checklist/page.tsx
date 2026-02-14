import { redirect } from 'next/navigation'

export default function FairBidChecklistRedirect() {
  redirect('/app/tools/before-you-sign?tab=quotes')
}
