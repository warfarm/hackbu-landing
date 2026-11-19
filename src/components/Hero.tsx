import { useMemo, useRef, useSyncExternalStore } from 'react'
import { m, useScroll, useTransform } from 'motion/react'
import {
  HERO_PAN_EASE,
  rangeProgress,
  usePrefersReducedMotion,
} from '../lib/motion'
import { HACKATHON_DATES, REGISTER_PATH, VENUE } from '../lib/links'
import { SnowCanvas } from '../three/SnowCanvas'
import type { SnowEtching } from '../three/snowScene'
import { ButtonLink } from './ButtonLink'

/**
 * The hero: a full-bleed three.js world with the page's instruments laid over
 * it, after igloo.inc's approach.
 *
 * Behind: the HackBU logo lying under snow on a hillside, lit by a low sun
 * from the left. Moving a mouse over it brushes the snow away and the
 * lettering glows through; the snow slumps and drifts slowly back.
 * Scrolling pulls the camera back and down toward the skyline. In front: small monospaced
 * chrome in the corners, and across the bottom the "HackBU 2027" lockup with
 * the dates, the venue, a days-to-go count and Register.
 *
 * Unlike the reference, all of this is real HTML (prerendered, selectable,
 * read by a screen reader), every word sits on a surface that passes contrast,
 * and the page scrolls natively.
 *
 * Layer contract:
 *
 *   <section data-hero>            the scroll TRACK. Taller than the viewport
 *                                  purely to buy distance for the camera move.
 *     <div data-hero-stage>        sticky top-0, one viewport tall. Its CSS
 *                                  gradient is the fallback before and without
 *                                  WebGL.
 *       <SnowCanvas>               the scene. It is told where the header ends
 *                                  and the lockup begins, and frames the logo
 *                                  in the band between.
 *       <div data-hero-cut>        the exit: a frost sheet with a diagonal
 *                                  "ice cut" edge that rises over the scene in
 *                                  the last stretch of the track, the way
 *                                  igloo.inc cuts from one scene to the next.
 *       "Scroll down" hint         top right; fades out on the first scroll.
 *       <div data-hero-copy>       the lockup, on <div data-hero-scrim>.
 *
 * The cut and the hint are scrubbed by the scroll (motion values, never a
 * React render), so they reverse when the reader scrolls back up. Neither
 * exists under reduced motion, where the track collapses to one screen.
 */

/** Total height of the scroll track: the stage stays pinned for 80dvh. */
const TRACK_HEIGHT = 'h-[180dvh]'

/**
 * Fraction of the pinned scroll the camera move consumes. It finishes at 0.75
 * (= 60dvh of scrolling); the remaining 20dvh is a hold on the finished frame.
 */
const PAN_SCROLL_FRACTION = 0.75

/** How much of the top of the stage the fixed header hides, in CSS pixels. */
const HEADER_HEIGHT = 80

/**
 * The lockup's year and the dates, read out of HACKATHON_DATES rather than
 * retyped, so a date change is still one edit in src/lib/links.ts. The date
 * drops the year because the headline directly beside it already says it.
 */
const EVENT_YEAR = HACKATHON_DATES.start.slice(0, 4)

/** The lockup's eyebrow, also etched into the snow above the logo. */
const EYEBROW = "Binghamton University's Premier Hackathon"
const DATES_WITHOUT_YEAR = HACKATHON_DATES.short.replace(/,?\s*\d{4}$/, '')

/** Midnight UTC of the first day, as a plain calendar date. */
const START_DAY = Date.UTC(
  Number(HACKATHON_DATES.start.slice(0, 4)),
  Number(HACKATHON_DATES.start.slice(5, 7)) - 1,
  Number(HACKATHON_DATES.start.slice(8, 10)),
)

/**
 * "73 days to go": whole calendar days from the reader's own today to the first
 * day. Empty from the first day on, so the row simply goes away.
 */
function daysToGoLabel(now = new Date()): string {
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.round((START_DAY - today) / 86_400_000)
  if (days <= 0) return ''
  return `${days} ${days === 1 ? 'day' : 'days'} to go`
}

/**
 * The count as the visitor's today sees it, never the build's. The prerender
 * and the hydrating render both use the empty server snapshot and agree; React
 * re-renders with the real value straight after. (`suppressHydrationWarning`
 * would not do: React 19 leaves the prerendered text in place, so the number
 * would be frozen at the build date.)
 */
