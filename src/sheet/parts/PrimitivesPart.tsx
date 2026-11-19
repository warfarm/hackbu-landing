import { useState } from 'react'
import { Block, Caption, Entry, Ground, Props, Rule, SheetSection, type PropRow } from '../kit'
import { Container, Eyebrow, Section, SectionHeader } from '../../components/Layout'
import { ButtonLink } from '../../components/ButtonLink'
import {
  ExternalLink,
  LINK_ON_CLOUD,
  LINK_ON_FROST,
  MailLink,
} from '../../components/ExternalLink'
import { TOGGLE_ON_CLOUD } from '../../components/controls'
import { Wordmark } from '../../components/Wordmark'
import { SnowdriftDivider } from '../../components/SnowdriftDivider'
import { Reveal, RevealGroup, RevealItem } from '../../components/Reveal'
import { usePrefersReducedMotion } from '../../lib/motion'
import { CONTACT_EMAIL, DISCORD_URL, ORGANIZERS_ANCHOR, REGISTER_PATH } from '../../lib/links'

/**
 * Part 2 — the standalone primitives, in isolation, with every variant.
 *
 * Everything here is the real component imported from `src/components/`. Where
 * a component has variants, all of them are on screen; where it encodes a rule
 * (a contrast measurement, an accessibility decision, a variant deliberately
 * removed), the rule is written next to it, because that is the part you cannot
 * recover by reading the class list.
 */

/* -------------------------------------------------------------------------- */

const CLASSNAME_ROW: PropRow = {
  name: 'className',
  type: 'string',
  fallback: "''",
  note: 'Appended to the component’s own classes.',
}

const CHILDREN_ROW: PropRow = {
  name: 'children',
  type: 'ReactNode',
  note: 'Content.',
}

/* -------------------------------------------------------------------------- */

function WordmarkEntry() {
  return (
    <Entry
      name="Wordmark"
      path="src/components/Wordmark.tsx"
      use="The brand lockup. Use it wherever the club signs its name — the header link and the footer."
    >
      <Block title="Props">
        <Props rows={[CLASSNAME_ROW]} />
        <Caption>
          There is no size prop: the marks are sized in <b>em</b>, so a call site
          sets the size with a font-size utility. The page uses two —{' '}
          <b>text-2xl</b> in the footer and <b>text-2xl sm:text-3xl</b> in the
          header.
        </Caption>
      </Block>

      <Block title="At size, on both grounds">
        <div className="grid gap-4 sm:grid-cols-2">
          <Ground tone="cloud" label="on cloud">
            <div className="flex flex-col gap-6">
              <Wordmark className="text-lg" />
              <Wordmark className="text-2xl" />
              <Wordmark className="text-3xl" />
            </div>
            <Caption>text-lg · text-2xl · text-3xl</Caption>
          </Ground>
          <Ground tone="frost" label="on frost">
            <div className="flex flex-col gap-6">
              <Wordmark className="text-lg" />
              <Wordmark className="text-2xl" />
              <Wordmark className="text-3xl" />
            </div>
            <Caption>
              Identical on both — fern is the mark’s colour on every ground.
            </Caption>
          </Ground>
        </div>
      </Block>

      <Block title="How it is drawn">
        <Rule>
          Neither mark is an image. Each is an empty span painted{' '}
          <b>bg-fern</b> with its shape cut out of it by a{' '}
          <b>mask-image</b> alpha mask from <b>public/brand/</b>. The two source
          marks ship in two different greens; masking normalises them to one
          token at paint time, and keeps the colour in the stylesheet next to
          every other colour rather than baked into pixels. The 2× masks are
          selected by a <b>min-resolution</b> media query rather than{' '}
          <b>image-set()</b>, because an unparsed <b>image-set()</b> invalidates
          the whole declaration and the mark would paint as a solid fern
          rectangle.
        </Rule>
        <Caption>
          Accessibility: the wrapper is <b>role="img"</b> with{' '}
          <b>aria-label="HackBU"</b>, which makes the two spans presentational —
          one announcement, and in the header it is also what gives the wrapping
          link its accessible name.
        </Caption>
      </Block>
    </Entry>
  )
}

/* -------------------------------------------------------------------------- */

