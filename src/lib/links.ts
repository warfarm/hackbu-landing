/**
 * Every off-site URL the page points at, in one place.
 *
 * These are the canonical live URLs taken from hackbu.org — later phases should
 * reuse these constants rather than re-typing hrefs.
 *
 * The HackBU 2027 dates and venue live here too, in their own block below:
 * the venue's two Google Maps URLs are built from it, and keeping the facts
 * next to the links that depend on them means a venue change is one edit.
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

/**
 * The HackBU 2027 schedule — the timeline section on the Hackathons page
 * (`<section id="timeline">` there). The landing page's event overview links
 * to it rather than repeating a schedule that would drift out of step.
 */
export const SCHEDULE_ANCHOR = `${HACKATHONS_PATH}#timeline`

/* -------------------------------------------------------------------------- */
/* HackBU 2027 — dates and venue                                              */
/* -------------------------------------------------------------------------- */

/**
 * The hackathon's dates, written once. The landing page shows them in the
 * hero, the event overview and the FAQ; `start`/`end` feed `<time dateTime>`
 * so the dates are machine-readable wherever they appear. The dates are the
 * sponsorship packet's (src/sponsors/SponsorshipTiersSection.tsx): Saturday
 * 30 January to Sunday 31 January 2027.
 */
export const HACKATHON_DATES = {
  start: '2027-01-30',
  end: '2027-01-31',
  /** Short form, for the hero and the fact list. */
  short: 'January 30–31, 2027',
  /** Long form, with weekdays, for the FAQ answer. */
  long: 'Saturday, January 30 to Sunday, January 31, 2027',
} as const

/**
 * The venue — the University Union, the student union in the middle of the
 * Binghamton campus. The street address is the University's own (4400 Vestal
 * Parkway East), which every building on campus shares.
 */
export const VENUE = {
  name: 'University Union',
  campus: 'Binghamton University',
  address: '4400 Vestal Parkway East, Vestal, NY 13850',
} as const

/**
 * What both Google Maps URLs search for. **Not** `VENUE.name`: Google lists
 * the building as "The Union" (the University's own short name for it), and
 * the two spellings behave differently. Checked against the live embed on
 * 2026-09-28:
 *
 *   "The Union, Binghamton University, Vestal, NY 13850"
 *       -> one pin on the Union, with its place card ("The Union")
 *   "University Union, Binghamton University, Vestal, NY 13850"
 *       -> a search-results map: half a dozen pins across campus (the
 *          Union among them), none of them selected
 *   "4400 Vestal Parkway East, Vestal, NY 13850"
 *       -> a pin just west of the Union, labelled only with the address
 *
 * so only the first actually shows someone which building to walk to.
 */
const VENUE_QUERY = `The Union, ${VENUE.campus}, Vestal, NY 13850`

/**
 * Keyless Google Maps embed of the Union for the FAQ's map card
 * (src/components/sections/QuestionsSection.tsx). `output=embed` is the
 * classic embeddable map, which needs no API key and no Maps Platform project;
 * `z=16` frames the building inside the campus's ring road (West Drive and
 * East Drive) with the parking lots around it, which is what orients someone
 * arriving by car or bus.
 * There is no CSP or `X-Frame-Options` header in vercel.json that would block
 * the frame; if one is ever added it needs `frame-src https://www.google.com`.
 */
export const VENUE_MAP_EMBED_URL =
  'https://www.google.com/maps?' +
  new URLSearchParams({ q: VENUE_QUERY, z: '16', output: 'embed' }).toString()

/**
 * Turn-by-turn directions to the Union, from wherever the visitor is — the
 * documented Maps URLs scheme (`/maps/dir/?api=1`), which opens the Google
 * Maps app on a phone and the website elsewhere, and needs no key either.
 */
export const VENUE_DIRECTIONS_URL =
  'https://www.google.com/maps/dir/?' +
  new URLSearchParams({ api: '1', destination: VENUE_QUERY }).toString()

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
