import { useRef, useState } from 'react'
import { m, useMotionValueEvent, useScroll, useTransform } from 'motion/react'
import {
  HERO_ALT,
  HERO_HEIGHT,
  HERO_JPG,
  HERO_SIZES,
  HERO_SRCSET,
  HERO_WIDTH,
} from '../lib/images'
import {
  HERO_PAN_EASE,
  rangeProgress,
  usePrefersReducedMotion,
} from '../lib/motion'

/**
 * The hero: a real aerial photograph of campus under snow, settling from a
 * slight zoom to its full frame as the reader scrolls, with the page's welcome
 * headline over the sky.
 *
 * Layer contract:
 *
 *   <section data-hero>            the scroll TRACK. Taller than the viewport
 *                                  purely to buy scroll distance for the pan.
 *     <div data-hero-stage>        sticky top-0, exactly one viewport tall.
 *       <div data-hero-artwork>    the photograph, as a <picture> — opened a
 *                                  little magnified and eased back to 1.
 *       <div data-hero-copy>       welcome headline + lede, above the photo.
 *
 * A pine wash and text-shadow keep cloud (cream) type readable over the sky
 * and the hills. (Until 2026-09 this was a cel-shaded *illustration* opened at
 * 3.8x on a sky band, with a drifting cloud-cutout parallax over it; both went
 * when the real photograph landed. A photograph cannot take that magnification
 * — there is no upscaled master behind it and no sky-only band to hide in — so
 * the pan below is a settle, not a reveal.)
 */

/* -------------------------------------------------------------------------- */
/* Geometry                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Starting scale of the photograph.
 *
 * The image is rendered `object-cover` into a stage exactly one viewport tall,
 * with its top edge pinned to the top of the stage (see `origin-top` and the
 * `0%` vertical object-position below). Writing `f1` for the fraction of the
 * image's height that `object-cover` leaves visible at scale 1, **the visible
 * band at scale S runs from 0 to f1/S**. The photograph is 1600 x 600 — wider
 * than any viewport short of 2.667:1 — so cover is height-bound everywhere
 * that matters, `f1 = 1`, and the start frame shows the top 1/1.2 = 83% of the
 * photo: sky, hills, both towers and the buildings, with the foreground plaza
 * arriving as the pan runs. The photograph has no sky-only band to open on
 * (the hills break the horizon at about 0.13 of its height), so unlike the
 * illustration this replaced there is no "no buildings" constraint to satisfy
 * — the buildings *are* the picture.
 *
 * 1.2 is as far as the source can be pushed: the 1600px file is drawn 2400 CSS
 * px wide on a 1440x900 screen even at scale 1 (see HERO_SIZES), so every
 * extra tenth of magnification is visible softness on a retina display. It is
 * enough to read as movement, and the eased curve does the rest. **Keep the
 * `sizes` multiplier in src/lib/images.ts equal to this.**
 */
const PAN_START_SCALE = 1.2

/**
 * Total height of the scroll track. The sticky stage is one viewport tall, so
 * the stage stays pinned for `180 - 100 = 80dvh` of scrolling. (It was 260dvh
 * for the illustration's 3.8x reveal; a 1.2x settle stretched over 160dvh
 * would read as the page having stalled.)
 */
const TRACK_HEIGHT = 'h-[180dvh]'

/**
 * Fraction of the pinned scroll the pan itself consumes. The pan finishes at
 * 0.75 (= 60dvh of scrolling) and the remaining 0.25 (= 20dvh) is a hold on
 * the finished frame before the stage unpins and the hero scrolls away.
 */
const PAN_SCROLL_FRACTION = 0.75