function ButtonEntry() {
  return (
    <Entry
      name="ButtonLink"
      path="src/components/ButtonLink.tsx"
      use="The site's buttons that are links: Register (the register tone), the header's outlined Discord link (outline), and the content sections' solid ink buttons (the default). If it is none of those, it is a text link, not a button."
    >
      <Block title="Props">
        <Props
          rows={[
            { name: 'href', type: 'string', note: 'Passed through to <ExternalLink>: same-site paths navigate in place, anything else opens in a new tab.' },
            CHILDREN_ROW,
            { name: 'size', type: "'sm' | 'md' | 'lg'", fallback: "'md'", note: 'Padding and text step. sm in the header, md in the compact menu, lg in the sections.' },
            { name: 'tone', type: "'ink' | 'register' | 'outline'", fallback: "'ink'", note: 'ink: solid ink, the sections’ buttons. register: horizon fill with an ink label and border, for Register only. outline: the same ink border with no fill, for Discord in the header.' },
            CLASSNAME_ROW,
            { name: 'onClick', type: '() => void', fallback: 'undefined', note: 'Used by the compact header menu to close itself.' },
            { name: 'aria-current', type: "'page'", fallback: 'undefined', note: 'Set by the header on Register when /register is the page being shown.' },
          ]}
        />
      </Block>

      <Block title="All three sizes">
        <Ground tone="cloud" label="on cloud">
          <div className="flex flex-wrap items-center gap-4">
            <ButtonLink href={DISCORD_URL} size="sm">
              Discord
            </ButtonLink>
            <ButtonLink href={DISCORD_URL} size="md">
              Join the Discord
            </ButtonLink>
            <ButtonLink href={DISCORD_URL} size="lg">
              Join the Discord
            </ButtonLink>
          </div>
          <Caption>
            sm (px-3 py-2, 0.75rem) · md (px-5 py-3, text-caption) · lg (px-7
            py-4, text-body). Header nav uses sm, the compact menu md, the
            intro and get-involved CTAs lg.
          </Caption>
        </Ground>
      </Block>

      <Block title="The three tones">
        <Ground tone="cloud" label="on cloud">
          <div className="flex flex-wrap items-center gap-4">
            <ButtonLink href={REGISTER_PATH} size="sm" tone="register">
              Register
            </ButtonLink>
            <ButtonLink href={DISCORD_URL} size="sm" tone="outline">
              Discord
            </ButtonLink>
            <ButtonLink href={DISCORD_URL} size="sm">
              Join the Discord
            </ButtonLink>
          </div>
          <Caption>
            register (horizon, ink label 4.99:1, ink border) · outline (ink
            border, no fill) · ink, the default. horizon against cloud is only
            1.49:1, so on cream the ink border is what draws the button&apos;s
            edge.
          </Caption>
        </Ground>
      </Block>

      <Block title="States">
        <ul className="border-ink/20 text-body text-ink border-t">
          <li className="border-ink/20 border-b py-3">
            <b>Rest</b> —{' '}
            <span className="text-ink">
              ink: bg-ink, text-frost. register: bg-horizon, text-ink, a
              ink border. outline: an ink border and label, no fill. All
              square, in brackets.
            </span>
          </li>
          <li className="border-ink/20 border-b py-3">
            <b>Hover</b> —{' '}
            <span className="text-ink">
              ink turns horizon with an ink label; register and outline both
              fill ink with a frost label. Hover one above to see it; it is a colour
              swap, not a transition.
            </span>
          </li>
          <li className="border-ink/20 border-b py-3">
            <b>Focus</b> —{' '}
            <span className="text-ink">
              a 2px ink outline at offset 2, on <b>focus-visible</b> only, so a
              mouse click never draws one. Tab into the row above to see it.
            </span>
          </li>
        </ul>
      </Block>

      <Block title="Why the ring stays one colour">
        <Rule>
          The ring is drawn at <b>outline-offset-2</b>, so what it has to stand
          out against is the surface around the button, not the button. Every
          button on the page sits on frost, where an ink ring measures 6.28:1 —
          one ring colour covers the whole page, the hero included.
        </Rule>
      </Block>
    </Entry>
  )
}

/* -------------------------------------------------------------------------- */

