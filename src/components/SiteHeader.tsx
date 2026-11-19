import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Container } from './Layout'
import { Wordmark } from './Wordmark'
import { ExternalLink, LINK_ON_CLOUD } from './ExternalLink'
import { TOGGLE_ON_CLOUD } from './controls'
import { ButtonLink } from './ButtonLink'
import { DecodeHeadings } from './DecodeHeadings'
import { DISCORD_URL, NAV_LINKS, REGISTER_PATH } from '../lib/links'

/**
 * Fixed page header: the HackBU logo lockup, three text destinations, Discord
 * as an outlined link and Register as the bar's one filled button.
 *
 * Register is the action the whole site exists for, so it is the loudest
 * thing in the bar: the one filled control, in horizon (the accent, and the
 * colour behind the hero's "2027") where everything else is ink on frost. Discord used to hold that fill and is
 * now outlined beside it. See the tones in ButtonLink.tsx.
 *
 * The bar is `h-16` (4rem) below `sm` and `h-20` (5rem) from `sm` up; anything
 * that needs to clear it (the hero content, scroll anchors) uses those numbers.
 *
 * Below `lg` (1024px) the text links and Discord collapse behind a toggle —
 * they don't fit beside the lockup at tablet widths — but Register stays in
 * the bar at every width, so on a phone it is one tap away rather than two.
 * It sits inside the `Primary` <nav> either way: below `lg` that landmark
 * holds Register alone, and the compact panel holds the rest.
 *
 * The toggle is a real <button> — Enter/Space operate it, Escape closes it,
 * and the panel it controls stays in the DOM so `aria-controls` always
 * resolves.
 *
 * The bar and the compact panel are translucent frost over a blur, so every
 * link inside takes the underline hover. See LINK_ON_CLOUD in ExternalLink.tsx.
 *
 * Off-site destinations go through <ExternalLink> (new tab). In-site ones
 * (About us, Sponsors, Hackathons) are ordinary same-tab anchors.
 *
 * `intro` slides the bar in from above the viewport on page load — the
 * landing page's opening beat, timed with the hero copy (see the intro
 * keyframes in src/index.css). Off by default so the inner pages and the
 * component sheet render the bar in place.
 */

const NAV_LINK_CLASSES = `text-[0.75rem] font-medium uppercase tracking-[0.08em] ${LINK_ON_CLOUD}`

function isExternalHref(href: string) {
  return href.startsWith('http://') || href.startsWith('https://')
}

export function SiteHeader({
  homeHref = '/',
  currentHref,
  intro = false,
}: {
  /** Lockup destination. Landing uses `#top`; other pages use `/`. */
  homeHref?: string
  /** Marks the matching nav item as the current page. */
  currentHref?: string
  /** Slide the bar in from the top on load. Landing only. */
  intro?: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setMenuOpen(false)
      // Focus would otherwise be stranded on a link inside the hidden panel,
      // restarting Tab from the top of the page.
      toggleRef.current?.focus()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  return (
    <header
      className={`border-ink/20 bg-frost/85 fixed inset-x-0 top-0 z-50 border-b backdrop-blur-md ${
        intro ? 'animate-intro-bar motion-reduce:animate-none' : ''
      }`}
    >
      <DecodeHeadings />
      <Container className="flex h-16 items-center justify-between sm:h-20">
        <a
          href={homeHref}
          className="focus-visible:outline-ink rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {/*
           * One step smaller below 360px: with Register in the bar beside
           * the toggle, the full-size lockup ran the toggle 7px off a 320px
           * screen.
           */}
          <Wordmark className="text-base min-[360px]:text-lg min-[420px]:text-2xl sm:text-3xl" />
        </a>

        <div className="flex items-center gap-3">
          <nav aria-label="Primary" className="flex items-center gap-5">
            {NAV_LINKS.map((link) => (
              <NavItem
                key={link.label}
                href={link.href}
                current={link.href === currentHref}
                className={`${NAV_LINK_CLASSES} hidden lg:inline`}
              >
                {link.label}
              </NavItem>
            ))}
            {/*
             * The wrapper owns the breakpoint: ButtonLink's own `inline-flex`
             * would beat a `hidden` passed in through `className`, since the
             * two are the same property and the stylesheet's order decides.
             */}
            <span className="hidden lg:contents">
              <ButtonLink href={DISCORD_URL} size="sm" tone="outline">
                Discord
              </ButtonLink>
            </span>
            <ButtonLink
              href={REGISTER_PATH}
              size="sm"
              tone="register"
              aria-current={currentHref === REGISTER_PATH ? 'page' : undefined}
              // The site's primary action: below `lg` it sits beside the
              // 42px menu toggle and gets a matching hit area.
              className="max-lg:min-h-11 max-[359px]:px-2 max-[359px]:before:hidden max-[359px]:after:hidden"
            >
              Register
            </ButtonLink>
          </nav>

          <button
            ref={toggleRef}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="primary-menu"
            onClick={() => setMenuOpen((open) => !open)}
            className={`${TOGGLE_ON_CLOUD} inline-flex items-center justify-center p-2 lg:hidden`}
          >
            <span className="sr-only">
              {menuOpen ? 'Close menu' : 'Open menu'}
            </span>
            <MenuGlyph open={menuOpen} />
          </button>
        </div>
      </Container>

      {/* Stays mounted so aria-controls always points at a real element. */}
      <div
        id="primary-menu"
        hidden={!menuOpen}
        className="border-ink/20 border-t lg:hidden"
      >
        <Container className="py-4">
          <nav aria-label="Primary — compact" className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <NavItem
                key={link.label}
                href={link.href}
                current={link.href === currentHref}
                className={`${NAV_LINK_CLASSES} px-2 py-3`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </NavItem>
            ))}
            <ButtonLink
              href={DISCORD_URL}
              size="md"
              tone="outline"
              className="mt-3"
              onClick={() => setMenuOpen(false)}
            >
              Join the Discord
            </ButtonLink>
          </nav>
        </Container>
      </div>
    </header>
  )
}

function NavItem({
  href,
  current,
  className,
  onClick,
  children,
}: {
  href: string
  current?: boolean
  className: string
  onClick?: () => void
  children: ReactNode
}) {
  if (isExternalHref(href)) {
    return (
      <ExternalLink href={href} className={className} onClick={onClick}>
        {children}
      </ExternalLink>
    )
  }

  return (
    <a
      href={href}
      className={className}
      aria-current={current ? 'page' : undefined}
      onClick={onClick}
    >
      {children}
    </a>
  )
}

function MenuGlyph({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    >
      {open ? (
        <>
          <path d="M6 6 L18 18" />
          <path d="M18 6 L6 18" />
        </>
      ) : (
        <>
          <path d="M4 8 H20" />
          <path d="M4 16 H20" />
        </>
      )}
    </svg>
  )
}
