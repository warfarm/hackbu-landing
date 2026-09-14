import { useCallback, useEffect, useRef, useState } from 'react'
import type { AboutPhoto } from '../lib/images'
import { usePrefersReducedMotion } from '../lib/motion'

/**
 * A strip of framed portrait photos, two to a view from `md` up. Every other
 * panel sits lower than its neighbour, so the strip steps up and down; the
 * track aligns items to the top and lets the dropped panels set its height,
 * so nothing is clipped by the horizontal scroller.
 *
 * The track is a native horizontal scroller with scroll-snap, so touch
 * swiping, trackpads and Shift+wheel all work without JavaScript; the buttons
 * only call `scrollBy` one panel at a time. There is no autoplay. That keeps
 * the reduced-motion convention in src/lib/motion.ts trivially satisfied:
 * the only movement is the one the visitor asks for, and even that jumps
 * instead of gliding when `prefers-reduced-motion` is set.
 *
 * Button state starts as "at the start" on the server and on the first client
 * render, so hydration agrees; the scroll listener corrects it after mount.
 */
export function PhotoCarousel({
  photos,
  label,
  lazy = false,
}: {
  photos: readonly AboutPhoto[]
  label: string
  /** Lazy-load every panel, for carousels below the fold. */
  lazy?: boolean
}) {
  const trackRef = useRef<HTMLUListElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const updateEdges = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    // Half a panel of slack: snapping to the last panel's start can stop a few
    // pixels short of the true maximum (fractional widths plus the border).
    const slack = ((track.firstElementChild as HTMLElement | null)?.offsetWidth ?? 2) / 2
    setAtStart(track.scrollLeft <= slack)
    setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - slack)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    updateEdges()
    track.addEventListener('scroll', updateEdges, { passive: true })
    window.addEventListener('resize', updateEdges)
    return () => {
      track.removeEventListener('scroll', updateEdges)
      window.removeEventListener('resize', updateEdges)
    }
  }, [updateEdges])

  function step(direction: 1 | -1) {
    const track = trackRef.current
    const panel = track?.firstElementChild as HTMLElement | null
    if (!track || !panel) return
    // Panel width plus the seam between panels.
    const seam = parseFloat(getComputedStyle(track).columnGap) || 0
    track.scrollBy({
      left: direction * (panel.offsetWidth + seam),
      behavior: reducedMotion ? 'auto' : 'smooth',
    })
  }

  return (
    <section aria-roledescription="carousel" aria-label={label}>
      <ul
        ref={trackRef}
        className="flex snap-x snap-mandatory items-start gap-2 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((photo, index) => (
          <li
            key={photo.jpg}
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${photos.length}`}
            // Every other panel drops lower, so the strip steps up and down.
            className={`border-frost aspect-[4/5] w-[78%] shrink-0 snap-start overflow-hidden rounded-2xl border-2 md:w-[calc(50%-0.25rem)] ${index % 2 === 1 ? 'mt-8 md:mt-16' : ''}`}
          >
            <picture>
              <source type="image/avif" srcSet={photo.avif} />
              <source type="image/webp" srcSet={photo.webp} />
              <img
                src={photo.jpg}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                decoding="async"
                loading={!lazy && index < 2 ? undefined : 'lazy'}
                draggable={false}
                className="h-full w-full object-cover"
              />
            </picture>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex justify-end gap-2">
        <CarouselButton
          label="Previous photo"
          disabled={atStart}
          onClick={() => step(-1)}
          flip
        />
        <CarouselButton
          label="Next photo"
          disabled={atEnd}
          onClick={() => step(1)}
        />
      </div>
    </section>
  )
}

function CarouselButton({
  label,
  disabled,
  onClick,
  flip = false,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  flip?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="border-frost text-pine hover:bg-frost focus-visible:outline-pine grid size-11 place-items-center rounded-full border-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
    >
      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        className={`size-5 ${flip ? 'rotate-180' : ''}`}
      >
        <path
          d="M7.5 4.5 13 10l-5.5 5.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
