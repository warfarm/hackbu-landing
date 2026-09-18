import { Eyebrow, Section } from '../components/Layout'
import { Reveal } from '../components/Reveal'

export function SponsorsComingSoonSection() {
  return (
    <Section
      id="sponsors-overview"
      labelledBy="sponsors-overview-title"
      className="bg-cloud"
    >
      <Reveal>
        <div className="max-w-3xl">
          <Eyebrow>Sponsors 2027</Eyebrow>
          <h1
            id="sponsors-overview-title"
            className="font-display text-display-xl text-pine mt-5 font-semibold text-balance"
          >
            Our sponsors
          </h1>
        </div>
      </Reveal>

      <div className="mt-12">
        <Reveal delay={0.1}>
          <div className="border-frost bg-frost/25 flex min-h-[280px] flex-col items-center justify-center rounded-3xl border p-8 text-center sm:min-h-[320px] sm:p-12">
            <span className="font-display text-display-lg text-pine font-semibold">
              Coming soon
            </span>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}
