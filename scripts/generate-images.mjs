/**
 * Build-time image derivative generator — `npm run images`.
 *
 * Reads the source images — the JPEG/PNG copies under `public/artwork/` — and
 * writes AVIF + WebP derivatives into `public/artwork/`. The sources are never touched; a JPEG or
 * PNG stays in place as the final <picture> fallback.
 *
 * This runs by hand, not on every build: the outputs are committed, so a
 * deploy needs nothing but `npm run build` (lint, `tsc -b`, `vite build`, then
 * the prerender step) — never this script. `sharp` is therefore a devDependency
 * and never reaches the browser bundle.
 *
 * ---------------------------------------------------------------------------
 * Photographs
 * ---------------------------------------------------------------------------
 * Every photograph is rendered at a fraction of its width, so each gets one
 * derivative per format at its intrinsic size. (The campus photographs — the
 * hero ladder, the three section photos and the clock-tower cutout — were
 * removed with the snow-scene redesign, sources included: the hero and the
 * section décor are drawn by three.js now, see src/three/.)
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
 * AVIF q68 / WebP q82 sit just below the knee of both curves.
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

import { mkdir, readdir, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ARTWORK = join(ROOT, 'public', 'artwork')
/** Read-only, exactly like `artwork/`. Nothing here is ever written back. */
const BRAND_SOURCE = join(ROOT, 'brand-source')
const BRAND_OUT = join(ROOT, 'public', 'brand')

const AVIF = { quality: 68, effort: 6 }
const WEBP = { quality: 82, effort: 6 }

/**
 * The mask ladder. `widths` is `[1x, 2x]`, sized against the *largest* place
 * each mark is drawn — the `sm` header lockup, where the bearcat is 35.7 CSS px
 * wide and the wordmark 153.8 CSS px (see src/components/Wordmark.tsx). Both 1x
 * rungs sit above those with headroom, so the mark is never upscaled.
 *
 * **Keep `base` and the emitted ink dimensions in sync with `BEARCAT_MARK` /
 * `WORDMARK_MARK` in `src/lib/images.ts`.** The run prints both so a drift is visible.
 */
const BRAND_MASKS = [
  // The largest rung of each feeds `.brand-mark-lg` (the About us lockup).
  { source: 'icon.png', base: 'bearcat-mask', widths: [64, 128, 256] },
  { source: 'text.png', base: 'wordmark-mask', widths: [192, 384, 768] },
]

const written = []

async function emit(pipeline, outPath) {
  const buffer = await pipeline.toBuffer()
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, buffer)
  written.push({ path: outPath, bytes: buffer.length })
  return buffer.length
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

await generateAboutPhotos()
await generateSponsorsPhotos()
await generateOrganizerPhotos()
const brandInk = await generateBrandMasks()
await generateAppIcons()

let total = 0
for (const { path, bytes } of written) {
  total += bytes
  console.log(`  ${relative(ROOT, path).replace(/\\/g, '/').padEnd(44)} ${kb(bytes)}`)
}
console.log(`\n${written.length} derivatives, ${kb(total)} on disk.`)

// The mark geometry the app has to agree with. `aspect-ratio` in
// src/components/Wordmark.tsx is built from exactly these numbers.
for (const [base, { width, height }] of Object.entries(brandInk)) {
  console.log(
    `\n${base} ink box: ${width} x ${height}  (aspect ${(width / height).toFixed(5)})`,
  )
}

