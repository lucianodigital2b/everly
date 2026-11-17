import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { BackButton } from '../components/BackButton';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { PHASES, type PhaseId } from '../data/weddingPlan';
import { usePlanner } from '../hooks/usePlanner';
import { usePlannerStore } from '../zustand/planner';

export default function TaskNewScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ phase?: string | string[] }>();
  const planner = usePlanner();
  const addCustomTask = usePlannerStore((state) => state.addCustomTask);

  const rawPhase = Array.isArray(params.phase) ? params.phase[0] : params.phase;
  const defaultPhase: PhaseId =
    rawPhase && PHASES.some((phase) => phase.id === rawPhase)
      ? (rawPhase as PhaseId)
      : (planner?.currentPhase ?? 'p12');

  const [title, setTitle] = useState('');
  const [phase, setPhase] = useState<PhaseId>(defaultPhase);

  const canAdd = title.trim().length > 0;

  const handleAdd = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    addCustomTask(trimmed, phase);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <BackButton fallback="/(tabs)/plan" />
        <Text style={styles.headerTitle}>New task</Text>
        <View style={styles.topBarRight} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.fieldLabel}>Task title</Text>
        <TextInput
          style={styles.input}
          autoFocus
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Ask aunt Beth for a family photo"
          placeholderTextColor={colors.textTertiary}
        />

        <Text style={styles.fieldLabel}>Phase</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {PHASES.map((phaseOption) => {
            const selected = phaseOption.id === phase;
            return (
              <Pressable
                key={phaseOption.id}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setPhase(phaseOption.id)}
              >
                <Text
                  style={[styles.chipText, selected && styles.chipTextSelected]}
                >
                  {phaseOption.title}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          style={[styles.primaryButton, !canAdd && styles.primaryButtonDisabled]}
          disabled={!canAdd}
          onPress={handleAdd}
        >
          <Text style={styles.primaryButtonText}>Add task</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: colors.backgroundPrimary,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h3,
    color: colors.textPrimary,
  },
  topBarRight: {
    width: 44,
    height: 44,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 18,
  },
  fieldLabel: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#2E2429',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  chipRow: {
    gap: 8,
    paddingRight: 20,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.accentDeep,
    borderColor: colors.accentDeep,
  },
  chipText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.white,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.accentDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.button,
    color: colors.textPrimary,
  },
});
