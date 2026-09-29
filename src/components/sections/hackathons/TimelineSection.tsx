import { Section, SectionHeader } from '../../Layout'
import { Reveal, RevealGroup, RevealItem } from '../../Reveal'
import {
  TIMELINE_DAYS,
  TIMELINE_UTC_OFFSET,
  type TimelineDay,
  type TimelineEntry,
} from './timeline'

/**
 * The hackathon weekend, hour by hour — `/hackathons#timeline`. The landing
 * page links to that anchor, so the `id` is part of the site's URL surface;
 * rename it and that link breaks.
 *
 * The schedule is data (`./timeline.ts`, beside this file, where every time
 * carries the citation it was taken from). Both files live under
 * `src/components/sections/hackathons/`, which `vite.config.ts` keeps out of the
 * `shared` chunk, so only this page downloads them; `src/lib/` would have put
 * the whole schedule in front of every page.
 *
 * **Honesty first.** The 2027 schedule has not been published. The times are
 * last year's (two of them 2024's), carried over to the same weekday, and the
 * header says so in plain words — "Tentative" leads the line rather than hiding in small print,
 * because a visitor planning a bus home around "4:00 PM" should know it is an
 * estimate. The same line says the times are Eastern: out-of-town hackers read
 * this page too.
 *
 * **Markup.** One `<ol>` per day, labelled by that day's `<h3>`, because the
 * order is the content. Every time is a `<time>` with a full offset
 * (`2027-01-30T13:00-05:00`), so a browser extension or a screen reader that
 * understands dates gets an unambiguous instant, and the printed label is
 * formatted by hand (see `formatTime`) so the prerendered text and the first
 * client render cannot disagree. Event names are not headings: thirteen
 * `<h4>`s would bury the two day headings in a screen reader's heading list,
 * and the list already gives each entry its own stop.
 *
 * **Meals.** Food is the thing people scan a schedule for, so a meal row is
 * marked twice: a filled dot on the rail instead of a ring, and a "Meal" /
 * "Snack" tag beside the name. The tag is real text — the distinction never
 * rests on the dot's fill alone (WCAG 1.4.1) — and it stays in the pine/frost
 * pair rather than borrowing `brick`, which is the site's one accent and means
 * "act on this".
 *
 * **Layout.** Below `sm` each entry is a single column — time, name,
 * description — beside a rail on the far left, which holds at 360px with room
 * to spare. From `sm` the time moves into a fixed left column and the rail runs
 * between time and name, the conventional timeline shape. From `lg` the two
 * days sit side by side. The rail is decorative (`stone`, a hairline token)
 * and so is each dot; both are `aria-hidden`.
 *
 * **Motion.** The header is a `<Reveal>`; each day is a `<RevealGroup>`, so its
 * entries rise one after another down the rail. `RevealGroup` has no `ol`
 * form, and does not need one: motion hands variants down through React
 * context, not the DOM, so the `<RevealItem as="li">`s still inherit the
 * group's timeline through the plain `<ol>` between them. Under reduced motion
 * every piece renders at rest (see `src/components/Reveal.tsx`).
 */

