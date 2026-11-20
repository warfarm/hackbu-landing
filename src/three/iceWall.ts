/**
 * The prize tracks' wall of ice, in 3D: one block per track, laid exactly where
 * the section's tab buttons are, with the track's icon, number and name etched
 * into the block's face.
 *
 * The buttons stay the real controls (keyboard, screen readers, the click
 * target); this scene only draws behind them. To keep the two in register,
 * the camera is set so the plane z = 0 maps 1:1 onto the canvas's CSS pixels:
 * each block's front face sits at z = 0 on its button's rectangle, and its
 * depth runs away from the viewer. The camera sits up and to the left of the
 * wall, looking straight in, with its lens shifted (`setViewOffset`) back
 * onto the canvas — so the perspective shows the blocks' tops and sides while
 * their faces stay exactly on the buttons. The chosen block comes out of the
 * wall, clear of its neighbours (and shallower, so its side does not cover
 * theirs) and lights softly from inside; the others dim. A hovered
 * block dims less.
 *
 * The etching is a canvas mask per block (white strokes on black). The face
 * shader darkens the grooves to a deep, cool blue and bends the surface
 * normal across every stroke's walls, so the strokes catch the light along one
 * edge and fall into shadow along the other, like letters cut into ice.
 *
 * Everything is built from the palette tokens; nothing is downloaded but the
 * page's own font. Like snowScene.ts this is a dynamic import, so three.js
 * stays off the critical path.
 */
import {
  ACESFilmicToneMapping,
  CanvasTexture,
  Color,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NoColorSpace,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  RepeatWrapping,
  Scene,
  Vector2,
  WebGLRenderer,
} from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { SnowPalette } from './snowScene'

/** What one block carries. `icon` is a list of SVG path strings in a 24x24 box. */
export type WallBrick = {
  name: string
  number: string
  kicker: string
  icon: readonly string[]
  /** Top-course blocks carry a cap of snow. */
  capped: boolean
}

/** A button's rectangle, in CSS pixels from the canvas's top-left corner. */
export type WallRect = { x: number; y: number; width: number; height: number }

export type IceWallHandle = {
  /** Resolves once the font is in and every face has been etched. */
  ready: Promise<void>
  resize: (width: number, height: number, dpr: number) => void
  /** Where each block's face goes; re-etches a face whose shape changed. */
  layout: (rects: readonly WallRect[]) => void
  setState: (chosen: number, hovered: number | null) => void
  /** Draw a frame; true while anything is still moving. */
  render: (seconds: number) => boolean
  dispose: () => void
}

type Disposable = { dispose: () => void }

const FAMILY = '"IBM Plex Mono", ui-monospace, monospace'
/** Width of each face's etching mask, in texels. */
const MASK_WIDTH = 1024
const FOV = 46
/** Where the camera sits off the wall's centre, as fractions of the canvas. */
const SHIFT = { x: 0.24, y: 0.3 } as const
/**
 * How much of its depth the chosen block gives up while it is out. Clear of
 * the wall, its whole side shows, laid over the neighbour on the camera's
 * side: that side is what says the block has come out, but past about two
 * thirds of the depth it would reach the neighbour's etched number.
 */
const CHOSEN_SHALLOWING = 0.4
/**
 * How far the blocks close on where they are going in one 60 Hz frame (scaled
 * to the real frame time): low enough that the chosen block's slide out of
 * the wall is seen, about half a second at any refresh rate.
 */
const EASE = 0.09
/** How far the blocks that are not chosen darken (0 none, 1 black). */
const DIM_DEPTH = 0.38
/** How much of that shade the chosen block keeps, so its pale ice is not white. */
const CHOSEN_SHADE = 0.35
/** How far the chosen block turns as it is held up to the light, in radians. */
const TURN = { y: 0.035, x: 0.02 } as const

/**
 * How far forward the chosen block has to come for all of it to clear the
 * wall's face (z = 0), by a few pixels. It slides along the camera's line of
 * sight and shrinks by `(distance - z) / distance` as it does (so its face
 * stays on its button), gives up CHOSEN_SHALLOWING of its depth, and turns a
 * little, which swings its back corners toward the wall; solved for z.
 */
