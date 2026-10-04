import { useEffect, useRef, useState } from 'react'
import type { GalleryPhoto } from '../lib/images'

export function GalleryGrid({ photos }: { photos: readonly GalleryPhoto[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [active, setActive] = useState<GalleryPhoto | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !active || dialog.open) return
    dialog.showModal()
  }, [active])

  const locked = active !== null

  useEffect(() => {
    if (!locked) return
    const scrollY = window.scrollY
    const { documentElement: html, body } = document
    const previous = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
    }
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    return () => {
      html.style.overflow = previous.htmlOverflow
      body.style.overflow = previous.bodyOverflow
      body.style.position = previous.bodyPosition
      body.style.top = previous.bodyTop
      body.style.width = previous.bodyWidth
      window.scrollTo(0, scrollY)
    }
  }, [locked])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if ('closedBy' in HTMLDialogElement.prototype) return

    const onClick = (event: MouseEvent) => {
      if (event.target !== dialog) return
      const rect = dialog.getBoundingClientRect()
      const inside =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      if (!inside) dialog.close()
    }

    dialog.addEventListener('click', onClick)
    return () => dialog.removeEventListener('click', onClick)
  }, [])

  const activeIndex = active ? photos.findIndex((photo) => photo.jpg === active.jpg) : -1

  function showOffset(offset: number) {
    if (activeIndex < 0 || photos.length === 0) return
    const next = (activeIndex + offset + photos.length) % photos.length
    setActive(photos[next])
  }

  useEffect(() => {
    if (!active) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        showOffset(-1)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        showOffset(1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, activeIndex, photos])

  if (photos.length === 0) {
    return (
      <div className="border-frost bg-frost/25 flex min-h-[200px] flex-col items-center justify-center rounded-3xl border p-8 text-center sm:min-h-[240px] sm:p-12">
        <p className="font-display text-display-md text-pine font-semibold">
          More photos coming soon
        </p>
        <p className="text-body text-pine/80 mt-3 max-w-md">
          We&apos;re gathering shots from past workshops and hackathons. Check
          back as we add them.
        </p>
      </div>
    )
  }

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {photos.map((photo) => (
          <li key={photo.jpg}>
            <button
              type="button"
              className="border-frost focus-visible:outline-pine block w-full cursor-pointer overflow-hidden rounded-2xl border text-left focus-visible:outline-2 focus-visible:outline-offset-2"
              aria-label={`Enlarge: ${photo.alt}`}
              onClick={() => setActive(photo)}
            >
              <span className="border-frost block aspect-[4/3] overflow-hidden">
                <picture>
                  <source type="image/avif" srcSet={photo.avif} />
                  <source type="image/webp" srcSet={photo.webp} />
                  <img
                    src={photo.jpg}
                    alt=""
                    width={photo.width}
                    height={photo.height}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </picture>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        closedby="any"
        aria-labelledby="gallery-lightbox-caption"
        className="relative m-auto w-fit max-w-[calc(100%-2rem)] max-h-[calc(100dvh-2rem)] overflow-hidden overscroll-none rounded-2xl border border-frost bg-cloud p-0 text-pine backdrop:bg-pine/70"
        onClose={() => setActive(null)}
      >
        {active ? (
          <figure className="w-fit max-w-full">
            <picture>
              <source type="image/avif" srcSet={active.avif} />
              <source type="image/webp" srcSet={active.webp} />
              <img
                src={active.jpg}
                alt=""
                width={active.width}
                height={active.height}
                className="max-h-[calc(100dvh-12rem)] w-auto max-w-[min(72rem,calc(100vw-2rem))] bg-frost object-contain"
              />
            </picture>
            <figcaption
              id="gallery-lightbox-caption"
              className="text-body text-pine w-0 min-w-full px-5 py-4 sm:px-6"
            >
              {active.alt}
            </figcaption>
          </figure>
        ) : null}
        {active && photos.length > 1 ? (
          <>
            <button
              type="button"
              className="bg-cloud/95 text-pine focus-visible:outline-pine absolute top-1/2 left-3 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2"
              aria-label="Previous photo"
              onClick={() => showOffset(-1)}
            >
              <Arrow direction="left" />
            </button>
            <button
              type="button"
              className="bg-cloud/95 text-pine focus-visible:outline-pine absolute top-1/2 right-3 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2"
              aria-label="Next photo"
              onClick={() => showOffset(1)}
            >
              <Arrow direction="right" />
            </button>
          </>
        ) : null}
        <form method="dialog" className="absolute top-3 right-3 z-10">
          <button
            type="submit"
            className="bg-cloud text-pine focus-visible:outline-pine rounded-full px-3 py-1.5 text-caption font-medium shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Close
          </button>
        </form>
      </dialog>
    </>
  )
}

function Arrow({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      {direction === 'left' ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 6 9 12l6 6" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
      )}
    </svg>
  )
}
