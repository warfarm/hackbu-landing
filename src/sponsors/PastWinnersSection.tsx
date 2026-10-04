import { Eyebrow, Section } from '../components/Layout'
import { Reveal, RevealGroup, RevealItem } from '../components/Reveal'
import { ExternalLink, LINK_ON_CLOUD } from '../components/ExternalLink'
import { PAST_EVENT_GALLERY_URL, PAST_WINNERS } from './pastEvent'

/** Last year's (HackBU 2026) prize winners, one card per category. */
export function PastWinnersSection() {
  return (
    <Section
      id="past-winners"
      labelledBy="past-winners-title"
      className="bg-cloud"
    >
      <Reveal>
        <div className="max-w-3xl">
          <Eyebrow>HackBU 2026 • Prize winners</Eyebrow>
          <h2
            id="past-winners-title"
            className="font-display text-display-lg text-pine mt-4 font-semibold text-balance"
          >
            What last year&apos;s hackers built.
          </h2>
          <p className="text-lede text-pine mt-5">
            In 24 hours, Binghamton students shipped everything from a
            hand-controlled synthesizer to a TikTok for LeetCode. Here are the
            projects that took home prizes.
          </p>
        </div>
      </Reveal>

      <RevealGroup as="ul" className="mt-12 grid gap-4 md:grid-cols-2">
        {PAST_WINNERS.map((winner) => (
          <RevealItem
            as="li"
            key={winner.prize}
            className="border-frost bg-frost/25 flex flex-col rounded-3xl border p-6 sm:p-8"
          >
            <Eyebrow>{winner.prize}</Eyebrow>
            <h3 className="font-display text-display-md text-pine mt-3 font-semibold">
              <ExternalLink href={winner.url} className={LINK_ON_CLOUD}>
                {winner.project}
              </ExternalLink>
            </h3>
            <p className="text-body text-pine mt-3">{winner.blurb}</p>
            <p className="text-caption text-pine/90 mt-5">
              <span className="font-medium">Team:</span> {winner.team.join(', ')}
            </p>
            {winner.sponsor ? (
              <p className="text-caption text-pine/90 mt-1">
                <span className="font-medium">Category sponsor:</span>{' '}
                {winner.sponsor}
              </p>
            ) : null}
          </RevealItem>
        ))}
      </RevealGroup>

      <Reveal delay={0.1}>
        <p className="text-body text-pine mt-8">
          See every project on the{' '}
          <ExternalLink
            href={PAST_EVENT_GALLERY_URL}
            className={`${LINK_ON_CLOUD} underline underline-offset-4`}
          >
            HackBU 2026 Devpost gallery
          </ExternalLink>
          .
        </p>
      </Reveal>
    </Section>
  )
}
