import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getScoreClassification } from '../lib/mockData';

interface Props {
  score: number;
  size?: number;
  locked?: boolean;
}

const HealthScoreCircle: React.FC<Props> = ({ score, size = 120, locked = false }) => {
  const classification = getScoreClassification(score);
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = locked ? 0 : (score / 100) * circumference;

  if (locked) {
    return (
      <View style={[styles.lockedContainer, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.lockedLabel}>Premium</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background ring */}
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: '#f3f4f6',
          },
        ]}
      />
      {/* Score content */}
      <View style={styles.inner}>
        <Text style={[styles.score, { fontSize: size * 0.28, color: classification.color }]}>
          {score}
        </Text>
        <Text style={[styles.label, { color: classification.color }]}>
          {classification.label}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ring: {
    position: 'absolute',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontFamily: 'Poppins-Bold',
    lineHeight: undefined,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    marginTop: -4,
  },
  lockedContainer: {
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  lockIcon: {
    fontSize: 28,
  },
  lockedLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontFamily: 'Poppins-Medium',
  },
});

export default HealthScoreCircle;
