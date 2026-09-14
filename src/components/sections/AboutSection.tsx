import { Eyebrow, Section } from '../Layout'
import { ButtonLink } from '../ButtonLink'
import { Reveal, RevealGroup, RevealItem } from '../Reveal'
import { DISCORD_URL, MAILING_LIST_URL } from '../../lib/links'
import {
  BAXTER_ALT,
  BAXTER_HEIGHT,
  BAXTER_PNG,
  BAXTER_WIDTH,
} from '../../lib/images'

/**
 * "About us" — Baxter beside the mission copy, plus Discord and mailing-list
 * CTAs.
 *
 * The page <h1> lives in the hero; this section opens with an <h2> so the
 * outline stays h1 → section h2s with no skipped level.
 *
 * The two CTAs use the same card chrome and two-column grid as the rest of the
 * page's paired blocks. `size="md"` keeps them smaller than the get-involved
 * card's Discord button (`size="lg"` plus `sm:px-10 sm:py-5`).
 *
 * **Reveal.** Header is a standard <Reveal>; the two cards are a RevealGroup.
 * That is safe even though this is the first content block: the hero's track
 * is 260dvh (one viewport under reduced motion, where <Reveal> drops its
 * motion props entirely), so this block is never within the viewport at mount.
 */

const CARD =
  'border-frost bg-cloud flex flex-col rounded-2xl border p-7 sm:p-9'

export function AboutSection() {
  return (
    <Section id="about" labelledBy="about-title" className="bg-cloud">
      <Reveal>
        <header>
          <Eyebrow>About Us</Eyebrow>
          <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-10">
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h2
                id="about-title"
                className="font-display text-display-lg text-pine font-semibold text-balance"
              >
                HackBU exists to foster a community of individuals who solve
                problems through the innovative use of technology.
              </h2>
              <p className="text-lede text-pine mt-4 text-pretty sm:mt-5">
                We host weekly development workshops and hold our own hackathon
                yearly.
              </p>
            </div>
            <img
              src={BAXTER_PNG}
              alt={BAXTER_ALT}
              width={BAXTER_WIDTH}
              height={BAXTER_HEIGHT}
              draggable={false}
              decoding="async"
              className="h-52 w-auto shrink-0 sm:h-64 md:h-72 lg:h-80"
            />
          </div>
        </header>
      </Reveal>

      <RevealGroup as="ul" className="mt-12 grid gap-6 md:grid-cols-2 md:gap-8">
        <RevealItem as="li" className={CARD}>
          <Eyebrow>Discord</Eyebrow>
          <p className="font-display text-display-md text-pine mt-4 font-semibold">
            Join our Discord
          </p>
          <p className="text-body text-pine mt-4">
            The best way to stay up to date on all of our events is to join our
            Discord server:
          </p>
          <div className="mt-auto pt-6">
            <ButtonLink href={DISCORD_URL} className="w-full sm:w-auto">
              Join our Discord
            </ButtonLink>
          </div>
        </RevealItem>
        <RevealItem as="li" className={CARD}>
          <Eyebrow>Mailing list</Eyebrow>
          <p className="font-display text-display-md text-pine mt-4 font-semibold">
            Join our Mailing List
          </p>
          <p className="text-body text-pine mt-4">
            We also send updates on our hackathon event to our mailing list:
          </p>
          <div className="mt-auto pt-6">
            <ButtonLink href={MAILING_LIST_URL} className="w-full sm:w-auto">
              Join our Mailing List
            </ButtonLink>
          </div>
        </RevealItem>
      </RevealGroup>

      <Reveal delay={0.1}>
        <p className="text-lede text-pine mt-8 max-w-2xl">
          No membership or commitment is required to be a part of our club! We
          look forward to seeing you at our events.
        </p>
      </Reveal>
    </Section>
  )
}
