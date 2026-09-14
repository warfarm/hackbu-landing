import type { SitePhoto } from '../lib/images'

/**
 * A photograph set into a content section with feathered edges.
 *
 * The landing page's photos are real campus photographs, not cutouts: none of
 * them carries an alpha channel. What makes them sit on the page rather than
 * on top of it is the `.photo-feather` mask in src/index.css — two linear
 * gradients intersected, so all four edges dissolve into the section's
 * background over the outer 12% of the box. The image itself stays a plain
 * `<picture>` (AVIF, then WebP, then the JPEG as the `<img src>`), and the
 * JPEG fallback is what makes baking the alpha into the files impossible in
 * the first place: a mask gives every format the same edge for free.
 *
 * The wrapper owns the box (aspect ratio, width, sticky positioning — passed
 * in via `className`) and the `<img>` covers it, so a photo can be cropped to
 * a different shape at different breakpoints without a second file.
 *
 * Every section photo is below the fold, so they are all `loading="lazy"`.
 * They are decorative *context*, not the section's content, but they are real
 * places and people, so each carries a description rather than an empty alt.
 */
export function SectionPhoto({
  photo,
  className = '',
  sizes,
}: {
  photo: SitePhoto
  className?: string
  /** Optional `sizes` when the rendered box is much narrower than the file. */
  sizes?: string
}) {
  return (
    <div className={`photo-feather overflow-hidden ${className}`}>
      <picture>
        <source type="image/avif" srcSet={photo.avif} sizes={sizes} />
        <source type="image/webp" srcSet={photo.webp} sizes={sizes} />
        <img
          src={photo.jpg}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          decoding="async"
          loading="lazy"
          draggable={false}
          className="h-full w-full object-cover select-none"
        />
      </picture>
    </div>
  )
}
