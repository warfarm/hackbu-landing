# Artwork assets

The site's images come from two read-only source directories, and everything the browser
downloads is a derivative in `public/artwork/`:

- **`hackbuimage/`** — the four campus photographs, as delivered. The hero and the three
  section photographs are cut from these by `npm run images`.
- **`artwork/`** — the retired cel-shaded campus illustration (with its 4x Real-ESRGAN
  master) and the retired cloud cutouts. Kept as reference; nothing in it is copied to
  `public/` any more.

```
hackbuimage/image.png                    ->  public/artwork/photos/hero-campus.jpg
                                             public/artwork/photos/hero-campus-{640,960,1200}.{avif,webp}
hackbuimage/winter-header.jpg            ->  public/artwork/photos/plaza-winter.{jpg,avif,webp}
hackbuimage/1-KS1-WEB-2-1024x683.jpg     ->  public/artwork/photos/snow-walk.{jpg,avif,webp}
hackbuimage/47065170581_63875cf429_b.jpg ->  public/artwork/photos/campus-path.{jpg,avif,webp}
artwork/campus/Campus.png                ->  (no longer copied — see "The retired illustration")
artwork/clouds/cloud-N.png               ->  (no longer copied — see "The cloud cutouts")
```

Because these live under `public/`, Vite serves them verbatim at the matching URL path
and copies them into `dist/` untransformed. Reference them by absolute URL, e.g.
`/artwork/photos/hero-campus.jpg` — **not** by import.

Two further subdirectories, `public/artwork/about/` and `public/artwork/sponsors/`, hold
the event **photographs** the About us and Sponsors pages show. Their sources are the
committed JPEGs themselves. `npm run images` writes the AVIF/WebP beside each JPEG, and
the JPEG stays as the `<picture>` fallback. See "The page photographs" below.

## The hero photograph

**`hackbuimage/image.png` (1200 × 674, 1,732,782 B) is the hero** — a real aerial
photograph of the whole Binghamton University campus under snow: the brick Library Tower
at the centre, academic buildings and dormitories around it, snow-covered walkways across
the plaza, forested hills behind. It replaced the AI-generated cel-shaded illustration on
2026-09-14. The delivered file is a PNG of a photograph, so `npm run images` re-encodes it
as `public/artwork/photos/hero-campus.jpg` (the `<img src>` fallback, 242,864 B) and cuts
AVIF + WebP rungs at 640, 960 and 1200 — the source's own width, never enlarged. The hero
magnifies it only 1.2x at its start frame (`PAN_START_SCALE` in Hero.tsx), which is as far
as a 1200px photograph can be pushed before it reads soft on a retina laptop; a sharper
hero needs a wider original.

Its aspect ratio, 1.780:1, is a hair under 16:9, so `object-cover` is height-bound on
1440 × 900 laptops (90% of the frame visible) and on phones (26% at 390 × 844), and
width-bound only on screens wider than 16:9. The Library Tower stands at the centre of the
frame, so a single `object-position` of `50% 0%` keeps it centred in every crop.

## The section photographs

Three more photographs from `hackbuimage/`, one per landing-page content section, each
set into the layout with feathered edges (`src/components/SectionPhoto.tsx` and the
`.photo-feather` mask in `src/index.css` — the files themselves carry no alpha channel; the
edges are dissolved at paint time). Contact, the page's quiet landing, has none.

| Section | Source | Dimensions (px) | Shipped as |
| --- | --- | --- | --- |
| About | `hackbuimage/winter-header.jpg` | 1600 × 600 | `photos/plaza-winter.{jpg,avif,webp}` |
| Get involved | `hackbuimage/1-KS1-WEB-2-1024x683.jpg` | 1024 × 683 | `photos/snow-walk.{jpg,avif,webp}` |
| Questions | `hackbuimage/47065170581_63875cf429_b.jpg` | 658 × 1024 | `photos/campus-path.{jpg,avif,webp}` |

All three are `loading="lazy"` — every one is below the fold — and each `<picture>`
switches on format only, with no `srcset`: they render at a fraction of their width inside
the 64rem content column. The About band shows the plaza photograph at its own 8:3 from
`sm` up and as a 16:9 crop on phones.

## The retired illustration

`artwork/campus/Campus.png` (1672 × 941, 2,829,783 B) is the cel-shaded aerial illustration
the hero opened on until the photograph landed, and `artwork/campus/Campus-upscaled-6688.webp`
(6688 × 3764, 24,033,448 B, lossless) is its 4x Real-ESRGAN master, made because the
illustration was magnified 3.8x on screen. Neither is copied to `public/` any more, and
the sixteen `Campus-*.{avif,webp}` rungs that used to ship were deleted with the swap.
Both stay in `artwork/` as read-only reference.

## The cloud cutouts

