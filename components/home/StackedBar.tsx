import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../constants/colors';

export type StackedBarSegment = {
  value: number;
  color: string;
};

type Props = {
  segments: StackedBarSegment[];
  height?: number;
  trackColor?: string;
};

export function StackedBar({ segments, height = 10, trackColor = colors.surface2 }: Props) {
  const active = segments.filter((segment) => segment.value > 0);

  return (
    <View
      style={[
        styles.track,
        {
          height,
          borderRadius: height / 2,
          backgroundColor: trackColor,
        },
      ]}
    >
      {active.length > 0 ? (
        <View style={styles.row}>
          {active.map((segment, index) => (
            <React.Fragment key={index}>
              {index > 0 ? <View style={styles.gap} /> : null}
              <View
                style={{
                  flex: segment.value,
                  backgroundColor: segment.color,
                  minWidth: 0,
                }}
              />
            </React.Fragment>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  gap: {
    width: 2,
    backgroundColor: colors.white,
  },
});
