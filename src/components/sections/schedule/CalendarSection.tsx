import { Eyebrow, Section, SectionHeader } from '../../Layout'
import { ExternalLink, LINK_ON_CLOUD } from '../../ExternalLink'
import { Reveal, RevealGroup, RevealItem } from '../../Reveal'
import {
  GOOGLE_CALENDAR_EMBED_URL,
  GOOGLE_CALENDAR_URL,
  ICAL_URL,
} from '../../../lib/links'

const LINK_CLASSES =
  'font-display text-display-md font-semibold underline underline-offset-8 ' +
  LINK_ON_CLOUD

export function CalendarSection() {
  return (
    <Section id="calendar" labelledBy="calendar-title" className="bg-cloud">
      <Reveal>
        <SectionHeader
          eyebrow="Calendar"
          titleId="calendar-title"
          title="See what’s coming up."
          lede="Weekly workshops and special events live on the HackBU calendar. Times and locations may change — check here for the latest."
        />
      </Reveal>

      <Reveal delay={0.1}>
        <div className="border-frost mt-12 overflow-hidden rounded-2xl border bg-cloud">
          <iframe
            title="HackBU event calendar"
            src={GOOGLE_CALENDAR_EMBED_URL}
            className="block h-[32rem] w-full sm:h-[40rem]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </Reveal>

      <RevealGroup className="mt-12 grid gap-10 sm:grid-cols-2">
        <RevealItem>
          <Eyebrow>Google Calendar</Eyebrow>
          <ExternalLink
            href={GOOGLE_CALENDAR_URL}
            className={`${LINK_CLASSES} mt-4 inline-block`}
          >
            Add to Google Calendar
          </ExternalLink>
          <p className="text-caption text-pine/90 mt-4">
            Subscribe so events show up in your Google account.
          </p>
        </RevealItem>

        <RevealItem>
          <Eyebrow>Other calendar apps</Eyebrow>
          <ExternalLink
            href={ICAL_URL}
            className={`${LINK_CLASSES} mt-4 inline-block`}
          >
            Add with iCalendar
          </ExternalLink>
          <p className="text-caption text-pine/90 mt-4">
            Works with Apple Calendar, Outlook, and other apps that take an .ics
            link.
          </p>
        </RevealItem>
      </RevealGroup>
    </Section>
  )
}
