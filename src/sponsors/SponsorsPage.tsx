import { domAnimation, LazyMotion } from 'motion/react'
import { SiteHeader } from '../components/SiteHeader'
import { SiteFooter } from '../components/SiteFooter'
import { SnowdriftDivider } from '../components/SnowdriftDivider'
import { SPONSORS_PATH } from '../lib/links'
import { SponsorsComingSoonSection } from './SponsorsComingSoonSection'
import { WhySponsorSection } from './WhySponsorSection'
import { SponsorshipTiersSection } from './SponsorshipTiersSection'
import { SponsorsContactSection } from './SponsorsContactSection'

/**
 * Sponsors page:
 * - Coming soon section for sponsors not yet acquired
 * - Reasons why organizations should sponsor HackBU
 * - Sponsorship tiers chart matching the HackBU 2027 sponsorship packet
 * - Contact information
 *
 * One `<LazyMotion features={domAnimation} strict>` around the whole tree, for
 * the reason written out in `src/App.tsx` and `src/about/AboutPage.tsx`: the
 * `<Reveal>`s render `m.*`, which need a provider, and the wrapper sits inside
 * this component so `renderSponsors()` in `src/entry-server.tsx` renders the
 * same tree the client hydrates.
 */
export function SponsorsPage() {
  return (
    <LazyMotion features={domAnimation} strict>
      <div className="bg-cloud font-sans text-pine min-h-screen">
        <a
          href="#main"
          className="bg-cloud text-pine focus:outline-pine sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:rounded-full focus:px-4 focus:py-2 focus:outline-2"
        >
          Skip to content
        </a>

        <SiteHeader homeHref="/" currentHref={SPONSORS_PATH} />

        <main id="main" className="pt-16 sm:pt-20">
          <SponsorsComingSoonSection />

          <SnowdriftDivider variant="drift-a" />
          <WhySponsorSection />

          <SnowdriftDivider variant="drift-b" />
          <SponsorshipTiersSection />

          <SnowdriftDivider variant="drift-c" />
          <SponsorsContactSection />
        </main>

        <SnowdriftDivider variant="cloud-to-frost" />
        <SiteFooter />
      </div>
    </LazyMotion>
  )
}
