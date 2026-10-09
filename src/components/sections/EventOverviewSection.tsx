import type { ReactNode } from 'react'
import { Eyebrow, Section } from '../Layout'
import { LINK_ON_CLOUD } from '../ExternalLink'
import { Reveal, RevealGroup, RevealItem } from '../Reveal'
import { BACKDROP_PANEL } from '../SectionBackdrop'
import { HACKATHON_DATES, VENUE } from '../../lib/links'
import { BACKDROP_PHOTOS } from '../../lib/images'

/**
 * "What HackBU 2027 is" — the first section under the banner, and the one
 * that answers what, when, where and who before anything asks the reader to
 * act. Sponsors, prizes and registration all follow it.
 *
 * **Copy.** Every claim is one the site already makes somewhere else, so this
 * section cannot drift into promises the organizers have not made: the
 * "build something that did not exist on Friday" line and the kinds of
 * project are the Hackathons page's (src/components/sections/hackathons/
 * HackathonIntroSection.tsx); "about 24 hours" is the sponsors page's; teams
 * of up to four, organizers on hand all weekend and "no experience required"
 * are the FAQ's and the registration page's; "from across the Northeast" is
 * the old FAQ's answer to "Who can attend?". The dates and the venue come from
 * `HACKATHON_DATES` / `VENUE` in src/lib/links.ts, which the hero and the FAQ
 * read too. There is deliberately no prize money, headcount, travel or food
 * promise here — none is written down anywhere yet.
 *
 * **Layout.** The whole section sits on the Library Tower backdrop
 * (`BACKDROP_PHOTOS.libraryTower`, see SectionBackdrop.tsx). The header is a
 * frosted BACKDROP_PANEL and the fact cards are opaque cloud, both held to the
 * left half of the column from `md` up, so the right half of the window is
 * left to the photograph — the job the campus-walkway bleed photo used to do
 * here before the backdrops replaced it.
 *
 * **The facts are a <dl>.** When / Where / Who / Teams are name–value pairs,
 * which is what a description list is for; each pair is wrapped in a <div>
 * (valid inside <dl>) so it can be a card and a stagger step of the
 * RevealGroup. The "Where" card links down to the FAQ's map card (`#venue`)
 * rather than off-site, so the directions and the map live in one place.
 * The cards pair up two to a row where there is room for "January 30–31,
 * 2027" on one line — full width from `sm`, and the half column from `xl` —
 * and stack one per row in the half column between `md` and `xl`, where two
 * would wrap the date onto three lines.
 *
 * **Schedule.** There is no schedule link for now: the Hackathons page's
 * timeline (`SCHEDULE_ANCHOR`, `/hackathons#timeline`) is hidden until the
 * 2027 times are out. When it comes back, link to it from here rather than
 * keeping a second copy that would fall out of step.
 *
 * **Reveal.** Safe for a first content block: the hero's track is 180dvh (one
 * viewport under reduced motion, where <Reveal> goes straight to rest), so
 * none of this is in the viewport at mount.
 */

/** Card chrome, shared with the rest of the page's paired blocks. */
const CARD = 'border-frost bg-cloud flex flex-col rounded-2xl border p-6 sm:p-8'

/** Text links on this cloud section: brick hover, resting underline. */
const LINK = `${LINK_ON_CLOUD} underline underline-offset-4`

type Fact = {
  term: string
  value: ReactNode
  detail: ReactNode
}

const FACTS: readonly Fact[] = [
  {
    term: 'When',
    value: (
      <time dateTime={HACKATHON_DATES.start}>{HACKATHON_DATES.short}</time>
    ),
    detail: 'Saturday and Sunday — about 24 hours of building.',
  },
  {
    term: 'Where',
    value: VENUE.name,
    detail: (
      <>
        {VENUE.campus}, Vestal, NY.{' '}
        <a href="#venue" className={LINK}>
          Find it on the map
        </a>
      </>
    ),
  },
  {
    term: 'Who',
    value: 'College students',
    detail:
      'From Binghamton and across the Northeast. No experience required.',
  },
  {
    term: 'Teams',
    value: 'Up to four people',
    detail: 'Bring friends, or meet other hackers there and form a team.',
  },
]

export function EventOverviewSection() {
  return (
    <Section
      id="event"
      labelledBy="event-title"
      className="bg-cloud"
      backdrop={BACKDROP_PHOTOS.libraryTower}
    >
      <div className="relative flex flex-col">
        <Reveal className={`${BACKDROP_PANEL} p-6 sm:p-10 md:max-w-[50%]`}>
          <header>
            <Eyebrow>HackBU 2027</Eyebrow>
            <h2
              id="event-title"
              className="font-display text-display-lg text-pine mt-4 font-semibold text-balance"
            >
              A weekend to build something that didn’t exist on Friday.
            </h2>
            <p className="text-lede text-pine mt-4 text-pretty sm:mt-5">
              HackBU is Binghamton University’s annual hackathon. Over about 24
              hours, teams take an idea and turn it into a web app, a mobile
              app or a hardware project — whatever they can make in the time.
            </p>
            <p className="text-body text-pine mt-4 text-pretty">
              You don’t need any experience to come. Organizers are around the
              whole weekend to help when something breaks, and if you arrive
              without a team, there are chances at the event to find one.
            </p>
          </header>
        </Reveal>

        <RevealGroup
          as="dl"
          className="mt-6 grid gap-6 sm:grid-cols-2 md:max-w-[50%] md:grid-cols-1 xl:grid-cols-2"
        >
          {FACTS.map((fact) => (
            <RevealItem key={fact.term} className={CARD}>
              <dt>
                <Eyebrow>{fact.term}</Eyebrow>
              </dt>
              <dd className="mt-3">
                <p className="font-display text-display-md text-pine font-semibold">
                  {fact.value}
                </p>
                <p className="text-caption text-pine/90 mt-2">{fact.detail}</p>
              </dd>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </Section>
  )
}
