/**
 * Every off-site URL the page points at, in one place.
 *
 * These are the canonical live URLs taken from hackbu.org — later phases should
 * reuse these constants rather than re-typing hrefs.
 */

export const DISCORD_URL = 'https://discord.gg/Xka5uUh'
export const CONTACT_EMAIL = 'hello@hackbu.org'

/** The redesigned schedule page on this deployment. */
export const SCHEDULE_URL = '/schedule'

/** Public HackBU Google Calendar id (group calendar). */
const GOOGLE_CALENDAR_ID =
  'c_mjq1vimjo2ofofmoefpfri03e4@group.calendar.google.com'

/** Google Calendar subscription for HackBU events (from hackbu.org/schedule). */
export const GOOGLE_CALENDAR_URL =
  'https://calendar.google.com/calendar/u/0?cid=Y19tanExdmltam8yb2ZvZm1vZWZwZnJpMDNlNEBncm91cC5jYWxlbmRhci5nb29nbGUuY29t'

/**
 * Embeddable month view of the same public calendar.
 * bgcolor matches `--color-cloud`; title is hidden because the section supplies one.
 */
export const GOOGLE_CALENDAR_EMBED_URL =
  'https://calendar.google.com/calendar/embed?' +
  new URLSearchParams({
    src: GOOGLE_CALENDAR_ID,
    ctz: 'America/New_York',
    bgcolor: '#f7f5ee',
    color: '#3c5c48',
    showTitle: '0',
    showPrint: '0',
    showTabs: '1',
    showCalendars: '0',
    showTz: '0',
  }).toString()

/** iCalendar feed for other calendar apps (from hackbu.org/schedule). */
export const ICAL_URL = `https://calendar.google.com/calendar/ical/${encodeURIComponent(GOOGLE_CALENDAR_ID)}/public/basic.ics`

/** The mailing-list / interest-form signup. */
export const MAILING_LIST_URL = 'https://hackbu.org/mailing-list'

/** In-site About us page. Clean URL; Vite and Vercel rewrite it to about.html. */
export const ABOUT_PATH = '/about'

/** In-site Sponsors page. Clean URL; Vite and Vercel rewrite it to sponsors.html. */
export const SPONSORS_PATH = '/sponsors'

/** In-site hackathons and registration page. */
export const HACKATHONS_PATH = '/hackathons'

/** In-site organizers page. Clean URL; Vite and Vercel rewrite it to organizers.html. */
export const ORGANIZERS_PATH = '/organizers'

/** Header nav destinations (the Discord CTA is separate). */
export const NAV_LINKS = [
  { label: 'About Us', href: ABOUT_PATH },
  { label: 'Schedule', href: SCHEDULE_URL },
  { label: 'Sponsors', href: SPONSORS_PATH },
  { label: 'Organizers', href: ORGANIZERS_PATH },
  { label: 'Hackathons', href: HACKATHONS_PATH },
] as const

/** Site pages split into two footer columns. */
export const SITE_PAGES = [
  { label: 'Schedule', href: SCHEDULE_URL },
  { label: 'Organizers', href: ORGANIZERS_PATH },
  { label: 'Hackathons', href: HACKATHONS_PATH },
  { label: 'Registration', href: `${HACKATHONS_PATH}#register` },
  { label: 'Blog', href: 'https://hackbu.org/blog' },
  { label: 'Photos', href: 'https://hackbu.org/photos' },
  { label: 'About Us', href: ABOUT_PATH },
  { label: 'Sponsors', href: SPONSORS_PATH },
] as const

export const SOCIAL_LINKS = [
  { label: 'Discord', href: DISCORD_URL },
  { label: 'GitHub', href: 'https://github.com/HackBinghamton/HackBU' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/groups/8427110' },
  { label: 'Facebook', href: 'https://www.facebook.com/HackBinghamton' },
  { label: 'Twitter', href: 'https://twitter.com/HackBinghamton' },
] as const
