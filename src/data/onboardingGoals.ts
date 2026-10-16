import type { Achievement, CourseCategory, ExamTimeframe, ExperienceLevel, ScoreGoal } from '@/types';

/** Setup step 2 — how much of the subject the student already knows. */
export const experienceLevels: ExperienceLevel[] = [
  { id: 'new', label: 'Total beginner', hint: 'Start me from the very first idea.', bars: 1 },
  { id: 'basic', label: 'I know a few bits', hint: 'Some names and terms have stuck.', bars: 2 },
  { id: 'several_units', label: 'Several units down', hint: 'I can follow most of class.', bars: 3 },
  { id: 'ap_questions', label: 'I can handle AP questions', hint: 'Exam-style problems are doable.', bars: 4 },
  { id: 'exam_ready', label: 'Basically exam-ready', hint: 'I just need sharpening.', bars: 5 },
];

/** Setup step 3 — the AP score the student is chasing. */
export const scoreGoals: ScoreGoal[] = [
  { id: 'score5', label: 'A 5 — go for the top', description: 'Aim for the highest AP score.' },
  { id: 'score4', label: 'A 4 or higher', description: 'A strong, college-ready score.' },
  { id: 'score3', label: 'A 3 or higher', description: 'Pass and earn the credit.' },
  { id: 'grade', label: 'Boost my class grade', description: 'Do better in the class itself.' },
  { id: 'unsure', label: 'Not sure yet', description: 'Find a target as you practise.' },
];

/** Setup step 4 — when the AP exam is happening. */
export const examTimeframes: ExamTimeframe[] = [
  { id: 'this_spring', label: 'This spring', description: 'Exam season is around the corner.' },
  { id: 'next_year', label: 'Next year', description: 'Plenty of runway to prepare.' },
  { id: 'for_class', label: 'Just for my class', description: 'Studying alongside coursework.' },
  { id: 'unsure', label: 'Not sure yet', description: 'No pressure — we will pace it.' },
];

/** Setup step 5 — the "quest ahead" milestones, tailored per subject family. */
export const achievementsByCategory: Record<CourseCategory, Achievement[]> = {
  stem: [
    { icon: 'layers', title: 'Master the core concepts', description: 'Lock in the ideas every later unit builds on.' },
    { icon: 'target', title: 'Train on AP-style problems', description: 'Get fluent in how the exam actually asks things.' },
    { icon: 'rocket', title: 'Gear up for test day', description: 'Close weak spots with review and boss duels.' },
  ],
  history: [
    { icon: 'book', title: 'Master the key ideas', description: 'Build the foundation every unit needs.' },
    { icon: 'page', title: 'Decode source questions', description: 'Read, reason, and answer the way the AP wants.' },
    { icon: 'medal', title: 'Build exam-day confidence', description: 'Close weak spots with review and boss duels.' },
  ],
  english: [
    { icon: 'compass', title: 'Read like a detective', description: 'Break down passages and prompts with ease.' },
    { icon: 'quill', title: 'Sharpen your arguments', description: 'Nail evidence, reasoning, and structure.' },
    { icon: 'rocket', title: 'Gear up for test day', description: 'Close weak skills with review and boss duels.' },
  ],
};
