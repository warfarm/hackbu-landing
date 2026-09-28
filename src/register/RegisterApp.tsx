import { domAnimation, LazyMotion } from 'motion/react'
import { SiteHeader } from '../components/SiteHeader'
import { SnowdriftDivider } from '../components/SnowdriftDivider'
import { SiteFooter } from '../components/SiteFooter'
import { Container, Eyebrow } from '../components/Layout'
import { Reveal } from '../components/Reveal'
import { APPLICATION_PATH, HACKATHONS_PATH, REGISTER_PATH } from '../lib/links'
import { LINK_ON_CLOUD, ExternalLink } from '../components/ExternalLink'
import { RegistrationForm } from './RegistrationForm'

/**
 * Registration — the hackathon sign-up form, on its own page.
 *
 * Submissions go to a Google Apps Script bound to the registrations sheet
 * (`google-apps-script/`), which writes the row and sends the confirmation
 * email. Same `<LazyMotion>` wrapper as every other page — see src/App.tsx.
 */
export default function RegisterApp() {
  return (
    <LazyMotion features={domAnimation} strict>
      <div id="top" className="bg-cloud font-sans text-pine min-h-screen">
        <a
          href="#main"
          className="bg-cloud text-pine focus:outline-pine sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:rounded-full focus:px-4 focus:py-2 focus:outline-2"
        >
          Skip to content
        </a>

        <SiteHeader currentHref={REGISTER_PATH} />

        <main id="main" className="pt-16 sm:pt-20">
          <section aria-labelledby="register-title" className="py-20 sm:py-28">
            <Container>
              <Reveal>
                <div className="max-w-3xl">
                  <Eyebrow>Registration</Eyebrow>
                  <h1
                    id="register-title"
                    className="font-display text-display-xl text-pine mt-5 font-semibold text-balance"
                  >
                    Register for HackBU
                  </h1>
                  <p className="text-lede text-pine mt-6 max-w-2xl">
                    Tell us a bit about yourself. You’ll get a confirmation email
                    right away, and we’ll email you again once your application
                    has been reviewed.
                  </p>
                  <p className="text-body text-pine mt-4">
                    New to hackathons?{' '}
                    <ExternalLink
                      href={HACKATHONS_PATH}
                      className={`${LINK_ON_CLOUD} underline underline-offset-4`}
                    >
                      Read about the event
                    </ExternalLink>
                    . No experience required.
                  </p>
                  <p className="text-body text-pine mt-2">
                    Already registered?{' '}
                    <ExternalLink
                      href={APPLICATION_PATH}
                      className={`${LINK_ON_CLOUD} underline underline-offset-4`}
                    >
                      Check your application
                    </ExternalLink>
                    .
                  </p>
                </div>
              </Reveal>

              <div className="mt-12">
                <RegistrationForm />
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
