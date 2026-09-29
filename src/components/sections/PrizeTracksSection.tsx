import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type ReactNode,
} from 'react'
import { Eyebrow, Section, SectionHeader } from '../Layout'
import { Reveal } from '../Reveal'
import { TOGGLE_ON_CLOUD } from '../controls'
import { usePrefersReducedMotion } from '../../lib/motion'
import { BEARCAT_MARK } from '../../lib/images'

/**
 * "Prize tracks" — last year's five categories on a ring that turns about its
 * vertical axis. Hovering a track (or focusing it, or tapping it) stops the
 * ring, and the track's description types itself into a popover beside the
 * card; letting go clears the text and the ring carries on from where it
 * stopped.
 *
 * **What the copy is.** The five tracks and their wording come from HackBU
 * 2026 — the event-information post on hackbu.org
 * (hackbu.org/blog/2026/03/04/hackbu-2026-information.html) and the Devpost
 * page (hackbu2026.devpost.com), which is also where the five judging
 * criteria under the ring come from. 2027's tracks are not confirmed, so the
 * lede says these are last year's, and no sponsor is named: the two tracks
 * that were sponsored carry a "Sponsored track" label and nothing more. No
 * prize amounts either — they belong to the year that pays them. Best Harpur
 * had no qualifying winner in 2026 (four winners across five tracks on the
 * Devpost gallery), and says so, as an invitation.
 *
 * ---------------------------------------------------------------------------
 * The ring
 * ---------------------------------------------------------------------------
 * Plain CSS 3D, laid out in the `.prize-*` block at the end of src/index.css:
 * a perspective viewport, a scene pushed back by the ring's radius and tipped
 * a few degrees so we look down onto it, the ring itself, and five slots each
 * turned `i × 72°` and pushed out by the radius. Each slot holds the card (a
 * `<button>`) on its front face and a pine panel with the bearcat on its back,
 * so the ring reads as a solid object going round rather than a set of cards
 * blinking in and out. Card size, radius and perspective are custom
 * properties that step up at `sm` and `lg`; nothing in this file knows a pixel
 * size.
 *
 * **Nothing re-renders to animate it.** `createSpinner()` below owns one
 * `requestAnimationFrame` loop that writes the ring's `transform` directly and
 * keeps the current angle in a closure, so pausing is "stop advancing" and
 * resuming is "advance from here" — there is no stored start time to drift
 * from, and so no jump. Each frame it also works out which way every card is
 * facing and writes two things per card, only when they change: a `--shade`
 * custom property on an overlay (cards darken as they turn edge-on, which is
 * most of what sells the depth), and `pointer-events: none` on any card
 * turned more than ~70° away, so a card on the far side of the ring can never
 * be hovered or clicked through the gap between the front ones. `--shade` is a
 * custom property rather than an inline `opacity` on purpose: the component
 * sheet pins every element with an inline opacity to 1 (`src/sheet/sheet.css`),
 * which would paint every overlay solid.
 *
 * The loop only runs while something is moving. It stops for any *hold* —
 * a track being hovered, focused or tapped; the visitor's pause button; the
 * section being off-screen (an IntersectionObserver, not a scroll listener);
 * the tab being hidden — and restarts with a zero first step when the last
 * hold lifts. Frame steps are clamped, so a long frame never lurches.
 *
 * ---------------------------------------------------------------------------
 * Hover, focus, touch
 * ---------------------------------------------------------------------------
 * One piece of state, `active`, says which popover is showing, and a ref
 * records what opened it:
 *
 *   mouse     pointer enters a card → open; leaves → close after a 120ms
 *             grace, cancelled if the pointer reaches the popover or another
 *             card. The grace is what lets the pointer cross onto the popover
 *             without it vanishing (WCAG 1.4.13, "hoverable").
 *   keyboard  focus on a card (`:focus-visible` only, so a mouse click that
 *             focuses a button does not count) turns the ring the short way
 *             round until that card faces front, then opens. Blur closes and
 *             lets the ring go. Escape closes the popover but the ring stays
 *             still while focus is on it — "Escape dismisses, blur resumes".
 *   touch     tap toggles; a tap anywhere else closes. `click`, not
 *             `pointerdown`, is what closes it, so scrolling to read a long
 *             description does not dismiss it.
 *
 * Escape dismisses the popover whichever way it opened.
 *
 * **What a screen reader gets.** Each card is a real `<button>` named by its
 * track ("Best Personal Finance, Sponsored track") and described, through
 * `aria-describedby`, by a visually hidden paragraph holding the full
 * description — so the whole text is there the moment focus lands, never a
 * half-typed one. The popover is a visual duplicate and is `aria-hidden`.
 * WCAG 2.2.2 wants a way to stop motion that runs for more than five seconds,
 * so there is a "Pause spinning" button under the ring as well as the hover
 * and focus pauses.
 *
 * ---------------------------------------------------------------------------
 * The popover
 * ---------------------------------------------------------------------------
 * Always mounted (so its text node exists for the typewriter to write into),
 * shown with `data-open`, and positioned imperatively in a layout effect: it
 * measures the card's on-screen box and goes on the side facing away from the
 * ring's centre, the other side if that does not fit, and underneath the card
 * when neither does (tablet and phone widths). It is clamped to 16px inside
 * the window, and the section is `overflow-x-clip`, so neither the ring's
 * outer cards nor the popover can make the page scroll sideways.
 *
 * The typed copy is laid over an invisible copy of the full text in the same
 * grid cell, so the popover is its final size from the first character and
 * never grows line by line. Characters land every 14ms from a rAF loop that
 * writes `textContent` — again, no React render per character.
 *
 * ---------------------------------------------------------------------------
 * Prerender and reduced motion
 * ---------------------------------------------------------------------------
 * The server and the first client render agree: angle 0, nothing active, the
 * popover holding track one's text and hidden. Everything that touches the
 * browser happens in effects. The ring's resting 3D arrangement is pure CSS,
 * so the prerendered HTML already paints the ring before any script runs.
 *
 * Reduced motion is handled in two places for the reason Hero's intro gives
 * (src/index.css): the *layout* switches in CSS under the media query, so the
 * first paint is already the static arrangement — the five cards flat in a
 * wrapping row, no backs, no shading — and the *behaviour* reads
 * `usePrefersReducedMotion()`: no loop is started, focus does not turn
 * anything, and the description appears whole instead of being typed.
 */

