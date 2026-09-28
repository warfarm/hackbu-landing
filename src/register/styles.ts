/**
 * Form treatments shared by the registration form and the applicant portal.
 *
 * Inputs sit on the frost card, so they take a cloud fill and a full pine
 * edge (6.83:1 against cloud, 5.76:1 against frost — both clear 1.4.11).
 */
export const INPUT =
  'bg-cloud border-pine text-body text-pine w-full rounded-lg border px-4 py-3 ' +
  'placeholder:text-pine/60 focus-visible:outline-pine focus-visible:outline-2 focus-visible:outline-offset-2'

const BUTTON_BASE =
  'inline-flex items-center justify-center rounded-lg font-medium ' +
  'focus-visible:outline-pine focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'disabled:cursor-wait disabled:opacity-70'

/** Solid pine, the same treatment as `ButtonLink`, for a real `<button>`. */
export const BUTTON = `${BUTTON_BASE} bg-pine text-cloud hover:bg-brick disabled:hover:bg-pine px-8 py-4 text-lede`

/** Outlined pine on frost, for the secondary choice beside `BUTTON`. */
export const BUTTON_SECONDARY = `${BUTTON_BASE} border-pine text-pine hover:bg-pine hover:text-cloud border px-8 py-4 text-lede`

/** The error callout under a form. */
export const ERROR_BOX =
  'border-brick text-body text-pine bg-cloud rounded-lg border-l-4 px-5 py-4 focus:outline-none'
