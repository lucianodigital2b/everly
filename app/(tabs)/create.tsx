import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Input } from '../../components/Input';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';
import { eventsApi } from '../../services/api';
import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { title: "What's the\noccasion?", subtitle: 'Give your moment a name and type.' },
  { title: 'When is\nit happening?', subtitle: 'Set the date and how the gallery reveals.' },
  { title: 'How many\nshots?', subtitle: 'Limit photos per guest, or leave blank for unlimited.' },
  { title: 'Who\'s\ninvited?', subtitle: 'Set a guest limit, or leave blank for unlimited.' },
  { title: 'Set\nthe mood.', subtitle: 'All guests will shoot with this filter for a cohesive album.' },
];

const EVENT_TYPES = ['Wedding', 'Birthday', 'Trip', 'Anniversary', 'Party', 'Other'];
const REVEAL_MODES = ['Instant', 'End of Event', 'Scheduled'];

// ─── Filter presets ────────────────────────────────────────────────────────────

const PREVIEW_URI = 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=400&auto=format&fit=crop';

export type FilterKey = 'none' | 'warm' | 'film' | 'mono';

const FILTERS: { key: FilterKey; label: string; matrix: object[] }[] = [
  {
    key: 'none',
    label: 'Natural',
    matrix: [],
  },
  {
    key: 'warm',
    label: 'Warm',
    matrix: [{ saturate: 1.4 }, { brightness: 1.08 }, { contrast: 1.05 }],
  },
  {
    key: 'film',
    label: 'Film',
    matrix: [{ sepia: 0.55 }, { contrast: 1.15 }, { brightness: 0.97 }],
  },
  {
    key: 'mono',
    label: 'Mono',
    matrix: [{ grayscale: 1 }, { contrast: 1.1 }],
  },
];

// ─── FilterCard component ──────────────────────────────────────────────────────

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
    style={{
      alignItems: 'center',
      marginRight: 14,
    }}
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
        source={{ uri: PREVIEW_URI }}
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

// ─── Chip component ───────────────────────────────────────────────────────────

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

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

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
  });

  const [datePickerOpen, setDatePickerOpen] = useState<'expires_at' | 'reveal' | null>(null);

  // Animation refs
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  // Animate header in on mount
  React.useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 18,
      stiffness: 80,
      delay: 100,
    } as any).start();
  }, []);

  const animateToStep = (nextStep: number) => {
    const direction = nextStep > step ? 1 : -1;

    // Fade + slide out current
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(slideAnim, {
        toValue: direction * -SCREEN_WIDTH * 0.25,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(direction * SCREEN_WIDTH * 0.25);

      // Slide + fade in next
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 18,
          stiffness: 100,
        }),
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

  const handleCreate = async () => {
    try {
      await eventsApi.store({
        name: formData.name,
        plan_id: 1,
        reveal_time: formData.revealMode || undefined,
        expires_at: formData.expires_at?.toISOString() ?? undefined,
        shot_limit: formData.shotLimit ? parseInt(formData.shotLimit, 10) : undefined,
        participant_limit: formData.participantLimit ? parseInt(formData.participantLimit, 10) : undefined,
        filter: formData.filter !== 'none' ? formData.filter : undefined,
      });
    } catch (e) {
      console.warn('Failed to create event:', e);
    }
    router.push('/(tabs)');
  };

  const canContinue = () => {
    if (step === 0) return formData.name.trim().length > 0 && formData.type.length > 0;
    if (step === 1) return formData.revealMode.length > 0 && (formData.revealMode !== 'Scheduled' || formData.revealDate !== null);
    return true;
  };

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
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 24 }}>
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

            {/* Step dots */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {STEPS.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: i === step ? 20 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: i === step ? colors.accent : 'rgba(255,255,255,0.15)',
                    transition: 'width 0.3s',
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
          style={{
            flex: 1,
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          }}
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
              marginBottom: 36,
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
              <Text
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 11,
                  color: colors.textSecondary,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  marginBottom: 12,
                }}
              >
                Event Type
              </Text>
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
              {/* Event date picker trigger */}
              <Text
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 11,
                  color: colors.textSecondary,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                End Date
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setDatePickerOpen('expires_at')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: formData.expires_at ? colors.accent : 'rgba(255,255,255,0.08)',
                  paddingHorizontal: 16,
                  height: 56,
                  marginBottom: 24,
                }}
              >
                <Calendar size={18} color={formData.expires_at ? colors.accent : colors.textSecondary} style={{ marginRight: 12 }} />
                <Text
                  style={{
                    fontFamily: 'Inter_400Regular',
                    fontSize: 15,
                    color: formData.expires_at ? colors.textPrimary : colors.textSecondary,
                    flex: 1,
                  }}
                >
                  {formData.expires_at
                    ? formData.expires_at.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                    : 'Select an end date'}
                </Text>
              </TouchableOpacity>

              <Text
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 11,
                  color: colors.textSecondary,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  marginBottom: 12,
                }}
              >
                Gallery Reveal
              </Text>
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

              {/* Reveal datetime picker trigger */}
              {formData.revealMode === 'Scheduled' && (
                <Animated.View style={{ marginTop: 16 }}>
                  <Text
                    style={{
                      fontFamily: 'Inter_600SemiBold',
                      fontSize: 11,
                      color: colors.textSecondary,
                      letterSpacing: 1.2,
                      textTransform: 'uppercase',
                      marginBottom: 8,
                    }}
                  >
                    Reveal Date & Time
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setDatePickerOpen('reveal')}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.backgroundSecondary,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: formData.revealDate ? colors.accent : 'rgba(255,255,255,0.08)',
                      paddingHorizontal: 16,
                      height: 56,
                    }}
                  >
                    <Calendar size={18} color={formData.revealDate ? colors.accent : colors.textSecondary} style={{ marginRight: 12 }} />
                    <Text
                      style={{
                        fontFamily: 'Inter_400Regular',
                        fontSize: 15,
                        color: formData.revealDate ? colors.textPrimary : colors.textSecondary,
                        flex: 1,
                      }}
                    >
                      {formData.revealDate
                        ? formData.revealDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'Select reveal date & time'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
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
              <Text
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 13,
                  color: colors.textSecondary,
                  marginTop: 16,
                  lineHeight: 20,
                  opacity: 0.7,
                }}
              >
                Max photos each guest can upload. Leave blank for unlimited.
              </Text>
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
              <Text
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 13,
                  color: colors.textSecondary,
                  marginTop: 16,
                  lineHeight: 20,
                  opacity: 0.7,
                }}
              >
                Max guests who can join this event. Depends on your plan.
              </Text>
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
              <Text
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 13,
                  color: colors.textSecondary,
                  marginTop: 8,
                  lineHeight: 20,
                  opacity: 0.7,
                }}
              >
                Guests won't be able to override this. Choose wisely.
              </Text>
            </View>
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
          <ArrowRight size={18} color={canContinue() ? '#fff' : colors.textSecondary} strokeWidth={2.5} />
        </TouchableOpacity>
      </Animated.View>
    </ScreenWrapper>
  );
}