/** "13:00" -> "1:00 PM". Deterministic, unlike `Intl` — see `./timeline.ts`. */
function formatTime(time: TimelineEntry['time']): string {
  const [hours, minutes] = time.split(':')
  const hour = Number(hours)
  const suffix = hour < 12 ? 'AM' : 'PM'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${minutes} ${suffix}`
}

export function TimelineSection() {
  return (
    <Section id="timeline" labelledBy="timeline-title" className="bg-cloud">
      <Reveal>
        <SectionHeader
          eyebrow="HackBU 2027 • Jan 30 – Jan 31"
          titleId="timeline-title"
          title="The weekend, hour by hour."
          lede="From check-in on Saturday morning to the awards on Sunday afternoon: when the clock starts, when it stops, and when the food shows up."
        />
        <p className="text-caption text-pine/90 mt-5 max-w-2xl">
          <strong className="text-pine font-medium">Tentative.</strong> These
          times are based on our past schedules, mostly last year’s. Final
          times will be posted closer to the event. All times are Eastern.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-14 sm:mt-16 lg:grid-cols-2 lg:gap-16">
        {TIMELINE_DAYS.map((day) => (
          <TimelineDayColumn key={day.id} day={day} />
        ))}
      </div>
    </Section>
  )
}

function TimelineDayColumn({ day }: { day: TimelineDay }) {
  const headingId = `timeline-${day.id}-title`

  return (
    <RevealGroup>
      <RevealItem className="border-frost flex items-baseline justify-between gap-4 border-b pb-4">
        <h3
          id={headingId}
          className="font-display text-display-md text-pine font-semibold"
        >
          {day.weekday}
        </h3>
        <time
          dateTime={day.date}
          className="text-caption text-pine/90 font-medium"
        >
          {day.dateLabel}
        </time>
      </RevealItem>

      <ol aria-labelledby={headingId} className="mt-8">
        {day.entries.map((entry, index) => (
          <TimelineRow
            key={`${entry.time}-${entry.title}`}
            day={day}
            entry={entry}
            isLast={index === day.entries.length - 1}
          />
        ))}
      </ol>
    </RevealGroup>
  )
}

function TimelineRow({
  day,
  entry,
  isLast,
}: {
  day: TimelineDay
  entry: TimelineEntry
  isLast: boolean
}) {
  const isFood = entry.food !== undefined

  return (
    <RevealItem
      as="li"
      className="relative pb-8 pl-8 last:pb-0 sm:grid sm:grid-cols-[6rem_minmax(0,1fr)] sm:items-baseline sm:gap-x-10 sm:pl-0"
    >
      {/*
        This row's piece of the rail: from the centre of its dot to the centre
        of the next row's, so the line starts and ends on a dot rather than
        trailing past the last one. Each row carries its own segment, so the
        rail grows down the column with the staggered reveal. It comes before
        the dot in the source so the dot (and the next row's) paints over it.
        Mobile: on a 12px dot at x=0. sm+: in the 2.5rem gap after the 6rem
        time column.
      */}
      {isLast ? null : (
        <span
          aria-hidden="true"
          className="bg-stone absolute top-2.5 -bottom-2.5 left-[5px] w-0.5 sm:top-3.5 sm:-bottom-3.5 sm:left-[calc(6rem+1.25rem-1px)]"
        />
      )}

      {/*
        The dot, centred on the first line beside it: the time's 21px line
        below `sm`, the name's 28px line from `sm` (the time shares that
        baseline through `items-baseline`).
      */}
      <span
        aria-hidden="true"
        className={`border-pine absolute top-1 left-0 h-3 w-3 rounded-full border-2 sm:top-2 sm:left-[calc(6rem+1.25rem-6px)] ${
          isFood ? 'bg-pine' : 'bg-cloud'
        }`}
      />

      <time
        dateTime={`${day.date}T${entry.time}${TIMELINE_UTC_OFFSET}`}
        className="text-caption text-pine block font-medium tabular-nums sm:text-right"
      >
        {formatTime(entry.time)}
      </time>

      <div className="mt-1 sm:mt-0">
        <p className="text-body text-pine flex flex-wrap items-center gap-x-3 gap-y-1 font-medium">
          <span>{entry.title}</span>
          {entry.food ? <FoodTag kind={entry.food} /> : null}
        </p>
        <p className="text-caption text-pine/90 mt-1 max-w-lg text-pretty">
          {entry.description}
        </p>
      </div>
    </RevealItem>
  )
}

/**
 * The "Meal" / "Snack" marker. Frost fill, pine text (well past AA on frost),
 * and a knife-and-fork glyph that is decoration only — the word carries the
 * meaning, for screen readers and for anyone who does not read the icon.
 */
function FoodTag({ kind }: { kind: NonNullable<TimelineEntry['food']> }) {
  return (
    <span className="bg-frost text-pine text-caption inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium">
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
        className="h-3.5 w-3.5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Fork: three tines joined at the bottom, then the handle. */}
        <path d="M5 3v5a3 3 0 0 0 6 0V3" />
        <path d="M8 3v18" />
        {/* Knife: a blade that curves off the spine, then the handle. */}
        <path d="M19 21V3c-2.5 1.5-4 4.5-4 9h4" />
      </svg>
      {kind === 'meal' ? 'Meal' : 'Snack'}
    </span>
  )
}
