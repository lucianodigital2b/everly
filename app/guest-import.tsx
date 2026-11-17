import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { BackButton } from '../components/BackButton';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { parseGuestLines, useGuestsStore } from '../zustand/guests';

export default function GuestImportScreen() {
  const insets = useSafeAreaInsets();
  const groups = useGuestsStore((state) => state.groups);
  const addGuestsBulk = useGuestsStore((state) => state.addGuestsBulk);

  const [text, setText] = useState('');
  const [groupId, setGroupId] = useState('friends');

  const rows = useMemo(() => parseGuestLines(text), [text]);
  const preview = rows.slice(0, 5).map((row) => row.name).join(', ');

  const handleImport = () => {
    if (!rows.length) return;
    const importedCount = addGuestsBulk(rows, groupId);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Imported', `${importedCount} guests added`);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <BackButton fallback="/(tabs)/plan" />
          <Text style={styles.title}>Paste your list</Text>
          <View style={styles.topBarRight} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.explanationText}>
            One guest per line. Add a phone after a comma if you have it.
          </Text>

          <TextInput
            style={styles.bigInput}
            multiline
            autoFocus
            value={text}
            onChangeText={setText}
            placeholder={'Mom & Dad, +1 555 123 4567\nChris - 555 987 6543\nSally'}
            placeholderTextColor={colors.textTertiary}
            textAlignVertical="top"
            autoCorrect={false}
          />

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Group</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {groups.map((group) => {
                const selected = group.id === groupId;
                return (
                  <Pressable
                    key={group.id}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => setGroupId(group.id)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}
                    >
                      {group.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>{rows.length} guests found</Text>
            {preview ? (
              <Text style={styles.previewText}>{preview}</Text>
            ) : null}
          </View>

          <Pressable
            style={[styles.primaryButton, !rows.length && styles.primaryButtonDisabled]}
            disabled={!rows.length}
            onPress={handleImport}
          >
            <Text style={styles.primaryButtonText}>
              Import {rows.length} guests
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
  title: {
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
    gap: 20,
  },
  explanationText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  bigInput: {
    minHeight: 220,
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
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  chipRow: {
    gap: 8,
    paddingRight: 20,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  previewCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
    padding: 16,
    gap: 8,
    shadowColor: '#2E2429',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  previewTitle: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  previewText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    lineHeight: 18,
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
