import { FadeInSection } from '@/components/effects/FadeInSection'

export function AboutSection() {
  return (
    <section
      className="py-24 px-6 bg-basalt-50"
      aria-labelledby="about-heading"
    >
      <FadeInSection className="max-w-3xl mx-auto">
        <h2
          id="about-heading"
          className="font-serif text-3xl md:text-4xl text-sandstone mb-8 text-center"
        >
          Why Hawaii Home Central?
        </h2>

        <div className="space-y-6 text-cream/80 leading-relaxed">
          <p>
            Hawaii Home Central started after a few friends and I lived through the same surprise: renovating a home is less about inspiration and more about navigating complexity—especially in Hawaiʻi. Even with excellent professionals, the process can be intense.
          </p>

          <p>
            One of the biggest challenges is coordination: so many moving pieces, so many specialties, tight calendars, changing sequences, and a constant stream of decisions that stack up fast. Then you run into the bigger system issues—scattered information, and differing incentives between homeowners, trades, suppliers, and everyone in between—plus the simple reality that trust is hard to verify.
          </p>

          <p>
            This site is my attempt to turn hard-earned lessons into a clearer path—so the next homeowner can renovate, maintain, and enjoy their home with more confidence.
          </p>
        </div>

        <p className="mt-8 text-sandstone/80 text-center italic">
          Great pros matter. This site helps homeowners show up informed, so projects go better for everyone.
        </p>
      </FadeInSection>
    </section>
  )
}
