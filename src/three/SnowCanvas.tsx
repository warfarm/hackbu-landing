import { useEffect, useRef, useState, type RefObject } from 'react'
import type { MotionValue } from 'motion/react'
import { HERO_INTRO_SECONDS, usePrefersReducedMotion } from '../lib/motion'
import { readPalette } from './palette'
import type { SnowEtching, SnowSceneHandle, SnowVariant } from './snowScene'

/**
 * A three.js scene in a box: the hero's buried logo, or a section's block of ice.
 *
 * The component is the frame; `snowScene.ts` is the picture. This file is in
 * every page's bundle and costs almost nothing; the scene module (and
 * three.js with it) is a dynamic `import()` that only runs in the browser,
 * the first time a canvas comes near the viewport.
 *
 * Prerender-safe: the markup is one wrapper and one empty <canvas>, the same
 * on the server and on the client's first render. WebGL, `devicePixelRatio`,
 * the observers and the palette are all read inside the effect.
 *
 * Decorative: the canvas is `aria-hidden` and never takes pointer events. It
 * replaces photographs that carried descriptions, but a procedural scene has
 * nothing to describe that the page's copy does not already say. The optional
 * callouts repeat facts from the section, so they are hidden from the
 * accessibility tree too.
 *
 * Colour: the palette is read from the `--snow-*` custom properties that
 * `.snow-scene` (src/index.css) maps to the `@theme` tokens, so the scene
 * cannot drift from the stylesheet and no hex is written here.
 *
 * Motion:
 *   - the frame loop runs only while the box is on screen and the tab is
 *     visible, so three canvases on one page cost one canvas's worth of GPU;
 *   - under reduced motion there is no loop at all — one still frame is drawn
 *     (no falling snow, no sway, camera at rest) and redrawn on resize;
 *   - the canvas fades in once its first frame exists, opacity only.
 *
 * No hardware WebGL2 (a software renderer is refused on purpose), a palette
 * that cannot be read, a scene chunk that fails to download, or a context
 * lost mid-session: nothing is drawn and nothing throws. The box is then
 * removed from layout (`hidden`), so below `md` — where a vignette is a
 * block in flow — a scene that cannot run does not leave its own blank box
 * between a section's header and its cards (the slot's top margin, which
 * belongs to the section, stays). Whatever sits behind the box, the hero's
 * CSS sky or the page's cloud, is the fallback.
 */

/** Past this the extra pixels cost more than they show on a soft scene. */
const MAX_DPR = 1.75

const NO_ETCHING: SnowEtching = { facts: [] }

/**
 * An element's top in the page's layout, from its offsets: unlike a bounding
 * box, it ignores transforms, so the hero's lockup reads where it rests even
 * while it is moved out of the way for its entrance.
 */
function layoutTop(element: HTMLElement): number {
  let top = 0
  for (let node: Element | null = element; node instanceof HTMLElement; node = node.offsetParent) {
    top += node.offsetTop
  }
  return top
}

