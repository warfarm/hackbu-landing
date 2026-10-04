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
 * The hero is a real photograph — `hackbuimage/hero.jpg`, an aerial of the
 * Binghamton campus in winter at dusk, 2048 x 1151, from the Binghamton
 * University Alumni Instagram — and the derivatives are cut from it at and
 * below its own width, never enlarged. There is no upscaled master: a
 * photograph does not survive machine enlargement the way the flat-shaded
 * illustration it replaced did, and the hero's start frame magnifies it only
 * 1.2x (see PAN_START_SCALE in Hero.tsx), so the source width is the honest
 * ceiling.
 */
export const HERO_JPG = '/artwork/photos/hero-campus.jpg'
export const HERO_WIDTH = 2048
export const HERO_HEIGHT = 1151

const HERO_WIDTHS = [640, 960, 1280, 1600, 2048] as const

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
 *   viewport aspect >= 2048/1151 (1.779)  ->  width-constrained, 100vw
 *   viewport aspect <  2048/1151          ->  height-constrained,
 *                                             100vh x 2048/1151 = 177.93vh
 *
 * The photo is a hair under 16:9, so 1440x900 laptops and every phone take
 * the `vh` branch and only screens wider than 16:9 take `vw`. Both are
 * written multiplied by PAN_START_SCALE = 1.2, the scale the photo is fetched
 * at: `120vw` and `213.52vh`. **Keep the factor equal to PAN_START_SCALE.**
 * It must also match `imagesizes` on the preload link in index.html, or the
 * preload and the `<picture>` resolve to different rungs and the image loads
 * twice.
 */
export const HERO_SIZES = '(min-aspect-ratio: 2048/1151) 120vw, 213.52vh'

/**
 * The photograph is content, not decoration — it is the reason the page opens
 * the way it does — so it gets a description of what is in it.
 */
export const HERO_ALT =
  'Aerial photograph of the Binghamton University campus in winter at dusk: ' +
  'the brick Library Tower rising on the right, snow-dusted academic ' +
  'buildings and red-brick residence halls below, athletic fields and ' +
  'wooded hills beyond, and lights coming on across campus.'

/* -------------------------------------------------------------------------- */
/* Landing-page section photographs                                           */
/* -------------------------------------------------------------------------- */

/**
 * Campus photographs set into content sections with feathered edges (see
 * src/components/SectionPhoto.tsx). Sources are the files delivered in
 * `hackbuimage/`; `npm run images` writes the JPEG + AVIF + WebP copies into
 * `public/artwork/photos/` at the source's own size.
 *
 * On the landing page `campusPath` sits beside the event overview and
 * `snowWalk` beside registration; the FAQ carries the venue map instead of a
 * photo. `plazaWinter` (About) and `snowWalk` (Get involved) are also still
 * used by those two sections, which now appear only on the component sheet.
 * The per-key notes below name the section each photo was first chosen for.
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
/* Photos page gallery                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Past event photos on `/photos`. Sources live in `public/artwork/gallery/`;
 * AVIF + WebP sit beside each JPEG and are rebuilt by `npm run images`.
 */
function galleryPhoto(file: string, width: number, height: number, alt: string) {
  const base = `/artwork/gallery/${encodeURIComponent(file)}`
  return {
    jpg: `${base}.jpg`,
    webp: `${base}.webp`,
    avif: `${base}.avif`,
    width,
    height,
    alt,
  } as const
}

export type GalleryPhoto = ReturnType<typeof galleryPhoto>

