/**
 * HackBU registration backend — a Google Apps Script bound to the
 * registrations Google Sheet. Setup steps are in README.md beside this file.
 *
 * doPost dispatches on `action`:
 *   checkEmail          reports whether an email is already registered.
 *   register (default)  writes a row and sends the confirmation email.
 *                       A rush returns `busy` instead of waiting; the form retries.
 *   requestCode         emails a 6-digit sign-in code to a registered address.
 *   verifyCode          exchanges that code for a session token.
 *   getApplication      returns the signed-in applicant's answers and status.
 *   getFile             returns one of that applicant's uploads (the resume)
 *                       so the portal can open the PDF itself.
 *   rsvp                records Coming / Not coming for an accepted applicant.
 *
 *   onAcceptEdit        installable edit trigger (created by `setup`): when an
 *                       organizer sets a row's "Accepted" cell to Yes or No,
 *                       sends the acceptance or rejection email once and
 *                       timestamps it.
 *
 * Column headers come from the question labels the site sends, so editing the
 * questions in src/register/fields.ts needs no change here.
 */

const CONFIG = {
  SHEET_NAME: 'Registrations',
  EVENT_NAME: 'HackBU',
  SENDER_NAME: 'HackBU',
  REPLY_TO: 'hello@hackbu.org',
  DISCORD_URL: 'https://discord.gg/Xka5uUh',
  /** Where applicants sign in to view their application and RSVP. */
  APPLICATION_URL: 'https://hackbu-landing.vercel.app/application',
}

const COL = {
  SUBMITTED: 'Submitted At',
  ACCEPTED: 'Accepted',
  RSVP: 'RSVP',
  RSVP_AT: 'RSVP At',
  ACCEPT_SENT: 'Acceptance Email Sent',
  REJECT_SENT: 'Rejection Email Sent',
  CONFIRM_SENT: 'Confirmation Email Sent',
}

/** Columns organizers manage; never shown back to the applicant as answers. */
const INTERNAL_COLUMNS = Object.keys(COL).map((k) => COL[k])

/** Uploads (the resume) land in this Drive folder, created on first use. */
const UPLOAD_FOLDER_NAME = 'HackBU Resumes'
const UPLOAD_MAX_BYTES = 5 * 1024 * 1024
/** Upload keys (from src/register/fields.ts) a registration must include. */
const REQUIRED_UPLOAD_KEYS = ['resume']
const UPLOAD_TYPES = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

const CODE_TTL_SECONDS = 10 * 60
const CODE_RESEND_SECONDS = 60
const CODE_MAX_ATTEMPTS = 5
/** CacheService's ceiling. */
const SESSION_TTL_SECONDS = 6 * 60 * 60

/**
 * Confirmations stop this many sends short of the daily cap so sign-in codes
 * still go out after a rush. A Workspace account (about 1,500/day) won't
 * notice; a regular Gmail account (about 100/day) will queue the rest.
 */
const CONFIRM_QUOTA_RESERVE = 40
/** Don't retry a confirmation until the inline send has had this long to win. */
const CONFIRM_RETRY_AGE_MS = 3 * 60 * 1000
/** How long to wait for the sheet lock before telling the form to retry. */
const LOCK_WAIT_MS = 2500

/* -------------------------------------------------------------------------- */
/* One-time setup                                                             */
/* -------------------------------------------------------------------------- */

/** Run once from the Apps Script editor. Safe to re-run. */
function setup() {
  const sheet = getSheet_()
  ensureColumn_(sheet, COL.SUBMITTED)
  ensureStatusColumns_(sheet)
  sheet.setFrozenRows(1)
  uploadFolder_()

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'onAcceptEdit')
    .forEach((t) => ScriptApp.deleteTrigger(t))
  ScriptApp.newTrigger('onAcceptEdit').forSpreadsheet(spreadsheet).onEdit().create()

  // Retries confirmation emails the inline send couldn't deliver (quota or a
  // rate limit). The cutoff ignores rows already in the sheet, so re-running
  // setup doesn't email old test registrations.
  const props = PropertiesService.getScriptProperties()
  if (!props.getProperty('CONFIRM_RETRY_AFTER')) {
    props.setProperty('CONFIRM_RETRY_AFTER', String(Date.now()))
  }
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'sendPendingConfirmations')
    .forEach((t) => ScriptApp.deleteTrigger(t))
  ScriptApp.newTrigger('sendPendingConfirmations').timeBased().everyMinutes(5).create()
}

