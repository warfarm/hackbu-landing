import { domAnimation, LazyMotion } from 'motion/react'
import { SiteHeader } from '../components/SiteHeader'
import { SnowdriftDivider } from '../components/SnowdriftDivider'
import { SiteFooter } from '../components/SiteFooter'
import { Container, Eyebrow } from '../components/Layout'
import { APPLICATION_PATH } from '../lib/links'
import { ApplicationPortal } from './ApplicationPortal'

/**
 * Applicant portal — sign in with an emailed code, see your application and
 * its status, and RSVP once accepted. Everything goes through the same Apps
 * Script as registration (`google-apps-script/`).
 */
export default function ApplicationApp() {
  return (
    <LazyMotion features={domAnimation} strict>
      <div id="top" className="bg-cloud font-sans text-pine min-h-screen">
        <a
          href="#main"
          className="bg-cloud text-pine focus:outline-pine sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:rounded-full focus:px-4 focus:py-2 focus:outline-2"
        >
          Skip to content
        </a>

        <SiteHeader currentHref={APPLICATION_PATH} />

        <main id="main" className="pt-16 sm:pt-20">
          <section aria-labelledby="application-title" className="py-20 sm:py-28">
            <Container>
              <div className="max-w-3xl">
                <Eyebrow>Applicants</Eyebrow>
                <h1
                  id="application-title"
                  className="font-display text-display-xl text-pine mt-5 font-semibold text-balance"
                >
                  My application
                </h1>
              </div>
              <div className="mt-12">
                <ApplicationPortal />
              </div>
            </Container>
          </section>
        </main>

        <SnowdriftDivider variant="cloud-to-frost" />
        <SiteFooter />
      </div>
    </LazyMotion>
  )
}
