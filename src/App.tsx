import { domAnimation, LazyMotion } from 'motion/react'
import { SiteHeader } from './components/SiteHeader'
import { Hero } from './components/Hero'
import { SnowdriftDivider } from './components/SnowdriftDivider'
import { SponsorsPreviewSection } from './components/sections/SponsorsPreviewSection'
import { PrizeTracksSection } from './components/sections/PrizeTracksSection'
import { RegisterSection } from './components/sections/RegisterSection'
import { QuestionsSection } from './components/sections/QuestionsSection'
import { SiteFooter } from './components/SiteFooter'

/**
 * Page shell — the HackBU 2027 landing page.
 *
 * The home page is the hackathon's page now (Saturday 30 – Sunday 31 January
 * 2027, in the University Union). The club itself — the weekly workshops, the
 * calendar, the organizers — lives on About us (/about), and the sections that
 * used to introduce it here (About, Get involved, Contact) are no longer on
 * this page; they are still showcased on the component sheet, which is why
 * their files remain.
 *
 * Order, top to bottom:
 *
 *   fixed header
 *   Hero                    the banner: three.js snow scene, <h1>, dates,
 *                           venue and the Register link
 *   SponsorsPreviewSection  2027 sponsors: "coming soon", and /sponsors
 *   PrizeTracksSection      last year's five prize tracks as a wall of ice
 *                           blocks; choose one to read it
 *   RegisterSection         the conversion point: /register, and /application
 *                           for people who already applied
 *   QuestionsSection        the hackathon FAQ, with the map of the Union
 *   footer on frost
 *
 * The order is the reader's: the hero says what and when, then who is behind it
 * and what can be won, then the ask, then the leftover doubts — with the
 * questions last because "where exactly is it?" is the one people still have
 * after deciding to come. The banner carries a Register link too, so nobody
 * has to scroll to act.
 *
 * Content sections sit on the page's ice ground, separated by the diagonal
 * "ice cut" dividers (`SnowdriftDivider`), rotated so no two in a row match.
 *
 * The hero is the only element the scroll work touches; see
 * src/components/Hero.tsx for its layer contract.
 *
 * The whole tree sits inside one <LazyMotion features={domAnimation} strict>.
 * `motion.*` components carry motion's *whole* feature set with them — drag,
 * pan and layout projection included — which is ~50 KB of the shared chunk this
 * page uses none of: there is no drag, no `layout`/`layoutId`, no
 * <AnimatePresence> anywhere in `src/`. The `m.*` components carry no features
 * at all and take them from this provider instead, and `domAnimation` is
 * exactly animations + gestures — which is where `whileInView` lives, so the
 * section reveals still work. `strict` makes the saving enforceable rather than
 * conventional: rendering a `motion.*` component below this point throws, so
 * the full bundle cannot creep back in one component at a time. See P5-2.
 */
export default function App() {
  return (
    <LazyMotion features={domAnimation} strict>
      <div className="font-sans text-ink min-h-screen">
        <a
          href="#main"
          className="bg-frost text-ink focus:outline-ink sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:rounded-none focus:px-4 focus:py-2 focus:outline-2"
        >
          Skip to content
        </a>

        <SiteHeader homeHref="#top" intro />

        {/*
         * `tabIndex={-1}` so the skip link above actually moves focus.
         *
         * Activating a fragment link whose target is not focusable moves only the
         * *sequential focus navigation starting point*: Chrome, Edge and Firefox
         * implement it, so the next Tab lands inside <main>, but Safari does not
         * unless Full Keyboard Access is on — where the skip link would silently
         * do nothing. -1 keeps the element out of the tab order and makes it a
         * real focus target (technique H69/G1). See P2-4.
         *
         * `focus:outline-none` is scoped to this element and to the hero's #top
         * for the same reason: both are only ever focused programmatically, by an
         * in-page anchor, and Chromium's :focus-visible heuristic *does* match
         * that — which would paint the UA's default ring around the entire page
         * content. Nothing else on the page suppresses an outline, and the two
         * elements this appears on carry no other focus treatment to lose.
         */}
        <main id="main" tabIndex={-1} className="focus:outline-none">
          <Hero />

          {/* Dividers are "ice cuts"; see SnowdriftDivider.tsx. */}
          <SnowdriftDivider variant="drift-a" />
          <SponsorsPreviewSection />

          <SnowdriftDivider variant="drift-b" />
          <PrizeTracksSection />

          <SnowdriftDivider variant="drift-c" />
          <RegisterSection />

          <SnowdriftDivider variant="drift-a" />
          <QuestionsSection />
        </main>

        <SnowdriftDivider variant="cloud-to-frost" />
        <SiteFooter />
      </div>
    </LazyMotion>
  )
}
