/**
 * The HackBU 2027 weekend schedule, as data. Rendered by `TimelineSection.tsx`.
 *
 * **These are last year's times, not announced ones.** HackBU 2027 runs
 * Saturday 30 – Sunday 31 January 2027 (the date the Sponsors page carries,
 * `src/sponsors/SponsorshipTiersSection.tsx`), and nobody has published its
 * schedule yet. Every time below is carried over, same weekday and same clock
 * time, from a schedule HackBU actually published for an earlier event, and
 * each entry cites where its time came from. The section says as much on the
 * page. When the real 2027 schedule is out, replace the times here and delete
 * the "Tentative" line in `TimelineSection.tsx`.
 *
 * The sources, most recent first:
 *
 *   [2026-blog]    "HackBU 2026 Information", hackbu.org, 4 March 2026 —
 *                  https://hackbu.org/blog/2026/03/04/hackbu-2026-information.html
 *                  The schedule attendees were sent three days before the event
 *                  (HackBU 2026, Sat 7 – Sun 8 March 2026, Innovative
 *                  Technologies Complex). Its dinner line was moved from "6pm"
 *                  to "7pm (approximate)" the night before the event, in
 *                  github.com/HackBinghamton/hackbinghamton.github.io commit
 *                  6b97012 ("update dinner time", 2026-03-07 03:16 UTC), so it
 *                  is the latest word on 2026.
 *   [2026-devpost] https://hackbu2026.devpost.com/ — the same schedule, minus
 *                  that last edit (it still says dinner at 6pm), and
 *                  https://hackbu2026.devpost.com/details/dates — submissions
 *                  open "March 07 at 1:00pm EST", close "March 08 at 12:00pm
 *                  EDT". The club calendar's "HackBU 2026" event runs 11:00 on
 *                  the 7th to 16:00 on the 8th, which agrees.
 *   [2024]         "HackBU 2024 Schedule", https://hackbu.org/2024/schedule —
 *                  the last full hour-by-hour schedule HackBU published (Sat 17
 *                  – Sun 18 February 2024). The page stores ISO timestamps in
 *                  UTC; the times cited below are those converted to Eastern.
 *                  The 2023 schedule (https://hackbu.org/2023/schedule) has the
 *                  same meal pattern.
 *
 * 2026 is the base. Two entries come from 2024 because the 2026 announcement
 * only listed "the important points" and has no counterpart for them — the
 * midnight snack and Sunday lunch. 2026's post said breakfast "is the last
 * meal that will be provided", so Sunday lunch is the one entry here that last
 * year's event did not have; it is kept because both earlier schedules had it
 * and because the club's own rule of thumb for the weekend is two lunches, a
 * dinner and a breakfast. No time on this list is invented.
 *
 * Times are stored as 24-hour `HH:MM` wall-clock strings in Eastern time and
 * the component formats them itself, rather than through `Intl` — ICU builds
 * disagree on the space before "PM" (Node and some browsers emit U+202F), and
 * the prerendered text has to match the first client render exactly.
 */

/** Late January is Eastern *standard* time; 2027's switch to EDT is 14 March. */
export const TIMELINE_UTC_OFFSET = '-05:00'

export type TimelineEntry = {
  /** 24-hour wall-clock time in Eastern, `HH:MM`. */
  time: `${number}${number}:${number}${number}`
  title: string
  /** One line. Nothing that depends on a room or a sponsor not yet confirmed. */
  description: string
  /** Set on the entries where food is served; the row is marked on the page. */
  food?: 'meal' | 'snack'
}

export type TimelineDay = {
  /** Used for element ids. */
  id: string
  weekday: string
  /** ISO date, `YYYY-MM-DD`, for `<time dateTime>`. */
  date: string
  /** The date as printed under the weekday. */
  dateLabel: string
  entries: readonly TimelineEntry[]
}