function clearOfWall(block: Block, distance: number): number {
  const width = block.body.scale.x
  const height = block.body.scale.y
  const swing = (width / 2) * TURN.y + (height / 2) * TURN.x
  const back = block.depth * (1 - CHOSEN_SHALLOWING)
  return (back + swing + 4) / (1 + back / distance)
}

/**
 * Draw one face's etching: icon top left, number top right, then "BEST" and
 * the name along the foot — the same arrangement as the button's own text.
 */
function etchFace(
  canvas: HTMLCanvasElement,
  brick: WallBrick,
  aspect: number,
  /** The face's width on screen, in CSS pixels, to keep small type legible. */
  screenWidth: number,
): void {
  const width = MASK_WIDTH
  // The mask has the face's own proportions, so nothing is squashed.
  const height = Math.max(96, Math.round(width * aspect))
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return
  context.fillStyle = '#000'
  context.fillRect(0, 0, width, height)
  context.fillStyle = '#fff'
  context.strokeStyle = '#fff'
  context.textBaseline = 'alphabetic'
  const pad = width * 0.075

  // "BEST" and the number: never under about 10.5 CSS pixels on screen.
  const legible = Math.ceil((10.5 * width) / Math.max(screenWidth, 1))
  const small = Math.round(Math.min(Math.max(width * 0.042, legible), height * 0.16))

  // The name: as large as the face allows, on one line, along the foot.
  const room = width - pad * 2
  let size = Math.round(Math.min(width * 0.085, height * 0.22))
  context.font = `600 ${size}px ${FAMILY}`
  const measured = context.measureText(brick.name).width
  if (measured > room) {
    size = Math.max(18, Math.floor((size * room) / measured))
    context.font = `600 ${size}px ${FAMILY}`
  }
  const baseline = height - pad * 0.9
  context.fillText(brick.name, pad, baseline)
  const kickerBaseline = baseline - size * 1.15
  context.font = `600 ${small}px ${FAMILY}`
  context.fillText(brick.kicker.toUpperCase(), pad, kickerBaseline)

  // The number, top right.
  context.textAlign = 'right'
  context.fillText(brick.number, width - pad, pad + small)
  context.textAlign = 'left'

  // The icon, from the same 24-unit paths the button draws: as large as the
  // room above the kicker allows, so a short face never crowds it.
  const above = kickerBaseline - small - pad - small * 0.6
  const iconSize = Math.min(width * 0.11, above)
  if (iconSize > 12) {
    context.save()
    context.translate(pad, pad)
    context.scale(iconSize / 24, iconSize / 24)
    context.lineWidth = 1.7
    context.lineCap = 'round'
    context.lineJoin = 'round'
    for (const d of brick.icon) context.stroke(new Path2D(d))
    context.restore()
  }
}

/** Fine frost for the blocks' bodies: speckle and streaks, tiling. */
function buildFrost(bin: Disposable[]): CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = NoColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  bin.push(texture)
  if (!context) return texture
  context.fillStyle = '#808080'
  context.fillRect(0, 0, size, size)
  let seed = 17
  const random = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  for (let i = 0; i < 2600; i += 1) {
    const shade = Math.round(90 + random() * 120)
    context.fillStyle = `rgb(${shade}, ${shade}, ${shade})`
    context.fillRect(random() * size, random() * size, 1 + random() * 2, 1 + random() * 2)
  }
  context.strokeStyle = 'rgba(255, 255, 255, 0.35)'
  context.lineWidth = 1
  for (let i = 0; i < 26; i += 1) {
    const x = random() * size
    const y = random() * size
    const angle = 1.1 + random() * 0.5
    const length = 20 + random() * 60
    for (const [dx, dy] of [[0, 0], [size, 0], [-size, 0], [0, size], [0, -size]] as const) {
      context.beginPath()
      context.moveTo(x + dx, y + dy)
      context.lineTo(x + dx + Math.cos(angle) * length, y + dy + Math.sin(angle) * length)
      context.stroke()
    }
  }
  return texture
}

