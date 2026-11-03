# Gallery photos

JPEG sources for the Photos page (`/photos`). The landing page uses `public/artwork/photos/` instead; keep past event shots here.

Drop `.jpg` files in this folder, then run `npm run images`. That script writes a `.avif` and `.webp` beside each JPEG, scaled so the long edge is at most 1600px. The original JPEG stays as the fallback. Register DSC files in `GALLERY_2019` and the rest in `GALLERY_2023` in `src/lib/images.ts`.

HEIC files are not processed.
