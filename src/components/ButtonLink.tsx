import type { ReactNode } from 'react'
import { ExternalLink } from './ExternalLink'
import { TOGGLE_ON_CLOUD } from './controls'

/**
 * The site's button treatments. Size and tone are the only things that vary.
 *
 *   ink      solid ink, turning `horizon` on hover — the default, used by
 *             the content sections' buttons.
 *   register  horizon fill, ink label and border, ink fill with a frost
 *             label on hover — Register, and only Register. ink on horizon is
 *             4.99:1; horizon barely separates from the frost ground, so the
 *             ink border is what gives the button its edge.
 *   outline   ink border and label, ink fill on hover — the header's
 *             Discord link, demoted from the filled button it used to be so
 *             that Register is the only filled control in the bar. ink on
 *             frost is 6.28:1 for both the border and the label.
 *
 * register and outline share the border and the hover, so the two sit at the
 * same height side by side and differ only in the fill. ink has no border,
 * so the content sections' buttons are pixel-for-pixel what they were.
 */
type Size = 'sm' | 'md' | 'lg'
type Tone = 'ink' | 'register' | 'outline'

/**
 * The focus ring is drawn `outline-offset-2`, so the colour it has to stand out
 * against is whatever surrounds the button, not the button itself. Every button
 * sits on frost, where an ink ring reads at 6.28:1 — so one ring colour covers
 * the whole site.
 */
const BASE =
  'hud-btn inline-flex items-center justify-center gap-1 font-medium uppercase tracking-[0.06em] ' +
  'focus-visible:outline-ink focus-visible:outline-2 focus-visible:outline-offset-2'

/**
 * register and outline are TOGGLE_ON_CLOUD's ink edge and hover, reused
 * rather than retyped so a retune of that constant reaches the header too;
 * register adds only the horizon fill (the hover's ink fill overrides it).
 */
const TONES: Record<Tone, string> = {
  ink: 'bg-ink text-frost hover:bg-horizon hover:text-ink',
  register: `${TOGGLE_ON_CLOUD} bg-horizon`,
  outline: TOGGLE_ON_CLOUD,
}

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-2 text-[0.75rem]',
  md: 'px-5 py-3 text-caption',
  lg: 'px-7 py-4 text-body',
}

export function ButtonLink({
  href,
  children,
  size = 'md',
  tone = 'ink',
  className = '',
  ...rest
}: {
  href: string
  children: ReactNode
  size?: Size
  tone?: Tone
  className?: string
  onClick?: () => void
  'aria-current'?: 'page'
}) {
  return (
    <ExternalLink
      href={href}
      className={`${BASE} ${TONES[tone]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {children}
    </ExternalLink>
  )
}
