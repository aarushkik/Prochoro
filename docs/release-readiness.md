# Prochoro release readiness

Updated 17 November 2026. TestFlight build 4 (version 1.0.0; Expo SDK 58, Xcode 27.1, iOS 27 SDK, minimum iOS 16.4) is valid and App Store eligible in App Store Connect, and the owner installed it on an iPhone and reported that it works well. App Store version 1.0 is in Prepare for Submission. Build 5 added the in-app College Board disclaimer. On 18 November 2026 the app was simplified (two-tap setup, one Start button, three tabs, hats instead of pets); submit a build made after that change.

Sign-in: Apple, Google, Microsoft and email are enabled in Supabase. The
`verify-email` function and its `email_verifications` migration were deployed on
17 November 2026; CORS preflight, signed-out and foreign-origin requests behave as
designed. Confirm Email is enabled. Supabase's built-in sender only delivers to
project team members (about 2 emails an hour), so configure custom SMTP before
launch or sign-up confirmations, password resets and verification codes will not
reach other people. Google audience/branding and Microsoft credentials still need
owner review. Follow [production sign-in setup](auth-production.md).

## Implemented

- Pure white/light and black/dark page backgrounds with opposite outline artwork. Floating controls and sheets use the shared Liquid Glass material, with blur/solid fallbacks. Old colored scenery, filled illustrations and sticker surfaces are retired.
- 27 platypus expressions/activities, 8 hats, 60 cute angry bosses, ten AP subject icons, ten generated area doodle backgrounds, and generated study/score/timeline/reward art. Sprite frames preserve accessories and exclude neighboring portraits. See [design refinement](design-refinement.md) and [art manifest](art-manifest.md).
- The quiz now uses a glass toolbar, question cards, inline explanations and an action dock. Boss questions deal real HP damage with hit reactions, counterattacks and a final strike after a complete passing attempt. Repeated presses are latched. Learning, pass conditions and atomic XP banking remain intact.
- Required sign-in with Apple (release flag on), Google, Microsoft and email, local offline persistence and account synchronization. Native scheme, bundle identifiers and stored progress IDs did not change. The sign-in screen and Options state that Prochoro is not affiliated with or endorsed by the College Board.
- The repository now has the custom Pages domain `prochoro.net`. Web assets export under `/app`; OAuth/recovery use actual static directories at `/app/auth/callback/` and `/app/auth/recovery/`. Policy links use the new domain. Public authentication requires HTTPS; loopback development remains supported.

- Two-tap setup, a Learn screen where any open circle (or one big Start button) starts a level, three tabs (Learn, Practice, Me), hats earned by studying in place of pets, timed one-tap boss duels with critical hits, an endless 3-card battle (the climb) in Practice, lessons that open straight on a question with short feedback, official AP-unit progress, and direct next-level/retry actions. XP is a reward total rather than a second level rank. Every official AP unit has a final boss; choice order shuffles per attempt while grading stays tied to semantic IDs.

## Verified 17 November 2026

- `npm run check`: TypeScript 6 and all 62 tests pass. Expo Doctor passes 20/20 checks.
- Production web and iOS exports succeed on Expo SDK 58 (React Native 0.88). The generated iOS project uses the UIKit scene life cycle (`SceneDelegate`), which apps built with the iOS 27 SDK need in order to launch on iOS 27.
- EAS build 4 compiled against the iPhoneOS 27.1 SDK; App Store Connect reports it valid with minimum iOS 16.4.
- `npm audit`: 43 findings before the SDK upgrade, 29 after, none critical. The remainder are transitive build-tool dependencies of Expo CLI and Metro (`picomatch` has no patched release yet); none ship in the app bundle.

## Verified 16 October 2026

- `npm run check`: TypeScript and all 47 tests pass. Checks include actual PostgreSQL migrations/RLS/synchronization/deletion, duplicate XP prevention, storage recovery, theme contrast, bounded non-overlapping boss portraits, and published callback URLs.
- Production web and iOS Hermes exports succeed. These are JavaScript/assets exports, not signed native app archives. Only three Figtree weights are bundled, alongside the current monochrome art.
- Isolated real-screen review covers setup, home, practice, progress, profile, characters, lesson sheet, quiz feedback, boss duel and results in light/dark, including 390 × 844 and 320 × 568 layouts. Long passages, Java code, tabular data, and scrolling answer/feedback controls were checked; data tables preserve columns on narrow screens. Sample progress lives in memory; account/profile synchronization is not mounted.
- A sample boss attempt finished 6/7 correct and banked one +60 XP reward. One deliberate miss and rapid double presses did not skip questions or duplicate completion. A 0/7 attempt left the boss uncleared; Benny retry and Remy review-round paths also passed browser acceptance. The current bank was additionally checked through a complete 6/7 boss win, one +60 XP bank, and a direct transition to Level 4. All four correct-answer positions appeared in the first four questions.
- Read-only Supabase health check: Auth 200, database 200, Google and Azure enabled. No users, emails, providers, credentials or remote records were changed.
- Direct browser preview checks report no runtime errors in the inspected home/profile/practice and updated quiz/battle flows. Two MutationObserver errors appeared during iframe-harness reloads; the direct preview did not reproduce them. Native and authenticated acceptance are separate checks.