**Removed from the site.** `artwork/clouds/cloud-1.png` … `cloud-12.png` are twelve
individual cloud cutouts — one cloud each on a transparent background — that the hero used
to layer over the sky as a three-deep drifting parallax. That layer (`HeroClouds.tsx`, the
`public/artwork/clouds/` copies and their AVIF/WebP derivatives) was removed so the hero
opens on its picture alone. The originals stay in `artwork/clouds/` as read-only
reference, alongside `clouds-all-b.png` (2172 × 724), a contact sheet of all twelve. Nothing
copies any of them into `public/`, so `npm run images` never sees them and the browser never
downloads them.

## Inventory

Shipped source files — the `<img src>` fallbacks under `public/artwork/photos/`, all
re-encoded JPEGs with no alpha channel:

| File | Dimensions (px) | Aspect ratio | File size | Rendered by |
| --- | --- | --- | --- | --- |
| `public/artwork/photos/hero-campus.jpg` | 1200 × 674 | 1.780 | 242,864 B | Hero |
| `public/artwork/photos/plaza-winter.jpg` | 1600 × 600 | 2.667 | 221,725 B | About |
| `public/artwork/photos/snow-walk.jpg` | 1024 × 683 | 1.499 | 107,242 B | Get involved |
| `public/artwork/photos/campus-path.jpg` | 658 × 1024 | 0.643 | 185,229 B | Questions |

4 files, 757,060 bytes (739.3 KiB) total.

Not shipped, listed for completeness:

| File | Dimensions (px) | File size | Why it stays put |
| --- | --- | --- | --- |
| `hackbuimage/*` (4 files) | as above | 2,257,126 B | The delivered photographs — the read-only source `npm run images` reads. Never copied to `public/` verbatim; `image.png` in particular is a 1.7 MB PNG of a photograph, which is why the fallbacks are re-encoded JPEGs. |
| `artwork/campus/Campus.png` | 1672 × 941 | 2,829,783 B | The retired illustration (see above). |
| `artwork/campus/Campus-upscaled-6688.webp` | 6688 × 3764 | 24,033,448 B | Its 4x Real-ESRGAN master (see above). |
| `artwork/clouds/cloud-1..12.png` | 224–430 × 70–303 | 838,494 B together | The twelve cloud cutouts the hero no longer renders (see "The cloud cutouts"). |
| `artwork/clouds/clouds-all-b.png` | 2172 × 724 | 453,487 B | Reference contact sheet of the twelve cutouts, not a cutout. |

Dimensions were read from each file's header; sizes are from the filesystem.

## The page photographs

Five JPEGs, in two directories that hold no PNG at all. They are the source files, so
unlike the illustration and the cutouts there is nothing in `artwork/` behind them. Each
is referenced from `src/lib/images.ts` (`ABOUT_PHOTOS`, `SPONSORS_PHOTO`), which also
carries its `alt` text, and each is rendered inside a `<picture>` with AVIF and WebP
sources ahead of the JPEG.

| File | Dimensions (px) | JPEG | AVIF | WebP | Used by |
| --- | --- | --- | --- | --- | --- |
| `public/artwork/about/collaborate.jpg` | 1024 × 683 | 166,855 B | 89,543 B | 71,252 B | About us — masthead carousel, eager |
| `public/artwork/about/table.jpg` | 1024 × 768 | 266,257 B | 127,648 B | 136,812 B | About us — workshops, `loading="lazy"` |
| `public/artwork/about/hackathon.jpg` | 1024 × 683 | 214,391 B | 120,341 B | 116,448 B | About us — hackathon, `loading="lazy"` |
| `public/artwork/about/hall.jpg` | 1024 × 683 | 224,970 B | 121,151 B | 120,930 B | About us — masthead carousel, eager |
| `public/artwork/about/{code,side-by-side,monitor,waiting}.jpg` | 1619 × 1080 | 197–269 KB | | | About us — masthead carousel, lazy |
| `public/artwork/about/{python-workshop,expo,tech-talk,study-room,debugging}.jpg` | 1440 × 1080 | 162–284 KB | | | About us — section carousels, lazy |
| `public/artwork/sponsors/workshop.jpg` | 1024 × 768 | 240,688 B | 131,221 B | 135,700 B | Sponsors — masthead, eager |

15 files, 2,284,207 bytes (2.18 MiB) on disk; what a visitor downloads is one derivative
per photo the page renders, so About us costs 337,532 B of AVIF across its three and
Sponsors 131,221 B for its one.

**Every About us section is a carousel** (`src/about/PhotoCarousel.tsx`), fed by
`ABOUT_CAROUSELS` in `src/lib/images.ts` — community (masthead), workshops, hackathon — with
no photo repeated. `collaborate`, `table`, `hackathon` and the formerly unreferenced `hall`
were already here; nine were added on 2026-09-14 from the HackBU 2023 album on hackbu.org
(`/img/hackathon/2023/` — `20230204_hackathon{21,17,19,03}_jwc.jpg`,
`20230204_{150216,170706,152838,152903}.jpg`, `20230205_140800.jpg`), resized to 1080px
tall because each landscape frame is cropped into a portrait panel. Only the masthead's
first two panels load eagerly; the lower carousels are fully lazy.

