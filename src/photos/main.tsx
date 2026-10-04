import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'

import '../landing.css'
import { PhotosPage } from './PhotosPage'

const mount = document.getElementById('root')
if (!mount) throw new Error('#root is missing from photos.html')

const tree = (
  <StrictMode>
    <PhotosPage />
  </StrictMode>
)

if (import.meta.env.DEV) {
  createRoot(mount).render(tree)
} else {
  hydrateRoot(mount, tree)
}
