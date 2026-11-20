import { useEffect, useRef, useState, type RefObject } from 'react'
import { Block, Caption, Entry, Ground, Rule, SheetSection } from '../kit'

/**
 * Part 1 — the tokens themselves.
 *
 * Colours are drawn with the token utilities (`bg-sky`, `bg-fern`, ...), so a
 * swatch is the token, not a picture of it. Type steps are rendered at their
 * real size and then *measured* — the display steps are `clamp()` expressions,
 * so the only honest way to print a px value is to read it back off the
 * element at the current viewport width.
 */

/* -------------------------------------------------------------------------- */
/* Colour                                                                     */
/* -------------------------------------------------------------------------- */

type Flag = 'unused' | 'retired' | 'logo-only'

type Token = {
  name: string
  hex: string
  /** Tailwind utility that paints the swatch. */
  swatch: string
  role: string
  /** Where it is actually used, from a grep of src/. */
  usage: string
  flag?: Flag
  flagNote?: string
}

const FLAG_LABEL: Record<Flag, string> = {
  unused: 'Unused',
  retired: 'Retired from text',
  'logo-only': 'Logo only',
}

const TOKENS: readonly Token[] = [
  {
    name: 'sky',
    hex: '#4A96D2',
    swatch: 'bg-sky',
    role: 'A scene colour: the blue in the 3D shadows. Never UI.',
    usage: 'Tints the hero’s sky, ground light and igloo blocks.',
  },
  {
    name: 'horizon',
    hex: '#A8D0EB',
    swatch: 'bg-horizon',
    role: 'The accent: the pale winter blue of the hero’s “2027”.',
    usage:
      'The Register button (ink label at 4.99:1), the block behind the hero’s year, the wedge under each divider, table tints, hovers, and the glow in the 3D scenes.',
  },
  {
    name: 'cloud',
    hex: '#F7F5EE',
    swatch: 'bg-cloud',
    role: 'The bright end of the 3D scenes.',
    usage: 'Snowflakes, sunlight and the survey lines in 3D. The interface does not use it.',
  },
  {
    name: 'frost',
    hex: '#DCE3EA',
    swatch: 'bg-frost',
    role: 'The page ground.',
    usage:
      'The body (and the hero lockup’s ground), the header, every panel (at 74%), and the label on an ink button.',
  },
  {
    name: 'brick',
    hex: '#A2593A',
    swatch: 'bg-brick',
    role: 'Retired from the interface.',
    usage: 'Only the bark of the ink frozen in the ice scene.',
  },
  {
    name: 'stone',
    hex: '#C4B79E',
    swatch: 'bg-stone',
    role: 'Retired.',
    usage: 'No uses outside its swatch here. Hairlines are ink at 20–25%.',
  },
  {
    name: 'ink',
    hex: '#295374',
    swatch: 'bg-ink',
    role: 'The accent blue taken dark enough to read: all text, hairlines, focus rings and solid buttons.',
    usage:
      'Every piece of copy on the page, the one focus-ring colour, the solid buttons, and the label and border of Register.',
  },
  {
    name: 'pine',
    hex: '#3C5C48',
    swatch: 'bg-pine',
    role: 'Retired: the site’s old green ink.',
    usage: 'No uses outside this swatch.',
  },
  {
    name: 'haze',
    hex: '#7C99B4',
    swatch: 'bg-haze',
    role: 'A scene colour. It cannot carry text at any size.',
    usage: 'No text uses. In 3D it is the igloo’s blocks, scoured ground and distant haze; in CSS the out-of-focus section words.',
    flag: 'retired',
    flagNote:
      '2.72:1 on cloud and 2.29:1 on frost — under AA for normal text (4.5:1) and under AA large (3:1) as well. Secondary text is full ink.',
  },
  {
    name: 'fern',
    hex: '#339966',
    swatch: 'bg-fern',
    role: 'The HackBU logo green. The brand marks and nothing else.',
    usage: 'One use: the two masked spans inside <Wordmark>.',
    flag: 'logo-only',
    flagNote:
      'The two source marks ship in different greens (#339966 and #42B872); painting both through this one token normalises them. It measures 3.27:1 on cloud and 2.75:1 on frost, so it must never appear on a link, a button, a border or any text — logotypes are exempt from WCAG 1.4.3 and 1.4.11, and nothing else here is.',
  },
]

