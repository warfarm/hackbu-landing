import { Section, SectionHeader } from '../Layout'
import { ButtonLink } from '../ButtonLink'
import { LINK_ON_FROST, MailLink } from '../ExternalLink'
import { Reveal, RevealGroup, RevealItem } from '../Reveal'
import { CONTACT_EMAIL, SPONSORS_PATH } from '../../lib/links'

/**
 * "Sponsors" on the landing page — honest about the fact that HackBU 2027's
 * sponsors are not confirmed yet, and pointed at the companies who could
 * change that.
 *
 * **No names, no logos, no placeholders that look like either.** The Sponsors
 * page itself says "Coming soon" (src/sponsors/SponsorsComingSoonSection.tsx),
 * and this section says the same thing in the same treatment — a frost-tinted
 * panel with the words set large — rather than a grid of grey logo slots,
 * which would read as a broken image wall. When sponsors are confirmed, that
 * left panel is where their logos go; nothing else here needs to change.
 *
 * **Who it is for.** A hacker scrolling the page learns that sponsors exist
 * and what they bring (mentors, judges, prize categories); a company reading
 * it gets the one action that matters to them, the Sponsors page, where the
 * tiers, benefits and the packet request live. Everything this section says a
 * sponsor does is a line from that page's tier table
 * (src/sponsors/SponsorshipTiersSection.tsx) — send engineers, judge, sponsor a
 * prize category — so nothing is promised here that the packet does not offer.
 *
 * **Surfaces.** The section is cloud; the call-to-action card is frost with a
 * `stone/60` edge, the same card as the old Get involved section (frost on
 * frost would be an edge that cannot render, P4-3), so its email link takes
 * the frost treatment — underline on hover, never brick (LINK_ON_FROST). The
 * button is the site's <ButtonLink> at `md`: one size below the Registration
 * section's, which is the page's main conversion and keeps the largest one.
 */
export function SponsorsPreviewSection() {
  return (
    <Section id="sponsors" labelledBy="sponsors-title" className="bg-cloud">
      <Reveal>
        <SectionHeader
          eyebrow="Sponsors"
          titleId="sponsors-title"
          title="Our 2027 sponsors are coming soon."
          lede="HackBU is backed by companies that send engineers to mentor and judge, run tech talks and put up their own prize categories. We’ll list this year’s sponsors here as they’re confirmed."
        />
      </Reveal>

      <RevealGroup className="mt-12 grid gap-6 md:grid-cols-2">
        <RevealItem className="border-frost bg-frost/25 flex min-h-[16rem] flex-col items-center justify-center rounded-3xl border p-8 text-center sm:p-12">
          <p className="font-display text-display-lg text-pine font-semibold">
            Coming soon
          </p>
          <p className="text-caption text-pine/90 mt-3 text-balance">
            HackBU 2027’s sponsors will be announced here.
          </p>
        </RevealItem>

        <RevealItem className="border-stone/60 bg-frost flex flex-col rounded-3xl border p-8 sm:p-12">
          <p className="font-display text-display-md text-pine font-semibold">
            Want your company here?
          </p>
          <p className="text-body text-pine mt-3 max-w-xl">
            Meet Binghamton’s student developers, put your API in their hands
            for a weekend, and sponsor a prize category. The tiers, what each
            one includes, and how to request our sponsorship packet are on the
            Sponsors page.
          </p>
          <div className="mt-8">
            <ButtonLink href={SPONSORS_PATH} className="w-full sm:w-auto">
              Sponsor HackBU 2027
            </ButtonLink>
          </div>
          <p className="text-caption text-pine/90 border-stone/60 mt-8 border-t pt-6">
            Questions first? Email{' '}
            <MailLink
              email={CONTACT_EMAIL}
              className={`${LINK_ON_FROST} underline underline-offset-4`}
            />
            .
          </p>
        </RevealItem>
      </RevealGroup>
    </Section>
  )
}
