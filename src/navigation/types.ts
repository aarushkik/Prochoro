/** Route map for the app. Choices flow through OnboardingContext / QuestContext. */
export type RootStackParamList = {
  Splash: undefined;
  /** Signed-out stack only. */
  SignIn: undefined;
  Intro: undefined;
  CourseSelection: undefined;
  SubjectExperience: undefined;
  GoalScore: undefined;
  ExamTimeline: undefined;
  AchievementPreview: undefined;
  /**
   * The question engine. With no params it runs the placement quest; with
   * params it runs one map stop or one training drill.
   */
  Quiz:
    | {
        /** Set when the session came from a stop on the map, so it can be cleared. */
        nodeId?: string;
        /** Which unit the stop belongs to, so its questions match its plaque. */
        unit?: number;
        /**
         * Skill tags to draw from, so a drill that names a topic asks about
         * it. Off-map only — a stop uses `unit` instead.
         */
        focus?: string[];
        /** True for a track boss, which pays more and which some companions favour. */
        boss?: boolean;
        /**
         * Endless review: the run refills instead of ending, and the student
         * decides when to stop. Used by the review dock at the foot of a
         * cleared track.
         */
        endless?: boolean;
        title?: string;
        xp?: number;
        count?: number;
      }
    | undefined;
  PlacementResult: undefined;
  LessonComplete: { title: string; correct: number; total: number; xp: number; cleared?: boolean; bossNodeId?: string; nodeId?: string; level?: number };
  Home: undefined;
  /** The companion roster, reached from the HUD avatar and from Profile. */
  Characters: { page?: 'companions' | 'bosses' } | undefined;
};

// Enables typed navigation with the untyped `useNavigation()` hook.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
