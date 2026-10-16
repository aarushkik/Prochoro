# Prochoro

A React Native / Expo AP study app featuring Stu, a turquoise platypus, and an illustrated quest map. The visual theme uses turquoise, cream, dark outlines, Baloo 2 headings, and Figtree body text. Motion responds to taps, answers, and progress; mascots do not bob or drift.

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

- An account is required: sign in with Apple (iPhone), Google, Microsoft or email before setup. There is no guest mode.
- Google, Microsoft, and email/password use Supabase. Apple OAuth is implemented behind `EXPO_PUBLIC_APPLE_SIGN_IN_ENABLED`; enable it only after configuring and testing the provider.
- Devices that studied as a guest in an earlier version keep that quest; the first sign-in on the device imports it into a compatible account course. If the account has a different course, its quest opens and the guest quest is not merged. Deleting the account erases it.
- Local saves are immediate. Account changes use a persistent outbox with idempotent mutation IDs and an atomic PostgreSQL merge; retries do not duplicate rewards. Returning to the foreground refreshes account progress.
- Map stops require a complete attempt with at least 60% correct. Lesson stops start with field notes. Practice, topic review, boss rematches, placement, and endless mode use the course question banks.
- There are eight courses, 120 original practice questions per course, and 180 map stops per course. Questions recur across stops. This is original practice material, not official exam content or a validated predictor of exam scores.

## Original creatures

The field guide contains twelve illustrated companion portraits and sixty individually illustrated guardians across ten families. Boss artwork appears throughout the map and encounters, with a passing-target seal counter and a distinct completion screen. See [creature art](docs/creature-art.md) for the art pack and behavior.

## Validation

```sh
npm run check         # TypeScript and 22 tests, including real PostgreSQL via PGlite
npm run release:check # Credentials, providers, icon, public URLs; intentionally fails on unresolved gates
npm run export:ios   # Production Hermes bundle; not a signed native archive
npm run export:web
```

`supabase/schema.sql` is rerunnable and must be applied to the target project before releasing this version. It includes profile RLS, idempotent sync, and account deletion. Never put service-role credentials in the app or EXPO_PUBLIC variables.

## Release

See [docs/release-readiness.md](docs/release-readiness.md) for verified results, remaining external setup, native acceptance checks, and draft store metadata. `eas.json` supplies preview, simulator, and production profiles using Xcode 26. The user-supplied icon is `assets/studyplat-icon.png`, normalized to 1024 × 1024 without changing its design.

Support/privacy/terms source lives in `site/`. A manual GitHub Pages workflow is prepared; publication and store submission have not been performed.
