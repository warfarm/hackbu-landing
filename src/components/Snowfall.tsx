import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../lib/motion'

/**
 * Falling snow over the whole page: one fixed, full-viewport <canvas>, drawn
 * with requestAnimationFrame. Decorative only (`aria-hidden`), never
 * interactive (`pointer-events-none`).
 *
 * Why a canvas and not DOM particles: one compositor layer whatever the flake
 * count, no per-flake style recalcs, no dependency. It sits at z-20 like the
 * bearcat in `ScrollTwistLogo.tsx` — above section content, below the fixed
 * header (z-50) so snow never falls across the nav bar.
 *
 * The page background is `cloud` (#f7f5ee), which is near-white, so plain
 * white snow would vanish on it. Each flake is a sprite: white core, frost
 * body, faint haze halo — the halo is what reads on cloud, the white core is
 * what reads over the hero photograph.
 *
 * Reduced motion: the resting frame of falling snow is no snow, so this
 * renders nothing (see the convention in `src/lib/motion.ts`).
 *
 * Prerender-safe: the <canvas> is in the markup, but everything that touches
 * `window`, the 2D context or `devicePixelRatio` runs inside the effect.
 */

const MAX_DPR = 2
/** One flake per this many CSS px² of viewport, clamped to [MIN, MAX]. */
const AREA_PER_FLAKE = 11_000
const MIN_FLAKES = 40
const MAX_FLAKES = 140
/** Sprite is drawn once at this size and scaled per flake. */
const SPRITE_PX = 64

type Flake = {
  x: number
  y: number
  /** Radius in CSS px. Larger flakes are "closer": faster, more opaque. */
  r: number
  /** Fall speed, CSS px per second. */
  vy: number
  /** Sway phase and rate (radians, radians per second). */
  phase: number
  sway: number
  swayAmp: number
  alpha: number
}

function makeSprite(): HTMLCanvasElement | null {
  const sprite = document.createElement('canvas')
  sprite.width = SPRITE_PX
  sprite.height = SPRITE_PX
  const ctx = sprite.getContext('2d')
  if (!ctx) return null
  const c = SPRITE_PX / 2
  const g = ctx.createRadialGradient(c, c, 0, c, c, c)
  g.addColorStop(0, 'rgb(255 255 255 / 1)')
  g.addColorStop(0.4, 'rgb(255 255 255 / 0.95)')
  g.addColorStop(0.62, 'rgb(220 227 234 / 0.8)') // frost
  g.addColorStop(0.85, 'rgb(124 153 180 / 0.28)') // haze halo
  g.addColorStop(1, 'rgb(124 153 180 / 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, SPRITE_PX, SPRITE_PX)
  return sprite
}

function makeFlake(width: number, height: number, fromTop: boolean): Flake {
  // Depth: 0 = far (small, slow, faint), 1 = near (big, quick, bright).
  const depth = Math.random() ** 1.6
  const r = 1.4 + depth * 2.8
  return {
    x: Math.random() * width,
    y: fromTop ? -r * 2 : Math.random() * height,
    r,
    vy: 28 + depth * 62 + Math.random() * 10,
    phase: Math.random() * Math.PI * 2,
    sway: 0.6 + Math.random() * 0.9,
    swayAmp: 8 + depth * 18,
    alpha: 0.55 + depth * 0.45,
  }
}

export function Snowfall() {
  const prefersReducedMotion = usePrefersReducedMotion()
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (prefersReducedMotion) return
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const sprite = makeSprite()
    if (!ctx || !sprite) return

    let width = 0
    let height = 0
    let dpr = 1
    let flakes: Flake[] = []
    let raf = 0
    let last = 0
    let running = false
    /** Gentle wind that wanders over time, CSS px per second. */
    let wind = 0
    let windTarget = 0

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const target = Math.round(
        Math.min(MAX_FLAKES, Math.max(MIN_FLAKES, (width * height) / AREA_PER_FLAKE)),
      )
      if (flakes.length > target) flakes.length = target
      while (flakes.length < target) flakes.push(makeFlake(width, height, false))
    }

    const frame = (now: number) => {
      if (!running) return
      raf = requestAnimationFrame(frame)
      // Clamp dt so a background tab or a long frame does not teleport flakes.
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      if (Math.abs(wind - windTarget) < 1) windTarget = (Math.random() - 0.5) * 40
      wind += (windTarget - wind) * dt * 0.4

      ctx.clearRect(0, 0, width, height)
      for (const f of flakes) {
        f.phase += f.sway * dt
        f.y += f.vy * dt
        f.x += (Math.cos(f.phase) * f.swayAmp * 0.6 + wind * (f.r / 4)) * dt
        if (f.y - f.r > height) {
          Object.assign(f, makeFlake(width, height, true))
        } else if (f.x < -f.r * 2) {
          f.x = width + f.r * 2
        } else if (f.x > width + f.r * 2) {
          f.x = -f.r * 2
        }
        const size = f.r * 2
        ctx.globalAlpha = f.alpha
        ctx.drawImage(sprite, f.x - f.r, f.y - f.r, size, size)
      }
      ctx.globalAlpha = 1
    }

    const start = () => {
      if (running) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }
    const onVisibility = () => {
      if (document.hidden) stop()
      else start()
    }

    resize()
    start()
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [prefersReducedMotion])

  if (prefersReducedMotion) return null

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-20 h-full w-full"
    />
  )
}
