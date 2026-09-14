/**
 * Image delivery constants.
 *
 * `scripts/generate-images.mjs` writes AVIF + WebP derivatives beside the
 * source files in `public/artwork/`; this module is the single place the app
 * describes them. The JPEG (or PNG) stays as the last-resort `<img src>`
 * inside each `<picture>`, so a browser that understands neither modern
 * format still gets the picture.
 *
 * Three copies of the hero srcset exist and they must agree:
 *   - `HERO_WIDTHS` here
 *   - `HERO_WIDTHS` in scripts/generate-images.mjs
 *   - the `imagesrcset` on the preload link in index.html
 * `npm run images` prints the strings it generated for exactly this reason.
 */

/* -------------------------------------------------------------------------- */
/* Hero photograph                                                            */
/* -------------------------------------------------------------------------- */

/**
 * The hero is a real photograph — `hackbuimage/image.png`, an aerial of the
 * whole Binghamton campus under snow, 1200 x 674 — and the derivatives are
 * cut from it at and below its own width, never enlarged. There is no
 * upscaled master any more: a photograph does not survive machine enlargement
 * the way the flat-shaded illustration it replaced did, and the hero's start
 * frame magnifies it only 1.2x (see PAN_START_SCALE in Hero.tsx), so the
 * source width is the honest ceiling. (The `<img src>` fallback is a
 * re-encoded JPEG: the delivered file is a 1.7 MB PNG of a photograph.)
 */
export const HERO_JPG = '/artwork/photos/hero-campus.jpg'
export const HERO_WIDTH = 1200
export const HERO_HEIGHT = 674

const HERO_WIDTHS = [640, 960, 1200] as const

function heroSrcSet(extension: 'avif' | 'webp'): string {
  return HERO_WIDTHS.map(
    (width) => `/artwork/photos/hero-campus-${width}.${extension} ${width}w`,
  ).join(', ')
}

export const HERO_SRCSET = {
  avif: heroSrcSet('avif'),
  webp: heroSrcSet('webp'),
} as const

/**
 * How wide the photograph is actually *drawn*, which is not the width of its
 * box. The `<img>` is `object-cover` into a viewport-sized stage, so at scale
 * 1 the drawn content is:
 *
 *   viewport aspect >= 1200/674 (1.780)  ->  width-constrained, 100vw
 *   viewport aspect <  1200/674          ->  height-constrained,
 *                                            100vh x 1200/674 = 178.04vh
 *
 * The photo is a hair under 16:9, so 1440x900 laptops and every phone take
 * the `vh` branch and only screens wider than 16:9 take `vw`. Both are
 * written multiplied by PAN_START_SCALE = 1.2, the scale the photo is fetched
 * at: `120vw` and `213.65vh`. **Keep the factor equal to PAN_START_SCALE.**
 * With a ladder that tops out at the 1200px source the expression matters
 * less than it used to — anything past a 1000px 1x draw already takes the top
 * rung — but it must still match `imagesizes` on the preload link in
 * index.html, or the preload and the `<picture>` resolve to different rungs
 * and the image loads twice.
 */
export const HERO_SIZES = '(min-aspect-ratio: 1200/674) 120vw, 213.65vh'

/**
 * The photograph is content, not decoration — it is the reason the page opens
 * the way it does — so it gets a description of what is in it.
 */
export const HERO_ALT =
  'Aerial photograph of the Binghamton University campus under snow: the ' +
  'brick Library Tower at the centre, academic buildings and dormitories ' +
  'around it, snow-covered walkways crossing the plaza, and forested hills ' +
  'behind.'

/* -------------------------------------------------------------------------- */
/* Landing-page section photographs                                           */
/* -------------------------------------------------------------------------- */

/**
 * One real campus photograph per content section — About, Get involved and
 * Questions — set into the layout with feathered edges (see
 * src/components/SectionPhoto.tsx). Sources are the files delivered in
 * `hackbuimage/`; `npm run images` writes the JPEG + AVIF + WebP copies into
 * `public/artwork/photos/` at the source's own size. Contact, the page's quiet
 * landing, deliberately carries none: there were three photographs for four
 * sections, and it is the one built to have nothing competing in it.
 */
export type SitePhoto = {
  jpg: string
  webp: string
  avif: string
  width: number
  height: number
  alt: string
}

function sitePhoto(
  file: string,
  width: number,
  height: number,
  alt: string,
): SitePhoto {
  const base = `/artwork/photos/${file}`
  return {
    jpg: `${base}.jpg`,
    webp: `${base}.webp`,
    avif: `${base}.avif`,
    width,
    height,
    alt,
  }
}

