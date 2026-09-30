import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Eyebrow } from '../components/Layout'
import { ExternalLink, LINK_ON_FROST, MailLink } from '../components/ExternalLink'
import { CONTACT_EMAIL, REGISTER_PATH } from '../lib/links'
import { callScript, type Application } from '../register/api'
import { BUTTON, BUTTON_SECONDARY, ERROR_BOX, INPUT } from '../register/styles'
import { CodeInput } from './CodeInput'

const SESSION_KEY = 'hackbu:session'

const CARD = 'border-frost bg-frost rounded-3xl border p-6 sm:p-10'
const LINK = `${LINK_ON_FROST} underline underline-offset-4`

const ERRORS: Record<string, string> = {
  invalid_email: 'Enter a valid email address.',
  not_found: 'We couldn’t find a registration for that email. Check the spelling, or register first.',
  incomplete_code: 'Enter all 6 digits of the code from your email.',
  wrong_code: 'That code isn’t right. Check the email and try again.',
  code_expired: 'That code has expired. Request a new one.',
  unauthorized: 'Your session expired. Sign in again.',
  not_accepted: 'You can RSVP once your application is accepted.',
  not_configured: 'The applicant portal isn’t connected yet. Please check back soon.',
  network: 'We couldn’t reach the server. Check your connection and try again.',
}
const DEFAULT_ERROR = 'Something went wrong. Please try again.'

const STATUS_COPY: Record<Application['status'], { title: string; body: string }> = {
  pending: {
    title: 'Under review',
    body: 'Thanks for applying. We’ll email you as soon as a decision has been made.',
  },
  accepted: {
    title: 'You’re accepted!',
    body: 'Congratulations — we’d love to have you at HackBU. Let us know whether you can make it.',
  },
  rejected: {
    title: 'Not accepted this time',
    body: 'Thank you for applying. We had many more applicants than spots, and unfortunately we can’t offer you a place at this event. We hope you’ll apply again next time.',
  },
}

type View =
  | { step: 'loading' }
  | { step: 'email' }
  | { step: 'code'; email: string }
  | { step: 'signedIn'; token: string; application: Application }

/**
 * Sign-in is a 6-digit code emailed to the address the applicant registered
 * with; the script swaps it for a session token (valid 6 hours) that lives in
 * localStorage. The first render is always `loading` so the prerendered HTML
 * matches, and the stored session is checked after mount.
 */
