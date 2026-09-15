import { Section, SectionHeader } from '../Layout'
import { ButtonLink } from '../ButtonLink'
import { ExternalLink, LINK_ON_FROST } from '../ExternalLink'
import { Reveal } from '../Reveal'
import { SectionPhoto } from '../SectionPhoto'
import { DISCORD_URL, MAILING_LIST_URL } from '../../lib/links'
import { SECTION_PHOTOS } from '../../lib/images'

/**
 * "Get involved" — the conversion point of the whole page.
 *
 * The headline leads with the thing a hesitant first-year most needs to hear,
 * and the card below carries the page's largest brick button. The mailing list
 * is deliberately demoted to a text link so it never competes with it.
 *
 * The card is `bg-frost`, so that link takes the frost treatment — an underline
 * on hover, never brick. See LINK_ON_FROST in ExternalLink.tsx.
 *
 * The photograph — two students walking a snowed-in campus path, which is
 * "show up to a workshop when it suits you" as a picture — is a bleed from
 * `md` up: it runs down the right edge of the window for the full height of
 * the section, behind the header and the card (see `.photo-bleed` in
 * src/index.css). The header and the card are both held to half the column,
 * so the copy ends where the photo's feathered edge begins and nothing sits
 * on the picture itself. Both are `relative z-10`, above the absolutely
 * positioned photo. Below `md` the photo is a 3:2 block in flow between the
 * header and the card.
 */
export function GetInvolvedSection() {
  return (
    <Section
      id="get-involved"
      labelledBy="get-involved-title"
      className="bg-cloud overflow-x-clip"
    >
      <div className="relative flex flex-col">
        <Reveal className="relative z-10 md:max-w-[50%]">
          <SectionHeader
            eyebrow="Get involved"
            titleId="get-involved-title"
            title="No membership or commitment required."
            lede="There’s no application, no dues, and no attendance to keep up. Show up to a workshop when it suits you, skip the ones that don’t. We announce everything we do in the Discord, so joining it is the whole first step."
          />
        </Reveal>

        <Reveal className="photo-bleed mt-10 md:mt-0" delay={0.05}>
          <SectionPhoto
            photo={SECTION_PHOTOS.snowWalk}
            className="aspect-[3/2] w-full md:aspect-auto md:h-full"
          />
        </Reveal>

        <Reveal delay={0.1} className="relative z-10 md:max-w-[50%]">
          {/*
           * `border-stone/60`, not a frost edge: frost on a frost fill
           * measures 1.00:1 — a declaration that cannot render (P4-3). The
           * hairline inside the same card already uses `stone/60` (below), so
           * the card's edge and its internal rule are now one treatment.
           *
           * The button sits under the copy rather than beside it: at half
           * the column the card is never wide enough for both on one line.
           */}
          <div className="border-stone/60 bg-frost mt-12 rounded-3xl border p-8 sm:p-12">
            <div className="flex flex-col items-start gap-8">
              <div className="max-w-md">
                <p className="font-display text-display-md text-pine font-semibold">
                  Join the HackBU Discord
                </p>
                <p className="text-body text-pine mt-3">
                  It’s where we announce workshops, where people post what
                  they’re building, and where you can ask a question before you
                  know the right words for it.
                </p>
              </div>
              <ButtonLink
                href={DISCORD_URL}
                size="lg"
                className="w-full sm:w-auto sm:px-10 sm:py-5"
              >
                Join the Discord
              </ButtonLink>
            </div>

            <p className="text-caption text-pine/90 border-stone/60 mt-8 border-t pt-6">
              The mailing list is for hackathon updates — dates, registration
              and what to expect.{' '}
              <ExternalLink
                href={MAILING_LIST_URL}
                className={`${LINK_ON_FROST} underline underline-offset-4`}
              >
                Sign up for the mailing list
              </ExternalLink>{' '}
              if you’d rather get those by email.
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}
