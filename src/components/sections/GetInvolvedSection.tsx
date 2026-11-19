import { Section, SectionHeader } from '../Layout'
import { ButtonLink } from '../ButtonLink'
import { ExternalLink, LINK_ON_FROST } from '../ExternalLink'
import { Reveal } from '../Reveal'
import { SnowCanvas } from '../../three/SnowCanvas'
import { DISCORD_URL, MAILING_LIST_URL } from '../../lib/links'

/**
 * "Get involved" — the conversion point of the whole page.
 *
 * The headline leads with the thing a hesitant first-year most needs to hear,
 * and the card below carries the page's largest button. The mailing list
 * is deliberately demoted to a text link so it never competes with it.
 *
 * That link takes the underline hover. See LINK_ON_FROST in ExternalLink.tsx.
 *
 * The picture is the `igloo` scene (src/three/), and it is a bleed from
 * `md` up: it runs down the right edge of the window for the full height of
 * the section, behind the header and the card (see `.scene-bleed` in
 * src/index.css). The header and the card are both held to half the column,
 * so the copy ends where the scene's feathered edge begins and nothing sits
 * on the scene itself. Both are `relative z-10`, above the absolutely
 * positioned scene. Below `md` the scene is a 3:2 block in flow between the
 * header and the card.
 */
export function GetInvolvedSection() {
  return (
    <Section
      id="get-involved"
      labelledBy="get-involved-title"
      className="overflow-x-clip"
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

        <Reveal className="scene-bleed mt-10 md:mt-0" delay={0.05}>
          <SnowCanvas
            variant="igloo"
            callouts={{ title: ["Get involved","No dues"], reading: ["Discord","Mailing list"] }}
            className="scene-feather aspect-[3/2] w-full md:aspect-auto md:h-full"
          />
        </Reveal>

        <Reveal delay={0.1} className="relative z-10 md:max-w-[50%]">
          {/*
           * The button sits under the copy rather than beside it: at half
           * the column the card is never wide enough for both on one line.
           */}
          <div className="hud-panel mt-12 rounded-3xl border p-8 sm:p-12">
            <div className="flex flex-col items-start gap-8">
              <div className="max-w-md">
                <p className="font-display text-display-md text-ink font-semibold">
                  Join the HackBU Discord
                </p>
                <p className="text-body text-ink mt-3">
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

            <p className="text-caption text-ink border-ink/20 mt-8 border-t pt-6">
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
