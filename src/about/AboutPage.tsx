import { domAnimation, LazyMotion } from 'motion/react'
import { SiteHeader } from '../components/SiteHeader'
import { SiteFooter } from '../components/SiteFooter'
import { SnowdriftDivider } from '../components/SnowdriftDivider'
import { Eyebrow, Section, SectionHeader } from '../components/Layout'
import { Reveal } from '../components/Reveal'
import { ExternalLink, LINK_ON_CLOUD } from '../components/ExternalLink'
import { ABOUT_PATH, SCHEDULE_URL } from '../lib/links'
import { ABOUT_CAROUSELS } from '../lib/images'
import { Wordmark } from '../components/Wordmark'
import { PhotoCarousel } from './PhotoCarousel'

/**
 * About us — one topic per section, separated by snowdrifts the same way
 * the landing page is. Photos sit beside the copy they illustrate
 * (~24–28rem from `md` up).
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
                    We host Binghamton University's annual hackathon, organizing, planning, and collaborating with various on campus and off campus partners.
                  </p>
                </header>
              </Reveal>

              <Reveal delay={0.1}>
                <PhotoCarousel
                  photos={ABOUT_CAROUSELS.community}
                  label="Photos from HackBU events"
                />
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
                  photos={ABOUT_CAROUSELS.workshops}
                  label="Photos from HackBU workshops"
                  lazy
                />
              </Reveal>

              <Reveal delay={0.1}>
                <SectionHeader
                  eyebrow="Every week"
                  titleId="workshops-title"
                  title="Workshops on campus for tech development"
                  lede="We offer the resources to help you learn many different topics, answer questions, help you work through tough problems to prepare yourself for the hackathon."
                />
              </Reveal>
            </div>
          </Section>

          <SnowdriftDivider variant="drift-b" />

          <Section
            id="hackathon"
            labelledBy="hackathon-title"
            className="bg-cloud"
          >
            <div className="grid items-center gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
              <Reveal>
                <SectionHeader
                  eyebrow="Every year"
                  titleId="hackathon-title"
                  title="Hackers from all over the country"
                  lede="HackBU brings together collegiate students to collaborate on innovative projects, discover new technologies, network with recruiters, and compete for prizes."
                />
              </Reveal>

              <Reveal delay={0.1}>
                <PhotoCarousel
                  photos={ABOUT_CAROUSELS.hackathon}
                  label="Photos from the HackBU hackathon"
                  lazy
                />
              </Reveal>
            </div>
          </Section>

          <SnowdriftDivider variant="drift-c" />

          <Section
            id="getting-started"
            labelledBy="getting-started-title"
            className="bg-cloud"
          >
            <div className="grid items-center gap-10 md:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-14">
              <Reveal>
                <SectionHeader
                  eyebrow="Getting started"
                  titleId="getting-started-title"
                  title="Experience isn’t necessary."
                  lede="Many HackBU members start off little to no programming experience."
                />
                <p className="text-lede text-pine mt-5 max-w-2xl">
                  We recommend attending our{' '}
                  <ExternalLink href={SCHEDULE_URL} className={INLINE_LINK}>
                    weekly workshops
                  </ExternalLink>
                  . We’re happy to help!
                </p>
                <p className="text-lede text-pine mt-5 max-w-2xl">
                  Wanna help organize the hackathon? Reach out to an organizer or shoot us an email.
                </p>
              </Reveal>

              <Reveal delay={0.1} className="flex justify-center md:justify-end">
                <Wordmark large className="text-[2.5rem] lg:text-[3.25rem]" />
              </Reveal>
            </div>
          </Section>
        </main>

        <SnowdriftDivider variant="cloud-to-frost" />
        <SiteFooter />
      </div>
    </LazyMotion>
  )
}
