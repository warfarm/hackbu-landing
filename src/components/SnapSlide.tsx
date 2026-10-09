import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cubicBezier, m, type MotionProps } from 'motion/react'
import { usePrefersReducedMotion } from '../lib/motion'

/**
 * One stop on the landing page's snap scroll: a scroll-snap target whose
 * contents slide up from below every time the reader arrives at it.
 *
 * The page opts in with `data-snap-page` on its root, which turns on
 * `scroll-snap-type: y mandatory` on <html> (`html:has([data-snap-page])` in
 * src/index.css) — so only the page that asks for it snaps, and no script
 * touches the scroll. Each <SnapSlide> is a `snap-start` point; a section
 * taller than the window is an oversized snap area, inside which browsers
 * let the reader scroll freely, so the FAQ and the hero's pan still work.
 *
 * **Two boxes, deliberately.** The outer <div> is the snap target and is
 * never transformed: a snap position is measured from the box, and a box
 * that is mid-slide would move its own snap point. The inner `m.div` is what
 * slides. It wraps the whole section — backdrop photograph included — so the
 * section arrives as one sheet, not as text moving across a still picture.
 *
 * **The outer box is also what is watched.** An IntersectionObserver on the
 * still outer box decides, and the inner one only follows. Watching the sliding box itself
 * (`whileInView`) fed back into its own trigger: at the foot of the page the
 * FAQ is ~20% on screen, under the 25% threshold, so it slid down — which
 * moved more of it on screen, over 25%, so it slid back up — and it
 * oscillated there indefinitely (measured: 60–67px, opacity 0.44–0.50).
 *
 * **It replays**, unlike <Reveal>: a section that has left the window
 * entirely returns to its starting frame, so arriving again — down *or* back
 * up — slides it in again, which is what makes each stop read as a slide. The <Reveal>s inside
 * a section still run once, as before, after the first arrival.
 *
 * Reduced motion: the resting frame, no slide, and src/index.css turns the
 * snapping off as well — snapping is the page moving on its own. The same
 * `animate: REST` shape as <Reveal>, for the hydration reason written out
 * there.
 */

/** How far below its resting place a section starts, in px. */
const DISTANCE = 120

const REST = { opacity: 1, y: 0 } as const
const REST_TRANSITION = { duration: 0 } as const

const EASE = cubicBezier(0.22, 0.61, 0.36, 1)

/**
 * Fires once a quarter of the section is on screen — early enough that the
 * slide is under way while the snap is still settling.
 */
const IN_VIEW_AMOUNT = 0.25

const VARIANTS = {
  hidden: { opacity: 0, y: DISTANCE },
  shown: { opacity: 1, y: 0 },
} as const

export function SnapSlide({
  children,
  align = 'start',
}: {
  children: ReactNode
  /** `end` for the last stop (the footer), which has no section below it. */
  align?: 'start' | 'end'
}) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const stopRef = useRef<HTMLDivElement>(null)

  /*
   * Two thresholds, so a section never vanishes while part of it is still on
   * screen: it slides in once a quarter of it is visible, and is reset for
   * the next arrival only once it has left the window entirely. With one
   * threshold the FAQ, ~20% visible above the footer at the foot of the page,
   * faded out and left a blank band there.
   */
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const stop = stopRef.current
    if (!stop) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        // A quarter of the section, *or* a quarter of the window: a section
        // much taller than the window can fill a third of it while still
        // under 25% of itself — the FAQ above the footer, after a jump
        // straight to the foot of the page, stayed invisible on the ratio
        // alone.
        const windowShare =
          entry.intersectionRect.height / (entry.rootBounds?.height || innerHeight)
        if (entry.intersectionRatio >= IN_VIEW_AMOUNT || windowShare >= IN_VIEW_AMOUNT) {
          setShown(true)
        } else if (!entry.isIntersecting) {
          setShown(false)
        }
      },
      // Fine steps up to the quarter mark, so the window-share test is
      // re-run as the section scrolls in, not only at the two thresholds.
      { threshold: [0, 0.05, 0.1, 0.15, 0.2, IN_VIEW_AMOUNT] },
    )
    observer.observe(stop)
    return () => observer.disconnect()
  }, [])

  const motionProps: MotionProps = prefersReducedMotion
    ? { animate: REST, transition: REST_TRANSITION }
    : {
        initial: 'hidden',
        animate: shown ? 'shown' : 'hidden',
        variants: VARIANTS,
        transition: { duration: 0.7, ease: EASE },
      }

  return (
    <div ref={stopRef} className={align === 'end' ? 'snap-end' : 'snap-start'}>
      <m.div {...motionProps}>{children}</m.div>
    </div>
  )
}
