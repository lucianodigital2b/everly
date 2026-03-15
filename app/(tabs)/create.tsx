import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { EventPreviewCard } from '../../components/EventPreviewCard';
import { Input } from '../../components/Input';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';
import { FILTERS, type FilterKey } from '../../constants/filters';
import { eventsApi } from '../../services/api';
import { ArrowLeft, ArrowRight, Calendar, ImageUp } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { title: "What's the\noccasion?",    subtitle: 'Give your moment a name and type.' },
  { title: 'When does\nit close?',     subtitle: 'Set the end date and how the gallery reveals.' },
  { title: 'How many\nshots?',         subtitle: 'Limit photos per guest, or leave blank for unlimited.' },
  { title: "Who's\ninvited?",          subtitle: 'Set a guest limit, or leave blank for unlimited.' },
  { title: 'Set\nthe mood.',           subtitle: 'All guests will shoot with this filter for a cohesive album.' },
  { title: 'Add a\ncover photo.',      subtitle: 'This is how your event will look to guests.' },
];

const EVENT_TYPES = ['Wedding', 'Birthday', 'Trip', 'Anniversary', 'Party', 'Other'];
const REVEAL_MODES = ['Instant', 'End of Event', 'Scheduled'];

// ─── Reusable sub-components ──────────────────────────────────────────────────

const SectionLabel = ({ children }: { children: string }) => (
  <Text
    style={{
      fontFamily: 'Inter_600SemiBold',
      fontSize: 11,
      color: colors.textSecondary,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginBottom: 10,
    }}
  >
    {children}
  </Text>
);

const HintText = ({ children }: { children: string }) => (
  <Text
    style={{
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 14,
      lineHeight: 20,
      opacity: 0.7,
    }}
  >
    {children}
  </Text>
);

const DatePickerRow = ({
  value,
  placeholder,
  onPress,
}: {
  value: string | null;
  placeholder: string;
  onPress: () => void;
}) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={onPress}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: value ? colors.accent : 'rgba(255,255,255,0.08)',
      paddingHorizontal: 16,
      height: 56,
      marginBottom: 24,
    }}
  >
    <Calendar
      size={18}
      color={value ? colors.accent : colors.textSecondary}
      style={{ marginRight: 12 }}
    />
    <Text
      style={{
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        color: value ? colors.textPrimary : colors.textSecondary,
        flex: 1,
      }}
    >
      {value ?? placeholder}
    </Text>
  </TouchableOpacity>
);

// ─── Chip ─────────────────────────────────────────────────────────────────────