/**
 * Run from the editor before launch. The log shows how many emails are left
 * today: about 100 on a regular Gmail account, about 1,500 on Workspace.
 * Confirmations, sign-in codes, acceptances and rejections all share it.
 */
function checkCapacity() {
  let quota = -1
  try {
    quota = MailApp.getRemainingDailyQuota()
  } catch (err) {
    console.error(err)
  }
  console.log('Remaining MailApp quota today: ' + quota)
  if (quota < 0) return
  if (quota >= 30) {
    console.log('Enough for a normal day of signups (about 10–15, plus sign-in codes).')
    return
  }
  console.log(
    'Low for today. Registrations will still be saved, and leftover confirmation ' +
      'emails go out on a later day. A regular Gmail account allows about 100 emails ' +
      'a day, which covers weeks of signups at this pace.',
  )
}

/* -------------------------------------------------------------------------- */
/* Web app                                                                    */
/* -------------------------------------------------------------------------- */

function doGet() {
  return ContentService.createTextOutput('HackBU registration endpoint is running.')
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents)
    switch (body.action || 'register') {
      case 'checkEmail':
        return json_(handleCheckEmail_(body))
      case 'register':
        return json_(handleRegister_(body))
      case 'requestCode':
        return json_(handleRequestCode_(body))
      case 'verifyCode':
        return json_(handleVerifyCode_(body))
      case 'getApplication':
        return json_(handleGetApplication_(body))
      case 'getFile':
        return json_(handleGetFile_(body))
      case 'rsvp':
        return json_(handleRsvp_(body))
      default:
        return json_({ ok: false, error: 'unknown_action' })
    }
  } catch (err) {
    console.error(err)
    return json_({ ok: false, error: 'server_error' })
  }
}

/* -------------------------------------------------------------------------- */
/* Register                                                                   */
/* -------------------------------------------------------------------------- */

/** Step one of the form: is this email free to register? */
function handleCheckEmail_(body) {
  const email = normalizeEmail_(body.email)
  if (!isEmail_(email)) return { ok: false, error: 'invalid_email' }
  return { ok: true, registered: findRowByEmail_(getSheet_(), email) > 0 }
}

function handleRegister_(body) {
  // Honeypot filled in: a bot. Report success so it doesn't retry.
  if (body.website) return { ok: true }

  const fields = (Array.isArray(body.fields) ? body.fields : [])
    .filter((f) => f && typeof f.key === 'string' && typeof f.label === 'string')
    .map((f) => ({
      key: f.key,
      label: f.label.slice(0, 200),
      value: String(f.value == null ? '' : f.value).slice(0, 5000),
    }))

  const emailField = fields.find((f) => f.key === 'email')
  const firstNameField = fields.find((f) => f.key === 'firstName')
  const email = normalizeEmail_(emailField ? emailField.value : '')
  if (!isEmail_(email)) return { ok: false, error: 'invalid_email' }

  const uploads = []
  const rawFiles = Array.isArray(body.files) ? body.files : []
  for (let i = 0; i < rawFiles.length; i++) {
    const upload = parseUpload_(rawFiles[i])
    if (!upload) return { ok: false, error: 'invalid_file' }
    uploads.push(upload)
  }
  const missing = REQUIRED_UPLOAD_KEYS.some((key) => !uploads.some((u) => u.key === key))
  if (missing) return { ok: false, error: 'missing_file' }

  // Drive writes stay outside the lock. The lock used to cover them, so a
  // rush of resumes stacked every signup behind the previous one until the
  // 30-execution cap filled up and everyone else was dropped.
  const saved = []
  for (let i = 0; i < uploads.length; i++) {
    const link = saveUpload_(uploads[i], email)
    if (!link) return { ok: false, error: 'upload_failed' }
    saved.push({ label: uploads[i].label, link: link })
  }

  rememberHeaders_(emailField, firstNameField)

  const lock = LockService.getScriptLock()
  if (!lock.tryLock(LOCK_WAIT_MS)) {
    console.error('Registration lock busy for ' + email)
    return { ok: false, error: 'busy' }
  }

  let sheet
  let rowIndex
  let confirmCol
  try {
    sheet = getSheet_()
    const needed = [COL.SUBMITTED, COL.ACCEPTED, COL.RSVP, COL.RSVP_AT, COL.ACCEPT_SENT, COL.REJECT_SENT, COL.CONFIRM_SENT]
    fields.forEach((f) => needed.push(f.label))
    saved.forEach((s) => needed.push(s.label))
    const headers = ensureHeaders_(sheet, needed)

    if (findEmailRow_(sheet, headers, emailField.label, email) > 0) {
      return { ok: false, error: 'already_registered' }
    }

    // null, not '': the Accepted column's Yes/No validation rejects an empty
    // string and would fail the whole write.
    const row = headers.map(() => null)
    row[headers.indexOf(COL.SUBMITTED)] = new Date()
    fields.forEach((f) => {
      row[headers.indexOf(f.label)] = f.key === 'email' ? email : safeCell_(f.value)
    })
    saved.forEach((s) => {
      row[headers.indexOf(s.label)] = s.link
    })

    rowIndex = sheet.getLastRow() + 1
    if (rowIndex > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(), 1)
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row])
    SpreadsheetApp.flush()
    confirmCol = headers.indexOf(COL.CONFIRM_SENT) + 1
  } finally {
    lock.releaseLock()
  }

  const emailSent = trySendConfirmation_(email, firstNameField ? firstNameField.value : '')
  if (emailSent) {
    try {
      sheet.getRange(rowIndex, confirmCol).setValue(new Date())
    } catch (err) {
      console.error('Could not mark confirmation sent for ' + email + ': ' + err)
    }
  }

  return { ok: true, emailSent: emailSent }
}

