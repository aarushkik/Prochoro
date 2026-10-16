# Setup and deployment

Two parts: **wire up Supabase** so sign-in works, then **ship to the App
Store**. Do them in that order — you cannot test a build you cannot sign into.

## The short version

Fifteen minutes if nothing fights you. Every step is expanded below.

1. Create a Supabase project.
2. **SQL Editor** → paste `supabase/schema.sql` → **Run**.
3. **Project Settings → API** → copy the Project URL and the **publishable**
   key (or the older **anon** key) into `.env` (`cp .env.example .env` first).
4. Run `npm run auth:urls` and paste what it prints into **Authentication →
   URL Configuration → Redirect URLs**. It computes them from `app.json` and
   your LAN address, which is where the mistakes otherwise happen.
5. **Authentication → Providers → Email** → on. That is enough to sign in.
   Google and Microsoft each need an account with that provider and take
   about ten minutes apiece; they are steps 5 and 6.
6. `npx expo start --clear`, sign up with an email, and check a row appeared
   in **Table Editor → profiles**.

Steps 1–3 and 5 are the minimum to get a working login. OAuth can wait.

> **You do not need to send me your keys.** The anon key is safe to ship
> inside the app, but nothing about setting it up requires sharing it — the
> app reads it from your `.env`, which is git-ignored.

---

# Part 1 — Supabase

## 1. Create the project

1. <https://supabase.com/dashboard> → **New project**.
2. Pick a region physically near your users; it sets your latency floor.
3. Save the database password somewhere real. You cannot recover it later.

## 2. Run the schema

**SQL Editor → New query**, paste all of [`supabase/schema.sql`](../supabase/schema.sql), **Run**.

That creates the `profiles` table, the row-level-security policies, and a
trigger that makes a row whenever someone signs up. It is safe to run twice —
every column added since the first release is written as `add column if not
exists`, so re-running it after pulling is how you pick those up rather than
something to avoid.

> **Do not skip the RLS part.** The app ships with your anon key inside it —
> anyone who downloads the app has it. RLS is the only thing stopping one
> student reading another's row. Verify it took: **Table Editor → profiles →**
> the shield icon should read **RLS enabled**.

## 3. Get your keys

**Project Settings → API**. Copy:

- **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
- **publishable** key (`sb_publishable_...`) → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Older projects show an **anon / public** key instead. Either works and goes in
the same variable, which keeps its original name so existing `.env` files do
not break.

Prefer the publishable key where you have the choice. The legacy `anon` and
`service_role` keys are JWTs signed with the project's JWT secret, so rotating
a leaked one means rotating that secret — which invalidates every key and signs
out every user at once. Publishable and secret keys are independent credentials
you can revoke and roll one at a time.

Create `.env` in the project root:

```bash
cp .env.example .env
```

and paste both in. `.env` is git-ignored.

> **Never put the secret key in the app** — `sb_secret_...`, or `service_role`
> on older projects. `EXPO_PUBLIC_` variables are inlined into the JS bundle at
> build time, so anyone who unpacked the IPA would read it, and it bypasses RLS
> completely: full read/write on every student's data.
>
> The publishable key in the same file is fine there. It is meant to be public,
> and the RLS policies — not the key's secrecy — are what protect the rows.

## 4. Set the redirect URLs

Run this first — it computes every URL from `app.json` and this machine's own
LAN address, so there is nothing to guess at:

```bash
npm run auth:urls
```

**Authentication → URL Configuration → Redirect URLs.** Add what it prints:

```
studyplat://auth/callback
exp://<your-lan-ip>:8081/--/auth/callback
exp://**
https://<your-project-ref>.supabase.co/auth/v1/callback
```

The first is the production app (it matches `scheme` in `app.json`). The middle
two are Expo Go during development — the wildcard saves you re-editing this
every time your laptop changes network. The last is Supabase's own callback,
which the providers below need.

**A mismatch here is the single most common reason sign-in fails**, and the
symptom is unhelpful: the browser sheet opens, you log in, and it either hangs
or returns you to a signed-out app.

