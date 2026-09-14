import { useId, useState } from 'react'
import { Section, SectionHeader } from '../Layout'
import { Reveal, RevealGroup, RevealItem } from '../Reveal'

/**
 * "Questions newcomers actually have" — each answer sits behind a disclosure
 * so the section stays scannable with eight items. One open at a time keeps
 * the page from stacking long answers.
 */

const QUESTIONS = [
  {
    question: 'What is a hackathon?',
    answer:
      'Teams get 24 to 48 hours to build a web app, a mobile app or a hardware project. You start from an idea and end with whatever you managed to make in the time. Almost nothing is finished by the end, and that’s the normal outcome.',
  },
  {
    question: 'Who can attend?',
    answer:
      'Our weekly workshops are free and open to all majors — no membership or commitment required. Our annual hackathon brings collegiate students together from across the Northeast to build, network, and compete for prizes.',
  },
  {
    question: 'I am a first time hacker, what should I do?',
    answer:
      'Show up. A lot of our members started with none, and we write the workshops for that. Before the hackathon we run sessions that help you get started, and organizers are around the whole weekend to help when something breaks.',
  },
  {
    question: 'How does team formation work?',
    answer:
      'Teams are up to four people. Bring friends if you have them — if you don’t, there will be chances at the event to meet other hackers and form a team.',
  },
  {
    question: 'How do I register for the hackathon?',
    answer:
      'Registration typically opens in December. Join the mailing list and our Discord — when registration opens we post it there and on the Hackathons page, and we’ll walk you through the rest.',
  },
  {
    question: 'I have more questions?',
    answer:
      'Email the organizers at hello@hackbu.org or ask in our Discord. It’s a small team of students, and no question is too basic to send.',
  },
  {
    question: 'Can I volunteer?',
    answer:
      'Yes — we’re glad to have help. Reach out at hello@hackbu.org or on Discord and tell us you’d like to volunteer; we’ll point you at what’s open.',
  },
  {
    question: 'Will there be swag?',
    answer:
      'Yes. Hackathon participants get HackBU swag, and there are usually prizes for winning teams as well.',
  },
] as const

export function QuestionsSection() {
  const baseId = useId()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <Section id="questions" labelledBy="questions-title" className="bg-cloud">
      <Reveal>
        <SectionHeader
          eyebrow="Things people ask us"
          titleId="questions-title"
          title="Questions newcomers actually have."
        />
      </Reveal>

      <RevealGroup className="border-frost mt-12 border-t">
        {QUESTIONS.map((item, index) => {
          const open = openIndex === index
          const panelId = `${baseId}-panel-${index}`
          const buttonId = `${baseId}-button-${index}`

          return (
            <RevealItem
              key={item.question}
              className="border-frost border-b"
            >
              <h3>
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(open ? null : index)}
                  className="font-display text-display-md text-pine hover:text-brick focus-visible:outline-pine flex w-full cursor-pointer items-center justify-between gap-6 py-8 text-left font-semibold text-balance focus-visible:outline-2 focus-visible:outline-offset-4"
                >
                  {item.question}
                  <span
                    aria-hidden="true"
                    className="text-pine/90 w-6 shrink-0 text-center text-2xl font-normal"
                  >
                    {open ? '−' : '+'}
                  </span>
                </button>
              </h3>
              <section
                id={panelId}
                aria-labelledby={buttonId}
                hidden={!open}
                className="pb-8"
              >
                <p className="text-body text-pine max-w-2xl">{item.answer}</p>
              </section>
            </RevealItem>
          )
        })}
      </RevealGroup>
    </Section>
  )
}