/** A validated `{ key, label, name, blob }`, or null if the file isn't allowed. */
function parseUpload_(raw) {
  if (!raw || typeof raw.label !== 'string' || typeof raw.data !== 'string') return null
  const name = String(raw.name || 'file').replace(/[\\/:*?"<>|]/g, '_').slice(0, 150)
  const ext = (name.split('.').pop() || '').toLowerCase()
  const mimeType = UPLOAD_TYPES[ext]
  if (!mimeType || name.indexOf('.') < 0) return null

  let bytes
  try {
    bytes = Utilities.base64Decode(raw.data)
  } catch (err) {
    return null
  }
  if (bytes.length === 0 || bytes.length > UPLOAD_MAX_BYTES) return null

  return {
    key: String(raw.key || ''),
    label: raw.label.slice(0, 200),
    name: name,
    blob: Utilities.newBlob(bytes, mimeType, name),
  }
}

/**
 * Saves the file to the uploads folder (private to the script owner and
 * whoever the folder is shared with) and returns a sheet formula linking to it.
 * The link text is the original file name, which is also what the applicant
 * sees on their application page.
 */
function saveUpload_(upload, email) {
  try {
    const folder = uploadFolder_()
    const fileName = email + ' - ' + upload.name
    // A retry after `busy` would otherwise save a second copy of the same resume.
    const existing = folder.getFilesByName(fileName)
    let file
    if (existing.hasNext()) {
      file = existing.next()
    } else {
      upload.blob.setName(fileName)
      file = folder.createFile(upload.blob)
    }
    const text = upload.name.replace(/"/g, '""')
    return '=HYPERLINK("' + file.getUrl() + '", "' + text + '")'
  } catch (err) {
    console.error('Upload failed for ' + email + ': ' + err)
    return ''
  }
}

function uploadFolder_() {
  const props = PropertiesService.getScriptProperties()
  const id = props.getProperty('UPLOAD_FOLDER_ID')
  if (id) {
    try {
      const existing = DriveApp.getFolderById(id)
      if (!existing.isTrashed()) return existing
    } catch (err) {
      // Deleted or inaccessible; make a new one below.
    }
  }
  const folder = DriveApp.createFolder(UPLOAD_FOLDER_NAME)
  props.setProperty('UPLOAD_FOLDER_ID', folder.getId())
  return folder
}

/* -------------------------------------------------------------------------- */
/* Sign-in: email code -> session token                                       */
/* -------------------------------------------------------------------------- */

function handleRequestCode_(body) {
  const email = normalizeEmail_(body.email)
  if (!isEmail_(email)) return { ok: false, error: 'invalid_email' }
  if (findRowByEmail_(getSheet_(), email) < 0) return { ok: false, error: 'not_found' }

  const cache = CacheService.getScriptCache()
  const key = 'code:' + email
  const existing = readJson_(cache.get(key))
  if (existing && Date.now() - existing.sentAt < CODE_RESEND_SECONDS * 1000) {
    return { ok: true }
  }

  const code = randomCode_()
  const entry = { code: code, attempts: 0, sentAt: Date.now() }
  cache.put(key, JSON.stringify(entry), CODE_TTL_SECONDS)
  try {
    if (MailApp.getRemainingDailyQuota() < 1) {
      cache.remove(key)
      return { ok: false, error: 'email_quota' }
    }
    sendCodeEmail_(email, code)
  } catch (err) {
    cache.remove(key)
    console.error('Sign-in code failed for ' + email + ': ' + err)
    return { ok: false, error: 'email_quota' }
  }
  return { ok: true }
}

function handleVerifyCode_(body) {
  const email = normalizeEmail_(body.email)
  const code = String(body.code || '').replace(/\D/g, '')
  const cache = CacheService.getScriptCache()
  const key = 'code:' + email
  const entry = readJson_(cache.get(key))
  if (!entry) return { ok: false, error: 'code_expired' }

  if (entry.code !== code) {
    entry.attempts += 1
    if (entry.attempts >= CODE_MAX_ATTEMPTS) {
      cache.remove(key)
      return { ok: false, error: 'code_expired' }
    }
    cache.put(key, JSON.stringify(entry), CODE_TTL_SECONDS)
    return { ok: false, error: 'wrong_code' }
  }

  cache.remove(key)
  const token = Utilities.getUuid() + Utilities.getUuid()
  cache.put('session:' + token, email, SESSION_TTL_SECONDS)
  return { ok: true, token: token }
}

/** The signed-in email for a token, or '' if it has expired. */
function sessionEmail_(token) {
  if (typeof token !== 'string' || token.length < 32) return ''
  return CacheService.getScriptCache().get('session:' + token) || ''
}

/* -------------------------------------------------------------------------- */
/* Application + RSVP                                                         */
/* -------------------------------------------------------------------------- */

function handleGetApplication_(body) {
  const email = sessionEmail_(body.token)
  if (!email) return { ok: false, error: 'unauthorized' }

  const sheet = getSheet_()
  const rowIndex = findRowByEmail_(sheet, email)
  if (rowIndex < 0) return { ok: false, error: 'not_found' }

  const headers = headers_(sheet)
  const range = sheet.getRange(rowIndex, 1, 1, headers.length)
  const row = range.getValues()[0]
  const formulas = range.getFormulas()[0]
  const rich = range.getRichTextValues()[0]
  const cell = (header) => {
    const i = headers.indexOf(header)
    return i < 0 ? '' : row[i]
  }

  // Resumes are sheet HYPERLINK formulas. getValues only returns the filename.
  // A Drive link is marked `file` so the portal fetches the bytes with getFile
  // and opens the PDF itself. Other links (if any) still go out as href.
  const answers = headers
    .map((label, i) => {
      const answer = { label: label, value: formatCell_(row[i]) }
      const href = hyperlinkFromCell_(formulas[i], rich[i])
      if (driveFileId_(href)) answer.file = true
      else if (href) answer.href = href
      return answer
    })
    .filter((a) => a.label && INTERNAL_COLUMNS.indexOf(a.label) < 0)

  return {
    ok: true,
    application: {
      email: email,
      submittedAt: formatCell_(cell(COL.SUBMITTED)),
      status: statusOf_(cell(COL.ACCEPTED)),
      rsvp: String(cell(COL.RSVP) || ''),
      answers: answers,
    },
  }
}

/**
 * The signed-in applicant's own upload, as base64. The portal opens it in the
 * browser instead of sending them to Drive. The file id comes from their row,
 * and the stored name must start with their email, so a token can't be used
 * to read anyone else's resume.
 */
function handleGetFile_(body) {
  const email = sessionEmail_(body.token)
  if (!email) return { ok: false, error: 'unauthorized' }

  const label = String(body.label || '').slice(0, 200)
  if (!label || INTERNAL_COLUMNS.indexOf(label) >= 0) return { ok: false, error: 'not_found' }

  const sheet = getSheet_()
  const rowIndex = findRowByEmail_(sheet, email)
  if (rowIndex < 0) return { ok: false, error: 'not_found' }

  const headers = headers_(sheet)
  const col = headers.indexOf(label)
  if (col < 0) return { ok: false, error: 'not_found' }

  const cell = sheet.getRange(rowIndex, col + 1)
  const fileId = driveFileId_(hyperlinkFromCell_(cell.getFormula(), cell.getRichTextValue()))
  if (!fileId) return { ok: false, error: 'not_found' }

  let file
  try {
    file = DriveApp.getFileById(fileId)
  } catch (err) {
    return { ok: false, error: 'not_found' }
  }
  if (file.isTrashed()) return { ok: false, error: 'not_found' }

  const storedName = file.getName()
  if (storedName.toLowerCase().indexOf(email.toLowerCase() + ' - ') !== 0) {
    return { ok: false, error: 'not_found' }
  }

  const blob = file.getBlob()
  const bytes = blob.getBytes()
  if (!bytes.length || bytes.length > UPLOAD_MAX_BYTES) return { ok: false, error: 'not_found' }

  const dash = storedName.indexOf(' - ')
  return {
    ok: true,
    name: dash < 0 ? storedName : storedName.slice(dash + 3),
    mimeType: blob.getContentType() || 'application/octet-stream',
    data: Utilities.base64Encode(bytes),
  }
}

function handleRsvp_(body) {
  const email = sessionEmail_(body.token)
  if (!email) return { ok: false, error: 'unauthorized' }

  const response = body.response === 'Coming' || body.response === 'Not coming' ? body.response : ''
  if (!response) return { ok: false, error: 'invalid_response' }

  const sheet = getSheet_()
  ensureStatusColumns_(sheet)
  const rowIndex = findRowByEmail_(sheet, email)
  if (rowIndex < 0) return { ok: false, error: 'not_found' }

  const headers = headers_(sheet)
  const accepted = sheet.getRange(rowIndex, headers.indexOf(COL.ACCEPTED) + 1).getValue()
  if (!isYes_(accepted)) return { ok: false, error: 'not_accepted' }

  sheet.getRange(rowIndex, headers.indexOf(COL.RSVP) + 1).setValue(response)
  sheet.getRange(rowIndex, headers.indexOf(COL.RSVP_AT) + 1).setValue(new Date())
  return { ok: true, rsvp: response }
}

/* -------------------------------------------------------------------------- */
/* Decisions                                                                  */
/* -------------------------------------------------------------------------- */

/** Installable onEdit trigger — see `setup`. */
function onAcceptEdit(e) {
  const range = e.range
  const sheet = range.getSheet()
  if (sheet.getName() !== CONFIG.SHEET_NAME) return

  const acceptedCol = headers_(sheet).indexOf(COL.ACCEPTED) + 1
  if (!acceptedCol || acceptedCol < range.getColumn() || acceptedCol > range.getLastColumn()) {
    return
  }

  const firstRow = Math.max(range.getRow(), 2)
  const lastRow = range.getLastRow()
  if (lastRow < firstRow) return

  sendDecisions_(sheet, firstRow, lastRow)
}

/**
 * Sends every acceptance (Yes) and rejection (No) that hasn't been emailed
 * yet. Run it by hand from the editor if an email failed or the trigger was
 * off for a while.
 */
function sendPendingDecisions() {
  const sheet = getSheet_()
  if (sheet.getLastRow() < 2) return
  sendDecisions_(sheet, 2, sheet.getLastRow())
}

function sendDecisions_(sheet, firstRow, lastRow) {
  // No script lock. Decision mail used to share registration's lock, so
  // accepting someone during a signup rush blocked new rows for the whole send.
  ensureColumn_(sheet, COL.REJECT_SENT)
  const headers = headers_(sheet)
  const props = PropertiesService.getScriptProperties()
  const emailCol = headers.indexOf(props.getProperty('EMAIL_HEADER') || 'Email')
  const nameCol = headers.indexOf(props.getProperty('FIRST_NAME_HEADER') || 'First name')
  const acceptedCol = headers.indexOf(COL.ACCEPTED)
  const acceptSentCol = headers.indexOf(COL.ACCEPT_SENT)
  const rejectSentCol = headers.indexOf(COL.REJECT_SENT)
  if (emailCol < 0 || acceptedCol < 0 || acceptSentCol < 0 || rejectSentCol < 0) return

  const rows = sheet.getRange(firstRow, 1, lastRow - firstRow + 1, headers.length).getValues()
  rows.forEach((row, i) => {
    const status = statusOf_(row[acceptedCol])
    if (status === 'pending') return
    const sentCol = status === 'accepted' ? acceptSentCol : rejectSentCol
    if (row[sentCol]) return
    const email = String(row[emailCol]).trim()
    if (!email) return
    const firstName = nameCol >= 0 ? String(row[nameCol]) : ''
    try {
      if (status === 'accepted') sendAcceptance_(email, firstName)
      else sendRejection_(email, firstName)
      sheet.getRange(firstRow + i, sentCol + 1).setValue(new Date())
    } catch (err) {
      console.error('Decision email failed for ' + email + ': ' + err)
    }
  })
}

/* -------------------------------------------------------------------------- */
/* Emails                                                                     */
/* -------------------------------------------------------------------------- */

/** True when the message went out. False means the 5-minute retry will send it. */
function trySendConfirmation_(email, firstName) {
  try {
    if (!confirmationQuotaOk_()) {
      console.error('Confirmation queued, daily quota is low, for ' + email)
      return false
    }
    sendConfirmation_(email, firstName)
    return true
  } catch (err) {
    console.error('Confirmation email failed for ' + email + ': ' + err)
    return false
  }
}

function confirmationQuotaOk_() {
  try {
    return MailApp.getRemainingDailyQuota() > CONFIRM_QUOTA_RESERVE
  } catch (err) {
    console.error(err)
    return false
  }
}

/**
 * Sends confirmation emails the request path couldn't. One run is capped so a
 * backlog doesn't hold an execution open or trip the per-minute mail limit.
 * Rows submitted before `CONFIRM_RETRY_AFTER` (set the first time `setup`
 * runs this version) are left alone.
 */
function sendPendingConfirmations() {
  const cache = CacheService.getScriptCache()
  if (cache.get('confirm-drain')) return
  cache.put('confirm-drain', '1', 240)
  try {
    if (!confirmationQuotaOk_()) return
    const sheet = getSheet_()
    if (sheet.getLastRow() < 2) return

    const headers = headers_(sheet)
    const props = PropertiesService.getScriptProperties()
    const emailCol = headers.indexOf(props.getProperty('EMAIL_HEADER') || 'Email')
    const nameCol = headers.indexOf(props.getProperty('FIRST_NAME_HEADER') || 'First name')
    const submittedCol = headers.indexOf(COL.SUBMITTED)
    const confirmCol = headers.indexOf(COL.CONFIRM_SENT)
    if (emailCol < 0 || submittedCol < 0 || confirmCol < 0) return

    const retryAfter = Number(props.getProperty('CONFIRM_RETRY_AFTER') || '0')
    const cutoff = Date.now() - CONFIRM_RETRY_AGE_MS
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues()
    const pending = []
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][confirmCol]) continue
      const submitted = rows[i][submittedCol]
      const submittedMs = submitted instanceof Date ? submitted.getTime() : 0
      if (!submittedMs || submittedMs < retryAfter || submittedMs > cutoff) continue
      const email = normalizeEmail_(rows[i][emailCol])
      if (!isEmail_(email)) continue
      pending.push({
        row: i + 2,
        email: email,
        firstName: nameCol >= 0 ? String(rows[i][nameCol] || '') : '',
      })
      if (pending.length >= 15) break
    }

    pending.forEach((item) => {
      if (!trySendConfirmation_(item.email, item.firstName)) return
      try {
        sheet.getRange(item.row, confirmCol + 1).setValue(new Date())
      } catch (err) {
        console.error('Could not mark confirmation sent for ' + item.email + ': ' + err)
      }
    })
  } finally {
    cache.remove('confirm-drain')
  }
}

