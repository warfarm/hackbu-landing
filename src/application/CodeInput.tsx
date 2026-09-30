import { useRef, useState, type KeyboardEvent } from 'react'

const LENGTH = 6

const CIRCLE =
  'bg-cloud border-pine text-pine size-11 rounded-full border text-center text-2xl font-semibold ' +
  'focus-visible:outline-pine focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'disabled:opacity-70 sm:size-14'

/**
 * Six single-digit circles for the emailed sign-in code. Typing advances,
 * Backspace on an empty circle steps back, and a pasted or autofilled code
 * (iOS/Android drop the whole code into the first box) is spread across all
 * six. `onChange` reports the digits entered so far; `onComplete` fires once
 * every circle is filled.
 */
export function CodeInput({
  id,
  labelledBy,
  disabled = false,
  onChange,
  onComplete,
}: {
  id: string
  labelledBy: string
  disabled?: boolean
  onChange: (code: string) => void
  onComplete: (code: string) => void
}) {
  const [digits, setDigits] = useState<string[]>(() => Array(LENGTH).fill(''))
  const refs = useRef<(HTMLInputElement | null)[]>([])

  function update(next: string[], focusAt: number) {
    setDigits(next)
    refs.current[Math.max(0, Math.min(focusAt, LENGTH - 1))]?.focus()
    const code = next.join('')
    onChange(code)
    if (code.length === LENGTH) onComplete(code)
  }

  function handleInput(index: number, raw: string) {
    // Typing into an already-filled circle yields old + new; keep the new one.
    const typed = digits[index] && raw.length === 2 ? raw.replace(digits[index], '') : raw
    const incoming = typed.replace(/\D/g, '').slice(0, LENGTH - index)
    const next = [...digits]
    if (!incoming) {
      next[index] = ''
      update(next, index)
      return
    }
    incoming.split('').forEach((digit, offset) => {
      next[index + offset] = digit
    })
    update(next, index + incoming.length)
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      event.preventDefault()
      const next = [...digits]
      next[index - 1] = ''
      update(next, index - 1)
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      refs.current[index - 1]?.focus()
    } else if (event.key === 'ArrowRight' && index < LENGTH - 1) {
      event.preventDefault()
      refs.current[index + 1]?.focus()
    }
  }

  return (
    <div role="group" aria-labelledby={labelledBy} className="flex gap-2 sm:gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element
          }}
          id={index === 0 ? id : undefined}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${index + 1} of ${LENGTH}`}
          value={digit}
          disabled={disabled}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => handleInput(index, event.currentTarget.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          className={CIRCLE}
        />
      ))}
    </div>
  )
}