type TrackTag = 'sponsored' | 'unclaimed'

type TrackIconName = 'trophy' | 'sprout' | 'interface' | 'coin' | 'book'

type Track = {
  /** Stable key and id fragment. */
  id: string
  /** Every track is a "Best …"; the card sets "Best" small above this. */
  name: string
  /** One line on the card itself, readable while the ring turns. */
  kicker: string
  /** What the popover types, and what `aria-describedby` reads in full. */
  description: string
  tag?: TrackTag
  icon: TrackIconName
}

/**
 * HackBU 2026's five tracks, in the order the event post lists them after
 * Best Overall. Descriptions paraphrase that post's eligibility rules; see the
 * doc comment above for the sources.
 */
const TRACKS: readonly Track[] = [
  {
    id: 'overall',
    name: 'Overall',
    kicker: 'No theme, and every team is eligible',
    icon: 'trophy',
    description:
      'Awarded to the best-scoring project of the weekend. There’s no theme, so build whatever you like — every team is eligible.',
  },
  {
    id: 'beginner',
    name: 'Beginner',
    kicker: 'Everyone’s first hackathon',
    icon: 'sprout',
    description:
      'For teams where this is every member’s first hackathon and everyone is an undergraduate. The best-scoring of those teams takes it, so you’re up against people who are new to this too.',
  },
  {
    id: 'user-interface',
    name: 'User Interface',
    kicker: 'Creative interfaces and experiences',
    icon: 'interface',
    tag: 'sponsored',
    description:
      'For creative, unique and innovative interfaces and experiences. Judges nominate projects for this track, so if the interface is the point of yours, say so in your demo.',
  },
  {
    id: 'personal-finance',
    name: 'Personal Finance',
    kicker: 'Money tools and financial literacy',
    icon: 'coin',
    tag: 'sponsored',
    description:
      'For projects that teach people about money, or are a personal finance tool in their own right — an automatic receipt scanner, anyone? Judges nominate projects for it, so make the money angle clear when you demo.',
  },
  {
    id: 'harpur',
    name: 'Harpur',
    kicker: 'Teams mostly from outside Watson',
    icon: 'book',
    tag: 'unclaimed',
    description:
      'For teams made up mostly of students from outside the Watson College of Engineering: if more than half your team is from another college, you’re eligible automatically. No team claimed it last year — yours could be the first.',
  },
]

