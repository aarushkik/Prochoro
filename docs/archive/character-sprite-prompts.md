# Character & boss sprites — generation prompts

> **Status: none generated yet.** `src/assets/characters/` is empty.

Eighteen sprites: **twelve companions** for the Characters screen and the
Profile preview, and **six bosses**, one per boss rank.

**Generate the six bosses first.** The companions have a stand-in that works —
each one carries a prop sprite chosen for its ability, and the roster reads
well as it is. The bosses have nothing: sixty fights across a course are
currently a rounded square with a rotated pip in it, and the gate boss card at
the foot of every track is the largest thing on the screen with no art in it at
all. Six sprites cover all sixty, because bosses are ranked rather than
place-specific.

Save as transparent PNG into `src/assets/characters/` with the exact filenames
below. Square, 1024×1024. They get trimmed, bottom-aligned and downscaled to
512 on the way in, the same pipeline the props use.

---

## Master style block

Paste this **before** every subject line. It is what keeps eighteen separately
generated characters looking like one cast — and like they belong beside the
platypus.

> Flat 2D cartoon character sprite, a single character centred on a fully
> transparent background. Bold uniform outline in deep navy `#12303C` at
> roughly 5% of the image width, with rounded corners and rounded line ends.
> Flat colour fills with exactly two extra tones per colour — one soft shade on
> the lower right, one pale highlight on the upper left — and no gradients
> across the whole character. Friendly, chunky, toy-like proportions: large
> head, small body, big simple eyes, short limbs. Standing upright, facing
> forward, full body visible including feet. Light source top-left. Crisp
> vector edges, no texture, no noise. Square 1024×1024; the character fills
> about 80% of the frame with even margins. No background, no ground plane, no
> cast shadow, no text, no watermark, no border, no second character.

## Negative prompt

> photorealistic, 3D render, anime, thin outlines, sketchy or uneven linework,
> drop shadow, background scenery, sky, grass, text, letters, numbers,
> watermark, logo, multiple characters, cropped or cut off at the frame edge,
> white background, grey background, checkerboard background, scary, gore,
> weapons pointed at the viewer

---

## Companions — twelve

Each one's dominant colour is fixed: it already tints that companion's tile in
the app, and a sprite that fights its tile will look wrong in the grid.

| Filename | Colour | Subject line |
|---|---|---|
| `char-mira.png` | turquoise `#05B1C9` | A small round owl with turquoise feathers, oversized amber eyes and a tiny cream lantern held in one wing, wings tucked in, standing on two small orange feet. |
| `char-ember.png` | orange `#F5A02B` | A plump orange salamander standing upright, a warm flame-shaped crest along its back, holding a small round cream shield with an orange rim. |
| `char-pilot.png` | green `#3E9E63` | A cheerful sage-green magpie standing upright, a small turquoise gem clutched to its chest, a cream flight cap with goggles pushed up on its head. |
| `char-quill.png` | violet `#6B4AA0` | A round violet hedgehog standing upright, blunt rounded quills, holding a single cream feather quill pen like a staff. |
| `char-cobalt.png` | deep blue `#3F63B5` | A small blue fox standing upright with a frost-tipped tail and pale ice-blue crystals along its shoulders, breath visible as a soft cream puff. |
| `char-marrow.png` | warm grey-brown `#8A7A4E` | A stout badger standing upright in a cream stonemason's apron, holding a small brass key with an oversized round bow. |
| `char-tessel.png` | teal `#2E9C86` | A small teal turtle standing upright, its shell drawn as neat repeating hexagon tiles in two teal tones, one flipper raised in a wave. |
| `char-nix.png` | ink `#12303C` | A sleek dark navy cat standing upright with bright turquoise eyes and a single cream sock on one front paw, tail curled beside it. |
| `char-fen.png` | sage green `#5E8C61` | A round sage-green frog standing upright wearing a small cream rain hood, one lily pad held like an umbrella above its head. |
| `char-slate.png` | stone grey `#7C8B93` | A small friendly stone golem standing upright, body built from three smooth rounded grey boulders, glowing turquoise cracks between them. |
| `char-vesper.png` | magenta `#B04A87` | A tiny magenta bat standing upright on small feet, wings folded like a cloak, one small gold star clasp at its throat. |
| `char-orrin.png` | ember red `#D9552F` | A sturdy young ram standing upright with short curled cream horns, a rust-red woollen scarf, front hooves planted confidently. |

## Bosses — six ranks

These are **rank-based, not place-based**: the same six appear across all ten
tracks of every course, with the track's own colour behind them. So they need
to escalate clearly against each other — a student should be able to tell rank
six from rank one at a glance and at thumbnail size.

Keep them **imposing but not frightening**. This is a study app used by
teenagers; the target is "a boss in a friendly platformer", not horror.

They are deliberately one family in one colour. Ten tracks each supply their
own background tone, so a boss that brought its own palette would clash with
six of them; holding the cast to violet-and-cream lets the *place* do the
colouring. Escalation is carried by size, stance and how much of the frame the
silhouette fills — which is also what survives at thumbnail size.

| Filename | Rank | Subject line |
|---|---|---|
| `boss-1-sentry.png` | 1 · Sentry | A small rounded guardian creature in pale violet stone, one large single turquoise eye, short stubby arms, standing alert. Simplest and smallest of the set. |
| `boss-2-warden.png` | 2 · Warden | A stocky violet guardian in a heavy cream collar, two glowing turquoise eyes, holding a short blunt staff with a round head, slightly larger and broader than the Sentry. |
| `boss-3-enforcer.png` | 3 · Enforcer | A broad armoured guardian in deep violet plate with cream trim, thick rounded shoulder pauldrons, arms crossed, a band of three turquoise lights across the chest. |
| `boss-4-champion.png` | 4 · Champion | A tall violet armoured figure with a rounded cream chest plate, a short cape in ember red, one fist raised, a single turquoise gem set in the brow. |
| `boss-5-vanguard.png` | 5 · Vanguard | An imposing violet guardian with two broad angular cream wings folded behind it, glowing turquoise seams down the arms, standing wide and squared. |
| `boss-6-overlord.png` | 6 · Overlord | The largest of the set: a towering deep violet guardian with a heavy crown of five blunt cream spikes, a wide ember-red mantle, four glowing turquoise eyes in a row, arms spread. |

---

## Where each is used

- **Companions** — the Characters grid (44pt tile, so they must read tiny) and
  the three-card preview on Profile.
- **Bosses** — the gate boss card at the foot of every open track, the crest on
  the stop sheet when a boss is tapped, and the boss stop nodes on the trail.

## Notes on getting a usable result

- **Do two first** — one companion and one boss — and check them together
  before generating the rest. Outline weight and eye size are what make a cast
  cohere, and both are far cheaper to fix in the style block once.
- **Reject cast shadows.** These sit on ground that changes colour per track;
  a baked grey shadow shows as a dirty smear.
- **Reject anything cropped at the frame edge.** The import pipeline trims to
  the object's own bounds and assumes nothing is clipped.
- **Check them at 44px.** A companion that only works large is no use in the
  roster grid. If the silhouette is unreadable when small, simplify it rather
  than shrinking the details.