## Website and redirect configuration

The custom-domain certificate is now approved. HTTPS checks return 200 for the site, app and policy pages, and HTTPS enforcement has been enabled in GitHub Pages. This deployment supplies real static callback/recovery directories, replacing their previous 404 responses. The daily health check monitors the custom domain and reports meaningful failures or recovery.

In Supabase Authentication → URL Configuration, add these exact web redirect URLs if they are not already allowed:

```text
https://prochoro.net/app/auth/callback/
https://prochoro.net/app/auth/recovery/
```

`npm run auth:urls` prints the native and local preview URLs as well. Remote URL settings were not changed in this pass.

## Release status

Done:

1. [Apple sign-in](apple-sign-in.md): App ID capability, Supabase provider, server-only signing secrets, the `delete-apple-account` function and the Apple deletion migration. The release flag is on.
2. Expo project `@realrushy/studyplat` is linked. EAS builds use the `sdk-58` image (Xcode 27.1, iOS 27 SDK; Apple requires the iOS 27 SDK for uploads from April 2027) and submit to TestFlight with an App Store Connect API key kept outside the repository.
3. App Store Connect app "Prochoro: AP Study" (`com.aarushkik.studyplat`) with version 1.0. The internal identifier is intentionally stable.
4. The owner installed TestFlight build 4 on an iPhone.
5. App Store screenshots in [app-store/screenshots](app-store/screenshots/): 6.9" iPhone (1320 × 2868) and 13" iPad landscape (2752 × 2064), rendered from real screens with sample progress. Regenerate after UI changes with `npm run preview:design`, then `npm run store:screenshots`.

Remaining before submission:

1. Custom SMTP in Supabase (see above).
2. Google Auth Platform: publish the app under Audience and complete branding. Microsoft: confirm the app accepts personal accounts and its client secret has not expired.
3. App Store Connect: attach the newest build, upload the screenshots, listing text, App Privacy, age rating, content rights, price, and a review login (a confirmed email/password account entered only in App Review Information).
4. Academic review. The ten courses have 952 distinct original items across 400 reasoning families, reused across their paths; see [question-bank scope](question-bank.md). Structural checks do not certify academic depth, exam alignment or answer accuracy.

## Native acceptance

The owner checked build 4 on an iPhone on 17 November 2026 and reported it works well; the items below have not each been certified. Check small iPhone/iPad layouts, long text/keyboard, all quiz states (including the "Why?" toggle), Play, the climb's 3-card swap, Light/Dark/System, larger text, VoiceOver, Reduce Motion/Transparency and native glass. Use disposable accounts for native Apple/Google/Microsoft/email sign-in, recovery, offline/reconnect/two-device progress, account switching and deletion/revocation tests. Destructive account deletion requires explicit authorization. Validate the signed archive and install it through TestFlight before submission.

## Draft listing

Name: Prochoro: AP Study

Subtitle: Small steps. Stronger study.

Description: Build a steady AP study habit with your platypus companion. Choose one of ten courses, read short lessons, practise topic questions and challenge cute rivals in boss duels. Track sessions, topic accuracy and progress. Earn hats for your platypus as you study. Your account saves progress across devices. Original practice material; independent of and not endorsed by the College Board. AP is its registered trademark.

Support URL: https://prochoro.net/support.html · Privacy Policy URL: https://prochoro.net/privacy.html

Category: Education. No subscriptions, ads or in-app purchases are implemented. An account is required. Supply a working demo account through App Store Connect’s review sign-in fields; never put credentials in repository documents.

Owner privacy review: name/email, user ID and linked study progress support app functionality. No third-party analytics or cross-app tracking SDK is included. Confirm final collection, retention and hosting behavior against the real deployment before submitting privacy labels.