function sendConfirmation_(email, firstName) {
  sendEmail_(email, 'We got your ' + CONFIG.EVENT_NAME + ' registration', {
    paragraphs: [
      greeting_(firstName),
      'Thanks for registering for ' + CONFIG.EVENT_NAME + '! We’ve received your application.',
      'Our team will review it and email you again with a decision. You can check your application any time:',
    ],
    button: { label: 'View your application', href: CONFIG.APPLICATION_URL },
  })
}

function sendAcceptance_(email, firstName) {
  sendEmail_(email, 'You’re accepted to ' + CONFIG.EVENT_NAME + '!', {
    paragraphs: [
      greeting_(firstName),
      'Congratulations — you’ve been accepted to ' + CONFIG.EVENT_NAME + '! We can’t wait to see what you build.',
      'Please let us know whether you’re coming so we can plan food and swag. Sign in with this email address to RSVP:',
    ],
    button: { label: 'RSVP now', href: CONFIG.APPLICATION_URL },
  })
}

function sendRejection_(email, firstName) {
  sendEmail_(email, 'Your ' + CONFIG.EVENT_NAME + ' application', {
    paragraphs: [
      greeting_(firstName),
      'Thank you for applying to ' + CONFIG.EVENT_NAME + '. We had many more applicants than spots this year, and unfortunately we aren’t able to offer you a place at this event.',
      'We hope you’ll apply again next time, and you’re always welcome at our club events and workshops throughout the year.',
    ],
  })
}

