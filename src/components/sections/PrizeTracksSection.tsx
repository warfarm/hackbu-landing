import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { Eyebrow, Section, SectionHeader } from '../Layout'
import { Reveal } from '../Reveal'
import { IceWallCanvas } from '../../three/IceWallCanvas'
import type { WallBrick } from '../../three/iceWall'

/**
 * "Prize tracks" — last year's five categories as a wall of ice blocks, laid
 * the way an igloo's courses are: two blocks on top, three below, each top
 * block bridging the joint beneath it. Each block names a track; choosing one
 * brings it out in front of the wall, dims the others, and shows the track in
 * full in the panel beside the wall.
 *
 * **What the copy is.** The five tracks and their wording come from HackBU
 * 2026 — the event-information post on hackbu.org
 * (hackbu.org/blog/2026/03/04/hackbu-2026-information.html) and the Devpost
 * page (hackbu2026.devpost.com), which is also where the five judging
 * criteria under the wall come from. 2027's tracks are not confirmed, so the
 * lede says these are last year's, and no sponsor is named: the two tracks
 * that were sponsored carry a "Sponsored track" label and nothing more. No
 * prize amounts either — they belong to the year that pays them. Best Harpur
 * had no qualifying winner in 2026 (four winners across five tracks on the
 * Devpost gallery), and says so, as an invitation.
 *
 * **Semantics.** The wall is a tab list and the panel its one tab panel
 * (WAI-ARIA tabs, automatic activation): Tab reaches the chosen block, the
 * arrow keys, Home and End move between blocks and show each as they land,
 * and Tab again moves into the panel. A pointer just clicks. The first track
 * is chosen from the start, so the panel is never empty, and the prerendered
 * HTML already holds it.
 *
 * **Look.** Where WebGL runs, the blocks are real 3D ice
 * (src/three/iceWall.ts, booted by <IceWallCanvas>): frosted blocks with
 * depth, lit like the section scenes, each track's icon, number and name
 * etched into its face, the chosen block out in front of the wall, its ice
 * lit softly from inside (the lettering left dark), and the others dimmed.
 * The buttons stay on top as the controls, their own look
 * dropped (`.ice-wall[data-3d]` in src/index.css) once the scene draws.
 * Before that, and without WebGL or under forced colours, the blocks are
 * pure CSS — layered gradients of `cloud`, `frost` and `horizon` for the
 * ice, pale striations, a bevel of inset shadows and chamfered corners — in
 * the `.ice-*` block of src/index.css. Text on them is
 * `ink` and stays above 4.5:1 on the darkest part of the gradient. The chosen
 * block rises and gets an `ink` ring, and the panel's text rises in; both
 * are transforms, and both are dropped under reduced motion (in CSS, so the
 * prerendered page already obeys it), where the ring alone shows the choice.
 */

type TrackTag = 'sponsored' | 'unclaimed'

type TrackIconName = 'trophy' | 'sprout' | 'interface' | 'coin' | 'book'

