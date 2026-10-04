/**
 * HackBU 2026 (Sat 7 – Sun 8 March 2026, Innovative Technologies Complex) —
 * the sponsors and prize winners the Sponsors page shows as last year's record.
 *
 * Sources, all public:
 *   [devpost]  https://hackbu2026.devpost.com/ — "Hackathon Sponsors" and
 *              "Additional Supporters" lists, and the prize list.
 *   [gallery]  https://hackbu2026.devpost.com/project-gallery — the projects
 *              flagged "Winner"; each project's own page names the prize.
 *   [blog]     https://hackbu.org/blog/2026/03/04/hackbu-2026-information.html
 *              — which sponsor backed which prize category.
 *
 * Update this file, not the components, when 2027 results arrive.
 */

export interface PastSponsor {
  name: string
  /** The prize category this sponsor backed, if the sources name one. */
  prize?: string
}

/** Listed as "Hackathon Sponsors" on [devpost]; prize backing from [blog]. */
export const PAST_SPONSORS: readonly PastSponsor[] = [
  { name: 'Visions Federal Credit Union', prize: 'Best Personal Finance Hack' },
  { name: 'Rubenstein Ventures', prize: 'Best User Interface Hack' },
  { name: 'Binghamton Codes', prize: 'Best Harpur Hack' },
  { name: 'Koffman Incubator' },
]

/** Listed as "Additional Supporters" on [devpost]. */
export const PAST_SUPPORTERS: readonly string[] = ['Celsius', 'Wegmans', 'Muckles']

export interface PastWinner {
  prize: string
  project: string
  /** Devpost's one-line description of the project. */
  blurb: string
  /** Names as credited on the project's Devpost page. */
  team: readonly string[]
  url: string
  /** The sponsor that backed the category, when there was one. */
  sponsor?: string
}

/**
 * Four of the five categories. "Best Harpur Hack" (sponsored by Binghamton
 * Codes) has no project flagged as its winner on [gallery] — add it here once
 * the organizers confirm who won.
 */
export const PAST_WINNERS: readonly PastWinner[] = [
  {
    prize: 'Best Overall Hack',
    project: 'MaestroSynth',
    blurb:
      'Control a synthesizer, conduct a symphony, and perform live without hardware — using hand tracking.',
    team: ['Losera Naranjo', 'Axel Larsson', 'Sanjit Gunasekaran', 'Reagan Simos'],
    url: 'https://devpost.com/software/maestro-hdvcse',
  },
  {
    prize: 'Best Personal Finance Hack',
    project: 'nvst',
    blurb: 'Invest into the stocks of the apps that you actually use.',
    team: ['Ratnam Shah', 'Ethan Harbinger', 'Kushal Padshala'],
    url: 'https://devpost.com/software/nvst',
    sponsor: 'Visions Federal Credit Union',
  },
  {
    prize: 'Best User Interface Hack',
    project: 'LeetTok',
    blurb:
      'TikTok for LeetCode: short video walkthroughs with coding challenges that pop up mid-video.',
    team: ['Michael Bronikowski'],
    url: 'https://devpost.com/software/leettok',
    sponsor: 'Rubenstein Ventures',
  },
  {
    prize: 'Best Beginner Hack',
    project: 'fAIshion',
    blurb: 'Helps you choose clothing items that pair well with your physical features.',
    team: ['Samuel Le', 'Thit-Sar Kyaw', 'NKO Kukreti'],
    url: 'https://devpost.com/software/faishion',
  },
]

export const PAST_EVENT_DEVPOST_URL = 'https://hackbu2026.devpost.com/'
export const PAST_EVENT_GALLERY_URL = 'https://hackbu2026.devpost.com/project-gallery'
