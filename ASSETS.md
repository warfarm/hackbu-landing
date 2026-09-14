# Artwork assets

The read-only `artwork/` directory holds the delivered source files; `public/artwork/` is
the deployable copy. The originals in `artwork/` are untouched and remain the source of
truth.

```
artwork/campus/Campus.png    ->  public/artwork/campus/Campus.png
artwork/clouds/cloud-N.png   ->  (no longer copied — see "The cloud cutouts")
```

Because these live under `public/`, Vite serves them verbatim at the matching URL path
and copies them into `dist/` untransformed. Reference them by absolute URL, e.g.
`/artwork/campus/Campus.png` — **not** by import.

Two further subdirectories, `public/artwork/about/` and `public/artwork/sponsors/`, hold
the event **photographs** the About us and Sponsors pages show. They are the one part of
`public/artwork/` with no counterpart in `artwork/`: their sources are the committed JPEGs
themselves, not a read-only original elsewhere. Everything else on this page applies to
them unchanged — `npm run images` writes the AVIF/WebP beside each JPEG, and the JPEG stays
as the `<picture>` fallback. See "The page photographs" below.

## The campus illustration

**`public/artwork/campus/Campus.png` is the campus illustration** — a single crisp,
flat-shaded aerial scene of Binghamton University under snow, with bare winter
hillsides behind, that the scroll-driven hero pan reveals. (It replaced the original
painterly illustration through several iterations on 2026-09-03, all at the original's
exact 1672 × 941 by the end; the cel style survives the hero's start-frame
magnification far better than brushwork did. This artwork's short sky is also why
`PAN_START_SCALE` rose from 3 to 3.8 — see Hero.tsx.) It is the only *source* file in
`public/artwork/campus/` (the AVIF/WebP derivatives sit beside it — see Derivatives
below).

A second campus file lives in `artwork/campus/` only:
**`Campus-upscaled-6688.webp` (6688 × 3764, lossless WebP, 22,760,394 B)** is the raw 4x
Real-ESRGAN (`realesrgan-x4plus`) enlargement of the illustration, made because the
hero's start frame magnifies the artwork 3x and an intrinsic-width ladder renders
visibly soft there. It is the source for the four srcset rungs above 1672 (see Derivatives) and is never copied to
`public/` or shipped itself; it is stored as lossless WebP rather than PNG purely
because that is several MB smaller in the repository.

## The cloud cutouts

**Removed from the site.** `artwork/clouds/cloud-1.png` … `cloud-12.png` are twelve
individual cloud cutouts — one cloud each on a transparent background — that the hero used
to layer over the sky as a three-deep drifting parallax. That layer (`HeroClouds.tsx`, the
`public/artwork/clouds/` copies and their AVIF/WebP derivatives) was removed so the hero
opens on the illustration alone. The originals stay in `artwork/clouds/` as read-only
reference, alongside `clouds-all-b.png` (2172 × 724), a contact sheet of all twelve. Nothing
copies any of them into `public/`, so `npm run images` never sees them and the browser never
downloads them.

## Inventory

| File | Dimensions (px) | Aspect ratio | File size | Color type | Alpha |
| --- | --- | --- | --- | --- | --- |
| `public/artwork/campus/Campus.png` | 1672 × 941 | 1.777 (≈16:9) | 2,829,783 B (2.70 MiB) | 2 — truecolor RGB | No |

1 file, 2,829,783 bytes (2.70 MiB) total.

Not shipped, listed for completeness:

| File | Dimensions (px) | File size | Why it stays in `artwork/` |
| --- | --- | --- | --- |
| `artwork/clouds/cloud-1..12.png` | 224–430 × 70–303 | 838,494 B (818.8 KiB) together | The twelve cloud cutouts the hero no longer renders (see "The cloud cutouts"). Never copied to `public/`, never fed to `npm run images`. |
| `artwork/clouds/clouds-all-b.png` | 2172 × 724 | 453,487 B (442.9 KiB) | Reference contact sheet of the twelve cutouts, not a cutout. Never copied to `public/`, never rendered, never fed to `npm run images`. |
| `artwork/campus/Campus-upscaled-6688.webp` | 6688 × 3764 | 24,033,448 B (22.9 MiB) | 4x Real-ESRGAN enlargement of `Campus.png` (lossless WebP) — the source `npm run images` cuts the 2508/3344/5016/6688 rungs from. Never copied to `public/`; only its AVIF/WebP derivatives ship. |

Dimensions were read directly from each file's IHDR chunk; sizes are from the filesystem.

## The page photographs

