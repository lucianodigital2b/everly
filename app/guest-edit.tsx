import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { BackButton } from '../components/BackButton';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { usePlannerStore } from '../zustand/planner';
import {
  MENU_OPTIONS,
  rsvpMessage,
  useGuestsStore,
  whatsappUrl,
  type AgeGroup,
  type MenuChoice,
  type RsvpStatus,
} from '../zustand/guests';
import { PremiumOnly } from '../components/paywall/PremiumOnly';
import { GroupPicker } from '../components/GroupPicker';
import { t } from '../i18n';

const STATUS_OPTIONS: RsvpStatus[] = ['waiting', 'attending'];
const AGE_OPTIONS: AgeGroup[] = ['adult', 'child', 'baby'];

function GuestEditScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const addGuest = useGuestsStore((state) => state.addGuest);
  const updateGuest = useGuestsStore((state) => state.updateGuest);
  const removeGuest = useGuestsStore((state) => state.removeGuest);
  const groups = useGuestsStore((state) => state.groups);
  const addGroup = useGuestsStore((state) => state.addGroup);
  const existing = useGuestsStore((state) =>
    state.guests.find((guest) => guest.id === id),
  );

  const partnerA = usePlannerStore((state) => state.partnerA);
  const partnerB = usePlannerStore((state) => state.partnerB);
  const weddingDate = usePlannerStore((state) => state.weddingDate);

  const [name, setName] = useState(existing?.name ?? '');
  const [groupId, setGroupId] = useState(existing?.groupId ?? 'friends');
  const [status, setStatus] = useState<RsvpStatus>(
    existing?.status ?? 'waiting',
  );
  const [age, setAge] = useState<AgeGroup>(existing?.age ?? 'adult');
  const [menu, setMenu] = useState<MenuChoice>(existing?.menu ?? 'unset');
  const [plusOne, setPlusOne] = useState(existing?.plusOne ?? false);
  const [note, setNote] = useState(existing?.note ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [address, setAddress] = useState(existing?.address ?? '');

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setGroupId(existing.groupId);
      setStatus(existing.status);
      setAge(existing.age);
      setMenu(existing.menu);
      setPlusOne(existing.plusOne);
      setNote(existing.note);
      setPhone(existing.phone);
      setEmail(existing.email);
      setAddress(existing.address);
    } else {
      setName('');
      setGroupId('friends');
      setStatus('waiting');
      setAge('adult');
      setMenu('unset');
      setPlusOne(false);
      setNote('');
      setPhone('');
      setEmail('');
      setAddress('');
    }
  }, [existing]);

  const handleAgeChange = (nextAge: AgeGroup) => {
    setAge(nextAge);
    if (!id && nextAge === 'child' && menu === 'unset') {
      setMenu('kids');
    }
  };

  const handleSave = (shouldStayForAnother = false) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const payload = {
      name: trimmedName,
      groupId,
      status,
      plusOne,
      note: note.trim(),
      age,
      menu,
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
    };

    if (id) {
      updateGuest(id, payload);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
      return;
    }

    addGuest(payload);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (shouldStayForAnother) {
      setName('');
      setNote('');
    } else {
      router.back();
    }
  };

  const handleRemove = () => {
    Alert.alert(t('guestEdit.removeGuestTitle'), t('guestEdit.removeGuestBody'), [
      { text: t('guestEdit.cancel'), style: 'cancel' },
      {
        text: t('guestEdit.remove'),
        style: 'destructive',
        onPress: () => {
          if (id) {
            removeGuest(id);
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Warning,
            );
          }
          router.back();
        },
      },
    ]);
  };

  const coupleTitle =
    partnerA && partnerB ? `${partnerA} & ${partnerB}` : t('guestEdit.us');

  const handleWhatsApp = () => {
    if (!existing?.phone) return;
    Linking.openURL(
      whatsappUrl(
        existing.phone,
        rsvpMessage(existing.name, coupleTitle, weddingDate),
      ),
    );
  };

  const canSave = name.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <BackButton fallback="/(tabs)/plan" />
          <Text style={styles.title}>{id ? t('guestEdit.editGuest') : t('guestEdit.addGuest')}</Text>
          <View style={styles.topBarRight} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('guestEdit.fieldName')}</Text>
            <TextInput
              style={styles.input}
              autoFocus={!id}
              value={name}
              onChangeText={setName}
              placeholder={t('guestEdit.guestNamePlaceholder')}
              placeholderTextColor={colors.textTertiary}
              textContentType="name"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('guestEdit.fieldGroup')}</Text>
            <GroupPicker
              groups={groups}
              value={groupId}
              onChange={setGroupId}
              onCreate={addGroup}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('guestEdit.fieldAge')}</Text>
            <View style={styles.segmentedControl}>
              {AGE_OPTIONS.map((option) => {
                const selected = age === option;
                return (
                  <Pressable
                    key={option}
                    style={[styles.segment, selected && styles.segmentSelected]}
                    onPress={() => handleAgeChange(option)}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        selected && styles.segmentTextSelected,
                      ]}
                    >
                      {option === 'adult'
                        ? t('guestEdit.ageAdult')
                        : option === 'child'
                          ? t('guestEdit.ageChild')
                          : t('guestEdit.ageBaby')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('guestEdit.fieldMenu')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {MENU_OPTIONS.map((option) => {
                const selected = menu === option.id;
                return (
                  <Pressable
                    key={option.id}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => setMenu(option.id)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable
                style={[styles.chip, menu === 'unset' && styles.chipSelected]}
                onPress={() => setMenu('unset')}
              >
                <Text
                  style={[
                    styles.chipText,
                    menu === 'unset' && styles.chipTextSelected,
                  ]}
                >
                  {t('guestEdit.menuNotChosen')}
                </Text>
              </Pressable>
            </ScrollView>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('guestEdit.fieldStatus')}</Text>
            <View style={styles.segmentedControl}>
              {STATUS_OPTIONS.map((option) => {
                const selected = status === option;
                return (
                  <Pressable
                    key={option}
                    style={[styles.segment, selected && styles.segmentSelected]}
                    onPress={() => setStatus(option)}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        selected && styles.segmentTextSelected,
                      ]}
                    >
                      {option === 'waiting'
                        ? t('guestEdit.statusWaiting')
                        : t('guestEdit.statusAttending')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('guestEdit.fieldContact')}</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder={t('guestEdit.phonePlaceholder')}
              placeholderTextColor={colors.textTertiary}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
            />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={t('guestEdit.emailPlaceholder')}
              placeholderTextColor={colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
            />
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={address}
              onChangeText={setAddress}
              placeholder={t('guestEdit.addressPlaceholder')}
              placeholderTextColor={colors.textTertiary}
              multiline
              textAlignVertical="top"
              textContentType="fullStreetAddress"
            />

            {id && existing?.phone && !existing.coupleSlot ? (
              <Pressable style={styles.whatsappButton} onPress={handleWhatsApp}>
                <Text style={styles.whatsappButtonText}>
                  {t('guestEdit.whatsappRsvp')}
                </Text>
              </Pressable>
            ) : null}
          </View>

          <View style={[styles.switchRow, styles.card]}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchTitle}>{t('guestEdit.plusOneTitle')}</Text>
              <Text style={styles.switchSubtitle}>{t('guestEdit.plusOneSubtitle')}</Text>
            </View>
            <Switch
              value={plusOne}
              onValueChange={setPlusOne}
              trackColor={{ false: colors.surface2, true: colors.accentDeep }}
              thumbColor={colors.ivory}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('guestEdit.fieldNote')}</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={note}
              onChangeText={setNote}
              placeholder={t('guestEdit.notePlaceholder')}
              placeholderTextColor={colors.textTertiary}
              multiline
              textAlignVertical="top"
            />
          </View>

          <Pressable
            style={[
              styles.primaryButton,
              !canSave && styles.primaryButtonDisabled,
            ]}
            disabled={!canSave}
            onPress={() => handleSave(false)}
          >
            <Text style={styles.primaryButtonText}>{t('guestEdit.save')}</Text>
          </Pressable>

          {!id ? (
            <Pressable
              style={[
                styles.secondaryButton,
                !canSave && styles.primaryButtonDisabled,
              ]}
              disabled={!canSave}
              onPress={() => handleSave(true)}
            >
              <Text style={styles.secondaryButtonText}>
                {t('guestEdit.saveAndAddAnother')}
              </Text>
            </Pressable>
          ) : !existing?.coupleSlot ? (
            <Pressable style={styles.removeButton} onPress={handleRemove}>
              <Text style={styles.removeButtonText}>{t('guestEdit.removeGuest')}</Text>
            </Pressable>
          ) : null}
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
  multilineInput: {
    minHeight: 100,
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
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  segmentSelected: {
    backgroundColor: colors.accentDeep,
  },
  segmentText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  segmentTextSelected: {
    color: colors.white,
    fontFamily: typography.fonts.semibold,
  },
  whatsappButton: {
    backgroundColor: 'rgba(127,168,140,0.14)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  whatsappButtonText: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.body,
    color: colors.success,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  card: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
    shadowColor: '#2E2429',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  switchInfo: {
    flex: 1,
    paddingRight: 12,
  },
  switchTitle: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  switchSubtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: 4,
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
  secondaryButton: {
    backgroundColor: colors.surface2,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.button,
    color: colors.textPrimary,
  },
  removeButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  removeButtonText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.body,
    color: colors.error,
  },
});

// Premium screen: see constants/premium.ts.
export default function GuestEditScreenRoute() {
  return (
    <PremiumOnly title={t('guestEdit.premiumTitle')}>
      <GuestEditScreen />
    </PremiumOnly>
  );
}
