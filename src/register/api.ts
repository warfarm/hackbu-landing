/**
 * The Google Apps Script web app behind registration and the applicant portal
 * (see `google-apps-script/`). Set `VITE_REGISTRATION_ENDPOINT` in Vercel's
 * environment variables, or `.env.local` for local development; it is inlined
 * at build time, so a change needs a rebuild.
 */
export const ENDPOINT: string = import.meta.env.VITE_REGISTRATION_ENDPOINT ?? ''

export type ScriptResult<T = object> = ({ ok: true } & T) | { ok: false; error: string }

/**
 * One POST to the script. `text/plain` keeps it a "simple" request: Apps
 * Script cannot answer a CORS preflight, so a JSON content type would fail
 * before it is sent. Network failures come back as `{ ok: false, error:
 * 'network' }` rather than throwing.
 */
export async function callScript<T = object>(body: object): Promise<ScriptResult<T>> {
  if (!ENDPOINT) return { ok: false, error: 'not_configured' }
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
    })
    return (await response.json()) as ScriptResult<T>
  } catch {
    return { ok: false, error: 'network' }
  }
}

export type Application = {
  email: string
  submittedAt: string
  status: 'pending' | 'accepted' | 'rejected'
  rsvp: '' | 'Coming' | 'Not coming'
  answers: { label: string; value: string }[]
}
