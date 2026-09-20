import { domAnimation, LazyMotion } from 'motion/react'
import { SiteHeader } from '../components/SiteHeader'
import { SiteFooter } from '../components/SiteFooter'
import { SnowdriftDivider } from '../components/SnowdriftDivider'
import { Eyebrow, Section, SectionHeader } from '../components/Layout'
import { Reveal, RevealGroup, RevealItem } from '../components/Reveal'
import { ExternalLink, LINK_ON_CLOUD } from '../components/ExternalLink'
import {
  ABOUT_PATH,
  GOOGLE_CALENDAR_EMBED_URL,
  GOOGLE_CALENDAR_URL,
  ICAL_URL,
} from '../lib/links'
import { ABOUT_WORKSHOP_PHOTOS, ORGANIZERS_TEAM_PHOTO } from '../lib/images'
import { PhotoCarousel } from './PhotoCarousel'
import { OrganizersSection } from './OrganizersSection'

/**
 * About us — who we are (with the organizers' group photo), the weekly
 * workshops together with the event calendar, and the organizer rosters at the
 * bottom. This page absorbed the retired Schedule and Organizers pages.
 *
 * The tree sits inside one `<LazyMotion features={domAnimation} strict>`, for
 * the reason written out in `src/App.tsx`: every `<Reveal>` below renders `m.*`
 * components, which carry no features of their own and take them from a
 * provider instead, and `strict` makes a stray `motion.*` throw rather than
 * quietly pulling motion's whole ~50 KB feature set back into the shared chunk.
 * The wrapper is *inside* this component and not around it in `main.tsx`, so
 * the client tree and `renderAbout()` in `src/entry-server.tsx` are the same
 * tree and hydration has nothing to disagree about.
 */

const INLINE_LINK = `${LINK_ON_CLOUD} underline underline-offset-4`

/* Display-sized calendar links on cloud, same treatment as ContactSection. */
const CALENDAR_LINK_CLASSES =
  'font-display text-display-md font-semibold underline underline-offset-8 ' +
  LINK_ON_CLOUD

export function AboutPage() {
  return (
    <LazyMotion features={domAnimation} strict>
      <div className="bg-cloud font-sans text-pine min-h-screen">
        <a
          href="#main"
          className="bg-cloud text-pine focus:outline-pine sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:rounded-full focus:px-4 focus:py-2 focus:outline-2"
        >
          Skip to content
        </a>

        <SiteHeader currentHref={ABOUT_PATH} />

        <main id="main" className="pt-16 sm:pt-20">
          <Section id="about" labelledBy="about-page-title" className="bg-cloud">
            <div className="grid items-center gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
              <Reveal>
                <header>
                  <Eyebrow>About Us</Eyebrow>
                  <h1
                    id="about-page-title"
                    className="font-display text-display-lg text-pine mt-4 font-semibold text-balance"
                  >
                    The team behind the hackathon
                  </h1>
                  <p className="text-lede text-pine mt-5">
                    We host Binghamton University's annual hackathon, organizing, planning, and collaborating with various on campus and off campus partners. Between hackathons we run weekly workshops on campus, open to every major.
                  </p>
                  <p className="text-lede text-pine mt-5">
                    Experience isn’t necessary — many of our members started with little to no programming. Wanna help organize? Reach out to{' '}
                    <a href="#organizers" className={INLINE_LINK}>
                      an organizer
                    </a>{' '}
                    or shoot us an email.
                  </p>
                </header>
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

          <SnowdriftDivider variant="drift-a" />

          <Section
            id="workshops"
            labelledBy="workshops-title"
            className="bg-cloud"
          >
            <div className="grid items-center gap-10 md:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-14">
              <Reveal className="order-last md:order-none">
                <PhotoCarousel
                  photos={ABOUT_WORKSHOP_PHOTOS}
                  label="Photos from HackBU workshops"
                  lazy
                />
              </Reveal>

              <Reveal delay={0.1}>
                <SectionHeader
                  eyebrow="Every week"
                  titleId="workshops-title"
                  title="Weekly workshops and events"
                  lede="Our main recurring event is our weekly workshop, held every Monday at 7:30 PM. We also have occasional special events on other days, sometimes in collaboration with other computer science groups on campus."
                />
                <p className="text-lede text-pine mt-5 max-w-2xl">
                  Each week we walk through building something hands-on — web
                  development one week, mobile the next — covering tools like
                  Python, PyTorch, HTML/CSS, and SQL. There’s no application and
                  no dues, organizers are in the room the whole time, and no
                  experience is required.
                </p>
              </Reveal>
            </div>

            <Reveal delay={0.1}>
              <div id="calendar" className="mt-16 scroll-mt-24 sm:mt-20">
                <Eyebrow>Calendar</Eyebrow>
                <p className="text-lede text-pine mt-4 max-w-2xl">
                  Weekly workshops and special events live on the HackBU
                  calendar. Times and locations may change — check here for the
                  latest.
                </p>
                <div className="border-frost bg-cloud mt-8 overflow-hidden rounded-2xl border">
                  <iframe
                    title="HackBU event calendar"
                    src={GOOGLE_CALENDAR_EMBED_URL}
                    className="block h-[32rem] w-full sm:h-[40rem]"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </Reveal>

            <RevealGroup className="mt-12 grid gap-10 sm:grid-cols-2">
              <RevealItem>
                <Eyebrow>Google Calendar</Eyebrow>
                <ExternalLink
                  href={GOOGLE_CALENDAR_URL}
                  className={`${CALENDAR_LINK_CLASSES} mt-4 inline-block`}
                >
                  Add to Google Calendar
                </ExternalLink>
                <p className="text-caption text-pine/90 mt-4">
                  Subscribe so events show up in your Google account.
                </p>
              </RevealItem>

              <RevealItem>
                <Eyebrow>Other calendar apps</Eyebrow>
                <ExternalLink
                  href={ICAL_URL}
                  className={`${CALENDAR_LINK_CLASSES} mt-4 inline-block`}
                >
                  Add with iCalendar
                </ExternalLink>
                <p className="text-caption text-pine/90 mt-4">
                  Works with Apple Calendar, Outlook, and other apps that take
                  an .ics link.
                </p>
              </RevealItem>
            </RevealGroup>
          </Section>

          <SnowdriftDivider variant="cloud-to-frost" />

          <OrganizersSection />
        </main>

        <SnowdriftDivider variant="cloud-to-frost" />
        <SiteFooter />
      </div>
    </LazyMotion>
  )
}