Five JPEGs, in two directories that hold no PNG at all. They are the source files, so
unlike the illustration and the cutouts there is nothing in `artwork/` behind them. Each
is referenced from `src/lib/images.ts` (`ABOUT_PHOTOS`, `SPONSORS_PHOTO`), which also
carries its `alt` text, and each is rendered inside a `<picture>` with AVIF and WebP
sources ahead of the JPEG.

| File | Dimensions (px) | JPEG | AVIF | WebP | Used by |
| --- | --- | --- | --- | --- | --- |
| `public/artwork/about/collaborate.jpg` | 1024 × 683 | 166,855 B | 89,543 B | 71,252 B | About us — masthead, eager |
| `public/artwork/about/table.jpg` | 1024 × 768 | 266,257 B | 127,648 B | 136,812 B | About us — workshops, `loading="lazy"` |
| `public/artwork/about/hackathon.jpg` | 1024 × 683 | 214,391 B | 120,341 B | 116,448 B | About us — hackathon, `loading="lazy"` |
| `public/artwork/about/hall.jpg` | 1024 × 683 | 224,970 B | 121,151 B | 120,930 B | **nothing — see below** |
| `public/artwork/sponsors/workshop.jpg` | 1024 × 768 | 240,688 B | 131,221 B | 135,700 B | Sponsors — masthead, eager |

15 files, 2,284,207 bytes (2.18 MiB) on disk; what a visitor downloads is one derivative
per photo the page renders, so About us costs 337,532 B of AVIF across its three and
Sponsors 131,221 B for its one.

**`hall.jpg` and its two derivatives are shipped but unreferenced.** No component names it
and `src/lib/images.ts` does not list it: it is a fourth About us photo that the page as
built does not use. It costs nothing on any page load — nothing links it — but it is 467 KB
in `dist/` and it is the one exception to this file's otherwise exact
shipped-equals-referenced accounting. Either give it a place on the page or delete all
three files; do not leave it as a permanent third state.

Both directories predate the AVIF/WebP quality settings being written down for photographs
specifically: `scripts/generate-images.mjs` reuses the campus encoder settings (`AVIF`
q68, `CAMPUS_WEBP` q82) for them, which is why the WebP is *larger* than the AVIF on four
of the five. `<picture>` offers AVIF first, so the WebP is only ever fetched by a browser
that has no AVIF at all, and the ordering costs those browsers nothing they would not have
paid for the JPEG.

## Derivatives

`npm run images` (`scripts/generate-images.mjs`, using `sharp` as a devDependency)
writes AVIF and WebP derivatives **beside** each PNG. The PNGs above are untouched and
remain the last-resort `<img src>` inside each `<picture>`. The derivatives are
committed, so a deploy does not need to run `npm run images` — the build runs
`npm run build` (lint, `tsc -b`, `vite build`, then the prerender step — a lint warning
fails the deploy too) and nothing else.

| Output | Widths | Encoder | Total |
| --- | --- | --- | --- |
| `campus/Campus-{640,…,3344,5016,6688}.avif` | 8 | AVIF q68 | 5,676 KB |
| `campus/Campus-{640,…,3344,5016,6688}.webp` | 8 | WebP q82 | 6,387 KB |
| `about/{collaborate,table,hackathon,hall}.avif` | 1 each (intrinsic) × 4 | AVIF q68 | 448 KB |
| `about/{collaborate,table,hackathon,hall}.webp` | 1 each (intrinsic) × 4 | WebP q82 | 435 KB |
| `sponsors/workshop.avif` | 1 (intrinsic) | AVIF q68 | 128 KB |
| `sponsors/workshop.webp` | 1 (intrinsic) | WebP q82 | 133 KB |

The campus ladder tops out at **6688px**, four times the source's 1672: the rungs at
and below 1672 are cut from `Campus.png`, and the 2508/3344/5016/6688 rungs from
`artwork/campus/Campus-upscaled-6688.webp` (see "The campus illustration" above). The
hero magnifies the artwork up to 3.8x at its start frame, which is why `sizes`
(`CAMPUS_SIZES` in `src/lib/images.ts`, mirrored by the preload's `imagesizes` in
`index.html`) quotes the drawn width times 3.8 for laptop-and-up screens, so desktops
take the top of the ladder. Small touch screens are deliberately capped by the leading
`1114px` entries (one for portrait width, one for landscape height, both gated on
`(pointer: coarse)` so short or narrow *desktop* windows never take them): a phone's
`object-cover` crop discards most of the drawn width, so the heavy top rungs would be
mostly cropped bytes — DPR-2 phones land on 2508 and DPR-3 phones on 3344 instead.

