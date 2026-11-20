import {
  ACESFilmicToneMapping,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DataTexture,
  DirectionalLight,
  DoubleSide,
  DynamicDrawUsage,
  Fog,
  Group,
  FloatType,
  HalfFloatType,
  HemisphereLight,
  IcosahedronGeometry,
  InstancedBufferAttribute,
  InstancedMesh,
  LinearFilter,
  LinearMipmapLinearFilter,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NoColorSpace,
  NoToneMapping,
  Object3D,
  PCFShadowMap,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  PMREMGenerator,
  Points,
  Quaternion,
  Raycaster,
  RedFormat,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Texture,
  Vector2,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { HERO_INTRO_SECONDS } from '../lib/motion'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import {
  mergeGeometries,
  mergeVertices,
} from 'three/addons/utils/BufferGeometryUtils.js'

/**
 * The 3D scenes of the ice redesign.
 *
 * Everything is built here, procedurally. The only files fetched are the two
 * logo masks in public/brand/ (the same ones the header paints), plus this
 * chunk and three.js. It is imported
 * dynamically by `SnowCanvas.tsx`, which keeps it out of every page's first
 * load and out of the prerender.
 *
 *   hero    the HackBU logo lying in a hazy mountain snowfield, buried under
 *           snow that the pointer brushes away; the lettering glows through
 *           the thinner snow. Lit by a low sun and the sky itself, with snow
 *           glints, ground mist, bloom and a film finish.
 *   pine    a block of ice tumbling as it scrolls past, a small pine frozen
 *           inside it.
 *   igloo   the same, with a miniature igloo inside.
 *
 * The art direction follows igloo.inc (a monochrome world, one glow colour,
 * form lit from within) but every shape, shader and number here is our own.
 *
 * Colour: every colour comes in through `SnowPalette`, which `SnowCanvas` reads
 * from the `@theme` tokens at runtime — nothing here names a hex. Bright values
 * are those tokens multiplied past 1, which is what the bloom pass keys on.
 *
 * Determinism: placement uses a seeded PRNG, not `Math.random`, so the world is
 * the same on every load and in every screenshot.
 */

export type SnowVariant = 'hero' | 'pine' | 'igloo'

export type SnowPalette = {
  sky: string
  horizon: string
  cloud: string
  frost: string
  haze: string
  ink: string
  fern: string
  brick: string
  stone: string
}

export type SnowSceneOptions = {
  /** False under reduced motion: no falling snow, no drift, a still frame. */
  animate: boolean
  /** Small screens: a coarser world, no bloom. */
  lowPower: boolean
}

/**
 * Hero only: the text pressed into the snow — a heading above the logo, and
 * [label, value] facts in columns below it.
 */
export type SnowEtching = {
  heading?: string
  facts: readonly (readonly [string, string])[]
}

export type SnowSceneHandle = {
  /** Resolves when the scene has everything it needs to draw a true frame. */
  ready: Promise<void>
  /** CSS-pixel size of the canvas box, and the device pixel ratio to draw at. */
  resize: (width: number, height: number, dpr: number) => void
  /**
   * Hero only: the band of the box, in CSS pixels from its top, that the
   * page's copy leaves free. The camera frames the logo inside it.
   */
  setBand: (top: number, bottom: number) => void
  /**
   * Draw one frame. `progress` is 0..1: the hero's eased scroll position, or
   * how far a vignette has travelled through the viewport. `pointerX/Y` are
   * -1..1 across the window.
   */
  render: (
    seconds: number,
    progress: number,
    pointerX: number,
    pointerY: number,
    /** Hero only: where the pointer is right now, unsmoothed, or null. */
    brush?: { x: number; y: number } | null,
  ) => void
  /**
   * Hero only: the text pressed into the snow (`SnowEtching`). Takes effect
   * on the next frame drawn.
   */
  setEtching: (etching: SnowEtching) => void
  /**
   * Hero only: end the current stroke, so the next brush starts a new one
   * instead of joining to the last point with a straight trench. For when
   * sampling stops — the loop pauses, or the page moves under the pointer
   * between draws.
   */
  lift: () => void
  dispose: () => void
}

type Disposable = { dispose: () => void }

/* -------------------------------------------------------------------------- */
/* Small maths                                                                */
/* -------------------------------------------------------------------------- */

/** mulberry32 — a tiny seeded PRNG, good enough for scattering trees. */
function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

function smoothstep(from: number, to: number, value: number): number {
  const t = clamp01((value - from) / (to - from))
  return t * t * (3 - 2 * t)
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** A repeatable 0..1 value for an integer lattice point. */
function latticeHash(ix: number, iz: number, seed: number): number {
  let h = (Math.imul(ix, 374761393) + Math.imul(iz, 668265263) + Math.imul(seed, 1442695041)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/**
 * Smooth value noise, 0..1. With a `period` the lattice wraps, so the result
 * tiles — which is what the snow-grain texture needs.
 */
function valueNoise(x: number, z: number, seed: number, period = 0): number {
  const ix = Math.floor(x)
  const iz = Math.floor(z)
  const fx = x - ix
  const fz = z - iz
  const u = fx * fx * (3 - 2 * fx)
  const v = fz * fz * (3 - 2 * fz)
  const wrap = (n: number) => (period > 0 ? ((n % period) + period) % period : n)
  const a = latticeHash(wrap(ix), wrap(iz), seed)
  const b = latticeHash(wrap(ix + 1), wrap(iz), seed)
  const c = latticeHash(wrap(ix), wrap(iz + 1), seed)
  const d = latticeHash(wrap(ix + 1), wrap(iz + 1), seed)
  return mix(mix(a, b, u), mix(c, d, u), v)
}

/** Three octaves of value noise, 0..1. */
function fbm(x: number, z: number, seed: number): number {
  return (
    valueNoise(x, z, seed) * 0.58 +
    valueNoise(x * 2.1, z * 2.1, seed + 1) * 0.28 +
    valueNoise(x * 4.3, z * 4.3, seed + 2) * 0.14
  )
}

/** Distance from (px, pz) to the segment (ax, az) → (bx, bz). */
function distanceToSegment(
  px: number,
  pz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
): number {
  const dx = bx - ax
  const dz = bz - az
  const t = clamp01(((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz))
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t))
}

/* -------------------------------------------------------------------------- */
/* Shared parts                                                               */
/* -------------------------------------------------------------------------- */

/**
 * A small tiling grey-noise texture, used as the snow's bump map: it breaks
 * the highlight up into grain so the field reads as snow rather than paint.
 * Generated here (a few KB of bytes at runtime) rather than downloaded.
 */
function buildSnowGrain(): DataTexture {
  const size = 128
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const coarse = valueNoise(x / 16, y / 16, 21, size / 16)
      const fine = valueNoise(x / 4, y / 4, 22, size / 4)
      const speck = valueNoise(x, y, 23, size)
      const value = Math.round((coarse * 0.45 + fine * 0.35 + speck * 0.2) * 255)
      const offset = (y * size + x) * 4
      data[offset] = value
      data[offset + 1] = value
      data[offset + 2] = value
      data[offset + 3] = 255
    }
  }
  const texture = new DataTexture(data, size, size)
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.colorSpace = NoColorSpace
  // A DataTexture defaults to nearest-neighbour with no mipmaps, which makes
  // the grain crawl and moire as the camera moves. Filter it like an image.
  texture.magFilter = LinearFilter
  texture.minFilter = LinearMipmapLinearFilter
  texture.generateMipmaps = true
  texture.needsUpdate = true
  return texture
}

/**
 * One pine, about 6.5 units tall before the instance scale.
 *
 * The canopy is nine tiers of boughs. Each tier is a skirt: it leaves the
 * trunk steeply, sweeps out and droops at the tips, and its rim is ragged —
 * every other tip is pulled in and each is nudged at random — so the outline
 * is branches rather than a cone. Underneath each skirt is a second surface
 * running back to the trunk, which is what the low camera sees: dark green.
 *
 * Colour is painted per vertex from the surface normal: whatever faces up
 * carries snow, whatever faces down or sideways is needle green, darker
 * toward the trunk. Instances only turn about the vertical, so the normal in
 * the model is the normal in the world.
 */
function buildPine(pine: Color, snow: Color, bark: Color): BufferGeometry {
  const random = seeded(4242)
  const positions: number[] = []
  const indices: number[] = []
  /** Distance from the trunk, 0..1, per vertex — for the inner shading. */
  const reach: number[] = []
  const TIERS = 9
  const SEGMENTS = 18

  const vertex = (x: number, y: number, z: number, out: number): number => {
    positions.push(x, y, z)
    reach.push(out)
    return positions.length / 3 - 1
  }

  for (let tier = 0; tier < TIERS; tier += 1) {
    const t = tier / (TIERS - 1)
    const radius = mix(2.15, 0.42, Math.pow(t, 0.85))
    const rise = mix(1.5, 1.05, t)
    const y0 = 0.95 + t * 4.55
    const droop = radius * 0.3
    const twist = random() * Math.PI * 2

    const apex = vertex(0, y0 + rise, 0, 0)
    const hub = vertex(0, y0 + 0.2, 0, 0)
    const mid: number[] = []
    const rimTop: number[] = []
    const rimUnder: number[] = []
    const inner: number[] = []

    for (let i = 0; i < SEGMENTS; i += 1) {
      const angle = twist + (i / SEGMENTS) * Math.PI * 2
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      const midRadius = radius * (0.42 + random() * 0.1)
      mid.push(vertex(cos * midRadius, y0 + rise * 0.4, sin * midRadius, 0.45))
      const tip = radius * (i % 2 === 0 ? 1 : 0.74) * (0.86 + random() * 0.28)
      const tipY = y0 - droop * (0.45 + random() * 0.9)
      // The rim is doubled so the top of a bough and its underside keep
      // their own normals — otherwise the snow line blurs into the green.
      rimTop.push(vertex(cos * tip, tipY, sin * tip, 1))
      rimUnder.push(vertex(cos * tip, tipY, sin * tip, 1))
      inner.push(vertex(cos * radius * 0.3, y0 + 0.08, sin * radius * 0.3, 0.3))
    }

    for (let i = 0; i < SEGMENTS; i += 1) {
      const j = (i + 1) % SEGMENTS
      const m0 = mid[i] ?? 0
      const m1 = mid[j] ?? 0
      const r0 = rimTop[i] ?? 0
      const r1 = rimTop[j] ?? 0
      const u0 = rimUnder[i] ?? 0
      const u1 = rimUnder[j] ?? 0
      const n0 = inner[i] ?? 0
      const n1 = inner[j] ?? 0
      // Top of the bough, wound to face up and out.
      indices.push(apex, m1, m0)
      indices.push(m0, m1, r1, m0, r1, r0)
      // Underside, wound to face down.
      indices.push(u0, u1, n1, u0, n1, n0)
      indices.push(hub, n0, n1)
    }
  }

  const canopy = new BufferGeometry()
  canopy.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(positions), 3),
  )
  canopy.setIndex(indices)
  canopy.computeVertexNormals()

  const normal = canopy.getAttribute('normal')
  const colours = new BufferAttribute(new Float32Array(normal.count * 3), 3)
  const colour = new Color()
  const shade = new Color()
  for (let i = 0; i < normal.count; i += 1) {
    const up = normal.getY(i)
    const out = reach[i] ?? 1
    // Needles: darker under the boughs and in toward the trunk.
    const light =
      mix(0.5, 1, clamp01(up * 0.5 + 0.5)) *
      mix(0.62, 1, out) *
      (0.86 + random() * 0.28)
    shade.copy(pine).multiplyScalar(light)
    // Snow lies on the outer, flatter part of each bough; in toward the
    // trunk the tier above shelters it, so the needles show green there.
    const lying = smoothstep(0.5, 0.82, up + (random() - 0.5) * 0.3)
    const exposed = smoothstep(0.38, 0.95, out + (random() - 0.5) * 0.25)
    colour.copy(shade).lerp(snow, lying * exposed)
    colours.setXYZ(i, colour.r, colour.g, colour.b)
  }
  canopy.setAttribute('color', colours)

  const trunk = new CylinderGeometry(0.16, 0.3, 2.4, 8)
  trunk.translate(0, 1.2, 0)
  trunk.deleteAttribute('uv')
  const trunkColours = new BufferAttribute(
    new Float32Array(trunk.getAttribute('position').count * 3),
    3,
  )
  shade.copy(bark).multiplyScalar(0.55)
  for (let i = 0; i < trunkColours.count; i += 1) {
    trunkColours.setXYZ(i, shade.r, shade.g, shade.b)
  }
  trunk.setAttribute('color', trunkColours)

  const merged = mergeGeometries([trunk, canopy], false)
  trunk.dispose()
  canopy.dispose()
  return merged
}

