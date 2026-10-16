# Prochoro

A React Native / Expo AP study app with an expressive platypus, hollow ink illustrations, and a strictly monochrome interface. Light and dark appearance invert the background and artwork. Floating controls use native Liquid Glass on supported iOS versions, with blur and accessible solid fallbacks. Motion responds to taps, answers, and progress; mascots do not bob or drift.

## Run

Use Node 22.15+ (24.15.0 is used for CI and EAS), then:

```sh
npm ci
cp .env.example .env
# Add your existing Supabase URL and public client key.
npm start
```

Use `npm run web` for a browser preview. Google/Microsoft callbacks on native require the configured app scheme in a development or release build. See `npm run auth:urls` and [release readiness](docs/release-readiness.md).

## Study and account behavior

- An account is required: sign in with Google, Microsoft or email before setup; Apple on iPhone stays hidden until its provider is configured. There is no guest mode.
- Google, Microsoft, and email/password use Supabase. Apple OAuth is implemented behind `EXPO_PUBLIC_APPLE_SIGN_IN_ENABLED`; enable it only after configuring and testing the provider.
- Devices that studied as a guest in an earlier version keep that quest; the first sign-in on the device imports it into a compatible account course. If the account has a different course, its quest opens and the guest quest is not merged. Deleting the account erases it.
- Local saves are immediate. Account changes use a persistent outbox with idempotent mutation IDs and an atomic PostgreSQL merge; retries do not duplicate rewards. Returning to the foreground refreshes account progress.
- Map stops require a complete attempt with at least 60% correct. Lesson stops start with field notes. Practice, topic review, boss rematches, placement, and endless mode use the course question banks.
- There are eight courses, 120 original practice questions per course, and 180 map stops per course. Questions recur across stops. This is original practice material, not official exam content or a validated predictor of exam scores.

## Original creatures

The field guide contains twelve illustrated companion portraits and sixty individually illustrated guardians across ten families. Boss artwork appears throughout the map and encounters, with question-driven HP damage, counterattacks, a passing-score final strike and a distinct completion screen. Ten generated doodle landscapes follow the active area through the map and questions. See [creature art](docs/creature-art.md) for the art pack and behavior.

## Validation

```sh
npm run check         # TypeScript and 41 tests, including real PostgreSQL via PGlite
npm run release:check # Credentials, providers, icon, public URLs; intentionally fails on unresolved gates
npm run export:ios   # Production Hermes bundle; not a signed native archive
npm run export:web
```

`supabase/schema.sql` is rerunnable and must be applied to the target project before releasing this version. It includes profile RLS, idempotent sync, and account deletion. Never put service-role credentials in the app or EXPO_PUBLIC variables.

## Release

See [docs/release-readiness.md](docs/release-readiness.md) for verified results, remaining external setup, native acceptance checks, and draft store metadata. `eas.json` supplies preview, simulator, and production profiles using Xcode 26. The generated light/dark Prochoro app icons are in `assets/`. The internal app scheme, bundle identifier, storage keys and storage namespace retain `studyplat` for compatibility; the custom-domain web build uses `/app`.

Support/privacy/terms source lives in `site/`. The Pages workflow publishes the website and web app on pushes to main. App Store submission still requires the owner’s Apple/Supabase configuration and native acceptance testing.