export function SnowCanvas({
  variant,
  progress,
  atRest = false,
  frameTop = 0,
  frameAbove,
  callouts,
  etching,
  onIntro,
  className = '',
}: {
  variant: SnowVariant
  /**
   * The hero's eased scroll progress, 0..1. Read every frame with `.get()`,
   * so it never causes a React render. Omitted, a scene follows its own travel
   * through the viewport.
   */
  progress?: MotionValue<number>
  /** Draw one still, finished frame: no loop, no scroll, no pointer. */
  atRest?: boolean
  /**
   * Hero only: the scene frames its subject in the band of the box that page
   * chrome and copy leave free. `frameTop` is how many CSS pixels at the top
   * are hidden (the fixed header); `frameAbove` is an element drawn over the
   * lower part of the box (the lockup) — the band ends at its top edge. Both
   * are read in the effect, never during render. Omitted, the band is the box.
   */
  frameTop?: number
  frameAbove?: RefObject<HTMLElement | null>
  /** Instrument-style labels pinned to two corners of a section's scene. */
  callouts?: { title: readonly [string, string]; reading: readonly [string, string] }
  /**
   * Hero only: the text etched into the snow around the logo. Pass a stable
   * object (memoised): each new one redraws the etching.
   */
  etching?: SnowEtching
  /**
   * Hero only: told 'start' when the scene draws its first frame (its intro
   * begins) and 'end' once the intro is over, or at once when there is no
   * intro (reduced motion) or no scene (no WebGL, a failed chunk, a lost
   * context). Read through a ref, so a new function does not rebuild the scene.
   */
  onIntro?: (phase: 'start' | 'end') => void
  className?: string
}) {
  const reducedMotion = usePrefersReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)
  // Set only from the effect, so the server and the first client render agree.
  const [unavailable, setUnavailable] = useState(false)
  // The etching changes without rebuilding the scene: the latest lines wait
  // here for the scene to boot, and a booted scene takes new ones through
  // `etchRef`, which the scene's effect fills in.
  const etchingRef = useRef(etching)
  const etchRef = useRef<((next: SnowEtching) => void) | null>(null)
  useEffect(() => {
    etchingRef.current = etching
    etchRef.current?.(etching ?? NO_ETCHING)
  }, [etching])
  const onIntroRef = useRef(onIntro)
  useEffect(() => {
    onIntroRef.current = onIntro
  }, [onIntro])

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    /** No scene after all: show the fallback, and there is no intro to wait for. */
    const giveUp = () => {
      setUnavailable(true)
      onIntroRef.current?.('end')
    }
    const palette = readPalette(wrap)
    if (!palette) {
      giveUp()
      return
    }
    let introTimer = 0

    let handle: SnowSceneHandle | null = null
    let disposed = false
    let booted = false
    let visible = false
    let raf = 0
    let pointerX = 0
    let pointerY = 0
    let targetX = 0
    let targetY = 0
    /**
     * The hero's brush: the pointer's last position on the page, in client
     * pixels. It is turned into a point on the scene every frame, against the
     * box as it is now, so scrolling under a still mouse moves the brush with
     * the page instead of digging where the pointer used to be.
     */
    let pointer: { x: number; y: number } | null = null
    const brushAt = () => {
      if (!pointer) return null
      const box = wrap.getBoundingClientRect()
      const x = ((pointer.x - box.left) / box.width) * 2 - 1
      const y = ((pointer.y - box.top) / box.height) * 2 - 1
      return Math.abs(x) <= 1 && Math.abs(y) <= 1 ? { x, y } : null
    }
    const started = performance.now()

    /** A section's scene is driven by its travel through the viewport. */
    const travel = () => {
      const box = wrap.getBoundingClientRect()
      const span = window.innerHeight + box.height
      return Math.min(1, Math.max(0, (window.innerHeight - box.top) / span))
    }

    /** Whether the last frame drawn brushed, and where the box was then. */
    let brushed = false
    let drawnAt = { top: 0, left: 0 }
    const draw = (now: number) => {
      const brush = brushAt()
      brushed = brush !== null
      const box = wrap.getBoundingClientRect()
      drawnAt = { top: box.top, left: box.left }
      handle?.render(
        (now - started) / 1000,
        atRest ? 1 : progress ? progress.get() : reducedMotion ? 0.5 : travel(),
        pointerX,
        pointerY,
        brush,
      )
    }

    const resize = () => {
      const box = wrap.getBoundingClientRect()
      if (box.width < 1 || box.height < 1) return
      handle?.resize(
        Math.round(box.width),
        Math.round(box.height),
        Math.min(window.devicePixelRatio || 1, MAX_DPR),
      )
      const cover = frameAbove?.current
      const bottom = cover ? layoutTop(cover) - layoutTop(wrap) : box.height
      handle?.setBand(frameTop, Math.max(frameTop + 40, bottom))
    }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      pointerX += (targetX - pointerX) * 0.04
      pointerY += (targetY - pointerY) * 0.04
      draw(now)
    }
    const play = () => {
      if (!handle || raf || reducedMotion || atRest || !visible || document.hidden) return
      raf = requestAnimationFrame(frame)
    }
    const pause = () => {
      cancelAnimationFrame(raf)
      raf = 0
      // Nothing samples the pointer until the loop resumes, so the stroke
      // ends here; the next one starts wherever the pointer is then.
      handle?.lift()
      brushed = false
    }

    const boot = async () => {
      if (booted) return
      booted = true
      const context = canvas.getContext('webgl2', {
        alpha: true,
        antialias: true,
        powerPreference: 'default',
        // A software renderer does give a WebGL2 context, and then draws
        // this scene at 4–14 fps on the main thread, dragging the whole
        // page with it. Refuse it: those machines get the fallback.
        failIfMajorPerformanceCaveat: true,
      })
      if (!context) {
        giveUp()
        return
      }
      try {
        const { createSnowScene } = await import('./snowScene')
        if (disposed) return
        const created = createSnowScene(canvas, context, variant, palette, {
          animate: !reducedMotion && !atRest,
          // Small screens get a coarser snow mesh, no post-processing and a
          // smaller shadow map.
          lowPower: window.innerWidth < 640,
        })
        await created.ready
        if (disposed) {
          created.dispose()
          return
        }
        handle = created
        created.setEtching(etchingRef.current ?? NO_ETCHING)
        etchRef.current = (next) => {
          created.setEtching(next)
          if (!raf) draw(performance.now())
        }
      } catch {
        // The chunk did not arrive (or the scene could not be built). The
        // scene is décor: fall back to the empty box rather than reject.
        if (!disposed) giveUp()
        return
      }
      resize()
      draw(performance.now())
      setReady(true)
      play()
      // The scene timed its intro from the frame just drawn.
      if (!reducedMotion && !atRest) {
        onIntroRef.current?.('start')
        introTimer = window.setTimeout(
          () => onIntroRef.current?.('end'),
          HERO_INTRO_SECONDS * 1000,
        )
      } else {
        onIntroRef.current?.('end')
      }
    }

    const onIntersect: IntersectionObserverCallback = (entries) => {
      // One delivery can carry several entries for the same target; only the
      // last one is the current state.
      visible = entries.at(-1)?.isIntersecting ?? false
      if (visible) {
        void boot()
        play()
      } else {
        pause()
      }
    }
    // Build a scene a little before it scrolls in, not at page load.
    const intersection = new IntersectionObserver(onIntersect, {
      rootMargin: '300px 0px',
    })
    intersection.observe(wrap)

    const resizeObserver = new ResizeObserver(() => {
      resize()
      // Always redraw: resizing reassigns the canvas's width and height, which
      // clears it, and this callback runs after the frame's rAF — so without
      // a draw here the cleared buffer is what gets presented (a one-frame
      // blank on every window resize, rotation or mobile URL-bar change).
      draw(performance.now())
    })
    resizeObserver.observe(wrap)
    // The lockup grows a line when the countdown arrives after hydration.
    const cover = frameAbove?.current
    if (cover) resizeObserver.observe(cover)

    // A lost context (GPU reset, sleep, a phone evicting the tab) is not
    // worth restoring for décor: the shadow map and every buffer would have
    // to be rebuilt. Fall back to the empty box instead of a broken scene.
    const onContextLost = () => {
      pause()
      window.clearTimeout(introTimer)
      giveUp()
    }
    canvas.addEventListener('webglcontextlost', onContextLost)

    const onVisibility = () => {
      if (document.hidden) pause()
      else play()
    }
    document.addEventListener('visibilitychange', onVisibility)

    // The hero follows the pointer: a mouse moved over it brushes snow off.
    // (A finger drag is taken by the browser for scrolling, so touch screens
    // only see the scene.) The camera's small sway toward the pointer
    // is left out under reduced motion; the brushing, which only ever happens
    // because the visitor moved, is not.
    const followsPointer = variant === 'hero' && !atRest
    const onPointerMove = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY }
      if (!reducedMotion) {
        targetX = (event.clientX / window.innerWidth) * 2 - 1
        targetY = (event.clientY / window.innerHeight) * 2 - 1
      }
      if (raf || !handle) return
      // No loop runs (reduced motion, or paused): draw the stroke now — and
      // draw once more as the pointer leaves, so the scene lifts the brush
      // rather than joining the exit to the next entry with a trench. If the
      // page scrolled since the last frame, nothing saw the pointer cross
      // the gap: start a new stroke instead of joining across it.
      const box = wrap.getBoundingClientRect()
      if (box.top !== drawnAt.top || box.left !== drawnAt.left) handle.lift()
      if (brushed || brushAt() !== null) draw(performance.now())
    }
    const onPointerLeave = () => {
      pointer = null
      if (!raf && brushed) draw(performance.now())
    }
    if (followsPointer) {
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      document.documentElement.addEventListener('pointerleave', onPointerLeave)
    }
    // A section's block of ice only leans toward a mouse: no brushing, no
    // touch (a finger is scrolling), and nothing under reduced motion, where
    // no loop runs. Measured from the block's own centre, so a pointer
    // resting on the block leaves it facing front.
    const sways = variant !== 'hero' && !atRest && !reducedMotion
    const onSway = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      const box = wrap.getBoundingClientRect()
      if (box.width < 1 || box.height < 1) return
      const clampUnit = (value: number) => Math.max(-1, Math.min(1, value))
      targetX = clampUnit(((event.clientX - box.left) / box.width) * 2 - 1)
      targetY = clampUnit(((event.clientY - box.top) / box.height) * 2 - 1)
    }
    if (sways) window.addEventListener('pointermove', onSway, { passive: true })

    return () => {
      disposed = true
      etchRef.current = null
      window.clearTimeout(introTimer)
      pause()
      intersection.disconnect()
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointermove', onSway)
      document.documentElement.removeEventListener('pointerleave', onPointerLeave)
      handle?.dispose()
      handle = null
    }
  }, [variant, progress, atRest, reducedMotion, frameTop, frameAbove])

  return (
    <div
      ref={wrapRef}
      data-snow-scene={variant}
      data-ready={ready && !unavailable ? '' : undefined}
      className={`snow-scene pointer-events-none ${className} ${unavailable ? 'hidden' : ''}`}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${
          ready ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {callouts && ready ? (
        <div
          aria-hidden="true"
          className="text-ink absolute inset-[16%] text-[0.6875rem] leading-snug font-medium tracking-[0.06em] uppercase"
        >
          <p className="border-ink/50 bg-frost absolute top-0 left-0 border px-2 py-1">
            {callouts.title[0]}
            <br />
            {callouts.title[1]}
          </p>
          <p className="border-ink/50 bg-frost absolute right-0 bottom-0 border px-2 py-1 text-right">
            {callouts.reading[0]}
            <br />
            {callouts.reading[1]}
          </p>
        </div>
      ) : null}
    </div>
  )
}