function Swatch({ token }: { token: Token }) {
  return (
    <li className="border-ink/20 flex gap-4 border-b py-4">
      {/*
       * `token.swatch` is a background utility, and for `fern` that is
       * literally the one thing the logo-only rule forbids (P3-7). Kept, and
       * this is the exemption: the rule exists because fern measures 3.27:1 on
       * cloud and so must never carry text, a border or an interactive
       * surface — none of which a 56px `aria-hidden` square in an internal,
       * noindex catalogue is. Showing the token is this element's whole job,
       * and the row's own `flagNote` below states the restriction it is the
       * sole exception to. If the rule is ever machine-checked, exempt this
       * file by name rather than working around it here.
       */}
      <span
        aria-hidden="true"
        className={`${token.swatch} border-ink/20 h-14 w-14 shrink-0 rounded-xl border sm:h-16 sm:w-16`}
      />
      <div className="min-w-0">
        <p className="text-body text-ink font-medium">
          {token.name}
          <span className="text-ink font-normal"> · {token.hex}</span>
          {token.flag ? (
            <span className="border-ink/20 text-caption text-ink ml-2 rounded-none border px-2 py-0.5 align-middle font-normal">
              {FLAG_LABEL[token.flag]}
            </span>
          ) : null}
        </p>
        <p className="text-caption text-ink mt-1">{token.role}</p>
        <p className="text-caption text-ink mt-1">{token.usage}</p>
        {token.flagNote ? (
          <p className="text-caption text-ink border-ink/20 mt-2 border-l-2 pl-3">
            {token.flagNote}
          </p>
        ) : null}
      </div>
    </li>
  )
}

/* -------------------------------------------------------------------------- */
/* Type                                                                       */
/* -------------------------------------------------------------------------- */

type Step = {
  /** The Tailwind step, exactly as it is written in markup. */
  className: string
  /** The CSS value in the @theme block. */
  declared: string
  family: 'display' | 'sans'
  role: string
  sample: string
}

const STEPS: readonly Step[] = [
  {
    className: 'text-display-xl',
    declared: 'clamp(2.125rem, 5.4vw, 4.25rem)',
    family: 'display',
    role: 'A page’s headline, where it is not the hero lockup.',
    sample: 'Learn to build apps',
  },
  {
    className: 'text-display-lg',
    declared: 'clamp(1.625rem, 3.1vw, 2.5rem)',
    family: 'display',
    role: 'Section headline — what <SectionHeader> renders.',
    sample: 'A community of people',
  },
  {
    className: 'text-display-md',
    declared: 'clamp(1.0625rem, 1.6vw, 1.25rem)',
    family: 'display',
    role: 'Card and question headlines, and the two big contact links.',
    sample: 'Development workshops',
  },
  {
    className: 'text-lede',
    declared: 'clamp(1rem, 1.25vw, 1.125rem)',
    family: 'sans',
    role: 'The opening paragraph under a headline.',
    sample: 'No application, no dues, and no attendance to keep up.',
  },
  {
    className: 'text-body',
    declared: '0.9375rem',
    family: 'sans',
    role: 'Default paragraph, and the lg button label.',
    sample: 'Each week we walk through building something for the web.',
  },
  {
    className: 'text-caption',
    declared: '0.8125rem',
    family: 'sans',
    role: 'Secondary and meta text, footer links, the md button label.',
    sample: 'Web development one week, mobile the next.',
  },
  {
    className: 'text-eyebrow',
    declared: '0.75rem',
    family: 'sans',
    role: 'The uppercase label above a headline. 0.2em tracking.',
    sample: 'What HackBU is',
  },
]

/**
 * Reads a step's computed size back off the DOM, because four of the seven are
 * `clamp()` and their px value is a function of the viewport. Re-measures on
 * resize so the number on screen is never stale.
 */
