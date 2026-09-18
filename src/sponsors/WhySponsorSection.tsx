import { Eyebrow, Section } from '../components/Layout'
import { Reveal, RevealGroup, RevealItem } from '../components/Reveal'
import { SPONSORS_PHOTO } from '../lib/images'

const PHOTO =
  'mx-auto aspect-[4/3] w-full max-w-lg md:max-w-none md:aspect-[3/4] lg:aspect-[4/5] overflow-hidden rounded-2xl border border-frost'

const PILLARS = [
  {
    kicker: 'Recruitment & Talent',
    title: 'Hire skilled builders',
    description:
      'Connect directly with motivated computer science, engineering, and design students at Binghamton University. Access our resume database, host on-site interviews, and see candidates collaborate and solve real problems.',
  },
  {
    kicker: 'Developer Adoption',
    title: 'Put your technology in hackers’ hands',
    description:
      'Have students build projects on top of your API, SDK, platform, or hardware. Present a tech demo at opening ceremony, mentor students during hacking, and see what they create in 24 hours.',
  },
  {
    kicker: 'Campus Brand Visibility',
    title: 'Grow your presence at Binghamton',
    description:
      'Make a lasting impression through your company booth, custom branded prize categories, event t-shirts, and campus banners, while supporting inclusive tech education and workshops.',
  },
] as const

export function WhySponsorSection() {
  return (
    <Section
      id="why-sponsor"
      labelledBy="why-sponsor-title"
      className="bg-cloud"
    >
      <div className="grid items-start gap-10 md:grid-cols-[minmax(0,1fr)_22rem] lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-14">
        <Reveal>
          <div className="max-w-2xl">
            <Eyebrow>Why sponsor HackBU</Eyebrow>
            <h2
              id="why-sponsor-title"
              className="font-display text-display-lg text-pine mt-4 font-semibold text-balance"
            >
              Partner with Binghamton’s student developers.
            </h2>
            <p className="text-lede text-pine mt-5">
              Sponsoring a hackathon is a powerful way to recruit, build your
              platform&apos;s reputation among young developers, or help get
              people building on top of your technology.
            </p>
            <p className="text-body text-pine mt-5">
              Want to support HackBU at Binghamton University? We&apos;re looking
              to help you hire, and to make our events as awesome as they can be.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <figure className={PHOTO}>
            <picture>
              <source type="image/avif" srcSet={SPONSORS_PHOTO.avif} />
              <source type="image/webp" srcSet={SPONSORS_PHOTO.webp} />
              <img
                src={SPONSORS_PHOTO.jpg}
                alt={SPONSORS_PHOTO.alt}
                width={SPONSORS_PHOTO.width}
                height={SPONSORS_PHOTO.height}
                decoding="async"
                className="h-full w-full object-cover"
              />
            </picture>
          </figure>
        </Reveal>
      </div>

      <RevealGroup className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {PILLARS.map((pillar) => (
          <RevealItem key={pillar.title}>
            <div className="border-frost bg-frost/40 h-full rounded-2xl border p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <Eyebrow>{pillar.kicker}</Eyebrow>
                <h3 className="font-display text-display-sm text-pine mt-3 font-semibold">
                  {pillar.title}
                </h3>
                <p className="text-body text-pine/90 mt-3 text-sm">
                  {pillar.description}
                </p>
              </div>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  )
}
