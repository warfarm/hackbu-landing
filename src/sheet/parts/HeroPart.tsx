import { Block, Caption, Entry, Rows, Rule, SheetSection } from '../kit'
import { LINK_ON_CLOUD } from '../../components/ExternalLink'
import {
  CAMPUS_ALT,
  CAMPUS_HEIGHT,
  CAMPUS_PNG,
  CAMPUS_SRCSET,
  CAMPUS_WIDTH,
} from '../../lib/images'

/**
 * Part 4 — the hero, documented rather than embedded.
 *
 * <Hero> is a 260dvh scroll track with a sticky stage pinned inside it. Dropped
 * into this page it would hijack three viewports of the sheet's own scrolling
 * to play an animation that is about the top of the landing page, and the
 * sticky stage would be pinned against the sheet's scroll position rather than
 * its own. So what is here instead is the artwork it is made of, at rest, plus
 * the numbers that drive it.
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
    value: '3.8',
    note: 'Scale of the illustration at scroll 0, easing to 1 as the pan runs. At 3.8 the stage shows at most the top 0.263 of the image at every aspect ratio — the first brick begins at 0.2763 of the image height, so the binding constraint is scale > 3.62.',
  },
  {
    name: 'PAN_SCROLL_FRACTION',
    value: '0.75',
    note: 'The pan completes three-quarters of the way through the pinned scroll (120dvh of it). The last 0.25 (40dvh) is a hold on the finished frame before the stage unpins.',
  },
  {
    name: 'TRACK_HEIGHT',
    value: 'h-[260dvh]',
    note: 'The track exists only to buy scroll distance. The stage inside it is one viewport tall and sticky, so it stays pinned for 160dvh.',
  },
  {
    name: 'HERO_PAN_EASE',
    value: 'cubicBezier(0.4, 0, 0.35, 1)',
    note: 'Eases in and out only gently — the user’s own scrolling supplies the timing, and anything steeper reads as the image lagging behind the finger. Exported from src/lib/motion.ts.',
  },
  {
    name: 'object-position / transform-origin',
    value: 'object-[49%_0%] · origin-top',
    note: 'Pins the drawn content’s top edge to the top of the stage before any transform, so scale alone drives the pan and there is no translate. 49% horizontally is the Library Tower’s centre.',
  },
]

/* -------------------------------------------------------------------------- */

export function HeroPart() {
  return (
    <SheetSection
      id="hero"
      number="4"
      title="The hero"
      intro="The one component on this sheet that is not rendered live. It is a 260dvh scroll track with a sticky stage inside it: embedded here it would take three viewports of the sheet’s scrolling and pin itself against the wrong scroll position. What follows is its artwork at rest and the numbers that drive it."
    >
      <Entry
        name="Hero"
        path="src/components/Hero.tsx"
        use="The top of the landing page, and nothing else. It is illustration only — no copy sits over it at any scroll position."
      >
        <Block title="See it live">
          <p className="text-body text-pine">
            {/* On cloud, so the cloud treatment: brick hover. */}
            <a href="/" className={`${LINK_ON_CLOUD} underline underline-offset-4`}>
              Open the landing page
            </a>{' '}
            and scroll: the illustration starts magnified on the sky and eases
            down to the whole campus over the first 120dvh.
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
                value: 'the illustration',
                note: 'A <picture> — AVIF, then WebP, then the PNG as the <img src>. It is scaled up and panned down.',
              },
            ]}
          />
        </Block>

        <Block title="The campus illustration, at rest">
          <div className="border-frost overflow-hidden rounded-xl border">
            <picture>
              <source type="image/avif" srcSet={CAMPUS_SRCSET.avif} sizes="(min-width: 64rem) 60rem, 92vw" />
              <source type="image/webp" srcSet={CAMPUS_SRCSET.webp} sizes="(min-width: 64rem) 60rem, 92vw" />
              <img
                src={CAMPUS_PNG}
                alt={CAMPUS_ALT}
                width={CAMPUS_WIDTH}
                height={CAMPUS_HEIGHT}
                decoding="async"
                loading="lazy"
                className="block h-auto w-full"
              />
            </picture>
          </div>
          <Caption>
            public/artwork/campus/Campus.png — {CAMPUS_WIDTH}×{CAMPUS_HEIGHT},
            with AVIF and WebP derivatives from 640 up to a 4x-upscaled 6688.
            This is the frame the pan ends on; it opens at 3.8 times this
            size, showing only the sky and the bare winter hills.
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
            state — scale 1, the whole campus — <b>and the track collapses from
            260dvh to h-dvh</b>. Freezing the animation alone would strand the
            reader in two viewports of dead scroll space: a component that buys
            scroll distance has to give it back.
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