function useComputedType(ref: RefObject<HTMLElement | null>) {
  const [text, setText] = useState('')

  useEffect(() => {
    function measure() {
      const element = ref.current
      if (!element) return
      const style = getComputedStyle(element)
      const size = Number.parseFloat(style.fontSize)
      const lineHeight = Number.parseFloat(style.lineHeight)
      setText(
        `${size.toFixed(1)}px · line-height ${
          Number.isNaN(lineHeight) ? style.lineHeight : `${lineHeight.toFixed(1)}px`
        }`,
      )
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [ref])

  return text
}

function TypeSpecimen({ step }: { step: Step }) {
  const sampleRef = useRef<HTMLParagraphElement>(null)
  const computed = useComputedType(sampleRef)

  return (
    <li className="border-ink/20 border-b py-6">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-caption text-ink font-medium">{step.className}</span>
        <span className="text-caption text-ink">
          font-{step.family} · {step.declared}
        </span>
        <span className="text-caption text-ink">{computed || 'measuring…'}</span>
      </div>
      <p className="text-caption text-ink mt-1">{step.role}</p>
      <p
        ref={sampleRef}
        className={`${step.className} ${
          step.family === 'display'
            ? 'font-display font-semibold'
            : 'font-sans'
        } ${step.className === 'text-eyebrow' ? 'font-medium uppercase' : ''} text-ink mt-4`}
      >
        {step.sample}
      </p>
    </li>
  )
}

/* -------------------------------------------------------------------------- */

export function TokensPart() {
  return (
    <SheetSection
      id="tokens"
      number="1"
      title="Design tokens"
      intro={
        <>
          Nine colours and seven type steps, all declared in the{' '}
          <span className="font-medium">@theme</span> block of{' '}
          <span className="font-medium">src/index.css</span>. Tailwind turns each{' '}
          <span className="font-medium">--color-*</span> into the matching{' '}
          <span className="font-medium">bg-</span>/
          <span className="font-medium">text-</span>/
          <span className="font-medium">border-</span> utilities and each{' '}
          <span className="font-medium">--text-*</span> into a step, so the names
          below are what you actually type in markup.
        </>
      }
    >
      <Entry
        name="Colour"
        path="src/index.css — @theme { --color-* }"
        use="Nine tokens. Three of them carry a restriction that is not visible from the swatch, flagged below."
      >
        <Block title="Swatches">
          <ul className="border-ink/20 border-t">
            {TOKENS.map((token) => (
              <Swatch key={token.name} token={token} />
            ))}
          </ul>
        </Block>

        <Block title="The rule that keeps this palette honest">
          <Rule>
            frost is the ground, ink is the ink, and horizon is the one accent,
            on Register and the hero’s year. Every accessibility decision
            downstream — the two link treatments, the single focus-ring tone, the
            retirement of haze — follows from holding those lines rather than
            from tuning individual pairs.
          </Rule>
        </Block>
      </Entry>

      <Entry
        name="Type scale"
        path="src/index.css — @theme { --text-* }"
        use="Named steps so no call site ever hand-picks a size. Display steps are fluid; body steps are fixed."
      >
        <Block title="Steps, at size">
          <ul className="border-ink/20 border-t">
            {STEPS.map((step) => (
              <TypeSpecimen key={step.className} step={step} />
            ))}
          </ul>
          <Caption>
            The px values are measured off these specimens at the current
            viewport width, not copied from the stylesheet — four of the seven
            steps are clamp() expressions and change as you resize this page.
          </Caption>
        </Block>

        <Block title="Families">
          <div className="grid gap-4 sm:grid-cols-2">
            <Ground tone="cloud" label="font-display">
              <p className="font-display text-display-md text-ink font-semibold">
                IBM Plex Mono 600
              </p>
              <p className="text-caption text-ink mt-3">
                Headings. Self-hosted via @fontsource.
              </p>
            </Ground>
            <Ground tone="cloud" label="font-sans">
              <p className="font-sans text-display-md text-ink font-medium">
                IBM Plex Mono 400 / 500
              </p>
              <p className="text-caption text-ink mt-3">
                400 for copy, 500 for labels and buttons. One family throughout.
              </p>
            </Ground>
          </div>
        </Block>
      </Entry>
    </SheetSection>
  )
}