function sendCodeEmail_(email, code) {
  sendEmail_(email, 'Your ' + CONFIG.EVENT_NAME + ' sign-in code: ' + code, {
    paragraphs: [
      'Your sign-in code is:',
      code,
      'It expires in 10 minutes. If you didn’t ask for this, you can ignore this email.',
    ],
    bigIndex: 1,
  })
}

/**
 * `button` renders as a pine link; `bigIndex` marks one paragraph to set large
 * (the sign-in code). Every email ends with the Discord link.
 */
function sendEmail_(to, subject, options) {
  const paragraphs = options.paragraphs
  const button = options.button

  const plainParts = paragraphs.slice()
  if (button) plainParts.push(button.label + ': ' + button.href)
  plainParts.push('Join the HackBU Discord: ' + CONFIG.DISCORD_URL)
  const plain = plainParts.join('\n\n') + '\n\n— The HackBU team'

  const html =
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#3c5c48;max-width:560px">' +
    paragraphs
      .map((p, i) =>
        i === options.bigIndex
          ? '<p style="font-size:32px;font-weight:bold;letter-spacing:6px">' + escapeHtml_(p) + '</p>'
          : '<p>' + escapeHtml_(p) + '</p>',
      )
      .join('') +
    (button ? buttonHtml_(button.label, button.href) : '') +
    '<p style="font-size:14px">Join the <a href="' + CONFIG.DISCORD_URL + '" style="color:#3c5c48">HackBU Discord</a> for updates.</p>' +
    '<p>— The HackBU team</p></div>'

  MailApp.sendEmail({
    to: to,
    subject: subject,
    body: plain,
    htmlBody: html,
    name: CONFIG.SENDER_NAME,
    replyTo: CONFIG.REPLY_TO,
  })
}

