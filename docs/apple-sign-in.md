# Sign in with Apple: release setup

Updated 12 October 2026. The native iOS client, Apple button, entitlement/plugin, nonce verification, and server-side deletion implementation are present. **Apple is not enabled in the live Supabase project, and the Edge Function has not been deployed.** Membership alone does not activate the provider.

## Owner setup

1. In Apple Developer → Certificates, Identifiers & Profiles, register/confirm the explicit App ID **com.aarushkik.studyplat** and enable **Sign in with Apple**. Keep this bundle ID consistent in App Store Connect, Expo, Supabase, and the function secrets.
2. In Supabase → Authentication → Providers → Apple, enable Apple and add **com.aarushkik.studyplat** to the allowed Client IDs. Native sign-in uses Apple's identity token; a web Services ID is not needed for this app's iOS-only flow. Keep Google and Azure enabled.
3. Create a Sign in with Apple key associated with this primary App ID. Keep the `.p8` file private. Configure these **Supabase Edge Function secrets**, never `EXPO_PUBLIC_` variables or committed files:

   | Secret | Value |
   | --- | --- |
   | `APPLE_CLIENT_ID` | `com.aarushkik.studyplat` |
   | `APPLE_TEAM_ID` | Your Apple Developer Team ID |
   | `APPLE_KEY_ID` | The ID of the Sign in with Apple signing key |
   | `APPLE_PRIVATE_KEY` | Full PKCS#8 `.p8` content; real newlines or escaped `\n` are supported |

   Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to its hosted Edge runtime. Never put the service role key in the app. Do not paste the private key into chat.
4. Deploy the reviewed function with your authenticated Supabase CLI: `supabase functions deploy delete-apple-account --project-ref YOUR_PROJECT_REF`. The checked-in function configuration delegates JWT validation to `auth.getUser`, allowing current asymmetric Supabase signing keys; the function still requires a valid bearer token and an Apple-linked account.
5. Apply `supabase/migrations/202610120001_apple_account_deletion.sql` to the existing database after deploying the function. Fresh projects use the complete `supabase/schema.sql`. The SQL guard stops Apple-linked users from bypassing token revocation through the old deletion RPC. Test on disposable staging accounts first.
6. Set **EXPO_PUBLIC_APPLE_SIGN_IN_ENABLED=true** in the EAS preview environment after those steps. Build a signed iOS preview and run the acceptance checklist below. Enable the same flag in production only after acceptance passes. The local `.env` does not configure EAS environments.
7. Link the Expo project (`eas init` in the owner's account), create the App Store Connect record with this bundle ID, and configure signing/submission. The EAS project ID is currently blank. Do not change the identifier after distributing builds without planning an identity migration.

## What the implementation does

- The system Apple button opens Apple's native sheet. A fresh random nonce is SHA-256 hashed for Apple; Supabase receives the raw nonce and verifies it against the identity token. First-sign-in name metadata is saved when available. Canceling the sheet is not treated as an error.
- Account deletion retrieves the current Supabase user from the server. An Apple identity requires a fresh Apple confirmation on iPhone/iPad, even if the current session used Google or email.
- The Edge Function derives the user ID from the authenticated token, exchanges the one-use Apple code, validates Apple's signature, audience, issuer, expiry, freshness, subject and nonce, then revokes the Apple refresh token **before** deleting the Supabase user. Profile and sync receipts cascade through the database foreign keys.
- Verification or revocation failure stops deletion. A later database failure can leave Apple authorization revoked while the StudyPlat account remains; retry from the app with a fresh Apple confirmation. No tokens or user claims are logged. Signing keys remain server-side.
- Apple-linked deletion from web/Android directs the user to StudyPlat on iPhone/iPad. Apple sign-in itself is offered only in the native iOS build. Google, Microsoft, and email remain available elsewhere.

## Native acceptance — still required

Use a signed development/preview build or TestFlight, not Expo Go's different bundle identity. Use disposable accounts and confirm destructive tests explicitly.

- First sign-in with shared email and Hide My Email; returning sign-in after relaunch; cancellation; network failure; account switching.
- Google and Microsoft still succeed; email recovery deep links return correctly.
- Profile → Delete account → confirm with the same Apple ID: Apple grant revoked, Supabase auth/profile/receipt records removed, local account cache cleared. A canceled sheet preserves the account. A different Apple ID must not revoke or delete either account.
- Failed function deployment/missing secrets/Apple timeout shows a recoverable error. Plain Google/email accounts still use the protected deletion RPC.
- Test Reduce Motion, Reduce Transparency, VoiceOver, and larger text on an iPhone and iPad.

`npm run release:check` reads provider settings and makes an **unauthenticated** function probe that must return `401 NOT_SIGNED_IN`. This proves deployment and rejection of unsigned calls, not the correctness of secrets or a successful revocation. Unit tests exercise identity/nonce mismatch and verify-before-revoke-before-delete ordering. Deno type-checking is separate from the Expo TypeScript check:

```sh
deno check --no-config supabase/functions/delete-apple-account/index.ts
```

## References

- [Expo AppleAuthentication](https://docs.expo.dev/versions/v54.0.0/sdk/apple-authentication/)
- [Supabase Sign in with Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [Apple account deletion requirements](https://developer.apple.com/support/offering-account-deletion-in-your-app/)
- [Apple token revocation](https://developer.apple.com/documentation/signinwithapplerestapi/revoke-tokens)
