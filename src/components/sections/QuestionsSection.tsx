import { useId, useState } from 'react'
import { Section, SectionHeader } from '../Layout'
import { Reveal, RevealGroup, RevealItem } from '../Reveal'
import { SectionPhoto } from '../SectionPhoto'
import { SECTION_PHOTOS } from '../../lib/images'

/**
 * "Questions newcomers actually have" — each answer sits behind a disclosure
 * so the section stays scannable with eight items. One open at a time keeps
 * the page from stacking long answers.
 *
 * Opening is animated: the panel is a one-row grid whose row goes `0fr` to
 * `1fr` (`.faq-panel`, src/index.css), so the answer's height is never
 * measured and no JS runs per frame. The panel stays in the DOM either way —
 * `aria-controls` always resolves — and `visibility` on the panel, driven by
 * the same transition, is what keeps a closed answer out of the
 * accessibility tree and the tab order. The `+` in the button is two SVG
 * strokes, and the upright one scales to nothing when the item is open so
 * it becomes a `−` in the same motion.
 *
 * From `md` up a portrait <SectionPhoto> — a winter walkway seen from above —
 * is a bleed (see `.photo-bleed` in src/index.css): it runs down the window's
 * right edge for the full height of the section, header included, with the
 * heading and the list held to half of the column so the copy ends inside
 * the photo's feathered edge and never over the picture itself. The box is
 * taller than it is wide and the file is 658 x 1024, so the crop is mostly
 * vertical and simply reveals more of the walkway as answers open. Below `md`
 * the photo follows the list as a 4:3 block, so the questions stay first on a
 * phone.
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
    <Section
      id="questions"
      labelledBy="questions-title"
      className="bg-cloud overflow-x-clip"
    >
      <div className="relative flex flex-col">
        <Reveal className="relative z-10 md:max-w-[50%]">
          <SectionHeader
            eyebrow="Things people ask us"
            titleId="questions-title"
            title="Questions newcomers actually have."
          />
        </Reveal>

        <RevealGroup className="border-frost relative z-10 mt-12 border-t md:max-w-[50%]">
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
                  <DisclosureGlyph open={open} />
                </button>
              </h3>
              <div className="faq-panel" data-open={open}>
                <section id={panelId} aria-labelledby={buttonId}>
                  <p className="faq-panel-body text-body text-pine max-w-2xl pb-8">
                    {item.answer}
                  </p>
                </section>
              </div>
            </RevealItem>
          )
        })}
        </RevealGroup>

        <Reveal className="photo-bleed mt-10 md:mt-0" delay={0.05}>
          <SectionPhoto
            photo={SECTION_PHOTOS.campusPath}
            className="aspect-[4/3] w-full md:aspect-auto md:h-full"
          />
        </Reveal>
      </div>
    </Section>
  )
}

/**
 * The `+` / `−` at the end of each question. A horizontal stroke and a
 * vertical one; the vertical stroke scales to zero about its centre when the
 * item is open, so the plus closes into a minus and back without a swap.
 * Decorative — the button's `aria-expanded` carries the state.
 */
function DisclosureGlyph({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="text-pine/90 h-6 w-6 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    >
      <path d="M5 12 H19" />
      <path
        d="M12 5 V19"
        className="origin-center transition-transform duration-300 ease-out motion-reduce:transition-none"
        style={{ transform: open ? 'scaleY(0)' : 'scaleY(1)' }}
      />
    </svg>
  )
}
