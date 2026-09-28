import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'

// `./application.css` `@import`s `../index.css`, which carries the three
// `@font-face` rules — see the note in src/about/main.tsx.
import './application.css'
import ApplicationApp from './ApplicationApp.tsx'

// Checked, not asserted, for the reason written out in src/main.tsx (P2-5).
const mount = document.getElementById('root')
if (!mount) throw new Error('#root is missing from application.html')

const tree = (
  <StrictMode>
    <ApplicationApp />
  </StrictMode>
)

// Prerendered and hydrated like the landing page; `renderApplication()` in
// src/entry-server.tsx renders this exact tree at build time. See src/main.tsx.
if (import.meta.env.DEV) {
  createRoot(mount).render(tree)
} else {
  hydrateRoot(mount, tree)
}