## 5. Enable email and password

**Authentication → Providers → Email** → on.

This is the one that needs no third-party account, works in the simulator, and
is the only way to test sign-in before Google and Microsoft are registered. The
app has had email sign-up and sign-in on the login screen since the OAuth work
landed.

One setting matters: **Confirm email**.

- **On** (Supabase's default) — a new account gets a confirmation link by email
  and cannot sign in until it is clicked. The app handles this: sign-up returns
  "Account created. Check your email to confirm it, then sign in."
- **Off** — sign-up signs you straight in. Much faster while developing.

Supabase's built-in mailer is rate-limited to a handful of messages an hour and
is not meant for production. Turn confirmation **off** while you build, and
before you ship either turn it back on with your own SMTP configured under
**Project Settings → Authentication → SMTP Settings**, or leave it off
deliberately.

## 6. Enable Google

1. <https://console.cloud.google.com> → new project.
2. **APIs & Services → OAuth consent screen** → External → fill in app name,
   support email, developer email. Add scopes `email` and `profile`.
3. **Credentials → Create credentials → OAuth client ID → Web application.**
4. Under **Authorised redirect URIs** add exactly:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
5. Copy the **Client ID** and **Client secret**.
6. Back in Supabase: **Authentication → Providers → Google** → enable → paste
   both → Save.

> While the consent screen is in **Testing**, only accounts you list under
> *Test users* can sign in. Publish it before you submit to Apple, or the
> reviewer will be locked out and reject the build.

## 7. Enable Microsoft (Azure)

1. <https://portal.azure.com> → **Microsoft Entra ID → App registrations → New
   registration**.
2. Under **Supported account types** choose
   **Accounts in any organizational directory and personal Microsoft accounts**
   — otherwise personal @outlook.com accounts cannot sign in.
3. **Redirect URI**: platform **Web**, value
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
4. Copy the **Application (client) ID**.
5. **Certificates & secrets → New client secret** → copy the **Value**
   immediately; it is only shown once.
6. In Supabase: **Authentication → Providers → Azure** → enable → paste the
   client ID and secret. Leave **Azure Tenant URL** blank for multi-tenant.

## 8. Test it

```bash
npx expo start --clear
```

Open on a device or simulator. Both buttons should open a browser sheet, and
after logging in the sheet should close itself and land you on the intro.

Check it worked: **Supabase → Table Editor → profiles** should now have a row
whose `id` matches **Authentication → Users**.

### If it fails

| What you see | Cause |
|---|---|
| "That sign-in method is not switched on" | The provider is disabled in Supabase. |
| "The redirect URL is not on the allow-list" | Step 4 — the URL must match character for character. |
| Sheet opens, logs in, returns signed out | Redirect URL mismatch, or `scheme` in `app.json` does not match. |
| "This build has no Supabase keys yet" | `.env` missing, or you did not restart with `--clear`. |
| Works in Expo Go, fails in a real build | You added the `exp://` URL but not `studyplat://`. |
| Signed in, but the app shows "Not syncing" | The write is failing. Usually the deployed schema is behind — re-run `supabase/schema.sql`. |
| Sign-up says to check your email, nothing arrives | Supabase's built-in mailer is rate-limited. Turn **Confirm email** off while developing (step 5). |

---

# Part 2 — Shipping to the App Store

## 1. Prerequisites

- **Apple Developer Program membership** — $99/year, and enrolment can take a
  day or two. Start this first; it is the longest lead time in the process.
- A Mac is *not* required. EAS builds in the cloud.

## 2. Set up EAS

```bash
npm install -g eas-cli
eas login
eas build:configure
```

That writes `eas.json` and fills in the `extra.eas.projectId` field that is
currently blank in `app.json`.

## 3. Give EAS your secrets

`.env` is not uploaded with your build. Push the two keys to EAS instead:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-ref.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key"
```

## 4. Build

```bash
eas build --platform ios --profile production
```

EAS will offer to generate signing credentials — let it. First build takes
15–30 minutes.

## 5. Submit

```bash
eas submit --platform ios --latest
```

## 6. App Store Connect

At <https://appstoreconnect.apple.com>, create the app record and fill in:

**Required before you can submit**

- **Screenshots** — 6.7" iPhone is mandatory. The map, a question, and the
  progress screen make the strongest three.
- **Description, keywords, support URL, marketing URL.**
- **Age rating** — answer the questionnaire honestly; this app should land at
  4+.
- **Privacy policy URL** — *mandatory*, and you cannot submit without a real,
  reachable page. It must state that you collect email address and name via
  Google/Microsoft sign-in, and that progress data is stored on Supabase.

**Privacy nutrition labels.** Declare truthfully:

| Data | Collected | Linked to user | Used for tracking |
|---|---|---|---|
| Email address | Yes | Yes | No |
| Name | Yes | Yes | No |
| User ID | Yes | Yes | No |
| Product interaction (progress, XP) | Yes | Yes | No |

**Export compliance.** `app.json` already sets
`ITSAppUsesNonExemptEncryption: false`, which is correct — you use HTTPS only,
which is exempt. This saves you a form on every submission.

## 7. What Apple will most likely reject you for

These are the ones that actually bite apps like this one:

1. **Guideline 5.1.1(v) — Account sign-in.** If an app offers third-party
   sign-in, Apple usually requires **Sign in with Apple** alongside it. With
   Google and Microsoft and nothing else, expect a rejection. Supabase supports
   Apple as a provider; follow [the current setup guide](apple-sign-in.md) before submitting.
2. **Guideline 5.1.1(ii) — Data collection.** You must offer **account
   deletion** from inside the app, not just a support email. A "Delete my
   account" control under Profile that calls a Supabase edge function is the
   usual answer.
3. **Reviewer cannot sign in.** If your Google consent screen is still in
   Testing, or Azure is single-tenant, review fails immediately. Also provide a
   **demo account** in App Review notes — reviewers frequently cannot complete
   OAuth on their test devices.
4. **Broken links.** Support URL and privacy policy URL must both load.
   These live in `site/` and are served by GitHub Pages — see below. Preview
   them locally with the `studyplat-site` launch config.

## Publishing the public pages

App Store Connect requires a working **privacy policy URL** and **support
URL**; both are checked, and a dead one is a straightforward rejection. Four
static pages cover it, in `site/`:

| Page | Used for |
|---|---|
| `privacy.html` | App Store Connect privacy policy URL, Google consent screen |
| `support.html` | App Store Connect support URL |
| `terms.html` | Linked from the sign-in screen |
| `index.html` | Optional marketing URL |

To publish them free from this repo: **GitHub → Settings → Pages → Source:
Deploy from a branch → Branch `main`, folder `/site` → Save.** They appear at
`https://prochoro.net/` within a minute or two.

If GitHub only offers `/` and `/docs` as folders, either move `site/` to
`docs/` or use a Pages action; the URLs in `src/lib/links.ts` are the only
thing that has to change with it.

> **Read both pages before you submit.** They are written from what the app
> actually does — the columns it stores, the fact that there is no analytics or
> advertising, and that deletion is in-app — but the contact address and the
> claims are yours to stand behind. This is a starting point drafted against
> the code, not legal advice.

## 8. Recommended order

1. Configure and test **Sign in with Apple** ([setup guide](apple-sign-in.md)).
2. Add **account deletion** (risk 2).
3. Write the privacy policy and host it.
4. Publish the Google consent screen.
5. Build, submit, and put a demo account in the review notes.

---

## Current release status

See [release readiness](release-readiness.md) for the current gates and verified checks, and [Apple sign-in setup](apple-sign-in.md) for the native Apple provider and secure account-deletion deployment.

Bosses, companions, course icons, placement badges, the welcome camp, and all ten landscapes now use bundled generated artwork. The earlier procedural landscape illustrations are gone. Question banks remain 120 questions per course and still need editorial review before publication. Native sign-in, revocation, TestFlight, signing, and store metadata require owner account setup and device acceptance.