/** HackBU 2023 (February 4–5). JPEGs live in `public/artwork/gallery/`. */
export const GALLERY_PHOTOS: readonly GalleryPhoto[] = [
  galleryPhoto(
    '20230204_152838',
    1600,
    1200,
    'Students working on laptops at tables in a classroom during HackBU, with a projector screen at the front of the room.',
  ),
  galleryPhoto(
    '20230204_152903',
    300,
    300,
    'Three students at a table with laptops during HackBU, one wearing headphones and another in a red hoodie.',
  ),
  galleryPhoto(
    '20230204_154117',
    1600,
    1200,
    'HackBU participants working on laptops in a classroom during the February 2023 hackathon.',
  ),
  galleryPhoto(
    '20230204_170706',
    1600,
    1200,
    'A DevOps workshop in a lecture hall: three presenters at the front beside a slide about deploying an application, with students at laptops.',
  ),
  galleryPhoto(
    '20230204_hackathon03_jwc',
    300,
    300,
    'Two students working side by side on a laptop in a crowded HackBU room.',
  ),
  galleryPhoto(
    '20230204_hackathon08_jwc',
    300,
    300,
    'Rows of HackBU participants at long tables with laptops in a bright room with tall windows.',
  ),
  galleryPhoto(
    '20230204_hackathon10_jwc',
    300,
    300,
    'Students at laptops in a packed HackBU workspace, with a line of people along the back wall.',
  ),
  galleryPhoto(
    '20230204_hackathon13_jwc',
    300,
    300,
    'Students smiling together over a laptop during HackBU.',
  ),
  galleryPhoto(
    '20230204_hackathon17_jwc',
    300,
    300,
    'Four students at two pushed-together tables, each working on a laptop during HackBU.',
  ),
  galleryPhoto(
    '20230204_hackathon19_jwc',
    300,
    300,
    'A student at a laptop connected to an external monitor showing a pink interface, with more participants working behind him.',
  ),
  galleryPhoto(
    '20230204_hackathon21_jwc',
    300,
    300,
    'A student in a Binghamton hoodie working at a monitor that shows lines of code.',
  ),
  galleryPhoto(
    '20230205_140747',
    1600,
    1200,
    'An overhead view of HackBU participants at long tables with laptops in a glass-walled atrium, snow visible outside.',
  ),
  galleryPhoto(
    '20230205_140800 (1)',
    1600,
    1200,
    'HackBU participants at tables with laptops in the glass-walled atrium during the February 2023 hackathon.',
  ),
  galleryPhoto(
    '20230205_140810',
    1600,
    1200,
    'HackBU participants at tables with laptops in the glass-walled atrium during the February 2023 hackathon.',
  ),
  galleryPhoto(
    '20230205_140958',
    1600,
    1200,
    'HackBU participants at tables with laptops in the glass-walled atrium during the February 2023 hackathon.',
  ),
  galleryPhoto(
    '20230205_141002',
    1600,
    1200,
    'HackBU participants at tables with laptops in the glass-walled atrium during the February 2023 hackathon.',
  ),
  galleryPhoto(
    '20230205_141012',
    1600,
    1200,
    'HackBU participants at tables with laptops in the glass-walled atrium during the February 2023 hackathon.',
  ),
  galleryPhoto(
    '20230205_141018',
    1600,
    1200,
    'HackBU participants at tables with laptops in the glass-walled atrium during the February 2023 hackathon.',
  ),
  galleryPhoto(
    '20230205_141023',
    1600,
    1200,
    'HackBU participants at tables with laptops in the glass-walled atrium during the February 2023 hackathon.',
  ),
  galleryPhoto(
    '20230205_154126 (1)',
    1600,
    1200,
    'An overhead view of HackBU participants collaborating at long tables with laptops in the glass-walled atrium.',
  ),
  galleryPhoto(
    '20230205_164609',
    300,
    300,
    'Five people posing with prize jackets in front of a screen that reads LendaHand, sponsored by J.P. Morgan.',
  ),
  galleryPhoto(
    '20230205_164612',
    1600,
    1200,
    'Five people posing in front of a screen with the HackBU bearcat logo, three of them holding black-and-white prize jackets.',
  ),
  galleryPhoto(
    'IMG_6845',
    300,
    300,
    'A HackBU check-in table with pastries, a handwritten whiteboard, and participants in a glass-walled room.',
  ),
  galleryPhoto(
    'IMG_6857',
    300,
    300,
    'The HackBU organizing team posing in matching purple shirts in front of a projection screen.',
  ),
  galleryPhoto(
    'IMG_9171',
    300,
    300,
    'Five people posing at HackBU closing, one holding a folded prize jacket.',
  ),
  galleryPhoto(
    'IMG_9174',
    300,
    300,
    'Six people posing at HackBU closing, two of them holding prize jackets.',
  ),
  galleryPhoto(
    'IMG_9176',
    300,
    300,
    'Two students posing in front of a screen labeled Router Runner.',
  ),
  galleryPhoto(
    'IMG_9181',
    300,
    300,
    'The LendaHand team posing with blue drawstring bags in front of their project slide.',
  ),
  galleryPhoto(
    'IMG_9188',
    300,
    300,
    'Four students posing in front of a screen labeled Complimentary.',
  ),
  galleryPhoto(
    'IMG_9191',
    300,
    300,
    'Two students posing in front of a screen labeled DRM on steroids.',
  ),
  galleryPhoto(
    'IMG_9194',
    300,
    300,
    'Four students posing in front of a screen labeled Charizzma.',
  ),
  galleryPhoto(
    'IMG_9197',
    300,
    300,
    'A student posing in front of a screen labeled Glucose Prediction.',
  ),
  galleryPhoto(
    'IMG_9202',
    300,
    300,
    'Two students posing in front of a screen labeled DRM on steroids, one giving a thumbs up.',
  ),
  galleryPhoto(
    'IMG_9206',
    300,
    300,
    'Four students posing in front of a screen labeled DineTunes.',
  ),
  galleryPhoto(
    'IMG_9208',
    300,
    300,
    'Two students posing in front of a screen labeled DRM on steroids.',
  ),
  galleryPhoto(
    'IMG_9210',
    300,
    300,
    'Two people posing in front of a screen labeled Glucose Prediction.',
  ),
]

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
