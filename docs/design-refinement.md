# StudyPlat design refinement

12 October 2026. The visual direction is a glass field journal: Stu's navy outlines, turquoise, cream and warm gold remain the identity. Floating navigation and sheets use glass; reading cards stay quiet and high-contrast. Native Liquid Glass is used when available, with existing blur/solid accessibility fallbacks.

## Artwork

23 original generated assets, bundled for offline rendering:

- A welcome camp illustration featuring Stu.
- Ten distinct learning landscapes, replacing the procedural skyline and scattered SVG motifs.
- Eight subject illustrations for course selection, placement summaries and the home header.
- Four illustrated placement badges, replacing the earlier assembled vector drawings.

Files: `src/assets/illustrations/{scenes,landscapes,courses,badges}`. Reference: `src/assets/mascot/platypus-wave.png`. Full prompts, original source paths and final asset paths: [design-art-prompts.json](design-art-prompts.json). Images were generated using the built-in image tool, then proportionally resized for app packaging. Original generated files were retained. Landscapes/camp are 960px wide; small icons are 256px. Existing generated bosses and companions are retained and fit the same visual language. Functional navigation, checkmarks, provider logos, and progress indicators remain crisp vector controls.

## Interaction and layout

- Course art has no extra tile behind it; text and illustration form one accessible selection target.
- Region plaques show landscape thumbnails, track numbers and status. Region names can wrap on narrow screens.
- Shared light cards have denser white surfaces so the artwork doesn't compete with text.
- The glass tab indicator stretches only slightly when changing tabs; no ambient bobbing was added.
- Celebration confetti plays once rather than looping indefinitely.
- Backdrops use a quiet illustration rather than repeated generated contour lines.

## Visual QA

Run Expo with `npm run web -- --port 8082`, then `npm run preview:design`. The isolated preview is at **http://localhost:8085/**. It uses the real shared components with sample data, has no account/profile providers, and uses a separate origin from the app. Its tabs expose map, courses, study-club portraits and companions/appearance controls. It is not imported by the production entry point.

The preview is a component/layout inspection tool, not an authenticated end-to-end acceptance test. Signing into the real app is still needed for the full study flow. Screenshots are not App Store listing screenshots.
