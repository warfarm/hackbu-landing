# Registration backend (Google Sheets + Apps Script)

The `/register` page and the `/application` applicant portal both talk to a
Google Apps Script web app. The script:

1. adds a row to the **Registrations** tab of your Google Sheet for each registration,
2. emails the applicant a confirmation right away,
3. emails them an acceptance when an organizer sets their **Accepted** cell to
   **Yes**, or a rejection when it's set to **No**,
4. signs applicants in to `/application` with a 6-digit code sent to their email, and
5. records their RSVP (**Coming** / **Not coming**) in the **RSVP** column once they're accepted.

Emails are sent from the Google account that deploys the script. It must be a
regular Gmail or HackBU account: university accounts can't make the web app
public, so the form can't reach it.

## One-time setup

1. **Create the sheet.** In the HackBU Google account, create a new Google
   Sheet (for example "HackBU Registrations").
2. **Add the script.** In the sheet, open **Extensions → Apps Script**. Delete
   the starter code and paste in everything from `Code.gs`. Check the `CONFIG`
   block at the top (event name, reply-to address, and `APPLICATION_URL`, the
   live address of the `/application` page that emails link to) and save.
3. **Run setup.** In the function dropdown pick `setup` and click **Run**.
   Google will ask you to authorize the script (Sheets, Gmail sending, Drive,
   triggers) — allow it. This creates the Registrations tab, the status
   columns, the Yes/No dropdown, the resume folder, and the trigger that sends
   decision emails.
4. **Deploy as a web app.** Click **Deploy → New deployment**, choose type
   **Web app**, and set:
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**

   Click **Deploy** and copy the **Web app URL** (ends in `/exec`).
5. **Connect the site.** In Vercel, open the project's **Settings →
   Environment Variables** and add:

   ```
   VITE_REGISTRATION_ENDPOINT = <the /exec URL>
   ```

   Then redeploy the site. For local development, put the same line in a
   `.env.local` file in the project root and restart `npm run dev`.

Open the `/exec` URL in a browser to check it's live: it should say
"HackBU registration endpoint is running."

## Accepting or rejecting someone

In the Registrations tab, set the person's **Accepted** cell:

- **Yes** sends the acceptance email and fills in **Acceptance Email Sent**.
- **No** sends the rejection email and fills in **Rejection Email Sent**.
- Blank means undecided; the applicant's page shows "Under review".

Emails go out within a few seconds. Each kind is sent at most once per person,
so flipping the cell back and forth won't resend. But choose carefully: a No
set by mistake has already emailed a rejection, and changing it to Yes then
sends an acceptance too.

If an email ever fails (or the trigger was off), run `sendPendingDecisions`
from the Apps Script editor to send every Yes and No that hasn't been emailed
yet.

## Resumes

Every applicant must upload a resume (PDF or Word, up to 5 MB). It's saved to a
**HackBU Resumes** folder in the script owner's Google Drive, created by
`setup`. The **Resume** cell links to the file. The files are private: to let
other organizers open them, share that folder with them in Drive (sharing the
sheet alone isn't enough).

## RSVPs

Accepted applicants sign in at `/application` and choose **I'm coming** or
**I can't make it**. Their answer lands in the **RSVP** column and the time in
**RSVP At**. They can change it later; the sheet always shows the latest answer.

## Changing the questions

Edit `src/register/fields.ts` and redeploy the site. The script uses each
question's label as its column header and adds a new column the first time it
sees one — no script change needed. Keep the `email` and `firstName` keys, since
sign-in and the emails use them.

## Updating the script

After editing the code in Apps Script, use **Deploy → Manage deployments →
(edit) → Version: New version → Deploy**. This keeps the same `/exec` URL, so
the site doesn't need to change.

## Limits

Google caps how many emails a script can send per day: about 100 for a regular
Gmail account and 1,500 for a Google Workspace account. Confirmations,
acceptances, rejections and sign-in codes all count toward it.

Sign-in codes expire after 10 minutes and allow 5 tries; a new code can be
requested once a minute. A sign-in lasts 6 hours.
