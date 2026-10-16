/**
 * Track themes — the ten places each course walks through.
 *
 * A track is one unit of the real syllabus dressed as somewhere you go. The
 * *topic* stays the genuine AP unit title (those live in `courseUnits.ts`);
 * the *place* is what the student sees on the path header, and it is named for
 * what that unit is actually about — "Loop Foundry" for Iteration, "Acid
 * Springs" for Acids & Bases.
 *
 * AP Biology's ten places come from the Claude Design build verbatim. The
 * other seventy are written to the same pattern.
 *
 * Every track carries a `kind`, which selects the silhouette skyline drawn
 * behind it (see `Skyline`). Kind is chosen for the place, not the course, so
 * a foundry gets chimneys wherever it appears.
 */

/** The ten silhouette sets a track can be drawn against. */
export type SkylineKind =
  | 'waves'
  | 'towers'
  | 'chimneys'
  | 'mesa'
  | 'gears'
  | 'islands'
  | 'ridge'
  | 'reeds'
  | 'pylons'
  | 'peak';

export interface TrackTheme {
  /** 1-based position in the course. */
  n: number;
  /** Where you are — shown on the path header. */
  place: string;
  /** Ground wash behind the path. */
  sky: string;
  /** The track's own colour: cleared stops, progress fill, banner. */
  deep: string;
  /** Its shadow — lips beneath anything filled with `deep`. */
  dark: string;
  kind: SkylineKind;
}

/**
 * The palette ramp. Ten slots, borrowed from the design's Biology route and
 * reused across courses so no course has to invent colour.
 */
const P = {
  turquoise: { sky: '#FFFFFF', deep: '#111111', dark: '#000000' },
  green: { sky: '#FFFFFF', deep: '#111111', dark: '#000000' },
  amber: { sky: '#FFFFFF', deep: '#111111', dark: '#000000' },
  violet: { sky: '#FFFFFF', deep: '#111111', dark: '#000000' },
  blue: { sky: '#FFFFFF', deep: '#111111', dark: '#000000' },
  ember: { sky: '#FFFFFF', deep: '#111111', dark: '#000000' },
  khaki: { sky: '#FFFFFF', deep: '#111111', dark: '#000000' },
  teal: { sky: '#FFFFFF', deep: '#111111', dark: '#000000' },
  magenta: { sky: '#FFFFFF', deep: '#111111', dark: '#000000' },
  slate: { sky: '#FFFFFF', deep: '#111111', dark: '#000000' },
} as const;

type PaletteName = keyof typeof P;
type Spec = readonly [place: string, kind: SkylineKind, palette: PaletteName];

/**
 * Every course ends on the slate "Exam Summit" peak. That is deliberate: the
 * last track is the same destination whatever you are studying, so the end of
 * the map is recognisable across courses.
 */
