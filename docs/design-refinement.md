# Prochoro design refinement

Updated 16 October 2026. The current direction is a simple black-and-white study app: generous space, Figtree typography, hollow character art and glass navigation. The earlier turquoise, cream, filled landscape and sticker treatments are retired.

## Interface

- Page backgrounds, reading surfaces, selections, loading screens and dialogs invert between pure white and pure black. Neutral secondary text and translucent rims preserve hierarchy without introducing colored fills.
- Floating HUD, navigation, unit banners, encounter cards and sheets use the shared glass material. Supported iOS builds use `expo-glass-effect`; web uses a desaturated backdrop blur, a subtle reflection and a fine rim. Android and Reduce Transparency use a solid monochrome fallback.
- Buttons are clean capsules. Selection uses an outline rather than a painted card. Progress bars are slim. No idle bobbing, random decorative shapes, raised sticker lips or looping confetti remain in the active design.
- Small-phone setup headings shorten and resize without squeezing the course choices. Character crops preserve aspect ratio and exclude neighboring sprites.
- Profile appearance controls offer Light, Dark and System. Theme changes preserve screen state and study progress.

## Characters and icons

27 platypus drawings cover reading, thinking, happiness, sadness, worry, surprise, celebration, boss outcomes, streak changes and progress. Twelve named pets and sixty cute angry boss portraits use matching hollow black outlines, tinted white in dark mode. Eight courses have their own generated subject icons. Study, score, timeline and reward illustrations use generated raster art; standard interface controls remain vector outlines.

The garden and insect families were regenerated to remove opaque fills. The library, workshop and discovery families were regenerated with wider gutters and simpler details. All sixty boss portraits now use separately bounded, non-overlapping frames. Mascot, pet and utility frames also have explicit bounds. Pixel bounds were measured read-only; artwork was generated with the built-in image tool, not drawn by JavaScript or transformed with a pixel-editing script.

See [art manifest](art-manifest.md), [creature art](creature-art.md), and [latest generation prompts](prochoro-art-prompts.json). Retired prompts are retained only in `docs/archive/`.

## Area artwork and quiz

Ten new, transparent doodle landscapes give each area its own setting: tide pools, a library city, a lab outpost, a canyon, a workshop, islands, a fossil ridge, wetlands, a signal marsh and the summit. They are generated raster artwork, not assembled from runtime shapes. The map changes its background with the active area; the field guide and questions use the matching scene. Black strokes become white in dark mode. Background detail stays quieter than reading text and characters. Exact prompts and source paths are in [prochoro-area-prompts.json](prochoro-area-prompts.json).

The quiz has a compact glass course toolbar, a frosted question card, inline explanations and a glass action dock. Questions scroll independently of the battle arena. Health bars keep a fixed height in column layouts; onboarding explicitly stretches its horizontal bar.

## Boss interaction

Correct answers immediately deal visible damage to the boss. Misses trigger a counterattack and reduce player health. Each hit uses a brief horizontal attack, recoil and flash; no idle movement is added. Reduce Motion resolves without transforms. The actual recorded answers determine health and final-strike charge, including companion retries and additional review questions. Extra review questions preserve damage already dealt rather than healing either side.

Completing the full question set with at least 60% correct unlocks a final strike that removes remaining boss health. A perfect run defeats the boss on its last correct answer. Existing pass rules, rewards and atomic session banking remain intact. Inputs are latched while moves resolve. Explanations remain available before advancing.

## Local visual review

```sh
npm run web -- --port 8085
EXPO_PORT=8085 PREVIEW_PORT=8086 npm run preview:design
```

Open http://localhost:8086/ for the review menu, `/phone` for 390 × 844, or `/small-phone` for 320 × 568. This entry mounts real screens and shared components with disposable in-memory progress. It never mounts AuthProvider or ProfileSync; profile actions are inert sample callbacks. The production entry does not import the preview.

Reviewed: sign-in/email forms, setup choices, home, practice, progress, profile, companions, all ten boss families, lesson sheet, quiz feedback, boss duel and session results, with light/dark and narrow layout checks. A sample boss play-through finished 6/7 correct and banked one +60 XP reward. One deliberate miss and rapid double presses did not skip questions or duplicate XP. A 0/7 run left the boss uncleared. Benny’s retry restored player HP and recorded only the replacement answer; Remy’s extra review question preserved boss damage and completed an honest 7/8 attempt. Native glass, Apple sign-in, VoiceOver and device performance still require a signed iOS build.

Screenshots in `docs/design-previews/` are local design-review evidence, not App Store screenshots.