export const TIMELINE_DAYS: readonly TimelineDay[] = [
  {
    id: 'saturday',
    weekday: 'Saturday',
    date: '2027-01-30',
    dateLabel: 'January 30',
    entries: [
      {
        // Sourced: [2026-blog], [2026-devpost] — "11am: Check-in opens."
        time: '11:00',
        title: 'Check-in opens',
        description:
          'Sign in, pick up your wristband and a map of the venue, and find a seat.',
      },
      {
        // Sourced: [2026-devpost] — "12pm: The Opening Ceremony begins".
        // [2026-blog] prints this as "12am", a typo: it sits between the 11am
        // check-in and the 1pm start, and the Devpost copy says 12pm.
        time: '12:00',
        title: 'Opening ceremony',
        description:
          'The rules, the full schedule and our sponsors, all in one room.',
      },
      {
        // Sourced: [2026-blog], [2026-devpost] — "1pm: The competition
        // begins", with "a team-making event" at the same hour. Devpost's
        // submission window opens "March 07 at 1:00pm EST".
        time: '13:00',
        title: 'Hacking begins',
        description:
          'The clock starts. No team yet? Join the team-forming session.',
      },
      {
        // Sourced: [2026-blog], [2026-devpost] — "1pm: … A catered lunch will
        // be available. You will be called up by the color of your wristband."
        time: '13:00',
        title: 'Lunch',
        description: 'Catered, and called up in groups so the line keeps moving.',
        food: 'meal',
      },
      {
        // Sourced: [2024] — "Python Workshop" and "Web Development Workshop",
        // both 2024-02-17T20:00Z = 3:00 PM EST. (2026's one workshop ran at
        // 1pm, alongside the start of hacking.)
        time: '15:00',
        title: 'Workshops',
        description:
          'Beginner-friendly crash courses to get a first project off the ground.',
      },
      {
        // Sourced: [2026-blog], [2026-devpost] — "5pm: Jack Fischer will
        // provide a talk in the Symposium Hall". The 2027 speaker is not known.
        time: '17:00',
        title: 'Guest talk',
        description: 'Step away from the keyboard for a talk from a guest speaker.',
      },
      {
        // Sourced: [2026-blog] — "7pm (approximate): A catered dinner will be
        // provided." [2026-devpost] still says 6pm, as did [2024]; the blog's
        // 7pm was the last change before the event (commit 6b97012).
        time: '19:00',
        title: 'Dinner',
        description: 'A catered dinner, called up in groups again.',
        food: 'meal',
      },
    ],
  },
  {
    id: 'sunday',
    weekday: 'Sunday',
    date: '2027-01-31',
    dateLabel: 'January 31',
    entries: [
      {
        // Sourced: [2024] — "Midnight Snack Bananza", 2024-02-18T05:00Z =
        // 12:00 AM EST. (2023: "Midnight snack served", the same hour.) Not on
        // the 2026 list.
        time: '00:00',
        title: 'Midnight snack',
        description: 'A late-night refuel for anyone still going.',
        food: 'snack',
      },
      {
        // Sourced: [2026-blog], [2026-devpost] — "9:30am: A light breakfast
        // will be available."
        time: '09:30',
        title: 'Breakfast',
        description: 'A light breakfast and coffee for the final stretch.',
        food: 'meal',
      },
      {
        // Sourced: [2026-blog], [2026-devpost] — "12pm: The competition will
        // end. All your materials will need to be submitted by this time."
        // Devpost's submission window closes "March 08 at 12:00pm EDT".
        time: '12:00',
        title: 'Hacking ends',
        description:
          'Pencils down. Your project and its write-up must be submitted by now.',
      },
      {
        // Sourced: [2024] — "Lunch served", 2024-02-18T17:00Z = 12:00 PM EST,
        // at the same moment "Hacking ends!". (2023: the same.) NOT on the
        // 2026 list, whose breakfast was "the last meal that will be provided".
        time: '12:00',
        title: 'Lunch',
        description: 'One more catered meal before the demos start.',
        food: 'meal',
      },
      {
        // Sourced: [2026-blog], [2026-devpost] — "1pm: Members will begin
        // demonstrating their projects to our team of judges."
        time: '13:00',
        title: 'Demos and judging',
        description: 'Every team shows the judges what it built.',
      },
      {
        // Sourced: [2026-blog], [2026-devpost] — "4pm: The Closing Ceremony
        // will begin, during which we will announce the winners."
        time: '16:00',
        title: 'Closing ceremony and awards',
        description: 'The winners are announced. Then, finally, sleep.',
      },
    ],
  },
]