function buttonHtml_(label, href) {
  return (
    '<p><a href="' + href + '" style="display:inline-block;background:#3c5c48;color:#f7f5ee;' +
    'padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">' +
    escapeHtml_(label) + '</a></p>'
  )
}

function greeting_(firstName) {
  const name = String(firstName || '').trim()
  return name ? 'Hi ' + name + ',' : 'Hi there,'
}

/* -------------------------------------------------------------------------- */
/* Sheet helpers                                                              */
/* -------------------------------------------------------------------------- */

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  return spreadsheet.getSheetByName(CONFIG.SHEET_NAME) || spreadsheet.insertSheet(CONFIG.SHEET_NAME)
}

function headers_(sheet) {
  const lastCol = sheet.getLastColumn()
  if (lastCol === 0) return []
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String)
}

/** 1-based row for `email`, or -1. */
function findRowByEmail_(sheet, email) {
  const header = PropertiesService.getScriptProperties().getProperty('EMAIL_HEADER') || 'Email'
  return findEmailRow_(sheet, headers_(sheet), header, email)
}

/** Same lookup when the caller already read the header row. */
function findEmailRow_(sheet, headers, header, email) {
  const col = headers.indexOf(header) + 1
  if (!col || sheet.getLastRow() < 2) return -1
  const values = sheet.getRange(2, col, sheet.getLastRow() - 1, 1).getValues()
  for (let i = 0; i < values.length; i++) {
    if (normalizeEmail_(values[i][0]) === email) return i + 2
  }
  return -1
}

