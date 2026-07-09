import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { EventPreviewCard } from "../../components/EventPreviewCard";
import { Input } from "../../components/Input";
import { useRouter } from "expo-router";
import { colors } from "../../constants/colors";
import { FILTERS, type FilterKey } from "../../constants/filters";
import { eventsApi } from "../../services/api";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ImageUp,
  Minus,
  Plus,
} from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  {
    title: "What's the\noccasion?",
    subtitle: "Give your moment a name and type.",
  },
  {
    title: "When does\nit close?",
    subtitle: "Set the end date and how the gallery reveals.",
  },
  {
    title: "How many\nshots?",
    subtitle: "Limit photos per guest, or leave blank for unlimited.",
  },
  {
    title: "Set\nthe mood.",
    subtitle: "All guests will shoot with this filter for a cohesive album.",
  },
  {
    title: "Add a\ncover photo.",
    subtitle: "This is how your event will look to guests.",
  },
  {
    title: "Who's\ninvited?",
    subtitle: "Choose how many guests can join your event.",
  },
];

const EVENT_TYPES = [
  "Wedding",
  "Birthday",
  "Trip",
  "Anniversary",
  "Party",
  "Other",
];
const REVEAL_MODES = ["Instant", "End of Event", "Scheduled"];

// ─── Reusable sub-components ──────────────────────────────────────────────────

const SectionLabel = ({ children }: { children: string }) => (
  <Text
    style={{
      fontFamily: "PlayfairDisplay_700Bold",
      fontSize: 11,
      color: colors.textSecondary,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginBottom: 10,
    }}
  >
    {children}
  </Text>
);

