import { useId, useState, type ReactNode } from 'react'
import { Eyebrow, Section, SectionHeader } from '../Layout'
import { ExternalLink, LINK_ON_FROST, MailLink } from '../ExternalLink'
import { Reveal, RevealGroup, RevealItem } from '../Reveal'
import { BACKDROP_PANEL } from '../SectionBackdrop'
import { BACKDROP_PHOTOS } from '../../lib/images'
import {
  CONTACT_EMAIL,
  DISCORD_URL,
  HACKATHON_DATES,
  VENUE,
  VENUE_DIRECTIONS_URL,
  VENUE_MAP_EMBED_URL,
} from '../../lib/links'

/**
 * The hackathon FAQ — the questions people ask before they register for
 * HackBU 2027 — with a map of the venue beside them. Each answer sits behind a
 * disclosure so nine items stay scannable; one open at a time keeps the page
 * from stacking long answers.
 *
 * **Disclosures.** Opening is animated: the panel is a one-row grid whose row
 * goes `0fr` to `1fr` (`.faq-panel`, src/index.css), so the answer's height is
 * never measured and no JS runs per frame. The panel stays in the DOM either
 * way — `aria-controls` always resolves — and `visibility` on the panel,
 * driven by the same transition, is what keeps a closed answer (and any link
 * inside it) out of the accessibility tree and the tab order. The `+` in the
 * button is two SVG strokes, and the upright one scales to nothing when the
 * item is open so it becomes a `−` in the same motion. Answers are
 * `ReactNode`, not strings, because several now carry links.
 *
 * **Copy.** The club-era FAQ is re-aimed at the hackathon. Registration is not
 * open yet, so its answer points at the Discord, where it will be announced.
 * "Who can attend?" keeps only its hackathon half. Nothing is claimed that the site
 * does not already say somewhere — no cost, meals, travel or age policy,
 * because none of those is written down yet.
 *
 * **The map, and why it replaced the photograph.** Until the landing page
 * became the hackathon's, this section's right half was a portrait photograph
 * of a campus walkway, bled off the window's edge (`.photo-bleed`). That slot
 * now holds a Google Map of the University Union, for three reasons:
 *
 *   - "Where is it?" is the question a visitor from another school cannot
 *     answer from a photograph, and it has to be answerable without opening
 *     anything — so the map sits beside the questions, not inside one. The
 *     "Where and when is it?" answer links down to it (`#venue`).
 *   - A map cannot be a bleed. The bleed's feathered mask dissolves the outer
 *     12% of every edge, which is where the embed keeps its zoom controls, its
 *     "open in Maps" link and Google's attribution; an interactive frame also
 *     wants a hard, rounded edge that says "this is a thing you can use". So
 *     it is a card: the same `rounded-2xl` frost-edged box as the About page's
 *     calendar embed, held inside the column.
 *   - Two pictures in one section fight each other (it is why Baxter left the
 *     old About section). The walkway photograph moved up the page instead,
 *     to the event overview (EventOverviewSection.tsx), whose tall copy
 *     column suits a portrait frame.
 *
 * **The backdrop.** The whole section sits on a photograph of the Union
 * itself, the venue, in snow (`BACKDROP_PHOTOS.union`, SectionBackdrop.tsx),
 * with the questions and the map card each on a frosted BACKDROP_PANEL. The
 * map keeps its own hard-edged card inside the panel, for the reasons above.
 * The question buttons and the links underline on hover rather than turning
 * brick — see LINK below.
 *
 * From `lg` up the questions and the map are two columns and the map card is
 * `sticky`, so it stays beside whichever answer is open as the list scrolls
 * past — plain CSS, no scroll listener. (Sticky still works here because the
 * section no longer needs `overflow-x-clip`: nothing bleeds.) Below `lg` the
 * card follows the list, so the questions stay first on a phone.
 *
 * **The embed itself.** Keyless (`output=embed`; the URLs and the reason for
 * the exact search string are in src/lib/links.ts). `loading="lazy"`, since
 * it is the last section on the page, and `referrerPolicy`
 * `no-referrer-when-downgrade`, the value Google's own embed snippet uses. The
 * frame has a `title`, and everything it shows is also written out as text
 * beside it — building, address, dates — with a "Get directions" link, because
 * a map in a frame is not something a screen reader can read.
 */

