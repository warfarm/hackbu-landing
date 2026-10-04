import { Eyebrow, Section } from '../components/Layout'
import { Reveal, RevealGroup, RevealItem } from '../components/Reveal'
import { PAST_SPONSORS, PAST_SUPPORTERS } from './pastEvent'

/**
 * Last year's (HackBU 2026) sponsors. Text cards rather than logos: the logos
 * are the sponsors' to supply, and a name always renders. To add a logo, drop
 * it in `public/artwork/sponsors/` and put an <img> above the name.
 */
export function PastSponsorsSection() {
  return (
    <Section
      id="past-sponsors"
      labelledBy="past-sponsors-title"
      className="bg-cloud"
    >
      <Reveal>
        <div className="max-w-3xl">
          <Eyebrow>HackBU 2026 • March 7 - 8</Eyebrow>
          <h2
            id="past-sponsors-title"
            className="font-display text-display-lg text-pine mt-4 font-semibold text-balance"
          >
            Last year&apos;s sponsors.
          </h2>
          <p className="text-lede text-pine mt-5">
            Thank you to the organizations that backed HackBU 2026 and put prizes
            in front of more than 100 student hackers.
          </p>
        </div>
      </Reveal>

      <RevealGroup
        as="ul"
        className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {PAST_SPONSORS.map((sponsor) => (
          <RevealItem
            as="li"
            key={sponsor.name}
            className="border-frost bg-frost/25 flex min-h-40 flex-col justify-between rounded-3xl border p-6"
          >
            <span className="font-display text-display-md text-pine font-semibold text-balance">
              {sponsor.name}
            </span>
            <span className="text-caption text-pine/90 mt-6 block">
              {sponsor.prize ? `Sponsored ${sponsor.prize}` : 'Event sponsor'}
            </span>
          </RevealItem>
        ))}
      </RevealGroup>

      <Reveal delay={0.1}>
        <div className="border-frost bg-frost/35 mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border p-5 sm:p-6">
          <span className="bg-pine text-cloud text-caption rounded-full px-4 py-1.5 font-medium shadow-xs">
            Additional supporters
          </span>
          <ul className="text-body text-pine flex flex-wrap gap-x-5 gap-y-1 font-medium">
            {PAST_SUPPORTERS.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      </Reveal>
    </Section>
  )
}