/**
 * Where the photograph sits in the stage, and why it is two values.
 *
 *   object-position `<x> 0%`   the photo's top edge sits on the stage's top
 *                              edge before any transform, at every aspect
 *   transform-origin `top`     scaling then grows downward from that edge
 *
 * The vertical `0%` + `origin-top` pair pins the sky to the top of the stage
 * for all S with no translate at all — the scheme the illustration used, kept
 * because it is aspect-independent: the visible band is `0 .. f1/S`
 * everywhere. (`origin-top` is `50% 0%`, so the horizontal half of the scale
 * still grows about the stage's centre.)
 *
 * The horizontal value is the focal crop, and a 2.667:1 photograph is cropped
 * hard on anything but an ultra-wide screen — a 390x844 phone shows 17% of
 * its width, a 1440x900 laptop 60%. Two subjects compete for that window: the
 * green clock tower filling the left third of the frame (x = 0.10..0.40, the
 * clock face at 0.27..0.35) and the Library Tower at x = 0.67..0.75. Measured
 * against simulated cover-crops of the source:
 *
 *   phones, portrait tablets   `70%`   the Library Tower centred over the
 *                                      plaza; at 50% the window (0.42..0.58)
 *                                      holds neither landmark.
 *   landscape >= 3:2           `50%`   the window is wide enough (>= 56% of
 *                                      the frame) for the clock face AND the
 *                                      Library Tower; 70% would push the clock
 *                                      tower off the left edge.
 *
 * The switch is on aspect ratio, not width, because the aspect ratio is what
 * decides how much of the frame `cover` keeps. Tailwind's arbitrary media
 * variant carries the query; nothing else in the stylesheet needs to know.
 */
const HERO_OBJECT_POSITION =
  'object-[70%_0%] [@media(min-aspect-ratio:3/2)]:object-[50%_0%]'

