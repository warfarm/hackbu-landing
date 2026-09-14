# HackBU landing page

A redesigned landing page for [HackBU](https://hackbu.org), the student tech club at
Binghamton University. One job: get undergrads — most of them with no programming
experience — into the Discord.

The hero is a real aerial photograph of campus under snow — the green clock tower in the
foreground, the Library Tower beyond, students crossing the plaza. On load it opens at a
slight zoom (`PAN_START_SCALE = 1.2`) with its sky pinned to the top of the screen;
scrolling eases it back to its full frame, holds for a beat, then scrolls away to the
content below. Each content section then carries one more campus photograph, set into the
page with feathered edges (`SectionPhoto.tsx` and `.photo-feather` in `src/index.css`).

(The photograph replaced a cel-shaded illustration that opened at 3.8x on a sky band with
a drifting cloud parallax over it. A photograph cannot take that magnification and has no
sky-only band to open on, so the pan is a settle rather than a reveal, and the scroll
track shrank from 260dvh to 180dvh with it.)

Five public pages live here now: the landing page plus **About us**, **Schedule**,
**Sponsors** and **Hackathons**, each a separate HTML entry with its own bundle (see
"The pages, and how they are routed" below). The blog, photos, organizers and resources
pages stay on `hackbu.org` and are linked from the header and footer; registration is an
anchor on the hackathons page.

## Stack

- **Vite** + **React** + **TypeScript**
- **Tailwind CSS v4** via the `@tailwindcss/vite` plugin (theme lives in `src/index.css`,
  not a JS config)
- **`motion`** (Framer Motion) for every animation — all scroll work goes through
  `useScroll` / `useTransform` / `whileInView`. There are no `scroll` event listeners.
- **Vercel** for hosting
- `sharp` as a dev-only dependency for generating image derivatives

## Local setup

**Node 24 or newer** — declared as `"engines": { "node": ">=24" }` in `package.json`, which
is both what `npm install` warns against and what Vercel reads to pick a build runtime. The
toolchain (Vite 8, TypeScript 6, `@types/node` 24, `sharp`) is what sets the floor.

```bash
npm install
```

```bash
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Lints, type-checks (`tsc -b`), builds to `dist/`, then prerenders all six pages into it |
| `npm run preview` | Serves the built `dist/` locally |
| `npm run typecheck` | `tsc -b --noEmit` — types only, no output |
| `npm run lint` | `oxlint --deny-warnings` — any diagnostic is a failure |
| `npm run images` | Regenerates the AVIF/WebP artwork derivatives and the `public/brand/` logo masks and app icons |

> `npm run typecheck` uses `tsc -b`, not a bare `tsc --noEmit`. The root `tsconfig.json`
> is a solution file (`"files": []` plus project references), so a bare `tsc --noEmit`
> would silently check nothing.

### Tooling

**Lint is a gate, not a report.** Every oxlint rule but one is a warning, so `npm run lint`
runs with `--deny-warnings` and `npm run build` runs it first — a warning fails the build,
and therefore the deploy, because `vercel.json` builds with `npm run build`. There is no CI
workflow in the repo; the build script is the only enforcement point there is.

**Enabled plugins** (`.oxlintrc.json`): `react`, `typescript`, `oxc`, `unicorn`, `jsx-a11y`.
Naming `plugins` at all *replaces* oxlint's default set rather than adding to it, so
`unicorn` has to be listed explicitly to keep the 13 rules that are on by default; `jsx-a11y`
is listed because accessibility is this page's main risk surface and 35 of its rules catch by
hand what a review would otherwise have to re-derive every time.

**The one suppression.** `src/components/Wordmark.tsx` turns off `jsx-a11y/prefer-tag-over-role`
for a single attribute, with the reasoning in that file's doc comment: the logo lockup is two
mask-painted `<span>`s that have to be announced as one graphic, which is what WAI-ARIA's
`img` role is for, and there is no image file for the `<img>` element the rule asks for. It is
an inline disable, not a config-level one, so the rule stays on everywhere else. oxlint's JSON
config takes no comments, which is why any such decision is recorded here.

**TypeScript strictness** (`tsconfig.app.json`, `tsconfig.node.json`): `strict` and
`noUncheckedIndexedAccess` are both declared `true`. `strict` is written out rather than left
to the compiler default so the setting survives a compiler upgrade. `exactOptionalPropertyTypes`
is deliberately off — motion's `MotionProps` types `viewport` as optional without `| undefined`,
which makes passing one through an error at every spread site; see the note in
`tsconfig.app.json`.

**Tailwind scanning** is scoped to `src/` by `@import 'tailwindcss' source('.')` in
`src/index.css`. Left unscoped, Tailwind's automatic detection reads every file the repo does
not gitignore — including Markdown — and any utility name that appears as prose in one of them
becomes a rule in the shipped stylesheet. None of the six HTML entries carries a `class`
attribute; if one ever does, it needs an explicit `@source` line.

There are **three stylesheet roots**, and every page reaches `src/index.css` through one of
them: `src/landing.css` (landing page, About us, Sponsors), `src/schedule/schedule.css`,
`src/hackathons/hackathons.css` — each `src/index.css` plus `@source not` lines — and the
component sheet, which imports `src/index.css` directly. That is what gives every page
exactly **one** `<link rel="stylesheet">`, `@font-face` rules included: a CSS-level
`@import` is inlined before Vite sees a module, so no stylesheet becomes a shared JS
dependency and no second, render-blocking link is emitted. The three page roots currently
produce byte-identical CSS, so Vite deduplicates them into one hashed file that all five
public pages link.

## Deploying

Vercel picks up `vercel.json`, which pins the framework to Vite, the build command to
`npm run build` and the output directory to `dist`. No backend, no database, and nothing
to configure in the project settings.

```bash
npx vercel deploy --prod
```

Image derivatives are **committed**, so `npm run images` does not run during a deploy —
a build is lint, `tsc -b`, `vite build` and `node scripts/prerender.mjs`, nothing else. Run
it by hand whenever the artwork changes (see below).

`vercel.json` also declares a `headers` block. `/assets/(.*)` — everything Vite emits, all
of it content-hashed — is served `public, max-age=31536000, immutable`, because a hashed
filename cannot change meaning and never needs revalidating; `/artwork/(.*)` and
`/brand/(.*)` get `public, max-age=86400, must-revalidate` instead, because those filenames
are stable across `npm run images` and a day-old copy has to be able to notice.

### When the custom domain lands

**Nothing in this repo needs editing.** The only places the site's own origin appears are
`index.html`'s `og:url` and `og:image` and the `og:image` on the four other public pages,
which have to be absolute; every one of them is written as
`%SITE_ORIGIN%`. The `siteOrigin` plugin in `vite.config.ts` substitutes it at build time
from **`VERCEL_PROJECT_PRODUCTION_URL`** — a variable Vercel sets on every build to the
project's production hostname, which follows the custom domain automatically once one is
attached. Off Vercel the variable is absent and the build falls back to the literal
`https://hackbu-landing.vercel.app`, so a local `dist/index.html` still carries a usable
absolute URL.

If the domain ever moves somewhere without that variable, change the fallback constant in
`vite.config.ts` — not the HTML.

### The pages, and how they are routed

The build has **six** entry points, declared in `vite.config.ts`:

| Entry | Page | Client entry | Prerendered by |
| --- | --- | --- | --- |
| `index.html` | the landing page | `src/main.tsx` | `renderIndex()` |
| `about.html` | About us | `src/about/main.tsx` | `renderAbout()` |
| `schedule.html` | the weekly workshop schedule | `src/schedule/main.tsx` | `renderSchedule()` |
| `sponsors.html` | sponsorship | `src/sponsors/main.tsx` | `renderSponsors()` |
| `hackathons.html` | the annual hackathon + registration | `src/hackathons/main.tsx` | `renderHackathons()` |
| `components.html` | an internal component sheet — every token, every primitive with its variants, and the composed sections rendered live | `src/sheet/main.tsx` | `renderComponents()` |

All six are prerendered: `npm run build` ends with `node scripts/prerender.mjs`, which
renders one export from `src/entry-server.tsx` per page and writes the markup into that
page's `<div id="root">`; the client then **hydrates** it rather than rebuilding it. Adding
a page means three edits together — a `rollupOptions.input` entry, a `render*` export, and a
`PAGES` row — or it ships with an empty root div.

They share the component tree, so Rollup hoists what they all import into one `shared` chunk
(plus `vendor` for `node_modules`) and each page's own entry chunk carries only its own code;
nothing under `src/sheet/` reaches any other page's bundle, and the two per-page section
directories (`src/components/sections/schedule/`, `.../hackathons/`) are deliberately kept
out of `shared` so only their own page downloads them. The sheet's Tailwind utilities are
kept out of the public pages' stylesheet by `src/landing.css` and the two sibling roots.

Routing the five clean URLs needs the **ten** rewrites in `vercel.json` — one per page, with
and without a trailing slash — and those are the **only** rules there; there is no catch-all.
Every row below is what that file now does:

| Request | Served by |
| --- | --- |
| `/` | the filesystem — `dist/index.html` as the directory index. No rewrite involved. |
| `/about`, `/about/` | two exact-match rewrites in `vercel.json`, both pointing at `/about.html` |
| `/schedule`, `/schedule/` | the same, at `/schedule.html` |
| `/sponsors`, `/sponsors/` | the same, at `/sponsors.html` |
| `/hackathons`, `/hackathons/` | the same, at `/hackathons.html` |
| `/components`, `/components/` | the same, at `/components.html` |
| `/about.html` and the other four `.html` paths | the filesystem — Vercel gives a real file precedence over `rewrites`. Each page therefore has a second URL; harmless for the sheet, which is `noindex, nofollow`. |
| any other real file (`/assets/…`, `/artwork/…`, `/brand/…`) | the filesystem |
| **anything else** — `/nonexistent`, `/componentsfoo`, `/favicon.ico` | nothing. No file, no matching rewrite → **404**, with `public/404.html` (shipped as `dist/404.html`) as the body. |

The last row is a deliberate choice: an unknown URL gets an honest 404 rather than a
200 landing page. There is no client-side router here — each page is its own document, with
in-page anchors — so a catch-all rewrite to `/index.html` would only turn every typo and
every stale inbound link into a soft 404 and an indexable duplicate of the home page.

**The Vite dev and preview servers do not emulate this**: both apply their own unconditional
`index.html` fallback, so `/nonexistent` and `/componentsfoo` render the landing page with a
200 under `npm run dev` and `npm run preview` alike, and `dist/404.html` is never reached — 404 behaviour can only be
checked against a real deployment. The clean URLs themselves *are* emulated in `vite dev`, by
the `cleanHtmlUrls` plugin in `vite.config.ts`, which carries the same ten paths as
`vercel.json`; `npm run preview` serves `dist/` and wants the `.html` suffix.

The sheet is `noindex, nofollow` and is not linked from any public page.

## Swapping the artwork

Source images live in two read-only directories: `hackbuimage/`, the delivered
photographs, and `artwork/`, the retired illustration and cloud cutouts kept as reference.
The files the site actually ships are in `public/artwork/`.

```
hackbuimage/                    read-only photographs, as delivered
  winter-header.jpg             the hero — 1600 x 600
  image.png                     About — aerial of the whole campus, 1200 x 674
  1-KS1-WEB-2-1024x683.jpg      Get involved — two students on a snowy path
  47065170581_63875cf429_b.jpg  Questions — winter walkway from above, 658 x 1024
artwork/                        read-only originals, no longer shipped
  campus/                       the retired illustration + its 4x Real-ESRGAN master
  clouds/                       the retired cloud cutouts + their contact sheet
public/artwork/
  photos/hero-winter.jpg        the hero's JPEG fallback
  photos/hero-winter-{640,960,1280,1600}.{avif,webp}
  photos/{campus-aerial,snow-walk,campus-path}.{jpg,avif,webp}
```

To replace a photograph:

1. Drop the new file into `hackbuimage/`. For the hero, keep the name `winter-header.jpg`;
   for a section photo, either keep the existing name or update the `SECTION_PHOTOS`
   table at the top of `scripts/generate-images.mjs`.
2. Run `npm run images` to regenerate the JPEG fallback and the AVIF and WebP derivatives
   in `public/artwork/photos/`. Nothing is enlarged: the hero ladder tops out at the
   source's own width, so a wider source is the only way to a sharper hero.
3. Update the dimensions and `alt` text in `src/lib/images.ts` (`HERO_WIDTH` /
   `HERO_HEIGHT` / `HERO_ALT`, or the `SECTION_PHOTOS` entry), and `ASSETS.md`.
4. Commit the regenerated derivatives along with the new source.

### If the new hero photograph is framed differently

Three things in the hero are tied to the specific photograph and will need re-deriving:

- **`PAN_START_SCALE`** in `src/components/Hero.tsx` (currently `1.2`). Keep the `sizes`
  multiplier in `src/lib/images.ts` (`HERO_SIZES`) and the preload's `imagesizes` in
  `index.html` equal to it. Do not push it far: the photo is already drawn wider than its
  1600px on most screens at scale 1.
- **`object-position`** on the hero `<img>`: `70% 0%` on phones and portrait screens,
  `50% 0%` at or above a 3:2 aspect ratio. The horizontal values are the focal crop —
  where the Library Tower and the clock tower fall in the frame — and were chosen against
  simulated `object-cover` crops of the source; a differently composed photo wants its own.
  The vertical `0%` pins the top edge and, together with `transform-origin: top`, is what
  keeps the framing aspect-independent; leave it at `0%`.
- **`HERO_SIZES`**'s aspect-ratio breakpoint (`1600/600`), which is the photo's own ratio.

The hero used to layer twelve drifting cloud cutouts over a cel-shaded illustration
(`HeroClouds.tsx`, `public/artwork/clouds/`, `public/artwork/campus/`). All of it was
removed when the photograph landed. Everything retired stays in `artwork/` as read-only
reference; nothing copies it into `public/`, so `npm run images` never encodes it and the
browser never downloads it.

## Swapping the branding

The three brand files live in `brand-source/`, which is read-only reference exactly like
`artwork/`. `npm run images` derives everything the site ships from them into
`public/brand/`.

```
brand-source/                read-only originals
  icon.png                   bearcat line-art mark, transparent
  text.png                   the HACKBU wordmark, transparent
  icon_discord.png           the bearcat on its app tile, opaque
public/brand/
  bearcat-mask-{64,128}.png  alpha-only mask derivatives, 1x and 2x
  wordmark-mask-{192,384}.png
  favicon-{32,64}.png        from icon.png
  apple-touch-icon.png       180x180, from icon_discord.png
  og-image.png               732x732, from icon_discord.png
```

**The marks are masks, not pictures.** `<Wordmark>` renders two empty elements painted in
the `fern` token; each one's shape is cut from the alpha channel of a mask derivative via
`mask-image` (`.brand-mark-*` in `src/index.css`). That is what lets the bearcat's
`#339966` and the wordmark's `#42B872` come out as one colour without editing either file,
and it keeps the logo's colour in the stylesheet with every other colour in the system.
The derivatives carry no colour at all — their RGB is flattened to white before encoding,
because `mask-image` reads only alpha.

To replace the branding: drop new PNGs into `brand-source/` under the same names, run
`npm run images`, and check the ink dimensions it prints against `BEARCAT_MARK` /
`WORDMARK_MARK` in `src/lib/images.ts` — those are what give each mark its `aspect-ratio`.
`icon_discord.png` is an app tile and stays one: it is the touch icon and the social card,
and its pale green must not enter the stylesheet.

## Conventions worth knowing before editing

**Colour.** Eight palette tokens plus one logo-only token, defined once in the `@theme`
block of `src/index.css`, and nothing else — no arbitrary hex, no default Tailwind
palette colours, no `#000000`.

| Token | Hex | Role |
| --- | --- | --- |
| `sky` | `#4A96D2` | hero sky |
| `horizon` | `#A8D0EB` | **currently unused** — the sky is a single flat field, not a gradient |
| `cloud` | `#F4F8FB` | page background below the fold — fresh-snow white |
| `frost` | `#DBE6F0` | dividers, muted surfaces, card fills — ice blue |
| `brick` | `#A2593A` | the single accent — links, buttons, hover |
| `stone` | `#B1C2D2` | tertiary / decorative only — glacier grey hairlines |
| `pine` | `#3C5C48` | body text, headings, focus rings, the button hover fill and the toggle's border/hover fill (never pure black) |
| `haze` | `#7C99B4` | **currently unused** — retired from text (2.78:1 on `cloud`, below AA) and not used as a scene colour either |
| `fern` | `#339966` | **logo only** — the two brand marks, and nothing else |

`brick` is the **only** accent; adding a second one is a design regression. `haze` is
retired from text use — it measures 2.78:1 on `cloud`, well below WCAG AA. Secondary text
uses `pine/90`.

`fern` is the brand green and is **not** an accent. It exists so the two logo marks —
which ship in two different greens, neither of them a palette colour — can be normalised
to one. It fills the marks and nothing else: no link, button, border, background or text.
It measures 3.34:1 on `cloud`, which a logotype is exempt from and a word is not.

Link hover is a per-surface rule, and it lives in one place. `LINK_ON_CLOUD` and
`LINK_ON_FROST` in `src/components/ExternalLink.tsx` are the only two **text-link**
treatments on the page: brick hover on `cloud` (4.89:1), underline hover on `frost`, because brick on
frost measures 4.12:1 and fails AA. Pick by the surface the link is painted on.

There is a third named treatment, and it is not for links: `TOGGLE_ON_CLOUD` in
`src/components/controls.ts` — the small outlined pill `<button>` (the header's menu
toggle, and two controls on the component sheet). Border `pine` on `cloud` at **6.98:1**,
clearing the 3:1 of WCAG 1.4.11, and a `pine` hover fill with the label flipping to
`cloud`. It replaces a `frost` border and `frost` hover fill that measured 1.19:1 — a
boundary and a hover state that could not be seen. `pine` rather than `brick`, because
`brick` still means "join the Discord" and nothing else. Three treatments, then: two for
links, one for the outlined button, and no fourth without a line here.

**Animation.** Only `transform` and `opacity` are ever animated — never `top`, `left`,
`width`, `height`, `margin` or `background-position`. Every animation is gated behind
`usePrefersReducedMotion()` from `src/lib/motion.ts`; under
`prefers-reduced-motion: reduce` the hero pan and the section reveals all render at
rest, and the hero's tall scroll track collapses so no dead scroll space is left
behind.

**Text over the photograph.** The hero carries the page's `<h1>` and its lede over the sky
of the photograph — under a pine gradient wash and a text-shadow confined to the top band
of the frame — and nothing else: no CTA, and nothing in the tab order (the section carries
`tabIndex={-1}` only so the logo link's `#top` target can take focus programmatically).
The photograph is the signature moment and is never used as a background behind body copy
or buttons; those live in the sections below, on cloud and frost.

## Layout

Six HTML entries sit at the repo root — `index.html`, `about.html`, `schedule.html`,
`sponsors.html`, `hackathons.html`, `components.html` — one per page, each pointing at a
client entry under `src/`.

```
src/
  main.tsx                   landing entry: hydrateRoot in prod, createRoot in dev
  entry-server.tsx           build-time SSR render of all six pages, read by
                             scripts/prerender.mjs
  App.tsx                    landing page composition
  index.css                  Tailwind theme: colour tokens, type scale, @font-face
  landing.css                index.css plus `@source not` lines; the stylesheet root for
                             the landing page, About us and Sponsors
  lib/
    links.ts                 every URL — off-site and in-site — centralised
    motion.ts                usePrefersReducedMotion, the hero pan's easing + range helpers
    images.ts                <picture> source sets + brand mark geometry
  components/
    Hero.tsx                 sticky stage + scroll-driven settle of the hero photo
    SectionPhoto.tsx         a section photograph with feathered edges
    Reveal.tsx               whileInView reveals (enter-once, staggered)
    Layout.tsx               Container / Section / Eyebrow / SectionHeader
    SiteHeader.tsx           fixed header, collapses to a menu below `md` (768px)
    SiteFooter.tsx           all eight site pages, contact, socials
    SnowdriftDivider.tsx     inline SVG snowdrift dividers
    ButtonLink.tsx           the site's one button treatment
    ExternalLink.tsx         same-site vs new-tab routing + the two text-link treatments
    controls.ts              TOGGLE_ON_CLOUD — the outlined pill button
    Wordmark.tsx             the logo lockup, as masked fern marks
    sections/                About, GetInvolved, Questions, Contact (landing)
      schedule/              Intro, WorkshopDetails, Calendar, StayUpdated
      hackathons/            HackathonIntro, Registration
  about/                     the About us page at /about
    main.tsx, AboutPage.tsx
  schedule/                  the schedule page at /schedule
    main.tsx, ScheduleApp.tsx, schedule.css
  sponsors/                  the sponsors page at /sponsors
    main.tsx, SponsorsPage.tsx
  hackathons/                the hackathons page at /hackathons
    main.tsx, HackathonsApp.tsx, hackathons.css
  sheet/                     the component sheet at /components — see above
    main.tsx                 sheet entry: hydrateRoot in prod, createRoot in dev
    sheet.css, kit.tsx, ComponentSheet.tsx
    parts/                   Tokens, Primitives, Composed, Hero
hackbuimage/                 the four delivered photographs — read-only source (see
                             "Swapping the artwork")
scripts/
  generate-images.mjs        photo derivatives + brand masks and app icons
  prerender.mjs              build-time prerender of all six pages, run after `vite build`
public/
  artwork/                   photos/ (hero + section photographs and their derivatives),
                             plus the About us and Sponsors photographs
  brand/                     logo masks, favicons, app tile
  404.html                   the static 404 body (see "The pages, and how they are
                             routed" above)
```

Every page's client entry follows the same three-part shape: check `#root` by name rather
than asserting it, build the tree once, then `hydrateRoot` in production and `createRoot`
under `import.meta.env.DEV` (the dev server serves the source HTML, whose root div is
empty, and hydrating an empty root is itself a mismatch). The page-root component — `App`,
`AboutPage`, `ScheduleApp`, `SponsorsPage`, `HackathonsApp`, `ComponentSheet` — carries its
own `<LazyMotion features={domAnimation} strict>` **inside** the component, so the client
tree and the `src/entry-server.tsx` tree are the same tree.
