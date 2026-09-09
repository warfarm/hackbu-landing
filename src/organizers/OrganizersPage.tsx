import { domAnimation, LazyMotion } from 'motion/react'
import { SiteHeader } from '../components/SiteHeader'
import { SiteFooter } from '../components/SiteFooter'
import { SnowdriftDivider } from '../components/SnowdriftDivider'
import { Eyebrow, Section, SectionHeader } from '../components/Layout'
import { Reveal, RevealGroup, RevealItem } from '../components/Reveal'
import { MailLink, LINK_ON_FROST } from '../components/ExternalLink'
import { ORGANIZERS_PATH } from '../lib/links'
import {
  ORGANIZER_PHOTOS,
  ORGANIZERS_TEAM_PHOTO,
  type OrganizerPhoto as OrganizerPhotoData,
} from '../lib/images'

const EMAIL_ON_FROST = `${LINK_ON_FROST} underline underline-offset-4`

/** Portrait frame on cloud — frost fill reads as the empty slot. */
const PHOTO_ON_CLOUD =
  'aspect-[4/5] w-full border-frost bg-frost border'

/**
 * Portrait frame on frost — cloud fill + stone edge so the slot stays visible
 * (frost-on-frost is 1:1; same rule as the get-involved card).
 */
const PHOTO_ON_FROST =
  'aspect-[4/5] w-full border-stone/60 bg-cloud border'

const SENIOR_ORGANIZERS: {
  role: string
  name: string
  /** Omit until known — no mailto is rendered without an address. */
  email?: string
  photo: keyof typeof ORGANIZER_PHOTOS
}[] = [
  {
    role: 'President',
    name: 'Matthew Ham',
    email: 'mham1@binghamton.edu',
    photo: 'matthew-ham',
  },
  {
    role: 'Vice President of Communications',
    name: 'Samuel Yu',
    email: 'syu12@binghamton.edu',
    photo: 'samuel-yu',
  },
  {
    role: 'Vice President of Outreach',
    name: 'Carinna Lee',
    photo: 'carinna-lee',
  },
  {
    role: 'Vice President of Software',
    name: 'Daniel Zheng',
    email: 'dzheng19@binghamton.edu',
    photo: 'daniel-zheng',
  },
  {
    role: 'Vice President of Logistics',
    name: 'Gianni Zaccarelli',
    photo: 'gianni-zaccarelli',
  },
  {
    role: 'Vice President of Event Planning',
    name: 'Joseph Costa',
    photo: 'joseph-costa',
  },
]

const ORGANIZERS = [
  { name: 'Tianna Balkam', photo: 'tianna-balkam' },
  { name: 'Zak Sujkovic', photo: 'zak-sujkovic' },
  { name: 'Hewitt Wang', photo: 'hewitt-wang' },
  { name: 'Rijaa Zaidi', photo: 'rijaa-zaidi' },
  { name: 'Raymond Chen', photo: 'raymond-chen' },
] as const

/**
 * Organizers — who runs workshops and the annual hackathon.
 *
 * One `<LazyMotion features={domAnimation} strict>` around the whole tree, for
 * the reason written out in `src/App.tsx`: the `<Reveal>`s render `m.*`, which
 * need a provider, and the wrapper sits inside this component so
 * `renderOrganizers()` in `src/entry-server.tsx` renders the same tree the
 * client hydrates.
 */