const noSubscription = () => () => {}
function useDaysToGo(): string {
  return useSyncExternalStore(noSubscription, daysToGoLabel, () => '')
}

/** False in the prerender and the hydrating render, true after. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  )
}

const FACT_ROW =
  'border-ink/25 flex items-baseline justify-between gap-4 border-b py-[min(0.45rem,1dvh)]'
const FACT_TERM = 'text-ink text-[0.6875rem] font-medium tracking-[0.1em] uppercase'
const FACT_VALUE = 'text-ink text-right text-caption font-medium uppercase'

export function Hero() {
  const trackRef = useRef<HTMLElement>(null)
  const lockupRef = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  const daysToGo = useDaysToGo()
  const hydrated = useHydrated()
  /**
   * The lockup's eyebrow and facts again, pressed into the snow above and
   * below the logo.
   */
  const etching = useMemo(
    (): SnowEtching => ({
      heading: EYEBROW,
      facts: [
        ['Dates', DATES_WITHOUT_YEAR],
        ['Venue', VENUE.name],
        ...(daysToGo ? [['Countdown', daysToGo] as const] : []),
      ],
    }),
    [daysToGo],
  )

  // The page's only scroll subscription, and it is motion's, not ours.
  const { scrollYProgress: progress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  })

  /**
   * Eased camera progress, 0 at the top of the page and 1 at rest. Pinned to 1
   * under reduced motion, so one still frame is drawn (brushing still works:
   * it only ever happens because the visitor moved).
   * <SnowCanvas> reads it with `.get()`, so scrolling never re-renders React.
   */
  const pan = useTransform(progress, (p) =>
    reducedMotion ? 1 : HERO_PAN_EASE(rangeProgress(p, 0, PAN_SCROLL_FRACTION)),
  )
  /*
   * Function transforms, not the [input] -> [output] form: motion hands an
   * array-mapped opacity straight to a native scroll timeline, and with this
   * track's offsets that came out inverted (the hint faded *in* on scroll).
   */
  /** The hint leaves with the first few percent of scroll. */
  const hintOpacity = useTransform(progress, (p) => 1 - rangeProgress(p, 0, 0.05))
  /** The brushing hint goes as the ice cut starts to cover the snow. */
  const brushHintOpacity = useTransform(progress, (p) =>
    reducedMotion ? 1 : 1 - rangeProgress(p, 0.6, 0.75),
  )
  /** The ice cut rises over the last third of the track, to just above the lockup. */
  const cutY = useTransform(progress, (p) => `${100 - 60 * rangeProgress(p, 0.66, 1)}%`)

  return (
    <section
      id="top"
      data-hero
      ref={trackRef}
      // The header's logo link points here, so it has to be able to take
      // focus; -1 keeps it out of the tab order, and the programmatic focus
      // must not draw a ring around the whole track.
      tabIndex={-1}
      aria-labelledby="hero-title"
      // No `overflow-hidden` here: an overflow-clipped ancestor becomes the
      // sticky element's scrollport and the stage would never pin.
      className={`relative w-full focus:outline-none ${reducedMotion ? 'h-dvh' : TRACK_HEIGHT}`}
    >
      <div
        data-hero-stage
        className="from-haze/60 via-horizon/40 to-frost sticky top-0 h-dvh w-full overflow-hidden bg-gradient-to-b"
      >
        <SnowCanvas
          variant="hero"
          progress={pan}
          frameTop={HEADER_HEIGHT}
          frameAbove={lockupRef}
          etching={etching}
          className="absolute inset-0"
        />

        <m.div
          aria-hidden="true"
          data-hero-cut
          style={{ y: cutY }}
          className="pointer-events-none absolute inset-0 z-[5] motion-reduce:hidden"
        >
          <svg
            viewBox="0 0 1440 100"
            preserveAspectRatio="none"
            focusable="false"
            className="absolute inset-x-0 top-0 block h-[22%] w-full"
          >
            <path d="M0,100 V78 L1440,6 V100 Z" className="fill-frost" />
            <path
              d="M0,78 L1440,6"
              vectorEffect="non-scaling-stroke"
              className="stroke-ink/40 fill-none"
              strokeWidth="1"
            />
          </svg>
          <div className="bg-frost absolute inset-x-0 top-[22%] bottom-0" />
        </m.div>

        <m.div
          aria-hidden="true"
          style={{ opacity: hintOpacity }}
          className="pointer-events-none absolute top-24 right-6 z-10 sm:right-8 lg:right-[max(2rem,calc(50vw-58rem))] motion-reduce:hidden"
        >
          <p className="text-ink bg-frost animate-intro-rise px-2 py-1 text-[0.6875rem] font-medium tracking-[0.12em] uppercase [animation-delay:1.4s]">
            {'// Scroll down to discover '}
            <span className="motion-safe:animate-hint-bob inline-block">↓</span>
          </p>
        </m.div>

        {/*
         * The lockup, on the frost scrim (the `hero-scrim` utility in
         * src/index.css): ink type on frost, 6.28:1, whatever the scene does
         * behind it. Side by side wherever there is width (`lockup-wide`),
         * stacked on portrait phones. All spacing shrinks with the screen's
         * height, so a phone on its side keeps it below the header.
         */}
        <div
          data-hero-copy
          className="absolute inset-x-0 bottom-0 z-10 px-6 pb-[clamp(0.875rem,4dvh,2.25rem)] sm:px-8"
        >
          <div
            aria-hidden="true"
            data-hero-scrim
            className="hero-scrim absolute inset-x-0 bottom-0"
          />
          <div
            ref={lockupRef}
            className="lockup-wide:flex-row lockup-wide:items-end lockup-wide:justify-between relative mx-auto flex max-w-[116rem] flex-col gap-[min(1.25rem,2.4dvh)]"
          >
            <div>
              <p className="hud-label text-ink animate-intro-rise motion-reduce:animate-none text-[0.6875rem] font-medium tracking-[0.12em] uppercase [animation-delay:0.35s] sm:text-[0.75rem]">
                {EYEBROW}
              </p>
              {/*
               * The one thing to do here, so say so — but only where it can be
               * done: a mouse, a wide screen, and a scene that has drawn
               * (`.hero-hint` in src/index.css). On solid frost, so it keeps
               * 6.28:1 whatever is cleared behind it.
               */}
              {/* The wrapper fades it as the ice cut covers the snow; the
                  intro animation on the <p> would override an opacity set
                  on the <p> itself. */}
              <m.div
                aria-hidden="true"
                style={{ opacity: brushHintOpacity }}
                className="absolute bottom-full -left-2 mb-2"
              >
                <p className="hero-hint text-ink bg-frost animate-intro-rise motion-reduce:animate-none hidden px-2 py-1 text-[0.6875rem] font-medium tracking-[0.12em] uppercase [animation-delay:1s]">
                  {'// Move over the snow to uncover the logo'}
                </p>
              </m.div>
              <h1
                id="hero-title"
                className="font-display text-display-hero lockup-wide:text-display-hero-wide text-ink animate-intro-rise motion-reduce:animate-none mt-[min(0.75rem,1.6dvh)] font-semibold whitespace-nowrap [animation-delay:0.45s]"
              >
                <span className="lockup-wide:inline block">HackBU</span>{' '}
                <span className="bg-horizon lockup-wide:inline-block block w-fit px-[0.1em]">
                  {EVENT_YEAR}
                </span>
              </h1>
            </div>

            <div className="animate-intro-rise motion-reduce:animate-none lockup-wide:w-[min(22rem,36vw)] w-full shrink-0 [animation-delay:0.6s]">
              <dl>
                <div className={FACT_ROW}>
                  <dt className={FACT_TERM}>Dates</dt>
                  <dd className={FACT_VALUE}>
                    <time dateTime={HACKATHON_DATES.start}>
                      {DATES_WITHOUT_YEAR}
                    </time>
                  </dd>
                </div>
                <div className={FACT_ROW}>
                  <dt className={FACT_TERM}>Venue</dt>
                  <dd className={FACT_VALUE}>{VENUE.name}</dd>
                </div>
                {/*
                 * Reserved until hydration so the count arriving cannot move
                 * the lockup; gone once the event has started.
                 */}
                {daysToGo || !hydrated ? (
                  <div className={FACT_ROW}>
                    <dt className={FACT_TERM}>Countdown</dt>
                    <dd className={`${FACT_VALUE} min-h-[1lh]`}>{daysToGo}</dd>
                  </div>
                ) : null}
              </dl>
              <ButtonLink
                href={REGISTER_PATH}
                size="lg"
                tone="register"
                className="mt-[min(0.875rem,1.8dvh)] w-full py-[min(0.875rem,1.9dvh)]"
              >
                Register now
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
