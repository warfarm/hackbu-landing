/**
 * Image delivery constants.
 *
 * `scripts/generate-images.mjs` writes AVIF + WebP derivatives beside the
 * source files in `public/artwork/`; this module is the single place the app
 * describes them. The JPEG (or PNG) stays as the last-resort `<img src>`
 * inside each `<picture>`, so a browser that understands neither modern
 * format still gets the picture.
 *
 * The landing page no longer ships a campus photograph: the hero and the
 * section décor are three.js snow scenes (src/three/), so there is no hero
 * srcset here and no preload in index.html to keep in step with it.
 */

/** Cartoon Baxter the Bearcat — welcome pose for the hero. */
export const BAXTER_PNG = '/artwork/mascot/Baxter.png'
export const BAXTER_WIDTH = 1024
export const BAXTER_HEIGHT = 1024
export const BAXTER_ALT =
  'Baxter the Binghamton Bearcat, waving in a green Binghamton basketball jersey.'

/* -------------------------------------------------------------------------- */
/* Brand marks                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The ink boxes of the two logo marks — the trimmed bounds of the artwork in
 * `brand-source/`, which is what the mask derivatives in `public/brand/` are
 * cropped to. Only the ratio is used: `<Wordmark>` gives each mark an
 * `aspect-ratio` built from these numbers so a height in `em` fixes the width.
 *
 * **Keep in sync with `npm run images`**, which prints both boxes at the end of
 * a run for exactly this comparison. The mask URLs themselves live in
 * `src/index.css`, with the rest of the mark's paint.
 */
export const BEARCAT_MARK = { width: 1741, height: 1828 } as const
export const WORDMARK_MARK = { width: 7690, height: 1080 } as const

/* -------------------------------------------------------------------------- */
/* About us photos                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Event photos on the About us page. Sources live in `public/artwork/about/`;
 * AVIF + WebP sit beside each JPEG and are rebuilt by `npm run images`. The
 * directory holds more frames than the page uses — the old community and
 * hackathon carousels stay on disk for reuse, but only the workshop strip
 * below is referenced.
 */
function aboutPhoto(file: string, width: number, height: number, alt: string) {
  const base = `/artwork/about/${file}`
  return {
    jpg: `${base}.jpg`,
    webp: `${base}.webp`,
    avif: `${base}.avif`,
    width,
    height,
    alt,
  } as const
}

export type AboutPhoto = ReturnType<typeof aboutPhoto>

/**
 * The workshops-and-events carousel — the one photo strip on the About us
 * page. `table` was already in the directory; the rest are from the HackBU
 * 2023 album on hackbu.org (`/img/hackathon/2023/`), resized to 1080px tall so
 * they stay sharp when a landscape frame is cropped into a portrait panel.
 */
export const ABOUT_WORKSHOP_PHOTOS: readonly AboutPhoto[] = [
  aboutPhoto(
    'table',
    1024,
    768,
    'Students collaborating at workshop tables with laptops in a bright room with floor-to-ceiling windows at a HackBU event.',
  ),
  aboutPhoto(
    'python-workshop',
    1440,
    1080,
    'A Python workshop at HackBU 2023: students at tables around a wide room, facing a projector screen.',
  ),
  aboutPhoto(
    'tech-talk',
    1440,
    1080,
    'A sponsor tech talk at HackBU 2023: presenters beside a projected slide at the front of a lecture room full of students.',
  ),
  aboutPhoto(
    'study-room',
    1440,
    1080,
    'Students working on laptops at tables spread through a large study room, one wearing headphones in the foreground.',
  ),
]

/* -------------------------------------------------------------------------- */
/* Sponsors photo                                                             */
/* -------------------------------------------------------------------------- */

function sponsorsPhoto(file: string, width: number, height: number, alt: string) {
  const base = `/artwork/sponsors/${file}`
  return {
    jpg: `${base}.jpg`,
    webp: `${base}.webp`,
    avif: `${base}.avif`,
    width,
    height,
    alt,
  } as const
}

export const SPONSORS_PHOTO = sponsorsPhoto(
  'workshop',
  1024,
  768,
  'Students around a workshop table with laptops, talking with a mentor, winter campus visible through the windows.',
)

/* -------------------------------------------------------------------------- */
/* Organizer portraits                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Headshots in the organizer rosters at the bottom of the About us page.
 * Sources live in `public/artwork/organizers/`.
 *
 * Drop a JPG for each person using the filenames below, run `npm run images`
 * (writes AVIF + WebP beside each JPG), then pass `true` as the third argument
 * to `organizerPhoto(...)` for that entry. Until then the page shows a muted
 * frost placeholder so missing files never 404 in the browser.
 *
 * Expected files (portrait ~4:5, any reasonable resolution — 800×1000 is fine):
 *   matthew-ham.jpg
 *   samuel-yu.jpg
 *   carinna-lee.jpg
 *   daniel-zheng.jpg
 *   gianni-zaccarelli.jpg
 *   joseph-costa.jpg
 *   tianna-balkam.jpg
 *   zak-sujkovic.jpg
 *   hewitt-wang.jpg
 *   rijaa-zaidi.jpg
 *   raymond-chen.jpg
 *   thomas-mandel.jpg
 *   aditya-kumar.jpg
 *   jessica-ha.jpg
 *   adam-babayev.jpg
 *   zuri-chan.jpg
 *
 * Group photo (already shipped):
 *   team.jpg
 */
