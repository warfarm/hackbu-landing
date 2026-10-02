import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { Eyebrow, Section, SectionHeader } from '../Layout'
import { Reveal } from '../Reveal'
import { TOGGLE_ON_CLOUD } from '../controls'
import { usePrefersReducedMotion } from '../../lib/motion'
import { BEARCAT_MARK } from '../../lib/images'

/**
 * "Prize tracks" — last year's five categories on a ring of wide cards that
 * turns about its vertical axis. Hovering a track (or focusing it, or tapping
 * it) turns the ring the short way round until that card faces front, and
 * then the card types its description in — every line at once, each starting
 * a beat after the one above. Letting go folds the description away and the
 * ring carries on from where it stopped.
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
 * blinking in and out. Card size, radius (a multiple of the card's width) and
 * perspective are custom properties that step up at `sm` and `lg`; nothing in
 * this file knows a pixel size.
 *
 * **Nothing re-renders to animate it.** `createSpinner()` below owns one
 * `requestAnimationFrame` loop that writes the ring's `transform` directly and
 * keeps the current angle in a closure, so pausing is "stop advancing" and
 * resuming is "advance from here" — there is no stored start time to drift
 * from, and so no jump. Each frame it also works out which way every card is
 * facing and writes two things per card, only when they change: a `--shade`
 * custom property on an overlay (cards darken as they turn edge-on, which is
 * most of what sells the depth), and `pointer-events: none` on any card
 * turned more than ~75° away, so a card on the far side of the ring can never
 * be hovered or clicked through the gap between the front ones. The two
 * neighbours of a centred card sit at 72°, inside that, so they stay
 * hoverable. `--shade` is a custom property rather than an inline `opacity`
 * on purpose: the component sheet pins every element with an inline opacity
 * to 1 (`src/sheet/sheet.css`), which would paint every overlay solid.
 *
 * The loop only runs while something is moving. It stops for any *hold* —
 * a track being hovered, focused or tapped; the visitor's pause button; the
 * section being off-screen (an IntersectionObserver, not a scroll listener);
 * the tab being hidden — and restarts with a zero first step when the last
 * hold lifts. Frame steps are clamped, so a long frame never lurches. A turn
 * to the front (`seekTo`) runs whatever is holding the ring.
 *
 * ---------------------------------------------------------------------------
 * Hover, focus, touch
 * ---------------------------------------------------------------------------
 * Every way in ends the same way: `center()` holds the ring, turns the card
 * to the front and, once it lands, makes it `active` — the one piece of
 * state, which opens that card's description. A ref records what opened it:
 *
 *   mouse     resting on a card for 130ms centres it (so a pointer crossing
 *             the ring on its way somewhere else turns nothing); a click
 *             centres it at once. The description stays open while the
 *             pointer is anywhere over the ring — resting on a neighbour
 *             centres that one instead — and closes 160ms after it leaves.
 *             Only a pointer that actually moves counts as hovering: the turn
 *             carries a new card under a resting pointer, and that card is
 *             ignored until the pointer has been somewhere else, or every
 *             centring would set off the next.
 *   keyboard  focus on a card (`:focus-visible` only, so a mouse click that
 *             focuses a button does not count) centres it. Blur closes and
 *             lets the ring go. Escape closes but the ring stays still while
 *             focus is on it — "Escape dismisses, blur resumes".
 *   touch     tap centres; tapping the open card again, or anywhere else,
 *             closes. `click`, not `pointerdown`, is what closes it, so
 *             scrolling past does not.
 *
 * **What a screen reader gets.** Each card is a real `<button>` named by its
 * track ("Best Personal Finance, Sponsored track") and described, through
 * `aria-describedby`, by a visually hidden paragraph holding the full
 * description — so the whole text is there the moment focus lands, never a
 * half-typed one. The typed copy in the card is a visual duplicate and is
 * `aria-hidden`. WCAG 2.2.2 wants a way to stop motion that runs for more
 * than five seconds, so there is a "Pause spinning" button under the ring as
 * well as the hover and focus pauses.
 *
 * ---------------------------------------------------------------------------
 * The description
 * ---------------------------------------------------------------------------
 * Each card carries its kicker (one line, readable while the ring turns) and
 * its description, each in a one-row grid that opens and closes between
 * `0fr` and `1fr` (src/index.css). Opening a card folds the kicker away and
 * unfolds the description beneath the name, which rides up to make room.
 *
 * The description is typed over an invisible copy of itself — the sizer — in
 * the same grid cell, so it is its final size from the first character. The
 * sizer wraps each word in a span; `typeLines()` reads the spans' offsets to
 * find where the browser broke the lines, writes one block per line, and one
 * rAF loop types all of them together, line k starting `k × LINE_STAGGER_MS`
 * after the first, each with its own caret while it types and the last caret
 * blinking once they are all done. It writes `Text.data`, so there is no
 * React render per character. Copied from the sizer's layout, the lines never
 * re-wrap; a resize that changes the width re-reads them and shows the text
 * whole.
 *
 * ---------------------------------------------------------------------------
 * Prerender and reduced motion
 * ---------------------------------------------------------------------------
 * The server and the first client render agree: angle 0, nothing active,
 * every description folded away with its lines empty. Everything that
 * touches the browser happens in effects. The ring's resting 3D arrangement is
 * pure CSS, so the prerendered HTML already paints the ring before any script
 * runs.
 *
 * Reduced motion is handled in two places for the reason Hero's intro gives
 * (src/index.css): the *layout* switches in CSS under the media query, so the
 * first paint is already the static arrangement — the five cards flat in a
 * wrapping row, no backs, no shading, the sizer itself showing as the
 * description — and the *behaviour* reads `usePrefersReducedMotion()`: no
 * loop is started, nothing turns, and nothing is typed.
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
  /** What the open card types, and what `aria-describedby` reads in full. */
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
const REVOLUTION_MS = 40_000