function LinkEntry() {
  return (
    <Entry
      name="ExternalLink · MailLink · LINK_ON_CLOUD · LINK_ON_FROST"
      path="src/components/ExternalLink.tsx"
      use="Every off-site link goes through ExternalLink; every mailto goes through MailLink; both take their colour rules from the two exported class strings."
    >
      <Block title="Props">
        <Props
          rows={[
            { name: 'ExternalLink href', type: 'string', note: 'Off-site links get target="_blank" rel="noopener noreferrer"; same-site paths navigate in place.' },
            { name: 'ExternalLink children', type: 'ReactNode', note: 'Link text.' },
            { name: 'ExternalLink …rest', type: 'AnchorHTMLAttributes', note: 'Everything else spreads onto the <a>.' },
            { name: 'MailLink email', type: 'string', note: 'Becomes href="mailto:{email}". No target — a mail client should not open a throwaway tab.' },
            { name: 'MailLink children', type: 'ReactNode', fallback: 'the email address', note: 'Optional; the address itself is the fallback label.' },
          ]}
        />
      </Block>

      <Block title="The two treatments">
        <div className="grid gap-4 sm:grid-cols-2">
          <Ground tone="cloud" label="LINK_ON_CLOUD">
            <ul className="flex flex-col gap-3">
              <li>
                <ExternalLink href={ORGANIZERS_ANCHOR} className={`text-body ${LINK_ON_CLOUD}`}>
                  Organizers
                </ExternalLink>
              </li>
              <li>
                <MailLink
                  email={CONTACT_EMAIL}
                  className={`text-body ${LINK_ON_CLOUD} underline underline-offset-4`}
                />
              </li>
            </ul>
            <Caption>Hover adds a thick underline.</Caption>
          </Ground>
          <Ground tone="frost" label="LINK_ON_FROST">
            <ul className="flex flex-col gap-3">
              <li>
                <ExternalLink href={ORGANIZERS_ANCHOR} className={`text-body ${LINK_ON_FROST}`}>
                  Organizers
                </ExternalLink>
              </li>
              <li>
                <MailLink
                  email={CONTACT_EMAIL}
                  className={`text-body ${LINK_ON_FROST} underline underline-offset-4`}
                />
              </li>
            </ul>
            <Caption>The same hover; the name records the surface.</Caption>
          </Ground>
        </div>
      </Block>

      <Block title="Why there are two">
        <Rule>
          A colour-change hover would fail contrast on the ice ground, and
          thickening an underline signals the same thing at no contrast cost.
          The two names remain so a call site still says what it sits on. Both strings carry the same ink focus
          ring at offset 4 (6.83:1 on cloud, 6.28:1 on frost), so the ring needs
          no per-surface variant. Typography is deliberately not in these
          strings — only the part that has a contrast answer.
        </Rule>
      </Block>
    </Entry>
  )
}

/* -------------------------------------------------------------------------- */

function LayoutEntry() {
  return (
    <Entry
      name="Container · Section · SectionHeader · Eyebrow"
      path="src/components/Layout.tsx"
      use="Compose these instead of re-declaring widths, gutters or vertical rhythm anywhere else."
    >
      <Block title="Container">
        <Props rows={[CHILDREN_ROW, CLASSNAME_ROW]} />
        <div className="border-ink/20 mt-4 rounded-xl border py-4">
          <Container>
            <div className="border-ink/20 text-caption text-ink rounded-lg border border-dashed p-4">
              The content column: <b>max-w-[120rem]</b>, centred, with{' '}
              <b>px-6</b> gutters and <b>sm:px-8</b> from 640px up.
            </div>
          </Container>
        </div>
      </Block>

      <Block title="Section">
        <Props
          rows={[
            { name: 'id', type: 'string', note: 'The anchor. Carries scroll-mt-24 so the fixed header never covers it.' },
            { name: 'labelledBy', type: 'string', fallback: 'undefined', note: 'id of the heading that names the landmark — pass the SectionHeader’s titleId.' },
            CHILDREN_ROW,
            CLASSNAME_ROW,
          ]}
        />
        <div className="border-ink/20 bg-frost mt-4 overflow-hidden rounded-xl border">
          <Section
            id="sheet-demo-section"
            labelledBy="sheet-demo-section-title"
            className="bg-frost"
          >
            <SectionHeader
              eyebrow="Section + SectionHeader"
              titleId="sheet-demo-section-title"
              title="A section band, with its standard masthead."
              lede="A Section is py-20 (sm:py-28) of vertical rhythm wrapped around a Container. A SectionHeader is the eyebrow, the display-lg headline and an optional lede, capped at max-w-2xl."
            />
          </Section>
        </div>
      </Block>

      <Block title="SectionHeader">
        <Props
          rows={[
            { name: 'eyebrow', type: 'string', note: 'Rendered through <Eyebrow>, as a <p>.' },
            { name: 'title', type: 'string', note: 'The <h2>. font-display, text-display-lg, text-balance.' },
            { name: 'titleId', type: 'string', note: 'id on the <h2>; this is what a Section’s labelledBy points at.' },
            { name: 'lede', type: 'string', fallback: 'undefined', note: 'Optional opening paragraph at text-lede.' },
            CLASSNAME_ROW,
          ]}
        />
        <Ground tone="cloud" label="without a lede" className="mt-4">
          <SectionHeader
            eyebrow="Things people ask us"
            titleId="sheet-demo-header-title"
            title="FAQ"
          />
        </Ground>
      </Block>

      <Block title="Eyebrow">
        <Props
          rows={[
            CHILDREN_ROW,
            { name: 'as', type: "'p' | 'h2'", fallback: "'p'", note: 'The element it renders as.' },
            CLASSNAME_ROW,
          ]}
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Ground tone="cloud" label="as=&quot;p&quot; (default)">
            <Eyebrow>What HackBU is</Eyebrow>
            <Caption>
              A caption above a heading that already exists. A second heading
              here would put a phantom entry in the document outline.
            </Caption>
          </Ground>
          <Ground tone="frost" label="as=&quot;h2&quot;">
            <Eyebrow as="h2">Club</Eyebrow>
            <Caption>
              Used in the footer, where each eyebrow really is the heading of
              its column of links.
            </Caption>
          </Ground>
        </div>
        <Rule>
          The colour is full <b>ink</b>, not <b>haze</b>, which cannot legibly
          carry 12px text. The slashes are decoration and stay out of the
          accessible name.
        </Rule>
      </Block>
    </Entry>
  )
}

