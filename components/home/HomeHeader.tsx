import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { usePlannerStore, parseISODate } from '../../zustand/planner';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { t, LOCALE_TAG } from '../../i18n';

export function HomeHeader() {
  const partnerA = usePlannerStore((s) => s.partnerA);
  const partnerB = usePlannerStore((s) => s.partnerB);
  const weddingDate = usePlannerStore((s) => s.weddingDate);

  const names = partnerA && partnerB ? `${partnerA} & ${partnerB}` : t('homeHeader.yourWedding');
  const initials =
    partnerA && partnerB
      ? `${partnerA[0]}${partnerB[0]}`.toUpperCase()
      : (partnerA ? partnerA[0] : t('homeHeader.yourInitial')).toUpperCase();
  const dateText = weddingDate ? formatDate(parseISODate(weddingDate)) : t('homeHeader.noDateSet');

  return (
    <View style={styles.header}>
      <View style={styles.avatar}>
        <Text style={styles.initials}>{initials}</Text>
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.names}>{names}</Text>
        <Text style={styles.date}>{dateText}</Text>
      </View>
    </View>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(LOCALE_TAG, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: typography.fonts.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  textBlock: {
    flex: 1,
  },
  names: {
    fontFamily: typography.fonts.title,
    fontSize: typography.sizes.h2,
    color: colors.textPrimary,
  },
  date: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