/** Typewriter pace, per line. The lines type side by side, so it can be unhurried. */
const MS_PER_CHAR = 20

/** How far each line starts behind the one above it. */
const LINE_STAGGER_MS = 90

/** How long the pointer rests on a card before the ring turns to it. */
const HOVER_INTENT_MS = 130

/** How long an open description survives the pointer leaving the ring. */
const CLOSE_GRACE_MS = 160

/**
 * A card is hoverable while it faces the viewer by more than this (cosine of
 * its angle, ~75°). Past it the card is edge-on or turned away.
 */
const INTERACTIVE_FACING = 0.25

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

type OpenedBy = 'hover' | 'focus' | 'touch'

export function PrizeTracksSection() {
  const baseId = useId()
  const reduced = usePrefersReducedMotion()
  const [spin] = useState(() => createSpinner(TRACKS.length))

  /** The track whose description is showing, or null. */
  const [active, setActive] = useState<number | null>(null)
  const [userPaused, setUserPaused] = useState(false)

  const viewportRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLUListElement>(null)
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Mirrors and bookkeeping read synchronously by the handlers.
  const activeRef = useRef<number | null>(null)
  /** The track turning to the front or already there; `active` once it lands. */
  const targetRef = useRef<number | null>(null)
  const openedByRef = useRef<OpenedBy | null>(null)
  const focusedRef = useRef<number | null>(null)
  const pointerTypeRef = useRef<string | null>(null)
  /** Where the mouse last actually was, in client coordinates. */
  const pointerRef = useRef({ x: Number.NaN, y: Number.NaN })
  /** A card the ring carried under a resting pointer; ignored until the pointer leaves it. */
  const staleRef = useRef<number | null>(null)
  const intentRef = useRef({ index: -1, timer: 0 })
  const closeTimerRef = useRef(0)

  const clearIntent = useCallback(() => {
    window.clearTimeout(intentRef.current.timer)
    intentRef.current = { index: -1, timer: 0 }
  }, [])

  /** Let the ring go, unless a card is still centring, open or focused. */
  const releaseIfIdle = useCallback(() => {
    spin.hold(
      'interaction',
      targetRef.current !== null || focusedRef.current !== null,
    )
  }, [spin])

  const close = useCallback(() => {
    window.clearTimeout(closeTimerRef.current)
    clearIntent()
    spin.cancelSeek()
    activeRef.current = null
    targetRef.current = null
    openedByRef.current = null
    // A keyboard-focused card keeps the ring still after Escape; blur lets it go.
    releaseIfIdle()
    setActive(null)
  }, [clearIntent, releaseIfIdle, spin])

  /** Turn track `index` to the front, then open its description. */
  const center = useCallback(
    (index: number, openedBy: OpenedBy) => {
      window.clearTimeout(closeTimerRef.current)
      clearIntent()
      targetRef.current = index
      openedByRef.current = openedBy
      // Held synchronously, before React renders, so the turn starts from the
      // angle the ring had when the pointer arrived.
      spin.hold('interaction', true)
      // Whatever was open folds away while the ring turns.
      if (activeRef.current !== null && activeRef.current !== index) {
        activeRef.current = null
        setActive(null)
      }
      const land = () => {
        if (targetRef.current !== index) return
        if (openedBy === 'hover') {
          const under = cardAt(pointerRef.current)
          staleRef.current = under === index ? null : under
        }
        activeRef.current = index
        setActive(index)
      }
      if (reduced) land()
      else spin.seekTo(index, land)
    },
    [clearIntent, reduced, spin],
  )

  const scheduleClose = useCallback(() => {
    window.clearTimeout(closeTimerRef.current)
    closeTimerRef.current = window.setTimeout(close, CLOSE_GRACE_MS)
  }, [close])

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

  /*
   * The typewriter. A layout effect, so the open card's lines are rebuilt
   * (empty) before the frame that starts unfolding it — never a flash of the
   * last time's text.
   */
  useLayoutEffect(() => {
    if (active === null || reduced) return
    const card = cardRefs.current[active]
    const sizer = card?.querySelector<HTMLElement>('[data-prize-sizer]')
    const lines = card?.querySelector<HTMLElement>('[data-prize-lines]')
    if (!sizer || !lines) return
    return typeLines(sizer, lines)
  }, [active, reduced])

  /* While a description is open: Escape, and tap-outside. */
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
      close()
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('click', onClick)
    }
  }, [active, close])

  useEffect(
    () => () => {
      window.clearTimeout(closeTimerRef.current)
      window.clearTimeout(intentRef.current.timer)
    },
    [],
  )

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') return
    const { clientX: x, clientY: y } = event
    const last = pointerRef.current
    // Only a pointer that actually moved counts. A browser may replay a move
    // when the ring slides a card under a resting pointer; that card is not
    // being hovered.
    if (x === last.x && y === last.y) return
    pointerRef.current = { x, y }
    window.clearTimeout(closeTimerRef.current)

    const index = cardIndexOf(event.target)
    if (index !== staleRef.current) staleRef.current = null
    if (
      index === null ||
      index === staleRef.current ||
      index === targetRef.current
    ) {
      if (intentRef.current.index !== -1) {
        clearIntent()
        releaseIfIdle()
      }
      return
    }
    // Mid-turn the cards are sliding under the pointer: let them.
    if (spin.isSeeking() || intentRef.current.index === index) return

    clearIntent()
    // Stopped now, so the card stays under the pointer while the intent waits.
    spin.hold('interaction', true)
    intentRef.current = {
      index,
      timer: window.setTimeout(() => center(index, 'hover'), HOVER_INTENT_MS),
    }
  }

  function handlePointerLeave(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') return
    staleRef.current = null
    if (intentRef.current.index !== -1) {
      clearIntent()
      releaseIfIdle()
    }
    if (openedByRef.current === 'hover') scheduleClose()
  }

  function handleFocus(index: number, event: FocusEvent<HTMLButtonElement>) {
    if (!event.currentTarget.matches(':focus-visible')) return
    focusedRef.current = index
    center(index, 'focus')
  }

  function handleBlur(index: number) {
    if (focusedRef.current !== index) return
    focusedRef.current = null
    if (openedByRef.current === 'focus') close()
    else releaseIfIdle()
  }

  function handleClick(index: number, detail: number) {
    const pointerType = pointerTypeRef.current
    pointerTypeRef.current = null
    const isOpen = activeRef.current === index

    // Keyboard activation (Enter/Space): toggle, as a way to put it back.
    if (detail === 0 || pointerType === null) {
      if (isOpen) close()
      else center(index, 'focus')
      return
    }
    // A mouse click is a hover that does not wait; it never closes.
    if (pointerType === 'mouse') {
      if (targetRef.current !== index) center(index, 'hover')
      return
    }
    if (isOpen) close()
    else if (targetRef.current !== index) center(index, 'touch')
  }

  function toggleUserPause() {
    const next = !userPaused
    spin.hold('user', next)
    setUserPaused(next)
  }

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
        <div
          ref={viewportRef}
          className="prize-viewport"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
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
                    className="prize-slot"
                    style={{ '--i': index } as CSSProperties}
                  >
                    <button
                      ref={(element) => {
                        cardRefs.current[index] = element
                      }}
                      type="button"
                      data-prize-card={index}
                      data-active={active === index}
                      aria-labelledby={
                        track.tag ? `${nameId} ${tagId}` : nameId
                      }
                      aria-describedby={descriptionId}
                      onPointerDown={(event) => {
                        pointerTypeRef.current = event.pointerType
                      }}
                      onClick={(event) => handleClick(index, event.detail)}
                      onFocus={(event) => handleFocus(index, event)}
                      onBlur={() => handleBlur(index)}
                      className="prize-card border-stone/60 bg-frost text-pine hover:border-pine data-[active=true]:border-pine data-[active=true]:bg-cloud focus-visible:outline-pine flex cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-4 sm:p-6 lg:p-8"
                    >
                      <span className="flex items-center justify-between gap-3">
                        <TrackIcon name={track.icon} />
                        <span className="flex items-center gap-3 sm:gap-4">
                          {track.tag ? (
                            <span
                              id={tagId}
                              className={`text-caption rounded-full px-2 py-0.5 font-medium whitespace-nowrap sm:px-2.5 ${
                                track.tag === 'sponsored'
                                  ? 'bg-pine text-cloud'
                                  : 'border-pine/70 bg-cloud text-pine border border-dashed'
                              }`}
                            >
                              {TAG_LABEL[track.tag]}
                            </span>
                          ) : null}
                          <span
                            aria-hidden="true"
                            className="text-eyebrow text-pine/90 font-medium"
                          >
                            {String(index + 1).padStart(2, '0')}
                          </span>
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

                        <span className="prize-fold prize-kicker">
                          <span>
                            <span className="text-caption sm:text-body text-pine/90 block pt-1.5 sm:pt-2">
                              {track.kicker}
                            </span>
                          </span>
                        </span>

                        <span
                          aria-hidden="true"
                          className="prize-fold prize-description"
                        >
                          <span>
                            <span className="prize-description-text text-caption sm:text-body text-pine pt-2 sm:pt-3">
                              <span
                                data-prize-sizer=""
                                className="prize-description-sizer"
                              >
                                {track.description
                                  .split(' ')
                                  .map((word, wordIndex) => (
                                    <Fragment key={wordIndex}>
                                      {wordIndex > 0 ? ' ' : null}
                                      <span>{word}</span>
                                    </Fragment>
                                  ))}
                              </span>
                              <span
                                data-prize-lines=""
                                className="prize-description-lines"
                              />
                            </span>
                          </span>
                        </span>
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
                        className="brand-mark brand-mark-bearcat bg-cloud/20 block h-16 sm:h-24"
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