/**
 * Text links inside answers and on the map card. Both sit on frosted
 * BACKDROP_PANELs over the Union backdrop, where brick measures ~4.05:1 against
 * the darkest composited pixel — the frost situation exactly — so they take
 * the frost treatment: underline on hover, never brick.
 */
const LINK = `${LINK_ON_FROST} underline underline-offset-4`

/** Id of the map card, the target of the in-page "map" links. */
const VENUE_ID = 'venue'

const QUESTIONS: readonly { question: string; answer: ReactNode }[] = [
  {
    question: 'What is a hackathon?',
    answer:
      'A weekend of building. Teams get a set window — at HackBU, about 24 hours — to build a web app, a mobile app or a hardware project. You start from an idea and end with whatever you managed to make in the time. Almost nothing is finished by the end, and that’s the normal outcome.',
  },
  {
    question: 'Where and when is it?',
    answer: (
      <>
        In the {VENUE.name} at {VENUE.campus} — {VENUE.address}. HackBU 2027
        runs{' '}
        <time dateTime={HACKATHON_DATES.start}>{HACKATHON_DATES.long}</time>.{' '}
        <a href={`#${VENUE_ID}`} className={LINK}>
          The map in this section
        </a>{' '}
        shows where the building is on campus, or you can{' '}
        <ExternalLink href={VENUE_DIRECTIONS_URL} className={LINK}>
          get directions in Google Maps
        </ExternalLink>
        .
      </>
    ),
  },
  {
    question: 'Who can attend?',
    answer:
      'College students. HackBU brings students together from Binghamton and across the Northeast to build, network and compete for prizes, and you don’t need any experience to apply.',
  },
  {
    question: 'How do I register?',
    answer: (
      <>
        Registration isn’t open yet. We’ll announce it in the{' '}
        <ExternalLink href={DISCORD_URL} className={LINK}>
          HackBU Discord
        </ExternalLink>{' '}
        as soon as it is.
      </>
    ),
  },
  {
    question: 'I’m a first-time hacker. What should I do?',
    answer:
      'Come anyway — no experience is required. A lot of our members started with none. Before the hackathon we run sessions that help you get started, and organizers are around the whole weekend to help when something breaks.',
  },
  {
    question: 'How does team formation work?',
    answer:
      'Teams are up to four people. Bring friends if you have them — if you don’t, there will be chances at the event to meet other hackers and form a team.',
  },
  {
    question: 'Will there be swag?',
    answer:
      'Yes. Hackathon participants get HackBU swag, and there are prizes for the winning teams as well.',
  },
  {
    question: 'Can I volunteer?',
    answer: (
      <>
        Yes — we’re glad to have help. Email{' '}
        <MailLink email={CONTACT_EMAIL} className={LINK} /> or ask on{' '}
        <ExternalLink href={DISCORD_URL} className={LINK}>
          our Discord
        </ExternalLink>{' '}
        and tell us you’d like to volunteer; we’ll point you at what’s open.
      </>
    ),
  },
  {
    question: 'I have more questions.',
    answer: (
      <>
        Email the organizers at{' '}
        <MailLink email={CONTACT_EMAIL} className={LINK} /> or ask in{' '}
        <ExternalLink href={DISCORD_URL} className={LINK}>
          our Discord
        </ExternalLink>
        . It’s a small team of students, and no question is too basic to send.
      </>
    ),
  },
]

