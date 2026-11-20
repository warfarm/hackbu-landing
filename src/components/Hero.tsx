import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { m, useMotionValue, useScroll, useTransform } from 'motion/react'
import {
  HERO_INTRO_SECONDS,
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
 *     <div data-hero-stage>        sticky top-0, one viewport tall, and empty:
 *                                  wherever the scene is cut away, the page's
 *                                  own ground (body::before) shows through.
 *       cut window                 the exit, the way igloo.inc cuts from one
 *                                  scene to the next: a clipping box whose
 *                                  bottom is the diagonal "ice cut" edge,
 *                                  rising in the last stretch of the track.
 *                                  Its content is moved back by as much, so
 *                                  the scene stays put and only the edge
 *                                  moves (transforms only).
 *         <div data-hero-ground>   masks the scene out behind the lockup band
 *                                  (src/index.css), and rises with the band.
 *           CSS sky + <SnowCanvas> the gradient is the fallback before and
 *                                  without WebGL. The scene is told where the
 *                                  header ends and the lockup begins, and
 *                                  frames the logo in the band between.
 *       <div data-hero-cut>        the cut edge's hairline.
 *       "Scroll down" hint         top right; fades out on the first scroll.
 *       <div data-hero-copy>       the lockup band. It waits for the scene's
 *                                  intro, then rises into place. Its facts
 *                                  panel grows (up to 1.8x, as room allows, on
 *                                  wide screens) as the ice cut rises past it,
 *                                  and the headline keeps level with its
 *                                  middle.
 *
 * The cut, the hint and the panel's growth are scrubbed by the scroll (motion
 * values, never a React render), so they reverse when the reader scrolls back
 * up. None of them moves under reduced motion, where the track collapses to
 * one screen and the lockup is there from the start.
 */

/**
 * The ice cut's sheet: where its top sits, as a share of the stage's height,
 * over the hero track — off the bottom until two thirds of the way, then up
 * to 40% by the end.
 */
function cutFraction(progress: number): number {
  return 1 - 0.6 * rangeProgress(progress, 0.66, 1)
}

/**
 * The cut's diagonal edge, matching the sheet's SVG: the edge lies in its
 * top `depth` of the stage, running from `left` down the SVG's height at the
 * left side to `right` at the right (both out of 1).
 */
const CUT_EDGE = { depth: 0.22, left: 0.78, right: 0.06 } as const

/** Where the cut's edge is below the sheet's top at `x` (0 left, 1 right), as a share of the stage's height. */
function cutEdgeAt(x: number): number {
  return CUT_EDGE.depth * (CUT_EDGE.left - (CUT_EDGE.left - CUT_EDGE.right) * x)
}

/**
 * How long the lockup waits for the scene to start its intro, in
 * milliseconds. A scene that starts in time is waited for to the intro's end;
 * one that is slower to arrive does not hold the band back.
 */
const INTRO_GRACE_MS = 2500

/** Total height of the scroll track: the stage stays pinned for 80dvh. */
const TRACK_HEIGHT = 'h-[180dvh]'

/**
 * Fraction of the pinned scroll the camera move consumes. It finishes at 0.75
 * (= 60dvh of scrolling); the remaining 20dvh is a hold on the finished frame.
 */
const PAN_SCROLL_FRACTION = 0.75

/**
 * The most the facts panel grows by as the ice cut rises past it. The room
 * beside the headline usually stops it sooner: about 1.7x at 1440px wide,
 * 1.5x at 1280px, and 1.15x at 1024px.
 */
