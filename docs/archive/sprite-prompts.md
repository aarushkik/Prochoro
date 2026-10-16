# Track prop sprites — generation prompts

> **Status: the first twenty are delivered and in use.** The PNGs live in
> `src/assets/props/`, registered in `PROP_ART` in `src/data/props.ts`. Keep
> this file as the spec — anything added later has to match the style block
> below or it will not sit with the rest of the set.
>
> **Wave two is specified below and not yet generated.** Twenty props across
> ten tracks means the same bench turns up three or four times in a single
> course, which is exactly what makes a long map feel thin. See
> [Wave two](#wave-two--not-yet-generated).

Twenty props that stand beside the path at full colour, roughly 80pt tall on
screen. Ten are **universal** and appear in every track; ten are **signature**
props, one per landscape kind, so each place owns an object nobody else has.

Save as transparent PNG into `src/assets/props/` using the exact filenames
below. Square, 1024×1024. They get downscaled to 512 on the way in, same as the
mascot set.

---

## Master style block

Paste this **before** every subject line. It is what keeps twenty separately
generated objects looking like one set.

> Flat 2D cartoon game asset, a single object centred on a fully transparent
> background. Bold uniform outline in deep navy `#12303C` at roughly 6% of the
> image width, with rounded corners and rounded line ends. Flat colour fills
> with exactly two extra tones per colour — one soft shade on the lower right,
> one pale highlight on the upper left — and no gradients across the whole
> object. Friendly, chunky, toy-like proportions: slightly oversized top,
> sturdy base. Light source top-left. Warm storybook palette drawn from cream
> `#FFFDF7`, parchment `#FBF1E2`, turquoise `#05B1C9`, orange `#F5A02B`, muted
> sage green, and warm wood brown. Crisp vector edges, no texture, no noise.
> Square 1024×1024; the object fills about 80% of the frame with even margins
> on all sides. Straight-on view at eye level with a very slight three-quarter
> turn. No background, no ground plane, no cast shadow, no text, no watermark,
> no border, no second object.

## Negative prompt

> photorealistic, 3D render, thin outlines, sketchy or uneven linework, drop
> shadow, background scenery, sky, grass, text, letters, numbers, watermark,
> logo, multiple objects, cropped or cut off at the frame edge, white
> background, grey background, checkerboard background, drop shadow under
> object

---

## Universal props — every track

| Filename | Subject line |
|---|---|
| `prop-signpost.png` | A wooden trail signpost: one thick weathered post with two arrow-shaped boards pointing opposite ways, warm brown wood with visible plank seams, a small turquoise pennant tied at the top. |
| `prop-campfire.png` | A small campfire: three crossed logs in warm brown with pale cut ends, a rounded orange-and-yellow flame above them, and three grey stones ringing the base. |
| `prop-tent.png` | A simple ridge tent: cream canvas with a turquoise trim stripe along the hem, a triangular open flap showing a dark interior, two taut guy ropes and small pegs. |
| `prop-chest.png` | A treasure chest with a closed, slightly domed lid: warm brown wood, three orange metal bands, and a round gold clasp at the front. |
| `prop-milestone.png` | A carved stone waymarker: a rounded upright grey slab leaning slightly, a simple engraved turquoise arrow on its face, and a tuft of sage grass at its foot. |
| `prop-lantern.png` | A hanging lantern on a short curved iron post: a six-sided glass lamp glowing warm orange, dark navy metal frame, weighted round base. |
| `prop-bookstack.png` | A stack of four hardback books sitting slightly askew, spines facing out in turquoise, orange, sage and cream, with a thin brass bookmark ribbon trailing from the top one. |
| `prop-bench.png` | A wooden park bench at a slight three-quarter angle: warm brown horizontal slats, dark navy cast-iron legs and armrests. |
| `prop-banner.png` | A tall banner: a slim wooden pole flying a long turquoise pennant that ripples along its length, with a small orange finial ball at the top. |
| `prop-backpack.png` | An adventurer's backpack resting upright on the ground: sage green canvas, orange straps and buckles, a rolled cream bedroll strapped across the top. |

## Signature props — one per landscape

| Filename | Landscape | Subject line |
|---|---|---|
| `prop-lighthouse.png` | waves | A short stout lighthouse: cream tower with two wide red-orange bands, a turquoise glass lamp room at the top, a small dark gallery rail beneath it. |
| `prop-watertower.png` | towers | A city water tower: a rounded turquoise tank standing on four splayed dark navy legs, with a slim ladder running up one side. |
| `prop-forge.png` | chimneys | A small brick forge: warm terracotta brick body, a rounded arched opening glowing orange from within, and one short chimney with a curl of pale smoke. |
| `prop-desertrock.png` | mesa | A desert cluster: one tall sandy-tan rock spire with flat layered bands, and a small round barrel cactus in sage green at its base. |
| `prop-cogpillar.png` | gears | A clockwork pillar: a pale stone column with three interlocking brass cogs mounted on its face — one large, two small — and a little turquoise pressure gauge. |
| `prop-stilthut.png` | islands | A small island hut raised on four wooden stilts: a rounded straw-thatch roof in warm gold, cream walls, a tiny ladder, one turquoise shutter. |
| `prop-cabin.png` | ridge | A log cabin: stacked warm-brown logs, a steep sage-green roof, one small square window glowing warm orange, and a short stone chimney. |
| `prop-duckboard.png` | reeds | A short wooden boardwalk over water: three weathered planks on posts, two tall cattail reeds standing beside it, and one round lily pad. |
| `prop-radiopylon.png` | pylons | A slim lattice radio pylon: dark navy criss-cross steel frame narrowing toward the top, two horizontal crossarms, and a small orange beacon light at the tip. |
| `prop-cairn.png` | peak | A summit cairn: five smooth grey stones stacked largest to smallest and tilting slightly, a small orange triangular flag on a stick wedged into the top, and a cap of snow. |

---

## Notes on getting a usable result

- **Transparency is the one thing to check.** If the generator returns a white
  or checkerboard background rather than real alpha, that is fine — the mascot
  set was cleaned with a flood-fill from the corners, which preserves interior
  cream, and the same pass works here. Colour-keying does not: it eats the
  cream highlights inside the object.
- **Reject anything with a cast shadow.** Props are placed on coloured ground
  that changes per track, and a baked grey shadow will show as a dirty smear on
  every one of them.
- **Reject anything cropped at the frame edge.** Placement assumes the whole
  object is inside the canvas with margin; a clipped sprite reads as a bug.
- **Outline weight is what carries the set.** If one prop comes back with a
  noticeably thinner outline than the others it will look borrowed from another
  game, even when the colours match. Regenerate rather than keep it.

---

# Wave two — not yet generated

Twenty props across ten tracks means the same bench turns up three or four
times in one course. This wave roughly triples the pool: **twenty-four more
universal props**, and **two more signature props per landscape** so each place
owns three objects nobody else has instead of one.

Same master style block, same negative prompt, same filenames convention. Drop
them into `src/assets/props/` and add one `require` line each to `PROP_ART` in
`src/data/props.ts` — the placement layer picks up anything present and skips
anything absent, so a partial delivery is safe to ship.

## Universal props, wave two

| Filename | Subject line |
|---|---|
| `prop-well.png` | A round stone wishing well: pale grey stacked stones, a small pitched wooden roof on two posts, a rope wound round a wooden crank, and a bucket hanging in the opening. |
| `prop-mailbox.png` | A rural mailbox on a wooden post: rounded turquoise metal box with a small orange flag raised on its side, one envelope corner peeking from the slot. |
| `prop-crates.png` | Three wooden shipping crates stacked two-and-one: warm brown planks with pale nail heads, dark navy metal corner brackets, one lid slightly ajar. |
| `prop-barrel.png` | A single upright wooden barrel with orange metal hoops, a pale cream cloth draped over the rim, and one small green apple resting on top. |
| `prop-lamppost.png` | A tall slim cast-iron lamppost in dark navy: a fluted post, a scrolled bracket arm, and one glowing warm-orange lantern head with a small finial. |
| `prop-wheelbarrow.png` | A wooden wheelbarrow tipped at a slight angle: warm brown tray, dark navy single wheel and handles, a small mound of sage-green leaves inside. |
| `prop-mushrooms.png` | A cluster of three storybook mushrooms of different heights: cream stalks, rounded caps in orange with pale cream spots, sage grass tufts at the base. |
| `prop-boulder.png` | A single rounded grey boulder with two flat facets catching light, a pale moss patch on its shoulder and a thin crack down one side. |
| `prop-stump.png` | A wide cut tree stump: warm brown bark, pale cream rings on the flat top, one small sage sprout growing from a crack in the side. |
| `prop-hammock.png` | A slung hammock between two short posts: cream woven fabric with a turquoise stripe, gently curved, dark navy posts with rounded tops. |
| `prop-toolrack.png` | A leaning wooden tool rack holding a shovel and a rake: warm brown handles, dark navy metal heads, resting against a short plank frame. |
| `prop-scarecrow.png` | A friendly scarecrow on a cross-post: cream sackcloth head with two simple navy dot eyes and a stitched smile, an orange patched shirt, straw cuffs. |
| `prop-birdhouse.png` | A birdhouse on a slim post: cream body, orange pitched roof, a round dark entry hole, and a tiny turquoise bird perched on the landing peg. |
| `prop-anvil.png` | A blacksmith's anvil on a low wooden block: dark navy iron with a pale highlight along the top face, one orange spark curling from the horn. |
| `prop-cart.png` | A small two-wheeled handcart: warm brown planked bed, dark navy spoked wheels, two long handles resting on the ground, a folded cream tarp inside. |
| `prop-fountain.png` | A small tiered stone fountain: two round pale-grey basins, a soft turquoise arc of water rising from the centre, a scatter of pebbles at the base. |
| `prop-obelisk.png` | A slim four-sided stone obelisk tapering to a point: pale grey with a carved turquoise spiral near the top and a stepped square plinth. |
| `prop-tackleboard.png` | A weathered notice board on two posts: warm brown frame, cream backing, three small pinned notes in turquoise, orange and cream, one corner curling. |
| `prop-lanternstack.png` | Three paper lanterns of different sizes resting on the ground, leaning together: warm orange, cream and turquoise, each with a small dark navy cap and base. |
| `prop-teapot.png` | An oversized round camp kettle on a low iron stand: dark navy metal body with a cream painted band, a curved spout, a small curl of steam. |
| `prop-crystal.png` | A cluster of three upright crystals of different heights growing from a rocky base: translucent turquoise with pale cream inner highlights, dark navy outline. |
| `prop-flagstones.png` | Four irregular flat stepping stones laid in a short curve: pale grey with sage moss in the joints, seen from a low three-quarter angle. |
| `prop-sundial.png` | A stone sundial: a round pale-grey dial plate on a short fluted pedestal, an orange triangular gnomon standing on the face, simple engraved marks. |
| `prop-satchel.png` | An open leather satchel resting upright on the ground: warm brown with a turquoise buckle strap, a rolled map and a quill poking out of the flap. |

## Signature props, wave two and three

Two more per landscape. The existing signature prop for each is listed first
for reference — match its material and mood, don't repeat its silhouette.

| Landscape | Already have | New filename | Subject line |
|---|---|---|---|
| `waves` | lighthouse | `prop-buoy.png` | A moored channel buoy tilting on its base: orange upper hull, cream lower band, a dark navy lantern cage on top, one loop of rope at the waterline ring. |
| `waves` | lighthouse | `prop-dinghy.png` | A small wooden rowing dinghy resting on its side: warm brown hull with a turquoise gunwale stripe, two oars crossed against it. |
| `towers` | watertower | `prop-clocktower.png` | A short square clock tower stump: cream stucco walls, a dark navy pitched cap, one round clock face with orange hands, a small arched window below. |
| `towers` | watertower | `prop-turnstile.png` | A city turnstile post in dark navy metal with three rotating arms, a small turquoise indicator light on the housing, set on a pale stone pad. |
| `chimneys` | forge | `prop-bellows.png` | A large blacksmith's bellows on a low stand: warm brown wooden paddles, cream leather pleats, dark navy nozzle and handles. |
| `chimneys` | forge | `prop-smokestack.png` | A short brick smokestack stub: warm terracotta brick courses, a dark navy iron collar near the top, one soft cream puff of smoke leaving the mouth. |
| `mesa` | desertrock | `prop-cactus.png` | A tall storybook saguaro cactus with two raised arms: sage green with pale ribbing lines, three small orange blossoms at the crown, sandy pebbles at the base. |
| `mesa` | desertrock | `prop-skullpost.png` | A weathered wooden post in dry sand with a pale cream animal skull mounted on it and a faded turquoise rag knotted below. |
| `gears` | cogpillar | `prop-pistonbank.png` | Three upright brass pistons of stepped heights on a dark navy base plate: warm gold cylinders, cream rods, a small orange pressure dial on the front. |
| `gears` | cogpillar | `prop-gearpile.png` | Four loose cogwheels of different sizes leaning against each other on the ground: warm brass and dark navy, one resting flat beneath the others. |
| `islands` | stilthut | `prop-outrigger.png` | A small outrigger canoe pulled up on sand: warm brown hull, a turquoise painted stripe, a slim side float on two curved cross-poles. |
| `islands` | stilthut | `prop-palmpair.png` | Two leaning coconut palms of different heights sharing one sandy mound: warm brown ringed trunks, sage-green fronds, two brown coconuts. |
| `ridge` | cabin | `prop-woodpile.png` | A stacked woodpile under a short shingle lean-to: cream log ends facing out, warm brown bark, a dark navy axe leaning against the frame. |
| `ridge` | cabin | `prop-ropebridge.png` | A short section of rope-and-plank bridge anchored to one post: warm brown planks, cream rope rails, the far end trailing off past the frame edge. |
| `reeds` | duckboard | `prop-punt.png` | A flat-bottomed punt moored among reeds: warm brown boards, a long pole resting along the gunwale, two sage reed clumps at the bow. |
| `reeds` | duckboard | `prop-heronperch.png` | A leaning mooring post in shallow water with a small turquoise-and-cream wading bird standing on top, one leg raised, sage reeds at the base. |
| `pylons` | radiopylon | `prop-dishmast.png` | A short mast carrying one cream parabolic dish angled upward: dark navy lattice, an orange cable loop coiled at the foot, a small guy wire each side. |
| `pylons` | radiopylon | `prop-generator.png` | A boxy field generator on skids: cream housing with a turquoise access panel, dark navy vents, a small orange warning triangle on the side. |
| `peak` | cairn | `prop-basecamp.png` | A tiny pitched expedition tent on a snow patch: bright orange fly sheet, cream groundsheet edge, two ice axes crossed in the snow beside it. |
| `peak` | cairn | `prop-summitpost.png` | A weathered summit marker post in snow: warm brown timber, a cream plaque with no writing on it, a turquoise ribbon tied below, a cap of snow on top. |

## After they arrive

1. Drop the PNGs into `src/assets/props/`.
2. Add each to the `PropName` union and one `require` line to `PROP_ART` in
   `src/data/props.ts`.
3. Add the universal ones to `UNIVERSAL` in
   `src/components/home/TrackProps.tsx`, and change `SIGNATURE_PROP` in
   `src/data/props.ts` from one prop per landscape to a small array per
   landscape so a track can draw from its own set.

Tell me when they land and I will wire all of it up.