/**
 * Falling snow as one draw call. The flakes never move on the CPU: each
 * vertex carries a seed, and the vertex shader drops it through a box that
 * wraps, with a little sideways drift. Size is in world units, so near flakes
 * are large and far ones are specks; they fade out before the far plane.
 */
function buildSnowfall(
  count: number,
  box: Vector3,
  origin: Vector3,
  colour: Color,
  fadeFar: number,
  seed: number,
): { points: Points; material: ShaderMaterial; geometry: BufferGeometry } {
  const random = seeded(seed)
  const positions = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  const position = new BufferAttribute(positions, 3)
  const seedAttribute = new BufferAttribute(seeds, 1)
  for (let i = 0; i < count; i += 1) {
    position.setXYZ(i, random() * box.x, random() * box.y, random() * box.z)
    seedAttribute.setX(i, random())
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', position)
  geometry.setAttribute('aSeed', seedAttribute)

  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uScale: { value: 1 },
      uBox: { value: box },
      uOrigin: { value: origin },
      uColor: { value: colour },
      uFadeFar: { value: fadeFar },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uScale;
      uniform vec3 uBox;
      uniform vec3 uOrigin;
      uniform float uFadeFar;
      attribute float aSeed;
      varying float vAlpha;

      void main() {
        vec3 p = position;
        p.y = mod(p.y - uTime * (1.1 + aSeed * 1.4), uBox.y);
        p.x += sin(uTime * 0.55 + aSeed * 40.0) * 0.7;
        p.z += cos(uTime * 0.4 + aSeed * 31.0) * 0.7;
        vec4 mv = modelViewMatrix * vec4(p + uOrigin, 1.0);
        gl_Position = projectionMatrix * mv;
        float depth = max(-mv.z, 0.001);
        gl_PointSize = uScale * (0.1 + aSeed * 0.16) / depth;
        // Written as 1 - smoothstep(lo, hi): GLSL leaves smoothstep undefined
        // when its first edge is the larger one.
        vAlpha =
          (1.0 - smoothstep(uFadeFar * 0.45, uFadeFar, depth)) *
          smoothstep(0.6, 3.0, depth) *
          (0.55 + aSeed * 0.45);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vAlpha;

      void main() {
        float d = length(gl_PointCoord - 0.5);
        float disc = 1.0 - smoothstep(0.18, 0.5, d);
        gl_FragColor = vec4(uColor, disc * vAlpha);
        #include <colorspace_fragment>
      }
    `,
  })

  const points = new Points(geometry, material)
  // The shader moves every vertex, so the static bounding sphere is a lie.
  points.frustumCulled = false
  return { points, material, geometry }
}

/* -------------------------------------------------------------------------- */
/* The hero's world                                                           */
/* -------------------------------------------------------------------------- */

const IGLOO_RADIUS = 3

/**
 * Where the logo lies: a slab centred on the origin, `width` across (x) and
 * `depth` deep (z), its top at `y`. The ground is flat over it and a little
 * beyond, so the snow on it settles level. Front to back: a strip for the
 * etched heading, the logo, then a strip for the etched facts
 * (`buildEtching`).
 */
const BED = { width: 12, depth: 4.7, y: 0.6 } as const

/**
 * The logo and etching textures cover the bed exactly, at the bed's own
 * proportions: about 171 texels to a unit.
 */
const BED_CANVAS = {
  width: 2048,
  height: Math.round((2048 * BED.depth) / BED.width),
} as const

/**
 * The header lockup (Wordmark.tsx): bearcat 28.6 wide x 30.0 tall, wordmark
 * 123.0 x 17.3, 8.2 apart, in 24px-em units — scaled by this into texels.
 */
const LOCKUP_SCALE = 11.5
const LOCKUP_SPAN = (28.6 + 8.2 + 123) * LOCKUP_SCALE
const LOCKUP_LEFT = (BED_CANVAS.width - LOCKUP_SPAN) / 2
/** The texel row the lockup is centred on, and where that lies on the bed. */
const LOCKUP_ROW = 330
const LOCKUP_Z = (LOCKUP_ROW / BED_CANVAS.height - 0.5) * BED.depth

/**
 * The bank the logo lies on leans toward the camera by this much (radians),
 * so the logo reads from a camera low enough to see the horizon.
 */
const BED_TILT = 0.52

/**
 * The clearable snow blanket, in the bed's own units: wide and deep enough to
 * cover all the ground the hero shows, so any of it can be brushed away.
 */
const SNOW_SIZE = { x: 80, z: 56 } as const
const SNOW_MARGIN = {
  x: (SNOW_SIZE.x - BED.width) / 2,
  z: (SNOW_SIZE.z - BED.depth) / 2,
} as const

/** The snow's resting depth over the slab, and so the level of the ground. */
const SNOW_DEPTH = 0.34

/** Height of the terrain: flat around the slab, rolling drifts, far peaks. */
function terrainHeight(x: number, z: number, underSnow = true): number {
  // The bed's own coordinates: across the tilted bank, its z runs longer.
  const bedZ = z / Math.cos(BED_TILT)
  const dx = Math.max(Math.abs(x) - BED.width / 2 - SNOW_MARGIN.x, 0)
  const dz = Math.max(Math.abs(bedZ) - BED.depth / 2 - SNOW_MARGIN.z, 0)
  const d = Math.hypot(dx, dz)
  // The bank: the tilted plane of the bed, easing back to level ground.
  const bank = -z * Math.tan(BED_TILT) * (1 - smoothstep(3, 30, d))
  // Keep the camera's side of the slab open.
  const approach = distanceToSegment(x, z, 0, 0, 0, 90)
  const open = smoothstep(9, 36, approach)
  const rolling =
    (fbm(x * 0.045, z * 0.045, 7) - 0.5) * 8 * smoothstep(2, 20, d)
  const ridged = 1 - Math.abs(2 * fbm(x * 0.016 + 3, z * 0.016, 11) - 1)
  const peaks =
    ridged * ridged * 48 * smoothstep(26, 100, Math.hypot(x, z)) * open *
    smoothstep(0, 10, d)
  const rough = (fbm(x * 0.33, z * 0.33, 13) - 0.5) * 1.1 * smoothstep(0.5, 6, d)
  // Under the snow sheet the ground drops into a pit, so the sheet — level
  // with the ground at its edges — is the only surface there.
  const sheet = Math.max(
    Math.abs(x) - BED.width / 2 - SNOW_MARGIN.x,
    Math.abs(bedZ) - BED.depth / 2 - SNOW_MARGIN.z,
  )
  const pit = underSnow
    ? 0.05 * smoothstep(0, 0.12, -sheet) + 0.65 * smoothstep(0.8, 1.5, -sheet)
    : 0
  return (
    BED.y +
    (0.02 + SNOW_DEPTH) / Math.cos(BED_TILT) +
    bank +
    rolling * (0.3 + 0.7 * open) +
    peaks +
    rough -
    pit
  )
}

/**
 * The ground: a grid pulled toward the slab so detail lands where the camera
 * looks, coloured by slope — snow on the flats, wind-scoured stone on anything
 * steep.
 */
function buildTerrain(
  segments: number,
  snow: Color,
  scoured: Color,
): BufferGeometry {
  const reach = 190
  const geometry = new PlaneGeometry(2, 2, segments, segments)
  geometry.rotateX(-Math.PI / 2)
  const position = geometry.getAttribute('position')
  const uv = geometry.getAttribute('uv')
  const warp = (u: number) => Math.sign(u) * reach * Math.abs(u) ** 1.9
  for (let i = 0; i < position.count; i += 1) {
    const x = warp(position.getX(i))
    const z = warp(position.getZ(i))
    position.setXYZ(i, x, terrainHeight(x, z), z)
    uv.setXY(i, x * 0.11, z * 0.11)
  }
  geometry.computeVertexNormals()
  const normal = geometry.getAttribute('normal')
  const colours = new BufferAttribute(new Float32Array(position.count * 3), 3)
  const colour = new Color()
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i)
    const z = position.getZ(i)
    const patch = fbm(x * 0.09, z * 0.09, 31)
    const bare = 1 - smoothstep(0.5, 0.74, normal.getY(i) + (patch - 0.5) * 0.16)
    colour.copy(snow).lerp(scoured, clamp01(bare * 1.1 + (patch - 0.5) * 0.25))
    colours.setXYZ(i, colour.r, colour.g, colour.b)
  }
  geometry.setAttribute('color', colours)
  geometry.computeBoundingSphere()
  return geometry
}

/**
 * Sky dome: a vertical gradient, a soft sun low behind the peaks, and slow
 * banks of mist.
 */
function buildSky(colours: {
  low: Color
  middle: Color
  high: Color
  mist: Color
  sun: Color
  sunDirection: Vector3
}) {
  const geometry = new SphereGeometry(330, 32, 18)
  const material = new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uLow: { value: colours.low },
      uMiddle: { value: colours.middle },
      uHigh: { value: colours.high },
      uMist: { value: colours.mist },
      uSun: { value: colours.sun },
      uSunDirection: { value: colours.sunDirection },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDirection;
      void main() {
        vDirection = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uLow;
      uniform vec3 uMiddle;
      uniform vec3 uHigh;
      uniform vec3 uMist;
      uniform vec3 uSun;
      uniform vec3 uSunDirection;
      uniform float uTime;
      varying vec3 vDirection;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }
      float fbm(vec2 p) {
        float total = 0.0;
        float amplitude = 0.5;
        for (int octave = 0; octave < 5; octave++) {
          total += noise(p) * amplitude;
          p *= 2.03;
          amplitude *= 0.5;
        }
        return total;
      }

      void main() {
        vec3 d = normalize(vDirection);
        float height = max(d.y, 0.0);
        vec3 colour = mix(uLow, uMiddle, smoothstep(0.0, 0.18, height));
        colour = mix(colour, uHigh, smoothstep(0.12, 0.6, height));
        float sun = max(dot(d, normalize(uSunDirection)), 0.0);
        colour += uSun * (pow(sun, 6.0) * 0.18 + pow(sun, 64.0) * 0.35);
        vec2 flat_ = d.xz / max(d.y + 0.22, 0.05);
        float bank = smoothstep(0.4, 0.8, fbm(flat_ * 0.9 + uTime * 0.006));
        colour = mix(colour, uMist, bank * 0.6 * (1.0 - smoothstep(0.08, 0.5, height)));
        gl_FragColor = vec4(colour, 1.0);
        #include <colorspace_fragment>
      }
    `,
  })
  const mesh = new Mesh(geometry, material)
  mesh.renderOrder = -10
  mesh.frustumCulled = false
  return { mesh, material, geometry }
}