const HintText = ({ children }: { children: string }) => (
  <Text
    style={{
      fontFamily: "Outfit-Regular",
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
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: value ? colors.accent : "rgba(255,255,255,0.08)",
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
        fontFamily: "Outfit-Regular",
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
      Animated.spring(scale, {
        toValue: 0.92,
        useNativeDriver: true,
        speed: 50,
      }),
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
          backgroundColor: selected
            ? colors.accent
            : colors.backgroundSecondary,
          borderWidth: 1,
          borderColor: selected ? colors.accent : "rgba(255,255,255,0.08)",
        }}
      >
        <Text
          style={{
            fontFamily: "PlayfairDisplay_700Bold",
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
  "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=400&auto=format&fit=crop";

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
    style={{ alignItems: "center", marginRight: 14 }}
  >
    <View
      style={{
        width: 88,
        height: 112,
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 2,
        borderColor: selected ? colors.accent : "transparent",
      }}
    >
      <Image
        source={{ uri: FILTER_PREVIEW_URI }}
        style={[
          { width: "100%", height: "100%" },
          item.matrix.length > 0 && ({ filter: item.matrix } as any),
        ]}
        resizeMode="cover"
      />
    </View>
    <Text
      style={{
        marginTop: 8,
        fontFamily: "PlayfairDisplay_700Bold",
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

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View
      style={{
        height: 2,
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 2,
        overflow: "hidden",
        marginBottom: 32,
      }}
    >
      <Animated.View
        style={{
          width,
          height: "100%",
          backgroundColor: colors.accent,
          borderRadius: 2,
        }}
      />
    </View>
  );
};

// ─── Guest tiers (stepper) ────────────────────────────────────────────────────

const GUEST_TIERS = [
  { title: "Starter", participants: 5, price: 0 },
  { title: "Small", participants: 10, price: 2.99 },
  { title: "Medium", participants: 25, price: 7.99 },
  { title: "Large", participants: 50, price: 14.99 },
  { title: "XL", participants: 100, price: 24.99 },
  { title: "XXL", participants: 150, price: 34.99 },
  { title: "Premium", participants: 200, price: 49.99 },
  { title: "Enterprise", participants: "custom", price: 59.99 },
] as const;

type GuestTier = (typeof GUEST_TIERS)[number];

// ─── GuestStepper component ───────────────────────────────────────────────────

const GuestStepper = ({
  index,
  onChange,
}: {
  index: number;
  onChange: (index: number, tier: GuestTier) => void;
}) => {
  const tier = GUEST_TIERS[index];
  const canDec = index > 0;
  const canInc = index < GUEST_TIERS.length - 1;

  // Animated values
  const titleOpacity = useRef(new Animated.Value(1)).current;
  const titleTranslate = useRef(new Animated.Value(0)).current;
  const priceScale = useRef(new Animated.Value(1)).current;
  const trackAnim = useRef(new Animated.Value(index)).current;

  const animateChange = (nextIndex: number, direction: 1 | -1) => {
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(titleTranslate, {
        toValue: direction * -12,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onChange(nextIndex, GUEST_TIERS[nextIndex]);
      titleTranslate.setValue(direction * 12);
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.spring(titleTranslate, {
          toValue: 0,
          useNativeDriver: true,
          damping: 16,
          stiffness: 120,
        }),
        Animated.sequence([
          Animated.spring(priceScale, {
            toValue: 1.12,
            useNativeDriver: true,
            damping: 10,
            stiffness: 200,
          }),
          Animated.spring(priceScale, {
            toValue: 1,
            useNativeDriver: true,
            damping: 12,
            stiffness: 150,
          }),
        ]),
      ]).start();
    });
    Animated.spring(trackAnim, {
      toValue: nextIndex,
      useNativeDriver: false,
      damping: 18,
      stiffness: 100,
    }).start();
  };

  const trackWidth = trackAnim.interpolate({
    inputRange: [0, GUEST_TIERS.length - 1],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  return (
    <View style={{ alignItems: "center" }}>
      {/* Main stepper row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          marginBottom: 32,
        }}
      >
        {/* Decrement */}
        <TouchableOpacity
          onPress={() => canDec && animateChange(index - 1, -1)}
          activeOpacity={canDec ? 0.7 : 1}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: canDec
              ? colors.backgroundSecondary
              : "rgba(255,255,255,0.03)",
            borderWidth: 1,
            borderColor: canDec
              ? "rgba(255,255,255,0.1)"
              : "rgba(255,255,255,0.04)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Minus
            size={20}
            color={canDec ? colors.textPrimary : "rgba(255,255,255,0.15)"}
            strokeWidth={2}
          />
        </TouchableOpacity>

        {/* Center display */}
        <Animated.View
          style={{
            flex: 1,
            alignItems: "center",
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslate }],
            marginHorizontal: 16,
          }}
        >
          <Text
            style={{
              fontFamily: "PlayfairDisplay_700Bold",
              fontSize: 13,
              color: colors.accent,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            {tier.title}
          </Text>
          <Text
            style={{
              fontFamily: "PlayfairDisplay_700Bold",
              fontSize: 52,
              lineHeight: 56,
              color: colors.textPrimary,
              textAlign: "center",
            }}
          >
            {tier.participants === "custom" ? "∞" : String(tier.participants)}
          </Text>
          <Text
            style={{
              fontFamily: "Outfit-Regular",
              fontSize: 13,
              color: colors.textSecondary,
              marginTop: 4,
            }}
          >
            {tier.participants === "custom"
              ? "custom guests"
              : `guest${tier.participants === 1 ? "" : "s"}`}
          </Text>
        </Animated.View>

        {/* Increment */}
        <TouchableOpacity
          onPress={() => canInc && animateChange(index + 1, 1)}
          activeOpacity={canInc ? 0.7 : 1}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: canInc ? colors.accent : "rgba(255,255,255,0.03)",
            borderWidth: 1,
            borderColor: canInc ? colors.accent : "rgba(255,255,255,0.04)",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: canInc ? colors.accent : "transparent",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: canInc ? 0.35 : 0,
            shadowRadius: 10,
            elevation: canInc ? 6 : 0,
          }}
        >
          <Plus
            size={20}
            color={canInc ? "#fff" : "rgba(255,255,255,0.15)"}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>

      {/* Track */}
      <View
        style={{
          width: "100%",
          height: 3,
          backgroundColor: "rgba(255,255,255,0.06)",
          borderRadius: 2,
          marginBottom: 10,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={{
            width: trackWidth,
            height: "100%",
            backgroundColor: colors.accent,
            borderRadius: 2,
          }}
        />
      </View>

      {/* Tier labels */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          width: "100%",
          marginBottom: 28,
        }}
      >
        {GUEST_TIERS.map((t, i) => (
          <View
            key={t.title}
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor:
                i <= index ? colors.accent : "rgba(255,255,255,0.12)",
            }}
          />
        ))}
      </View>

      {/* Price pill */}
      <Animated.View
        style={{
          transform: [{ scale: priceScale }],
          backgroundColor:
            tier.price === 0
              ? "rgba(255,255,255,0.05)"
              : "rgba(198,169,107,0.12)",
          borderRadius: 100,
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor:
            tier.price === 0
              ? "rgba(255,255,255,0.08)"
              : "rgba(198,169,107,0.3)",
        }}
      >
        <Text
          style={{
            fontFamily: "Outfit-SemiBold",
            fontSize: 15,
            color: tier.price === 0 ? colors.textSecondary : colors.accent,
            textAlign: "center",
          }}
        >
          {tier.price === 0 ? "Free" : `$${tier.price.toFixed(2)} one-time`}
        </Text>
      </Animated.View>
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function CreateScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [tierIndex, setTierIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    expires_at: null as Date | null,
    revealMode: "",
    revealDate: null as Date | null,
    shotLimit: "",
    participantLimit: "",
    filter: "none" as FilterKey,
    coverImage: null as string | null,
  });

  const [datePickerOpen, setDatePickerOpen] = useState<
    "expires_at" | "reveal" | null
  >(null);

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
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: direction * -SCREEN_WIDTH * 0.25,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(direction * SCREEN_WIDTH * 0.25);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
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

  const canContinue = () => {
    if (step === 0)
      return formData.name.trim().length > 0 && formData.type.length > 0;
    if (step === 1)
      return (
        formData.revealMode.length > 0 &&
        (formData.revealMode !== "Scheduled" || formData.revealDate !== null)
      );
    return true;
  };

  // ─── Image picker ────────────────────────────────────────────────────────────

  const pickCoverImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
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
    setIsCreating(true);
    try {
      await eventsApi.store({
        name: formData.name,
        plan_id: tierIndex + 1,
        reveal_time: formData.revealMode || undefined,
        expires_at: formData.expires_at?.toISOString() ?? undefined,
        shot_limit: formData.shotLimit
          ? parseInt(formData.shotLimit, 10)
          : undefined,
        participant_limit: formData.participantLimit
          ? parseInt(formData.participantLimit, 10)
          : undefined,
        filter: formData.filter !== "none" ? formData.filter : undefined,
        cover_image_url: formData.coverImage ?? undefined,
      });
      router.push("/(tabs)");
    } catch (e: any) {
      const message =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Something went wrong. Please try again.";
      Alert.alert("Couldn't create event", message);
    } finally {
      setIsCreating(false);
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const expiresAtLabel = formData.expires_at
    ? formData.expires_at.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const revealDateLabel = formData.revealDate
    ? formData.revealDate.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <ScreenWrapper>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          {/* Top bar */}
          <Animated.View
            style={{
              opacity: headerAnim,
              transform: [
                {
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-8, 0],
                  }),
                },
              ],
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 24,
                marginBottom: 24,
              }}
            >
              <TouchableOpacity
                onPress={goBack}
                activeOpacity={0.7}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.backgroundSecondary,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                <ArrowLeft size={18} color={colors.textPrimary} />
              </TouchableOpacity>

              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                {STEPS.map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: i === step ? 20 : 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor:
                        i === step ? colors.accent : "rgba(255,255,255,0.15)",
                    }}
                  />
                ))}
              </View>

              <Text
                style={{
                  marginLeft: "auto",
                  fontFamily: "Outfit-Regular",
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
                fontFamily: "PlayfairDisplay_700Bold",
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
                fontFamily: "Outfit-Regular",
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
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: text })
                  }
                  containerStyle="mb-6"
                  autoFocus
                />
                <SectionLabel>Event Type</SectionLabel>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
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
                  onPress={() => setDatePickerOpen("expires_at")}
                />

                <SectionLabel>Gallery Reveal</SectionLabel>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {REVEAL_MODES.map((mode) => (
                    <Chip
                      key={mode}
                      label={mode}
                      selected={formData.revealMode === mode}
                      onPress={() =>
                        setFormData({ ...formData, revealMode: mode })
                      }
                    />
                  ))}
                </View>

                {formData.revealMode === "Scheduled" && (
                  <View style={{ marginTop: 16 }}>
                    <SectionLabel>Reveal Date & Time</SectionLabel>
                    <DatePickerRow
                      value={revealDateLabel}
                      placeholder="Select reveal date & time"
                      onPress={() => setDatePickerOpen("reveal")}
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
                  onChangeText={(text) =>
                    setFormData({ ...formData, shotLimit: text })
                  }
                  autoFocus
                />
                <HintText>
                  Max photos each guest can upload. Leave blank for unlimited.
                </HintText>
              </View>
            )}

            {/* ── Step 3: Filter ── */}
            {step === 3 && (
              <View>
                <View style={{ flexDirection: "row", paddingBottom: 8 }}>
                  {FILTERS.map((f) => (
                    <FilterCard
                      key={f.key}
                      item={f}
                      selected={formData.filter === f.key}
                      onPress={() =>
                        setFormData({ ...formData, filter: f.key })
                      }
                    />
                  ))}
                </View>
                <HintText>
                  Guests won't be able to override this. Choose wisely.
                </HintText>
              </View>
            )}

            {/* ── Step 4: Cover photo + Preview ── */}
            {step === 4 && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 160 }}
              >
                {/* Image picker */}
                <TouchableOpacity
                  onPress={pickCoverImage}
                  activeOpacity={0.8}
                  style={{
                    height: 180,
                    borderRadius: 20,
                    overflow: "hidden",
                    backgroundColor: colors.backgroundSecondary,
                    borderWidth: formData.coverImage ? 0 : 1.5,
                    borderColor: "rgba(255,255,255,0.1)",
                    borderStyle: "dashed",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                  }}
                >
                  {formData.coverImage ? (
                    <Image
                      source={{ uri: formData.coverImage }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={{ alignItems: "center", gap: 10 }}>
                      <View
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 26,
                          backgroundColor: "rgba(255,255,255,0.06)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ImageUp size={24} color={colors.textSecondary} />
                      </View>
                      <Text
                        style={{
                          fontFamily: "Outfit-Regular",
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
                      ? formData.expires_at.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : ""
                  }
                  participants={formData.participantLimit}
                  shots={formData.shotLimit}
                  coverUri={formData.coverImage}
                  filter={formData.filter}
                />
              </ScrollView>
            )}

            {/* ── Step 5: Who's invited (stepper) ── */}
            {step === 5 && (
              <View
                style={{ flex: 1, justifyContent: "center", paddingBottom: 80 }}
              >
                <GuestStepper
                  index={tierIndex}
                  onChange={(i, tier) => {
                    setTierIndex(i);
                    setFormData({
                      ...formData,
                      participantLimit:
                        tier.participants === "custom"
                          ? ""
                          : String(tier.participants),
                    });
                  }}
                />
                <HintText>
                  {GUEST_TIERS[tierIndex].price === 0
                    ? "Starter is free — upgrade anytime after creating your event."
                    : "One-time charge. No subscription required."}
                </HintText>
              </View>
            )}
          </Animated.View>

          {/* Date pickers */}
          <DateTimePickerModal
            isVisible={datePickerOpen === "expires_at"}
            mode="date"
            minimumDate={new Date()}
            date={formData.expires_at ?? new Date()}
            onConfirm={(date) => {
              setFormData({ ...formData, expires_at: date });
              setDatePickerOpen(null);
            }}
            onCancel={() => setDatePickerOpen(null)}
            display={Platform.OS === "ios" ? "inline" : "default"}
            themeVariant="dark"
            isDarkModeEnabled
            accentColor={colors.accent}
            buttonTextColorIOS={colors.accent}
            pickerContainerStyleIOS={{
              backgroundColor: colors.backgroundPrimary,
            }}
            pickerStyleIOS={{ backgroundColor: colors.backgroundPrimary }}
          />
          <DateTimePickerModal
            isVisible={datePickerOpen === "reveal"}
            mode="datetime"
            minimumDate={formData.expires_at ?? new Date()}
            date={formData.revealDate ?? formData.expires_at ?? new Date()}
            onConfirm={(date) => {
              setFormData({ ...formData, revealDate: date });
              setDatePickerOpen(null);
            }}
            onCancel={() => setDatePickerOpen(null)}
            display={Platform.OS === "ios" ? "inline" : "default"}
            themeVariant="dark"
            isDarkModeEnabled
            accentColor={colors.accent}
            buttonTextColorIOS={colors.accent}
            pickerContainerStyleIOS={{
              backgroundColor: colors.backgroundPrimary,
            }}
            pickerStyleIOS={{ backgroundColor: colors.backgroundPrimary }}
          />
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      {/* Floating CTA */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: 130,
          right: 24,
          opacity: headerAnim,
          transform: [
            {
              translateY: headerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 0],
              }),
            },
          ],
        }}
        pointerEvents="box-none"
      >
        {(step === 1 || step === 4) && (
          <TouchableOpacity
            onPress={goNext}
            activeOpacity={0.7}
            style={{ marginBottom: 12, alignItems: "center" }}
          >
            <Text
              style={{
                fontFamily: "Outfit-Regular",
                fontSize: 13,
                color: colors.textSecondary,
                textDecorationLine: "underline",
              }}
            >
              Skip
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={goNext}
          disabled={!canContinue() || isCreating}
          activeOpacity={0.85}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            backgroundColor: canContinue()
              ? colors.accent
              : colors.backgroundSecondary,
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
          {isCreating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text
                style={{
                  fontFamily: "Outfit-SemiBold",
                  fontSize: 15,
                  color: canContinue() ? "#fff" : colors.textSecondary,
                }}
              >
                {step === STEPS.length - 1 ? "Create" : "Continue"}
              </Text>
              <ArrowRight
                size={18}
                color={canContinue() ? "#fff" : colors.textSecondary}
                strokeWidth={2.5}
              />
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </ScreenWrapper>
  );
}