const SPECS: Record<string, readonly Spec[]> = {
  // Straight from the design build.
  'ap-biology': [
    ['Tidepool Flats', 'waves', 'turquoise'],
    ['Cell City', 'towers', 'green'],
    ['Furnace Foothills', 'chimneys', 'amber'],
    ['Helix Canyon', 'mesa', 'violet'],
    ['The Codeworks', 'gears', 'blue'],
    ['Finch Isles', 'islands', 'ember'],
    ['Deep Time Ridge', 'ridge', 'khaki'],
    ['The Wetlands', 'reeds', 'teal'],
    ['Signal Marsh', 'pylons', 'magenta'],
    ['Exam Summit', 'peak', 'slate'],
  ],

  'ap-calc-ab': [
    ['Approach Shore', 'waves', 'turquoise'],
    ['Tangent Ridge', 'ridge', 'green'],
    ['The Chainworks', 'gears', 'blue'],
    ['Motion Valley', 'mesa', 'amber'],
    ['Curve Heights', 'towers', 'violet'],
    ['Accumulation Basin', 'reeds', 'teal'],
    ['Flowfield Fens', 'pylons', 'magenta'],
    ['Volume Quarry', 'chimneys', 'ember'],
    ['The Scoring Hall', 'islands', 'khaki'],
    ['Exam Summit', 'peak', 'slate'],
  ],

  'ap-world': [
    ['The Silk Crossroads', 'mesa', 'amber'],
    ['Monsoon Ports', 'waves', 'turquoise'],
    ['Gunpowder Steppe', 'ridge', 'khaki'],
    ['Trade Wind Bay', 'islands', 'teal'],
    ['Barricade Quarter', 'towers', 'ember'],
    ['Smokestack Reach', 'chimneys', 'violet'],
    ['The Trenches', 'reeds', 'green'],
    ['Iron Curtain Line', 'pylons', 'blue'],
    ['Network Sprawl', 'gears', 'magenta'],
    ['Exam Summit', 'peak', 'slate'],
  ],

  'ap-us-history': [
    ['First Landing', 'waves', 'turquoise'],
    ['Colony Coast', 'islands', 'teal'],
    ['Liberty Green', 'towers', 'green'],
    ['Frontier Trail', 'mesa', 'amber'],
    ['Divided Fields', 'ridge', 'ember'],
    ['Rail Junction', 'chimneys', 'khaki'],
    ['Reform Heights', 'pylons', 'violet'],
    ['Cold War Basin', 'reeds', 'blue'],
    ['Silicon Flats', 'gears', 'magenta'],
    ['Exam Summit', 'peak', 'slate'],
  ],

  'ap-csa': [
    ['Primitive Shore', 'waves', 'turquoise'],
    ['Object Yard', 'towers', 'green'],
    ['Branch Gate', 'mesa', 'amber'],
    ['Loop Foundry', 'chimneys', 'ember'],
    ['Class Works', 'gears', 'blue'],
    ['Array Terrace', 'ridge', 'violet'],
    ['The Growing List', 'reeds', 'teal'],
    ['Grid Quarter', 'pylons', 'khaki'],
    ['Legacy Halls', 'islands', 'magenta'],
    ['Recursion Spire', 'peak', 'slate'],
  ],

  'ap-chem': [
    ['Atom Shore', 'waves', 'turquoise'],
    ['Bond Bridge', 'pylons', 'blue'],
    ['Phase Fields', 'reeds', 'teal'],
    ['Reaction Basin', 'islands', 'green'],
    ['Rate Rapids', 'ridge', 'amber'],
    ['Heat Foundry', 'chimneys', 'ember'],
    ['Balance Point', 'gears', 'violet'],
    ['Acid Springs', 'mesa', 'magenta'],
    ['Free Energy Ridge', 'towers', 'khaki'],
    ['Exam Summit', 'peak', 'slate'],
  ],

  'ap-psych': [
    ['Neuron Grove', 'reeds', 'teal'],
    ['Signal Shore', 'waves', 'turquoise'],
    ['Conditioning Yard', 'gears', 'amber'],
    ['Memory Vault', 'towers', 'blue'],
    ['Drive Basin', 'islands', 'ember'],
    ['Lifespan Trail', 'ridge', 'green'],
    ['Trait Terrace', 'mesa', 'khaki'],
    ['The Clinic', 'chimneys', 'violet'],
    ['Crowd Square', 'pylons', 'magenta'],
    ['Exam Summit', 'peak', 'slate'],
  ],

  'ap-eng-lang': [
    ["Reader's Landing", 'waves', 'turquoise'],
    ["Writer's Workshop", 'towers', 'amber'],
    ['Evidence Field', 'reeds', 'green'],
    ['Thesis Forge', 'chimneys', 'ember'],
    ['Logic Terrace', 'mesa', 'blue'],
    ['Style Gallery', 'islands', 'magenta'],
    ['Sentence Works', 'gears', 'violet'],
    ['Source Confluence', 'pylons', 'teal'],
    ['Analysis Heights', 'ridge', 'khaki'],
    ['Exam Summit', 'peak', 'slate'],
  ],
};

function build(specs: readonly Spec[]): TrackTheme[] {
  return specs.map(([place, kind, palette], i) => ({ n: i + 1, place, kind, ...P[palette] }));
}

const TRACKS: Record<string, TrackTheme[]> = Object.fromEntries(
  Object.entries(SPECS).map(([courseId, specs]) => [courseId, build(specs)]),
);

/** Courses with no dedicated route walk Biology's. */
export const DEFAULT_TRACKS = TRACKS['ap-biology'];

/** The ten places for a course, in order. */
export function tracksFor(courseId: string | null): TrackTheme[] {
  return (courseId && TRACKS[courseId]) || DEFAULT_TRACKS;
}

/** One track by zero-based index, clamped so callers never fall off the end. */
export function trackAt(courseId: string | null, index: number): TrackTheme {
  const list = tracksFor(courseId);
  return list[Math.min(list.length - 1, Math.max(0, index))];
}

/**
 * Whether a track's own colour is light enough to take ink text.
 *
 * The banner sits directly on `deep`, and the ten palettes run from amber
 * (very light) to slate (very dark). Hard-coding ink — which is what the
 * design does, since it only ever shows the amber track — would make the
 * summit and blue banners unreadable.
 */
export function isLightTrack(deep: string): boolean {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(deep.slice(i, i + 2), 16));
  // Rec. 601 luma; 0.6 is where ink stops being comfortable on these hues.
  return (r * 0.299 + g * 0.587 + b * 0.114) / 255 > 0.6;
}