export function ApplicationPortal() {
  const [view, setView] = useState<View>({ step: 'loading' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [code, setCode] = useState('')
  const [codeRequests, setCodeRequests] = useState(0)
  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void loadApplication(localStorage.getItem(SESSION_KEY))
  }, [])

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  function fail(code: string) {
    setError(ERRORS[code] ?? DEFAULT_ERROR)
  }

  async function loadApplication(token: string | null) {
    if (!token) {
      setView({ step: 'email' })
      return
    }
    const result = await callScript<{ application: Application }>({ action: 'getApplication', token })
    if (result.ok) {
      setView({ step: 'signedIn', token, application: result.application })
      return
    }
    localStorage.removeItem(SESSION_KEY)
    setView({ step: 'email' })
    if (result.error !== 'unauthorized') fail(result.error)
  }

  async function requestCode(email: string) {
    setBusy(true)
    setError('')
    const result = await callScript({ action: 'requestCode', email })
    setBusy(false)
    if (!result.ok) return fail(result.error)
    setCode('')
    setCodeRequests((count) => count + 1)
    setView({ step: 'code', email })
  }

  async function handleEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const email = String(new FormData(event.currentTarget).get('email') ?? '').trim()
    await requestCode(email)
  }

  async function verifyCode(email: string, entered: string) {
    if (busy) return
    if (entered.length !== 6) return fail('incomplete_code')
    const code = entered
    setBusy(true)
    setError('')
    const result = await callScript<{ token: string }>({ action: 'verifyCode', email, code })
    if (!result.ok) {
      setBusy(false)
      return fail(result.error)
    }
    localStorage.setItem(SESSION_KEY, result.token)
    await loadApplication(result.token)
    setBusy(false)
  }

  async function rsvp(token: string, response: 'Coming' | 'Not coming') {
    setBusy(true)
    setError('')
    const result = await callScript<{ rsvp: Application['rsvp'] }>({ action: 'rsvp', token, response })
    setBusy(false)
    if (!result.ok) {
      if (result.error === 'unauthorized') {
        localStorage.removeItem(SESSION_KEY)
        setView({ step: 'email' })
      }
      return fail(result.error)
    }
    setView((current) =>
      current.step === 'signedIn'
        ? { ...current, application: { ...current.application, rsvp: result.rsvp } }
        : current,
    )
  }

  function signOut() {
    localStorage.removeItem(SESSION_KEY)
    setError('')
    setView({ step: 'email' })
  }

  const errorBox = error ? (
    <div ref={errorRef} tabIndex={-1} role="alert" className={`${ERROR_BOX} mt-6`}>
      {error}
    </div>
  ) : null

  if (view.step === 'loading') {
    return (
      <div className={CARD}>
        <p className="text-body text-pine/90">Loading…</p>
      </div>
    )
  }

  if (view.step === 'email') {
    return (
      <form key="email" onSubmit={handleEmail} className={`${CARD} max-w-xl`}>
        <Eyebrow>Sign in</Eyebrow>
        <p className="font-display text-display-md text-pine mt-4 font-semibold">
          Check your application
        </p>
        <p className="text-body text-pine mt-3">
          Enter the email you registered with and we’ll send you a 6-digit code.
        </p>
        <label htmlFor="portal-email" className="text-body text-pine mt-6 block font-medium">
          Email
        </label>
        <input
          id="portal-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          disabled={busy}
          className={`${INPUT} mt-2`}
        />
        {errorBox}
        <button type="submit" className={`${BUTTON} mt-6`} disabled={busy}>
          {busy ? 'Sending…' : 'Email me a code'}
        </button>
        <p className="text-caption text-pine/90 mt-6">
          Haven’t registered yet?{' '}
          <ExternalLink href={REGISTER_PATH} className={LINK}>
            Register for HackBU
          </ExternalLink>
        </p>
      </form>
    )
  }

  if (view.step === 'code') {
    return (
      <form
        key="code"
        onSubmit={(event) => {
          event.preventDefault()
          void verifyCode(view.email, code)
        }}
        className={`${CARD} max-w-xl`}
      >
        <Eyebrow>Sign in</Eyebrow>
        <p className="font-display text-display-md text-pine mt-4 font-semibold">
          Enter your code
        </p>
        <p className="text-body text-pine mt-3">
          We sent a 6-digit code to <strong className="font-medium">{view.email}</strong>. It
          expires in 10 minutes. Check your spam folder if you don’t see it.
        </p>
        <label
          id="portal-code-label"
          htmlFor="portal-code"
          className="text-body text-pine mt-6 block font-medium"
        >
          Code
        </label>
        <div className="mt-3">
          <CodeInput
            key={codeRequests}
            id="portal-code"
            labelledBy="portal-code-label"
            disabled={busy}
            onChange={setCode}
            onComplete={(full) => void verifyCode(view.email, full)}
          />
        </div>
        {errorBox}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <button type="submit" className={BUTTON} disabled={busy}>
            {busy ? 'Checking…' : 'Sign in'}
          </button>
          <button
            type="button"
            className={`${LINK} text-body self-start sm:self-auto`}
            disabled={busy}
            onClick={() => requestCode(view.email)}
          >
            Resend code
          </button>
          <button
            type="button"
            className={`${LINK} text-body self-start sm:self-auto`}
            disabled={busy}
            onClick={() => {
              setError('')
              setView({ step: 'email' })
            }}
          >
            Use a different email
          </button>
        </div>
      </form>
    )
  }

  const { application, token } = view
  const accepted = application.status === 'accepted'

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="status-title" className={CARD}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Eyebrow>Application status</Eyebrow>
            <p
              id="status-title"
              className="font-display text-display-md text-pine mt-4 font-semibold"
            >
              {STATUS_COPY[application.status].title}
            </p>
          </div>
          <button type="button" onClick={signOut} className={`${LINK} text-caption self-start`}>
            Sign out
          </button>
        </div>

        <p className="text-body text-pine mt-3 max-w-xl">
          {STATUS_COPY[application.status].body}
        </p>
        <p className="text-caption text-pine/90 mt-2">
          Signed in as {application.email}
          {application.submittedAt ? ` · Submitted ${application.submittedAt}` : ''}
        </p>

        {accepted ? (
          <div className="mt-8">
            <p className="text-body text-pine font-medium">
              {application.rsvp === 'Coming'
                ? 'You’re confirmed as coming. See you there!'
                : application.rsvp === 'Not coming'
                  ? 'You’ve told us you can’t make it. You can change your answer below.'
                  : 'Are you coming?'}
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className={application.rsvp === 'Coming' ? BUTTON : BUTTON_SECONDARY}
                aria-pressed={application.rsvp === 'Coming'}
                disabled={busy}
                onClick={() => rsvp(token, 'Coming')}
              >
                I’m coming
              </button>
              <button
                type="button"
                className={application.rsvp === 'Not coming' ? BUTTON : BUTTON_SECONDARY}
                aria-pressed={application.rsvp === 'Not coming'}
                disabled={busy}
                onClick={() => rsvp(token, 'Not coming')}
              >
                I can’t make it
              </button>
            </div>
          </div>
        ) : null}

        {errorBox}
      </section>

      <section aria-labelledby="answers-title" className={CARD}>
        <p id="answers-title" className="font-display text-display-md text-pine font-semibold">
          Your application
        </p>
        <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {application.answers.map((answer) => (
            <div key={answer.label}>
              <dt className="text-caption text-pine/90">{answer.label}</dt>
              <dd className="text-body text-pine mt-1 break-words whitespace-pre-wrap">
                {answer.value || '—'}
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-caption text-pine/90 mt-8">
          Need to change something? Email{' '}
          <MailLink email={CONTACT_EMAIL} className={LINK} />.
        </p>
      </section>
    </div>
  )
}
