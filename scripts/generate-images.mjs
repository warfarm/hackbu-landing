/**
 * Build-time image derivative generator — `npm run images`.
 *
 * Reads the source images — the delivered photographs in `hackbuimage/`, and
 * the JPEG/PNG copies under `public/artwork/` — and writes AVIF + WebP
 * derivatives into `public/artwork/`. The sources are never touched; a JPEG or
 * PNG stays in place as the final <picture> fallback.
 *
 * This runs by hand, not on every build: the outputs are committed, so a
 * deploy needs nothing but `npm run build` (lint, `tsc -b`, `vite build`, then
 * the prerender step) — never this script. `sharp` is therefore a devDependency
 * and never reaches the browser bundle.
 *
 * ---------------------------------------------------------------------------
 * Widths
 * ---------------------------------------------------------------------------
 * The hero is `hackbuimage/image.png`, a 1200 x 674 photograph (a PNG of a
 * photo, so its `<img src>` fallback is a re-encoded JPEG), and the hero
 * magnifies it only 1.2x at its start frame — so the ladder is cut at and
 * below the source width and never enlarged: 640, 960 and the 1200 source
 * itself. (Its predecessor, a cel-shaded illustration opened at 3.8x,
 * needed a 4x Real-ESRGAN master to stay sharp; a photograph does not survive
 * that kind of enlargement and is not asked to. The illustration and its
 * master stay in the read-only `artwork/campus/` as reference and are no
 * longer copied to `public/`. The cloud cutouts that drifted over it went the
 * same way, into `artwork/clouds/`.)
 *
 * The three section photographs — also from `hackbuimage/` — are rendered at
 * a fraction of their width inside the content column, so they get one
 * derivative each at the intrinsic size: a re-encoded JPEG as the `<img src>`
 * fallback plus AVIF and WebP, switching on format only.
 *
 * ---------------------------------------------------------------------------
 * Quality
 * ---------------------------------------------------------------------------
 * Measured on the retired illustration's full-width tier when these settings
 * were chosen (PSNR against its source PNG):
 *
 *     AVIF q60 237 KB 34.25 dB   q65 267 KB 35.15 dB   q70 324 KB 36.63 dB
 *     WebP q80 318 KB 33.49 dB   q85 385 KB 34.59 dB   q90 499 KB 36.23 dB
 *
 * AVIF q68 / WebP q82 sit just below the knee of both curves. The hero
 * photograph is the LCP element and is drawn wider than its 1600px on most
 * screens, where compression artifacts are magnified along with everything
 * else, so this leans toward quality — the 1200 AVIF is still ~194 KB, about
 * an eighth of the 1.5 MB first-load image budget.
 *
 * ---------------------------------------------------------------------------
 * Brand marks
 * ---------------------------------------------------------------------------
 * The second half of this script reads `brand-source/` — also read-only — and
 * writes `public/brand/`. Two kinds of output come out of it:
 *
 * 1. **Mask derivatives** for the bearcat and the wordmark. The two source
 *    marks are drawn in two different greens (#339966 and #42B872), neither of
 *    which was a palette token. Rather than recolour the pixels, the page
 *    paints an element in the `fern` token and takes the mark's *shape* from
 *    the PNG's alpha via `mask-image` (see `.brand-mark-*` in src/index.css).
 *    So the only channel these files need to carry is alpha: RGB is flattened
 *    to white before encoding, which `mask-image` never reads and which makes
 *    the PNGs compress to a few KB each.
 *
 *    They are also *small*. The header mark is ~36 CSS px tall, so the ladder
 *    is a 1x rung sized against the largest place the mark is drawn plus a 2x
 *    rung for high-DPR screens — not the multi-megabyte originals.
 *
 *    Both sources are trimmed to their ink first, so `mask-size: contain` maps
 *    the drawn mark onto the element box exactly and the aspect ratios the app
 *    declares are the ink's, not the canvas's.
 *
 * 2. **App icons.** `favicon-{32,64}.png` are the bearcat, trimmed and squared
 *    on transparency. `apple-touch-icon.png` and `og-image.png` are
 *    `icon_discord.png`, which is already a finished app tile — re-encoded,
 *    because the source is a 2.15 MB PNG of a 14-colour image.
 */

