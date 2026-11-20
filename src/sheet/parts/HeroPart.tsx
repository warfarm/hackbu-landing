import { Block, Caption, Entry, Rows, Rule, SheetSection } from '../kit'
import { LINK_ON_CLOUD } from '../../components/ExternalLink'
import { SnowCanvas } from '../../three/SnowCanvas'

/**
 * Part 4 — the hero, documented rather than embedded.
 *
 * <Hero> is a 180dvh scroll track with a sticky stage pinned inside it. Dropped
 * into this page it would hijack almost two viewports of the sheet's own
 * scrolling to play an animation that is about the top of the landing page,
 * and the sticky stage would be pinned against the sheet's scroll position
 * rather than its own. So what is here instead is the snow scene it is made
 * of, at rest, plus the numbers that drive it.
 *
 * The numbers below are mirrored from src/components/Hero.tsx, which keeps
 * them as module-private constants — there is nothing exported to import. They
 * are the one thing on this sheet that can drift; check them against that file
 * if the hero changes.
 */

/* -------------------------------------------------------------------------- */

type Param = { name: string; value: string; note: string }

const PAN_PARAMS: readonly Param[] = [
  {
    name: 'camera',
    value: 'start → end',
    note: 'In src/three/snowScene.ts (the frame function). The camera starts close over the logo and pulls back and lower as the eased scroll progress runs; its distance is fitted so the logo spans the band between the header and the lockup, and the pitch is solved each frame.',
  },
  {
    name: 'PAN_SCROLL_FRACTION',
    value: '0.75',
    note: 'The camera move completes three-quarters of the way through the pinned scroll (60dvh of it). The last 0.25 (20dvh) is a hold on the finished frame before the stage unpins.',
  },
  {
    name: 'TRACK_HEIGHT',
    value: 'h-[180dvh]',
    note: 'The track exists only to buy scroll distance. The stage inside it is one viewport tall and sticky, so it stays pinned for 80dvh.',
  },
  {
    name: 'HERO_PAN_EASE',
    value: 'cubicBezier(0.4, 0, 0.35, 1)',
    note: 'Eases in and out only gently — the user’s own scrolling supplies the timing, and anything steeper reads as the image lagging behind the finger. Exported from src/lib/motion.ts.',
  },
]

/* -------------------------------------------------------------------------- */

export function HeroPart() {
  return (
    <SheetSection
      id="hero"
      number="4"
      title="The hero"
      intro="The one component on this sheet that is not rendered live. It is a 180dvh scroll track with a sticky stage inside it: embedded here it would take almost two viewports of the sheet’s scrolling and pin itself against the wrong scroll position. What follows is its snow scene at rest and the numbers that drive it."
    >
      <Entry
        name="Hero"
        path="src/components/Hero.tsx"
        use="The top of the landing page, and nothing else: the HackBU logo buried in snow, which the pointer brushes away, with the “HackBU 2027” lockup — the page’s <h1>, dates, venue, countdown and Register — on the page’s frost ground across the bottom, rising in once the scene’s intro is over."
      >
        <Block title="See it live">
          <p className="text-body text-ink">
                        <a href="/" className={`${LINK_ON_CLOUD} underline underline-offset-4`}>
              Open the landing page
            </a>{' '}
            move the pointer over the snow to uncover the logo, then scroll: the
            camera pulls back over the first 60dvh.
          </p>
        </Block>

        <Block title="Layer contract">
          <Rows
            rows={[
              {
                name: '<section data-hero>',
                value: 'the scroll track',
                note: 'Taller than the viewport purely to buy scroll distance. No overflow-hidden — an overflow-clipped ancestor would become the sticky element’s scrollport and the stage would never pin.',
              },
              {
                name: '<div data-hero-stage>',
                value: 'sticky top-0, h-dvh',
                note: 'Exactly one viewport tall. Its CSS gradient of haze, horizon and frost gives the banner its colour before any script runs, and keeps it without WebGL.',
              },
              {
                name: '<SnowCanvas variant="hero">',
                value: 'the scene',
                note: 'The WebGL scene: terrain, sky, the logo slab and the snow over it, mist, and survey marks, lit by a low sun and the sky, with bloom and a film finish. It is told where the header ends and the lockup begins, and frames the logo between them. three.js loads on demand, in the browser only.',
              },
            ]}
          />
        </Block>

        <Block title="The hero scene, at rest">
          <div className="border-ink/20 from-haze/60 via-horizon/40 to-frost overflow-hidden border bg-gradient-to-b">
            <SnowCanvas variant="hero" atRest className="aspect-[16/9] w-full" />
          </div>
          <Caption>
            src/three/snowScene.ts, the <b>hero</b> variant, drawn live at the
            frame the camera move ends on. Everything in it is built in code
            from the palette tokens, apart from the two logo masks it borrows
            from public/brand/.
          </Caption>
        </Block>

        <Block title="Camera-move parameters">
          <Rows rows={PAN_PARAMS} />
          <Caption>
            These are module-private constants — the camera’s in
            src/three/snowScene.ts, the scroll track’s in
            src/components/Hero.tsx — not props: <b>&lt;Hero&gt;</b> takes
            none. Nothing configures the hero from outside.
          </Caption>
        </Block>

        <Block title="Reduced motion">
          <Rule>
            Under <b>prefers-reduced-motion</b> the camera is pinned to its end
            state and one still frame is drawn, with no falling snow — <b>and
            the track collapses
            from 180dvh to h-dvh</b>. Freezing the animation alone would strand
            the reader in most of a viewport of dead scroll space: a component
            that buys scroll distance has to give it back.
          </Rule>
        </Block>
      </Entry>

      <Entry
        name="usePrefersReducedMotion · HERO_PAN_EASE · rangeProgress"
        path="src/lib/motion.ts"
        use="The project’s motion conventions: what reduced motion means, and the easing and range helpers the hero pan is built from."
      >
        <Block title="API">
          <Rows
            rows={[
              {
                name: 'usePrefersReducedMotion()',
                value: 'boolean',
                note: 'motion’s useReducedMotion() normalised from boolean | null. Every animating component in the project calls this one and renders its resting frame when it is true.',
              },
              {
                name: 'HERO_PAN_EASE',
                value: 'cubicBezier(0.4, 0, 0.35, 1)',
                note: 'The pan’s curve.',
              },
              {
                name: 'rangeProgress(v, from, to)',
                value: 'number',
                note: 'Progress through a sub-window of a 0..1 value, clamped. How the pan carves its own range out of the one scroll value.',
              },
            ]}
          />
        </Block>
        <Block title="Notes">
          <Caption>
            There is exactly one scroll subscription in the project and it is
            motion’s, in <b>Hero.tsx</b> — no hand-rolled scroll listener
            anywhere in src/. motion reads the reduced-motion query once at
            mount and does not re-subscribe, so a mid-session change to the OS
            setting takes effect on the next page load.
          </Caption>
        </Block>
      </Entry>
    </SheetSection>
  )
}
