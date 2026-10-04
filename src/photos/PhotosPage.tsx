import { domAnimation, LazyMotion } from 'motion/react'
import { SiteHeader } from '../components/SiteHeader'
import { SiteFooter } from '../components/SiteFooter'
import { SnowdriftDivider } from '../components/SnowdriftDivider'
import { Eyebrow, Section } from '../components/Layout'
import { Reveal } from '../components/Reveal'
import { PHOTOS_PATH } from '../lib/links'
import { GALLERY_PHOTOS } from '../lib/images'
import { GalleryGrid } from './GalleryGrid'

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
          <Section id="photos" labelledBy="photos-title" className="bg-cloud">
            <Reveal>
              <div className="max-w-3xl">
                <Eyebrow>HackBU 2023</Eyebrow>
                <h1
                  id="photos-title"
                  className="font-display text-display-xl text-pine mt-5 font-semibold text-balance"
                >
                  Photos
                </h1>
                <p className="text-lede text-pine mt-6 max-w-2xl">
                  February 4–5, 2023. Workshops, hacking, and the closing
                  photo from the weekend.
                </p>
              </div>
            </Reveal>

            <div className="mt-12">
              <GalleryGrid photos={GALLERY_PHOTOS} />
            </div>
          </Section>
        </main>

        <SnowdriftDivider variant="cloud-to-frost" />
        <SiteFooter />
      </div>
    </LazyMotion>
  )
}
