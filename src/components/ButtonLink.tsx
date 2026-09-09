import type { ReactNode } from 'react'
import { ExternalLink } from './ExternalLink'

/**
 * The page's only button treatment: solid pine, reserved for the Discord
 * conversion action. Size is the only thing that varies.
 *
 * pine is the site's primary green (text, focus rings, controls), so the
 * button reads as HackBU rather than a separate terracotta accent. Hover
 * swaps to brick — the one warm accent — for a clear pressed/hover change.
 */
type Size = 'sm' | 'md' | 'lg'

/**
 * The focus ring is drawn `outline-offset-2`, so the colour it has to stand out
 * against is whatever surrounds the button, not the button itself. Every button
 * on the page now sits on cloud or frost, where a pine ring reads at 6.83:1 and
 * 5.76:1 respectively — so one ring colour covers the whole page.
 */
const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium ' +
  'bg-pine text-cloud hover:bg-brick ' +
  'focus-visible:outline-pine focus-visible:outline-2 focus-visible:outline-offset-2'

const SIZES: Record<Size, string> = {
  sm: 'px-4 py-2 text-caption',
  md: 'px-6 py-3 text-body',
  lg: 'px-8 py-4 text-lede',
}

export function ButtonLink({
  href,
  children,
  size = 'md',
  className = '',
  ...rest
}: {
  href: string
  children: ReactNode
  size?: Size
  className?: string
  onClick?: () => void
}) {
  return (
    <ExternalLink
      href={href}
      className={`${BASE} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {children}
    </ExternalLink>
  )
}