import { mkdir, readdir, stat, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ARTWORK = join(ROOT, 'public', 'artwork')
/** Read-only, exactly like `artwork/`. Nothing here is ever written back. */
const BRAND_SOURCE = join(ROOT, 'brand-source')
const BRAND_OUT = join(ROOT, 'public', 'brand')

/** The delivered photographs. Read-only, exactly like `artwork/` and `brand-source/`. */
const PHOTO_SOURCE = join(ROOT, 'hackbuimage')
const PHOTOS_OUT = join(ARTWORK, 'photos')

/**
 * Hero srcset ladder. **Keep in sync with `HERO_WIDTHS` in
 * `src/lib/images.ts` and with the preload `imagesrcset` in `index.html`.**
 * The script prints both strings at the end of a run so a drift is visible.
 * The top rung is the source's own width; nothing is enlarged.
 */
const HERO_SOURCE = join(PHOTO_SOURCE, 'image.png')
const HERO_WIDTHS = [640, 960, 1200]

/**
 * The section photographs: delivered file in `hackbuimage/` -> base name in
 * `public/artwork/photos/`. **Keep in step with `SECTION_PHOTOS` in
 * `src/lib/images.ts`.**
 */
const SECTION_PHOTOS = [
  ['winter-header.jpg', 'plaza-winter'],
  ['1-KS1-WEB-2-1024x683.jpg', 'snow-walk'],
  ['47065170581_63875cf429_b.jpg', 'campus-path'],
]

const AVIF = { quality: 68, effort: 6 }
const WEBP = { quality: 82, effort: 6 }
/** The `<img src>` fallbacks are re-encoded from the delivered files (one is a PNG). */
const JPEG = { quality: 88, mozjpeg: true }

/**
 * The mask ladder. `widths` is `[1x, 2x]`, sized against the *largest* place
 * each mark is drawn — the `sm` header lockup, where the bearcat is 35.7 CSS px
 * wide and the wordmark 153.8 CSS px (see src/components/Wordmark.tsx). Both 1x
 * rungs sit above those with headroom, so the mark is never upscaled.
 *
 * **Keep `base` and the emitted ink dimensions in sync with `BEARCAT_MARK` /
 * `WORDMARK_MARK` in `src/lib/images.ts`.** The run prints both, for the same
 * reason it prints the campus srcsets.
 */
const BRAND_MASKS = [
  { source: 'icon.png', base: 'bearcat-mask', widths: [64, 128] },
  { source: 'text.png', base: 'wordmark-mask', widths: [192, 384] },
]

const written = []

async function emit(pipeline, outPath) {
  const buffer = await pipeline.toBuffer()
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, buffer)
  written.push({ path: outPath, bytes: buffer.length })
  return buffer.length
}

async function generateHero() {
  const { width: sourceWidth } = await sharp(HERO_SOURCE).metadata()
  for (const width of HERO_WIDTHS) {
    if (width > sourceWidth) {
      throw new Error(`Hero width ${width} exceeds the ${sourceWidth}px source.`)
    }
    const resized = () => sharp(HERO_SOURCE).resize({ width, withoutEnlargement: true })
    await emit(resized().avif(AVIF), join(PHOTOS_OUT, `hero-campus-${width}.avif`))
    await emit(resized().webp(WEBP), join(PHOTOS_OUT, `hero-campus-${width}.webp`))
  }
  await emit(sharp(HERO_SOURCE).jpeg(JPEG), join(PHOTOS_OUT, 'hero-campus.jpg'))
}

async function generateSectionPhotos() {
  for (const [source, base] of SECTION_PHOTOS) {
    const src = join(PHOTO_SOURCE, source)
    await emit(sharp(src).jpeg(JPEG), join(PHOTOS_OUT, `${base}.jpg`))
    await emit(sharp(src).avif(AVIF), join(PHOTOS_OUT, `${base}.avif`))
    await emit(sharp(src).webp(WEBP), join(PHOTOS_OUT, `${base}.webp`))
  }
}

async function generateAboutPhotos() {
  const dir = join(ARTWORK, 'about')
  const files = (await readdir(dir)).filter((name) => name.endsWith('.jpg'))
  for (const file of files.sort()) {
    const src = join(dir, file)
    const base = file.replace(/\.jpg$/, '')
    await emit(sharp(src).avif(AVIF), join(dir, `${base}.avif`))
    await emit(sharp(src).webp(WEBP), join(dir, `${base}.webp`))
  }
}

async function generateSponsorsPhotos() {
  const dir = join(ARTWORK, 'sponsors')
  const files = (await readdir(dir)).filter((name) => name.endsWith('.jpg'))
  for (const file of files.sort()) {
    const src = join(dir, file)
    const base = file.replace(/\.jpg$/, '')
    await emit(sharp(src).avif(AVIF), join(dir, `${base}.avif`))
    await emit(sharp(src).webp(WEBP), join(dir, `${base}.webp`))
  }
}

async function generateOrganizerPhotos() {
  const dir = join(ARTWORK, 'organizers')
  let files
  try {
    files = (await readdir(dir)).filter((name) => name.endsWith('.jpg'))
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return
    }
    throw error
  }
  for (const file of files.sort()) {
    const src = join(dir, file)
    const base = file.replace(/\.jpg$/, '')
    await emit(sharp(src).avif(AVIF), join(dir, `${base}.avif`))
    await emit(sharp(src).webp(WEBP), join(dir, `${base}.webp`))
  }
}