/* -------------------------------------------------------------------------- */
/* The igloo                                                                  */
/* -------------------------------------------------------------------------- */

type Block = {
  home: Vector3
  rotation: Quaternion
  size: Vector3
  outward: Vector3
  spinAxis: Vector3
  /** 0 at the ground, 1 at the crown: how free the block is to lift. */
  height: number
  seed: number
  near: number
}

type IglooColours = {
  block: Color
  cool: Color
  glow: Color
}

/**
 * Blocks laid in staggered courses with an arched tunnel, as one instanced
 * mesh over a lit core. The material is a standard one with a glow added in
 * the shader: a block's outer face stays dark and gritty while its sides and
 * underside burn in proportion to how far it has lifted, so the light appears
 * exactly where the structure opens up.
 */
function buildIgloo(
  colours: IglooColours,
  grain: DataTexture,
  bin: Disposable[],
) {
  const group = new Group()
  const random = seeded(909)
  const blocks: Block[] = []
  const axisX = new Vector3()
  const axisY = new Vector3()
  const axisZ = new Vector3()
  const basis = new Matrix4()

  const add = (home: Vector3, size: Vector3, height: number) => {
    basis.makeBasis(axisX, axisY, axisZ)
    blocks.push({
      home,
      rotation: new Quaternion().setFromRotationMatrix(basis),
      size,
      outward: axisZ.clone(),
      spinAxis: new Vector3(random() - 0.5, random() - 0.5, random() - 0.5).normalize(),
      height,
      seed: random(),
      near: 0,
    })
  }

  const tunnelRadius = 1.3
  const courses = 5
  const top = (76 * Math.PI) / 180
  const step = top / courses
  for (let course = 0; course < courses; course += 1) {
    const elevation = (course + 0.5) * step
    const ring = IGLOO_RADIUS * Math.cos(elevation)
    const y = IGLOO_RADIUS * Math.sin(elevation)
    const count = Math.max(4, Math.round((2 * Math.PI * ring) / 1.75))
    for (let i = 0; i < count; i += 1) {
      const theta = ((i + (course % 2) * 0.5) / count) * Math.PI * 2
      const x = ring * Math.sin(theta)
      const z = ring * Math.cos(theta)
      if (z > 0 && Math.hypot(x, y) < tunnelRadius + 0.22) continue
      axisX.set(Math.cos(theta), 0, -Math.sin(theta))
      axisY.set(
        -Math.sin(elevation) * Math.sin(theta),
        Math.cos(elevation),
        -Math.sin(elevation) * Math.cos(theta),
      )
      axisZ.set(
        Math.cos(elevation) * Math.sin(theta),
        Math.sin(elevation),
        Math.cos(elevation) * Math.cos(theta),
      )
      add(
        new Vector3(x, y, z),
        new Vector3(
          ((2 * Math.PI * ring) / count) * (1.03 + random() * 0.04),
          IGLOO_RADIUS * step * (1.01 + random() * 0.05),
          0.72 + random() * 0.14,
        ),
        (course + 0.6) / courses,
      )
    }
  }
  // Crown.
  axisX.set(1, 0, 0)
  axisY.set(0, 0, -1)
  axisZ.set(0, 1, 0)
  add(new Vector3(0, IGLOO_RADIUS * 0.985, 0), new Vector3(1.5, 1.5, 0.66), 1)

  // Entrance tunnel: arches marching out from the wall.
  const tunnelStart = Math.sqrt(IGLOO_RADIUS ** 2 - tunnelRadius ** 2) + 0.1
  const pieces = 6
  for (let ring = 0; ring < 3; ring += 1) {
    const z = tunnelStart + ring * 0.82
    for (let i = 0; i < pieces; i += 1) {
      const angle = ((i + 0.5) / pieces) * Math.PI
      axisX.set(-Math.sin(angle), Math.cos(angle), 0)
      axisY.set(0, 0, 1)
      axisZ.set(Math.cos(angle), Math.sin(angle), 0)
      add(
        new Vector3(
          Math.cos(angle) * tunnelRadius,
          Math.sin(angle) * tunnelRadius,
          z,
        ),
        new Vector3((Math.PI * tunnelRadius * 1.08) / pieces, 0.8, 0.62),
        0.08,
      )
    }
  }

  const geometry = new RoundedBoxGeometry(1, 1, 1, 3, 0.1)
  const lift = new InstancedBufferAttribute(new Float32Array(blocks.length), 1)
  lift.setUsage(DynamicDrawUsage)
  geometry.setAttribute('aLift', lift)
  const material = new MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.96,
    metalness: 0,
    bumpMap: grain,
    bumpScale: 2.4,
  })
  const glowUniform = { value: colours.glow }
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uGlow = glowUniform
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        attribute float aLift;
        varying float vLift;
        varying float vFace;
        varying vec2 vBlock;`,
      )
      .replace(
        '#include <beginnormal_vertex>',
        `#include <beginnormal_vertex>
        vFace = objectNormal.z;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vLift = aLift;
        vBlock = position.xy;`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform vec3 uGlow;
        varying float vLift;
        varying float vFace;
        varying vec2 vBlock;`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float sideLight = 1.0 - smoothstep(-0.15, 0.72, vFace);
        vec2 rim = abs(vBlock) * 2.0;
        float edgeLight = smoothstep(0.8, 1.0, max(rim.x, rim.y));
        totalEmissiveRadiance += uGlow * (
          sideLight * (0.1 + vLift * 0.72) + edgeLight * (0.03 + vLift * 0.24)
        );`,
      )
  }
  const mesh = new InstancedMesh(geometry, material, blocks.length)
  mesh.instanceMatrix.setUsage(DynamicDrawUsage)
  const tint = new Color()
  blocks.forEach((_block, index) => {
    tint.copy(colours.block).lerp(colours.cool, random() * 0.22)
    mesh.setColorAt(index, tint.multiplyScalar(0.86 + random() * 0.14))
  })
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.frustumCulled = false
  group.add(mesh)

  // The light inside: only ever seen through the gaps and the door.
  const coreGeometry = new SphereGeometry(IGLOO_RADIUS - 0.42, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2)
  const coreMaterial = new MeshBasicMaterial({ color: colours.glow.clone(), fog: false })
  const core = new Mesh(coreGeometry, coreMaterial)
  group.add(core)
  bin.push(geometry, material, coreGeometry, coreMaterial)

  const position = new Vector3()
  const quaternion = new Quaternion()
  const spin = new Quaternion()
  const matrix = new Matrix4()
  const world = new Vector3()
  /** Where each block is this frame, in the group's space. */
  const live = blocks.map(() => new Vector3())

  return {
    group,
    blocks,
    live,
    update(
      explode: number,
      time: number,
      nearness: ((point: Vector3) => number) | null,
    ) {
      blocks.forEach((block, index) => {
        const target = nearness
          ? nearness(world.copy(block.home).applyMatrix4(group.matrixWorld))
          : 0
        block.near += (target - block.near) * 0.09
        const idle = Math.sin(time * 0.9 + block.seed * 6.283) * 0.04 * block.height
        const amount =
          explode * block.height ** 1.25 * (0.55 + block.seed * 0.85) * 1.5 +
          idle +
          block.near * 0.55 * (0.3 + 0.7 * block.height)
        position.copy(block.home).addScaledVector(block.outward, amount)
        live[index]?.copy(position)
        spin.setFromAxisAngle(block.spinAxis, amount * 0.42)
        quaternion.copy(spin).multiply(block.rotation)
        matrix.compose(position, quaternion, block.size)
        mesh.setMatrixAt(index, matrix)
        lift.setX(index, clamp01(Math.abs(amount)))
      })
      mesh.instanceMatrix.needsUpdate = true
      lift.needsUpdate = true
      coreMaterial.color.copy(colours.glow).multiplyScalar(0.84 + explode * 0.06)
    },
  }
}

/* -------------------------------------------------------------------------- */
/* The logo in the snow                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The HackBU lockup — bearcat and wordmark — drawn white on black into one
 * texture, laid out in the header's proportions. The shapes come from the same
 * alpha masks the page paints in `fern` (public/brand/), so the 3D logo cannot
 * drift from the 2D one. Resolves once both masks have been drawn; a mask that
 * fails to load leaves its half blank rather than throwing.
 */
function buildLogoTexture(bin: Disposable[]): {
  texture: CanvasTexture
  ready: Promise<void>
} {
  const canvas = document.createElement('canvas')
  canvas.width = BED_CANVAS.width
  canvas.height = BED_CANVAS.height
  const context = canvas.getContext('2d')
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = NoColorSpace
  texture.anisotropy = 8
  bin.push(texture)
  if (!context) return { texture, ready: Promise.resolve() }
  context.fillStyle = '#000'
  context.fillRect(0, 0, canvas.width, canvas.height)

  const load = (src: string) =>
    new Promise<HTMLImageElement | null>((resolve) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => resolve(null)
      image.src = src
    })

  const scale = LOCKUP_SCALE
  const bearcat = { width: 28.6 * scale, height: 30 * scale }
  const wordmark = { width: 123 * scale, height: 17.3 * scale }
  const gap = 8.2 * scale
  const left = LOCKUP_LEFT
  const middle = LOCKUP_ROW

  const ready = Promise.all([
    load('/brand/bearcat-mask-256.png'),
    load('/brand/wordmark-mask-768.png'),
  ]).then(([cat, word]) => {
    if (cat) {
      context.drawImage(cat, left, middle - bearcat.height / 2, bearcat.width, bearcat.height)
    }
    if (word) {
      context.drawImage(
        word,
        left + bearcat.width + gap,
        middle - wordmark.height / 2,
        wordmark.width,
        wordmark.height,
      )
    }
    texture.needsUpdate = true
  })
  return { texture, ready }
}

/**
 * The text pressed into the snow, in the page's own typeface: the heading in
 * a line above the logo, and below it a rule, then a small label and a large
 * value per column — drawn white on black over the same bed mapping as the
 * logo. The snow sinks a soft groove
 * along the strokes and shades them in a darker blue, so they read like
 * lettering pressed into a drift; brushing the snow away clears them with it,
 * and they come back as it refills.
 */
function buildEtching(bin: Disposable[]): {
  texture: CanvasTexture
  ready: Promise<void>
  set: (etching: SnowEtching) => void
} {
  const canvas = document.createElement('canvas')
  canvas.width = BED_CANVAS.width
  canvas.height = BED_CANVAS.height
  const context = canvas.getContext('2d')
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = NoColorSpace
  texture.anisotropy = 8
  bin.push(texture)
  const family = '"IBM Plex Mono", ui-monospace, monospace'
  // The face is the page's, so it is almost always loaded already; a font
  // that will not load leaves the fallback, never an error.
  const ready = Promise.all([
    document.fonts.load(`600 34px ${family}`),
    document.fonts.load(`600 54px ${family}`),
  ]).then(
    () => undefined,
    () => undefined,
  )
  // Texel rows: the heading's baseline; then, under the logo, a rule, the
  // labels' baseline, the values' baseline and a rule.
  const ROWS = { heading: 120, top: 556, label: 626, value: 702, bottom: 738 } as const

  return {
    texture,
    ready,
    set({ heading, facts: lines }) {
      if (!context) return
      context.fillStyle = '#000'
      context.fillRect(0, 0, canvas.width, canvas.height)
      if (heading) {
        context.fillStyle = '#fff'
        context.textBaseline = 'alphabetic'
        const text = `////// ${heading.toUpperCase()}`
        let size = 58
        context.font = `600 ${size}px ${family}`
        const measured = context.measureText(text).width
        if (measured > LOCKUP_SPAN) {
          size = Math.max(24, Math.floor((size * LOCKUP_SPAN) / measured))
          context.font = `600 ${size}px ${family}`
        }
        context.fillText(text, LOCKUP_LEFT, ROWS.heading)
      }
      if (lines.length > 0) {
        context.fillStyle = '#fff'
        context.textBaseline = 'alphabetic'
        context.fillRect(LOCKUP_LEFT, ROWS.top, LOCKUP_SPAN, 5)
        context.fillRect(LOCKUP_LEFT, ROWS.bottom, LOCKUP_SPAN, 5)
        const column = LOCKUP_SPAN / lines.length
        lines.forEach(([label, value], index) => {
          const x = LOCKUP_LEFT + column * index
          context.font = `600 34px ${family}`
          context.fillText(`// ${label.toUpperCase()}`, x, ROWS.label)
          // As large as the column allows (with a clear gap before the
          // next), up to 54 texels.
          const text = value.toUpperCase()
          let size = 54
          context.font = `600 ${size}px ${family}`
          const room = column - 110
          const measured = context.measureText(text).width
          if (measured > room) {
            size = Math.max(30, Math.floor((size * room) / measured))
            context.font = `600 ${size}px ${family}`
          }
          context.fillText(text, x, ROWS.value)
        })
      }
      texture.needsUpdate = true
    },
  }
}

