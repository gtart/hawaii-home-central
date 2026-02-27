import { FadeInSection } from '@/components/effects/FadeInSection'

const OUTCOMES = [
  {
    heading: 'Organized renovation files',
    description:
      'Every contractor bid, finish decision, and punch list item in one place.',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    heading: 'A clear record of every decision',
    description:
      'No more searching through texts and emails for what you decided.',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="m9 14 2 2 4-4" />
      </svg>
    ),
  },
  {
    heading: 'Confidence before you sign',
    description:
      'Compare bids objectively and know exactly what you are agreeing to.',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
]

export function WhatYouGetSection() {
  return (
    <section className="py-24 px-6" aria-labelledby="outcomes-heading">
      <div className="max-w-5xl mx-auto">
        <FadeInSection>
          <h2
            id="outcomes-heading"
            className="font-serif text-3xl md:text-4xl text-sandstone mb-12 text-center"
          >
            What you get
          </h2>
        </FadeInSection>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {OUTCOMES.map((outcome, i) => (
            <FadeInSection key={outcome.heading} delay={i * 100}>
              <div className="bg-basalt-50 rounded-card p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-sandstone/10 flex items-center justify-center text-sandstone">
                  {outcome.icon}
                </div>
                <h3 className="font-serif text-lg text-cream mb-2">{outcome.heading}</h3>
                <p className="text-cream/60 text-sm leading-relaxed">{outcome.description}</p>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  )
}