const Chip = ({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, speed: 50 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        style={{
          paddingHorizontal: 18,
          paddingVertical: 10,
          borderRadius: 100,
          marginRight: 8,
          marginBottom: 10,
          backgroundColor: selected ? colors.accent : colors.backgroundSecondary,
          borderWidth: 1,
          borderColor: selected ? colors.accent : 'rgba(255,255,255,0.08)',
        }}
      >
        <Text
          style={{
            fontFamily: selected ? 'Inter_600SemiBold' : 'Inter_400Regular',
            fontSize: 14,
            color: selected ? colors.white : colors.textSecondary,
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Filter card ──────────────────────────────────────────────────────────────

const FILTER_PREVIEW_URI =
  'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=400&auto=format&fit=crop';

const FilterCard = ({
  item,
  selected,
  onPress,
}: {
  item: (typeof FILTERS)[number];
  selected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={{ alignItems: 'center', marginRight: 14 }}
  >
    <View
      style={{
        width: 88,
        height: 112,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: selected ? colors.accent : 'transparent',
      }}
    >
      <Image
        source={{ uri: FILTER_PREVIEW_URI }}
        style={[
          { width: '100%', height: '100%' },
          item.matrix.length > 0 && ({ filter: item.matrix } as any),
        ]}
        resizeMode="cover"
      />
    </View>
    <Text
      style={{
        marginTop: 8,
        fontFamily: selected ? 'Inter_600SemiBold' : 'Inter_400Regular',
        fontSize: 13,
        color: selected ? colors.accent : colors.textSecondary,
      }}
    >
      {item.label}
    </Text>
  </TouchableOpacity>
);

// ─── Progress bar ─────────────────────────────────────────────────────────────

const ProgressBar = ({ step, total }: { step: number; total: number }) => {
  const progress = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(progress, {
      toValue: (step + 1) / total,
      useNativeDriver: false,
      damping: 20,
      stiffness: 90,
    }).start();
  }, [step]);

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View
      style={{
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 32,
      }}
    >
      <Animated.View
        style={{ width, height: '100%', backgroundColor: colors.accent, borderRadius: 2 }}
      />
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function CreateScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    expires_at: null as Date | null,
    revealMode: '',
    revealDate: null as Date | null,
    shotLimit: '',
    participantLimit: '',
    filter: 'none' as FilterKey,
    coverImage: null as string | null,
  });

  const [datePickerOpen, setDatePickerOpen] = useState<'expires_at' | 'reveal' | null>(null);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 18,
      stiffness: 80,
      delay: 100,
    } as any).start();
  }, []);

  // ─── Navigation ─────────────────────────────────────────────────────────────

  const animateToStep = (nextStep: number) => {
    const direction = nextStep > step ? 1 : -1;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: direction * -SCREEN_WIDTH * 0.25, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(direction * SCREEN_WIDTH * 0.25);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 100 }),
      ]).start();
    });
  };

  const goNext = () => {
    if (step < STEPS.length - 1) animateToStep(step + 1);
    else handleCreate();
  };

  const goBack = () => {
    if (step === 0) router.back();
    else animateToStep(step - 1);
  };

  const canContinue = () => {
    if (step === 0) return formData.name.trim().length > 0 && formData.type.length > 0;
    if (step === 1)
      return (
        formData.revealMode.length > 0 &&
        (formData.revealMode !== 'Scheduled' || formData.revealDate !== null)
      );
    return true;
  };

  // ─── Image picker ────────────────────────────────────────────────────────────

  const pickCoverImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });

    if (!result.canceled) {
      setFormData((prev) => ({ ...prev, coverImage: result.assets[0].uri }));
    }
  };

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    try {
      await eventsApi.store({
        name: formData.name,
        plan_id: 1,
        reveal_time: formData.revealMode || undefined,
        expires_at: formData.expires_at?.toISOString() ?? undefined,
        shot_limit: formData.shotLimit ? parseInt(formData.shotLimit, 10) : undefined,
        participant_limit: formData.participantLimit
          ? parseInt(formData.participantLimit, 10)
          : undefined,
        filter: formData.filter !== 'none' ? formData.filter : undefined,
        cover_image_url: formData.coverImage ?? undefined,
      });
    } catch (e) {
      console.warn('Failed to create event:', e);
    }
    router.push('/(tabs)');
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const expiresAtLabel = formData.expires_at
    ? formData.expires_at.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const revealDateLabel = formData.revealDate
    ? formData.revealDate.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <ScreenWrapper>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* Top bar */}
          <Animated.View
            style={{
              opacity: headerAnim,
              transform: [
                { translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) },
              ],
            }}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 24 }}
            >
              <TouchableOpacity
                onPress={goBack}
                activeOpacity={0.7}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.backgroundSecondary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}
              >
                <ArrowLeft size={18} color={colors.textPrimary} />
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {STEPS.map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: i === step ? 20 : 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor:
                        i === step ? colors.accent : 'rgba(255,255,255,0.15)',
                    }}
                  />
                ))}
              </View>

              <Text
                style={{
                  marginLeft: 'auto',
                  fontFamily: 'Inter_400Regular',
                  fontSize: 12,
                  color: colors.textSecondary,
                }}
              >
                {step + 1} / {STEPS.length}
              </Text>
            </View>

            <ProgressBar step={step} total={STEPS.length} />
          </Animated.View>

          {/* Step content */}
          <Animated.View
            style={{ flex: 1, opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}
          >
            {/* Heading */}
            <Text
              style={{
                fontFamily: 'PlayfairDisplay_700Bold',
                fontSize: 36,
                lineHeight: 44,
                color: colors.textPrimary,
                marginBottom: 8,
              }}
            >
              {STEPS[step].title}
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 15,
                color: colors.textSecondary,
                marginBottom: 32,
              }}
            >
              {STEPS[step].subtitle}
            </Text>

            {/* ── Step 0: Basics ── */}
            {step === 0 && (
              <View>
                <Input
                  label="Event Name"
                  placeholder="e.g. Sarah & James's Wedding"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  containerStyle="mb-6"
                  autoFocus
                />
                <SectionLabel>Event Type</SectionLabel>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {EVENT_TYPES.map((type) => (
                    <Chip
                      key={type}
                      label={type}
                      selected={formData.type === type}
                      onPress={() => setFormData({ ...formData, type })}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* ── Step 1: When ── */}
            {step === 1 && (
              <View>
                <SectionLabel>End Date</SectionLabel>
                <DatePickerRow
                  value={expiresAtLabel}
                  placeholder="Select an end date"
                  onPress={() => setDatePickerOpen('expires_at')}
                />

                <SectionLabel>Gallery Reveal</SectionLabel>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {REVEAL_MODES.map((mode) => (
                    <Chip
                      key={mode}
                      label={mode}
                      selected={formData.revealMode === mode}
                      onPress={() => setFormData({ ...formData, revealMode: mode })}
                    />
                  ))}
                </View>

                {formData.revealMode === 'Scheduled' && (
                  <View style={{ marginTop: 16 }}>
                    <SectionLabel>Reveal Date & Time</SectionLabel>
                    <DatePickerRow
                      value={revealDateLabel}
                      placeholder="Select reveal date & time"
                      onPress={() => setDatePickerOpen('reveal')}
                    />
                  </View>
                )}
              </View>
            )}

            {/* ── Step 2: Shot limit ── */}
            {step === 2 && (
              <View>
                <Input
                  label="Shot Limit"
                  placeholder="Unlimited"
                  keyboardType="numeric"
                  value={formData.shotLimit}
                  onChangeText={(text) => setFormData({ ...formData, shotLimit: text })}
                  autoFocus
                />
                <HintText>Max photos each guest can upload. Leave blank for unlimited.</HintText>
              </View>
            )}

            {/* ── Step 3: Participants ── */}
            {step === 3 && (
              <View>
                <Input
                  label="Guest Limit"
                  placeholder="Unlimited"
                  keyboardType="numeric"
                  value={formData.participantLimit}
                  onChangeText={(text) => setFormData({ ...formData, participantLimit: text })}
                  autoFocus
                />
                <HintText>Max guests who can join this event. Depends on your plan.</HintText>
              </View>
            )}

            {/* ── Step 4: Filter ── */}
            {step === 4 && (
              <View>
                <View style={{ flexDirection: 'row', paddingBottom: 8 }}>
                  {FILTERS.map((f) => (
                    <FilterCard
                      key={f.key}
                      item={f}
                      selected={formData.filter === f.key}
                      onPress={() => setFormData({ ...formData, filter: f.key })}
                    />
                  ))}
                </View>
                <HintText>Guests won't be able to override this. Choose wisely.</HintText>
              </View>
            )}

            {/* ── Step 5: Cover photo + Preview ── */}
            {step === 5 && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
                {/* Image picker */}
                <TouchableOpacity
                  onPress={pickCoverImage}
                  activeOpacity={0.8}
                  style={{
                    height: 180,
                    borderRadius: 20,
                    overflow: 'hidden',
                    backgroundColor: colors.backgroundSecondary,
                    borderWidth: formData.coverImage ? 0 : 1.5,
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderStyle: 'dashed',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20,
                  }}
                >
                  {formData.coverImage ? (
                    <Image
                      source={{ uri: formData.coverImage }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={{ alignItems: 'center', gap: 10 }}>
                      <View
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 26,
                          backgroundColor: 'rgba(255,255,255,0.06)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ImageUp size={24} color={colors.textSecondary} />
                      </View>
                      <Text
                        style={{
                          fontFamily: 'Inter_400Regular',
                          fontSize: 14,
                          color: colors.textSecondary,
                        }}
                      >
                        Tap to add a cover photo
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Live preview */}
                <SectionLabel>Preview</SectionLabel>
                <EventPreviewCard
                  title={formData.name}
                  date={
                    formData.expires_at
                      ? formData.expires_at.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : ''
                  }
                  participants={formData.participantLimit}
                  shots={formData.shotLimit}
                  coverUri={formData.coverImage}
                  filter={formData.filter}
                />
              </ScrollView>
            )}
          </Animated.View>

          {/* Date pickers */}
          <DateTimePickerModal
            isVisible={datePickerOpen === 'expires_at'}
            mode="date"
            minimumDate={new Date()}
            date={formData.expires_at ?? new Date()}
            onConfirm={(date) => {
              setFormData({ ...formData, expires_at: date });
              setDatePickerOpen(null);
            }}
            onCancel={() => setDatePickerOpen(null)}
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            themeVariant="dark"
            accentColor={colors.accent}
          />
          <DateTimePickerModal
            isVisible={datePickerOpen === 'reveal'}
            mode="datetime"
            minimumDate={formData.expires_at ?? new Date()}
            date={formData.revealDate ?? formData.expires_at ?? new Date()}
            onConfirm={(date) => {
              setFormData({ ...formData, revealDate: date });
              setDatePickerOpen(null);
            }}
            onCancel={() => setDatePickerOpen(null)}
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            themeVariant="dark"
            accentColor={colors.accent}
          />
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      {/* Floating CTA */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 130,
          right: 24,
          opacity: headerAnim,
          transform: [
            { translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
          ],
        }}
        pointerEvents="box-none"
      >
        {step === 1 && (
          <TouchableOpacity
            onPress={goNext}
            activeOpacity={0.7}
            style={{ marginBottom: 12, alignItems: 'center' }}
          >
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 13,
                color: colors.textSecondary,
                textDecorationLine: 'underline',
              }}
            >
              Skip
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={goNext}
          disabled={!canContinue()}
          activeOpacity={0.85}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: canContinue() ? colors.accent : colors.backgroundSecondary,
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 100,
            shadowColor: colors.accent,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: canContinue() ? 0.35 : 0,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <Text
            style={{
              fontFamily: 'Inter_600SemiBold',
              fontSize: 15,
              color: canContinue() ? '#fff' : colors.textSecondary,
            }}
          >
            {step === STEPS.length - 1 ? 'Create' : 'Continue'}
          </Text>
          <ArrowRight
            size={18}
            color={canContinue() ? '#fff' : colors.textSecondary}
            strokeWidth={2.5}
          />
        </TouchableOpacity>
      </Animated.View>
    </ScreenWrapper>
  );
}
