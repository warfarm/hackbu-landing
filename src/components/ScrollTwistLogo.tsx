import { m, useScroll, useTransform } from 'motion/react'
import { BEARCAT_MARK } from '../lib/images'
import { usePrefersReducedMotion } from '../lib/motion'

/**
 * HackBU bearcat rides a windy path left→right *and* top→bottom across the
 * whole page scroll, twisting as it goes. Fixed to the viewport so progress
 * maps to the full document, not a single section.
 *
 * Decorative only (`aria-hidden`). Hidden below `lg`.
 */
export function ScrollTwistLogo() {
  const prefersReducedMotion = usePrefersReducedMotion()
  const { scrollYProgress } = useScroll()

  // Path starts after the hero is mostly past; finishes near the footer.
  const x = useTransform(
    scrollYProgress,
    [0.14, 0.28, 0.42, 0.56, 0.7, 0.84, 0.96],
    ['4vw', '32vw', '10vw', '58vw', '24vw', '72vw', '80vw'],
  )
  const y = useTransform(
    scrollYProgress,
    [0.14, 0.3, 0.46, 0.62, 0.78, 0.96],
    ['16vh', '28vh', '42vh', '55vh', '68vh', '80vh'],
  )
  const rotate = useTransform(scrollYProgress, [0.14, 0.96], [-18, 720])
  const rotateY = useTransform(
    scrollYProgress,
    [0.14, 0.35, 0.55, 0.75, 0.96],
    [0, 34, -28, 30, 0],
  )
  const opacity = useTransform(
    scrollYProgress,
    [0.1, 0.14, 0.96, 0.99],
    [0, 1, 1, 0],
  )

  return (
    <aside
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-20 hidden overflow-hidden lg:block"
    >
      <div className="[perspective:700px] relative h-full w-full">
        <m.div
          className="absolute top-0 left-0 origin-center will-change-transform"
          style={
            prefersReducedMotion
              ? { x: '8vw', y: '20vh', opacity: 0.85 }
              : { x, y, rotate, rotateY, opacity }
          }
        >
          <span
            className="brand-mark brand-mark-bearcat bg-fern block drop-shadow-[0_12px_20px_rgb(60_92_72/0.22)]"
            style={{
              height: 'clamp(4.5rem, 10vw, 7rem)',
              aspectRatio: `${BEARCAT_MARK.width} / ${BEARCAT_MARK.height}`,
            }}
          />
        </m.div>
      </div>
    </aside>
  )
}
