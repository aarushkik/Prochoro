# Prochoro art manifest

Updated 16 October 2026. All active character and study artwork is generated raster line art with transparent interiors. The app renders black ink on white and white ink on black. No runtime generation service is needed.

| Set | Drawings | Current assets |
|---|---:|---|
| Platypus expressions and activities | 27 | `src/assets/mascot/prochoro/{expressions,activities,moments}.png` |
| Brand marks | Light/dark | `src/assets/mascot/prochoro/{mark,mark-dark}.png` |
| Boss rivals | 60 across ten families | `src/assets/characters/prochoro/bosses/` |
| Study pets | 12 | `src/assets/characters/prochoro/companions.png` |
| AP subject icons | 8 | `src/assets/characters/prochoro/courses.png` |
| Study and placement icons | 8 | `src/assets/characters/prochoro/activities.png` |
| Score, timeline and reward icons | 12 | `src/assets/characters/prochoro/utilities.png` |
| Area doodle landscapes | 10 | `src/assets/areas/prochoro/` |
| App icons | Light/dark, 1024 px | `assets/prochoro-icon{,-dark}.png` |

`bossFrames.json`, `mascotFrames.json`, `companionFrames.json` and `utilityFrames.json` in `src/data/` contain measured portrait bounds. Rendering clips the source sheet, preserves aspect ratio, and applies the current theme ink. The artwork itself is not procedurally constructed.

The latest five boss revisions were made with the built-in image-generation tool. Their exact prompts, saved project paths and original output paths are in [prochoro-art-prompts.json](prochoro-art-prompts.json). The ten new area wallpapers were also created with the built-in tool; [prochoro-area-prompts.json](prochoro-area-prompts.json) records their exact prompts and output paths. Original generated outputs remain in the local Codex generated-images directory. Earlier colored assets and unused scenery have been removed from the active app and website; their historical prompts are in `docs/archive/` and the files remain recoverable in Git.

The app icon and splash now have explicit light/dark variants. Technical icon resizing used the platform image utility; it did not redraw or recolor the artwork.
