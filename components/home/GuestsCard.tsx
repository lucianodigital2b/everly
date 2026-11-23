import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Users, ChevronRight, Lock } from 'lucide-react-native';
import { PressableScale } from './PressableScale';
import { useGuestsStore, guestStats } from '../../zustand/guests';
import { usePremium } from '../../hooks/usePremium';
import { colors } from '../../constants/colors';
import { cardSurface } from '../../constants/cardSurface';
import { typography } from '../../constants/typography';
import { t } from '../../i18n';

const SAMPLE_STATS = {
  invited: 180,
  attending: 142,
  waiting: 38,
};

type StatTileProps = {
  value: number;
  label: string;
};

function StatTile({ value, label }: StatTileProps) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.tileLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function GuestsCard() {
  const router = useRouter();
  const premium = usePremium();
  const guests = useGuestsStore((state) => state.guests);
  const stats = useMemo(() => guestStats(guests), [guests]);

  const isPremium = premium === true;
  const hasGuests = guests.length > 0;
  const handlePress = () => router.push('/guests');

  if (!hasGuests && isPremium) {
    return (
      <PressableScale onPress={handlePress} style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.iconCircle}>
            <Users size={18} color={colors.accentDeep} strokeWidth={2.2} />
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{t('guestsCard.title')}</Text>
            <Text style={styles.subtitle}>{t('guestsCard.emptySubtitle')}</Text>
          </View>
          <ChevronRight size={18} color={colors.textTertiary} />
        </View>
        <Text style={styles.emptyCta}>{t('guestsCard.addList')}</Text>
      </PressableScale>
    );
  }

  const showLock = !isPremium;
  const displayStats = isPremium ? stats : SAMPLE_STATS;
  const totalText = isPremium
    ? t('guestsCard.total', { count: displayStats.invited })
    : t('guestsCard.premiumTeaser');

  return (
    <PressableScale onPress={handlePress} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Users size={18} color={colors.accentDeep} strokeWidth={2.2} />
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{t('guestsCard.title')}</Text>
          <Text style={styles.subtitle}>{totalText}</Text>
        </View>

        {showLock ? (
          <View style={styles.lockPill}>
            <Lock size={10} color={colors.accentDeep} />
            <Text style={styles.lockText}>{t('guestsCard.premium')}</Text>
          </View>
        ) : null}

        <ChevronRight size={18} color={colors.textTertiary} />
      </View>

      <View style={styles.tilesRow}>
        <StatTile value={displayStats.attending} label={t('guestsCard.confirmed')} />
        <StatTile value={displayStats.waiting} label={t('guestsCard.pending')} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardSurface,
    padding: 20,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: typography.fonts.title,
    fontSize: typography.sizes.h3,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  lockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentBright,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  lockText: {
    fontFamily: typography.fonts.semibold,
    fontSize: 9,
    color: colors.accentDeep,
    letterSpacing: 0.4,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tile: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
  },
  tileValue: {
    fontFamily: typography.fonts.title,
    fontSize: 26,
    lineHeight: 32,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  tileLabel: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  emptyCta: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.body,
    color: colors.accentDeep,
  },
});
