import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useScreenLayout } from '@/hooks/useScreenLayout';

/**
 * A list of choices that becomes a two-across grid when there is room.
 *
 * On a phone the children render exactly as given, one under another. On an
 * iPad or a desktop window each child takes half a row, so a list of six
 * options fills the screen in three rows instead of running down one narrow
 * strip with empty space either side.
 */
export function OptionGrid({ children }: { children: React.ReactNode }) {
  const { wide } = useScreenLayout();
  if (!wide) return <>{children}</>;
  return (
    <View style={styles.grid}>
      {React.Children.map(children, child => (child ? <View style={styles.cell}>{child}</View> : null))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14 },
  cell: { flexBasis: '45%', flexGrow: 1 },
});
