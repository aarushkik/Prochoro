# StudyPlat release readiness

Updated 13 October 2026. The design refresh and local release work are implemented. **Do not submit yet:** Apple/Supabase configuration, the Expo project link, signing, and native acceptance are still required.

## This update

- Replaced procedural camp, skyline, scattered landscape motifs, placement drawings and activity glyphs with 27 generated illustrations: one camp, ten landscapes, eight courses, four badges and four activity emblems. Art matches Stu and is bundled offline. Existing illustrated study-club bosses and companions retain their saved IDs. See [design refinement](design-refinement.md) and [generation prompts](design-art-prompts.json).
- Refined shared card opacity, illustrated course/region headers, narrow region labels and glass navigation motion. Removed endless celebration confetti. Retained native Liquid Glass where available, blur/solid fallbacks, dark appearance, Reduce Motion and Reduce Transparency support.
- Kept the native Apple sign-in implementation and added the missing server-side token revocation path for account deletion. It validates the authenticated user, Apple signature/audience/nonce/identity, then revokes before deleting. The SQL guard prevents Apple-linked accounts bypassing revocation through the old RPC. No remote provider settings, keys or account data were changed.
- Declared the required-reason APIs used by the bundled React Native and Expo native packages in the app-level iOS privacy manifest, using those packages' own declared reasons. The actual signed archive still needs App Store Connect validation. Android now has an initial version code.
- Google and Microsoft remain enabled. Students can study as guests with local saving, with persistent prompts to create an account for cross-device sync. Guest progress imports when signing in to a same-course account and stays local when the account follows a different course. Signed-in study progress can persist locally while offline and synchronize when connected.

## Verified locally

- `npm run check`: TypeScript and all 33 tests pass. Coverage includes actual PostgreSQL migration/RLS/sync/deletion execution, duplicate reward prevention, persistence recovery, calendar streaks, theme contrast, asset metadata, and Apple identity/nonce/revocation failure ordering.
- The current iOS Hermes export succeeds, and an Expo iOS prebuild generated the expected Sign in with Apple entitlement and the app-level `PrivacyInfo.xcprivacy` with all four configured required-reason API categories. This validates generation, not an archive signed by Apple.
- `deno check --no-config supabase/functions/delete-apple-account/index.ts`: passes. This checks the server runtime separately from Expo.
- Production web, iOS Hermes and Android Hermes exports succeed at `/private/tmp/studyplat-refined-final`. These are JavaScript/assets exports, **not signed app archives**.
- Read-only health check: Auth HTTP 200, database HTTP 200, Google and Azure enabled.
- Network-enabled release preflight: public Supabase configuration, 1024px opaque icon, public privacy/terms/support URLs, and Google/Azure providers pass. EAS project link, Apple flag/provider and deployed deletion function remain blocked. A network-restricted shell reports the live URL checks as unavailable; that is a local DNS limitation, not a project failure.
- Browser inspection covers welcome/account entry, the isolated real-component preview, and the published GitHub Pages site. An isolated local guest origin completed onboarding, earned 20 XP from a lesson, and retained its course, cleared stop, XP and gems after reload. Guest-to-account prompt and return to local study were checked without touching the user's saved progress. Course cards wrap at narrow widths, images load, and navigation/appearance controls respond.

The signed-in study flow was not repeated in this update because the app was signed out. Earlier acceptance results are not a substitute for current native testing. Xcode is not installed here (Command Line Tools only); native Apple sign-in, native glass, VoiceOver and device performance cannot be certified on this host.

## Required setup, in order