/**
 * The face of the ice the logo is set in: mottled, with pale fractures and
 * a fine frost, tiling every few units. Without it the slab was one flat
 * blue, the same weight as the letters glowing in it.
 */
function buildIceFace(colours: { base: Color; deep: Color; pale: Color }, bin: Disposable[]) {
  const size = 1024
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.anisotropy = 8
  texture.channel = 1
  bin.push(texture)
  if (!context) return texture
  const css = (colour: Color, alpha: number) =>
    `#${colour.getHexString()}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`
  const random = seeded(31)
  // A shape that crosses an edge is drawn again a tile over, so the texture
  // wraps without a seam; one that does not is drawn once. (Drawing every
  // shape nine times made this a long task on slow phones.)
  const tiled = (
    box: { left: number; top: number; right: number; bottom: number },
    paint: (dx: number, dy: number) => void,
  ) => {
    const xs = [0]
    if (box.left < 0) xs.push(size)
    if (box.right > size) xs.push(-size)
    const ys = [0]
    if (box.top < 0) ys.push(size)
    if (box.bottom > size) ys.push(-size)
    for (const dx of xs) for (const dy of ys) paint(dx, dy)
  }

  context.fillStyle = css(colours.base, 1)
  context.fillRect(0, 0, size, size)
  // Depth: soft pools of darker and paler ice.
  for (let i = 0; i < 70; i += 1) {
    const x = random() * size
    const y = random() * size
    const radius = 70 + random() * 220
    const deep = random() < 0.55
    const tone = deep ? colours.deep : colours.pale
    const alpha = deep ? 0.32 : 0.16
    tiled({ left: x - radius, top: y - radius, right: x + radius, bottom: y + radius }, (dx, dy) => {
      const gradient = context.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, radius)
      gradient.addColorStop(0, css(tone, alpha))
      gradient.addColorStop(1, css(tone, 0))
      context.fillStyle = gradient
      context.fillRect(x + dx - radius, y + dy - radius, radius * 2, radius * 2)
    })
  }
  // Fractures: wandering pale lines.
  context.lineCap = 'round'
  context.lineJoin = 'round'
  for (let i = 0; i < 22; i += 1) {
    const points: [number, number][] = []
    let x = random() * size
    let y = random() * size
    let heading = random() * Math.PI * 2
    const steps = 8 + Math.floor(random() * 18)
    for (let step = 0; step < steps; step += 1) {
      points.push([x, y])
      heading += (random() - 0.5) * 0.9
      const length = 12 + random() * 26
      x += Math.cos(heading) * length
      y += Math.sin(heading) * length
    }
    const width = 0.8 + random() * 1.8
    const alpha = 0.18 + random() * 0.3
    const xs = points.map(([px]) => px)
    const ys = points.map(([, py]) => py)
    const bounds = {
      left: Math.min(...xs) - width,
      top: Math.min(...ys) - width,
      right: Math.max(...xs) + width,
      bottom: Math.max(...ys) + width,
    }
    tiled(bounds, (dx, dy) => {
      context.strokeStyle = css(colours.pale, alpha)
      context.lineWidth = width
      context.beginPath()
      points.forEach(([px, py], index) => {
        if (index === 0) context.moveTo(px + dx, py + dy)
        else context.lineTo(px + dx, py + dy)
      })
      context.stroke()
    })
  }
  // Frost: a fine speckle.
  for (let i = 0; i < 5000; i += 1) {
    const x = random() * size
    const y = random() * size
    context.fillStyle = css(colours.pale, 0.05 + random() * 0.12)
    context.fillRect(x, y, 1 + random() * 1.5, 1 + random() * 1.5)
  }
  return texture
}

/**
 * Where the pointer has brushed the snow away, kept on the GPU.
 *
 * Two float render targets take turns: each update reads one and writes
 * the other, letting what was brushed drain back a little and adding the
 * newest stroke as one smooth capsule from the last pointer position to this
 * one. Float precision is what keeps both ends smooth — an 8-bit mask could
 * only refill in visible steps, and its quantised values showed as terraces in
 * the walls of a brushed hole.
 *
 * The refill drains a fixed amount per second, so a hole closes in from its
 * shallow rim toward its deepest middle, at any frame rate.
 *
 * Full 32-bit floats where the GPU can render to them and filter them (most
 * desktops, which is where there is a mouse to brush with): the refill then
 * runs every frame and is perfectly smooth. Elsewhere half floats, whose
 * steps are too coarse for a single frame's refill at high refresh rates, so
 * the refill is batched into steps of 1/30 s — each comfortably larger than
 * one half-float step.
 */
