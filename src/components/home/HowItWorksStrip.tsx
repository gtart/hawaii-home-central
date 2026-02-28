import { FadeInSection } from '@/components/effects/FadeInSection'

const BULLETS = [
  'Starting out? Capture inspiration and keep options organized.',
  'Getting bids? Compare apples-to-apples before you sign.',
  'Making selections? Track what\u2019s decided and what\u2019s blocking.',
  'In the build? Keep a clean punch list you can share.',
]

export function HowItWorksStrip() {
  return (
    <section className="py-16 px-6 bg-basalt-50" aria-labelledby="how-people-use-this-heading">
      <div className="max-w-3xl mx-auto">
        <FadeInSection>
          <h2
            id="how-people-use-this-heading"
            className="font-serif text-2xl md:text-3xl text-sandstone mb-2 text-center"
          >
            How people use this
          </h2>
          <p className="text-cream/50 text-sm mb-8 text-center">
            Use what you need, when you need it
          </p>
        </FadeInSection>
        <ul className="space-y-4">
          {BULLETS.map((bullet, i) => (
            <FadeInSection key={i} delay={i * 80}>
              <li className="flex gap-3 text-cream/70 text-sm leading-relaxed">
                <span className="text-sandstone shrink-0">&rarr;</span>
                <span>{bullet}</span>
              </li>
            </FadeInSection>
          ))}
        </ul>
      </div>
    </section>
  )
}
