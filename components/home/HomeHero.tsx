import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useCountdown, type PlannerData } from '../../hooks/usePlanner';
import { PressableScale } from './PressableScale';
import { ProgressBar } from './ProgressBar';
import { colors } from '../../constants/colors';
import { cardSurface } from '../../constants/cardSurface';
import { typography } from '../../constants/typography';
import { t } from '../../i18n';

type Props = {
  planner: PlannerData | null;
  weddingDate: string | null;
};

// The countdown card: one big number and one thin progress line. Names and
// date already sit in HomeHeader right above it, and guests/tasks have their
// own cards below, so this card carries nothing else.
export function HomeHero({ planner, weddingDate }: Props) {
  const router = useRouter();

  if (!planner || !weddingDate) {
    return (
      <PressableScale onPress={() => router.push('/(tabs)/plan')} style={styles.card}>
        <Text style={styles.emptyTitle}>{t('homeHero.planYourWedding')}</Text>
        <Text style={styles.emptySubtitle}>{t('homeHero.setDateStartChecklist')}</Text>
        <Text style={styles.cta}>{t('homeHero.startNow')}</Text>
      </PressableScale>
    );
  }

  // After the day the countdown means nothing: point to the album instead.
  if (planner.daysUntil < 0) {
    return (
      <PressableScale onPress={() => router.push('/(tabs)/albums')} style={styles.card}>
        <Text style={styles.emptyTitle}>{t('homeHero.justMarried')}</Text>
        <Text style={styles.cta}>{t('homeHero.seeAlbum')}</Text>
      </PressableScale>
    );
  }

  const isToday = planner.daysUntil === 0;
  const percent = planner.percent;

  return (
    <PressableScale onPress={() => router.push('/(tabs)/plan')} style={styles.card}>
      {isToday ? (
        <Text style={styles.bigNumber}>{t('homeHero.today')}</Text>
      ) : (
        <DaysAndHours weddingDate={weddingDate} />
      )}

      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <ProgressBar value={percent / 100} height={6} />
        </View>
        <Text style={styles.percentText}>
          {t('homeHero.percentPlanned', { percent })}
        </Text>
      </View>
    </PressableScale>
  );
}

// Own component so the per-second countdown only re-renders this block.
// The date has no time of day; parseISODate puts it at noon, so that is the target.
function DaysAndHours({ weddingDate }: { weddingDate: string }) {
  const { days, hours } = useCountdown(weddingDate);
  return (
    <View style={styles.countRow}>
      <View>
        <Text style={styles.bigNumber}>{days}</Text>
        <Text style={styles.daysLabel}>{t('homeHero.daysUnit', { count: days })}</Text>
      </View>
      <View>
        <Text style={styles.bigNumber}>{hours}</Text>
        <Text style={styles.daysLabel}>{t('homeHero.hoursUnit', { count: hours })}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  countRow: {
    flexDirection: 'row',
    gap: 28,
  },
  card: {
    ...cardSurface,
    padding: 20,
    gap: 16,
  },
  bigNumber: {
    fontFamily: typography.fonts.title,
    fontSize: 48,
    lineHeight: 54,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  daysLabel: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    flex: 1,
  },
  percentText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  emptyTitle: {
    fontFamily: typography.fonts.title,
    fontSize: typography.sizes.h2,
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
  },
  cta: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.body,
    color: colors.accentDeep,
  },
});
