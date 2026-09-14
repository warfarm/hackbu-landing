import { Block, Caption, Entry, Rows, Rule, SheetSection } from '../kit'
import { LINK_ON_CLOUD } from '../../components/ExternalLink'
import {
  HERO_ALT,
  HERO_HEIGHT,
  HERO_JPG,
  HERO_SRCSET,
  HERO_WIDTH,
} from '../../lib/images'

/**
 * Part 4 — the hero, documented rather than embedded.
 *
 * <Hero> is a 180dvh scroll track with a sticky stage pinned inside it. Dropped
 * into this page it would hijack almost two viewports of the sheet's own
 * scrolling to play an animation that is about the top of the landing page,
 * and the sticky stage would be pinned against the sheet's scroll position
 * rather than its own. So what is here instead is the photograph it is made
 * of, at rest, plus the numbers that drive it.
 *
 * The numbers below are mirrored from src/components/Hero.tsx, which keeps
 * them as module-private constants — there is nothing exported to import. They
 * are the one thing on this sheet that can drift; check them against that file
 * if the hero changes.
 */

/* -------------------------------------------------------------------------- */

type Param = { name: string; value: string; note: string }

const PAN_PARAMS: readonly Param[] = [
  {
    name: 'PAN_START_SCALE',
    value: '1.2',
    note: 'Scale of the photograph at scroll 0, easing to 1 as the pan runs. 1.2 is the most a 1200px source can be magnified before it reads soft on a retina laptop; the photo has no sky-only band, so the old "no buildings at scroll 0" constraint is gone with the illustration.',
  },
  {
    name: 'PAN_SCROLL_FRACTION',
    value: '0.75',
    note: 'The pan completes three-quarters of the way through the pinned scroll (60dvh of it). The last 0.25 (20dvh) is a hold on the finished frame before the stage unpins.',
  },
  {
    name: 'TRACK_HEIGHT',
    value: 'h-[180dvh]',
    note: 'The track exists only to buy scroll distance. The stage inside it is one viewport tall and sticky, so it stays pinned for 80dvh.',
  },
  {
    name: 'HERO_PAN_EASE',
    value: 'cubicBezier(0.4, 0, 0.35, 1)',
    note: 'Eases in and out only gently — the user’s own scrolling supplies the timing, and anything steeper reads as the image lagging behind the finger. Exported from src/lib/motion.ts.',
  },
  {
    name: 'object-position / transform-origin',
    value: 'object-[50%_0%] · origin-top',
    note: 'Pins the photo’s top edge to the top of the stage before any transform, so scale alone drives the pan and there is no translate. 50% horizontally is the Library Tower, which stands at the centre of the frame — so one value serves every screen.',
  },
]

/* -------------------------------------------------------------------------- */

export function HeroPart() {
  return (
    <SheetSection
      id="hero"
      number="4"
      title="The hero"
      intro="The one component on this sheet that is not rendered live. It is a 180dvh scroll track with a sticky stage inside it: embedded here it would take almost two viewports of the sheet’s scrolling and pin itself against the wrong scroll position. What follows is its photograph at rest and the numbers that drive it."
    >
      <Entry
        name="Hero"
        path="src/components/Hero.tsx"
        use="The top of the landing page, and nothing else: a real aerial photograph of the whole campus under snow, with the page’s <h1> across the top of the frame."
      >
        <Block title="See it live">
          <p className="text-body text-pine">
            {/* On cloud, so the cloud treatment: brick hover. */}
            <a href="/" className={`${LINK_ON_CLOUD} underline underline-offset-4`}>
              Open the landing page
            </a>{' '}
            and scroll: the photograph opens at a slight zoom with its top
            edge pinned and settles to its full frame over the first 60dvh.
          </p>
        </Block>

        <Block title="Layer contract">
          <Rows
            rows={[
              {
                name: '<section data-hero>',
                value: 'the scroll track',
                note: 'Taller than the viewport purely to buy scroll distance. No overflow-hidden — an overflow-clipped ancestor would become the sticky element’s scrollport and the stage would never pin.',
              },
              {
                name: '<div data-hero-stage>',
                value: 'sticky top-0, h-dvh',
                note: 'Exactly one viewport tall, and the element that clips the scaled artwork.',
              },
              {
                name: '<div data-hero-artwork>',
                value: 'the photograph',
                note: 'A <picture> — AVIF, then WebP, then the JPEG as the <img src>. It opens at 1.2x and eases back to 1.',
              },
            ]}
          />
        </Block>

        <Block title="The hero photograph, at rest">
          <div className="border-frost overflow-hidden rounded-xl border">
            <picture>
              <source type="image/avif" srcSet={HERO_SRCSET.avif} sizes="(min-width: 64rem) 60rem, 92vw" />
              <source type="image/webp" srcSet={HERO_SRCSET.webp} sizes="(min-width: 64rem) 60rem, 92vw" />
              <img
                src={HERO_JPG}
                alt={HERO_ALT}
                width={HERO_WIDTH}
                height={HERO_HEIGHT}
                decoding="async"
                loading="lazy"
                className="block h-auto w-full"
              />
            </picture>
          </div>
          <Caption>
            public/artwork/photos/hero-campus.jpg — {HERO_WIDTH}×{HERO_HEIGHT},
            with AVIF and WebP derivatives from 640 up to the source’s own
            1200. This is the frame the pan ends on; it opens at 1.2 times
            this size with the top edge pinned, so the foreground plaza is
            what the settle brings in.
          </Caption>
        </Block>

        <Block title="Pan parameters">
          <Rows rows={PAN_PARAMS} />
          <Caption>
            These are module-private constants in src/components/Hero.tsx, not
            props — <b>&lt;Hero&gt;</b> takes none. Nothing configures the hero
            from outside.
          </Caption>
        </Block>

        <Block title="Reduced motion">
          <Rule>
            Under <b>prefers-reduced-motion</b> the pan is pinned to its end
            state — scale 1, the whole photograph — <b>and the track collapses
            from 180dvh to h-dvh</b>. Freezing the animation alone would strand
            the reader in most of a viewport of dead scroll space: a component
            that buys scroll distance has to give it back.
          </Rule>
        </Block>
      </Entry>

      <Entry
        name="usePrefersReducedMotion · HERO_PAN_EASE · rangeProgress"
        path="src/lib/motion.ts"
        use="The project’s motion conventions: what reduced motion means, and the easing and range helpers the hero pan is built from."
      >
        <Block title="API">
          <Rows
            rows={[
              {
                name: 'usePrefersReducedMotion()',
                value: 'boolean',
                note: 'motion’s useReducedMotion() normalised from boolean | null. Every animating component in the project calls this one and renders its resting frame when it is true.',
              },
              {
                name: 'HERO_PAN_EASE',
                value: 'cubicBezier(0.4, 0, 0.35, 1)',
                note: 'The pan’s curve.',
              },
              {
                name: 'rangeProgress(v, from, to)',
                value: 'number',
                note: 'Progress through a sub-window of a 0..1 value, clamped. How the pan carves its own range out of the one scroll value.',
              },
            ]}
          />
        </Block>
        <Block title="Notes">
          <Caption>
            There is exactly one scroll subscription in the project and it is
            motion’s, in <b>Hero.tsx</b> — no hand-rolled scroll listener
            anywhere in src/. motion reads the reduced-motion query once at
            mount and does not re-subscribe, so a mid-session change to the OS
            setting takes effect on the next page load.
          </Caption>
        </Block>
      </Entry>
    </SheetSection>
  )
}
