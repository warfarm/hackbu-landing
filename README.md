# HackBU landing page

A redesigned site for [HackBU](https://hackbu.org), the student tech club at Binghamton
University. The home page is the landing page for **HackBU 2027**, the club's hackathon —
Saturday January 30 to Sunday January 31, 2027, in the University Union — and it has one
job: get students, most of them with no hackathon experience, to register. The club itself
(weekly workshops, the calendar, the organizers) lives on About us.

The landing page runs, top to bottom (see the doc comment in `src/App.tsx`):

1. **Banner** — the hero snow scene with the "HackBU 2027" lockup: the page's heading, the
   dates, the venue, a countdown and a Register link (`Hero.tsx`).
2. **Sponsors** — 2027 sponsors are not confirmed yet, so it says "Coming soon" and points
   companies at the Sponsors page (`SponsorsPreviewSection.tsx`).
3. **Prize tracks** — last year's five tracks as a wall of 3D ice blocks laid in igloo courses,
   each track's icon, number and name etched into its face (`src/three/iceWall.ts`);
   choosing a block slides it forward, lit from inside, and shows the track in full beside the
   wall (`PrizeTracksSection.tsx`). The blocks' buttons stay the controls; without WebGL they
   are CSS ice instead.
4. **Registration** — the main Register button, and a link to My Application for people
   who have already applied (`RegisterSection.tsx`).
5. **FAQ** — hackathon questions as disclosures, beside an embedded Google Map of the
   University Union with a "Get directions" link (`QuestionsSection.tsx`).

Then the footer. Snowdrift dividers separate the sections.

The site's look follows [igloo.inc](https://www.igloo.inc/): a monochrome ice world, one
glow colour, monospaced instrument-panel type, and a 3D scene that responds to scrolling.
No asset or code comes from it. The hero (`src/three/`) is the HackBU logo — the same
masks the header paints — lying under snow on a hillside. Moving a mouse anywhere over the
snow brushes it away to ice — mottled, fractured, darkening in a halo around each letter — and
the lettering glows through in `fern`. Above the logo the eyebrow line, and below it the
dates, venue and countdown, are pressed into the snow; they clear with it and come back as it
refills, and the facts are engraved in the ice beneath too, glowing a pale ice-blue, so
brushing the snow off them uncovers them again. Cleared snow
slumps soft at the edges first, then drifts back unevenly, half filled after about five
seconds. The brush mask lives on the GPU in float targets (32-bit where the GPU supports
it, so the refill runs every frame), which is what keeps both smooth. Touch
screens see the scene but cannot brush: a drag scrolls the page. The snow is one displaced sheet whose height and normals come from
the brush mask, a drift texture and the logo itself, lit by a low raking sun and the sky
(an environment map made from the sky shader), with snow glints, ground mist, bloom and a
film finish. On load the scene washes in from the page ground while the camera settles from
high above (about three seconds; phones and degraded quality tiers, which skip
post-processing, get the settle without the wash); scrolling pulls it back toward the skyline, and in the
last stretch a frost sheet with a diagonal "ice cut" edge rises over it, as igloo.inc cuts
between scenes. A "Scroll down to discover" hint leaves on the first scroll, and on wide
screens the facts panel beside the headline grows (up to 1.3x, as room allows) on its own
solid frost. Below the hero,
each section's giant blurred name and each divider's survey marks are scrubbed by the scroll
(CSS scroll-driven animations, so they reverse on the way back up). None of this runs under
reduced motion. Across the bottom, on a frost scrim, is the
"HackBU 2027" lockup: eyebrow, headline, dates, venue, a days-to-go count and Register. The
registration section carries a block of ice with an igloo frozen inside it (`igloo`; `pine` is
only on the component sheet now), turning as it scrolls past, set into the page with feathered edges
(`SnowCanvas.tsx` and `.scene-feather` in `src/index.css`). Every page shares the same ice
ground, HUD panels, bracketed buttons and decoding headings.

Everything in the scenes is built in code from the palette tokens. The only files fetched
are the two logo masks in `public/brand/`, the same ones the header paints; the grain, ice
and digit textures are generated at runtime. three.js is its own chunk (`three`, about 142 KB gzipped),
requested in the browser after hydration, the first time a scene nears the viewport, and
never during the prerender. It is therefore off every page's critical path, but it is not
free: on the landing page and on Hackathons a scene is in the first viewport, so the chunk
is fetched straight after load. Without WebGL2 the hero is its CSS sky and the section
scenes are removed from the layout.

(Until 2026-11 the hero was an aerial photograph of the campus, and the two sections
carried campus photographs too. Those four, their delivered originals (`hackbuimage/`)
and an unused cartoon of the campus clock tower (`public/artwork/landmarks/`) are deleted;
git history has them. The photographs that remain, on About us and Sponsors, are of people
at HackBU events, not of places.)

Six public pages live here now: the landing page plus **About us**, **Sponsors**,
**Hackathons**, **Registration** and **My Application**, each a separate HTML entry with
its own bundle (see "The pages, and how they are routed" below). The Schedule and Organizers
pages were folded into About us. The blog, photos and resources pages stay on `hackbu.org`
and are linked from the header and footer. Hackathon registration is its own page,
`/register`, backed by a Google Sheet — see `google-apps-script/README.md` for how to
connect it; `/application` is the applicant portal on the same backend.

## Stack

- **Vite** + **React** + **TypeScript**
- **Tailwind CSS v4** via the `@tailwindcss/vite` plugin (theme lives in `src/index.css`,
  not a JS config)
- **`motion`** (Framer Motion) for the animations React drives — the hero's scroll work goes
  through `useScroll` / `useTransform`, the section reveals through `whileInView`. Two
  decorative drifts (section ghost words, divider marks) are CSS scroll-driven animations
  instead, and the intro rises are CSS keyframes (see Animation below). There are no
  `scroll` event listeners.
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
| `npm run build` | Lints, type-checks (`tsc -b`), builds to `dist/`, then prerenders all seven pages into it |
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
becomes a rule in the shipped stylesheet. None of the five HTML entries carries a `class`
attribute; if one ever does, it needs an explicit `@source` line.

There are **two stylesheet roots**, and every page reaches `src/index.css` through one of
them: `src/landing.css` (landing page, About us, Sponsors) and
`src/hackathons/hackathons.css` — each `src/index.css` plus `@source not` lines — and the
component sheet, which imports `src/index.css` directly. That is what gives every page
exactly **one** `<link rel="stylesheet">`, `@font-face` rules included: a CSS-level
`@import` is inlined before Vite sees a module, so no stylesheet becomes a shared JS
dependency and no second, render-blocking link is emitted. The two page roots currently
produce byte-identical CSS, so Vite deduplicates them into one hashed file that all four
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

There is no `Content-Security-Policy` or `X-Frame-Options` header, and two pages depend on
that: the landing page's FAQ embeds a Google Map of the University Union and About us embeds
the Google Calendar. If a CSP is ever added, it needs `frame-src https://www.google.com
https://calendar.google.com`.

### When the custom domain lands

**Nothing in this repo needs editing.** The only places the site's own origin appears are
`index.html`'s `og:url` and `og:image` and the `og:image` on the three other public pages,
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

The build has **five** entry points, declared in `vite.config.ts`:

| Entry | Page | Client entry | Prerendered by |
| --- | --- | --- | --- |
| `index.html` | the landing page | `src/main.tsx` | `renderIndex()` |
| `about.html` | About us — the club, the weekly workshops + event calendar, and the organizer rosters | `src/about/main.tsx` | `renderAbout()` |
| `sponsors.html` | sponsorship | `src/sponsors/main.tsx` | `renderSponsors()` |
| `hackathons.html` | the annual hackathon — what it is, then the weekend timeline at `#timeline` (tentative: past years' times until the 2027 schedule is out) | `src/hackathons/main.tsx` | `renderHackathons()` |
| `components.html` | an internal component sheet — every token, every primitive with its variants, and the composed sections rendered live | `src/sheet/main.tsx` | `renderComponents()` |

All five are prerendered: `npm run build` ends with `node scripts/prerender.mjs`, which
renders one export from `src/entry-server.tsx` per page and writes the markup into that
page's `<div id="root">`; the client then **hydrates** it rather than rebuilding it. Adding
a page means three edits together — a `rollupOptions.input` entry, a `render*` export, and a
`PAGES` row — or it ships with an empty root div.

They share the component tree, so Rollup hoists what they all import into one `shared` chunk
(plus `vendor` for `node_modules`, and `three` — three.js alone, loaded on demand by the
snow scenes) and each page's own entry chunk carries only its own code;
nothing under `src/sheet/` reaches any other page's bundle, and the per-page section
directory (`src/components/sections/hackathons/`) is deliberately kept out of `shared` so
only its own page downloads it. The sheet's Tailwind utilities are kept out of the public
pages' stylesheet by `src/landing.css` and its sibling root.

Routing the six clean URLs needs the **twelve** rewrites in `vercel.json` — one per page,
with and without a trailing slash. Beside them sits a `redirects` block: `/schedule` and
`/organizers` (with and without a trailing slash) 308 to `/about`, because those pages'
content now lives there. There is no catch-all. Every row below is what that file now does:

| Request | Served by |
| --- | --- |
| `/` | the filesystem — `dist/index.html` as the directory index. No rewrite involved. |
| `/about`, `/about/` | two exact-match rewrites in `vercel.json`, both pointing at `/about.html` |
| `/sponsors`, `/sponsors/` | the same, at `/sponsors.html` |
| `/hackathons`, `/hackathons/` | the same, at `/hackathons.html` |
| `/register`, `/register/` | the same, at `/register.html` |
| `/application`, `/application/` | the same, at `/application.html` |
| `/components`, `/components/` | the same, at `/components.html` |
| `/schedule`, `/schedule/`, `/organizers`, `/organizers/` | a permanent redirect (308) to `/about` — the retired pages' content lives there now |
| `/about.html` and the other five `.html` paths | the filesystem — Vercel gives a real file precedence over `rewrites`. Each page therefore has a second URL; harmless for the sheet, which is `noindex, nofollow`. |
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
the `cleanHtmlUrls` plugin in `vite.config.ts`, which carries the same twelve paths as
`vercel.json`'s rewrites; `npm run preview` serves `dist/` and wants the `.html` suffix.

The sheet is `noindex, nofollow` and is not linked from any public page.

## Swapping the artwork

The landing page ships no artwork of its own: its hero and section décor are drawn by
`src/three/snowScene.ts`. To change them, edit that file — the camera path is
the hero's `frame`, the land is `terrainHeight`, the logo bed is `BED` and `BED_TILT`,
and each part (terrain, sky, logo slab, snow cover, brush, mist, survey marks, ice, falling
snow) is one `build*` function. Colours come in through
the `--snow-*` properties on `.snow-scene` in `src/index.css`, which map to the `@theme`
tokens; do not write a hex in the scene.

Photographs are still used on About us and Sponsors, and live in `public/artwork/`:

```
public/artwork/
  about/        the About us carousel
  sponsors/     the Sponsors page photograph
  organizers/   headshots and the team photo
  mascot/       Baxter the Bearcat (not on any page at the moment)
artwork/        read-only originals of the retired illustration and cloud cutouts
```

To replace one, drop the new JPEG over the old one, run `npm run images` to regenerate
its AVIF and WebP, update its dimensions and `alt` in `src/lib/images.ts`, and commit the
derivatives with the source.

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

**Colour.** Nine palette tokens plus one logo-only token, defined once in the `@theme`
block of `src/index.css`, and nothing else — no arbitrary hex, no default Tailwind
palette colours, no `#000000`.

| Token | Hex | Role |
| --- | --- | --- |
| `sky` | `#4A96D2` | 3D scenes only — the blue in the shadows |
| `horizon` | `#A8D0EB` | the accent — Register, the block behind the hero's year, divider wedges, hovers, and the ice blocks' glow |
| `cloud` | `#F7F5EE` | 3D scenes only — snowflakes, sunlight, survey lines |
| `frost` | `#DCE3EA` | the page ground, the header, panels (at 74%), the hero scrim, labels on ink |
| `brick` | `#A2593A` | retired from the interface; only the bark of the frozen pine |
| `stone` | `#C4B79E` | retired; hairlines are `ink` at 20–25% |
| `ink` | `#295374` | the accent blue made dark enough to read: all text, hairlines, focus rings, solid buttons (6.28:1 on `frost`) |
| `pine` | `#3C5C48` | retired; the old green ink |
| `haze` | `#7C99B4` | scene colour only — igloo blocks, scoured ground, distance haze, the out-of-focus section words; never text |
| `fern` | `#339966` | **logo only** — the two brand marks, and the glow of the logo in the hero's snow |

`horizon` is the **only** accent; adding a second one is a design regression, and so is a
new token or shade for a state (a hover is drawn with the existing colours). `horizon` is a
fill, never text: it measures about 1.3:1 on `frost`. Tints are tokens at reduced strength.
`haze` never carries text. Secondary text is full `ink`: tints fall under AA on the
tinted ground. The one exception is form placeholders, `ink/90` on solid `frost` (5.04:1).

`fern` is the brand green and is **not** an accent. It exists so the two logo marks —
which ship in two different greens, neither of them a palette colour — can be normalised
to one. It fills the marks and nothing else: no link, button, border, background or text.
It measures 3.27:1 on `cloud`, which a logotype is exempt from and a word is not.

**Type.** One family, IBM Plex Mono (400, 500, 600), self-hosted. Because it is monospaced,
`DecodeHeadings` can scramble and resolve headings and labels in an `aria-hidden` overlay
that lines up with the real text, which is never changed. It runs once per page from
`SiteHeader`, after hydration, and never starts under reduced motion.

**Surfaces.** The ground is painted once, on a fixed layer (`body::before` in
`src/index.css`): `frost`, a faint `horizon` bloom and a dot grid. Sections have no
background of their own. Cards are `.hud-panel`; labels are `.hud-label`; every `Section`
puts its name, huge and out of focus, behind its content (`.ghost-type`). All sized radii
are zero in `@theme`.

**Links and buttons.** `LINK_ON_CLOUD` and `LINK_ON_FROST` both hover to an underline.
`TOGGLE_ON_CLOUD` is the outlined control. `ButtonLink` has three tones, all in square
brackets (`.hud-btn`): `ink` (solid, turning `horizon`), `register` (`horizon` with a
`ink` label and edge, for Register alone) and `outline` (Discord in the header).

**Animation.** Only `transform` and `opacity` are ever animated — never `top`, `left`,
`width`, `height`, `margin` or `background-position`. Animation driven from React is gated
behind `usePrefersReducedMotion()` from `src/lib/motion.ts`; animation that lives in CSS
(the intro rises, the hint's bob, and the scroll-driven `ghost-drift` / `mark-drift` in
`src/index.css`) is gated by the `prefers-reduced-motion` media query instead, because the
hook cannot answer before hydration and these run from the first paint. Under
`prefers-reduced-motion: reduce` the hero's camera move, the snow scenes and the section
reveals all render at
rest, and the hero's tall scroll track collapses so no dead scroll space is left
behind.

**Text over the hero scene.** The lockup and the facts beside it sit on the `hero-scrim`,
which is solid `frost` behind the type, so `ink` text keeps 6.28:1 whatever the scene is doing
and whether or not WebGL loaded. The reference site sets
pale text straight over its scene; this one deliberately does not.

## Layout

Five HTML entries sit at the repo root — `index.html`, `about.html`, `sponsors.html`,
`hackathons.html`, `components.html` — one per page, each pointing at a client entry under
`src/`.

```
src/
  main.tsx                   landing entry: hydrateRoot in prod, createRoot in dev
  entry-server.tsx           build-time SSR render of all seven pages, read by
                             scripts/prerender.mjs
  App.tsx                    landing page composition
  index.css                  Tailwind theme: colour tokens, type scale, @font-face
  landing.css                index.css plus `@source not` lines; the stylesheet root for
                             the landing page, About us and Sponsors
  lib/
    links.ts                 every URL — off-site and in-site — centralised, plus the
                             HackBU 2027 dates and venue the map URLs are built from
    motion.ts                usePrefersReducedMotion, the hero pan's easing + range helpers
    images.ts                <picture> source sets + brand mark geometry
  components/
    Hero.tsx                 sticky stage + scroll-driven camera move over the snow scene
    Reveal.tsx               whileInView reveals (enter-once, staggered)
    Layout.tsx               Container / Section / Eyebrow / SectionHeader
    SiteHeader.tsx           fixed header, collapses to a menu below `lg` (1024px)
    SiteFooter.tsx           the site pages in two columns, contact, socials
    SnowdriftDivider.tsx     the diagonal "ice cut" section dividers
    DecodeHeadings.tsx       the headings' scramble-to-text reveal
    ButtonLink.tsx           the link-buttons: ink, register (horizon) and outline tones
    ExternalLink.tsx         same-site vs new-tab routing + the two text-link treatments
    controls.ts              TOGGLE_ON_CLOUD — the outlined button
    Wordmark.tsx             the logo lockup, as masked fern marks
    sections/                the landing page's sections: SponsorsPreview,
                             PrizeTracks, Register, Questions (the FAQ + venue map); About,
                             GetInvolved and Contact are no longer on the page but are
                             still rendered on the component sheet
      hackathons/            HackathonIntro, Timeline + timeline.ts (the schedule
                             data, each time with the source it came from)
  three/                     the 3D scenes
    SnowCanvas.tsx           the React frame: lazy-loads the scene, runs the frame loop
    snowScene.ts             the three.js scenes — the hero, and the two ice blocks
    IceWallCanvas.tsx        the prize wall's frame: lazy-loads the wall, keeps it on the buttons
    iceWall.ts               the prize wall's 3D ice blocks, each track etched into its face
    palette.ts               reads the --snow-* palette both frames hand to three.js
  about/                     the About us page at /about
    main.tsx, AboutPage.tsx, PhotoCarousel.tsx, OrganizersSection.tsx
  sponsors/                  the sponsors page at /sponsors
    main.tsx, SponsorsPage.tsx
  hackathons/                the hackathons page at /hackathons
    main.tsx, HackathonsApp.tsx, hackathons.css
  sheet/                     the component sheet at /components — see above
    main.tsx                 sheet entry: hydrateRoot in prod, createRoot in dev
    sheet.css, kit.tsx, ComponentSheet.tsx
    parts/                   Tokens, Primitives, Composed, Hero
scripts/
  generate-images.mjs        photo derivatives + brand masks and app icons
  prerender.mjs              build-time prerender of all seven pages, run after `vite build`
public/
  artwork/                   the About us, Sponsors and organizer photographs
  brand/                     logo masks, favicons, app tile
  404.html                   the static 404 body (see "The pages, and how they are
                             routed" above)
```

Every page's client entry follows the same three-part shape: check `#root` by name rather
than asserting it, build the tree once, then `hydrateRoot` in production and `createRoot`
under `import.meta.env.DEV` (the dev server serves the source HTML, whose root div is
empty, and hydrating an empty root is itself a mismatch). The page-root component — `App`,
`AboutPage`, `SponsorsPage`, `HackathonsApp`, `ComponentSheet` — carries its
own `<LazyMotion features={domAnimation} strict>` **inside** the component, so the client
tree and the `src/entry-server.tsx` tree are the same tree.
