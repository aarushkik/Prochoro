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
- Setup is two taps: choose a course, then start at Unit 1 or take a short placement quiz. Home opens on Learn, where one big Start button (or a tap on the flagged level) begins the next lesson. Completing a full attempt with at least 60% correct opens the next level. Lessons open straight on the first question. A right answer shows a short "Correct!" with the reason one tap away; a miss shows the answer and why. Results offer the next level or a retry.
- Tap any open circle on the path to play it; the Start button continues where you are up to. Boss levels are timed duels: each question has a clock sized to its reading length (doubled for screen readers, paused in the background), one tap answers, a fast right answer is a critical hit, and an empty clock counts as a miss. Passing still needs 60% of the full set.
- Three tabs: Learn (the path), Practice (one quick set picked for you, the endless climb, or any topic) and Me. The endless climb is a card battle (`src/utils/climb.ts`, pure and seeded). You hold three cards. Every new card costs one question (right: choose from three; wrong: one is dealt to you), and once your hand is full it swaps out a card you hold. Rests are one question too. Cards have Recall, Logic and Insight stats (0–20). Climb six-floor towers choosing battles, elites, rests, shops and mystery rooms, with a boss on floor 6 and an endless supply of harder towers. Battles have no questions: each round you pick a stat while the rival's card is face down. The higher number wins, and the damage is the gap plus 4, multiplied by the winner's streak (a rival's is capped at ×3); rivals hit harder in each later tower. Health carries between battles; coins buy cards, charms and healing. Balance was tuned by simulation to about five rounds a battle in the first tower. Runs count as practice, and the best height per course is kept on the device. Me shows the student's platypus, three totals and eight hats earned by studying (lessons, perfect lessons, streaks, units, bosses); one tap puts a hat on, and the platypus wears it everywhere. Hats change nothing about scoring, and there is nothing to buy.
- There are ten courses, 952 distinct original practice items across 400 reasoning families, and 180 saved levels per course. Each official AP unit has a designated final boss. Questions recur across levels, with answer order shuffled per attempt. This is original practice, not official exam content or a validated predictor of exam scores. See [question-bank scope and sources](docs/question-bank.md).

## Original creatures

Sixty individually illustrated boss guardians across ten families stand at the end of each stretch of the path. Boss artwork appears throughout the map and encounters, with question-driven HP damage, counterattacks, a passing-score final strike and a distinct completion screen. Ten generated doodle landscapes follow the active area through the map and questions. See [creature art](docs/creature-art.md) for the art pack and behavior.

## Validation

```sh
npm run check         # TypeScript and 47 tests, including real PostgreSQL via PGlite
npm run release:check # Credentials, providers, icon, public URLs; intentionally fails on unresolved gates
npm run export:ios   # Production Hermes bundle; not a signed native archive
npm run export:web
```

`supabase/schema.sql` is rerunnable and must be applied to the target project before releasing this version. It includes profile RLS, idempotent sync, and account deletion. Never put service-role credentials in the app or EXPO_PUBLIC variables.

## Release

See [docs/release-readiness.md](docs/release-readiness.md) for verified results, remaining external setup, native acceptance checks, and draft store metadata. `eas.json` supplies preview, simulator, and production profiles on the Expo SDK 58 image (Xcode 27, iOS 27 SDK, minimum iOS 16.4). The generated light/dark Prochoro app icons are in `assets/`. The internal app scheme, bundle identifier, storage keys and storage namespace retain `studyplat` for compatibility; the custom-domain web build uses `/app`.

Support/privacy/terms source lives in `site/`. The Pages workflow publishes the website and web app on pushes to main. App Store submission still requires the owner’s Apple/Supabase configuration and native acceptance testing.