/** The track index of the card `target` is in, if it is in one. */
function cardIndexOf(target: EventTarget | null): number | null {
  if (!(target instanceof Element)) return null
  const card = target.closest<HTMLElement>('[data-prize-card]')
  const index = Number(card?.dataset.prizeCard)
  return Number.isInteger(index) ? index : null
}

/** The track index of the card under a client point, if any. */
function cardAt({ x, y }: { x: number; y: number }): number | null {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return cardIndexOf(document.elementFromPoint(x, y))
}

/* -------------------------------------------------------------------------- */
/* The typewriter                                                             */
/* -------------------------------------------------------------------------- */

type TypedLine = {
  text: string
  /** The line's text node — written per character, never re-created. */
  node: Text
  element: HTMLElement
  /** Characters showing; -1 before the first frame. */
  shown: number
}

/**
 * Type the sizer's text into `host` — every line at once, line k starting
 * `k × LINE_STAGGER_MS` after the first. Returns the cancel function, which
 * leaves whatever has been typed where it is (the card is folding it away).
 */
function typeLines(sizer: HTMLElement, host: HTMLElement): () => void {
  let frame = 0
  let start = 0
  let width = sizer.offsetWidth
  let lines = buildLines(sizer, host)
  host.dataset.typing = 'true'

  const step = (now: number) => {
    if (!start) start = now
    let typing = false
    lines.forEach((line, k) => {
      const elapsed = now - start - k * LINE_STAGGER_MS
      const count =
        elapsed < 0
          ? 0
          : Math.min(line.text.length, Math.floor(elapsed / MS_PER_CHAR) + 1)
      if (count !== line.shown) {
        line.shown = count
        line.node.data = line.text.slice(0, count)
        line.element.dataset.state =
          count === 0 ? 'waiting' : count < line.text.length ? 'typing' : 'done'
      }
      if (count < line.text.length) typing = true
    })
    if (typing) frame = requestAnimationFrame(step)
    else host.dataset.typing = 'false'
  }
  frame = requestAnimationFrame(step)

  // A new width means new line breaks: read them again and show the text whole.
  const onResize = () => {
    if (sizer.offsetWidth === width) return
    width = sizer.offsetWidth
    cancelAnimationFrame(frame)
    lines = buildLines(sizer, host)
    for (const line of lines) {
      line.node.data = line.text
      line.element.dataset.state = 'done'
    }
    host.dataset.typing = 'false'
  }
  window.addEventListener('resize', onResize)

  return () => {
    cancelAnimationFrame(frame)
    window.removeEventListener('resize', onResize)
    host.dataset.typing = 'false'
  }
}