export function Hero() {
  const trackRef = useRef<HTMLElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  // The page's only scroll subscription, and it is motion's, not ours — no
  // hand-rolled `addEventListener('scroll', ...)` anywhere in src/. Everything
  // downstream derives from this one value.
  const { scrollYProgress: progress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  })

  /**
   * Eased pan progress. Under reduced motion this is pinned to 1 — the resting
   * state — so the illustration renders statically at scale 1 with no
   * scroll-linked movement at all.
   */
  const pan = useTransform(progress, (p) =>
    reducedMotion ? 1 : HERO_PAN_EASE(rangeProgress(p, 0, PAN_SCROLL_FRACTION)),
  )

  const scale = useTransform(
    pan,
    (p) => PAN_START_SCALE + (1 - PAN_START_SCALE) * p,
  )

  /**
   * Is the pan actually moving? `will-change` is held ONLY inside the open
   * interval (0, PAN_SCROLL_FRACTION] — released at rest on both ends.
   *
   * The top release (p = 0) is the load-bearing one, and it is about
   * *sharpness*, not memory (measured live in an 800x455 Chromium pane,
   * 2026-09-03). With the hint present from the first render, the compositor
   * rasters the image layer once around hydration — before or as the start-scale
   * transform lands — and then, because `will-change` tells it not to
   * re-raster on transform change, the start frame the reader sees is that
   * stale raster GPU-stretched to the start scale: blurry at every srcset rung, and showing a
   * subtly wrong crop. (Forced screenshots re-raster and hid this; toggling
   * the hint off live snapped the frame sharp.) With no hint at p = 0 the
   * browser paints the true start frame at full raster quality — this is
   * the frame the page opens on and holds, so it is exactly where quality
   * matters most. When scrolling starts the promotion arrives with the
   * current (start-scale) transform, so the texture is rastered near its largest
   * scale and is only ever GPU-*down*scaled as the pan proceeds — supersampled
   * rather than smeared.
   *
   * The bottom release past `PAN_SCROLL_FRACTION` is P5-7 / P2-8, as before:
   * `scale` stops changing there, but the compositor keeps whatever the hint
   * bought for the life of the document. Measured with CDP `LayerTree` on
   * GPU-backed Edge: at track progress 0.8 the hero `<img>` was still its
   * own layer holding a full-viewport texture (5,130,000 B at 1440x900) with
   * `WillChangeTransform` as its only compositing reason. Dropping the hint
   * lets that texture go.
   *
   * Both directions re-arm when the reader scrolls back into the interval, so
   * neither release is a one-way latch. It is motion's own
   * `useMotionValueEvent` on the single `useScroll` value — still no `scroll`
   * listener in `src/` — and the boolean changes at most twice per traversal,
   * so React bails out of a re-render on every frame either side of a
   * crossing.
   */
  const [panning, setPanning] = useState(() => {
    const p = progress.get()
    return p > 0 && p <= PAN_SCROLL_FRACTION
  })
  useMotionValueEvent(progress, 'change', (p) => {
    setPanning(p > 0 && p <= PAN_SCROLL_FRACTION)
  })

  return (
    <section
      id="top"
      data-hero
      ref={trackRef}
      // The header's logo link points here. Without a tab index the anchor
      // scrolls the page and leaves focus on <body>, so a keyboard user who
      // activates it is returned to the top visually and left where they were
      // in the tab order — the same shape as the skip link's target (P7-2, and
      // P2-4 in src/App.tsx, where the reasoning is written out). -1 keeps it
      // out of the tab order; `focus:outline-none` keeps the programmatic
      // focus from drawing the UA ring around the whole 180dvh track.
      tabIndex={-1}
      aria-labelledby="hero-title"
      // No `overflow-hidden` here: an overflow-clipped ancestor becomes the
      // sticky element's scrollport and the stage would never pin. The stage
      // clips the scaled artwork itself.
      className={`bg-sky relative w-full focus:outline-none ${reducedMotion ? 'h-dvh' : TRACK_HEIGHT}`}
    >
      <div
        data-hero-stage
        className="sticky top-0 h-dvh w-full overflow-hidden"
      >
        <div data-hero-artwork className="absolute inset-0">
          {/*
           * `display: contents` so the <picture> adds no box of its own and
           * the <img>'s `h-full` still resolves against the stage-sized div
           * above it. AVIF first, WebP second, the JPEG as the `<img src>` a
           * browser only reaches if it understands neither.
           */}
          <picture className="contents">
            <source
              type="image/avif"
              srcSet={HERO_SRCSET.avif}
              sizes={HERO_SIZES}
            />
            <source
              type="image/webp"
              srcSet={HERO_SRCSET.webp}
              sizes={HERO_SIZES}
            />
            <m.img
              src={HERO_JPG}
              alt={HERO_ALT}
              width={HERO_WIDTH}
              height={HERO_HEIGHT}
              draggable={false}
              decoding="async"
              fetchPriority="high"
              // `will-change` only while the scale is actually moving: never
              // under reduced motion (where it is pinned to 1), never at
              // rest at scroll 0 (where the hint made the compositor show a
              // stale low-res raster of the start frame), and released past
              // `PAN_SCROLL_FRACTION` — see `panning` above.
              className={`h-full w-full origin-top ${HERO_OBJECT_POSITION} object-cover select-none ${
                reducedMotion || !panning ? '' : 'will-change-transform'
              }`}
              style={{ scale }}
            />
          </picture>
        </div>

        {/*
         * Welcome copy over the sky. Cleared below the fixed header
         * (h-16 / sm:h-20). Pine wash + text-shadow keep the type readable
         * over the sky and the hills behind it.
         */}
        <div
          data-hero-copy
          className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-6 pt-24 sm:pt-28"
        >
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-pine/80 via-pine/45 to-transparent sm:h-64"
          />
          <div className="relative max-w-3xl text-center">
            <h1
              id="hero-title"
              className="font-display text-display-xl text-cloud font-bold text-balance [text-shadow:0_2px_4px_rgb(60_92_72_/_0.85),0_6px_28px_rgb(60_92_72_/_0.55)]"
            >
              Welcome to HackBU
            </h1>
            <p className="text-lede text-cloud mt-3 font-medium text-pretty sm:mt-4 [text-shadow:0_1px_3px_rgb(60_92_72_/_0.8),0_4px_18px_rgb(60_92_72_/_0.5)]">
              Binghamton University&apos;s Premier Hackathon
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
