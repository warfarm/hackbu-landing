import { Section, SectionHeader } from '../Layout'
import { ButtonLink } from '../ButtonLink'
import { ExternalLink, LINK_ON_FROST } from '../ExternalLink'
import { Reveal } from '../Reveal'
import { SectionPhoto } from '../SectionPhoto'
import { APPLICATION_PATH, REGISTER_PATH } from '../../lib/links'
import { SECTION_PHOTOS } from '../../lib/images'

/**
 * "Registration" — the conversion point of the landing page, and the reason
 * it exists. The banner already carries a Register link; this is the version
 * with the details a hesitant applicant wants before they click.
 *
 * **Where the design comes from.** Two earlier sections, merged:
 *
 *   - the Hackathons page's old RegistrationSection (commit 9c1ec4b, before
 *     registration opened) — a standard header over one frost card. Its copy
 *     ("Registration opens in December", "sign up to be notified") is gone
 *     now that the form is live at /register.
 *   - the landing page's old Get involved section — the frost card with the
 *     page's largest button and a demoted text link under a hairline, and the
 *     snow-walk photograph as a bleed down the window's right edge. That card
 *     was built to be the page's single conversion action, which is exactly
 *     this section's job; the button now says "Register" instead of "Join the
 *     Discord".
 *
 * **Copy.** Everything here is what the registration flow actually does, taken
 * from src/register/: the confirmation email on submit, a second email once
 * the application is reviewed, the required resume (PDF or Word, up to 5 MB —
 * `fields.ts`), and the applicant portal at /application where people sign in
 * with an emailed code to see their status and RSVP. Telling people about the
 * resume up front is the kindest line on the page: it is the one field that
 * sends someone off to find a file halfway through the form.
 *
 * **Layout.** From `md` up the header and the card are held to half the
 * column and the photograph is a `.photo-bleed` (src/index.css) behind them,
 * running off the right edge of the window for the section's full height,
 * feathered into the copy. Both text blocks are `relative z-10`, above the
 * absolutely positioned photo. Below `md` the photo is a 3:2 block in flow
 * between the header and the card.
 *
 * **Surfaces.** The card is `bg-frost` with a `border-stone/60` edge — frost
 * on frost would measure 1.00:1, an edge that cannot render (P4-3) — so its
 * secondary link takes the frost treatment: underline on hover, never brick
 * (LINK_ON_FROST in ExternalLink.tsx).
 */
export function RegisterSection() {
  return (
    <Section
      id="register"
      labelledBy="register-title"
      className="bg-cloud overflow-x-clip"
    >
      <div className="relative flex flex-col">
        <Reveal className="relative z-10 md:max-w-[50%]">
          <SectionHeader
            eyebrow="Registration"
            titleId="register-title"
            title="Registration for HackBU 2027 is open."
            lede="Applying takes a few minutes. You’ll get a confirmation email right away, and we’ll email you again once your application has been reviewed."
          />
        </Reveal>

        <Reveal className="photo-bleed mt-10 md:mt-0" delay={0.05}>
          <SectionPhoto
            photo={SECTION_PHOTOS.snowWalk}
            className="aspect-[3/2] w-full md:aspect-auto md:h-full"
          />
        </Reveal>

        <Reveal delay={0.1} className="relative z-10 md:max-w-[50%]">
          <div className="border-stone/60 bg-frost mt-12 rounded-3xl border p-8 sm:p-12">
            <div className="flex flex-col items-start gap-8">
              <div className="max-w-md">
                <p className="font-display text-display-md text-pine font-semibold">
                  Register for HackBU 2027
                </p>
                <p className="text-body text-pine mt-3">
                  Tell us about yourself, your school and what you’d like to
                  build. Have your resume ready — the form asks for one, as a
                  PDF or Word file up to 5 MB. No hackathon experience needed.
                </p>
              </div>
              <ButtonLink
                href={REGISTER_PATH}
                size="lg"
                className="w-full sm:w-auto sm:px-10 sm:py-5"
              >
                Register now
              </ButtonLink>
            </div>

            <p className="text-caption text-pine/90 border-stone/60 mt-8 border-t pt-6">
              Already registered?{' '}
              <ExternalLink
                href={APPLICATION_PATH}
                className={`${LINK_ON_FROST} underline underline-offset-4`}
              >
                Check your application status
              </ExternalLink>{' '}
              — sign in with your email to see where it stands, and to RSVP
              once you’re accepted.
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}
