/**
 * Every question on the registration form, in order.
 *
 * This list is the single source of truth: the form renders from it, and each
 * submission sends `label` with every answer, so the Apps Script uses the
 * labels as the Google Sheet's column headers (adding a column the first time
 * it sees a new one). Adding, removing or rewording a question here is the
 * whole change — nothing in `google-apps-script/` needs editing.
 *
 * `key` must stay stable once registrations are coming in; the script looks
 * up `email` and `firstName` by key to address the emails.
 */

type BaseField = {
  key: string
  label: string
  required?: boolean
  /** Spans both columns of the form grid. */
  wide?: boolean
  help?: string
}

export type Field =
  | (BaseField & {
      type: 'text' | 'email' | 'tel' | 'url'
      autoComplete?: string
      placeholder?: string
    })
  | (BaseField & { type: 'select'; options: readonly string[] })
  | (BaseField & { type: 'textarea'; placeholder?: string })
  | (BaseField & { type: 'checkbox'; link?: { label: string; href: string } })
  /**
   * Uploaded with the registration and saved to the organizers' Google Drive;
   * the sheet cell links to it. Keep `accept` in step with the script's
   * `UPLOAD_TYPES`, and `maxBytes` at or under its `UPLOAD_MAX_BYTES`.
   */
  | (BaseField & { type: 'file'; accept: string; maxBytes: number })

export type FieldGroup = { title: string; fields: readonly Field[] }

export const FIELD_GROUPS: readonly FieldGroup[] = [
  {
    title: 'About you',
    fields: [
      { key: 'firstName', label: 'First name', type: 'text', required: true, autoComplete: 'given-name' },
      { key: 'lastName', label: 'Last name', type: 'text', required: true, autoComplete: 'family-name' },
      { key: 'email', label: 'Email', type: 'email', required: true, autoComplete: 'email', help: 'We send your confirmation and acceptance here.' },
      { key: 'phone', label: 'Phone number', type: 'tel', required: true, autoComplete: 'tel' },
      { key: 'age18', label: 'Will you be 18 or older on the day of the hackathon?', type: 'select', required: true, options: ['Yes', 'No'], wide: true },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Woman', 'Man', 'Non-binary', 'Prefer to self-describe', 'Prefer not to say'] },
      { key: 'shirtSize', label: 'T-shirt size', type: 'select', required: true, options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
    ],
  },
  {
    title: 'School',
    fields: [
      { key: 'school', label: 'School', type: 'text', required: true, placeholder: 'Binghamton University', autoComplete: 'organization' },
      { key: 'levelOfStudy', label: 'Level of study', type: 'select', required: true, options: ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate student', 'Other'] },
      { key: 'major', label: 'Major', type: 'text', required: true },
      { key: 'graduationYear', label: 'Expected graduation year', type: 'select', required: true, options: ['2026', '2027', '2028', '2029', '2030', '2031 or later'] },
    ],
  },
  {
    title: 'Experience',
    fields: [
      { key: 'hackathonsAttended', label: 'How many hackathons have you been to?', type: 'select', required: true, options: ['None — this is my first', '1–2', '3–5', '6 or more'], wide: true },
      { key: 'github', label: 'GitHub or portfolio', type: 'url', placeholder: 'https://', help: 'Optional.' },
      { key: 'linkedin', label: 'LinkedIn', type: 'url', placeholder: 'https://', help: 'Optional.' },
      { key: 'resume', label: 'Resume', type: 'file', required: true, accept: '.pdf,.doc,.docx', maxBytes: 5 * 1024 * 1024, wide: true, help: 'PDF or Word document, up to 5 MB. Only HackBU organizers can see it.' },
      { key: 'whyAttend', label: 'What do you hope to build or learn at HackBU?', type: 'textarea', required: true, wide: true },
    ],
  },
  {
    title: 'Logistics',
    fields: [
      { key: 'dietary', label: 'Dietary restrictions', type: 'text', wide: true, placeholder: 'Vegetarian, halal, nut allergy…', help: 'Optional.' },
      { key: 'accessibility', label: 'Anything we can do to make the event accessible for you?', type: 'textarea', wide: true, help: 'Optional.' },
    ],
  },
  {
    title: 'Agreements',
    fields: [
      {
        key: 'codeOfConduct',
        label: 'I agree to follow the hackathon code of conduct.',
        type: 'checkbox',
        required: true,
        wide: true,
        link: { label: 'Read the code of conduct', href: 'https://mlh.io/code-of-conduct' },
      },
      {
        key: 'photoConsent',
        label: 'I’m okay with appearing in photos taken at the event.',
        type: 'checkbox',
        wide: true,
      },
    ],
  },
]
