import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'

// `../landing.css` carries the three `@font-face` rules with it — see the note
// in src/about/main.tsx for why there is no separate font stylesheet import.
import '../landing.css'
import { OrganizersPage } from './OrganizersPage'

// Checked, not asserted, for the reason written out in src/main.tsx (P2-5).
const mount = document.getElementById('root')
if (!mount) throw new Error('#root is missing from organizers.html')

const tree = (
  <StrictMode>
    <OrganizersPage />
  </StrictMode>
)

// Prerendered and hydrated like the landing page; `renderOrganizers()` in
// src/entry-server.tsx renders this exact tree at build time. See src/main.tsx.
if (import.meta.env.DEV) {
  createRoot(mount).render(tree)
} else {
  hydrateRoot(mount, tree)
}