**First load of the landing page**, by screen class. Since the cloud layer was removed
the hero makes **one** image request — the campus tier the `sizes` expression selects —
so the numbers below are that file's size on disk (budget taken as 1,500,000 B):

- **Desktop** (1900x912 @1x and 1440x900 @2x both select `Campus-6688.avif`):
  **2,136,858 bytes (2,087 KB)** — **142% of the 1.5 MB budget: the budget is
  deliberately exceeded on desktop**, traded for a start frame that is not visibly soft
  at 3.8x magnification. (The bare-tree hillside texture compresses worse than the
  previous artwork did.)
- **Phone** (390x844 @3x and 844x390 @3x with touch emulation both cap to
  `Campus-3344.avif`): **882,582 bytes (862 KB)** — 59% of the budget.

(History: 495,259 B / 32% of budget when the ladder was capped at the original
painterly artwork's intrinsic 1672px; the desktop overrun began when the upscaled
rungs landed and is the price of the sharp start frame. Before the cloud layer went,
the twelve cloud AVIFs added ~173 KB and twelve requests on top of the campus tier —
2,312,836 B on desktop, 1,058,588 B on phones, measured 2026-09-03.)

## The brand marks

`brand-source/` is a second read-only source directory, holding the three HackBU brand
files. Unlike `artwork/`, nothing in it is copied verbatim into `public/` — everything the
site ships is derived, by the same `npm run images` run.

| File | Dimensions (px) | Ink box (trimmed) | Colour | Alpha |
| --- | --- | --- | --- | --- |
| `brand-source/icon.png` | 1920 × 2033 | 1741 × 1828 (0.95241) | `#339966`, one stroke colour | Yes |
| `brand-source/text.png` | 7690 × 1080 | 7690 × 1080 (7.12037) — no padding | `#42B872`, one stroke colour | Yes |
| `brand-source/icon_discord.png` | 732 × 732 | n/a — opaque tile | `#97F5AC` tile, `#50B536` mark | Yes — channel present, fully opaque |

The two greens are not the same, and neither is a palette colour. The page does not
reconcile them in the pixels: the marks render as `mask-image` shapes filled with the
`fern` token, so the derivatives below carry **alpha only** — their RGB is flattened to
white before encoding, which `mask-image` never reads.

| Output | Size | From | Bytes |
| --- | --- | --- | --- |
| `brand/bearcat-mask-64.png` | 64 × 67 | `icon.png`, trimmed | 3,164 |
| `brand/bearcat-mask-128.png` | 128 × 134 | `icon.png`, trimmed | 6,941 |
| `brand/wordmark-mask-192.png` | 192 × 27 | `text.png` | 2,147 |
| `brand/wordmark-mask-384.png` | 384 × 54 | `text.png` | 4,850 |
| `brand/favicon-32.png` | 32 × 32 | `icon.png`, trimmed and squared | 1,824 |
| `brand/favicon-64.png` | 64 × 64 | `icon.png`, trimmed and squared | 4,601 |
| `brand/apple-touch-icon.png` | 180 × 180 | `icon_discord.png` | 7,805 |
| `brand/og-image.png` | 732 × 732 | `icon_discord.png` | 10,014 |

The mask rungs are `[1x, 2x]` against the largest place each mark is drawn — the `sm`
header lockup, where the bearcat is 35.7 CSS px wide and the wordmark 153.8. One rung of
each loads per device: **5.2 KB at 1x, 11.5 KB at 2x**, on top of the artwork's 483.7 KB.

`icon_discord.png` is 2,158,148 bytes as delivered, for a 14-colour 732 × 732 image;
re-encoding it as a palette PNG is what turns it into the 10 KB social card above.

## Notes

Observations from the raw files. The two questions this section used to raise are both
settled — recorded here as fact rather than as open questions:

- **The hero is a vertical scale-pan, not a horizontal scroll-pan.** Campus.png is 1672 px
  wide and has no alpha; a horizontal scroll-pan would have had limited travel before
  upscaling past 1:1 on a wide desktop viewport. `src/components/Hero.tsx` instead scales
  the illustration up from a fixed top edge (`object-position: 49% 0%` +
  `transform-origin: top`, no translation at all), which fits the source dimensions.
- **At 2.70 MiB, Campus.png is the whole of the shipped source artwork** (the Inventory
  total, now that the cloud cutouts no longer ship). It is also the
  largest-contentful-paint candidate; AVIF/WebP derivatives beside it are what keep the
  transferred weight far below that, per Derivatives above.
