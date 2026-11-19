import { Eyebrow, Section } from '../../Layout'
import { Reveal } from '../../Reveal'
import { SnowCanvas } from '../../../three/SnowCanvas'

/**
 * The Hackathons page's opening: the page <h1> and two paragraphs, held to
 * the left half of the column from `md` up, with the `igloo` scene
 * (src/three/) as a bleed down the window's right edge — the same shape as
 * the landing page's sections (`.scene-bleed`, src/index.css). The right half
 * was empty before the snow-theme mockup; below `md` the scene is a 3:2 block
 * in flow under the copy, so the heading still comes first.
 */
export function HackathonIntroSection() {
  return (
    <Section
      id="hackathons-intro"
      labelledBy="hackathons-intro-title"
      className="overflow-x-clip"
    >
      <div className="relative flex flex-col">
        <Reveal className="relative z-10 md:max-w-[50%]">
          <div className="max-w-3xl">
            <Eyebrow>Hackathons</Eyebrow>
            <h1
              id="hackathons-intro-title"
              className="font-display text-display-xl text-ink mt-5 font-semibold text-balance"
            >
              Our annual hackathon
            </h1>
            <p className="text-lede text-ink mt-6 max-w-2xl">
              Hackathons are events where teams build a program or hardware
              project in a short window of time. Most last 24 to 48 hours and
              are full of caffeine, food, prizes, and little sleep.
            </p>
            <p className="text-body text-ink mt-5 max-w-2xl">
              Once a year we run our own: a weekend where teams build something
              that did not exist on Friday. It is the same club as our weekly
              workshops, just packed into one weekend.
            </p>
          </div>
        </Reveal>

        <Reveal className="scene-bleed mt-10 md:mt-0" delay={0.05}>
          <SnowCanvas
            variant="igloo"
            callouts={{ title: ["Hackathons","Annual"], reading: ["About 24 hours","Build something"] }}
            className="scene-feather aspect-[3/2] w-full md:aspect-auto md:h-full"
          />
        </Reveal>
      </div>
    </Section>
  )
}