function buildReveal(renderer: WebGLRenderer, bin: Disposable[]) {
  const size = { x: SNOW_SIZE.x, z: SNOW_SIZE.z }
  const precise =
    renderer.extensions.has('EXT_color_buffer_float') &&
    renderer.extensions.has('OES_texture_float_linear')
  const width = 1536
  const height = Math.round((width * size.z) / size.x)
  // One channel: the mask is a single value, and RGBA would be four times
  // the memory and bandwidth (the pair is about 13 MB at 32 bits).
  const options = {
    type: precise ? FloatType : HalfFloatType,
    format: RedFormat,
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    depthBuffer: false,
    generateMipmaps: false,
  }
  const targets = [
    new WebGLRenderTarget(width, height, options),
    new WebGLRenderTarget(width, height, options),
  ]
  for (const target of targets) target.texture.colorSpace = NoColorSpace
  const material = new ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uPrevious: { value: null },
      uSize: { value: new Vector2(size.x, size.z) },
      uFrom: { value: new Vector2() },
      uTo: { value: new Vector2() },
      uStroke: { value: 0 },
      uDrain: { value: 0 },
      uSlump: { value: 0 },
      uTexel: { value: new Vector2(1 / width, 1 / height) },
      uReset: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uPrevious;
      uniform vec2 uSize;
      uniform vec2 uFrom;
      uniform vec2 uTo;
      uniform float uStroke;
      uniform float uDrain;
      uniform float uSlump;
      uniform vec2 uTexel;
      uniform float uReset;
      varying vec2 vUv;

      float hash(vec2 q) {
        return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453);
      }
      float noise(vec2 q) {
        vec2 i = floor(q);
        vec2 f = fract(q);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      void main() {
        if (uReset > 0.5) {
          gl_FragColor = vec4(0.0);
          return;
        }
        // This texel in the bed's units (x across, z toward the camera).
        vec2 p = vec2((vUv.x - 0.5) * uSize.x, (0.5 - vUv.y) * uSize.y);
        float value = texture2D(uPrevious, vUv).r;
        // Slump: the walls of a hole relax toward their neighbours, so fresh
        // snow first rounds the edges off and only then builds up.
        vec2 o = uTexel * 3.0;
        float around = (
          texture2D(uPrevious, vUv + vec2(o.x, 0.0)).r +
          texture2D(uPrevious, vUv - vec2(o.x, 0.0)).r +
          texture2D(uPrevious, vUv + vec2(0.0, o.y)).r +
          texture2D(uPrevious, vUv - vec2(0.0, o.y)).r
        ) * 0.25;
        value = mix(value, around, uSlump);
        // Drift: snow settles unevenly, faster in some places than others.
        float drift = noise(p * 0.9) * 0.6 + noise(p * 2.3) * 0.4;
        value = max(value - uDrain * mix(0.6, 1.4, drift), 0.0);
        vec2 segment = uTo - uFrom;
        float t = clamp(dot(p - uFrom, segment) / max(dot(segment, segment), 1e-6), 0.0, 1.0);
        float d = length(p - (uFrom + segment * t));
        float brush = 1.0 - smoothstep(0.0, 1.05, d);
        value = min(value + uStroke * brush * brush * (3.0 - 2.0 * brush), 1.15);
        gl_FragColor = vec4(value, 0.0, 0.0, 1.0);
      }
    `,
  })
  const quad = new FullScreenQuad(material)
  const uniforms = material.uniforms as {
    uPrevious: { value: Texture | null }
    uFrom: { value: Vector2 }
    uTo: { value: Vector2 }
    uStroke: { value: number }
    uDrain: { value: number }
    uSlump: { value: number }
    uReset: { value: number }
  }
  const texture = { value: targets[0]?.texture ?? null }
  let current = 0
  let last: { x: number; z: number } | null = null
  let pending: { from: { x: number; z: number }; to: { x: number; z: number } } | null = null
  let lastSeconds: number | null = null
  /** Time not yet spent on refill steps. */
  let owed = 0
  /**
   * Refill time actually applied since the last stroke. Counted in frames
   * run, not wall-clock time, so a hole left while the loop was paused
   * (another tab, scrolled away) still finishes refilling afterwards.
   */
  let sinceStroke = Infinity

  const run = () => {
    const previous = renderer.getRenderTarget()
    const write = targets[1 - current]
    if (!write) return
    renderer.setRenderTarget(write)
    quad.render(renderer)
    renderer.setRenderTarget(previous)
    current = 1 - current
    texture.value = write.texture
  }

  // Both targets start empty: nothing has been brushed.
  for (let i = 0; i < 2; i += 1) run()
  uniforms.uReset.value = 0

  bin.push(...targets, material, quad)

  return {
    size,
    /** The current mask, as a uniform value the snow can share. */
    texture,
    /** Queue a stroke to this point, joined to the last one. */
    brush(x: number, z: number) {
      if (Math.abs(x) > size.x / 2 + 0.6 || Math.abs(z) > size.z / 2 + 0.6) {
        last = null
        return
      }
      pending = { from: pending?.from ?? last ?? { x, z }, to: { x, z } }
      last = { x, z }
    },
    lift() {
      last = null
    },
    /**
     * Apply the queued stroke and, if `refill` is set, let snow come back:
     * the walls of every hole slump smooth within the first second or two,
     * then the hole fills unevenly at about 0.11 a second: a hole is half
     * filled after about 5 seconds and gone within about 15.
     *
     * Every frame with full floats; in batches of 1/30 s with half floats
     * (see above), so the rate is the same on every display either way.
     *
     * Nothing runs when there is no stroke and the mask has long since
     * drained — on a phone, or before anyone has brushed, that is always.
     */
    update(seconds: number, refill: boolean) {
      const dt = lastSeconds === null ? 0 : Math.min(Math.max(seconds - lastSeconds, 0), 0.25)
      lastSeconds = seconds
      if (pending) sinceStroke = 0
      // The deepest possible hole (1.15 at the slowest drift) is gone in
      // under 18 seconds of refill.
      const settling = refill && sinceStroke < 20
      owed = settling ? owed + dt : 0
      const STEP = precise ? 0 : 1 / 30
      const elapsed = STEP === 0 ? owed : Math.min(Math.floor(owed / STEP), 6) * STEP
      owed -= elapsed
      sinceStroke += elapsed
      if (!pending && elapsed === 0) return
      uniforms.uDrain.value = elapsed * 0.11
      uniforms.uSlump.value = Math.min(elapsed * 2.2, 0.5)
      if (pending) {
        uniforms.uFrom.value.set(pending.from.x, pending.from.z)
        uniforms.uTo.value.set(pending.to.x, pending.to.z)
        // A stroke deepens with how far the pointer travelled, so a fast
        // sweep and a slow one clear about the same depth; resting adds a
        // little more each frame.
        const travel = Math.hypot(pending.to.x - pending.from.x, pending.to.z - pending.from.z)
        uniforms.uStroke.value = Math.min(0.9, 0.06 + travel * 0.35)
      } else {
        uniforms.uStroke.value = 0
      }
      const read = targets[current]
      uniforms.uPrevious.value = read ? read.texture : null
      run()
      pending = null
    },
  }
}

type SnowShading = {
  /** The sun's direction in view space, refreshed every frame. */
  sunView: { value: Vector3 }
  sparkle: { value: Color }
}

/**
 * Gives a standard material two things real snow has and a flat material
 * does not: glints — tiny facets that flash as the angle between eye and sun
 * lines up — and a faint cool translucency on faces turned from the light.
 */
function snowShading(material: MeshStandardMaterial, shading: SnowShading, tint: Color) {
  const translucency = { value: tint }
  const previous = material.onBeforeCompile
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer)
    shader.uniforms.uSunView = shading.sunView
    shader.uniforms.uSparkle = shading.sparkle
    shader.uniforms.uTranslucency = translucency
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSparkPosition;')
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        vSparkPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform vec3 uSunView;
        uniform vec3 uSparkle;
        uniform vec3 uTranslucency;
        varying vec3 vSparkPosition;`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        {
          vec3 cell = floor(vSparkPosition * 38.0);
          float seed = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
          vec3 halfway = normalize(normalize(vViewPosition) + uSunView);
          float facing = pow(max(dot(normal, halfway), 0.0), 18.0);
          totalEmissiveRadiance += uSparkle * step(0.993, seed) * facing;
          float away = clamp(-dot(normal, uSunView), 0.0, 1.0);
          totalEmissiveRadiance += uTranslucency * away * 0.22;
        }`,
      )
  }
}

/**
 * The snow lying over the logo: a dense sheet whose height is worked out in
 * the vertex shader from the brushed-away mask, a drift texture and the logo
 * underneath (the snow sinks a hair over the carved lettering, so the shape
 * reads even before anything is uncovered). Where the pointer has brushed,
 * the sheet drops below the slab and a lip of pushed-aside snow rings the
 * hole. Normals come from the same height function, so the lighting follows
 * every dent. The logo also glows faintly through the thinner snow.
 */
function buildSnowCover(
  reveal: ReturnType<typeof buildReveal>,
  logo: CanvasTexture,
  etching: CanvasTexture,
  noise: DataTexture,
  colours: { snow: Color; glow: Color; etch: Color },
  shading: SnowShading,
  tint: Color,
  segments: number,
  bin: Disposable[],
) {
  const { size } = reveal
  const rows = Math.round(segments * 0.53)
  const geometry = new PlaneGeometry(2, 2, segments, rows)
  geometry.rotateX(-Math.PI / 2)
  // x = a·u + b·u³: spacing about 0.05 units over the logo, growing toward
  // the blanket's edges, so the lettering keeps its detail without a dense
  // grid everywhere.
  const warp = (u: number, half: number, centre: number) => {
    const a = Math.min(half, centre)
    return a * u + (half - a) * u ** 3
  }
  const centreX = (0.05 * segments) / 2
  const centreZ = (0.05 * rows) / 2
  // The same texture coordinates as the ground (world x, z at 0.11), so the
  // grain runs straight across the join.
  const uv = geometry.getAttribute('uv')
  const position = geometry.getAttribute('position')
  for (let i = 0; i < position.count; i += 1) {
    const x = warp(position.getX(i), size.x / 2, centreX)
    const z = warp(position.getZ(i), size.z / 2, centreZ)
    position.setXYZ(i, x, 0, z)
    uv.setXY(i, x * 0.11, z * 0.11)
  }
  geometry.computeBoundingSphere()
  const material = new MeshStandardMaterial({
    color: colours.snow,
    roughness: 0.92,
    metalness: 0,
    bumpMap: noise,
    bumpScale: 3,
  })
  const uniforms = {
    uReveal: reveal.texture,
    uLogo: { value: logo },
    uEtch: { value: etching },
    uEtchTint: { value: colours.etch },
    uNoise: { value: noise },
    uSize: { value: new Vector2(size.x, size.z) },
    uBedHalf: { value: new Vector2(BED.width / 2, BED.depth / 2) },
    uDepth: { value: SNOW_DEPTH },
    uGlow: { value: colours.glow },
  }
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform sampler2D uReveal;
        uniform sampler2D uLogo;
        uniform sampler2D uEtch;
        uniform sampler2D uNoise;
        uniform vec2 uSize;
        uniform vec2 uBedHalf;
        uniform float uDepth;
        varying float vLogo;
        varying float vThin;
        varying float vCover;
        varying vec2 vSnowP;

        vec2 bedUv(vec2 p) {
          return vec2(p.x / (2.0 * uBedHalf.x) + 0.5, 0.5 - p.y / (2.0 * uBedHalf.y));
        }
        float onBed(vec2 uv) {
          return step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
        }
        float logoAt(vec2 p) {
          vec2 uv = bedUv(p);
          return texture(uLogo, uv).r * onBed(uv);
        }
        // A blurred read (mip 1.5), so the groove has soft walls the mesh can
        // follow; the crisp edge is drawn per pixel in the fragment shader.
        float etchAt(vec2 p) {
          vec2 uv = bedUv(p);
          return textureLod(uEtch, uv, 1.5).r * onBed(uv);
        }

        float snowAt(vec2 p, out float cover) {
          vec2 uv = vec2(p.x / uSize.x + 0.5, 0.5 - p.y / uSize.y);
          float revealed = texture(uReveal, uv).r;
          cover = 1.0 - smoothstep(0.08, 0.9, revealed);
          float lip = smoothstep(0.03, 0.28, revealed) * (1.0 - smoothstep(0.28, 0.7, revealed));
          float drift = texture(uNoise, p * vec2(0.148, 0.128)).r;
          float ripple = texture(uNoise, p * vec2(0.51, 0.4)).r;
          vec2 edgeDistance = min(uv, 1.0 - uv) * uSize;
          float edge = smoothstep(0.0, 2.4, min(edgeDistance.x, edgeDistance.y));
          float depth = mix(uDepth, uDepth * (0.72 + 0.56 * drift + 0.1 * ripple) - logoAt(p) * 0.09 - etchAt(p) * 0.06, edge);
          return mix(-0.1, depth, cover) + lip * 0.13 * edge;
        }`,
      )
      .replace(
        '#include <beginnormal_vertex>',
        `vec2 snowP = position.xz;
        float snowCover;
        float snowHeight = snowAt(snowP, snowCover);
        float ignore;
        float e = 0.045;
        float hx = snowAt(snowP + vec2(e, 0.0), ignore) - snowAt(snowP - vec2(e, 0.0), ignore);
        float hz = snowAt(snowP + vec2(0.0, e), ignore) - snowAt(snowP - vec2(0.0, e), ignore);
        vec3 objectNormal = normalize(vec3(-hx / (2.0 * e), 1.0, -hz / (2.0 * e)));
        vLogo = logoAt(snowP);
        vThin = 1.0 - clamp(snowHeight / uDepth, 0.0, 1.0);
        vCover = snowCover;
        vSnowP = snowP;
        #ifdef USE_TANGENT
          vec3 objectTangent = vec3( tangent.xyz );
        #endif`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        transformed.y += snowHeight;`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform vec3 uGlow;
        uniform sampler2D uEtch;
        uniform vec3 uEtchTint;
        uniform vec2 uBedHalf;
        varying float vLogo;
        varying float vThin;
        varying float vCover;
        varying vec2 vSnowP;`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        // The etched facts: shaded into the snow where it lies whole, gone
        // where it has been brushed away.
        vec2 etchUv = vec2(vSnowP.x / (2.0 * uBedHalf.x) + 0.5, 0.5 - vSnowP.y / (2.0 * uBedHalf.y));
        float etchOn = step(0.0, etchUv.x) * step(etchUv.x, 1.0) * step(0.0, etchUv.y) * step(etchUv.y, 1.0);
        float etched = texture(uEtch, etchUv).r * etchOn * smoothstep(0.55, 0.95, vCover);
        diffuseColor.rgb = mix(diffuseColor.rgb, uEtchTint, etched * 0.78);`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += uGlow * vLogo * (0.08 + 0.55 * vThin * vThin);`,
      )
  }
  snowShading(material, shading, tint)
  const mesh = new Mesh(geometry, material)
  mesh.position.y = 0.02
  // Its shadow pass would see the flat sheet, not the displaced one.
  mesh.castShadow = false
  mesh.receiveShadow = true
  mesh.frustumCulled = false
  bin.push(geometry, material)
  return mesh
}