async function generateLandmarkPhotos() {
  const dir = join(ARTWORK, 'landmarks')
  let files
  try {
    // Prefer PNG cutouts (alpha); also refresh JPG companions if present.
    files = (await readdir(dir)).filter(
      (name) => name.endsWith('.png') || name.endsWith('.jpg'),
    )
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return
    }
    throw error
  }
  const bases = new Set(files.map((f) => f.replace(/\.(png|jpg)$/, '')))
  for (const base of [...bases].sort()) {
    const png = join(dir, `${base}.png`)
    const jpg = join(dir, `${base}.jpg`)
    let src = png
    try {
      await stat(png)
    } catch {
      src = jpg
    }
    await emit(sharp(src).avif(AVIF), join(dir, `${base}.avif`))
    await emit(sharp(src).webp(WEBP), join(dir, `${base}.webp`))
  }
}

/**
 * One mask rung: trim to ink, resize, throw the colour away, encode.
 *
 * `mask-image` on a raster source reads the alpha channel and nothing else
 * (`mask-mode: match-source` resolves to `alpha` for images), so the RGB is
 * free to be whatever compresses best. Flattening it to a single value turns
 * every row into a long run for zlib.
 */
async function emitMaskRung(trimmed, outPath, width) {
  const { data, info } = await sharp(trimmed)
    .resize({ width })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255
    data[i + 1] = 255
    data[i + 2] = 255
  }

  await emit(sharp(data, { raw: info }).png({ compressionLevel: 9 }), outPath)
  return info
}

async function generateBrandMasks() {
  const ink = {}
  for (const { source, base, widths } of BRAND_MASKS) {
    // Trim first so the emitted mask *is* the mark: `mask-size: contain` then
    // maps ink to box with no transparent margin to account for.
    const { data, info } = await sharp(join(BRAND_SOURCE, source))
      .trim({ threshold: 2 })
      .toBuffer({ resolveWithObject: true })

    for (const width of widths) {
      await emitMaskRung(data, join(BRAND_OUT, `${base}-${width}.png`), width)
    }
    ink[base] = { width: info.width, height: info.height }
  }
  return ink
}

/**
 * Favicons from the bearcat; the app tile from `icon_discord.png`, which is
 * what it was drawn to be. The bearcat is squared on transparency rather than
 * stretched — it is 0.952:1, and a favicon slot is 1:1.
 */
async function generateAppIcons() {
  const bearcat = join(BRAND_SOURCE, 'icon.png')
  const square = { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }

  for (const size of [32, 64]) {
    await emit(
      sharp(bearcat)
        .trim({ threshold: 2 })
        .resize({ width: size, height: size, ...square })
        .png({ compressionLevel: 9 }),
      join(BRAND_OUT, `favicon-${size}.png`),
    )
  }

  const tile = join(BRAND_SOURCE, 'icon_discord.png')
  await emit(
    sharp(tile).resize({ width: 180, height: 180 }).png({ compressionLevel: 9, palette: true }),
    join(BRAND_OUT, 'apple-touch-icon.png'),
  )
  await emit(
    sharp(tile).png({ compressionLevel: 9, palette: true }),
    join(BRAND_OUT, 'og-image.png'),
  )
}

function kb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`
}

await generateHero()
await generateSectionPhotos()
await generateAboutPhotos()
await generateSponsorsPhotos()
await generateOrganizerPhotos()
await generateLandmarkPhotos()
const brandInk = await generateBrandMasks()
await generateAppIcons()

let total = 0
for (const { path, bytes } of written) {
  total += bytes
  console.log(`  ${relative(ROOT, path).replace(/\\/g, '/').padEnd(44)} ${kb(bytes)}`)
}
console.log(`\n${written.length} derivatives, ${kb(total)} on disk.`)

// The two strings that have to match the hand-written copies in the app.
const srcset = (ext) =>
  HERO_WIDTHS.map((w) => `/artwork/photos/hero-campus-${w}.${ext} ${w}w`).join(', ')
console.log(`\nHero AVIF srcset:\n  ${srcset('avif')}`)
console.log(`Hero WebP srcset:\n  ${srcset('webp')}`)

// The mark geometry the app has to agree with. `aspect-ratio` in
// src/components/Wordmark.tsx is built from exactly these numbers.
for (const [base, { width, height }] of Object.entries(brandInk)) {
  console.log(
    `\n${base} ink box: ${width} x ${height}  (aspect ${(width / height).toFixed(5)})`,
  )
}

// The realistic first load: the widest hero tier, in one format.
const heroStat = await stat(HERO_SOURCE)
for (const ext of ['avif', 'webp']) {
  const heroTop = written.find((w) =>
    w.path.endsWith(`hero-campus-${HERO_WIDTHS.at(-1)}.${ext}`),
  )
  console.log(
    `\nFirst load, ${ext.toUpperCase()} path (widest hero tier): ${kb(heroTop.bytes)}` +
      (ext === 'avif' ? `  [source PNG is ${kb(heroStat.size)}]` : ''),
  )
}
