'use client'

import { TallyEmbed } from './TallyEmbed'
import { NativeForm } from './NativeForm'

export function EarlyAccessForm() {
  const tallyFormUrl = process.env.NEXT_PUBLIC_TALLY_FORM_URL

  if (tallyFormUrl) {
    return <TallyEmbed formUrl={tallyFormUrl} />
  }

  return <NativeForm />
}