export function OrganizersPage() {
  return (
    <LazyMotion features={domAnimation} strict>
      <div className="bg-cloud font-sans text-pine min-h-screen">
        <a
          href="#main"
          className="bg-cloud text-pine focus:outline-pine sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:rounded-full focus:px-4 focus:py-2 focus:outline-2"
        >
          Skip to content
        </a>

        <SiteHeader homeHref="/" currentHref={ORGANIZERS_PATH} />

        <main id="main" className="pt-16 sm:pt-20">
          <Section
            id="organizers-intro"
            labelledBy="organizers-intro-title"
            className="bg-cloud"
          >
            <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(16rem,28rem)] lg:grid-cols-[minmax(0,1fr)_32rem] lg:gap-14">
              <Reveal>
                <div>
                  <Eyebrow>Organizers</Eyebrow>
                  <h1
                    id="organizers-intro-title"
                    className="font-display text-display-xl text-pine mt-5 font-semibold text-balance"
                  >
                    The people behind HackBU.
                  </h1>
                  <p className="text-lede text-pine mt-6 max-w-xl">
                    Organizers help out at workshops and run the hackathon. Reach
                    out if you want to get involved — we’re a small student team
                    and glad to hear from you.
                  </p>
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <figure className="border-frost mx-auto aspect-[4/3] w-full max-w-lg overflow-hidden rounded-2xl border md:max-w-none">
                  <picture>
                    <source
                      type="image/avif"
                      srcSet={ORGANIZERS_TEAM_PHOTO.avif}
                    />
                    <source
                      type="image/webp"
                      srcSet={ORGANIZERS_TEAM_PHOTO.webp}
                    />
                    <img
                      src={ORGANIZERS_TEAM_PHOTO.jpg}
                      alt={ORGANIZERS_TEAM_PHOTO.alt}
                      width={ORGANIZERS_TEAM_PHOTO.width}
                      height={ORGANIZERS_TEAM_PHOTO.height}
                      decoding="async"
                      className="h-full w-full object-cover object-center"
                    />
                  </picture>
                </figure>
              </Reveal>
            </div>
          </Section>

          <SnowdriftDivider variant="cloud-to-frost" />

          <Section
            id="senior-organizers"
            labelledBy="senior-organizers-title"
            className="bg-frost"
          >
            <Reveal>
              <SectionHeader
                eyebrow="Leadership"
                titleId="senior-organizers-title"
                title="Senior organizers."
              />
            </Reveal>

            <RevealGroup
              as="ul"
              className="mt-10 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3"
            >
              {SENIOR_ORGANIZERS.map((person) => (
                <RevealItem as="li" key={person.name}>
                  <OrganizerPhoto
                    photo={ORGANIZER_PHOTOS[person.photo]}
                    className={PHOTO_ON_FROST}
                  />
                  <Eyebrow className="mt-4">{person.role}</Eyebrow>
                  <p className="font-display text-display-md text-pine mt-2 font-semibold">
                    {person.name}
                  </p>
                  {person.email ? (
                    <MailLink
                      email={person.email}
                      className={`${EMAIL_ON_FROST} text-caption mt-2 inline-block`}
                    />
                  ) : null}
                </RevealItem>
              ))}
            </RevealGroup>
          </Section>

          <SnowdriftDivider variant="frost-to-cloud" />

          <Section
            id="organizers"
            labelledBy="organizers-title"
            className="bg-cloud relative overflow-hidden"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_85%_20%,color-mix(in_srgb,var(--color-horizon)_55%,transparent),transparent_55%),radial-gradient(ellipse_at_10%_90%,color-mix(in_srgb,var(--color-frost)_70%,transparent),transparent_50%)]"
            />
            <div className="relative">
              <Reveal>
                <SectionHeader
                  eyebrow="The team"
                  titleId="organizers-title"
                  title="Organizers."
                />
              </Reveal>

              <RevealGroup
                as="ul"
                className="mt-10 grid gap-x-5 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
              >
                {ORGANIZERS.map((person) => (
                  <RevealItem as="li" key={person.name}>
                    <OrganizerPhoto
                      photo={ORGANIZER_PHOTOS[person.photo]}
                      className={PHOTO_ON_CLOUD}
                      lazy
                    />
                    <p className="font-display text-display-md text-pine mt-4 font-semibold">
                      {person.name}
                    </p>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
          </Section>
        </main>

        <SnowdriftDivider variant="cloud-to-frost" />
        <SiteFooter />
      </div>
    </LazyMotion>
  )
}

/**
 * Portrait slot matching About / Sponsors figure treatment. When `ready` is
 * false, the fill is the placeholder — no broken `<img>` requests. Border and
 * fill come from `className` so the slot stays visible on both cloud and frost.
 */
function OrganizerPhoto({
  photo,
  lazy = false,
  className = '',
}: {
  photo: OrganizerPhotoData
  lazy?: boolean
  className?: string
}) {
  return (
    <figure className={`overflow-hidden rounded-2xl ${className}`}>
      {photo.ready ? (
        <picture>
          <source type="image/avif" srcSet={photo.avif} />
          <source type="image/webp" srcSet={photo.webp} />
          <img
            src={photo.jpg}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            decoding="async"
            loading={lazy ? 'lazy' : undefined}
            className="h-full w-full object-cover"
          />
        </picture>
      ) : (
        <span className="sr-only">Photo coming soon</span>
      )}
    </figure>
  )
}
