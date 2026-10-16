# Prochoro release readiness

Updated 16 October 2026. The monochrome design overhaul is implemented. App Store submission is still blocked by owner configuration and native acceptance; the owner has asked to finish the design before iOS setup.

## Implemented

- Pure white/light and black/dark page backgrounds with opposite outline artwork. Floating controls and sheets use the shared Liquid Glass material, with blur/solid fallbacks. Old colored scenery, filled illustrations and sticker surfaces are retired.
- 27 platypus expressions/activities, 12 pets, 60 cute angry bosses, eight AP subject icons, ten generated area doodle backgrounds, and generated study/score/timeline/reward art. Sprite frames preserve accessories and exclude neighboring portraits. See [design refinement](design-refinement.md) and [art manifest](art-manifest.md).
- The quiz now uses a glass toolbar, question cards, inline explanations and an action dock. Boss questions deal real HP damage with hit reactions, counterattacks and a final strike after a complete passing attempt. Repeated presses are latched. Learning, pass conditions and atomic XP banking remain intact.
- Required sign-in, Google/Microsoft/email, native Apple implementation behind its existing disabled release flag, local offline persistence and account synchronization remain. Native scheme, bundle identifiers and stored progress IDs did not change.
- The repository now has the custom Pages domain `prochoro.net`. Web assets export under `/app`; OAuth/recovery use actual static directories at `/app/auth/callback/` and `/app/auth/recovery/`. Policy links use the new domain. Public authentication requires HTTPS; loopback development remains supported.

## Verified in this pass

- `npm run check`: TypeScript and all 41 tests pass. Checks include actual PostgreSQL migrations/RLS/synchronization/deletion, duplicate XP prevention, storage recovery, theme contrast, bounded non-overlapping boss portraits, and published callback URLs.
- Production web and iOS Hermes exports succeed. These are JavaScript/assets exports, not signed native app archives. Web bundle is about 1.73 MB; iOS Hermes about 3.76 MB. Only three Figtree weights are bundled, alongside the current monochrome art.
- Isolated real-screen review covers setup, home, practice, progress, profile, characters, lesson sheet, quiz feedback, boss duel and results in light/dark, including 390 × 844 and 320 × 568 layouts. Sample progress lives in memory; account/profile synchronization is not mounted.
- A sample boss attempt finished 6/7 correct and banked one +60 XP reward. One deliberate miss and rapid double presses did not skip questions or duplicate completion. A 0/7 attempt left the boss uncleared; Benny retry and Remy review-round paths also passed browser acceptance.
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

## iOS setup deferred by owner

1. Complete [Apple sign-in setup](apple-sign-in.md): App ID capability, Supabase provider, server-only signing secrets, deployed `delete-apple-account` function and the Apple deletion migration. Keep the release flag disabled until a signed preview succeeds.
2. Link the owner’s Expo project (`eas init`); `app.json` still has no EAS project ID. Configure the existing public Supabase values in the hosted build environment. Keep private signing secrets server-side.
3. Confirm App Store Connect app identity and signing for `com.aarushkik.studyplat`. The display name is Prochoro; the existing internal identifier is intentionally stable.
4. Install a signed preview/TestFlight build and complete native acceptance. This host has Command Line Tools, not a full Xcode installation. Native Apple sign-in, native glass, VoiceOver and device performance have not been certified here.
5. Complete privacy labels, age rating, review login, academic review and real device screenshots. The current eight courses have 120 original practice questions each, reused across their paths. Structural checks do not certify academic depth, exam alignment or answer accuracy.

## Native acceptance

Check small iPhone/iPad layouts, long text/keyboard, study notes, all quiz states, map, pets, Light/Dark/System, larger text, VoiceOver, Reduce Motion/Transparency and native glass. Use disposable accounts for native Apple/Google/Microsoft/email sign-in, recovery, offline/reconnect/two-device progress, account switching and deletion/revocation tests. Destructive account deletion requires explicit authorization. Validate the signed archive and install it through TestFlight before submission.

## Draft listing

Name: Prochoro: AP Study

Subtitle: Small steps. Stronger study.

Description: Build a steady AP study habit with your platypus companion. Choose one of eight courses, read short lessons, practise topic questions and challenge cute rivals in boss duels. Track sessions, topic accuracy and progress. Choose a study pet with a helpful ability. Your account saves progress across devices. Original practice material; independent of and not endorsed by the College Board. AP is its registered trademark.

Category: Education. No subscriptions, ads or in-app purchases are implemented. An account is required. Supply a working demo account through App Store Connect’s review sign-in fields; never put credentials in repository documents.

Owner privacy review: name/email, user ID and linked study progress support app functionality. No third-party analytics or cross-app tracking SDK is included. Confirm final collection, retention and hosting behavior against the real deployment before submitting privacy labels.
