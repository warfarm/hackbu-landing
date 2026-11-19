import { useEffect } from 'react'

/**
 * Headings and labels "decode" as they scroll into view: each character cycles
 * through a few glyphs and settles, left to right.
 *
 * It lives in one place and is mounted once per page (by <SiteHeader>, which
 * every page has) rather than wrapping each heading, so no section needs to
 * know about it. It renders nothing.
 *
 * The real text is never touched. For the length of the effect it is made
 * transparent, which leaves it in place for layout, selection and assistive
 * technology, and a temporary `aria-hidden` copy on top does the scrambling.
 * The copy is absolutely positioned, so nothing around it can move, and with
 * no JavaScript or under reduced motion none of this ever happens.
 */

const SELECTOR = 'main h1, main h2, .hud-label'
/** No hyphens or slashes: those would add line-break opportunities. */
const GLYPHS = '#=<>_01X'
const FRAME_MS = 45

function textNodes(element: Element): Text[] {
  const nodes: Text[] = []
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const node = walker.currentNode as Text
    if (!node.parentElement?.closest('.sr-only')) nodes.push(node)
  }
  return nodes
}

export function DecodeHeadings() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const running = new Set<() => void>()

    const decode = (element: HTMLElement) => {
      const style = getComputedStyle(element)
      const layer = document.createElement('span')
      layer.setAttribute('aria-hidden', 'true')
      if (element.classList.contains('hud-label')) layer.className = 'hud-label'
      layer.innerHTML = element.innerHTML
      Object.assign(layer.style, {
        position: 'absolute',
        inset: '0',
        display: 'block',
        padding: style.padding,
        color: style.color,
        pointerEvents: 'none',
      })

      const nodes = textNodes(layer)
      const originals = nodes.map((node) => node.data)
      const length = originals.reduce((sum, text) => sum + text.length, 0)
      if (length === 0) return

      const previous = {
        color: element.style.color,
        position: element.style.position,
      }
      if (style.position === 'static') element.style.position = 'relative'
      element.style.color = 'transparent'
      element.append(layer)

      const duration = Math.min(900, 260 + length * 24)
      const started = performance.now()
      let lastFrame = 0
      let raf = 0

      const restore = () => {
        cancelAnimationFrame(raf)
        layer.remove()
        element.style.color = previous.color
        element.style.position = previous.position
        running.delete(restore)
      }

      const tick = (now: number) => {
        const settled = Math.floor(((now - started) / duration) * length)
        if (settled >= length) {
          restore()
          return
        }
        raf = requestAnimationFrame(tick)
        if (now - lastFrame < FRAME_MS) return
        lastFrame = now
        let index = 0
        nodes.forEach((node, i) => {
          let next = ''
          for (const char of originals[i] ?? '') {
            next +=
              index < settled || char.trim() === ''
                ? char
                : GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length))
            index += 1
          }
          node.data = next
        })
      }

      running.add(restore)
      raf = requestAnimationFrame(tick)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          observer.unobserve(entry.target)
          if (entry.target instanceof HTMLElement) decode(entry.target)
        }
      },
      { threshold: 0.4 },
    )
    document.querySelectorAll(SELECTOR).forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
      for (const restore of running) restore()
    }
  }, [])

  return null
}
