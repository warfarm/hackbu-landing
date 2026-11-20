import type { ReactNode } from 'react'
import { Block, Caption, Entry, Rule, SheetSection, Stage } from '../kit'
import { SiteHeader } from '../../components/SiteHeader'
import { SiteFooter } from '../../components/SiteFooter'
import { AboutSection } from '../../components/sections/AboutSection'
import { GetInvolvedSection } from '../../components/sections/GetInvolvedSection'
import { QuestionsSection } from '../../components/sections/QuestionsSection'
import { ContactSection } from '../../components/sections/ContactSection'
import { PrizeTracksSection } from '../../components/sections/PrizeTracksSection'

/**
 * Part 3 — the composed pieces, rendered exactly as the page renders them.
 *
 * Each of these takes no props: the copy, the links and the layout are the
 * component. What varies between them is which ground they sit on and which
 * link treatment that forces, which is what the notes below record.
 */

/** None of the composed components take props; say so once, in the same shape. */
function NoProps({ children }: { children: ReactNode }) {
  return (
    <Block title="Props">
      <p className="text-body text-ink">
        None. <span className="text-ink">{children}</span>
      </p>
    </Block>
  )
}

export function ComposedPart() {
  return (
    <SheetSection
      id="composed"
      number="3"
      title="Composed, as used"
      intro="The header, content sections and the footer — imported from src/components/ and rendered here unmodified. The landing page now runs: header, hero, drift-a, SponsorsPreview, drift-b, PrizeTracks, drift-c, Register, drift-a, Questions, cloud-to-frost, footer. About, Get involved and Contact are no longer on the landing page and are kept here for reference."
    >
      <Entry
        name="SiteHeader"
        path="src/components/SiteHeader.tsx"
        use="The fixed page bar: the lockup, three text destinations, Discord as an outlined link and Register as the one filled button. Below 1024px the links and Discord collapse behind a toggle; Register stays in the bar."
      >
        <NoProps>
          It reads NAV_LINKS, DISCORD_URL and REGISTER_PATH from src/lib/links.ts and owns one
          piece of state — whether the compact menu is open.
        </NoProps>

        <Block title="As rendered">
          <Stage
            label="SiteHeader — live"
            note="Below 1024px the links and Discord collapse and Register stays in the bar; the toggle here is real, so open and close it. Escape closes the panel and returns focus to the button."
            className="sheet-fixed-frame bg-frost relative h-[26rem] overflow-hidden"
          >
            <SiteHeader />
            <div className="px-6 pt-24 sm:px-8 sm:pt-28">
              <p className="text-caption text-ink max-w-md">
                The header is <b>position: fixed</b>. This frame carries a
                transform, which makes it the containing block for fixed
                descendants — so the bar pins to the top of the frame instead of
                to the sheet’s viewport. On the real page it pins to the
                viewport and content scrolls under it, as this filler copy is
                doing.
              </p>
            </div>
          </Stage>
        </Block>

        <Block title="Notes">
          <Rule>
            The bar is <b>h-16</b> below 640px and <b>h-20</b> from there up, and
            everything that has to clear it — the scroll anchors’{' '}
            <b>scroll-mt-24</b>, the <b>scroll-padding-top</b> in{' '}
            <b>src/index.css</b> — is written against those two numbers. Both the
            bar and the compact panel are translucent frost, and every link
            inside takes <b>LINK_ON_CLOUD</b>’s underline hover.
          </Rule>
          <Caption>
            The compact panel stays mounted and is hidden with the{' '}
            <b>hidden</b> attribute, so <b>aria-controls</b> always resolves to a
            real element. The toggle is a real <b>&lt;button&gt;</b> with{' '}
            <b>aria-expanded</b>, and the lockup’s <b>aria-label</b> is what
            gives the home link its accessible name — the marks are empty
            elements with no text to fall back on.
          </Caption>
        </Block>
      </Entry>

      <Entry
        name="AboutSection"
        path="src/components/sections/AboutSection.tsx"
        use="The club’s mission statement with the Discord and mailing-list CTAs, beside a block of ice. It is no longer on a public page."
      >
        <NoProps>Copy is written into the component.</NoProps>
        <Block title="As rendered">
          <Stage
            label="AboutSection"
          >
            <AboutSection />
          </Stage>
        </Block>
        <Block title="Notes">
          <Rule>
            The hero above it carries the page’s <b>&lt;h1&gt;</b> — the
            “HackBU 2027” lockup, on the page’s frost ground across the bottom of the 3D
            scene — so this section’s heading
            is an <b>&lt;h2&gt;</b> and the outline runs h1 → h2 with no skipped
            level. (When the hero was an illustration, cloud text over its
            painted sky measured <b>1.43:1</b> and the copy lived down here
            instead.)
          </Rule>
        </Block>
      </Entry>

      <Entry
        name="GetInvolvedSection"
        path="src/components/sections/GetInvolvedSection.tsx"
        use="The conversion section: the lg Discord button in a frost card, with the mailing list as a text link beside it."
      >
        <NoProps>
          Reads DISCORD_URL and MAILING_LIST_URL from src/lib/links.ts.
        </NoProps>
        <Block title="As rendered">
          <Stage
            label="GetInvolvedSection — cloud band, frost card"
            note="The only section with two grounds in it."
          >
            <GetInvolvedSection />
          </Stage>
        </Block>
        <Block title="Notes">
          <Rule>
            The card is frost, so the mailing-list link inside it uses{' '}
            <b>LINK_ON_FROST</b> and underlines on hover. A colour-change hover
            would fail contrast on the ice ground.
          </Rule>
          <Caption>
            The button here is the one call site that stretches the{' '}
            <b>lg</b> size further, with <b>sm:px-10 sm:py-5</b> through{' '}
            <b>className</b>.
          </Caption>
        </Block>
      </Entry>

      <Entry
        name="QuestionsSection"
        path="src/components/sections/QuestionsSection.tsx"
        use="FAQ disclosures newcomers actually ask."
      >
        <NoProps>
          The questions are a const array inside the file; one panel opens at a
          time.
        </NoProps>
        <Block title="As rendered">
          <Stage
            label="QuestionsSection"
            note="RevealGroup of disclosure rows; each question is a button that toggles its answer."
          >
            <QuestionsSection />
          </Stage>
        </Block>
        <Block title="Notes">
          <Caption>
            This is the section whose <b>SectionHeader</b> has no lede — the
            questions are the content, and a paragraph introducing them would
            only delay them. Answers stay collapsed until opened so eight items
            stay scannable.
          </Caption>
        </Block>
      </Entry>

      <Entry
        name="PrizeTracksSection"
        path="src/components/sections/PrizeTracksSection.tsx"
        use="The prize tracks, as a wall of ice blocks laid in an igloo's courses — two on top, three below. Choosing a block lifts it out of the wall and shows the track in full in the panel beside it. It sits between the sponsors and registration sections on the landing page."
      >
        <NoProps>
          The five tracks, their descriptions and the judging criteria are
          const arrays inside the file, sourced from HackBU 2026’s event post
          and Devpost page.
        </NoProps>
        <Block title="As rendered">
          <Stage
            label="PrizeTracksSection"
            note="Live: click a block, or tab to the wall and use the arrow keys. With WebGL the chosen block comes out in front of the 3D wall and glows while the others dim (at once, under reduced motion); in the CSS fallback it rises and gets an ink rim (the rim alone under reduced motion)."
          >
            <PrizeTracksSection />
          </Stage>
        </Block>
        <Block title="Notes">
          <Rule>
            The wall is a WAI-ARIA <b>tablist</b> and the panel its{' '}
            <b>tabpanel</b>: Tab reaches the chosen block, the arrow keys, Home
            and End move between blocks and show each as they land. The first
            track is chosen from the start, so the prerendered HTML already
            holds a full panel.
          </Rule>
          <Caption>
            Where WebGL runs the blocks are 3D ice (<b>src/three/iceWall.ts</b>),
            drawn behind the buttons with each track etched into its face;
            otherwise they are CSS — gradients of <b>cloud</b>, <b>frost</b>{' '}
            and <b>horizon</b>, a bevel of inset shadows, chamfered corners
            where the browser supports <b>corner-shape</b> — in the{' '}
            <b>.ice-*</b> block of <b>src/index.css</b>.
          </Caption>
        </Block>
      </Entry>

      <Entry
        name="ContactSection"
        path="src/components/sections/ContactSection.tsx"
        use="The last content section: the organisers’ address and the workshop archive, both as display-sized links."
      >
        <NoProps>
          Reads CONTACT_EMAIL and ORGANIZERS_ANCHOR from src/lib/links.ts.
        </NoProps>
        <Block title="As rendered">
          <Stage
            label="ContactSection — on cloud"
            note="MailLink and ExternalLink at display-md with an 8px underline offset — the two links are the section."
          >
            <ContactSection />
          </Stage>
        </Block>
        <Block title="Notes">
          <Caption>
            Both links take <b>LINK_ON_CLOUD</b> and underline on hover.
          </Caption>
        </Block>
      </Entry>

      <Entry
        name="SiteFooter"
        path="src/components/SiteFooter.tsx"
        use="Every hackbu.org page, the contact address and the club’s accounts. The page ends on frost."
      >
        <NoProps>
          Reads SITE_PAGES, SOCIAL_LINKS and CONTACT_EMAIL from
          src/lib/links.ts; the copyright year comes from the clock.
        </NoProps>
        <Block title="As rendered">
          <Stage
            label="SiteFooter — on frost"
            note="Four columns from 768px up: the lockup, then Club / More / Follow."
          >
            <SiteFooter />
          </Stage>
        </Block>
        <Block title="Notes">
          <Rule>
            Every link here is <b>LINK_ON_FROST</b>, and each column title is an{' '}
            <b>Eyebrow as="h2"</b> — in the footer an eyebrow really is the
            heading of the list beneath it, which is the whole reason the{' '}
            <b>as</b> prop exists.
          </Rule>
        </Block>
      </Entry>
    </SheetSection>
  )
}
