/** Verified against the linked College Board course pages on 2026-10-16.
 * Game areas retain their saved IDs; they are not additional AP units.
 */
export interface APFramework {
  courseURL: string;
  cedURL: string;
  units: { title: string; areas: number[]; bossArea: number }[];
}
const page = 'https://apcentral.collegeboard.org/courses/';
const pdf = 'https://apcentral.collegeboard.org/media/pdf/';
const sequential = (titles: string[]) => titles.map((title, area) => ({ title, areas: [area], bossArea: area }));
export const COURSE_FRAMEWORKS: Record<string, APFramework> = {
  'ap-biology': { courseURL: page + 'ap-biology', cedURL: pdf + 'ap-biology-course-and-exam-description.pdf', units: sequential(['Chemistry of Life', 'Cells', 'Cellular Energetics', 'Cell Communication and Cell Cycle', 'Heredity', 'Gene Expression and Regulation', 'Natural Selection', 'Ecology']) },
  'ap-calc-ab': { courseURL: page + 'ap-calculus-ab', cedURL: pdf + 'ap-calculus-ab-and-bc-course-and-exam-description.pdf', units: sequential(['Limits and Continuity', 'Differentiation: Definition and Fundamental Properties', 'Differentiation: Composite, Implicit, and Inverse Functions', 'Contextual Applications of Differentiation', 'Analytical Applications of Differentiation', 'Integration and Accumulation of Change', 'Differential Equations', 'Applications of Integration']) },
  'ap-world': { courseURL: page + 'ap-world-history', cedURL: pdf + 'ap-world-history-modern-course-and-exam-description.pdf', units: sequential(['The Global Tapestry', 'Networks of Exchange', 'Land-Based Empires', 'Transoceanic Interconnections', 'Revolutions', 'Consequences of Industrialization', 'Global Conflict', 'Cold War and Decolonization', 'Globalization']) },
  'ap-us-history': { courseURL: page + 'ap-united-states-history', cedURL: pdf + 'ap-us-history-course-and-exam-description.pdf', units: sequential(['1491–1607', '1607–1754', '1754–1800', '1800–1848', '1844–1877', '1865–1898', '1890–1945', '1945–1980', '1980–Present']) },
  'ap-chem': { courseURL: page + 'ap-chemistry', cedURL: pdf + 'ap-chemistry-course-and-exam-description.pdf', units: sequential(['Atomic Structure and Properties', 'Compound Structure and Properties', 'Properties of Substances and Mixtures', 'Chemical Reactions', 'Kinetics', 'Thermochemistry', 'Equilibrium', 'Acids and Bases', 'Thermodynamics and Electrochemistry']) },
  'ap-csa': { courseURL: page + 'ap-computer-science-a', cedURL: pdf + 'ap-computer-science-a-course-and-exam-description.pdf', units: [
    { title: 'Using Objects and Methods', areas: [0, 1], bossArea: 1 },
    { title: 'Selection and Iteration', areas: [2, 3], bossArea: 3 },
    { title: 'Class Creation', areas: [4], bossArea: 4 },
    { title: 'Data Collections', areas: [5, 6, 7, 8, 9], bossArea: 9 },
  ] },
  'ap-psych': { courseURL: page + 'ap-psychology', cedURL: pdf + 'ap-psychology-course-and-exam-description.pdf', units: [
    { title: 'Biological Bases of Behavior', areas: [0, 1], bossArea: 1 },
    { title: 'Cognition', areas: [3], bossArea: 3 },
    { title: 'Development and Learning', areas: [2, 5], bossArea: 5 },
    { title: 'Social Psychology and Personality', areas: [6, 8], bossArea: 8 },
    { title: 'Mental and Physical Health', areas: [4, 7], bossArea: 7 },
  ] },
  // English Language's nine official units scaffold recurring reading/writing
  // skills; College Board does not assign a single content-topic title to each.
  'ap-eng-lang': { courseURL: page + 'ap-english-language-and-composition', cedURL: pdf + 'ap-english-language-and-composition-course-and-exam-description.pdf', units: sequential(Array.from({ length: 9 }, (_, index) => 'Unit ' + (index + 1))) },
};
export function frameworkFor(courseId: string | null): APFramework { return COURSE_FRAMEWORKS[courseId ?? ''] ?? COURSE_FRAMEWORKS['ap-biology']; }
export function unitBossId(courseId: string, unitIndex: number): string | null {
  const unit = COURSE_FRAMEWORKS[courseId]?.units[unitIndex];
  return unit ? courseId + '-u' + (unit.bossArea + 1) + '-s6-boss' : null;
}
export function officialUnitForArea(courseId: string, area: number): number | null {
  const index = COURSE_FRAMEWORKS[courseId]?.units.findIndex(unit => unit.areas.includes(area)) ?? -1;
  return index < 0 ? null : index;
}
export function bossUnitIndex(courseId: string, nodeId: string): number | null {
  const index = COURSE_FRAMEWORKS[courseId]?.units.findIndex((_, index) => unitBossId(courseId, index) === nodeId) ?? -1;
  return index < 0 ? null : index;
}
export function gameAreaOrder(courseId: string): number[] {
  const units = COURSE_FRAMEWORKS[courseId]?.units ?? [];
  const ordered = units.flatMap(unit => unit.areas);
  return [...ordered, ...Array.from({ length: 10 }, (_, index) => index).filter(index => !ordered.includes(index))];
}
