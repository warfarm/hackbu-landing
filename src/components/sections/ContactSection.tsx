import { Eyebrow, Section, SectionHeader } from '../Layout'
import { ExternalLink, LINK_ON_CLOUD, MailLink } from '../ExternalLink'
import { Reveal, RevealGroup, RevealItem } from '../Reveal'
import { CONTACT_EMAIL, ORGANIZERS_PATH } from '../../lib/links'

/* This section is on cloud, so brick is the hover. */
const LINK_CLASSES =
  'font-display text-display-md font-semibold underline underline-offset-8 ' +
  LINK_ON_CLOUD

/**
 * "Contact" — the quiet landing at the bottom of the page: one email address
 * and a pointer at the organizers, nothing else competing.
 */
export function ContactSection() {
  return (
    <Section id="contact" labelledBy="contact-title" className="bg-cloud">
      <Reveal>
        <SectionHeader
          eyebrow="Contact"
          titleId="contact-title"
          title="Still have a question?"
          lede="Email the organizers and ask it. It’s a small team of students, and no question is too basic to send."
        />
      </Reveal>

      <RevealGroup className="mt-12 grid gap-10 sm:grid-cols-2">
        <RevealItem>
          <Eyebrow>Email us</Eyebrow>
          <MailLink
            email={CONTACT_EMAIL}
            className={`${LINK_CLASSES} mt-4 inline-block`}
          />
          <p className="text-caption text-pine/90 mt-4">
            Goes to the organizing team.
          </p>
        </RevealItem>

        <RevealItem>
          <Eyebrow>Meet the team</Eyebrow>
          <ExternalLink
            href={ORGANIZERS_PATH}
            className={`${LINK_CLASSES} mt-4 inline-block`}
          >
            Organizers
          </ExternalLink>
          <p className="text-caption text-pine/90 mt-4">
            Who runs the workshops and the hackathon.
          </p>
        </RevealItem>
      </RevealGroup>
    </Section>
  )
}
