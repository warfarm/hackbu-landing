/**
 * Every off-site URL the page points at, in one place.
 *
 * These are the canonical live URLs taken from hackbu.org — later phases should
 * reuse these constants rather than re-typing hrefs.
 */

export const DISCORD_URL = 'https://discord.gg/Xka5uUh'
export const CONTACT_EMAIL = 'hello@hackbu.org'

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

/**
 * The organizer rosters at the bottom of the About us page — where the retired
 * Organizers page's content now lives (src/about/OrganizersSection.tsx).
 */
export const ORGANIZERS_ANCHOR = `${ABOUT_PATH}#organizers`

/** In-site Sponsors page. Clean URL; Vite and Vercel rewrite it to sponsors.html. */
export const SPONSORS_PATH = '/sponsors'

/** In-site hackathons page. */
export const HACKATHONS_PATH = '/hackathons'

/** In-site hackathon registration form. Clean URL; Vite and Vercel rewrite it to register.html. */
export const REGISTER_PATH = '/register'

/** Applicant portal: sign in with an email code, view status, RSVP. */
export const APPLICATION_PATH = '/application'

/** Header nav destinations (the Discord CTA is separate). */
export const NAV_LINKS = [
  { label: 'About Us', href: ABOUT_PATH },
  { label: 'Sponsors', href: SPONSORS_PATH },
  { label: 'Hackathons', href: HACKATHONS_PATH },
  { label: 'Registration', href: REGISTER_PATH },
] as const

/** Site pages split into two footer columns. */
export const SITE_PAGES = [
  { label: 'About Us', href: ABOUT_PATH },
  { label: 'Hackathons', href: HACKATHONS_PATH },
  { label: 'Registration', href: REGISTER_PATH },
  { label: 'My Application', href: APPLICATION_PATH },
  { label: 'Sponsors', href: SPONSORS_PATH },
  { label: 'Blog', href: 'https://hackbu.org/blog' },
  { label: 'Photos', href: 'https://hackbu.org/photos' },
] as const

export const SOCIAL_LINKS = [
  { label: 'Discord', href: DISCORD_URL },
  { label: 'GitHub', href: 'https://github.com/HackBinghamton/HackBU' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/groups/8427110' },
  { label: 'Facebook', href: 'https://www.facebook.com/HackBinghamton' },
  { label: 'Twitter', href: 'https://twitter.com/HackBinghamton' },
] as const