/** One header read, then a single write for whichever columns are new. */
function ensureHeaders_(sheet, needed) {
  const headers = headers_(sheet)
  const have = {}
  headers.forEach((h) => {
    if (h) have[h] = true
  })
  const missing = []
  needed.forEach((h) => {
    if (!h || have[h]) return
    have[h] = true
    missing.push(h)
  })
  if (!missing.length) return headers

  const start = headers.length + 1
  const extra = start + missing.length - 1 - sheet.getMaxColumns()
  if (extra > 0) sheet.insertColumnsAfter(sheet.getMaxColumns(), extra)
  sheet.getRange(1, start, 1, missing.length).setValues([missing]).setFontWeight('bold')
  const acceptedAt = missing.indexOf(COL.ACCEPTED)
  if (acceptedAt !== -1) applyAcceptedValidation_(sheet, start + acceptedAt)
  return headers.concat(missing)
}

/** Writes the email and first-name header names once, not on every signup. */
function rememberHeaders_(emailField, firstNameField) {
  const props = PropertiesService.getScriptProperties()
  const next = {}
  if (emailField && props.getProperty('EMAIL_HEADER') !== emailField.label) {
    next.EMAIL_HEADER = emailField.label
  }
  if (firstNameField && props.getProperty('FIRST_NAME_HEADER') !== firstNameField.label) {
    next.FIRST_NAME_HEADER = firstNameField.label
  }
  if (Object.keys(next).length) props.setProperties(next)
}

