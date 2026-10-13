import type { APCourse } from '@/types';

/**
 * The AP course catalogue — the single source of truth for course selection,
 * for the onboarding copy, and for which question bank a session draws from.
 *
 * Subject illustrations live in data/illustrations.ts. Abbreviations remain
 * available for compact text-only contexts.
 */
export const apCourses: APCourse[] = [
  { id: 'ap-biology', abbr: 'BIO', name: 'AP Biology', shortName: 'Biology', blurb: 'Cells, genetics & life', accent: 'green', category: 'stem' },
  { id: 'ap-calc-ab', abbr: 'CAL', name: 'AP Calculus AB', shortName: 'Calculus', blurb: 'Limits, derivatives & integrals', accent: 'violet', category: 'stem' },
  { id: 'ap-world', abbr: 'WHI', name: 'AP World History', shortName: 'World History', blurb: 'Empires, trade & change', accent: 'coral', category: 'history' },
  { id: 'ap-us-history', abbr: 'USH', name: 'AP U.S. History', shortName: 'U.S. History', blurb: 'Founding to modern America', accent: 'amber', category: 'history' },
  { id: 'ap-csa', abbr: 'CSA', name: 'AP Computer Science A', shortName: 'CS A', blurb: 'Java, objects & algorithms', accent: 'sky', category: 'stem' },
  { id: 'ap-chem', abbr: 'CHM', name: 'AP Chemistry', shortName: 'Chemistry', blurb: 'Atoms, bonds & reactions', accent: 'lime', category: 'stem' },
  { id: 'ap-psych', abbr: 'PSY', name: 'AP Psychology', shortName: 'Psychology', blurb: 'Mind, brain & behavior', accent: 'pink', category: 'history' },
  { id: 'ap-eng-lang', abbr: 'ENG', name: 'AP English Language', shortName: 'English Lang', blurb: 'Rhetoric & argument', accent: 'gold', category: 'english' },
];