const TAG_LABEL: Record<TrackTag, string> = {
  sponsored: 'Sponsored track',
  unclaimed: 'Still unclaimed',
}

/** HackBU 2026's judging criteria, as the Devpost page lists them. */
const CRITERIA = [
  'Originality',
  'Design & execution',
  'Utility & impact',
  'Clarity & understanding',
  'Technical complexity',
] as const

/** One full turn of the ring. Slow enough to read a card as it passes. */
const REVOLUTION_MS = 32_000

/** Typewriter pace — fast, so it reads as arriving rather than as a wait. */
const MS_PER_CHAR = 14

/** How long a mouse-opened popover survives the pointer leaving its card. */
const CLOSE_GRACE_MS = 120

/**
 * A card is hoverable while it faces the viewer by more than this (cosine of
 * its angle, ~70°). Past it the card is edge-on or turned away.
 */
const INTERACTIVE_FACING = 0.35

/** Space between a card and its popover, and between the popover and the window edge. */
const POPOVER_GAP = 18
const WINDOW_GUTTER = 16

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

type OpenedBy = 'hover' | 'focus' | 'touch'

export function PrizeTracksSection() {
  const baseId = useId()
  const reduced = usePrefersReducedMotion()
  const [spin] = useState(() => createSpinner(TRACKS.length))

  /** The track whose popover is showing, or null. */
  const [active, setActive] = useState<number | null>(null)
  /** The track the popover holds — kept after closing so it fades out whole. */
  const [shownTrack, setShownTrack] = useState(0)
  const [userPaused, setUserPaused] = useState(false)

  const stageRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLUListElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const typedRef = useRef<HTMLSpanElement>(null)
  const slotRefs = useRef<(HTMLLIElement | null)[]>([])

  // Mirrors and bookkeeping read synchronously by the handlers.
  const activeRef = useRef<number | null>(null)
  const openedByRef = useRef<OpenedBy | null>(null)
  const focusedRef = useRef<number | null>(null)
  const pointerTypeRef = useRef<string | null>(null)
  const closeTimerRef = useRef(0)

  const open = useCallback(
    (index: number, openedBy: OpenedBy) => {
      window.clearTimeout(closeTimerRef.current)
      activeRef.current = index
      openedByRef.current = openedBy
      // Held synchronously, before React renders, so the ring stops on the
      // angle it had when the pointer arrived and the popover measures that.
      spin.hold('interaction', true)
      setActive(index)
      setShownTrack(index)
    },
    [spin],
  )

  const close = useCallback(() => {
    window.clearTimeout(closeTimerRef.current)
    activeRef.current = null
    openedByRef.current = null
    // A keyboard-focused card keeps the ring still after Escape; blur lets it go.
    spin.hold('interaction', focusedRef.current !== null)
    setActive(null)
  }, [spin])

  const scheduleClose = useCallback(() => {
    window.clearTimeout(closeTimerRef.current)
    closeTimerRef.current = window.setTimeout(close, CLOSE_GRACE_MS)
  }, [close])

  const cancelClose = useCallback(() => {
    window.clearTimeout(closeTimerRef.current)
  }, [])

  /** Put the popover beside (or under) track `index`'s card. */
  const place = useCallback((index: number) => {
    const stage = stageRef.current
    const popover = popoverRef.current
    const slot = slotRefs.current[index]
    if (!stage || !popover || !slot) return

    const s = stage.getBoundingClientRect()
    const c = slot.getBoundingClientRect()
    const width = popover.offsetWidth
    const height = popover.offsetHeight
    const windowWidth = document.documentElement.clientWidth

    // Everything below is in the stage's coordinates.
    const minX = Math.max(0, WINDOW_GUTTER - s.left)
    const maxX = Math.min(s.width, windowWidth - WINDOW_GUTTER - s.left)
    const cardLeft = c.left - s.left
    const cardRight = c.right - s.left
    const cardMidX = (cardLeft + cardRight) / 2
    const cardTop = c.top - s.top
    const cardMidY = (cardTop + c.bottom - s.top) / 2

    const rightX = cardRight + POPOVER_GAP
    const leftX = cardLeft - POPOVER_GAP - width
    const fits = {
      right: rightX + width <= maxX,
      left: leftX >= minX,
    }
    // Outward first: a card left of centre opens to the left, over empty page
    // rather than over the rest of the ring.
    const order: ('left' | 'right')[] =
      cardMidX < s.width / 2 ? ['left', 'right'] : ['right', 'left']
    const side = order.find((candidate) => fits[candidate]) ?? 'below'

    let x: number
    let y: number
    let arrow: number
    if (side === 'below') {
      x = clamp(cardMidX - width / 2, minX, Math.max(minX, maxX - width))
      y = c.bottom - s.top + POPOVER_GAP
      arrow = clamp(cardMidX - x, 24, width - 24)
    } else {
      x = side === 'right' ? rightX : leftX
      y = cardMidY - height / 2
      arrow = clamp(cardMidY - y, 24, height - 24)
    }

    popover.dataset.side = side
    popover.style.left = `${Math.round(x)}px`
    popover.style.top = `${Math.round(y)}px`
    popover.style.setProperty('--arrow', `${Math.round(arrow)}px`)
  }, [])

  /* The ring: one rAF loop, held while anything wants it still. */
  useEffect(() => {
    const ring = ringRef.current
    const viewport = viewportRef.current
    if (!ring || !viewport) return
    // Checked here as well as through the hook: the hook is false on the first
    // client render by design (src/lib/motion.ts), and a loop started for one
    // commit would still write styles the static layout then has to undo.
    if (reduced || window.matchMedia(REDUCED_MOTION_QUERY).matches) return

    spin.hold('offscreen', true)
    spin.hold('hidden', document.hidden)
    const detach = spin.attach(ring)

    const observer = new IntersectionObserver(
      ([entry]) => spin.hold('offscreen', !entry?.isIntersecting),
      { rootMargin: '64px 0px' },
    )
    observer.observe(viewport)

    const onVisibility = () => spin.hold('hidden', document.hidden)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      detach()
    }
  }, [reduced, spin])

  /* Position the popover before the frame that shows it. */
  useLayoutEffect(() => {
    if (active !== null) place(active)
  }, [active, place])

  /* The typewriter. */
  useEffect(() => {
    const node = typedRef.current
    const popover = popoverRef.current
    if (!node || !popover || active === null) return
    const text = TRACKS[active]?.description ?? ''

    if (reduced) {
      node.textContent = text
      popover.dataset.typing = 'false'
      return
    }

    node.textContent = ''
    popover.dataset.typing = 'true'
    let frame = 0
    let start = 0
    let shown = 0
    const step = (now: number) => {
      if (!start) start = now
      const count = Math.min(
        text.length,
        Math.floor((now - start) / MS_PER_CHAR) + 1,
      )
      if (count !== shown) {
        shown = count
        node.textContent = text.slice(0, count)
      }
      if (count < text.length) frame = requestAnimationFrame(step)
      else popover.dataset.typing = 'false'
    }
    frame = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(frame)
      popover.dataset.typing = 'false'
    }
  }, [active, reduced])

  /* While a popover is open: Escape, tap-outside, and re-placing on resize. */
  useEffect(() => {
    if (active === null) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    const onClick = (event: MouseEvent) => {
      if (openedByRef.current !== 'touch') return
      const target = event.target
      if (!(target instanceof Node)) return
      if (ringRef.current?.contains(target)) return
      if (popoverRef.current?.contains(target)) return
      close()
    }
    const onResize = () => place(active)
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('click', onClick)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('click', onClick)
      window.removeEventListener('resize', onResize)
    }
  }, [active, close, place])

  useEffect(() => () => window.clearTimeout(closeTimerRef.current), [])

  function handleFocus(index: number, event: FocusEvent<HTMLButtonElement>) {
    if (!event.currentTarget.matches(':focus-visible')) return
    focusedRef.current = index
    cancelClose()
    spin.hold('interaction', true)
    if (reduced) {
      open(index, 'focus')
      return
    }
    // Hide whatever is open while the ring turns — this card's own popover
    // too, if the mouse opened it, since the card is about to move out from
    // under it — and show this one when it lands.
    if (activeRef.current !== null) {
      activeRef.current = null
      openedByRef.current = null
      setActive(null)
    }
    spin.seekTo(index, () => {
      if (focusedRef.current === index) open(index, 'focus')
    })
  }

  function handleBlur(index: number) {
    if (focusedRef.current !== index) return
    focusedRef.current = null
    spin.cancelSeek()
    if (openedByRef.current === 'focus') close()
    else spin.hold('interaction', activeRef.current !== null)
  }

  function handleClick(index: number, detail: number) {
    const pointerType = pointerTypeRef.current
    pointerTypeRef.current = null
    const isOpen = activeRef.current === index

    // Keyboard activation (Enter/Space): toggle, as a way to put it back.
    if (detail === 0 || pointerType === null) {
      if (isOpen) close()
      else open(index, 'focus')
      return
    }
    // A mouse already opened it on the way in; a click should not close it.
    if (pointerType === 'mouse') {
      if (!isOpen) open(index, 'hover')
      return
    }
    if (isOpen) close()
    else open(index, 'touch')
  }

  function toggleUserPause() {
    const next = !userPaused
    spin.hold('user', next)
    setUserPaused(next)
  }

  const shown = TRACKS[shownTrack]

  return (
    <Section
      id="prizes"
      labelledBy="prizes-title"
      className="bg-cloud overflow-x-clip"
    >
      <Reveal>
        <SectionHeader
          eyebrow="Prize tracks"
          titleId="prizes-title"
          title="Five ways to win."
          lede="These were the five tracks at HackBU 2026; 2027’s will be confirmed closer to the weekend. You don’t sign up for a track — judges do the nominating, and each project can win in one."
        />
      </Reveal>

      <Reveal delay={0.05} className="mt-10 sm:mt-14">
        <div ref={stageRef} className="relative">
          <div ref={viewportRef} className="prize-viewport">
            <div className="prize-floor" aria-hidden="true" />
            <div className="prize-scene">
              <ul
                ref={ringRef}
                aria-label="Prize tracks"
                className="prize-ring"
                style={{ '--n': TRACKS.length } as CSSProperties}
              >
                {TRACKS.map((track, index) => {
                  const nameId = `${baseId}-${track.id}-name`
                  const tagId = `${baseId}-${track.id}-tag`
                  const descriptionId = `${baseId}-${track.id}-description`

                  return (
                    <li
                      key={track.id}
                      ref={(element) => {
                        slotRefs.current[index] = element
                      }}
                      className="prize-slot"
                      style={{ '--i': index } as CSSProperties}
                    >
                      <button
                        type="button"
                        data-prize-card=""
                        data-active={active === index}
                        aria-labelledby={
                          track.tag ? `${nameId} ${tagId}` : nameId
                        }
                        aria-describedby={descriptionId}
                        onPointerEnter={(event) => {
                          if (event.pointerType !== 'mouse') return
                          open(index, 'hover')
                        }}
                        onPointerLeave={(event) => {
                          if (event.pointerType !== 'mouse') return
                          if (openedByRef.current === 'hover') scheduleClose()
                        }}
                        onPointerDown={(event) => {
                          pointerTypeRef.current = event.pointerType
                        }}
                        onClick={(event) => handleClick(index, event.detail)}
                        onFocus={(event) => handleFocus(index, event)}
                        onBlur={() => handleBlur(index)}
                        className="prize-card border-stone/60 bg-frost text-pine hover:border-pine data-[active=true]:border-pine data-[active=true]:bg-cloud focus-visible:outline-pine flex cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-4 sm:p-6"
                      >
                        <span className="flex items-start justify-between gap-3">
                          <TrackIcon name={track.icon} />
                          <span
                            aria-hidden="true"
                            className="text-eyebrow text-pine/90 font-medium"
                          >
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </span>

                        <span className="block">
                          <span id={nameId} className="block">
                            <span className="text-eyebrow text-pine/90 block font-medium uppercase">
                              Best
                            </span>{' '}
                            <span className="font-display text-display-md text-pine mt-2 block font-semibold text-balance">
                              {track.name}
                            </span>
                          </span>
                          <span className="text-caption text-pine/90 mt-2 hidden sm:block">
                            {track.kicker}
                          </span>
                          {track.tag ? (
                            <span
                              id={tagId}
                              className={`text-caption mt-3 inline-block rounded-full px-2 py-0.5 font-medium whitespace-nowrap sm:mt-4 sm:px-2.5 ${
                                track.tag === 'sponsored'
                                  ? 'bg-pine text-cloud'
                                  : 'border-pine/70 bg-cloud text-pine border border-dashed'
                              }`}
                            >
                              {TAG_LABEL[track.tag]}
                            </span>
                          ) : null}
                        </span>

                        <span
                          data-prize-shade="front"
                          aria-hidden="true"
                          className="prize-shade"
                        />
                      </button>

                      <div
                        aria-hidden="true"
                        className="prize-back bg-pine grid place-items-center rounded-3xl"
                      >
                        <span
                          className="brand-mark brand-mark-bearcat bg-cloud/20 block h-16 sm:h-20"
                          style={{
                            aspectRatio: `${BEARCAT_MARK.width} / ${BEARCAT_MARK.height}`,
                          }}
                        />
                        <span data-prize-shade="back" className="prize-shade" />
                      </div>

                      <p id={descriptionId} className="sr-only">
                        {track.description}
                      </p>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>

          {/*
           * The popover. `aria-hidden` because it only repeats, animated, what
           * each card's `aria-describedby` already exposes in full. The pointer
           * handlers are the hover grace: reaching it keeps it open.
           */}
          <div
            ref={popoverRef}
            aria-hidden="true"
            data-open={active !== null}
            onPointerEnter={(event) => {
              if (event.pointerType === 'mouse') cancelClose()
            }}
            onPointerLeave={(event) => {
              if (event.pointerType !== 'mouse') return
              if (openedByRef.current === 'hover') scheduleClose()
            }}
            className="prize-popover bg-pine text-cloud rounded-2xl p-5 shadow-xl sm:p-6"
          >
            <p className="text-eyebrow text-cloud/85 font-medium uppercase">
              Best {shown?.name}
            </p>
            <p className="prize-popover-text text-body mt-3">
              <span className="prize-popover-sizer">{shown?.description}</span>
              <span className="prize-popover-typed">
                <span ref={typedRef} />
                <span className="prize-caret bg-stone" />
              </span>
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-8 lg:mt-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Eyebrow>What judges scored in 2026</Eyebrow>
            <ul className="mt-4 flex flex-wrap gap-2">
              {CRITERIA.map((criterion) => (
                <li
                  key={criterion}
                  className="border-pine/30 text-caption text-pine rounded-full border px-3 py-1"
                >
                  {criterion}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <p className="text-caption text-pine/90">
              Hover, tap or tab to a track to read it.
            </p>
            <button
              type="button"
              onClick={toggleUserPause}
              className={`${TOGGLE_ON_CLOUD} text-caption inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 py-2 motion-reduce:hidden`}
            >
              <PauseGlyph paused={userPaused} />
              {userPaused ? 'Resume spinning' : 'Pause spinning'}
            </button>
          </div>
        </div>
      </Reveal>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/* The spinner                                                                */
/* -------------------------------------------------------------------------- */

type Hold = 'interaction' | 'user' | 'offscreen' | 'hidden'

type Seek = {
  from: number
  to: number
  start: number
  duration: number
  done: () => void
}

/**
 * The ring's clock, outside React. Created once per section (lazily, in
 * `useState`, so the server builds one too but never attaches it) and
 * attached to the ring element by an effect.
 *
 * The angle runs negative, so the ring turns right-to-left across the front
 * and the tracks arrive in reading order: track `i` faces the viewer at
 * `-i × step`.
 */
function createSpinner(count: number) {
  const step = 360 / count
  const degreesPerMs = 360 / REVOLUTION_MS

  let angle = 0
  let frame = 0
  let last = 0
  let seek: Seek | null = null
  const holds = new Set<Hold>()

  let ring: HTMLElement | null = null
  let cards: HTMLElement[] = []
  let frontShades: HTMLElement[] = []
  let backShades: HTMLElement[] = []
  let hittable: boolean[] = []
  let shades: string[] = []

  function moving() {
    return seek !== null || holds.size === 0
  }

  function paint() {
    if (!ring) return
    ring.style.transform = `rotateY(${angle.toFixed(3)}deg)`
    for (let i = 0; i < count; i++) {
      const facing = Math.cos(((angle + i * step) * Math.PI) / 180)

      const canHit = facing > INTERACTIVE_FACING
      if (canHit !== hittable[i]) {
        hittable[i] = canHit
        const card = cards[i]
        if (card) card.style.pointerEvents = canHit ? '' : 'none'
      }

      // Front darkens as it turns edge-on; the back darkens the same way from
      // the other side. Two decimals is finer than the eye can tell apart.
      const front = facing > 0 ? ((1 - facing) * 0.5).toFixed(2) : '0'
      const back = facing < 0 ? ((1 + facing) * 0.55).toFixed(2) : '0'
      const key = `${front}/${back}`
      if (key !== shades[i]) {
        shades[i] = key
        frontShades[i]?.style.setProperty('--shade', front)
        backShades[i]?.style.setProperty('--shade', back)
      }
    }
  }

  function tick(now: number) {
    frame = 0
    if (seek) {
      if (!seek.start) seek.start = now
      const t = Math.min(1, (now - seek.start) / seek.duration)
      angle = seek.from + (seek.to - seek.from) * easeInOutCubic(t)
      paint()
      if (t >= 1) {
        const { done } = seek
        seek = null
        done()
      }
    } else if (holds.size === 0) {
      // Clamped so a long frame (or the first one after a stall) never lurches.
      if (last) angle -= Math.min(now - last, 64) * degreesPerMs
      if (angle <= -360) angle += 360
      paint()
    }

    if (ring && moving()) {
      last = now
      frame = requestAnimationFrame(tick)
    } else {
      last = 0
    }
  }

  function wake() {
    if (!ring || frame || !moving()) return
    last = 0
    frame = requestAnimationFrame(tick)
  }

  return {
    /** Start driving `element`; returns the detach function. */
    attach(element: HTMLElement) {
      ring = element
      cards = Array.from(element.querySelectorAll<HTMLElement>('[data-prize-card]'))
      frontShades = Array.from(
        element.querySelectorAll<HTMLElement>('[data-prize-shade="front"]'),
      )
      backShades = Array.from(
        element.querySelectorAll<HTMLElement>('[data-prize-shade="back"]'),
      )
      hittable = cards.map(() => true)
      shades = cards.map(() => '')
      paint()
      wake()

      return () => {
        if (frame) cancelAnimationFrame(frame)
        frame = 0
        last = 0
        seek = null
        // Hand the markup back exactly as React rendered it.
        element.style.removeProperty('transform')
        for (const card of cards) card.style.removeProperty('pointer-events')
        for (const shade of [...frontShades, ...backShades]) {
          shade.style.removeProperty('--shade')
        }
        ring = null
      }
    },

    hold(key: Hold, on: boolean) {
      if (on) holds.add(key)
      else holds.delete(key)
      wake()
    },

    /** Turn the short way round until track `index` faces front, then call `done`. */
    seekTo(index: number, done: () => void) {
      if (!ring) {
        done()
        return
      }
      const target = -index * step
      const delta = ((((target - angle) % 360) + 540) % 360) - 180
      if (Math.abs(delta) < 0.5) {
        angle += delta
        paint()
        seek = null
        done()
        return
      }
      seek = {
        from: angle,
        to: angle + delta,
        start: 0,
        duration: Math.min(800, 320 + Math.abs(delta) * 2.5),
        done,
      }
      wake()
    },

    cancelSeek() {
      seek = null
    },
  }
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value
}

/* -------------------------------------------------------------------------- */
/* Glyphs                                                                     */
/* -------------------------------------------------------------------------- */

/** One small line drawing per track, in the card's pine. Decorative. */
const ICON_PATHS: Record<TrackIconName, ReactNode> = {
  trophy: (
    <>
      <path d="M7.5 4h9v4.5a4.5 4.5 0 0 1-9 0V4z" />
      <path d="M7.5 6H5.25a2.25 2.25 0 0 0 2.6 3.2" />
      <path d="M16.5 6h2.25a2.25 2.25 0 0 1-2.6 3.2" />
      <path d="M12 13v3.5" />
      <path d="M9.5 16.5h5l.75 3.5h-6.5z" />
    </>
  ),
  sprout: (
    <>
      <path d="M12 20v-7" />
      <path d="M12 13c0-3.9-2.9-6.5-6.5-6.5 0 3.9 2.9 6.5 6.5 6.5z" />
      <path d="M12 15.5c0-3.3 2.3-5.5 5.5-5.5 0 3.3-2.3 5.5-5.5 5.5z" />
      <path d="M8 20h8" />
    </>
  ),
  interface: (
    <>
      <rect x="3.5" y="4.5" width="17" height="13" rx="2" />
      <path d="M3.5 8.5h17" />
      <path d="M12.5 11.5l5.5 2.2-2.3.9-.9 2.3z" />
      <path d="M9 20.5h6" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M14.6 9.6c-.4-.9-1.4-1.5-2.6-1.5-1.5 0-2.6.8-2.6 1.95 0 2.7 5.3 1.3 5.3 4 0 1.15-1.2 1.95-2.7 1.95-1.25 0-2.3-.6-2.7-1.55" />
      <path d="M12 6.6v1.5M12 15.9v1.5" />
    </>
  ),
  book: (
    <>
      <path d="M12 6.8C10.2 5.4 7.5 4.8 4.5 5.2v12.6c3-.4 5.7.2 7.5 1.6 1.8-1.4 4.5-2 7.5-1.6V5.2c-3-.4-5.7.2-7.5 1.6z" />
      <path d="M12 6.8v12.6" />
    </>
  ),
}

function TrackIcon({ name }: { name: TrackIconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="text-pine size-7 shrink-0 sm:size-8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICON_PATHS[name]}
    </svg>
  )
}

/** Two bars while spinning, a play triangle while paused. Decorative. */
function PauseGlyph({ paused }: { paused: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
      className="size-3.5"
      fill="currentColor"
    >
      {paused ? (
        <path d="M4.5 2.75v10.5L13 8z" />
      ) : (
        <path d="M4 2.75h2.75v10.5H4zM9.25 2.75H12v10.5H9.25z" />
      )}
    </svg>
  )
}