/* -------------------------------------------------------------------------- */

const DIVIDERS = [
  {
    variant: 'drift-a' as const,
    where: 'Under the hero, and Registration → Questions.',
    what: 'A diagonal hairline rising to the right, with survey marks.',
  },
  {
    variant: 'drift-b' as const,
    where: 'Sponsors → Prize tracks.',
    what: 'The same construction falling to the right.',
  },
  {
    variant: 'drift-c' as const,
    where: 'Prize tracks → Registration.',
    what: 'A steep rise to the right.',
  },
  {
    variant: 'cloud-to-frost' as const,
    where: 'Questions → the footer; also Organizers intro → leadership.',
    what: 'A steeper fall, with two marks.',
  },
  {
    variant: 'frost-to-cloud' as const,
    where: 'Organizers leadership → the team roster.',
    what: 'A steeper rise, with two marks.',
  },
]

function DividerEntry() {
  return (
    <Entry
      name="SnowdriftDivider"
      path="src/components/SnowdriftDivider.tsx"
      use="Put one between two sections that would otherwise butt together. Never the same variant twice in a row."
    >
      <Block title="Props">
        <Props
          rows={[
            {
              name: 'variant',
              type: "'drift-a' | 'drift-b' | 'drift-c' | 'cloud-to-frost' | 'frost-to-cloud'",
              note: 'Picks the slope and where the marks fall. There is no other prop.',
            },
          ]}
        />
      </Block>

      <Block title="All five variants">
        <div className="flex flex-col gap-6">
          {DIVIDERS.map((divider) => (
            <div key={divider.variant}>
              <p className="text-caption text-ink font-medium">{divider.variant}</p>
              <p className="text-caption text-ink mt-1">
                {divider.where} {divider.what}
              </p>
              <div className="border-ink/20 mt-3 overflow-hidden rounded-xl border">
                <SnowdriftDivider variant={divider.variant} />
              </div>
            </div>
          ))}
        </div>
        <Caption>
          Each is <b>h-16</b>, or <b>h-24</b> from 640px up, with a{' '}
          <b>1440×96</b> viewBox stretched by{' '}
          <b>preserveAspectRatio="none"</b>. It is <b>aria-hidden</b> — the
          shapes carry no meaning.
        </Caption>
      </Block>

      <Block title="The rule">
        <Rule>
          A divider is one diagonal “ice cut”: an ink hairline over a faint
          horizon wedge. Rotate the variants so two in a row do not match.
        </Rule>
      </Block>
    </Entry>
  )
}

/* -------------------------------------------------------------------------- */

const STAGGER_ITEMS = [
  'First',
  'Second',
  'Third',
  'Fourth',
  'Fifth',
] as const

