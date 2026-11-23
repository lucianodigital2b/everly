import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { usePlanner } from '../../hooks/usePlanner';
import { usePlannerStore } from '../../zustand/planner';
import { HomeHeader } from '../../components/home/HomeHeader';
import { HomeHero } from '../../components/home/HomeHero';
import { QuickActions } from '../../components/home/QuickActions';
import { WhatsLeft } from '../../components/home/WhatsLeft';
import { NextStep } from '../../components/home/NextStep';
import { BudgetCard } from '../../components/home/BudgetCard';
import { GuestsCard } from '../../components/home/GuestsCard';
import { SmartTip } from '../../components/home/SmartTip';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { t } from '../../i18n';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const weddingDate = usePlannerStore((state) => state.weddingDate);
  const planner = usePlanner();
  const ready = !!weddingDate && !!planner;

  return (
    <View style={styles.root}>
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 120,
          },
        ]}
      >
        <HomeHeader />
        <HomeHero planner={planner} weddingDate={weddingDate} />

        {ready && planner ? (
          <>
            <BudgetCard />
            <GuestsCard />
            <NextStep planner={planner} />
            <WhatsLeft planner={planner} />
            <QuickActions />
            <SmartTip planner={planner} />
            <Text style={styles.footer}>{t('home.footer')}</Text>
          </>
        ) : (
          <QuickActions />
        )}
      </ScrollView>

      <View pointerEvents="none" style={[styles.statusFade, { height: insets.top + 12 }]}>
        <LinearGradient
          colors={[colors.backgroundPrimary, 'rgba(251,248,245,0)']}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  content: {
    paddingHorizontal: 20,
    gap: 24,
  },
  statusFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  footer: {
    textAlign: 'center',
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