export const SECTION_PHOTOS = {
  /** About — from `hackbuimage/winter-header.jpg`. */
  plazaWinter: sitePhoto(
    'plaza-winter',
    1600,
    600,
    'Aerial photograph of the Binghamton campus in winter: the green steel frame of the clock tower in the foreground, brick buildings and the Library Tower beyond, and students crossing the snow-covered plaza.',
  ),
  /** Get involved — from `hackbuimage/1-KS1-WEB-2-1024x683.jpg`. */
  snowWalk: sitePhoto(
    'snow-walk',
    1024,
    683,
    'Two students walking along a snow-covered campus path during a snowfall, with bare trees and a glass-fronted building ahead of them.',
  ),
  /** Questions — from `hackbuimage/47065170581_63875cf429_b.jpg`. */
  campusPath: sitePhoto(
    'campus-path',
    658,
    1024,
    'View from above of a winter walkway across the Binghamton campus, students crossing between brick buildings beneath the green clock tower.',
  ),
} as const

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
 * AVIF + WebP sit beside each JPEG and are rebuilt by `npm run images`.
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

export const ABOUT_PHOTOS = {
  collaborate: aboutPhoto(
    'collaborate',
    1024,
    683,
    'Three students huddled around a laptop at a HackBU event, smiling as they work through a problem together.',
  ),
  table: aboutPhoto(
    'table',
    1024,
    768,
    'Students collaborating at workshop tables with laptops in a bright room with floor-to-ceiling windows at a HackBU event.',
  ),
  hackathon: aboutPhoto(
    'hackathon',
    1024,
    683,
    'Students coding at a HackBU hackathon, with a HackBU tote bag on a chair and Binghamton gear in the room.',
  ),
} as const

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
/* Campus landmarks (TreeHacks-style side décor)                              */
/* -------------------------------------------------------------------------- */

/**
 * Binghamton Library Tower / carillon — flat cartoon cutout for the landing
 * side landmark (TreeHacks-style). Transparent PNG/WebP/AVIF; JPG is a cloud
 * flat for fallbacks. Source in `public/artwork/landmarks/`.
 */
export const CLOCK_TOWER = {
  png: '/artwork/landmarks/clock-tower.png',
  webp: '/artwork/landmarks/clock-tower.webp',
  avif: '/artwork/landmarks/clock-tower.avif',
  jpg: '/artwork/landmarks/clock-tower.jpg',
  width: 266,
  height: 1059,
  alt: 'Cartoon illustration of the Binghamton University clock tower.',
} as const

/* -------------------------------------------------------------------------- */
/* Organizer portraits                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Headshots on the Organizers page. Sources live in `public/artwork/organizers/`.
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
 *
 * Group photo (already shipped):
 *   team.jpg
 */
function organizerPhoto(file: string, alt: string, ready = false): {
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
    /** Placeholder intrinsic size — replace with real dimensions when cropping. */
    width: 800,
    height: 1000,
    alt,
    ready,
  }
}

/** Group photo beside the organizers intro — always ready once team.jpg ships. */
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
    'Portrait of Matthew Ham, HackBU President.',
  ),
  'samuel-yu': organizerPhoto(
    'samuel-yu',
    'Portrait of Samuel Yu, HackBU Vice President of Communications.',
  ),
  'carinna-lee': organizerPhoto(
    'carinna-lee',
    'Portrait of Carinna Lee, HackBU Vice President of Outreach.',
  ),
  'daniel-zheng': organizerPhoto(
    'daniel-zheng',
    'Portrait of Daniel Zheng, HackBU Vice President of Software.',
  ),
  'gianni-zaccarelli': organizerPhoto(
    'gianni-zaccarelli',
    'Portrait of Gianni Zaccarelli, HackBU Vice President of Logistics.',
  ),
  'joseph-costa': organizerPhoto(
    'joseph-costa',
    'Portrait of Joseph Costa, HackBU Vice President of Event Planning.',
  ),
  'tianna-balkam': organizerPhoto(
    'tianna-balkam',
    'Portrait of Tianna Balkam, HackBU organizer.',
  ),
  'zak-sujkovic': organizerPhoto(
    'zak-sujkovic',
    'Portrait of Zak Sujkovic, HackBU organizer.',
  ),
  'hewitt-wang': organizerPhoto(
    'hewitt-wang',
    'Portrait of Hewitt Wang, HackBU organizer.',
  ),
  'rijaa-zaidi': organizerPhoto(
    'rijaa-zaidi',
    'Portrait of Rijaa Zaidi, HackBU organizer.',
  ),
  'raymond-chen': organizerPhoto(
    'raymond-chen',
    'Portrait of Raymond Chen, HackBU organizer.',
  ),
} as const

export type OrganizerPhoto = (typeof ORGANIZER_PHOTOS)[keyof typeof ORGANIZER_PHOTOS]