Both directories predate the AVIF/WebP quality settings being written down for photographs
specifically: `scripts/generate-images.mjs` uses the same encoder settings (`AVIF`
q68, `WEBP` q82) for them as for the hero, which is why the WebP is *larger* than the AVIF on four
of the five. `<picture>` offers AVIF first, so the WebP is only ever fetched by a browser
that has no AVIF at all, and the ordering costs those browsers nothing they would not have
paid for the JPEG.

## Derivatives

`npm run images` (`scripts/generate-images.mjs`, using `sharp` as a devDependency)
writes the JPEG fallbacks and the AVIF and WebP derivatives into `public/artwork/photos/`,
and AVIF + WebP **beside** each JPEG in the other `public/artwork/` directories. The
derivatives are committed, so a deploy does not need to run `npm run images` — the build
runs `npm run build` (lint, `tsc -b`, `vite build`, then the prerender step — a lint
warning fails the deploy too) and nothing else.

| Output | Widths | Encoder | Total |
| --- | --- | --- | --- |
| `photos/hero-campus-{640,960,1200}.avif` | 3 | AVIF q68 | 373 KB |
| `photos/hero-campus-{640,960,1200}.webp` | 3 | WebP q82 | 383 KB |
| `photos/{plaza-winter,snow-walk,campus-path}.avif` | 1 each (intrinsic) × 3 | AVIF q68 | 386 KB |
| `photos/{plaza-winter,snow-walk,campus-path}.webp` | 1 each (intrinsic) × 3 | WebP q82 | 440 KB |
| `about/{collaborate,table,hackathon,hall}.avif` | 1 each (intrinsic) × 4 | AVIF q68 | 448 KB |
| `about/{collaborate,table,hackathon,hall}.webp` | 1 each (intrinsic) × 4 | WebP q82 | 435 KB |
| `sponsors/workshop.avif` | 1 (intrinsic) | AVIF q68 | 128 KB |
| `sponsors/workshop.webp` | 1 (intrinsic) | WebP q82 | 133 KB |

The hero ladder tops out at the source's own **1200px**; nothing is enlarged. The hero
magnifies the photograph 1.2x at its start frame, so `sizes` (`HERO_SIZES` in
`src/lib/images.ts`, mirrored by the preload's `imagesizes` in `index.html`) quotes the
drawn width times 1.2 — `120vw` on screens wider than the photo's 1.780:1, `213.65vh`
everywhere else. In practice any screen past a 1000px 1x draw takes the 1200 rung, which
is nearly all of them; the lower rungs exist for small phones and slow connections.

**First load of the landing page.** The hero makes **one** image request — the tier the
`sizes` expression selects — and the three section photographs are lazy, so they load as
the reader scrolls to them. Sizes on disk (budget taken as 1,500,000 B):

- **Desktop and most phones** select `hero-campus-1200.avif`: **193,694 bytes (189 KB)** —
  **13% of the 1.5 MB budget.** (The illustration this replaced cost 2,136,858 B on desktop
  at its 6688 rung, 142% of budget, because it was magnified 3.8x and needed the 4x
  upscaled ladder to stay sharp. The photograph is drawn at most 1.2x from a 1200px
  source.)
- **All three section photographs together**, if the reader scrolls the whole page:
  **395,245 bytes (386 KB)** of AVIF, lazily — 26% of budget on top of the hero.

(History: 495,259 B / 32% of budget with the original painterly artwork capped at
1672px; 2,312,836 B / 151% at the cel-shaded illustration's 6688 rung plus twelve cloud
cutouts; 2,136,858 B / 142% after the clouds went; 169,389 B with the 1600px winter plaza
photo as the hero; now 193,694 B.)

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

- **The hero is a vertical scale-settle, not a reveal.** The photograph is 1200 px wide
  with no alpha, and `src/components/Hero.tsx` scales it from 1.2 back to 1 about a fixed
  top edge (`object-position: 50% 0%` + `transform-origin: top`, no translation at all).
  The illustration it replaced opened at 3.8x on a sky band and revealed the campus; the
  photograph has no sky-only band, so the pan is gentler and the scroll track shorter.
- **The hero AVIF is 189 KB** and is the largest-contentful-paint candidate; it is
  preloaded from `index.html` with the same `imagesrcset`/`imagesizes` as the `<picture>`
  so it is fetched exactly once.
- **`image.png` is a photograph stored as PNG** (1.7 MB for 1200 × 674). It is never
  served; the re-encoded 243 KB JPEG fallback and the 189 KB AVIF are.
