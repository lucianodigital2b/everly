import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Users, Camera } from 'lucide-react-native';
import { colors } from '../constants/colors';
import { eventCover } from '../constants/sampleImages';
import { getFilterMatrix, type FilterKey } from '../constants/filters';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventPreviewCardProps {
  title: string;
  date: string;
  participants: string;
  shots: string;
  coverUri: string | null;
  filter?: FilterKey;
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

const StatPill = ({
  icon: Icon,
  value,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  value: string;
}) => (
  <View style={styles.statPill}>
    <Icon size={12} color="rgba(255,255,255,0.75)" />
    <Text style={styles.statText}>{value}</Text>
  </View>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const EventPreviewCard = ({
  title,
  date,
  participants,
  shots,
  coverUri,
  filter = 'none',
}: EventPreviewCardProps) => {
  const matrix = getFilterMatrix(filter);

  return (
    <View style={styles.card}>
      {/* Cover image / placeholder */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: eventCover(coverUri) }}
          style={[
            styles.image,
            matrix.length > 0 && ({ filter: matrix } as any),
          ]}
          resizeMode="cover"
        />

        {/* Bottom gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.72)']}
          locations={[0.3, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Text overlay */}
        <View style={styles.overlay}>
          <Text style={styles.title} numberOfLines={2}>
            {title || 'Your Event'}
          </Text>

          <View style={styles.statsRow}>
            <StatPill icon={Calendar} value={date || '—'} />
            <StatPill
              icon={Users}
              value={participants ? `${participants} guests` : 'Unlimited'}
            />
            <StatPill
              icon={Camera}
              value={shots ? `${shots} shots` : 'Unlimited'}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: colors.backgroundSecondary,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 32,
  },
  title: {
    fontFamily: 'Inter-ExtraBold',
    fontSize: 24,
    color: '#fff',
    marginBottom: 12,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  statText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
});
