import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react'
import { Eyebrow } from '../components/Layout'
import { ExternalLink, LINK_ON_FROST, MailLink } from '../components/ExternalLink'
import { APPLICATION_PATH, CONTACT_EMAIL } from '../lib/links'
import { callScript } from './api'
import { FIELD_GROUPS, type Field } from './fields'
import { BUTTON, ERROR_BOX, INPUT } from './styles'

const REGISTER_ERRORS: Record<string, string> = {
  already_registered:
    'That email is already registered. Sign in on the application page to check its status.',
  not_configured: 'Registration isn’t connected yet. Please check back soon.',
  network: 'We couldn’t reach the registration server. Check your connection and try again.',
  invalid_file: 'Your resume must be a PDF or Word document under 5 MB.',
  missing_file: 'Please attach your resume.',
}
const DEFAULT_ERROR = 'Something went wrong saving your registration. Please try again.'

/** Mirrors the browser's `accept` filter, which a file picker doesn't enforce on drag-and-drop. */
function checkFile(field: Field & { type: 'file' }, file: File): string {
  const extensions = field.accept.split(',').map((ext) => ext.trim().toLowerCase())
  const name = file.name.toLowerCase()
  if (!extensions.some((ext) => name.endsWith(ext))) {
    return `${field.label}: please choose a ${extensions.join(', ')} file.`
  }
  if (file.size > field.maxBytes) {
    return `${field.label}: the file is too large. The limit is ${Math.round(field.maxBytes / 1024 / 1024)} MB.`
  }
  return ''
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const url = String(reader.result)
      resolve(url.slice(url.indexOf(',') + 1))
    }
    reader.onerror = () => reject(reader.error ?? new Error('read failed'))
    reader.readAsDataURL(file)
  })
}

type Status =
  | { state: 'idle' }
  | { state: 'submitting' }
  | { state: 'success'; email: string }
  | { state: 'error'; message: string }

const CARD = 'border-frost bg-frost rounded-3xl border p-6 sm:p-10'
const LINK = `${LINK_ON_FROST} underline underline-offset-4`

/**
 * Two steps on one page: the email first (checked against existing
 * registrations, so returning applicants are sent to their application
 * instead of filling everything in again), then the rest of the questions.
 */
export function RegistrationForm() {
  const [email, setEmail] = useState<string | null>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const detailsHeadingRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (!email) return
    topRef.current?.scrollIntoView({ block: 'start' })
    detailsHeadingRef.current?.focus({ preventScroll: true })
  }, [email])

  return (
    <div ref={topRef} className="scroll-mt-28">
      {email ? (
        <DetailsStep
          email={email}
          headingRef={detailsHeadingRef}
          onChangeEmail={() => setEmail(null)}
        />
      ) : (
        <EmailStep onContinue={setEmail} />
      )}
    </div>
  )
}

function EmailStep({ onContinue }: { onContinue: (email: string) => void }) {
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [registered, setRegistered] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const email = String(new FormData(event.currentTarget).get('email') ?? '').trim()
    setChecking(true)
    setError('')
    setRegistered(false)
    const result = await callScript<{ registered: boolean }>({ action: 'checkEmail', email })
    setChecking(false)
    if (!result.ok) {
      setError(
        result.error === 'invalid_email'
          ? 'Enter a valid email address.'
          : (REGISTER_ERRORS[result.error] ?? DEFAULT_ERROR),
      )
      return
    }
    if (result.registered) {
      setRegistered(true)
      return
    }
    onContinue(email)
  }

  return (
    <form onSubmit={handleSubmit} className={CARD}>
      <Eyebrow>Step 1 of 2</Eyebrow>
      <p className="font-display text-display-md text-pine mt-4 font-semibold">
        Start with your email
      </p>
      <p className="text-body text-pine mt-3 max-w-xl">
        We’ll send your confirmation and decision here, and you’ll use it to sign
        in and check your application.
      </p>
      <label htmlFor="reg-start-email" className="text-body text-pine mt-8 block font-medium">
        Email
        <RequiredMark />
      </label>
      <input
        id="reg-start-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        disabled={checking}
        className={`${INPUT} mt-2 block max-w-md`}
      />

      {error ? (
        <div role="alert" className={`${ERROR_BOX} mt-6`}>
          {error}
        </div>
      ) : null}
      {registered ? (
        <div role="alert" className={`${ERROR_BOX} mt-6`}>
          That email is already registered.{' '}
          <ExternalLink href={APPLICATION_PATH} className={LINK}>
            Check your application
          </ExternalLink>{' '}
          instead.
        </div>
      ) : null}

      <div className="mt-8">
        <button type="submit" className={BUTTON} disabled={checking}>
          {checking ? 'Checking…' : 'Continue'}
        </button>
      </div>
    </form>
  )
}

