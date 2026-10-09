import type { ReactNode } from 'react'
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
 * **It replays.** `once: false`, unlike <Reveal>: leaving a section returns it
 * to its starting frame, so arriving again — down *or* back up — slides it in
 * again, which is what makes each stop read as a slide. The <Reveal>s inside
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
const VIEWPORT: MotionProps['viewport'] = { once: false, amount: 0.25 }

export function SnapSlide({
  children,
  align = 'start',
}: {
  children: ReactNode
  /** `end` for the last stop (the footer), which has no section below it. */
  align?: 'start' | 'end'
}) {
  const prefersReducedMotion = usePrefersReducedMotion()

  const motionProps: MotionProps = prefersReducedMotion
    ? { animate: REST, transition: REST_TRANSITION }
    : {
        initial: { opacity: 0, y: DISTANCE },
        whileInView: { opacity: 1, y: 0 },
        viewport: VIEWPORT,
        transition: { duration: 0.7, ease: EASE },
      }

  return (
    <div className={align === 'end' ? 'snap-end' : 'snap-start'}>
      <m.div {...motionProps}>{children}</m.div>
    </div>
  )
}
