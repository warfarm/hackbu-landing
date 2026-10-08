import { domAnimation, LazyMotion } from 'motion/react'
import { SiteHeader } from '../components/SiteHeader'
import { SnowdriftDivider } from '../components/SnowdriftDivider'
import { SiteFooter } from '../components/SiteFooter'
import { HackathonIntroSection } from '../components/sections/hackathons/HackathonIntroSection'
// import { TimelineSection } from '../components/sections/hackathons/TimelineSection'
import { HACKATHONS_PATH } from '../lib/links'

/**
 * Hackathons — what the annual event is, then the weekend's timeline
 * (`#timeline`, which the landing page links to). Registration is its own page.
 *
 * The two sections are both on `cloud`, so a `drift-a` snowdrift separates
 * them — the first divider on the page, as on About us and Sponsors — and the
 * `cloud-to-frost` drift below still settles the last section into the footer.
 *
 * One `<LazyMotion features={domAnimation} strict>` around the whole tree, for
 * the reason written out in `src/App.tsx` and `src/about/AboutPage.tsx`: the
 * `<Reveal>`s render `m.*`, which need a provider, and the wrapper sits inside
 * this component so `renderHackathons()` in `src/entry-server.tsx` renders the
 * same tree the client hydrates.
 */
export default function HackathonsApp() {
  return (
    <LazyMotion features={domAnimation} strict>
      <div id="top" className="bg-cloud font-sans text-pine min-h-screen">
        <a
          href="#main"
          className="bg-cloud text-pine focus:outline-pine sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:rounded-full focus:px-4 focus:py-2 focus:outline-2"
        >
          Skip to content
        </a>

        <SiteHeader currentHref={HACKATHONS_PATH} />

        <main id="main" className="pt-16 sm:pt-20">
          <HackathonIntroSection />
          {/* Hidden for now.
          <SnowdriftDivider variant="drift-a" />
          <TimelineSection />
          */}
        </main>

        <SnowdriftDivider variant="cloud-to-frost" />
        <SiteFooter />
      </div>
    </LazyMotion>
  )
}