function DetailsStep({
  email,
  headingRef,
  onChangeEmail,
}: {
  email: string
  headingRef: RefObject<HTMLParagraphElement | null>
  onChangeEmail: () => void
}) {
  const [status, setStatus] = useState<Status>({ state: 'idle' })
  const statusRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status.state === 'success' || status.state === 'error') {
      statusRef.current?.focus()
    }
  }, [status])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const allFields = FIELD_GROUPS.flatMap((group) => group.fields)

    const fields = allFields
      .filter((field) => field.type !== 'file')
      .map((field) => ({
        key: field.key,
        label: field.label,
        value:
          field.key === 'email'
            ? email
            : field.type === 'checkbox'
              ? data.get(field.key) === 'on'
                ? 'Yes'
                : 'No'
              : String(data.get(field.key) ?? '').trim(),
      }))

    const chosen: { field: Field & { type: 'file' }; file: File }[] = []
    for (const field of allFields) {
      if (field.type !== 'file') continue
      const file = data.get(field.key)
      if (!(file instanceof File) || file.size === 0) {
        if (field.required) {
          setStatus({ state: 'error', message: `${field.label}: please attach a file.` })
          return
        }
        continue
      }
      const problem = checkFile(field, file)
      if (problem) {
        setStatus({ state: 'error', message: problem })
        return
      }
      chosen.push({ field, file })
    }

    setStatus({ state: 'submitting' })

    let files
    try {
      files = await Promise.all(
        chosen.map(async ({ field, file }) => ({
          key: field.key,
          label: field.label,
          name: file.name,
          mimeType: file.type,
          data: await toBase64(file),
        })),
      )
    } catch {
      setStatus({ state: 'error', message: 'We couldn’t read your file. Try choosing it again.' })
      return
    }

    const result = await callScript({
      action: 'register',
      fields,
      files,
      website: data.get('website') ?? '',
    })

    if (result.ok) {
      setStatus({ state: 'success', email })
      return
    }

    setStatus({ state: 'error', message: REGISTER_ERRORS[result.error] ?? DEFAULT_ERROR })
  }

  if (status.state === 'success') {
    return (
      <div
        ref={statusRef}
        tabIndex={-1}
        className="border-frost bg-frost rounded-3xl border p-8 focus:outline-none sm:p-12"
      >
        <Eyebrow>You’re registered</Eyebrow>
        <p className="font-display text-display-md text-pine mt-4 font-semibold">
          Thanks for registering for HackBU!
        </p>
        <p className="text-body text-pine mt-4 max-w-xl">
          We sent a confirmation to <strong className="font-medium">{status.email}</strong>.
          We’ll email you again once your application has been reviewed. If it
          doesn’t show up, check your spam folder or email{' '}
          <MailLink
            email={CONTACT_EMAIL}
            className={`${LINK_ON_FROST} underline underline-offset-4`}
          />
          .
        </p>
        <p className="text-body text-pine mt-4">
          <ExternalLink
            href={APPLICATION_PATH}
            className={`${LINK_ON_FROST} underline underline-offset-4`}
          >
            View your application
          </ExternalLink>
        </p>
      </div>
    )
  }

  const submitting = status.state === 'submitting'

  return (
    <form onSubmit={handleSubmit} className={`${CARD} relative`}>
      {/* Honeypot: hidden from people and assistive tech, filled by bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Leave this empty
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Eyebrow>Step 2 of 2</Eyebrow>
      <p
        ref={headingRef}
        tabIndex={-1}
        className="font-display text-display-md text-pine mt-4 font-semibold focus:outline-none"
      >
        Tell us about yourself
      </p>
      <p className="text-body text-pine mt-3">
        Registering as <strong className="font-medium">{email}</strong>{' '}
        <button
          type="button"
          onClick={onChangeEmail}
          disabled={submitting}
          className={`${LINK} text-caption ml-1`}
        >
          Change email
        </button>
      </p>

      <div className="mt-12 flex flex-col gap-12">
        {FIELD_GROUPS.map((group) => {
          const fields = group.fields.filter((field) => field.key !== 'email')
          if (fields.length === 0) return null
          return (
            <fieldset key={group.title} disabled={submitting}>
              <legend className="font-display text-display-md text-pine font-semibold">
                {group.title}
              </legend>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {fields.map((field) => (
                  <FieldControl key={field.key} field={field} />
                ))}
              </div>
            </fieldset>
          )
        })}
      </div>

      {status.state === 'error' ? (
        <div
          ref={statusRef}
          tabIndex={-1}
          role="alert"
          className={`${ERROR_BOX} mt-10`}
        >
          {status.message}
        </div>
      ) : null}

      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
        <button type="submit" className={BUTTON} disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit registration'}
        </button>
        <p className="text-caption text-pine/90">
          Fields marked <span aria-hidden="true">*</span>
          <span className="sr-only">with an asterisk</span> are required.
        </p>
      </div>
    </form>
  )
}

function FieldControl({ field }: { field: Field }) {
  const id = `reg-${field.key}`
  const helpId = field.help ? `${id}-help` : undefined
  const span = field.wide ? 'sm:col-span-2' : ''

  if (field.type === 'checkbox') {
    return (
      <div className={`${span} flex items-start gap-3`}>
        <input
          id={id}
          name={field.key}
          type="checkbox"
          required={field.required}
          className="accent-pine border-pine mt-1 size-5 shrink-0 rounded focus-visible:outline-pine focus-visible:outline-2 focus-visible:outline-offset-2"
        />
        <div>
          <label htmlFor={id} className="text-body text-pine">
            {field.label}
            {field.required ? <RequiredMark /> : null}
          </label>
          {field.link ? (
            <p className="text-caption mt-1">
              <ExternalLink
                href={field.link.href}
                className={`${LINK_ON_FROST} underline underline-offset-4`}
              >
                {field.link.label}
              </ExternalLink>
            </p>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className={span}>
      <label htmlFor={id} className="text-body text-pine block font-medium">
        {field.label}
        {field.required ? <RequiredMark /> : null}
      </label>
      <div className="mt-2">
        {field.type === 'select' ? (
          <select
            id={id}
            name={field.key}
            required={field.required}
            aria-describedby={helpId}
            defaultValue=""
            className={INPUT}
          >
            <option value="" disabled>
              Select one
            </option>
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : field.type === 'file' ? (
          <input
            id={id}
            name={field.key}
            type="file"
            accept={field.accept}
            required={field.required}
            aria-describedby={helpId}
            className={`${INPUT} file:bg-pine file:text-cloud file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:px-4 file:py-2 file:font-medium`}
          />
        ) : field.type === 'textarea' ? (
          <textarea
            id={id}
            name={field.key}
            required={field.required}
            aria-describedby={helpId}
            placeholder={field.placeholder}
            rows={4}
            className={INPUT}
          />
        ) : (
          <input
            id={id}
            name={field.key}
            type={field.type}
            required={field.required}
            aria-describedby={helpId}
            autoComplete={field.autoComplete}
            placeholder={field.placeholder}
            className={INPUT}
          />
        )}
      </div>
      {helpId ? (
        <p id={helpId} className="text-caption text-pine/90 mt-2">
          {field.help}
        </p>
      ) : null}
    </div>
  )
}

function RequiredMark() {
  return (
    <>
      <span aria-hidden="true" className="text-brick ml-1">
        *
      </span>
      <span className="sr-only"> (required)</span>
    </>
  )
}