export function QuestionsSection() {
  const baseId = useId()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <Section
      id="questions"
      labelledBy="questions-title"
      className="bg-cloud"
      backdrop={BACKDROP_PHOTOS.union}
    >
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
        <div className={`${BACKDROP_PANEL} p-6 sm:p-10`}>
          <Reveal>
            <SectionHeader
              eyebrow="Hackathon FAQ"
              titleId="questions-title"
              title="Questions newcomers actually have."
            />
          </Reveal>

          <RevealGroup className="border-frost mt-12 border-t">
            {QUESTIONS.map((item, index) => {
              const open = openIndex === index
              const panelId = `${baseId}-panel-${index}`
              const buttonId = `${baseId}-button-${index}`

              return (
                <RevealItem key={item.question} className="border-frost border-b">
                  <h3>
                    <button
                      type="button"
                      id={buttonId}
                      aria-expanded={open}
                      aria-controls={panelId}
                      onClick={() => setOpenIndex(open ? null : index)}
                      className="font-display text-display-md text-pine hover:underline hover:decoration-2 hover:underline-offset-4 focus-visible:outline-pine flex w-full cursor-pointer items-center justify-between gap-6 py-8 text-left font-semibold text-balance focus-visible:outline-2 focus-visible:outline-offset-4"
                    >
                      {item.question}
                      <DisclosureGlyph open={open} />
                    </button>
                  </h3>
                  <div className="faq-panel" data-open={open}>
                    <section id={panelId} aria-labelledby={buttonId}>
                      <p className="faq-panel-body text-body text-pine max-w-2xl pb-8">
                        {item.answer}
                      </p>
                    </section>
                  </div>
                </RevealItem>
              )
            })}
          </RevealGroup>
        </div>

        {/*
         * The sticky wrapper is outside the <Reveal>, so the reveal's
         * transform never sits between the sticky box and the page.
         */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal delay={0.05} className={`${BACKDROP_PANEL} p-4 sm:p-6`}>
            <VenueCard />
          </Reveal>
        </div>
      </div>
    </Section>
  )
}

/**
 * The map card: the embedded map, then the same facts as text — building,
 * campus, street address, dates — and the "Get directions" link. It is the
 * `#venue` target, and `scroll-mt-24` clears the fixed header when an in-page
 * link lands on it.
 */
function VenueCard() {
  return (
    <div id={VENUE_ID} className="scroll-mt-24">
      <div className="border-frost bg-frost overflow-hidden rounded-2xl border">
        <iframe
          title={`Google Map of the ${VENUE.name} at ${VENUE.campus}`}
          src={VENUE_MAP_EMBED_URL}
          className="block h-80 w-full sm:h-96"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <div className="mt-6">
        <Eyebrow>Where it is</Eyebrow>
        <h3 className="font-display text-display-md text-pine mt-3 font-semibold">
          {VENUE.name}, {VENUE.campus}
        </h3>
        <p className="text-body text-pine mt-2">{VENUE.address}</p>
        <p className="text-caption text-pine/90 mt-1">
          <time dateTime={HACKATHON_DATES.start}>{HACKATHON_DATES.long}</time>
        </p>
        <p className="text-lede mt-5 font-medium">
          <ExternalLink href={VENUE_DIRECTIONS_URL} className={LINK}>
            Get directions
          </ExternalLink>
          <span aria-hidden="true" className="text-pine">
            {' '}
            →
          </span>
        </p>
      </div>
    </div>
  )
}

/**
 * The `+` / `−` at the end of each question. A horizontal stroke and a
 * vertical one; the vertical stroke scales to zero about its centre when the
 * item is open, so the plus closes into a minus and back without a swap.
 * Decorative — the button's `aria-expanded` carries the state.
 */
function DisclosureGlyph({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="text-pine/90 h-6 w-6 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    >
      <path d="M5 12 H19" />
      <path
        d="M12 5 V19"
        className="origin-center transition-transform duration-300 ease-out motion-reduce:transition-none"
        style={{ transform: open ? 'scaleY(0)' : 'scaleY(1)' }}
      />
    </svg>
  )
}