/** Replace `host`'s children with one empty line per line of the sizer. */
function buildLines(sizer: HTMLElement, host: HTMLElement): TypedLine[] {
  const lines = measureLines(sizer).map((text): TypedLine => {
    const element = document.createElement('span')
    element.className = 'prize-line'
    const node = document.createTextNode('')
    const caret = document.createElement('span')
    caret.className = 'prize-caret'
    element.append(node, caret)
    return { text, node, element, shown: -1 }
  })
  host.replaceChildren(...lines.map((line) => line.element))
  return lines
}

/**
 * The sizer's text, split where the browser broke it: its words are spans,
 * and a word whose top differs from the one before it starts a new line.
 * `offsetTop` is layout, not paint, so the ring's 3D transforms don't touch
 * it, and it works while the description is folded to zero height.
 */
function measureLines(sizer: HTMLElement): string[] {
  const lines: string[] = []
  let top = Number.NEGATIVE_INFINITY
  for (const word of sizer.children) {
    if (!(word instanceof HTMLElement)) continue
    const text = word.textContent ?? ''
    if (Math.abs(word.offsetTop - top) > 2 || lines.length === 0) {
      lines.push(text)
      top = word.offsetTop
    } else {
      lines[lines.length - 1] += ` ${text}`
    }
  }
  return lines
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

    /** True while a `seekTo` turn is under way. */
    isSeeking() {
      return seek !== null
    },
  }
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
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
