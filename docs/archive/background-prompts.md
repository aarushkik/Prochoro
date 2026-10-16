# Track background art — generation prompts

> **Status: not yet generated.** Ten backdrops, one per landscape kind.

## Why these are needed

Each track currently draws its own backdrop procedurally: a `Skyline` of
rounded blocks at 20% opacity, plus a `TrackScenery` layer of seeded arcs and
dots. It was cheap and it tiles to any height, but it is abstract shapes doing
an impression of a place — the "waves" set is three rounded rectangles, and
nothing about it says coast. Next to twenty pieces of real drawn art it reads
as placeholder, and worse, it is actively misleading: a student is told they
are at Tidepool Flats and shown a row of blue lozenges.

These ten replace that layer with real art.

---

## Format — read this before generating

Each backdrop is a **wide horizontal band** that sits behind the trail and
repeats down the length of the track. Two hard requirements:

1. **The left and right edges must be plain.** The trail runs down the middle
   and props stand in both margins, so the middle third and both outer edges
   need to stay quiet — detail belongs in the two bands between centre and
   edge. Anything busy behind the stops will fight the buttons.
2. **The top and bottom edges must tile.** The band repeats vertically down a
   track that can run 2,000pt tall. Whatever touches the top edge has to line
   up with whatever touches the bottom edge. Ask for "seamlessly tileable top
   to bottom" and check by stacking two copies.

Save as **PNG, 1024 wide × 640 tall**, into `src/assets/backdrops/` using the
filenames below. Opaque, not transparent — each carries its own sky colour.

## Master style block

Paste this **before** every subject line.

> Flat 2D cartoon game background, wide horizontal band, seamlessly tileable
> top to bottom. Simple storybook shapes with bold uniform deep-navy `#12303C`
> outlines only on the largest forms, and no outlines at all on distant
> elements. Flat colour fills in two or three tones per shape, no gradients
> except one very soft vertical wash in the sky. Layered depth: pale washed-out
> shapes far back, slightly stronger mid-ground, nothing in sharp foreground.
> Low contrast overall — this sits behind bright interface buttons and must
> never compete with them. Warm storybook palette drawn from cream `#FFFDF7`,
> parchment `#FBF1E2`, turquoise `#05B1C9`, orange `#F5A02B`, muted sage green,
> and warm wood brown. Composition: the centre third of the image and both
> outer edges are calm and near-empty; all detail sits in the two vertical
> bands between the centre and the edges. Straight-on flat view, no perspective
> vanishing point, no horizon line running through the centre. No characters,
> no creatures, no text, no watermark, no user interface, no path or road, no
> border frame.

## Negative prompt

> photorealistic, 3D render, detailed texture, noise, grain, high contrast,
> dark shadows, dramatic lighting, characters, people, animals, text, letters,
> numbers, watermark, logo, user interface, buttons, road, path, trail,
> centre-heavy composition, busy centre, vignette, border, frame

---

## The ten landscapes

| Filename | Landscape | Used by places like | Subject line |
|---|---|---|---|
| `bg-waves.png` | `waves` | Tidepool Flats, Atom Shore | A calm shallow coastline seen flat-on: pale turquoise water with three or four long soft foam lines, scattered rounded pebbles and two low sandbars in warm cream, a few sage seagrass tufts at the outer edges, sky a very pale warm cream. |
| `bg-towers.png` | `towers` | Cell City, Bond Bridge | A distant pale city of simple flat-topped and stepped towers in washed cream and soft turquoise, windows as small pale squares in even rows, a few slim aerials, all set low and small against a wide pale sky. |
| `bg-chimneys.png` | `chimneys` | Heat Foundry, Loop Foundry | A quiet industrial district: three or four tall brick chimneys in muted terracotta with pale banding, low pitched workshop roofs between them, and soft rounded cream smoke drifting sideways, sky a warm pale orange. |
| `bg-mesa.png` | `mesa` | Acid Springs, Dust Reach | A dry desert of flat-topped mesas in layered warm sand, clay and soft orange bands, two or three low rounded buttes at different distances, a scatter of small round scrub bushes in muted sage, sky pale warm cream. |
| `bg-gears.png` | `gears` | Balance Point, Engine Yard | A calm machine hall: large pale brass cogwheels partly visible behind flat panels, straight pipe runs with rounded elbows, a few small round dials, everything low-contrast in cream, muted brass and soft navy. |
| `bg-islands.png` | `islands` | Reaction Basin, Archipelago | Scattered small rounded islands on pale turquoise water, each a low cream sand mound with one or two simple sage palms, soft foam rings around their shores, sky pale warm cream. |
| `bg-ridge.png` | `ridge` | Rate Rapids, Highland Way | Layered rolling hills in three depths of muted sage and soft grey-green, a few simple conifer clusters as rounded triangles on the nearer ridge, one pale winding stream glint at an outer edge, sky pale cream. |
| `bg-reeds.png` | `reeds` | Phase Fields, Marshlight | Quiet wetland: broad pale turquoise water panes between soft sage reed beds, thin upright reed strokes in clusters at the outer thirds, two or three flat lily pads, sky pale warm cream. |
| `bg-pylons.png` | `pylons` | Free Energy Ridge, Signal Flats | An open plain with slim navy lattice pylons at three distances, drooping cable curves between them, low flat grass in muted sage, one or two small cream equipment boxes near the outer edges, wide pale sky. |
| `bg-peak.png` | `peak` | Exam Summit, Final Ascent | High alpine: layered snow-capped peaks in pale grey-blue and cream at three depths, soft snow drifts along the lower edge, two or three small dark rock outcrops at the outer thirds, sky a cool pale cream. |

---

## Notes on getting a usable result

- **Check the tile before anything else.** Stack two copies vertically. If the
  seam shows, regenerate — it will show on every long track, six times over.
- **If the centre is busy, regenerate rather than crop.** The stops run down
  the middle at 70–96pt across, and their captions are wider still. A backdrop
  with a chimney behind the current stop will look like a mistake.
- **Too pale is the right failure.** These sit under drawn props, ink-bordered
  buttons and full-colour art. If a backdrop looks slightly washed out on its
  own, it is probably correct in place; if it looks good on its own, it is
  probably too strong.
- **No path.** Generators love adding a winding road. The app draws the trail;
  a painted one underneath it will read as a double.

## After they arrive

1. Drop the PNGs into `src/assets/backdrops/`.
2. I will replace `Skyline` and `TrackScenery` with a repeating `ImageBackground`
   keyed by `SkylineKind`, keep the per-track `sky` colour as the tint behind it,
   and delete the two procedural layers.

Tell me when they land.
