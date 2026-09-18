import { Eyebrow, Section, SectionHeader } from '../components/Layout'
import { ExternalLink, LINK_ON_CLOUD, MailLink } from '../components/ExternalLink'
import { ButtonLink } from '../components/ButtonLink'
import { Reveal, RevealGroup, RevealItem } from '../components/Reveal'
import { CONTACT_EMAIL, ORGANIZERS_PATH, DISCORD_URL } from '../lib/links'

const LINK_CLASSES =
  'font-display text-display-md font-semibold underline underline-offset-8 ' +
  LINK_ON_CLOUD

export function SponsorsContactSection() {
  return (
    <Section id="contact" labelledBy="sponsors-contact-title" className="bg-cloud">
      <Reveal>
        <SectionHeader
          eyebrow="Contact us"
          titleId="sponsors-contact-title"
          title="Ready to sponsor HackBU 2027?"
          lede="We have our full sponsorship packet ready to share. Reach out to discuss packages, ask questions, or request an invoice for your organization."
        />
      </Reveal>

      <div className="mt-12">
        <RevealGroup className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <RevealItem>
            <div className="border-frost bg-frost/30 h-full rounded-2xl border p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <Eyebrow>Email our team</Eyebrow>
                <div className="mt-4">
                  <MailLink
                    email={CONTACT_EMAIL}
                    className={`${LINK_CLASSES} text-display-sm inline-block break-all`}
                  />
                </div>
                <p className="text-caption text-pine/80 mt-4">
                  Direct line to our student organizing and outreach leads. We
                  typically respond within 24 to 48 hours.
                </p>
              </div>
              <div className="mt-6">
                <ButtonLink href={`mailto:${CONTACT_EMAIL}`} size="sm">
                  Email us
                </ButtonLink>
              </div>
            </div>
          </RevealItem>

          <RevealItem>
            <div className="border-frost bg-frost/30 h-full rounded-2xl border p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <Eyebrow>Sponsorship packet</Eyebrow>
                <p className="font-display text-display-sm text-pine mt-4 font-semibold">
                  Request the packet
                </p>
                <p className="text-body text-pine/90 mt-3 text-sm">
                  Our comprehensive packet includes student demographics, past
                  hackathon statistics, venue details, and payment logistics.
                </p>
              </div>
              <div className="mt-6">
                <ButtonLink
                  href={`mailto:${CONTACT_EMAIL}?subject=HackBU%202027%20Sponsorship%20Packet%20Request`}
                  size="sm"
                >
                  Request packet
                </ButtonLink>
              </div>
            </div>
          </RevealItem>

          <RevealItem>
            <div className="border-frost bg-frost/30 h-full rounded-2xl border p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <Eyebrow>Meet the team</Eyebrow>
                <div className="mt-4">
                  <ExternalLink
                    href={ORGANIZERS_PATH}
                    className={`${LINK_CLASSES} text-display-sm inline-block`}
                  >
                    View organizers
                  </ExternalLink>
                </div>
                <p className="text-body text-pine/90 mt-3 text-sm">
                  HackBU is run by a passionate group of Binghamton University
                  students who lead our weekly workshops and organize our annual
                  hackathon.
                </p>
              </div>
              <div className="mt-6">
                <ExternalLink
                  href={DISCORD_URL}
                  className="text-caption text-pine hover:text-brick font-medium underline underline-offset-4"
                >
                  Join our Discord server
                </ExternalLink>
              </div>
            </div>
          </RevealItem>
        </RevealGroup>
      </div>
    </Section>
  )
}
