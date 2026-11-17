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
 * before it is sent. Network failures, and the HTML page Apps Script returns
 * when it is overloaded, come back as `{ ok: false, error: 'network' }`
 * rather than throwing.
 *
 * `RETRYABLE_ERRORS` are the ones a launch rush produces. A lost response
 * after a successful write comes back as `already_registered` on the retry.
 */
const RETRYABLE_ERRORS = new Set(['network', 'server_error', 'busy', 'upload_failed'])

export async function callScript<T = object>(body: object): Promise<ScriptResult<T>> {
  if (!ENDPOINT) return { ok: false, error: 'not_configured' }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 90_000)
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const text = await response.text()
    try {
      return JSON.parse(text) as ScriptResult<T>
    } catch {
      // Apps Script answers an overload with an HTML error page, not our JSON.
      return { ok: false, error: 'network' }
    }
  } catch {
    return { ok: false, error: 'network' }
  } finally {
    clearTimeout(timer)
  }
}

function retryDelay(attempt: number): number {
  const backoff = Math.min(8_000, 700 * 2 ** attempt)
  return backoff + Math.floor(Math.random() * 500)
}

/**
 * Apps Script only runs about 30 executions at once and drops the rest.
 * Registration retries those, with jitter so a rush doesn't all come back
 * in the same second. `recoverAlreadyRegistered` treats "this email is
 * already in the sheet" on a *later* attempt as success — the attempt
 * before it usually wrote the row and the response never made it back.
 */
export async function callScriptRetrying<T = object>(
  body: object,
  options?: { attempts?: number; recoverAlreadyRegistered?: boolean },
): Promise<ScriptResult<T>> {
  const attempts = options?.attempts ?? 5
  let last: ScriptResult<T> = { ok: false, error: 'network' }
  for (let attempt = 0; attempt < attempts; attempt++) {
    last = await callScript<T>(body)
    if (last.ok) return last
    if (
      options?.recoverAlreadyRegistered &&
      attempt > 0 &&
      last.error === 'already_registered'
    ) {
      return { ok: true, emailSent: false } as ScriptResult<T>
    }
    if (!RETRYABLE_ERRORS.has(last.error) || attempt === attempts - 1) return last
    await new Promise((resolve) => setTimeout(resolve, retryDelay(attempt)))
  }
  return last
}

export type Application = {
  email: string
  submittedAt: string
  status: 'pending' | 'accepted' | 'rejected'
  rsvp: '' | 'Coming' | 'Not coming'
  answers: { label: string; value: string; href?: string }[]
}
