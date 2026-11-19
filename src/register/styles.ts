/**
 * Form treatments shared by the registration form and the applicant portal.
 *
 * Inputs are solid frost with a full ink edge (6.28:1).
 */
export const INPUT =
  'bg-frost border-ink text-body text-ink w-full rounded-lg border px-4 py-3 ' +
  'placeholder:text-ink/90 focus-visible:outline-ink focus-visible:outline-2 focus-visible:outline-offset-2'

const BUTTON_BASE =
  'hud-btn inline-flex items-center justify-center font-medium uppercase tracking-[0.06em] ' +
  'focus-visible:outline-ink focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'disabled:cursor-wait disabled:opacity-70'

/** Solid ink, the same treatment as `ButtonLink`, for a real `<button>`. */
export const BUTTON = `${BUTTON_BASE} bg-ink text-frost hover:bg-horizon hover:text-ink disabled:hover:bg-ink disabled:hover:text-frost px-7 py-4 text-body`

/** Outlined ink on frost, for the secondary choice beside `BUTTON`. */
export const BUTTON_SECONDARY = `${BUTTON_BASE} border-ink text-ink hover:bg-ink hover:text-frost disabled:hover:bg-transparent disabled:hover:text-ink border px-7 py-4 text-body`

/** The error callout under a form. */
export const ERROR_BOX =
  'border-ink text-body text-ink bg-frost rounded-lg border-l-4 px-5 py-4 focus:outline-none'