function organizerPhoto(
  file: string,
  alt: string,
  ready = false,
  width = 800,
  height = 1000,
): {
  jpg: string
  webp: string
  avif: string
  width: number
  height: number
  alt: string
  ready: boolean
} {
  const base = `/artwork/organizers/${file}`
  return {
    jpg: `${base}.jpg`,
    webp: `${base}.webp`,
    avif: `${base}.avif`,
    width,
    height,
    alt,
    ready,
  }
}

/** Group photo beside the About us intro — always ready once team.jpg ships. */
export const ORGANIZERS_TEAM_PHOTO = {
  jpg: '/artwork/organizers/team.jpg',
  webp: '/artwork/organizers/team.webp',
  avif: '/artwork/organizers/team.avif',
  width: 1024,
  height: 758,
  alt:
    'HackBU organizers posing together at a group outing, standing in front of an orange backdrop.',
} as const

export const ORGANIZER_PHOTOS = {
  'matthew-ham': organizerPhoto(
    'matthew-ham',
    'Portrait of Matthew Ham, HackBU President, smiling and giving a thumbs up outdoors in a navy polka-dot shirt.',
    true,
    682,
    1024,
  ),
  'samuel-yu': organizerPhoto(
    'samuel-yu',
    'Portrait of Samuel Yu, HackBU Vice President of Communications, grinning in a gray hoodie in front of rocky mountain peaks.',
    true,
    614,
    834,
  ),
  'carinna-lee': organizerPhoto(
    'carinna-lee',
    'Portrait of Carinna Lee, HackBU Vice President of Outreach, smiling in a gray denim jacket and hoop earrings.',
    true,
    1024,
    1024,
  ),
  'daniel-zheng': organizerPhoto(
    'daniel-zheng',
    'Portrait of Daniel Zheng, HackBU Vice President of Software, in profile in a dark suit and tie beside a river at sunset.',
    true,
    420,
    525,
  ),
  'gianni-zaccarelli': organizerPhoto(
    'gianni-zaccarelli',
    'Portrait of Gianni Zaccarelli, HackBU Vice President of Logistics, arms open in a lecture hall wearing a HackBU bag.',
    true,
    768,
    1024,
  ),
  'joseph-costa': organizerPhoto(
    'joseph-costa',
    'Portrait of Joseph Costa, HackBU Vice President of Event Planning, smiling outdoors above a sprawling city skyline.',
    true,
    876,
    1024,
  ),
  'tianna-balkam': organizerPhoto(
    'tianna-balkam',
    'Portrait of Tianna Balkam, HackBU organizer, smiling against a plain backdrop in a black-and-white patterned blouse.',
    true,
    682,
    1024,
  ),
  'zak-sujkovic': organizerPhoto(
    'zak-sujkovic',
    'Portrait of Zak Sujkovic, HackBU organizer, standing by the East River beneath the Manhattan Bridge.',
    true,
    800,
    800,
  ),
  'hewitt-wang': organizerPhoto(
    'hewitt-wang',
    'Portrait of Hewitt Wang, HackBU organizer, close-up at a busy hackathon with a laptop in front of him.',
    true,
    800,
    800,
  ),
  'rijaa-zaidi': organizerPhoto(
    'rijaa-zaidi',
    'Portrait of Rijaa Zaidi, HackBU organizer, smiling in a navy headscarf and white collared shirt with a light blue scarf.',
    true,
    768,
    1024,
  ),
  'raymond-chen': organizerPhoto(
    'raymond-chen',
    'Portrait of Raymond Chen, HackBU organizer, seated on a wooden chair in a white T-shirt against a sunlit gray wall.',
    true,
    610,
    766,
  ),
  'thomas-mandel': organizerPhoto(
    'thomas-mandel',
    'Portrait of Thomas Mandel, HackBU organizer, smiling in a dark suit and tie in front of a floral arch.',
    true,
    768,
    1024,
  ),
  'aditya-kumar': organizerPhoto(
    'aditya-kumar',
    'Portrait of Aditya Kumar, HackBU organizer, grinning in clear-framed glasses outside a campus building.',
    true,
    819,
    1024,
  ),
  'jessica-ha': organizerPhoto(
    'jessica-ha',
    'Portrait of Jessica Ha, HackBU organizer, in a black top and pendant necklace against a plain backdrop.',
    true,
    682,
    1024,
  ),
  'adam-babayev': organizerPhoto(
    'adam-babayev',
    'Portrait of Adam Babayev, HackBU organizer, in clear-framed glasses, a dark suit, and a navy tie.',
    true,
    768,
    1024,
  ),
  'zuri-chan': organizerPhoto(
    'zuri-chan',
    'Portrait of Zuri Chan, HackBU organizer, smiling softly in a cream blouse against a marble wall.',
    true,
    1024,
    576,
  ),
} as const

export type OrganizerPhoto = (typeof ORGANIZER_PHOTOS)[keyof typeof ORGANIZER_PHOTOS]
