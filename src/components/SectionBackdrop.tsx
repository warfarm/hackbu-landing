import type { CSSProperties } from 'react'
import type { BackdropPhoto } from '../lib/images'

/**
 * A campus photograph behind a whole landing-page section, with the section's
 * content set on frosted panels above it.
 *
 * <Section backdrop={...}> renders this as its first child and makes itself
 * `relative isolate`, so the `-z-10` layers below sit over the section's own
 * `bg-cloud` and under everything in the <Container>.
 *
 * Three layers, bottom to top:
 *
 *   photo   `object-cover`, cropped by the photo's own `position`, with
 *           `.backdrop-feather` (src/index.css) dissolving its top and bottom
 *           edges into the cloud ground, so it meets the snowdrift dividers
 *           as snow rather than as a hard line.
 *   wash    `bg-cloud` at 50%, which keeps the photo legible as a place but
 *           lifts it toward the page's ground.
 *   panels  BACKDROP_PANEL below, on the content itself.
 *
 * **Why panels and not a heavier wash.** The sections' secondary text is
 * `pine/90`. Measured against every pixel of all three photos (downscaled to
 * 512px), a wash alone has to reach 90–91% cloud before `pine/90` clears 4.5:1
 * over the darkest tree trunks — and at 90% the photo is all but gone. A 50%
 * wash under an 85% panel composes to 1 − 0.5 × 0.15 = 92.5% cloud, which
 * clears it with room to spare, while the photo stays at half strength
 * wherever there is no text: in the margins, between cards, and down the
 * right half of the event overview. `backdrop-blur` on the panel also
 * averages away the fine dark detail under the text, which only helps.
 *
 * The photo is decoration under content that says everything itself, so it
 * is `aria-hidden` with an empty alt. It is below the fold on every page that
 * uses it, so it is lazy, and `sizes="100vw"` because it is drawn the full
 * width of the window.
 */
export function SectionBackdrop({ photo }: { photo: BackdropPhoto }) {
  const { focus } = photo

  // The geometry is read by `.backdrop-photo` / `.backdrop-focus` in
  // src/index.css; the custom properties are how each photo hands it its own.
  const style = {
    '--photo-position': photo.position,
    '--photo-aspect': photo.width / photo.height,
    ...(focus ? { '--focus-x': focus.x, '--focus-y': focus.y } : {}),
  } as CSSProperties

  return (
    <div aria-hidden="true" className="backdrop-stage absolute inset-0 -z-10">
      <picture className="contents">
        {/*
         * `100vw` even for a focused photo, which is zoomed past the window on
         * a desktop (~1.5x at 1920px): the 2400 rung is what a 1920px window
         * picks, and under the wash it is sharp enough at that zoom.
         */}
        <source type="image/avif" srcSet={photo.avif} sizes="100vw" />
        <source type="image/webp" srcSet={photo.webp} sizes="100vw" />
        <img
          src={photo.jpg}
          alt=""
          width={photo.width}
          height={photo.height}
          loading="lazy"
          decoding="async"
          draggable={false}
          className={`backdrop-photo backdrop-feather select-none ${focus ? 'backdrop-focus' : ''}`}
          style={style}
        />
      </picture>
      {/*
       * With a focus, the copy keeps to the left half from `lg` up and the
       * subject stands in the right half, so the wash holds its 50% only as
       * far as the middle — where the panels are, and what the contrast
       * reasoning above depends on — and thins to 20% over the subject.
       */}
      <div
        className={`absolute inset-0 ${
          focus
            ? 'bg-cloud/50 lg:from-cloud/50 lg:to-cloud/20 lg:bg-transparent lg:bg-linear-to-r lg:from-50%'
            : 'bg-cloud/50'
        }`}
      />
    </div>
  )
}

/**
 * A backdrop anchored to a gap in the section's own flow, for a photo with a
 * horizontal focal `band` (a line of buildings, a skyline) that must stay
 * clear of the content.
 *
 * Place it between two rows of content. It renders an empty, `aria-hidden`
 * spacer whose height is a fixed share of the photo's drawn height, and hangs
 * the photo off the spacer's centre — full window width, shifted up so the
 * band's centre sits exactly on the spacer's centre. So wherever the rows
 * above push the gap, at whatever window width, the band is in it; the photo
 * runs up behind the row above and down behind the row below, and the
 * section (`relative isolate overflow-clip`, set by the caller) clips it.
 *
 * There is no separate wash layer. The photo is painted *translucent* over
 * the section's cloud ground, which composites to exactly the same pixels as
 * a cloud wash at (1 − alpha): `.backdrop-window-photo`'s mask is 50% alpha
 * wherever content can be — the same 50% wash the panels' contrast reasoning
 * above depends on — rises to 90% across the band, and falls to nothing at
 * the photo's top and bottom edges. The rise happens within the spacer,
 * which `.backdrop-window` sizes to contain it (see src/index.css), so no
 * panel ever sits on the brighter part.
 */
export function BackdropWindow({
  photo,
  className = '',
}: {
  photo: BackdropPhoto
  className?: string
}) {
  const band = photo.band ?? { top: 0.5, bottom: 0.5 }

  const style = {
    '--photo-aspect': photo.width / photo.height,
    '--band-top': band.top,
    '--band-bottom': band.bottom,
    '--band-centre': (band.top + band.bottom) / 2,
  } as CSSProperties

  return (
    <div aria-hidden="true" className={`backdrop-window ${className}`} style={style}>
      <picture className="contents">
        <source type="image/avif" srcSet={photo.avif} sizes="max(100vw, 50rem)" />
        <source type="image/webp" srcSet={photo.webp} sizes="max(100vw, 50rem)" />
        <img
          src={photo.jpg}
          alt=""
          width={photo.width}
          height={photo.height}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="backdrop-window-photo -z-10 select-none"
        />
      </picture>
    </div>
  )
}

/**
 * The frosted panel every block of text sits on inside a backdrop section.
 * 85% cloud — the figure the reasoning above depends on; lowering it lowers
 * the text contrast with it — plus a blur and a frost edge so the panel reads
 * as a sheet of ice over the photograph rather than a white box.
 */
export const BACKDROP_PANEL =
  'border-frost bg-cloud/85 rounded-3xl border backdrop-blur-md'
