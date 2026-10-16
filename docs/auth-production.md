# Prochoro sign-in: production setup

App changes alone cannot change provider settings. On 16 October 2026, the
public Auth settings endpoint was reachable, Google and Azure were enabled,
and email auto-confirmation was **off**. This confirms availability, not a
successful account login. No users or remote settings were changed in testing.
The Google sign-in page still linked the old StudyPlat GitHub Pages privacy
and terms addresses, so its Branding fields also need the Prochoro URLs below.

Web sign-in now navigates in the current tab. It keeps PKCE and avoids popup
blocking and the opener handshake. Native builds retain the browser sheet.
Failed callbacks show safe, actionable errors and remove codes from the URL.

## 1. Supabase return addresses

Open the [project URL configuration](https://supabase.com/dashboard/project/oqcgvjzprqwubkbazavo/auth/url-configuration).
Set **Site URL** to `https://prochoro.net/app/`. Add these exact **Redirect URLs**:

```text
https://prochoro.net/app/auth/callback/
https://prochoro.net/app/auth/recovery/
```

Keep existing native callback addresses. `npm run auth:urls` prints development
addresses too; allow only the local addresses you actually use in development.
The app can also consume a same-origin app-root callback if Supabase falls
back to the Site URL, but the explicit addresses above are preferred.

## 2. Password accounts without mandatory email

In **Authentication → Sign In / Providers → Email**, leave Email enabled and
turn **Confirm Email off**, then Save. New email/password signups receive a
session immediately; subsequent sign-ins use the password, without sending
email. The client cannot override this project setting.

Supabase implicitly confirms the Auth email when this is disabled. That flag
does not prove the person owns the mailbox. Prochoro therefore keeps a
separate verification record and never treats `email_confirmed_at` or editable
user metadata as mailbox proof. See [Supabase's configuration documentation](https://supabase.com/docs/guides/auth/general-configuration).

To enable the optional **Account → Email unverified → Send verification code** flow:

1. Run `supabase/migrations/202610160001_optional_email_verification.sql` in
   this project's **SQL Editor**. It is safe to run twice, grants clients no
   table access, and deletes proof when its Auth account is deleted.
2. Deploy `supabase/functions/verify-email` to this project. From the repository,
   after signing in to the Supabase CLI, run:

   ```bash
   npx supabase functions deploy verify-email --project-ref oqcgvjzprqwubkbazavo
   ```

   Leave gateway JWT verification enabled. The function also checks the live
   session with `auth.getUser`; its server-only service credential never enters
   the app. Supabase supplies its built-in environment variables.
3. In **Authentication → Email Templates → Magic Link**, use a code-based
   template rather than a sign-in link. For example:

   ```html
   <h2>Verify your Prochoro email</h2>
   <p>Enter this code in Prochoro:</p>
   <p><strong>{{ .Token }}</strong></p>
   <p>If you did not request this code, ignore this email.</p>
   ```

4. Configure a production **custom SMTP** sender in Supabase. Its default
   mailer has delivery/recipient restrictions and low rate limits. Keep OTP
   expiration and rate limits enabled. See [email OTP setup](https://supabase.com/docs/guides/auth/auth-email-passwordless)
   and [custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
5. With an account you control, create a password account and confirm you can
   study immediately without an email. Open **Options → Account**: it should
   say **Email unverified**. Request a code yourself, enter it, and confirm
   **Email verified**. Sign out/in with the password; no email should be sent.

The function validates a one-use Supabase OTP for the current user's actual
email and ID before saving proof. It revokes only the temporary OTP session;
it preserves the app's current session. Verification is optional and never
gates study or sync. A missing function/migration displays an unavailable
message without interrupting study. No mail is sent just by opening Account.
Older accounts are conservatively unverified here until this explicit proof.
Do not bulk-confirm or alter existing users to test this setup. An existing
account created with mandatory confirmation may still require its original
confirmation; follow its actual sign-in result rather than deleting it.

## 3. Move Google out of Testing

Use the Google Cloud project whose **Web client ID matches the one saved in
Supabase → Google**. Do not create another client just to change its audience.

1. Open [Google Auth Platform → Branding](https://console.cloud.google.com/auth/branding).
   Select that project. Set app name **Prochoro**, your support/contact emails,
   homepage `https://prochoro.net/`, privacy
   `https://prochoro.net/privacy.html`, and terms
   `https://prochoro.net/terms.html`. Add `prochoro.net` under authorized domains
   and verify ownership in Search Console if Google requests it.
2. Open **Data Access**. This app needs only basic identity scopes:
   `openid`, `email`, `profile`. It does not need Gmail, Drive or Calendar access.
3. In **Clients**, open the Web application client used by Supabase. Its
   **Authorized redirect URI** must be exactly:

   ```text
   https://oqcgvjzprqwubkbazavo.supabase.co/auth/v1/callback
   ```

   If the client has JavaScript origins, use the production origin
   `https://prochoro.net`, without `/app/`. The app's `/app/auth/callback/`
   belongs in Supabase's allowlist, not Google's redirect URI field.
4. Open [Audience](https://console.cloud.google.com/auth/audience). Choose
   **External** for a public app. Under **Publishing status**, select
   **Publish app** and confirm. Verify the page now says **In production**.
   If publishing is disabled, finish the missing Branding fields first.
5. If Google requests branding verification, in **Branding** choose
   **Verify Branding**, resolve the reported issues, then **Publish branding**
   when ready. Audience publishing and branding verification are separate.
   Sensitive/restricted scope approval is another process; this app requests
   only basic sign-in information.

Testing status alone does not prove why login failed: Google exempts basic
identity-only sign-in from some Testing restrictions. School/Workspace admins
can still restrict third-party apps. Test in a normal browser with an account
you control and finish the return to Prochoro. Sources:
[Google Audience settings](https://support.google.com/cloud/answer/15549945?hl=en),
[Google branding verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification),
[Supabase Google setup](https://supabase.com/docs/guides/auth/social-login/auth-google).

## 4. Microsoft / Azure

Open [Microsoft Entra](https://entra.microsoft.com/) → **App registrations** →
the application whose client ID matches **Supabase → Azure**.

1. **Authentication → Web redirect URIs** must include the exact Supabase
   callback shown above, with no trailing slash. This is a Web registration,
   even though Prochoro also has a native app.
2. To support Outlook personal accounts and school/work accounts, use
   **Accounts in any organizational directory and personal Microsoft accounts**.
   The current Supabase redirect uses the `common` tenant; it must match the
   supported account types. Personal-only registrations use `consumers` instead.
3. Check **Certificates & secrets**. Supabase needs the secret's **Value**,
   not its Secret ID, and it must not be expired. If replacement is needed,
   enter the new Value directly into Supabase → Azure; never put it in app
   source or chat. Also check the Application/client ID matches.
4. Follow Supabase's instructions to include the **email** and **xms_edov**
   optional claims. The app already requests the required `email` scope.
5. Save, then test both a personal and an allowed school/work account you
   control. School administrators may require approval separately.

Source: [Supabase Microsoft setup](https://supabase.com/docs/guides/auth/social-login/auth-azure).
Reaching Microsoft's account page confirms the button/authorization redirect
works; it cannot verify the client secret or the authenticated return.

## Validation recorded with this change

- TypeScript and 57 tests pass, including callback host validation, recovery,
  duplicate deliveries, safe provider errors, OTP identity mismatch/replay
  rejection and PostgreSQL permissions/cascading deletion.
- Deno type-checks the new Edge Function.
- Web and iOS JavaScript exports succeed. In an isolated local web preview,
  Google and Microsoft both navigate to their sign-in pages in the same tab.
  A simulated Microsoft error callback renders its actionable message and
  removes the callback parameters from the address.
- No production users were created, emails sent, or account data changed by
  automated checks. Owner dashboard changes and a real account login remain
  necessary to validate the complete remote setup.
