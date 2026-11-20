import { useEffect, useRef, useState, type RefObject } from 'react'
import { usePrefersReducedMotion } from '../lib/motion'
import { readPalette } from './palette'
import type { IceWallHandle, WallBrick, WallRect } from './iceWall'

/**
 * The prize wall's 3D ice blocks (src/three/iceWall.ts), drawn behind the
 * section's tab buttons and kept in register with them.
 *
 * The buttons are the wall: they take the clicks, the focus and the reading.
 * This box sits under them, a little larger than the wall so a block's sides
 * and snow are not clipped. The blocks are placed from the buttons' layout
 * boxes (offsets, which ignore the CSS ice's hover and chosen lifts), re-read
 * whenever the wall resizes. Nothing here renders during the prerender but an
 * empty box; the scene is a dynamic import, booted when the wall nears the
 * viewport.
 *
 * `onReady` reports whether the 3D wall is drawing, so the section can drop
 * the buttons' flat CSS ice (which is what anyone without WebGL, or before it
 * loads, sees instead). A lost context reports false and the CSS ice returns.
 */
export function IceWallCanvas({
  bricks,
  chosen,
  wallRef,
  onReady,
}: {
  bricks: readonly WallBrick[]
  chosen: number
  /** The tab list; its `[role="tab"]` children are the blocks' faces. */
  wallRef: RefObject<HTMLElement | null>
  onReady: (ready: boolean) => void
}) {
  const reducedMotion = usePrefersReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)
  // The latest choice, for the scene to pick up when it boots; a booted scene
  // takes changes through `chooseRef`.
  const chosenRef = useRef(chosen)
  const chooseRef = useRef<((index: number) => void) | null>(null)
  useEffect(() => {
    chosenRef.current = chosen
    chooseRef.current?.(chosen)
  }, [chosen])

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    const wall = wallRef.current
    if (!wrap || !canvas || !wall) return
    const palette = readPalette(wrap)
    if (!palette) return

    let handle: IceWallHandle | null = null
    let disposed = false
    let booted = false
    let visible = false
    let raf = 0
    let hovered: number | null = null
    let swap = 0
    const started = performance.now()

    const tabs = () => [...wall.querySelectorAll<HTMLElement>('[role="tab"]')]
    // Layout boxes, not getBoundingClientRect: the CSS ice lifts the chosen
    // and hovered buttons with transforms, and a measurement taken through
    // one would leave its block off by those pixels for good. Each button's
    // offset is from the tab list, the tab list's and this box's from the wall.
    const measure = (): WallRect[] =>
      tabs().map((tab) => ({
        x: tab.offsetLeft + wall.offsetLeft - wrap.offsetLeft,
        y: tab.offsetTop + wall.offsetTop - wrap.offsetTop,
        width: tab.offsetWidth,
        height: tab.offsetHeight,
      }))
    const resize = () => {
      const width = wrap.clientWidth
      const height = wrap.clientHeight
      if (width < 1 || height < 1) return
      handle?.resize(width, height, window.devicePixelRatio || 1)
      handle?.layout(measure())
    }

    const draw = () => handle?.render((performance.now() - started) / 1000) ?? false
    const frame = () => {
      raf = 0
      if (draw() && visible && !document.hidden) raf = requestAnimationFrame(frame)
    }
    /** Run frames until the scene settles (or for good, when it animates). */
    const wake = () => {
      if (!handle) return
      if (reducedMotion) {
        // No loop: settle in one step.
        draw()
        return
      }
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame)
    }
    const pause = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    const boot = async () => {
      if (booted) return
      booted = true
      const context = canvas.getContext('webgl2', {
        alpha: true,
        antialias: true,
        powerPreference: 'default',
        // A software renderer would drag the page with it: keep the CSS ice.
        failIfMajorPerformanceCaveat: true,
      })
      if (!context) return
      try {
        const { createIceWall } = await import('./iceWall')
        if (disposed) return
        const created = createIceWall(canvas, context, palette, bricks, {
          animate: !reducedMotion,
        })
        await created.ready
        if (disposed) {
          created.dispose()
          return
        }
        handle = created
      } catch {
        return
      }
      handle.setState(chosenRef.current, hovered)
      chooseRef.current = (index) => {
        handle?.setState(index, hovered)
        wake()
      }
      resize()
      draw()
      setReady(true)
      // Hand over once the canvas has faded in (500ms), so the CSS ice is
      // never gone before the 3D ice is there.
      swap = window.setTimeout(() => onReady(true), reducedMotion ? 0 : 520)
      wake()
    }

    const intersection = new IntersectionObserver(
      (entries) => {
        visible = entries.at(-1)?.isIntersecting ?? false
        if (visible) {
          void boot()
          wake()
        } else {
          pause()
        }
      },
      { rootMargin: '300px 0px' },
    )
    intersection.observe(wrap)

    // The buttons reflow with the window (and the panel beside them): follow.
    const resizeObserver = new ResizeObserver(() => {
      resize()
      draw()
    })
    resizeObserver.observe(wall)

    const onContextLost = () => {
      window.clearTimeout(swap)
      pause()
      handle = null
      setReady(false)
      onReady(false)
    }
    canvas.addEventListener('webglcontextlost', onContextLost)

    const onVisibility = () => {
      if (document.hidden) pause()
      else wake()
    }
    document.addEventListener('visibilitychange', onVisibility)

    // Hover brightens a block a little; read from the buttons, not the canvas.
    const indexOf = (target: EventTarget | null) => {
      const tab = target instanceof Element ? target.closest('[role="tab"]') : null
      return tab ? tabs().indexOf(tab as HTMLElement) : -1
    }
    const onOver = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      const index = indexOf(event.target)
      hovered = index >= 0 ? index : null
      handle?.setState(chosenRef.current, hovered)
      wake()
    }
    const onLeave = () => {
      hovered = null
      handle?.setState(chosenRef.current, hovered)
      wake()
    }
    wall.addEventListener('pointerover', onOver)
    wall.addEventListener('pointerleave', onLeave)

    return () => {
      disposed = true
      window.clearTimeout(swap)
      chooseRef.current = null
      pause()
      intersection.disconnect()
      resizeObserver.disconnect()
      canvas.removeEventListener('webglcontextlost', onContextLost)
      document.removeEventListener('visibilitychange', onVisibility)
      wall.removeEventListener('pointerover', onOver)
      wall.removeEventListener('pointerleave', onLeave)
      handle?.dispose()
      handle = null
    }
    // The section passes a module-level `bricks` and a state setter, so
    // neither changes and the scene is built once.
  }, [reducedMotion, wallRef, bricks, onReady])

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      data-ice-wall-scene
      className="snow-scene ice-canvas pointer-events-none absolute -inset-10 z-0"
    >
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full transition-opacity duration-500 motion-reduce:transition-none ${
          ready ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  )
}