/**
 * The slab the logo is cut into: polished ice with a mottled, fractured face
 * (`buildIceFace`), the lettering lit from within in `fern` (the logo's own
 * colour, used here for the logo and nothing else), the strokes standing
 * proud of the face. The ice darkens in a soft halo around the letters, so
 * the glow always has a deep ground right behind it.
 *
 * The text etched into the snow (`buildEtching`) is engraved into the ice
 * as well, glowing a pale ice-blue in its own darkened halo: brushing the
 * snow off the facts uncovers them again, cut into the ice beneath.
 */
function buildLogoSlab(
  logo: CanvasTexture,
  etching: CanvasTexture,
  face: CanvasTexture,
  colours: { glow: Color; etchGlow: Color },
  bin: Disposable[],
) {
  // As wide as the snow blanket, so brushing anywhere finds ice; the logo
  // texture is mapped to the bed in the middle and clamps to its black edge
  // (no glow, no relief) everywhere else.
  const geometry = new PlaneGeometry(SNOW_SIZE.x, SNOW_SIZE.z)
  geometry.rotateX(-Math.PI / 2)
  const uv = geometry.getAttribute('uv')
  const position = geometry.getAttribute('position')
  // A second set of coordinates for the ice face: world units, a tile
  // every seven.
  const faceUv = new Float32Array(position.count * 2)
  for (let i = 0; i < position.count; i += 1) {
    uv.setXY(
      i,
      position.getX(i) / BED.width + 0.5,
      0.5 - position.getZ(i) / BED.depth,
    )
    faceUv[i * 2] = position.getX(i) / 7
    faceUv[i * 2 + 1] = position.getZ(i) / 7
  }
  geometry.setAttribute('uv1', new BufferAttribute(faceUv, 2))
  const material = new MeshStandardMaterial({
    map: face,
    roughness: 0.28,
    metalness: 0,
    emissive: colours.glow,
    emissiveMap: logo,
    bumpMap: logo,
    bumpScale: 6,
  })
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uEtch = { value: etching }
    shader.uniforms.uEtchGlow = { value: colours.etchGlow }
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform sampler2D uEtch;
        uniform vec3 uEtchGlow;`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        // A blurred read of the logo (mip 5, about 0.2 units a texel): the
        // ice deepens around every stroke. The engraved facts get the same,
        // a little tighter.
        float halo = textureLod(emissiveMap, vEmissiveMapUv, 5.0).r;
        diffuseColor.rgb *= 1.0 - 0.6 * smoothstep(0.0, 0.3, halo);
        float etchHalo = textureLod(uEtch, vEmissiveMapUv, 4.0).r;
        diffuseColor.rgb *= 1.0 - 0.5 * smoothstep(0.0, 0.25, etchHalo);`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += uEtchGlow * texture2D(uEtch, vEmissiveMapUv).r;`,
      )
  }
  material.customProgramCacheKey = () => 'hero-logo-slab'
  const mesh = new Mesh(geometry, material)
  mesh.position.y = 0.004
  mesh.receiveShadow = true
  bin.push(geometry, material)
  return mesh
}

/** Wide, slow sheets of ground mist between the slab and the peaks. */
function buildMist(colour: Color, bin: Disposable[]) {
  const geometry = new PlaneGeometry(1, 1)
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: false,
    uniforms: { uColour: { value: colour }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying float vSeed;
      void main() {
        vUv = uv;
        vSeed = modelMatrix[3].z * 0.13;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColour;
      uniform float uTime;
      varying vec2 vUv;
      varying float vSeed;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }
      void main() {
        vec2 p = vUv * vec2(6.0, 1.6) + vec2(uTime * 0.012 + vSeed, vSeed);
        float n = noise(p) * 0.55 + noise(p * 2.1) * 0.3 + noise(p * 4.3) * 0.15;
        float band = smoothstep(0.0, 0.35, vUv.y) * (1.0 - smoothstep(0.45, 1.0, vUv.y));
        float sides = smoothstep(0.0, 0.18, vUv.x) * (1.0 - smoothstep(0.82, 1.0, vUv.x));
        gl_FragColor = vec4(uColour, smoothstep(0.35, 0.8, n) * band * sides * 0.5);
        #include <colorspace_fragment>
      }
    `,
  })
  const group = new Group()
  const sheets: readonly (readonly [number, number, number])[] = [
    [-9, 1.4, 22],
    [-19, 2.4, 40],
    [-34, 3.6, 70],
    [-58, 5, 120],
  ]
  for (const [z, y, width] of sheets) {
    const sheet = new Mesh(geometry, material)
    // On the snow's surface, not the pit floor under the blanket.
    sheet.position.set(0, terrainHeight(0, z, false) + y * 0.5, z)
    sheet.scale.set(width, y * 3.2, 1)
    sheet.renderOrder = 2
    group.add(sheet)
  }
  bin.push(geometry, material)
  return { group, material }
}

