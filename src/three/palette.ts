import type { SnowPalette } from './snowScene'

/**
 * The palette tokens the WebGL scenes read. `.snow-scene` (src/index.css)
 * republishes each `@theme` colour as `--snow-<name>`, so the scenes never
 * write a hex of their own.
 */
const TOKENS = [
  'sky',
  'horizon',
  'cloud',
  'frost',
  'haze',
  'ink',
  'fern',
  'brick',
  'stone',
] as const

/** Read the palette from a `.snow-scene` element; null if any token is missing. */
export function readPalette(element: HTMLElement): SnowPalette | null {
  const style = getComputedStyle(element)
  const read = (token: (typeof TOKENS)[number]) =>
    style.getPropertyValue(`--snow-${token}`).trim()
  const palette: SnowPalette = {
    sky: read('sky'),
    horizon: read('horizon'),
    cloud: read('cloud'),
    frost: read('frost'),
    haze: read('haze'),
    ink: read('ink'),
    fern: read('fern'),
    brick: read('brick'),
    stone: read('stone'),
  }
  return TOKENS.every((token) => palette[token] !== '') ? palette : null
}
