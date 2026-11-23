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
import { PremiumOnly } from '../components/paywall/PremiumOnly';
import { GroupPicker } from '../components/GroupPicker';
import { t } from '../i18n';

function GuestImportScreen() {
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
    Alert.alert(
      t('guestImport.importedTitle'),
      t('guestImport.importedMessage', { count: importedCount }),
    );
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
          <Text style={styles.title}>{t('guestImport.title')}</Text>
          <View style={styles.topBarRight} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.explanationText}>
            {t('guestImport.explanation')}
          </Text>

          <TextInput
            style={styles.bigInput}
            multiline
            autoFocus
            value={text}
            onChangeText={setText}
            placeholder={t('guestImport.placeholderExample')}
            placeholderTextColor={colors.textTertiary}
            textAlignVertical="top"
            autoCorrect={false}
          />

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('guestImport.fieldGroup')}</Text>
            <GroupPicker groups={groups} value={groupId} onChange={setGroupId} />
          </View>

          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>
              {t('guestImport.guestsFound', { count: rows.length })}
            </Text>
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
              {t('guestImport.importGuests', { count: rows.length })}
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
    fontFamily: typography.fonts.title,
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

// Premium screen: see constants/premium.ts.
export default function GuestImportScreenRoute() {
  return (
    <PremiumOnly title={t('guestImport.premiumTitle')}>
      <GuestImportScreen />
    </PremiumOnly>
  );
}
