import { Eyebrow, Section } from '../Layout'
import { ButtonLink } from '../ButtonLink'
import { Reveal, RevealGroup, RevealItem } from '../Reveal'
import { DISCORD_URL, MAILING_LIST_URL } from '../../lib/links'
import { SectionPhoto } from '../SectionPhoto'
import { SECTION_PHOTOS } from '../../lib/images'

/**
 * "About us" — the mission copy, then the Discord and mailing-list CTAs with
 * the winter plaza photograph running down the right of them. The header is
 * capped at half the column like every other text block beside a bleed, so
 * the headline never runs across the whole window. (Baxter used to stand at
 * the right of the header; the mascot was dropped when the photo bleeds
 * arrived — two pictures in one section fought each other.)
 *
 * The photograph is the section's one <SectionPhoto>: the green clock tower
 * and the Library Tower from the air, students crossing the snow. From `md`
 * up it is a bleed (see `.photo-bleed` in src/index.css): the two cards stack
 * in the left half of the column and the photo fills the window's right edge
 * for the height of the stack, feathered into the copy and the window. Cards
 * and closing line stop at the midpoint, the same cap as every other text
 * block beside a bleed, so nothing sits on the picture itself.
 * The file is a wide 1600 x 600 frame, so the near-square box shows less than
 * half of it; `object-[35%_50%]` keeps the crop on the clock tower and the
 * buildings behind it rather than the empty hillside in the file's centre.
 * Below `md` it is a band in flow (16:9 on phones, its own 8:3 from `sm`)
 * between the mission statement and the cards, so the copy reads first and
 * the picture answers "where".
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
    <Section
      id="about"
      labelledBy="about-title"
      className="bg-cloud overflow-x-clip"
    >
      <Reveal>
        <header className="md:max-w-[50%]">
          <Eyebrow>About Us</Eyebrow>
          <h2
            id="about-title"
            className="font-display text-display-lg text-pine mt-4 font-semibold text-balance"
          >
            HackBU exists to foster a community of individuals who solve
            problems through the innovative use of technology.
          </h2>
          <p className="text-lede text-pine mt-4 text-pretty sm:mt-5">
            We host weekly development workshops and hold our own hackathon
            yearly.
          </p>
        </header>
      </Reveal>

      <div className="relative mt-12 flex flex-col">
        <Reveal className="photo-bleed" delay={0.05}>
          <SectionPhoto
            photo={SECTION_PHOTOS.plazaWinter}
            className="aspect-[16/9] w-full sm:aspect-[8/3] md:aspect-auto md:h-full"
            imgClassName="md:object-[35%_50%]"
          />
        </Reveal>

        <RevealGroup
          as="ul"
          className="relative z-10 mt-12 grid gap-6 md:mt-0 md:max-w-[50%]"
        >
          <RevealItem as="li" className={CARD}>
            <Eyebrow>Discord</Eyebrow>
            <p className="font-display text-display-md text-pine mt-4 font-semibold">
              Join our Discord
            </p>
            <p className="text-body text-pine mt-4">
              The best way to stay up to date on all of our events is to join
              our Discord server:
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

        <Reveal delay={0.1} className="relative z-10 md:max-w-[50%]">
          <p className="text-lede text-pine mt-8 max-w-2xl">
            No membership or commitment is required to be a part of our club!
            We look forward to seeing you at our events.
          </p>
        </Reveal>
      </div>
    </Section>
  )
}
