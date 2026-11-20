import { apCourses } from './apCourses';

export { apCourses } from './apCourses';
export {
  getPlacementQuiz,
  questionsForStop,
  questionsForSkills,
  climbQuestions,
  countForSkills,
  skillTagsFor,
  placementQuestions,
  drillSize,
  PLACEMENT_LEVELS,
} from './placementQuestions';

/** Look up a course by id. */
export const getCourse = (id: string | null) => apCourses.find((c) => c.id === id);
