import { FadeInSection } from '@/components/effects/FadeInSection'

const STEPS = [
  {
    number: 1,
    title: 'Pick your stage',
    description: 'Find where you are in the renovation process.',
  },
  {
    number: 2,
    title: 'Open the matching tool',
    description: 'Each stage has a focused, free tool built for it.',
  },
  {
    number: 3,
    title: 'Track your progress',
    description: 'Save your work and share with your team.',
  },
]

export function HowItWorksStrip() {
  return (
    <section className="py-16 px-6 bg-basalt-50" aria-labelledby="how-it-works-heading">
      <div className="max-w-5xl mx-auto">
        <FadeInSection>
          <h2
            id="how-it-works-heading"
            className="font-serif text-2xl md:text-3xl text-sandstone mb-10 text-center"
          >
            How it works
          </h2>
        </FadeInSection>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <FadeInSection key={step.number} delay={i * 100}>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-sandstone text-basalt flex items-center justify-center text-sm font-semibold mx-auto mb-4">
                  {step.number}
                </div>
                <h3 className="font-serif text-lg text-cream mb-2">{step.title}</h3>
                <p className="text-cream/60 text-sm leading-relaxed">{step.description}</p>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  )
}