type Track = {
  /** Stable key and id fragment. */
  id: string
  /** Every track is a "Best …"; the block sets "Best" small above this. */
  name: string
  /** One line under the name, in the panel. */
  kicker: string
  /** The full description, in the panel. */
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

/** Which course each block sits in, top first; the grid places them. */
const COURSE: Record<string, 'top' | 'bottom'> = {
  overall: 'top',
  beginner: 'top',
  'user-interface': 'bottom',
  'personal-finance': 'bottom',
  harpur: 'bottom',
}

export function PrizeTracksSection() {
  const baseId = useId()
  const [chosen, setChosen] = useState(0)
  /** True while the 3D wall is drawing (never in the prerender). */
  const [wall3d, setWall3d] = useState(false)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const wallRef = useRef<HTMLDivElement>(null)
  const panelId = `${baseId}-panel`
  const tabId = (index: number) => `${baseId}-tab-${index}`

  function choose(index: number) {
    const next = (index + TRACKS.length) % TRACKS.length
    setChosen(next)
    tabRefs.current[next]?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        choose(index + 1)
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        choose(index - 1)
        break
      case 'Home':
        choose(0)
        break
      case 'End':
        choose(TRACKS.length - 1)
        break
      default:
        return
    }
    event.preventDefault()
  }

  const track = TRACKS[chosen]
  if (!track) return null

  return (
    <Section id="prizes" labelledBy="prizes-title">
      <Reveal>
        <SectionHeader
          eyebrow="Prize tracks"
          titleId="prizes-title"
          title="Five ways to win."
          lede="These were the five tracks at HackBU 2026; 2027’s will be confirmed closer to the weekend. You don’t sign up for a track — judges do the nominating, and each project can win in one."
        />
      </Reveal>

      <Reveal delay={0.05} className="mt-10 sm:mt-14">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
          <div className="ice-wall" data-3d={wall3d ? '' : undefined}>
            <IceWallCanvas
              bricks={BRICKS}
              chosen={chosen}
              wallRef={wallRef}
              onReady={setWall3d}
            />
            {/* The igloo's dome, surveyed over the wall. Decorative. */}
            <svg
              aria-hidden="true"
              focusable="false"
              className="ice-dome"
              viewBox="0 0 600 200"
              preserveAspectRatio="none"
            >
              <path d="M8 198 C 40 30, 560 30, 592 198" />
              <path d="M300 34 v10 M150 72 l4 9 M450 72 l-4 9 M64 132 l8 6 M536 132 l-8 6" />
            </svg>
            <div
              ref={wallRef}
              role="tablist"
              aria-label="Prize tracks"
              aria-orientation="horizontal"
              className="ice-courses"
            >
              {TRACKS.map((item, index) => {
                const selected = index === chosen
                return (
                  <button
                    key={item.id}
                    ref={(element) => {
                      tabRefs.current[index] = element
                    }}
                    id={tabId(index)}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={panelId}
                    tabIndex={selected ? 0 : -1}
                    data-course={COURSE[item.id] ?? 'bottom'}
                    data-chosen={selected ? '' : undefined}
                    onClick={() => setChosen(index)}
                    onKeyDown={(event) => handleKeyDown(event, index)}
                    className="ice-brick text-ink cursor-pointer text-left"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <TrackIcon name={item.icon} />
                      <span aria-hidden="true" className="text-[0.6875rem] font-medium tracking-[0.12em]">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </span>
                    <span className="mt-auto block pt-4">
                      <span className="block text-[0.6875rem] font-medium tracking-[0.12em] uppercase">
                        Best
                      </span>
                      <span className="font-display block text-lg leading-tight font-semibold sm:text-xl">
                        {item.name}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId(chosen)}
            tabIndex={0}
            className="hud-panel bg-frost focus-visible:outline-ink p-6 focus-visible:outline-2 focus-visible:outline-offset-4 sm:p-8"
          >
            {/*
             * Keyed, so each new track rises in. Gated in CSS, not with the
             * hook: the hook cannot answer before hydration, and the first
             * panel is in the prerendered HTML.
             */}
            <div
              key={track.id}
              className="animate-intro-rise motion-reduce:animate-none"
            >
              <p className="hud-label text-eyebrow text-ink font-medium uppercase">
                Track {String(chosen + 1).padStart(2, '0')} / {String(TRACKS.length).padStart(2, '0')}
              </p>
              <h3 className="font-display text-ink mt-4 text-2xl leading-tight font-semibold sm:text-3xl">
                Best {track.name}
              </h3>
              <p className="text-caption text-ink mt-2 font-medium uppercase">
                {track.kicker}
              </p>
              {track.tag ? (
                <p className="border-ink text-ink mt-4 inline-block border px-2 py-0.5 text-[0.6875rem] font-medium tracking-[0.12em] uppercase">
                  {TAG_LABEL[track.tag]}
                </p>
              ) : null}
              <p className="text-body text-ink mt-5">{track.description}</p>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <Eyebrow>What judges scored in 2026</Eyebrow>
          <ul className="mt-4 flex flex-wrap gap-2">
            {CRITERIA.map((criterion) => (
              <li
                key={criterion}
                className="border-ink/30 text-caption text-ink rounded-none border px-3 py-1"
              >
                {criterion}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/* Glyphs                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * One small line drawing per track, as SVG path data in a 24-unit box — the
 * button draws them as <path>s, and the 3D wall etches the same strokes into
 * its ice. (The rectangle and the circle are written out as paths so both can
 * share them.) Decorative.
 */
const ICON_SHAPES: Record<TrackIconName, readonly string[]> = {
  trophy: [
    'M7.5 4h9v4.5a4.5 4.5 0 0 1-9 0V4z',
    'M7.5 6H5.25a2.25 2.25 0 0 0 2.6 3.2',
    'M16.5 6h2.25a2.25 2.25 0 0 1-2.6 3.2',
    'M12 13v3.5',
    'M9.5 16.5h5l.75 3.5h-6.5z',
  ],
  sprout: [
    'M12 20v-7',
    'M12 13c0-3.9-2.9-6.5-6.5-6.5 0 3.9 2.9 6.5 6.5 6.5z',
    'M12 15.5c0-3.3 2.3-5.5 5.5-5.5 0 3.3-2.3 5.5-5.5 5.5z',
    'M8 20h8',
  ],
  interface: [
    'M5.5 4.5h13a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z',
    'M3.5 8.5h17',
    'M12.5 11.5l5.5 2.2-2.3.9-.9 2.3z',
    'M9 20.5h6',
  ],
  coin: [
    'M20.25 12a8.25 8.25 0 1 1-16.5 0a8.25 8.25 0 1 1 16.5 0z',
    'M14.6 9.6c-.4-.9-1.4-1.5-2.6-1.5-1.5 0-2.6.8-2.6 1.95 0 2.7 5.3 1.3 5.3 4 0 1.15-1.2 1.95-2.7 1.95-1.25 0-2.3-.6-2.7-1.55',
    'M12 6.6v1.5M12 15.9v1.5',
  ],
  book: [
    'M12 6.8C10.2 5.4 7.5 4.8 4.5 5.2v12.6c3-.4 5.7.2 7.5 1.6 1.8-1.4 4.5-2 7.5-1.6V5.2c-3-.4-5.7.2-7.5 1.6z',
    'M12 6.8v12.6',
  ],
}

/** The 3D wall's blocks: the tracks again, as the scene needs them. */
const BRICKS: readonly WallBrick[] = TRACKS.map((track, index) => ({
  name: track.name,
  number: String(index + 1).padStart(2, '0'),
  kicker: 'Best',
  icon: ICON_SHAPES[track.icon],
  capped: COURSE[track.id] === 'top',
}))

function TrackIcon({ name }: { name: TrackIconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="text-ink size-7 shrink-0 sm:size-8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICON_SHAPES[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