/** Film finish after tone mapping: a soft vignette and a breath of grain. */
const FINISH_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    // The intro's flat wash: 1 hides the scene behind `uWashColour`.
    uWash: { value: 0 },
    uWashColour: { value: new Color() },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uWash;
    uniform vec3 uWashColour;
    varying vec2 vUv;
    void main() {
      vec4 colour = texture2D(tDiffuse, vUv);
      colour.rgb = mix(colour.rgb, uWashColour, uWash);
      float edge = smoothstep(0.38, 0.9, distance(vUv, vec2(0.5, 0.45)));
      colour.rgb *= 1.0 - edge * 0.22;
      float grain = fract(sin(dot(vUv * vec2(1213.1, 739.7) + uTime, vec2(12.9898, 78.233))) * 43758.5453);
      colour.rgb += (grain - 0.5) * 0.022;
      gl_FragColor = colour;
    }
  `,
}

/* -------------------------------------------------------------------------- */
/* The survey overlay                                                         */
/* -------------------------------------------------------------------------- */

const LABELS = 5
const LINKS: readonly (readonly [number, number])[] = []

/** A digit as a small texture; the numbers swap between ten of these. */
function buildDigits(bin: Disposable[]): CanvasTexture[] {
  return Array.from({ length: 10 }, (_, digit) => {
    const canvas = document.createElement('canvas')
    canvas.width = 40
    canvas.height = 56
    const context = canvas.getContext('2d')
    if (context) {
      context.fillStyle = '#fff'
      context.font = '500 46px "IBM Plex Mono", ui-monospace, monospace'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(String(digit), 20, 30)
    }
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    bin.push(texture)
    return texture
  })
}

/**
 * Thin lines between a few blocks, a cross on each, and a two-digit readout
 * that ticks with the block's distance from the camera.
 */
function buildSurvey(colour: Color, bin: Disposable[]) {
  const vertices = (LINKS.length + LABELS * 2) * 2
  const positions = new BufferAttribute(new Float32Array(vertices * 3), 3)
  positions.setUsage(DynamicDrawUsage)
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', positions)
  const lineMaterial = new LineBasicMaterial({
    color: colour,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    fog: false,
    toneMapped: false,
  })
  const lines = new LineSegments(geometry, lineMaterial)
  lines.frustumCulled = false
  lines.renderOrder = 5
  const group = new Group()
  group.add(lines)
  bin.push(geometry, lineMaterial)

  const digits = buildDigits(bin)
  const sprites = Array.from({ length: LABELS * 2 }, () => {
    const material = new SpriteMaterial({
      map: digits[0] ?? null,
      color: colour,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    })
    const sprite = new Sprite(material)
    sprite.renderOrder = 6
    group.add(sprite)
    bin.push(material)
    return sprite
  })

  const right = new Vector3()
  const up = new Vector3()
  const toCamera = new Vector3()
  const a = new Vector3()

  return {
    group,
    update(points: readonly Vector3[], camera: PerspectiveCamera, alpha: number) {
      group.visible = alpha > 0.01
      if (!group.visible) return
      lineMaterial.opacity = alpha
      right.setFromMatrixColumn(camera.matrixWorld, 0)
      up.setFromMatrixColumn(camera.matrixWorld, 1)
      let v = 0
      const put = (p: Vector3) => {
        positions.setXYZ(v, p.x, p.y, p.z)
        v += 1
      }
      for (const [from, to] of LINKS) {
        const start = points[from]
        const end = points[to]
        if (start && end) {
          put(start)
          put(end)
        }
      }
      sprites.forEach((sprite, index) => {
        sprite.visible = index < points.length * 2
      })
      points.slice(0, LABELS).forEach((point, label) => {
        const distance = toCamera.copy(camera.position).sub(point).length()
        const size = distance * 0.0052
        put(a.copy(point).addScaledVector(right, -size))
        put(a.copy(point).addScaledVector(right, size))
        put(a.copy(point).addScaledVector(up, -size))
        put(a.copy(point).addScaledVector(up, size))
        const reading = Math.floor(distance * 50) % 100
        ;[Math.floor(reading / 10), reading % 10].forEach((digit, place) => {
          const sprite = sprites[label * 2 + place]
          if (!sprite) return
          sprite.material.map = digits[digit] ?? null
          sprite.material.opacity = alpha
          sprite.scale.set(distance * 0.0078, distance * 0.0109, 1)
          sprite.position
            .copy(point)
            .addScaledVector(right, distance * (0.0125 + place * 0.0072))
            .addScaledVector(up, distance * 0.0105)
        })
      })
      geometry.setDrawRange(0, v)
      positions.needsUpdate = true
    },
  }
}

/* -------------------------------------------------------------------------- */
/* Ice                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * A tiling striation map: long vertical streaks with a little cross-grain,
 * used to rough up the ice's surface and break its reflections.
 */
function buildIceGrain(): DataTexture {
  const size = 256
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const streak = valueNoise(x / 4, y / 64, 61, size / 4)
      const fine = valueNoise(x / 2, y / 16, 62, size / 2)
      const blotch = valueNoise(x / 32, y / 32, 63, size / 32)
      const value = Math.round((streak * 0.55 + fine * 0.2 + blotch * 0.25) * 255)
      const offset = (y * size + x) * 4
      data[offset] = value
      data[offset + 1] = value
      data[offset + 2] = value
      data[offset + 3] = 255
    }
  }
  const texture = new DataTexture(data, size, size)
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.colorSpace = NoColorSpace
  texture.magFilter = LinearFilter
  texture.minFilter = LinearMipmapLinearFilter
  texture.generateMipmaps = true
  texture.needsUpdate = true
  return texture
}

/** A rough block of ice: a boxy blob, chipped, with vertical striations. */
function buildIceGeometry(detail: number): BufferGeometry {
  const base = new IcosahedronGeometry(1, detail)
  base.deleteAttribute('uv')
  base.deleteAttribute('normal')
  const geometry = mergeVertices(base, 1e-4)
  base.dispose()
  const position = geometry.getAttribute('position')
  const uv = new BufferAttribute(new Float32Array(position.count * 2), 2)
  const p = new Vector3()
  for (let i = 0; i < position.count; i += 1) {
    p.fromBufferAttribute(position, i).normalize()
    const around = Math.atan2(p.z, p.x)
    uv.setXY(i, (around / Math.PI) * 1.5, p.y * 0.8)
    const chip = fbm(p.x * 2.4 + p.y * 1.3 + 5, p.z * 2.4 - p.y * 1.1 + 5, 52)
    const streak = fbm(around * 7 + 9, p.y * 0.9 + 4, 53)
    const boxy = (n: number) => Math.sign(n) * Math.abs(n) ** 0.42
    const radius = 1 + (chip - 0.5) * 0.36 + (streak - 0.5) * 0.09
    position.setXYZ(
      i,
      boxy(p.x) * 1.02 * radius,
      boxy(p.y) * 1.42 * radius,
      boxy(p.z) * 0.82 * radius,
    )
  }
  geometry.setAttribute('uv', uv)
  geometry.computeVertexNormals()
  return geometry
}

/* -------------------------------------------------------------------------- */
/* Scene                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Build a scene on an existing WebGL2 context. The caller owns the canvas and
 * the frame loop; this owns everything three.js allocates and frees it in
 * `dispose()`.
 */
export function createSnowScene(
  canvas: HTMLCanvasElement,
  context: WebGL2RenderingContext,
  variant: SnowVariant,
  palette: SnowPalette,
  options: SnowSceneOptions,
): SnowSceneHandle {
  const colour = {
    sky: new Color(palette.sky),
    horizon: new Color(palette.horizon),
    cloud: new Color(palette.cloud),
    frost: new Color(palette.frost),
    haze: new Color(palette.haze),
    ink: new Color(palette.ink),
    fern: new Color(palette.fern),
    brick: new Color(palette.brick),
  }
  const renderer = new WebGLRenderer({ canvas, context, alpha: true, antialias: true })
  renderer.toneMapping = NoToneMapping
  renderer.setClearColor(colour.frost, 0)
  return variant === 'hero'
    ? createHero(renderer, colour, options)
    : createIce(renderer, colour, variant, options)
}

type Palette = Record<
  'sky' | 'horizon' | 'cloud' | 'frost' | 'haze' | 'ink' | 'fern' | 'brick',
  Color
>

function createHero(
  renderer: WebGLRenderer,
  colour: Palette,
  { animate, lowPower }: SnowSceneOptions,
): SnowSceneHandle {
  const bin: Disposable[] = []
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFShadowMap
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.82

  const scene = new Scene()
  const distance = colour.frost.clone().lerp(colour.haze, 0.42)
  scene.fog = new Fog(distance, 22, 150)
  const camera = new PerspectiveCamera(32, 1, 0.5, 700)

  const sunDirection = new Vector3(-0.8, 0.38, -0.12).normalize()
  const sky = buildSky({
    low: distance,
    middle: colour.frost.clone().lerp(colour.horizon, 0.25),
    high: colour.haze.clone().lerp(colour.ink, 0.25),
    mist: colour.frost,
    sun: colour.cloud,
    sunDirection,
  })
  bin.push(sky.geometry, sky.material)
  scene.add(sky.mesh)

  // Image-based light from a copy of the sky, so every surface picks up the
  // sky's gradient in its reflections, not just a flat ambient term.
  const skyForLight = buildSky({
    low: distance,
    middle: colour.frost.clone().lerp(colour.horizon, 0.25),
    high: colour.haze.clone().lerp(colour.ink, 0.25),
    mist: colour.frost,
    sun: colour.cloud.clone().multiplyScalar(2),
    sunDirection,
  })
  const lightScene = new Scene()
  lightScene.add(skyForLight.mesh)
  const generator = new PMREMGenerator(renderer)
  // The far plane must reach the sky dome (radius 330), or only the clear
  // colour is captured.
  const environment = generator.fromScene(lightScene, 0.04, 0.1, 1000)
  generator.dispose()
  skyForLight.geometry.dispose()
  skyForLight.material.dispose()
  scene.environment = environment.texture
  scene.environmentIntensity = 0.4
  bin.push(environment)

  const skyLight = new HemisphereLight(
    colour.frost.clone().lerp(colour.horizon, 0.4),
    colour.haze.clone().lerp(colour.ink, 0.3),
    0.6,
  )
  // Low and from behind the slab, so drifts and lettering throw long, soft
  // shadows toward the camera and every ridge gets a lit rim.
  const sun = new DirectionalLight(colour.cloud.clone().lerp(colour.horizon, 0.15), 3.1)
  sun.position.copy(sunDirection).multiplyScalar(40)
  sun.castShadow = true
  sun.shadow.camera.left = -12
  sun.shadow.camera.right = 12
  sun.shadow.camera.top = 9
  sun.shadow.camera.bottom = -9
  sun.shadow.camera.near = 5
  sun.shadow.camera.far = 90
  sun.shadow.mapSize.set(lowPower ? 1024 : 2048, lowPower ? 1024 : 2048)
  sun.shadow.bias = -0.0005
  sun.shadow.normalBias = 0.03
  sun.shadow.radius = 2
  scene.add(skyLight, sun)

  const shading: SnowShading = {
    sunView: { value: new Vector3() },
    sparkle: { value: colour.cloud.clone().multiplyScalar(3.2) },
  }
  const coolShade = colour.horizon.clone().lerp(colour.sky, 0.35)

  const grain = buildSnowGrain()
  const groundGeometry = buildTerrain(
    lowPower ? 150 : 250,
    colour.frost.clone().lerp(colour.haze, 0.08),
    colour.haze.clone().lerp(colour.ink, 0.5),
  )
  const groundMaterial = new MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    metalness: 0,
    bumpMap: grain,
    bumpScale: 3,
  })
  snowShading(groundMaterial, shading, coolShade)
  groundMaterial.customProgramCacheKey = () => 'hero-ground'
  const ground = new Mesh(groundGeometry, groundMaterial)
  ground.receiveShadow = true
  scene.add(ground)
  bin.push(grain, groundGeometry, groundMaterial)

  const logo = buildLogoTexture(bin)
  const etching = buildEtching(bin)
  // Pale and bright, so the letters' cores bloom toward white against the
  // darkened ice around them.
  const glow = colour.fern.clone().lerp(colour.cloud, 0.28).multiplyScalar(3)
  const bed = new Group()
  bed.position.y = BED.y
  bed.rotation.x = BED_TILT
  scene.add(bed)
  bed.add(
    buildLogoSlab(
      logo.texture,
      etching.texture,
      buildIceFace(
        {
          base: colour.ink.clone().lerp(colour.haze, 0.35),
          deep: colour.ink.clone().multiplyScalar(0.45),
          pale: colour.cloud.clone().lerp(colour.horizon, 0.3),
        },
        bin,
      ),
      // Pale ice-blue, so the facts read apart from the green logo.
      { glow, etchGlow: colour.cloud.clone().lerp(colour.horizon, 0.4).multiplyScalar(2.2) },
      bin,
    ),
  )
  const reveal = buildReveal(renderer, bin)
  const cover = buildSnowCover(
    reveal,
    logo.texture,
    etching.texture,
    grain,
    {
      snow: colour.frost.clone().lerp(colour.haze, 0.08),
      glow: colour.fern.clone().multiplyScalar(0.9),
      etch: colour.ink.clone().lerp(colour.haze, 0.2),
    },
    shading,
    coolShade,
    lowPower ? 380 : 760,
    bin,
  )
  ;(cover.material as MeshStandardMaterial).customProgramCacheKey = () => 'hero-snow-cover'
  bed.add(cover)
  bed.updateMatrixWorld(true)

  const mist = buildMist(colour.frost, bin)
  scene.add(mist.group)

  // Survey marks on the slab's corners and the bearcat.
  const survey = buildSurvey(colour.cloud, bin)
  scene.add(survey.group)
  const lift = SNOW_DEPTH + 0.3
  const surveyPoints = [
    new Vector3(-BED.width / 2, lift, -BED.depth / 2),
    new Vector3(BED.width / 2, lift, -BED.depth / 2),
    new Vector3(BED.width / 2, lift, BED.depth / 2),
    new Vector3(-BED.width / 2, lift, BED.depth / 2),
    new Vector3(
      (LOCKUP_LEFT / BED_CANVAS.width - 0.5) * BED.width + 0.9,
      lift + 0.3,
      LOCKUP_Z,
    ),
  ].map((point) => point.applyMatrix4(bed.matrixWorld))

  let snowfall: ReturnType<typeof buildSnowfall> | null = null
  if (animate) {
    snowfall = buildSnowfall(
      1300,
      new Vector3(60, 22, 60),
      new Vector3(-30, 0, -40),
      colour.cloud,
      55,
      3,
    )
    bin.push(snowfall.geometry, snowfall.material)
    scene.add(snowfall.points)
  }

  /* ---- Output: bloom keys on values above 1, then the film finish ---- */
  const target = new WebGLRenderTarget(4, 4, { type: HalfFloatType, samples: 4 })
  const composer = new EffectComposer(renderer, target)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new Vector2(256, 256), 0.42, 0.55, 1)
  composer.addPass(bloom)
  const output = new OutputPass()
  composer.addPass(output)
  const finish = new ShaderPass(FINISH_SHADER)
  composer.addPass(finish)
  bin.push(target, bloom, output, finish)

  /**
   * The intro, as on igloo.inc: the first frames are a flat wash of the page's
   * ground that clears over about a second, while the camera settles from
   * high above onto its scroll pose over about three. Time-driven, once per
   * page view; skipped entirely when the scene does not animate (reduced
   * motion), which starts at rest. The wash lives in the finish pass, so the
   * tiers that skip post-processing (phones, an overloaded GPU) get the
   * camera's settle without it; the canvas's own fade-in covers them. (The
   * finish pass runs after the output pass, in display colours, hence the
   * conversion.)
   */
  let introStart: number | null = null
  const washColour = finish.uniforms.uWashColour?.value
  if (washColour instanceof Color) washColour.copy(colour.frost).convertLinearToSRGB()

  /** 0 full quality, 1 no post, 2 no post and 1x. Falls under sustained load. */
  let tier = lowPower ? 1 : 0
  let width = 1
  let height = 1
  let pixelRatio = 1
  let bandTop = 0
  let bandBottom = 0
  let lastTime = 0
  let slowTime = 0
  let slowFrames = 0

  const applySize = () => {
    const ratio = tier >= 2 ? 1 : Math.min(pixelRatio, 1.5)
    renderer.setPixelRatio(ratio)
    renderer.setSize(width, height, false)
    composer.setPixelRatio(ratio)
    composer.setSize(width, height)
  }

  const position = new Vector3()
  const lookAt = new Vector3()
  const ray = new Raycaster()
  const pointer = new Vector2()
  const hit = new Vector3()
  const brushPlane = new Plane().setFromNormalAndCoplanarPoint(
    new Vector3(0, 1, 0).applyQuaternion(bed.quaternion),
    new Vector3(0, 0.2, 0).applyMatrix4(bed.matrixWorld),
  )
  const local = new Vector3()
  const sunView = new Vector3()

  const frame = (
    seconds: number,
    progress: number,
    pointerX: number,
    pointerY: number,
    brush?: { x: number; y: number } | null,
  ) => {
    const time = animate ? seconds : 0
    if (animate) {
      const delta = seconds - lastTime
      lastTime = seconds
      if (delta > 0 && delta < 0.25) {
        slowTime += delta
        slowFrames += 1
        if (slowFrames >= 50) {
          if (slowTime / slowFrames > 0.045 && tier < 2) {
            tier += 1
            applySize()
          }
          slowTime = 0
          slowFrames = 0
        }
      }
    }

    let intro = 1
    let wash = 0
    if (animate) {
      if (introStart === null) introStart = seconds
      const t = seconds - introStart
      intro = easeInOutCubic(clamp01((t - 0.1) / (HERO_INTRO_SECONDS - 0.1)))
      wash = 1 - easeInOutCubic(clamp01(t / 1.1))
    }
    const washUniform = finish.uniforms.uWash
    if (washUniform) washUniform.value = wash
    const lifted = 1 - intro

    const p = clamp01(progress)
    const aspect = width / height
    const portrait = clamp01(1 - aspect)
    camera.fov = 32 + portrait * 14
    camera.aspect = aspect
    camera.updateProjectionMatrix()

    // Frame the slab in the band the page's copy leaves free.
    const hasBand = bandBottom > bandTop
    const top = hasBand ? bandTop : 0
    const free = hasBand ? bandBottom - bandTop : height
    const share = Math.max(0.2, free / height)
    const aim = 1 - (2 * (top + free * 0.66)) / height
    const tanHalf = Math.tan((camera.fov * Math.PI) / 360)
    const elevation = mix(0.2, 0.13, p) + portrait * 0.5 - pointerY * 0.02 + lifted * 0.85
    const yaw = 0.12 + Math.sin(time * 0.1) * 0.03 + pointerX * 0.05 + lifted * 0.55
    const fit = Math.max(
      (BED.width * (1.16 - portrait * 0.12)) / (2 * tanHalf * aspect),
      (BED.depth * Math.sin(elevation + BED_TILT) + 1.4) / (2 * tanHalf * 0.82 * share),
    )
    const reach = fit * mix(1.08, 1.32, p) * (1 + lifted * 0.7)
    position.set(
      Math.sin(yaw) * Math.cos(elevation) * reach,
      BED.y + Math.sin(elevation) * reach,
      Math.cos(yaw) * Math.cos(elevation) * reach,
    )
    const pitch = elevation + Math.atan(aim * tanHalf)
    lookAt.set(
      position.x - Math.sin(yaw) * Math.cos(pitch),
      position.y - Math.sin(pitch),
      position.z - Math.cos(yaw) * Math.cos(pitch),
    )
    camera.position.copy(position)
    camera.lookAt(lookAt)
    camera.updateMatrixWorld()

    // Brush the snow where the pointer meets it.
    if (brush) {
      pointer.set(brush.x, -brush.y)
      ray.setFromCamera(pointer, camera)
      if (ray.ray.intersectPlane(brushPlane, hit)) {
        bed.worldToLocal(local.copy(hit))
        reveal.brush(local.x, local.z)
      }
      else reveal.lift()
    } else {
      reveal.lift()
    }
    reveal.update(seconds, animate)

    shading.sunView.value.copy(sunView.copy(sunDirection).transformDirection(camera.matrixWorldInverse))
    survey.update(surveyPoints, camera, 0.75 - p * 0.45)

    sky.mesh.position.copy(position)
    const skyTime = sky.material.uniforms.uTime
    if (skyTime) skyTime.value = time
    const mistTime = mist.material.uniforms.uTime
    if (mistTime) mistTime.value = time
    const finishTime = finish.uniforms.uTime
    if (finishTime) finishTime.value = time % 100
    if (snowfall) {
      const { uniforms } = snowfall.material
      if (uniforms.uTime) uniforms.uTime.value = time
      if (uniforms.uScale) {
        uniforms.uScale.value =
          (0.5 * height * renderer.getPixelRatio()) / (2 * tanHalf)
      }
    }

    if (tier === 0) composer.render()
    else renderer.render(scene, camera)
  }

  return {
    ready: Promise.all([logo.ready, etching.ready]).then(() => undefined),
    setEtching: etching.set,
    lift: reveal.lift,
    resize(nextWidth, nextHeight, dpr) {
      width = nextWidth
      height = nextHeight
      pixelRatio = dpr
      applySize()
    },
    setBand(topPx, bottomPx) {
      bandTop = topPx
      bandBottom = bottomPx
    },
    render: frame,
    dispose() {
      for (const item of bin) item.dispose()
      composer.dispose()
      sun.shadow.dispose()
      renderer.dispose()
    },
  }
}

function createIce(
  renderer: WebGLRenderer,
  colour: Palette,
  variant: 'pine' | 'igloo',
  { animate, lowPower }: SnowSceneOptions,
): SnowSceneHandle {
  const bin: Disposable[] = []
  renderer.transmissionResolutionScale = lowPower ? 0.5 : 1

  const scene = new Scene()
  const camera = new PerspectiveCamera(30, 1, 0.5, 60)

  // The backdrop matches the page, so the feathered edge disappears into it.
  const backdropGeometry = new SphereGeometry(30, 24, 12)
  const backdropMaterial = new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTop: { value: colour.frost },
      uBottom: { value: colour.frost.clone().lerp(colour.horizon, 0.4) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDirection;
      void main() {
        vDirection = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop;
      uniform vec3 uBottom;
      varying vec3 vDirection;
      void main() {
        float t = smoothstep(-0.28, 0.2, normalize(vDirection).y);
        gl_FragColor = vec4(mix(uBottom, uTop, t), 1.0);
        #include <colorspace_fragment>
      }
    `,
  })
  scene.add(new Mesh(backdropGeometry, backdropMaterial))
  bin.push(backdropGeometry, backdropMaterial)

  // A tiny studio, rendered once into an environment map for the reflections.
  const studio = new Scene()
  studio.background = colour.frost.clone().lerp(colour.haze, 0.45)
  const panelGeometry = new PlaneGeometry(1, 1)
  const addPanel = (tone: Color, x: number, y: number, z: number, size: number) => {
    const material = new MeshBasicMaterial({ color: tone, side: DoubleSide })
    const panel = new Mesh(panelGeometry, material)
    panel.position.set(x, y, z)
    panel.scale.setScalar(size)
    panel.lookAt(0, 0, 0)
    studio.add(panel)
    bin.push(material)
  }
  addPanel(colour.cloud.clone().multiplyScalar(5), -5, 6, 5, 6)
  addPanel(colour.horizon.clone().multiplyScalar(3), 7, 1, 3, 5)
  addPanel(colour.ink.clone().multiplyScalar(0.5), 0, -7, 2, 9)
  const generator = new PMREMGenerator(renderer)
  const environment = generator.fromScene(studio, 0.03)
  generator.dispose()
  bin.push(panelGeometry, environment)

  scene.add(new HemisphereLight(colour.frost, colour.haze, 2.2))
  const key = new DirectionalLight(colour.cloud, 2.2)
  key.position.set(-3, 5, 6)
  scene.add(key)

  const specimen = new Group()
  scene.add(specimen)

  const iceGeometry = buildIceGeometry(lowPower ? 18 : 30)
  const iceGrain = buildIceGrain()
  const iceMaterial = new MeshPhysicalMaterial({
    color: colour.cloud.clone().lerp(colour.horizon, 0.12),
    roughness: 0.55,
    roughnessMap: iceGrain,
    metalness: 0,
    transmission: 1,
    thickness: 1.1,
    ior: 1.31,
    attenuationColor: colour.horizon.clone().lerp(colour.sky, 0.25),
    attenuationDistance: 5,
    envMap: environment.texture,
    envMapIntensity: 1.7,
    specularIntensity: 1,
    bumpMap: iceGrain,
    bumpScale: 2.5,
    side: DoubleSide,
  })
  specimen.add(new Mesh(iceGeometry, iceMaterial))
  bin.push(iceGeometry, iceMaterial, iceGrain)

  // Trapped flaws: small pale flakes that give the refraction something to
  // bend, the way cracks and bubbles do in real ice.
  const flawGeometry = new IcosahedronGeometry(1, 0)
  const flawMaterial = new MeshStandardMaterial({
    color: colour.cloud,
    roughness: 0.6,
    metalness: 0,
    flatShading: true,
  })
  const flaws = new InstancedMesh(flawGeometry, flawMaterial, 26)
  const flawRandom = seeded(variant === 'pine' ? 71 : 72)
  const flaw = new Object3D()
  for (let i = 0; i < 26; i += 1) {
    flaw.position.set(
      (flawRandom() - 0.5) * 1.5,
      (flawRandom() - 0.5) * 2.3,
      (flawRandom() - 0.5) * 1.2,
    )
    flaw.rotation.set(flawRandom() * 6, flawRandom() * 6, flawRandom() * 6)
    flaw.scale.set(
      0.03 + flawRandom() * 0.13,
      0.012 + flawRandom() * 0.03,
      0.02 + flawRandom() * 0.09,
    )
    flaw.updateMatrix()
    flaws.setMatrixAt(i, flaw.matrix)
  }
  specimen.add(flaws)
  bin.push(flawGeometry, flawMaterial)

  const grain = buildSnowGrain()
  bin.push(grain)
  if (variant === 'pine') {
    const pineGeometry = buildPine(colour.ink, colour.cloud, colour.brick)
    const pineMaterial = new MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0,
    })
    const tree = new Mesh(pineGeometry, pineMaterial)
    tree.scale.setScalar(0.27)
    tree.position.y = -0.86
    specimen.add(tree)
    bin.push(pineGeometry, pineMaterial)
  } else {
    const igloo = buildIgloo(
      {
        block: colour.frost.clone().lerp(colour.haze, 0.45),
        cool: colour.horizon,
        glow: colour.horizon.clone().lerp(colour.cloud, 0.4).multiplyScalar(1.4),
      },
      grain,
      bin,
    )
    igloo.group.scale.setScalar(0.2)
    igloo.group.position.set(0, -0.32, 0.04)
    igloo.group.rotation.y = 0.5
    igloo.update(0.28, 0, null)
    specimen.add(igloo.group)
  }

  let width = 1
  let height = 1
  const seed = variant === 'pine' ? 0.4 : 2.2

  return {
    resize(nextWidth, nextHeight, dpr) {
      width = nextWidth
      height = nextHeight
      renderer.setPixelRatio(dpr)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      const tanHalf = Math.tan((camera.fov * Math.PI) / 360)
      camera.position.set(0, 0, Math.max(2.3 / tanHalf, 1.9 / (tanHalf * camera.aspect)))
      camera.updateProjectionMatrix()
    },
    ready: Promise.resolve(),
    setBand() {},
    setEtching() {},
    lift() {},
    render(seconds, progress, pointerX, pointerY) {
      const time = animate ? seconds : 0
      const travel = progress - 0.5
      // A little parallax toward the pointer, as igloo.inc's cameras have.
      // The caller eases the pointer and holds its last position, relative
      // to this block; it is zero until a mouse first moves.
      const sway = animate ? 1 : 0
      specimen.rotation.set(
        0.18 + travel * 1.1 + pointerY * 0.12 * sway,
        seed + travel * 2.6 + time * 0.07 + pointerX * 0.3 * sway,
        -0.12 + travel * 0.5,
      )
      specimen.position.y = Math.sin(time * 0.5) * 0.05
      renderer.render(scene, camera)
    },
    dispose() {
      for (const item of bin) item.dispose()
      renderer.dispose()
    },
  }
}
