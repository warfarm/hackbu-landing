import { domAnimation, LazyMotion } from 'motion/react'
import { SiteHeader } from '../components/SiteHeader'
import { SiteFooter } from '../components/SiteFooter'
import { SnowdriftDivider } from '../components/SnowdriftDivider'
import { Eyebrow, Section } from '../components/Layout'
import { Reveal } from '../components/Reveal'
import { PHOTOS_PATH } from '../lib/links'
import { GALLERY_2019, GALLERY_2023, type GalleryPhoto } from '../lib/images'
import { GalleryGrid } from './GalleryGrid'

const YEAR_TITLE =
  'font-display text-display-xl text-pine mt-5 font-semibold text-balance'

function YearSection({
  id,
  year,
  photos,
  heading: Heading,
}: {
  id: string
  year: string
  photos: readonly GalleryPhoto[]
  heading: 'h1' | 'h2'
}) {
  const titleId = `${id}-title`
  return (
    <Section id={id} labelledBy={titleId} className="bg-cloud">
      <Reveal>
        <div className="max-w-3xl">
          <Eyebrow>Photos</Eyebrow>
          <Heading id={titleId} className={YEAR_TITLE}>
            {year}
          </Heading>
        </div>
      </Reveal>

      <div className="mt-12">
        <GalleryGrid photos={photos} />
      </div>
    </Section>
  )
}

export function PhotosPage() {
  return (
    <LazyMotion features={domAnimation} strict>
      <div className="bg-cloud font-sans text-pine min-h-screen">
        <a
          href="#main"
          className="bg-cloud text-pine focus:outline-pine sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:rounded-full focus:px-4 focus:py-2 focus:outline-2"
        >
          Skip to content
        </a>

        <SiteHeader homeHref="/" currentHref={PHOTOS_PATH} />

        <main id="main" className="pt-16 sm:pt-20">
          <YearSection
            id="photos-2023"
            year="2023"
            photos={GALLERY_2023}
            heading="h1"
          />

          <SnowdriftDivider variant="drift-a" />

          <YearSection
            id="photos-2019"
            year="2019"
            photos={GALLERY_2019}
            heading="h2"
          />
        </main>

        <SnowdriftDivider variant="cloud-to-frost" />
        <SiteFooter />
      </div>
    </LazyMotion>
  )
}
