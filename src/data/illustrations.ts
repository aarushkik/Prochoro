import type { ImageSourcePropType } from 'react-native';
import type { SkylineKind } from './tracks';
import type { QuestNodeKindId } from '@/types/quest';

/** Generated artwork is bundled locally; no network is needed to draw the app. */
export const LANDSCAPE_ART: Record<SkylineKind, ImageSourcePropType> = {
  waves: require('../assets/illustrations/landscapes/waves.png'),
  towers: require('../assets/illustrations/landscapes/towers.png'),
  chimneys: require('../assets/illustrations/landscapes/chimneys.png'),
  mesa: require('../assets/illustrations/landscapes/mesa.png'),
  gears: require('../assets/illustrations/landscapes/gears.png'),
  islands: require('../assets/illustrations/landscapes/islands.png'),
  ridge: require('../assets/illustrations/landscapes/ridge.png'),
  reeds: require('../assets/illustrations/landscapes/reeds.png'),
  pylons: require('../assets/illustrations/landscapes/pylons.png'),
  peak: require('../assets/illustrations/landscapes/peak.png'),
};
export const STUDY_CAMP_ART = require('../assets/illustrations/scenes/study-camp.png');

export const ACTIVITY_ART: Record<Exclude<QuestNodeKindId, 'boss'>, ImageSourcePropType> = {
  lesson: require('../assets/illustrations/activities/lesson.png'),
  drill: require('../assets/illustrations/activities/drill.png'),
  study: require('../assets/illustrations/activities/study.png'),
  bonus: require('../assets/illustrations/activities/bonus.png'),
};

export const COURSE_ART: Record<string, ImageSourcePropType> = {
  'ap-biology': require('../assets/illustrations/courses/ap-biology.png'),
  'ap-calc-ab': require('../assets/illustrations/courses/ap-calc-ab.png'),
  'ap-world': require('../assets/illustrations/courses/ap-world.png'),
  'ap-us-history': require('../assets/illustrations/courses/ap-us-history.png'),
  'ap-csa': require('../assets/illustrations/courses/ap-csa.png'),
  'ap-chem': require('../assets/illustrations/courses/ap-chem.png'),
  'ap-psych': require('../assets/illustrations/courses/ap-psych.png'),
  'ap-eng-lang': require('../assets/illustrations/courses/ap-eng-lang.png'),
};

export const PLACEMENT_ART: Record<string, ImageSourcePropType> = {
  beginner: require('../assets/illustrations/badges/beginner.png'),
  builder: require('../assets/illustrations/badges/builder.png'),
  ap_ready: require('../assets/illustrations/badges/ap-ready.png'),
  advanced_review: require('../assets/illustrations/badges/advanced-review.png'),
};