const PANEL_GROWTH_MAX = 1.8

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
  const stageRef = useRef<HTMLDivElement>(null)
  const titleBlockRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  /**
   * How far the facts panel may grow as the hero scrolls: up to
   * PANEL_GROWTH_MAX, capped by the room it has — beside the headline to its
   * left, and below the header above. 1 (no growth) where the lockup is
   * stacked or short, and always in the prerender; measured in an effect.
   */
  const [panelRoom, setPanelRoom] = useState(1)
  /**
   * The stage, panel and headline geometry the growth is fitted to, in stage
   * pixels: written by the measuring effect, read on every scroll step (a
   * ref, so no React render). `edge` and `titleEdge` are the cut's edge below
   * the sheet's top at the grown panel's left side and at the headline's.
   */
  const panelFit = useRef({
    stageHeight: 0,
    foot: 0,
    height: 1,
    edge: 0,
    titleTop: 0,
    bandTop: 0,
    titleEdge: 0,
  })
  /** The stage's size, for the cut window's slant (set in an effect). */
  const stageWidth = useMotionValue(0)
  const stageHeight = useMotionValue(0)
  /**
   * The lockup band's entrance, on the stage as `data-copy` (src/index.css).
   * Unset in the prerender, where a timed fallback stands in; 'wait' holds
   * the band below the frame while the scene's intro plays; 'in' lets it rise.
   */
  const [copyState, setCopyState] = useState<'wait' | 'in'>()
  const introGrace = useRef(0)
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
  /**
   * The facts panel grows from its bottom-right corner only into the ice
   * cut, where the scene is cut away: it eases up over the last quarter of the track, and its top
   * is held a little below the cut's diagonal edge, so it never spreads over
   * the snow scene. Until the cut has risen past the panel's top, it does not
   * grow at all. (Tracking the edge alone would pack the whole growth into a
   * single wheel notch.)
   */
  const panelScale = useTransform(progress, (p) => {
    if (reducedMotion || panelRoom <= 1) return 1
    const { stageHeight, foot, height, edge } = panelFit.current
    const cutTop = stageHeight * (cutFraction(p) + edge)
    const fits = (foot - cutTop - 12) / height
    const eased = 1 + (panelRoom - 1) * HERO_PAN_EASE(rangeProgress(p, 0.75, 1))
    return Math.max(1, Math.min(eased, fits))
  })
  /**
   * The headline keeps level with the middle of the growing panel: it rises
   * by half the panel's growth. It never rises past the top of the band's
   * ground while the cut is still below it, so it stays off the scene.
   */
  const titleY = useTransform([progress, panelScale], ([p = 0, scale = 1]: number[]) => {
    if (scale <= 1) return 0
    const { stageHeight: tall, height, titleTop, bandTop, titleEdge } = panelFit.current
    const highest = Math.min(bandTop, tall * (cutFraction(p) + titleEdge) + 12)
    return Math.min(0, Math.max((-(scale - 1) * height) / 2, highest - titleTop))
  })
  /** The ice cut rises over the last third of the track, to just above the lockup. */
  const cutY = useTransform(progress, (p) => `${cutFraction(p) * 100}%`)
  /**
   * The cut window: a box whose bottom edge lies on the cut's edge, slanted
   * with a skew to the edge's slope on this stage and moved up with the cut.
   * Its content gets the inverse (a vertical move and a vertical skew
   * commute), so the scene inside stays exactly where it was.
   */
  const cutWindowY = useTransform([progress, stageHeight], ([p = 0, tall = 0]: number[]) =>
    reducedMotion ? 0 : tall * (cutFraction(p) + cutEdgeAt(0.5) - 1),
  )
  const cutWindowSkew = useTransform([stageWidth, stageHeight], ([wide = 0, tall = 0]: number[]) =>
    reducedMotion || wide < 1
      ? 0
      : (-Math.atan(((cutEdgeAt(0) - cutEdgeAt(1)) * tall) / wide) * 180) / Math.PI,
  )
  const cutBackY = useTransform(cutWindowY, (y) => -y)
  const cutBackSkew = useTransform(cutWindowSkew, (skew) => -skew)

  /**
   * The scene tells the band when its intro starts and ends. Only a band
   * being held is let go: one the prerender's fallback is already moving
   * keeps that animation's timing.
   */
  const release = useCallback(() => {
    window.clearTimeout(introGrace.current)
    setCopyState((state) => (state === 'wait' ? 'in' : state))
  }, [])
  const onIntro = useCallback(
    (phase: 'start' | 'end') => {
      if (phase === 'end') release()
      else window.clearTimeout(introGrace.current)
    },
    [release],
  )

  useEffect(() => {
    const copy = copyRef.current
    const stage = stageRef.current
    if (!copy || !stage) return
    // The prerender's fallback rises after the intro's length on its own. If
    // it has already begun (a slow hydration), it is left to finish;
    // otherwise the band is held until the scene's intro is over.
    const fallback = copy
      .getAnimations()
      .find(
        (animation) =>
          animation instanceof CSSAnimation && animation.animationName === 'hero-band-in',
      )
    if (!fallback || Number(fallback.currentTime ?? 0) >= HERO_INTRO_SECONDS * 1000) return
    setCopyState('wait')
    introGrace.current = window.setTimeout(release, INTRO_GRACE_MS)
    // Someone tabbing to the headline or to Register gets the band at once,
    // never a focus ring out of sight below the frame.
    copy.addEventListener('focusin', release)
    return () => {
      window.clearTimeout(introGrace.current)
      copy.removeEventListener('focusin', release)
    }
  }, [release])

  useEffect(() => {
    const stage = stageRef.current
    const copy = copyRef.current
    if (!stage || !copy) return
    // The band's height sizes the hole in the scene behind it (src/index.css).
    const measure = () => {
      stageWidth.set(stage.offsetWidth)
      stageHeight.set(stage.offsetHeight)
      stage.style.setProperty('--hero-copy-height', `${copy.offsetHeight}px`)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(stage)
    observer.observe(copy)
    return () => observer.disconnect()
  }, [stageWidth, stageHeight])

  useEffect(() => {
    const stage = stageRef.current
    const copy = copyRef.current
    const lockup = lockupRef.current
    const title = titleBlockRef.current
    const panel = panelRef.current
    if (!stage || !copy || !lockup || !title || !panel) return
    // Only where the panel stands beside the headline with height to spare.
    const query = window.matchMedia('(width >= 64rem) and (height >= 40rem)')
    const measure = () => {
      if (!query.matches) {
        setPanelRoom(1)
        return
      }
      // Layout offsets, in stage pixels: neither the band's entrance nor the
      // panel's own scale moves them.
      const width = panel.offsetWidth
      const height = panel.offsetHeight
      const stageWide = Math.max(stage.offsetWidth, 1)
      const top = copy.offsetTop + lockup.offsetTop
      const left = copy.offsetLeft + lockup.offsetLeft
      const gap = panel.offsetLeft - (title.offsetLeft + title.offsetWidth) - 32
      // The panel's foot stays put (it grows from its bottom edge), so the
      // room above is from the header to that foot.
      const foot = top + panel.offsetTop + height
      const sideways = 1 + Math.max(0, gap) / Math.max(width, 1)
      const upwards = (foot - HEADER_HEIGHT - 24) / Math.max(height, 1)
      const room = Math.max(1, Math.min(PANEL_GROWTH_MAX, sideways, upwards))
      // The cut's edge falls toward the left, so across the grown panel it is
      // lowest at its left side. The panel grows from its right edge, so that
      // edge never moves.
      const right = left + panel.offsetLeft + width
      panelFit.current = {
        stageHeight: stage.offsetHeight,
        foot,
        height: Math.max(height, 1),
        edge: cutEdgeAt((right - width * room) / stageWide),
        // The top of the eyebrow, which hangs above the headline block.
        titleTop:
          top +
          title.offsetTop +
          Math.min(0, title.firstElementChild instanceof HTMLElement ? title.firstElementChild.offsetTop : 0),
        bandTop: copy.offsetTop,
        titleEdge: cutEdgeAt((left + title.offsetLeft) / stageWide),
      }
      setPanelRoom(room)
    }
    measure()
    // The stage follows the window's height (which the lockup may not), and
    // the headline's width changes when its web font arrives: watch all three.
    const observer = new ResizeObserver(measure)
    observer.observe(lockup)
    observer.observe(stage)
    observer.observe(title)
    query.addEventListener('change', measure)
    return () => {
      observer.disconnect()
      query.removeEventListener('change', measure)
    }
  }, [])

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
        ref={stageRef}
        data-hero-stage
        data-copy={copyState}
        className="sticky top-0 h-dvh w-full overflow-clip"
      >
        {/*
         * The cut window, a quarter of the stage taller at the top so its
         * slanted top edge never shows. It and its content share a transform
         * origin (the stage's bottom centre) so the two transforms cancel.
         */}
        <m.div
          aria-hidden="true"
          style={{ y: cutWindowY, skewY: cutWindowSkew }}
          className="pointer-events-none absolute inset-x-0 top-[-25%] bottom-0 origin-bottom overflow-clip"
        >
          <m.div
            style={{ y: cutBackY, skewY: cutBackSkew }}
            className="absolute inset-x-0 bottom-0 h-[80%] origin-bottom"
          >
            {/* Twice the stage's height, so it can rise with the band. */}
            <div data-hero-ground className="absolute inset-x-0 top-[-100%] bottom-0">
              <div
                data-hero-ground-inner
                className="from-haze/60 via-horizon/40 to-frost absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b"
              >
                <SnowCanvas
                  variant="hero"
                  progress={pan}
                  frameTop={HEADER_HEIGHT}
                  frameAbove={lockupRef}
                  etching={etching}
                  onIntro={onIntro}
                  className="absolute inset-0"
                />
              </div>
            </div>
          </m.div>
        </m.div>

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
            <path
              d="M0,78 L1440,6"
              vectorEffect="non-scaling-stroke"
              className="stroke-ink/40 fill-none"
              strokeWidth="1"
            />
          </svg>
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
         * The lockup band, on the page's own ground: the scene is masked out
         * behind it (`data-hero-ground`), so it is ink on frost, 6.28:1,
         * whatever the scene does. Side by side wherever there is width
         * (`lockup-wide`), the headline level with the panel's middle;
         * stacked on portrait phones. All spacing shrinks with the screen's
         * height, so a phone on its side keeps it below the header.
         */}
        <div
          ref={copyRef}
          data-hero-copy
          className="absolute inset-x-0 bottom-0 z-10 px-6 pb-[clamp(0.875rem,4dvh,2.25rem)] sm:px-8"
        >
          <div
            ref={lockupRef}
            className="lockup-wide:flex-row lockup-wide:items-center lockup-wide:justify-between relative mx-auto flex max-w-[116rem] flex-col gap-[min(1.25rem,2.4dvh)]"
          >
            {/*
             * Side by side, the eyebrow hangs above the headline out of flow,
             * so the row centres the headline itself on the panel.
             */}
            <m.div ref={titleBlockRef} style={{ y: titleY }} className="relative">
              <p className="hud-label text-ink lockup-wide:absolute lockup-wide:bottom-full lockup-wide:left-0 lockup-wide:mb-[min(0.75rem,1.6dvh)] lockup-wide:whitespace-nowrap text-[0.6875rem] font-medium tracking-[0.12em] uppercase sm:text-[0.75rem]">
                {EYEBROW}
              </p>
              <h1
                id="hero-title"
                className="font-display text-display-hero lockup-wide:text-display-hero-wide text-ink lockup-wide:mt-0 mt-[min(0.75rem,1.6dvh)] font-semibold whitespace-nowrap"
              >
                <span className="lockup-wide:inline block">HackBU</span>{' '}
                <span className="bg-horizon lockup-wide:inline-block block w-fit px-[0.1em]">
                  {EVENT_YEAR}
                </span>
              </h1>
            </m.div>

            {/*
             * It grows only below the cut's edge, where the scene is cut away,
             * so it stays ink on the page's ground (6.28:1) at any size.
             */}
            <m.div
              ref={panelRef}
              style={{ scale: panelScale, originX: 1, originY: 1 }}
              className="lockup-wide:w-[min(22rem,36vw)] w-full shrink-0"
            >
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
            </m.div>
          </div>
        </div>
      </div>
    </section>
  )
}
