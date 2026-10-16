import type { ImageSourcePropType } from 'react-native';
import type { SkylineKind } from './tracks';

/** Ten original generated doodle environments. No procedural scenery. */
export const AREA_ART: Record<SkylineKind, ImageSourcePropType> = {
  waves: require('@/assets/areas/prochoro/waves.png'),
  towers: require('@/assets/areas/prochoro/towers.png'),
  chimneys: require('@/assets/areas/prochoro/chimneys.png'),
  mesa: require('@/assets/areas/prochoro/mesa.png'),
  gears: require('@/assets/areas/prochoro/gears.png'),
  islands: require('@/assets/areas/prochoro/islands.png'),
  ridge: require('@/assets/areas/prochoro/ridge.png'),
  reeds: require('@/assets/areas/prochoro/reeds.png'),
  pylons: require('@/assets/areas/prochoro/pylons.png'),
  peak: require('@/assets/areas/prochoro/peak.png'),
};
