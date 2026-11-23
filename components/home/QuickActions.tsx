import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Users, Wallet, CalendarDays, Plus } from 'lucide-react-native';
import { PressableScale } from './PressableScale';
import { colors } from '../../constants/colors';
import { cardSurface } from '../../constants/cardSurface';
import { typography } from '../../constants/typography';
import { t } from '../../i18n';

const ACTIONS = [
  { key: 'guests', label: t('quickActions.guests'), icon: Users, route: '/guests' },
  { key: 'budget', label: t('quickActions.budget'), icon: Wallet, route: '/budget' },
  { key: 'timeline', label: t('quickActions.timeline'), icon: CalendarDays, route: '/timeline' },
  { key: 'create', label: t('quickActions.newAlbum'), icon: Plus, route: '/(tabs)/create' },
] as const;

export function QuickActions() {
  const router = useRouter();
  return (
    <View style={styles.grid}>
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <PressableScale
            key={action.key}
            onPress={() => router.push(action.route)}
            style={styles.tile}
          >
            <View style={styles.iconCircle}>
              <Icon size={20} color={colors.accentDeep} strokeWidth={2.2} />
            </View>
            <Text style={styles.title}>{action.label}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    ...cardSurface,
    flexGrow: 1,
    flexBasis: '40%',
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
    color: colors.textPrimary,
  },
});