/** Returns the 1-based column for `header`, appending it if missing. */
function ensureColumn_(sheet, header) {
  const headers = headers_(sheet)
  const index = headers.indexOf(header)
  if (index >= 0) return index + 1
  const col = headers.length + 1
  if (col > sheet.getMaxColumns()) sheet.insertColumnsAfter(sheet.getMaxColumns(), 1)
  sheet.getRange(1, col).setValue(header).setFontWeight('bold')
  return col
}

function ensureStatusColumns_(sheet) {
  const acceptedCol = ensureColumn_(sheet, COL.ACCEPTED)
  ensureColumn_(sheet, COL.RSVP)
  ensureColumn_(sheet, COL.RSVP_AT)
  ensureColumn_(sheet, COL.ACCEPT_SENT)
  ensureColumn_(sheet, COL.REJECT_SENT)
  ensureColumn_(sheet, COL.CONFIRM_SENT)
  applyAcceptedValidation_(sheet, acceptedCol)
}

function applyAcceptedValidation_(sheet, col) {
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Yes', 'No'], true)
    .setAllowInvalid(false)
    .build()
  sheet.getRange(2, col, Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(rule)
}

/* -------------------------------------------------------------------------- */
/* Small utilities                                                            */
/* -------------------------------------------------------------------------- */

function normalizeEmail_(value) {
  return String(value || '').trim().toLowerCase()
}

function isEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isYes_(value) {
  return String(value).trim().toLowerCase() === 'yes'
}

/** The "Accepted" cell as a status: Yes, No, or anything else (undecided). */
function statusOf_(value) {
  const v = String(value).trim().toLowerCase()
  if (v === 'yes') return 'accepted'
  if (v === 'no') return 'rejected'
  return 'pending'
}

function randomCode_() {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid())
  let n = 0
  for (let i = 0; i < 4; i++) n = n * 256 + (bytes[i] & 0xff)
  return String(n % 1000000).padStart(6, '0')
}

function readJson_(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch (err) {
    return null
  }
}

function formatCell_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'MMM d, yyyy h:mm a')
  }
  return String(value == null ? '' : value)
}

/** A Drive file id from a file URL, or ''. */
function driveFileId_(url) {
  const text = String(url || '')
  const byPath = text.match(/\/d\/([a-zA-Z0-9_-]+)/)
  if (byPath) return byPath[1]
  const byQuery = text.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  return byQuery ? byQuery[1] : ''
}

/** The URL from a HYPERLINK formula or a rich-text link, or ''. */
function hyperlinkFromCell_(formula, rich) {
  const match = String(formula || '').match(/^=HYPERLINK\(\s*"([^"]+)"/i)
  if (match) return match[1]
  if (!rich) return ''
  try {
    const whole = rich.getLinkUrl()
    if (whole) return whole
    const runs = rich.getRuns()
    for (let i = 0; i < runs.length; i++) {
      const url = runs[i].getLinkUrl()
      if (url) return url
    }
  } catch (err) {
    // Older Sheets builds may not expose link URLs on rich text.
  }
  return ''
}

/** Stops answers like "+1 607…" or "=HYPERLINK(…)" being read as formulas. */
function safeCell_(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value
}

function escapeHtml_(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  )
}