function RevealEntry({ animate }: { animate: boolean }) {
  const [run, setRun] = useState(0)
  const prefersReducedMotion = usePrefersReducedMotion()

  return (
    <Entry
      name="Reveal · RevealGroup · RevealItem"
      path="src/components/Reveal.tsx"
      use="Wrap a section header or a card in Reveal; wrap a list in RevealGroup and its members in RevealItem so they land one after another."
    >
      <Block title="Props">
        <Props
          rows={[
            { name: 'Reveal children', type: 'ReactNode', note: 'The block that fades up.' },
            { name: 'Reveal className', type: 'string', fallback: "''", note: 'On the motion.div wrapper.' },
            { name: 'Reveal delay', type: 'number', fallback: '0', note: 'Seconds to hold before starting. Groups use stagger instead.' },
            { name: 'RevealGroup as', type: "'div' | 'ul' | 'dl'", fallback: "'div'", note: 'So the reveal never costs the markup its semantics.' },
            { name: 'RevealItem as', type: "'div' | 'li'", fallback: "'div'", note: 'Carries no trigger of its own — the group drives it.' },
          ]}
        />
        <Caption>
          Timing, fixed in the module: 16px of upward travel, 0.55s,
          cubic-bezier(0.22, 0.61, 0.36, 1), viewport{' '}
          <b>{'{ once: true, amount: 0.2 }'}</b>, and{' '}
          <b>{'{ delayChildren: 0.05, staggerChildren: 0.12 }'}</b> on a group.
          Only opacity and transform animate, so a reveal never triggers layout.
        </Caption>
      </Block>

      <Block title="The stagger">
        <Ground tone="cloud">
          <RevealGroup
            key={run}
            as="ul"
            className="grid grid-cols-2 gap-3 sm:grid-cols-5"
          >
            {STAGGER_ITEMS.map((label) => (
              <RevealItem
                as="li"
                key={label}
                className="border-ink/20 bg-frost text-caption text-ink rounded-xl border p-4 text-center"
              >
                {label}
              </RevealItem>
            ))}
          </RevealGroup>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setRun((count) => count + 1)}
              className={`${TOGGLE_ON_CLOUD} text-caption rounded-none px-4 py-2`}
            >
              Replay
            </button>
            <p className="text-caption text-ink">
              {prefersReducedMotion
                ? 'Your system asks for reduced motion, so every reveal on this page renders at rest and nothing animates — including this one. That is the component’s own behaviour, not the sheet’s.'
                : animate
                  ? 'Reveals are live: the five tiles enter 0.12s apart. Replay remounts the group so it runs again.'
                  : 'Reveals are pinned to their resting frame. Switch the toggle in the sheet header to “on scroll”, then Replay, to watch the stagger.'}
            </p>
          </div>
        </Ground>
      </Block>

      <Block title="A standalone Reveal, with a delay">
        <Ground tone="cloud">
          <Reveal key={`a-${run}`}>
            <p className="text-body text-ink">
              This block reveals on its own, with no delay.
            </p>
          </Reveal>
          <Reveal key={`b-${run}`} delay={0.3}>
            <p className="text-body text-ink mt-3">
              …and this one is held 0.3s behind it.
            </p>
          </Reveal>
        </Ground>
      </Block>

      <Block title="What the sheet does to these, and why">
        <Rule>
          A reveal starts at <b>opacity: 0</b> and waits for an
          IntersectionObserver crossing. That is right on a landing page and
          wrong in a catalogue: anything that keeps the observer from firing — a
          background tab, a headless browser, a section that is never scrolled
          past — leaves the specimen invisible. So this sheet defaults to
          pinning every reveal to the frame its entrance would finish on, with a
          stylesheet rule in <b>src/sheet/sheet.css</b>, and the toggle in the
          header hands the real behaviour back. Nothing in{' '}
          <b>src/components/Reveal.tsx</b> knows the sheet exists.
        </Rule>
        <Caption>
          Reduced motion is the components’ own answer, not the sheet’s: when{' '}
          <b>usePrefersReducedMotion()</b> returns true each of these three drops
          its motion props entirely and paints its resting state on the first
          frame. Right now it reads{' '}
          <b>{prefersReducedMotion ? 'true' : 'false'}</b> in this browser.
        </Caption>
      </Block>
    </Entry>
  )
}

/* -------------------------------------------------------------------------- */

export function PrimitivesPart({ revealsAnimate }: { revealsAnimate: boolean }) {
  return (
    <SheetSection
      id="primitives"
      number="2"
      title="Primitives in isolation"
      intro="Each of these is imported from src/components/ and rendered here — nothing below is a copy of a component’s markup. Where a component has variants, all of them are on screen; where it has a rule, the rule is written beside it."
    >
      <WordmarkEntry />
      <ButtonEntry />
      <LinkEntry />
      <LayoutEntry />
      <DividerEntry />
      <RevealEntry animate={revealsAnimate} />
    </SheetSection>
  )
}