1. Complete [Apple sign-in setup](apple-sign-in.md): configure App ID capability and Supabase Apple provider, set server-only signing secrets, deploy `delete-apple-account`, and apply `supabase/migrations/202610120001_apple_account_deletion.sql`. Keep the release flag off until a signed preview passes. The live database migration and revocation have not been run in this update.
2. Link the owner's Expo project with `eas init`. `app.json` currently has a blank EAS project ID. Set the public Supabase variables in EAS preview/production; local `.env` is not a hosted build environment. Confirm `studyplat://auth/callback` and `studyplat://auth/recovery` in Supabase URL Configuration.
3. Create/confirm the App Store Connect app with bundle ID `com.aarushkik.studyplat`, owner team, signing credentials and submission identity. No build purchase, upload or submission has been initiated.
4. Install a signed iOS preview/TestFlight build and complete native acceptance below. EAS currently targets the SDK-54-compatible Xcode 26 image; verify current Apple/Expo build requirements again when submitting.
5. Complete store privacy labels, age rating, review login and real device screenshots. Verify published policies describe the actual hosting, retention and account deletion behavior. Review the question bank for academic accuracy; structural tests cannot certify course content.

The public privacy policy is **https://aarushkik.github.io/StudyPlat/privacy.html**. Enter it in App Store Connect → App Privacy, and enter the support URL **https://aarushkik.github.io/StudyPlat/support.html** in the app's store listing. Both links are already available inside the app. The generic Expo compliance scanner asks for `expo.privacyPolicyUrl`, but that is not an Expo app-config field or a substitute for App Store Connect metadata. It also misses the configured `expo-splash-screen` plugin and incorrectly claims `.env` is not ignored; verify actual configuration instead of adding obsolete or invented fields.

## Native acceptance before submission

- Small iPhone and iPad: onboarding, long text/keyboard, study notes, questions, feedback, completion, map, all tabs, companion selection, Light/Dark/System, larger text, VoiceOver, Reduce Motion/Transparency and native glass.
- Apple first/returning sign-in, Hide My Email, cancellation, wrong account, offline failure; Google/Microsoft/email and password recovery. Test on a signed build, not Expo Go.
- Complete a session, force quit/reopen, study offline, reconnect, and reconcile two devices without duplicated XP. Test account switching and old guest-data import using disposable profiles.
- Account deletion with a disposable Apple account: verify Apple authorization revocation and Supabase auth/profile/receipt deletion; cancellation/wrong Apple identity/failure preserves the account. Test plain Google/email deletion separately. Destructive live tests require explicit confirmation.
- Validate the signed archive in App Store Connect and install it through TestFlight. Confirm real screenshots and privacy manifests before submission.

## Draft store listing

Name: StudyPlat: AP Study Quests

Subtitle: Short lessons. Steady progress.

Description: Build a steady study habit with Stu, your platypus study companion. Choose an AP course, read short field notes, practise topic questions, and follow a quest map with review stops and study club checks. Track your sessions, streaks, and topic accuracy. Start without an account and save progress on your device, or sign in with Apple, Google, Microsoft or email to carry it across devices. Eight courses include Biology, Calculus AB, Chemistry, Computer Science A, English Language, Psychology, U.S. History, and World History. Questions are original practice material. StudyPlat is independent and is not affiliated with or endorsed by the College Board; AP is its registered trademark.

Primary category: Education. No subscriptions, ads, or in-app purchases are implemented. Choose the age rating by answering the current questionnaire accurately; the policy describes an intended audience of 13+ and this is not a Kids Category declaration.

App privacy draft for owner review: account name/email, account user ID, and linked study activity/progress are used for app functionality. No advertising, cross-app tracking, or third-party analytics SDK is included. Include hosting/provider collection as appropriate; confirm final data types and retention against the actual Supabase deployment before submitting labels.

Review notes draft: Guests can study with progress saved on one device; signing in syncs progress across devices. Provide a working demo account (email and password) in App Store Connect's Sign-In Information so the reviewer can sign in with email. Account deletion and guest-local erasure are available in Profile. No credentials are included here.

## Primary references

- [Apple App Review Guidelines, including 4.8 login and 5.1 privacy](https://developer.apple.com/app-store/review/guidelines/)
- [Apple submission requirements](https://developer.apple.com/app-store/submitting/)
- [Expo build infrastructure: SDK 54 Xcode 26 image](https://docs.expo.dev/build-reference/infrastructure/)
- [Expo privacy manifests](https://docs.expo.dev/guides/apple-privacy/)
- [Supabase Azure sign-in](https://supabase.com/docs/guides/auth/social-login/auth-azure)