type Block = {
  group: Group
  body: Mesh
  cap: Mesh | null
  mask: HTMLCanvasElement
  etch: CanvasTexture
  uniforms: {
    uEtch: { value: CanvasTexture }
    uTexel: { value: Vector2 }
    uLit: { value: number }
    uDim: { value: number }
  }
  /** The block's own snow cap material, so the cap dims with the block. */
  capMaterial: MeshStandardMaterial | null
  aspect: number
  /** The face's width on screen when it was last etched. */
  screenWidth: number
  /** The centre of the block's button, in scene units. */
  home: { x: number; y: number }
  depth: number
  z: number
  lit: number
  /** 0 full brightness, 1 fully dimmed (the blocks that are not chosen). */
  dim: number
}

export function createIceWall(
  canvas: HTMLCanvasElement,
  context: WebGL2RenderingContext,
  palette: SnowPalette,
  bricks: readonly WallBrick[],
  { animate }: { animate: boolean },
): IceWallHandle {
  const colour = {
    cloud: new Color(palette.cloud),
    frost: new Color(palette.frost),
    horizon: new Color(palette.horizon),
    haze: new Color(palette.haze),
    ink: new Color(palette.ink),
    sky: new Color(palette.sky),
  }
  const bin: Disposable[] = []
  const renderer = new WebGLRenderer({ canvas, context, alpha: true, antialias: true })
  renderer.setClearColor(colour.frost, 0)
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.95
  // The chosen block casts a soft shadow onto the wall beside it (from `rim`
  // below), which is what shows how far out it stands.
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFShadowMap

  const scene = new Scene()
  const camera = new PerspectiveCamera(FOV, 1, 1, 10_000)

  // A small studio, rendered once into an environment map: a bright cloud
  // panel up and left, a horizon panel to the right, ink below — the same
  // lighting the section scenes use, so the wall belongs with them.
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

  scene.add(new HemisphereLight(colour.frost, colour.haze, 0.8))
  const key = new DirectionalLight(colour.cloud, 2.2)
  scene.add(key, key.target)
  // The light the chosen block's shadow comes from. The key sits up and to
  // the left, on the camera's side, so its shadows fall behind the blocks
  // where they cannot be seen. This one is aimed per chosen block from the
  // side away from the rest of the wall, so the shadow always falls across
  // the neighbouring blocks it came out of (there is nothing else for it to
  // land on). Only the chosen block casts, so the flush faces never shade
  // themselves. It is soft and partial: the etched labels it falls on still
  // read.
  const rim = new DirectionalLight(colour.cloud, 1.8)
  rim.castShadow = true
  rim.shadow.mapSize.set(1024, 1024)
  rim.shadow.radius = 4
  rim.shadow.bias = -0.0005
  rim.shadow.normalBias = 1
  scene.add(rim, rim.target)

  const frost = buildFrost(bin)
  const geometry = new RoundedBoxGeometry(1, 1, 1, 4, 0.06)
  const capGeometry = new RoundedBoxGeometry(1, 1, 1, 4, 0.48)
  const capMaterial = new MeshStandardMaterial({
    color: colour.cloud,
    // Snow scatters light back out: a little of its own, or it reads grey.
    emissive: colour.cloud,
    emissiveIntensity: 0.35,
    roughness: 0.95,
    bumpMap: frost,
    bumpScale: 1.5,
  })
  bin.push(geometry, capGeometry, capMaterial)

  const etchTint = colour.ink.clone().lerp(colour.sky, 0.25)
  const glow = colour.horizon.clone().lerp(colour.cloud, 0.3).multiplyScalar(1.5)
  const deep = colour.horizon.clone().lerp(colour.sky, 0.55)

  const blocks: Block[] = bricks.map((brick, index) => {
    const mask = document.createElement('canvas')
    etchFace(mask, brick, 0.6, 300)
    const etch = new CanvasTexture(mask)
    etch.colorSpace = NoColorSpace
    etch.anisotropy = 8
    const uniforms = {
      uEtch: { value: etch },
      uTexel: { value: new Vector2(1.5 / mask.width, 1.5 / mask.height) },
      uLit: { value: 0 },
      uDim: { value: 0 },
    }
    const material = new MeshPhysicalMaterial({
      // Each block a slightly different ice, as cut blocks are.
      color: colour.cloud.clone().lerp(colour.horizon, 0.42 + (index % 3) * 0.06),
      roughness: 0.3,
      roughnessMap: frost,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      envMap: environment.texture,
      envMapIntensity: 0.95,
      bumpMap: frost,
      bumpScale: 0.6,
    })
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms, {
        uEtchTint: { value: etchTint },
        uGlow: { value: glow },
        uDeep: { value: deep },
      })
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
          varying vec2 vFront;
          varying float vFace;
          varying vec3 vTanX;
          varying vec3 vTanY;`,
        )
        .replace(
          '#include <beginnormal_vertex>',
          `#include <beginnormal_vertex>
          vFace = objectNormal.z;`,
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          // The front face spans the unit box's x and y.
          vFront = position.xy + 0.5;
          vTanX = normalize(normalMatrix * vec3(1.0, 0.0, 0.0));
          vTanY = normalize(normalMatrix * vec3(0.0, 1.0, 0.0));`,
        )
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          uniform sampler2D uEtch;
          uniform vec2 uTexel;
          uniform float uLit;
          uniform float uDim;
          uniform vec3 uEtchTint;
          uniform vec3 uGlow;
          uniform vec3 uDeep;
          varying vec2 vFront;
          varying float vFace;
          varying vec3 vTanX;
          varying vec3 vTanY;
          float etchAt(vec2 uv) { return texture2D(uEtch, uv).r; }`,
        )
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          float front = smoothstep(0.55, 0.85, vFace);
          float etch = etchAt(vFront) * front;
          // Ice reads deeper toward the block's foot, and deepest through
          // its sides, where the light has the most ice to cross.
          diffuseColor.rgb = mix(diffuseColor.rgb, uDeep, (1.0 - vFront.y) * 0.45 * front);
          diffuseColor.rgb = mix(diffuseColor.rgb, uDeep, (1.0 - front) * 0.6);
          // Frost and the grain it froze in.
          #ifdef USE_ROUGHNESSMAP
            diffuseColor.rgb *= 0.88 + 0.24 * texture2D(roughnessMap, vRoughnessMapUv).r;
          #endif
          // The grooves: cut down into darker, colder ice.
          diffuseColor.rgb = mix(diffuseColor.rgb, uEtchTint, etch * 0.82);`,
        )
        .replace(
          '#include <normal_fragment_maps>',
          `#include <normal_fragment_maps>
          // The grooves' walls: tilt the normal across every stroke edge.
          float ex = etchAt(vFront + vec2(uTexel.x, 0.0)) - etchAt(vFront - vec2(uTexel.x, 0.0));
          float ey = etchAt(vFront + vec2(0.0, uTexel.y)) - etchAt(vFront - vec2(0.0, uTexel.y));
          normal = normalize(normal + (ex * vTanX + ey * vTanY) * 1.8 * front);`,
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
          // Light caught inside the ice at the edges; the chosen block glows
          // through its body, the lettering left dark so it still reads.
          totalEmissiveRadiance += uGlow * ((1.0 - front) * (0.06 + uLit * 0.3) + front * uLit * 0.06) * (1.0 - etch);`,
        )
        .replace(
          '#include <opaque_fragment>',
          `// The grooves sit below the glossy surface: the clear coat's
          // reflection does not reach into them.
          // On a dimmed block the grooves go deeper still, so the lettering
          // keeps its contrast against the darker ice.
          outgoingLight = mix(outgoingLight, outgoingLight * 0.32 * (1.0 - 0.4 * uDim), etch);
          // The blocks that are not chosen step back into the shade.
          outgoingLight *= 1.0 - ${DIM_DEPTH.toFixed(2)} * uDim;
          #include <opaque_fragment>`,
        )
    }
    material.customProgramCacheKey = () => 'ice-wall-block'
    const body = new Mesh(geometry, material)
    body.receiveShadow = true
    const group = new Group()
    group.add(body)
    let cap: Mesh | null = null
    let ownCapMaterial: MeshStandardMaterial | null = null
    if (brick.capped) {
      ownCapMaterial = capMaterial.clone()
      cap = new Mesh(capGeometry, ownCapMaterial)
      cap.receiveShadow = true
      group.add(cap)
      bin.push(ownCapMaterial)
    }
    scene.add(group)
    bin.push(material, etch)
    return {
      group,
      body,
      cap,
      mask,
      etch,
      uniforms,
      capMaterial: ownCapMaterial,
      aspect: 0.6,
      screenWidth: 300,
      home: { x: 0, y: 0 },
      depth: 40,
      z: 0,
      lit: 0,
      dim: 0,
    }
  })

  let width = 1
  let height = 1
  /** The camera's position: where every block's slide toward it aims. */
  const eye = { x: 0, y: 0, distance: 1 }
  let chosen = 0
  let hovered: number | null = null
  let lastSeconds: number | null = null
  /** Where the rim light comes from, eased so it never jumps between choices. */
  const rimFrom = { x: 1, y: 0.4 }

  const ready = document.fonts
    .load(`600 64px ${FAMILY}`)
    .then(
      () => undefined,
      () => undefined,
    )
    .then(() => {
      blocks.forEach((block, index) => {
        const brick = bricks[index]
        if (!brick) return
        etchFace(block.mask, brick, block.aspect, block.screenWidth)
        block.etch.needsUpdate = true
      })
    })

  return {
    ready,
    resize(nextWidth, nextHeight, dpr) {
      width = Math.max(1, nextWidth)
      height = Math.max(1, nextHeight)
      renderer.setPixelRatio(Math.min(dpr, 1.75))
      renderer.setSize(width, height, false)
      // The camera sits `shift` up and left of the canvas's centre, looking
      // straight in. Its virtual view is wider and taller by twice the shift,
      // and the lens is shifted back so the canvas is the window at its
      // lower right — which keeps z = 0 at 1:1 CSS pixels, y down the page.
      const shiftX = width * SHIFT.x
      const shiftY = height * SHIFT.y
      const fullWidth = width + shiftX * 2
      const fullHeight = height + shiftY * 2
      const distance = fullHeight / 2 / Math.tan((FOV * Math.PI) / 360)
      camera.aspect = fullWidth / fullHeight
      camera.position.set(width / 2 - shiftX, -height / 2 + shiftY, distance)
      camera.near = distance * 0.2
      camera.far = distance * 3
      camera.lookAt(width / 2 - shiftX, -height / 2 + shiftY, 0)
      eye.x = width / 2 - shiftX
      eye.y = -height / 2 + shiftY
      eye.distance = distance
      camera.setViewOffset(fullWidth, fullHeight, shiftX * 2, shiftY * 2, width, height)
      camera.updateProjectionMatrix()
      key.position.set(-width * 0.2, height * 0.8, distance)
      key.target.position.set(width / 2, -height / 2, -distance * 0.2)
      // The shadow map covers the whole wall, seen along the light.
      const span = Math.max(width, height) * 0.8
      const shadowCamera = rim.shadow.camera
      shadowCamera.left = -span
      shadowCamera.right = span
      shadowCamera.top = span
      shadowCamera.bottom = -span
      shadowCamera.near = 1
      shadowCamera.far = distance * 3
      shadowCamera.updateProjectionMatrix()
    },
    layout(rects) {
      rects.forEach((rect, index) => {
        const block = blocks[index]
        const brick = bricks[index]
        if (!block || !brick || rect.width < 1 || rect.height < 1) return
        const depth = Math.max(30, Math.min(110, Math.min(rect.width, rect.height) * 0.62))
        block.depth = depth
        block.home = { x: rect.x + rect.width / 2, y: -(rect.y + rect.height / 2) }
        block.body.scale.set(rect.width, rect.height, depth)
        block.body.position.z = -depth / 2
        if (block.cap) {
          // A mound of snow sunk into the block's top, not a slab on it.
          const capHeight = Math.max(12, rect.height * 0.16)
          block.cap.scale.set(rect.width * 0.82, capHeight, depth * 0.92)
          block.cap.position.set(-rect.width * 0.03, rect.height / 2 + capHeight * 0.12, -depth / 2)
        }
        const aspect = rect.height / rect.width
        const resized = Math.abs(rect.width - block.screenWidth) / rect.width > 0.1
        if (Math.abs(aspect - block.aspect) > 0.02 || resized) {
          block.aspect = aspect
          block.screenWidth = rect.width
          etchFace(block.mask, brick, aspect, rect.width)
          block.uniforms.uTexel.value.set(1.5 / block.mask.width, 1.5 / block.mask.height)
          // A canvas that changed size needs a fresh texture upload.
          block.etch.dispose()
          block.etch.needsUpdate = true
        }
      })
    },
    setState(nextChosen, nextHovered) {
      chosen = nextChosen
      hovered = nextHovered
    },
    render(seconds) {
      let moving = false
      const frames = lastSeconds === null ? 1 : Math.min(6, Math.max(0, (seconds - lastSeconds) * 60))
      lastSeconds = seconds
      const ease = animate ? 1 - (1 - EASE) ** frames : 1
      // Aim the shadow light from the chosen block's side away from the rest
      // of the wall, a little from above: its shadow falls toward the others.
      const picked = blocks[chosen]
      if (picked && blocks.length > 1) {
        let towardX = 0
        let towardY = 0
        blocks.forEach((other, index) => {
          if (index === chosen) return
          towardX += other.home.x - picked.home.x
          towardY += other.home.y - picked.home.y
        })
        const length = Math.hypot(towardX, towardY) || 1
        const fromX = -towardX / length
        const fromY = -towardY / length + 0.35
        rimFrom.x += (fromX - rimFrom.x) * ease
        rimFrom.y += (fromY - rimFrom.y) * ease
        const reach = eye.distance * 0.9
        rim.position.set(
          picked.home.x + rimFrom.x * reach,
          picked.home.y + rimFrom.y * reach,
          eye.distance * 0.9,
        )
        rim.target.position.set(picked.home.x, picked.home.y, 0)
      }
      blocks.forEach((block, index) => {
        const isChosen = index === chosen
        // Only the chosen block leaves the wall, and all the way: its back
        // face (shrunk and grown with it, and turning a little) ends in front
        // of the wall's face, so it never cuts into a neighbour. A hovered
        // block stays put, only brightening, so it cannot meet the chosen one.
        const zTarget = isChosen ? clearOfWall(block, eye.distance) : 0
        const litTarget = isChosen ? 1 : 0
        // The chosen block keeps a little shade of its own, so its pale ice
        // does not read as white beside the dimmed rest.
        const dimTarget = isChosen ? CHOSEN_SHADE : index === hovered ? 0.55 : 1
        block.z += (zTarget - block.z) * ease
        block.lit += (litTarget - block.lit) * ease
        block.dim += (dimTarget - block.dim) * ease
        if (
          Math.abs(zTarget - block.z) > 0.05 ||
          Math.abs(litTarget - block.lit) > 0.005 ||
          Math.abs(dimTarget - block.dim) > 0.005
        ) {
          moving = true
        }
        // Slide toward the camera along the line of sight through the
        // button's centre, shrinking to match: the face stays on its button
        // (and its focus ring) at any depth, so the block slides out without
        // growing. Without this a block off the camera's axis would drift
        // tens of pixels off its button, past the canvas.
        const toward = (eye.distance - block.z) / eye.distance
        block.group.position.set(
          eye.x + (block.home.x - eye.x) * toward,
          eye.y + (block.home.y - eye.y) * toward,
          block.z,
        )
        block.group.scale.setScalar(toward)
        // Shallower as it comes out, from its face back.
        const thickness = block.depth * (1 - CHOSEN_SHALLOWING * block.lit)
        block.body.scale.z = thickness
        block.body.position.z = -thickness / 2
        if (block.cap) {
          block.cap.scale.z = thickness * 0.92
          block.cap.position.z = -thickness / 2
        }
        // The chosen block turns a hair, as if held up to the light.
        block.group.rotation.y = isChosen && animate ? Math.sin(seconds * 0.9) * TURN.y : 0
        block.group.rotation.x = isChosen && animate ? Math.sin(seconds * 0.7 + 1) * TURN.x : 0
        block.uniforms.uLit.value = block.lit
        block.uniforms.uDim.value = block.dim
        // Only the chosen block throws a shadow, and it does not take one.
        block.body.castShadow = isChosen
        block.body.receiveShadow = !isChosen
        if (block.cap) {
          block.cap.castShadow = isChosen
          block.cap.receiveShadow = !isChosen
        }
        if (block.capMaterial) {
          const shade = 1 - DIM_DEPTH * block.dim
          block.capMaterial.color.copy(colour.cloud).multiplyScalar(shade)
          block.capMaterial.emissive.copy(colour.cloud).multiplyScalar(shade)
        }
      })
      renderer.render(scene, camera)
      return moving || animate
    },
    dispose() {
      for (const item of bin) item.dispose()
      renderer.dispose()
    },
  }
}
