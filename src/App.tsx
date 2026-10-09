import { domAnimation, LazyMotion } from 'motion/react'
import { SiteHeader } from './components/SiteHeader'
import { Hero } from './components/Hero'
import { SnowdriftDivider } from './components/SnowdriftDivider'
import { Snowfall } from './components/Snowfall'
import { SnapSlide } from './components/SnapSlide'
import { EventOverviewSection } from './components/sections/EventOverviewSection'
import { SponsorsPreviewSection } from './components/sections/SponsorsPreviewSection'
// import { PrizeTracksSection } from './components/sections/PrizeTracksSection'
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
 *   Hero                    the banner: campus photograph, <h1>, dates,
 *                           venue and the Discord link
 *   EventOverviewSection    what HackBU 2027 is — when, where, who, teams —
 *                           and the link to the schedule on /hackathons
 *   SponsorsPreviewSection  2027 sponsors: "coming soon", and /sponsors
 *   PrizeTracksSection      last year's five prize tracks on a spinning ring;
 *                           hover, tap or focus a track to read it
 *   QuestionsSection        the hackathon FAQ, with the map of the Union
 *   footer on frost
 *
 * The order is the reader's: first what the event is, then who is behind it
 * and what can be won, then the leftover doubts — with the questions last
 * because "where exactly is it?" is the one people still have after deciding
 * to come. The banner carries the Discord link, so nobody has to scroll to act.
 *
 * Content sections all sit on cloud, separated by the `drift-*` snowdrift
 * dividers (a frost bank with cloud drifts either side). SnowdriftDivider's
 * rule is to add a variant rather than repeat one in a row, so the three are
 * rotated a → b → c down the page, starting from `drift-c` under the hero (the
 * reasoning for that one is at the divider).
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
      {/* `data-snap-page` turns on the snap scroll — see SnapSlide.tsx. */}
      <div data-snap-page className="bg-cloud font-sans text-pine min-h-screen">
        <a
          href="#main"
          className="bg-cloud text-pine focus:outline-pine sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:rounded-full focus:px-4 focus:py-2 focus:outline-2"
        >
          Skip to content
        </a>

        <SiteHeader homeHref="#top" intro />
        <Snowfall />

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
          {/*
           * The hero is the first snap point but does not slide: it is what
           * the page opens on. Its 180dvh track is an oversized snap area, so
           * the scroll-driven pan inside it runs freely.
           */}
          <div className="snap-start">
            <Hero />
          </div>

          {/*
           * A `drift-*` variant, not a sky-backed one. The divider is only ever
           * *seen* after the stage unpins, i.e. after the pan has finished, and
           * the finished frame ends on the snow-covered foreground plaza of the
           * photograph — near-white snow cut by grey trodden paths. A saturated
           * blue band under that would read as a stripe. (A `sky-to-cloud`
           * variant did exist for the hero boundary, from when the hero's bottom
           * edge was open sky. Nothing rendered it after this moved, and it has
           * since been removed.)
           *
           * The `drift-*` variants band `bg-frost` with cloud-coloured drifts top
           * and bottom, which under the plaza reads as a bank of settled snow
           * carrying the eye into the page — the thing the component was built to
           * do. `drift-c` specifically, so the rotation below can run a → b → c
           * and its next use is as far down the page
           * as three shapes allow.
           */}
          <SnowdriftDivider variant="drift-c" />
          <SnapSlide>
            <EventOverviewSection />
          </SnapSlide>

          <SnowdriftDivider variant="drift-a" />
          <SnapSlide>
            <SponsorsPreviewSection />
          </SnapSlide>

          {/* Hidden for now.
          <SnowdriftDivider variant="drift-b" />
          <PrizeTracksSection />
          */}

          <SnowdriftDivider variant="drift-a" />
          <SnapSlide>
            <QuestionsSection />
          </SnapSlide>
        </main>

        {/* The last stop: aligned by its end, so the page can reach the bottom. */}
        <div className="snap-end">
          <SnowdriftDivider variant="cloud-to-frost" />
          <SiteFooter />
        </div>
      </div>
    </LazyMotion>
  )
}
