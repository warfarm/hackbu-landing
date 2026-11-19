/**
 * The break between two sections: an "ice cut".
 *
 * A single diagonal hairline crosses the window with a pale wedge of `horizon`
 * under it, and small survey marks sit along it — the same language as the
 * panels and labels around it. It replaced the rounded snowdrift bands when
 * the site moved to the ice HUD look; the component keeps its name and its
 * variants because they are what the pages already ask for. A variant only
 * changes the slope and where the marks fall, so consecutive breaks do not
 * look stamped.
 *
 * Decorative throughout. The only motion is the survey marks drifting along
 * the cut with the scroll (`.drift-mark` in src/index.css, a CSS
 * scroll-driven animation that does not run under reduced motion).
 */

type DriftVariant =
  | 'drift-a'
  | 'drift-b'
  | 'drift-c'
  | 'cloud-to-frost'
  | 'frost-to-cloud'

type Cut = {
  /** Height of the line at the left and right edge, 0 (top) to 96 (bottom). */
  from: number
  to: number
  /** Where the survey marks sit, as percentages of the width. */
  marks: readonly number[]
}

const CUTS: Record<DriftVariant, Cut> = {
  'drift-a': { from: 72, to: 24, marks: [12, 58, 91] },
  'drift-b': { from: 28, to: 68, marks: [24, 47, 83] },
  'drift-c': { from: 60, to: 18, marks: [8, 36, 72] },
  'cloud-to-frost': { from: 22, to: 74, marks: [18, 64] },
  'frost-to-cloud': { from: 70, to: 26, marks: [30, 88] },
}

export function SnowdriftDivider({ variant }: { variant: DriftVariant }) {
  const { from, to, marks } = CUTS[variant]

  return (
    <div aria-hidden="true" className="relative h-16 w-full sm:h-24">
      <svg
        viewBox="0 0 1440 96"
        preserveAspectRatio="none"
        focusable="false"
        className="block h-full w-full"
      >
        <path
          d={`M0,${from} L1440,${to} V96 H0 Z`}
          className="fill-horizon/15"
        />
        <path
          d={`M0,${from} L1440,${to}`}
          vectorEffect="non-scaling-stroke"
          className="stroke-ink/35 fill-none"
          strokeWidth="1"
        />
      </svg>
      {marks.map((mark) => (
        <span
          key={mark}
          className="drift-mark text-ink/60 absolute -translate-x-1/2 -translate-y-1/2 text-[0.75rem] leading-none"
          style={{
            left: `${mark}%`,
            top: `${((from + ((to - from) * mark) / 100) / 96) * 100}%`,
          }}
        >
          +
        </span>
      ))}
    </div>
  )
}
