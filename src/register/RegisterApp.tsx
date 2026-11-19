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
      <div id="top" className="font-sans text-ink min-h-screen">
        <a
          href="#main"
          className="bg-frost text-ink focus:outline-ink sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:rounded-none focus:px-4 focus:py-2 focus:outline-2"
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
                    className="font-display text-display-xl text-ink mt-5 font-semibold text-balance"
                  >
                    Register for HackBU
                  </h1>
                  <p className="text-lede text-ink mt-6 max-w-2xl">
                    Tell us a bit about yourself. You’ll get a confirmation email
                    right away, and we’ll email you again once your application
                    has been reviewed.
                  </p>
                  <div className="border-ink/70 mt-6 border-l-4 pl-4">
                    <p className="text-body text-ink">
                      <span className="font-medium">New to hackathons?</span>{' '}
                      <ExternalLink
                        href={HACKATHONS_PATH}
                        className={`${LINK_ON_CLOUD} font-semibold underline underline-offset-4`}
                      >
                        Read about the event
                      </ExternalLink>
                      . No experience required.
                    </p>
                    <p className="text-body text-ink mt-2">
                      <span className="font-medium">Already registered?</span>{' '}
                      <ExternalLink
                        href={APPLICATION_PATH}
                        className={`${LINK_ON_CLOUD} font-semibold underline underline-offset-4`}
                      >
                        Check your application
                      </ExternalLink>
                      .
                    </p>
                  </div>
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
