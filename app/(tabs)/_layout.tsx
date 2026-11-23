import { Tabs, TabList, TabTrigger, TabSlot } from "expo-router/ui";
import { usePathname } from "expo-router";
import type { TabTriggerSlotProps } from "expo-router/ui";
import { View, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Home, Plus, Settings, CalendarHeart, Images } from "lucide-react-native";
import { forwardRef, useCallback, useLayoutEffect, useRef, type ReactNode } from "react";
import { Screen } from "react-native-screens";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { colors } from "../../constants/colors";
import { GlassSurface } from "../../components/GlassSurface";
import { AssistantFab } from "../../components/AssistantFab";
import { usePlannerStore } from "../../zustand/planner";

// ─── Tab switch motion ────────────────────────────────────────────────────────
// TabSlot's default renderer only flips the old tab to `display: none` and the
// new one to `flex`, so changing tabs was a hard cut. Each tab now slides in
// from the side it sits on in the bar (a tab to the right comes in from the
// right) with a fade, the way a push does. The outgoing tab is hidden at once,
// so only the incoming one moves.
const TAB_EASE = Easing.out(Easing.cubic);
const TAB_DURATION = 260;
const TAB_FADE = 140;
// How far in from the side the incoming tab starts, as a share of the width.
const TAB_OFFSET = 0.3;

function TabScene({
  isFocused,
  index,
  lastIndex,
  children,
}: {
  isFocused: boolean;
  index: number;
  lastIndex: { current: number };
  children: ReactNode;
}) {
  const { width } = useWindowDimensions();
  const reduced = useReducedMotion();
  // A tab mounted already focused (the first one at launch) starts settled.
  const x = useSharedValue(0);
  const opacity = useSharedValue(isFocused && index === lastIndex.current ? 1 : 0);
  const wasFocused = useRef(false);

  useLayoutEffect(() => {
    if (!isFocused) {
      // Hidden by display: none from here; park it invisible so the frame it
      // reappears on never flashes it in its final spot.
      if (wasFocused.current) opacity.set(0);
      wasFocused.current = false;
      return;
    }
    if (wasFocused.current) return;
    wasFocused.current = true;

    const from = lastIndex.current;
    lastIndex.current = index;
    if (from === index || reduced) {
      x.set(0);
      opacity.set(1);
      return;
    }
    // Jump to the start, then animate, in the same tick: both writes reach the
    // UI thread in order, so the slide starts on the very next frame. (A
    // zero-length withTiming inside withSequence still burns a frame.)
    const dir = index > from ? 1 : -1;
    x.set(dir * width * TAB_OFFSET);
    x.set(withTiming(0, { duration: TAB_DURATION, easing: TAB_EASE }));
    // The fade is much shorter than the slide: the tab is readable almost at
    // once, instead of sitting near-invisible for the first frames.
    opacity.set(0);
    opacity.set(withTiming(1, { duration: TAB_FADE, easing: TAB_EASE }));
  }, [isFocused]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ translateX: x.get() }],
  }));

  return <Animated.View style={[styles.scene, style]}>{children}</Animated.View>;
}

// A single nav slot inside the glass pill. Active → gold gradient circle.
const NavSlot = forwardRef<
  View,
  TabTriggerSlotProps & { icon: "home" | "plan" | "albums" | "settings" }
>(({ isFocused, onPress, icon }, ref) => {
  const Icon =
    icon === "home" ? Home : icon === "plan" ? CalendarHeart : icon === "albums" ? Images : Settings;
  return (
    <Pressable
      ref={ref}
      onPress={onPress}
      style={[
        styles.slot,
        icon === "home" && styles.slotFirst,
        (icon === "plan" || icon === "albums") && styles.slotMiddle,
        icon === "settings" && styles.slotLast,
      ]}
    >
      {isFocused ? (
        <LinearGradient
          colors={[colors.accentBright, colors.accentDeep]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.slotActive}
        >
          <Icon size={22} color="#2E2429" strokeWidth={2.2} />
        </LinearGradient>
      ) : (
        <Icon size={23} color={colors.textPrimary} strokeWidth={2} />
      )}
    </Pressable>
  );
});

// Detached frosted "create" circle with a gold plus.
const CreateButton = forwardRef<View, TabTriggerSlotProps>(({ onPress }, ref) => (
  <Pressable ref={ref} onPress={onPress} style={styles.createOuter}>
    <View style={styles.createShadow}>
      <GlassSurface shape="circle" bordered={false} style={styles.createGlass}>
        <Plus size={25} color={colors.accentDeep} strokeWidth={2.4} />
      </GlassSurface>
    </View>
  </Pressable>
));

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  // The create wizard is a full-screen flow with its own back button and CTA —
  // the nav pill only competes with them there. Hidden with `display: "none"`
  // rather than unmounted: expo-router registers TabTriggers by walking
  // TabList's children, so dropping them would silently kill navigation.
  const pathname = usePathname();
  const hideBar = pathname === "/create";
  // The assistant FAB lives where planning happens: Home and Plan. Not over
  // the albums' photo grid or Settings. Hidden on Plan while its setup wizard
  // (no wedding date yet) is up, so it never competes with the wizard's CTA.
  const hasWeddingDate = usePlannerStore((s) => !!s.weddingDate);
  const showAssistant =
    pathname === "/" || (pathname === "/plan" && hasWeddingDate);

  // Index of the tab on screen, so the next one knows which side to come from.
  const lastIndex = useRef(0);
  // Same as expo-router's defaultTabsSlotRender, with the tab wrapped in
  // TabScene for the slide.
  const renderTab = useCallback(
    (descriptor: any, { index, isFocused, loaded, detachInactiveScreens }: any) => {
      const { lazy = true, unmountOnBlur, freezeOnBlur } = descriptor.options;
      if (unmountOnBlur && !isFocused) return null;
      if (lazy && !loaded && !isFocused) return null;
      return (
        <Screen
          key={descriptor.route.key}
          enabled={detachInactiveScreens}
          activityState={isFocused ? 2 : 0}
          freezeOnBlur={freezeOnBlur}
          style={[styles.tabScreen, isFocused ? styles.tabFocused : styles.tabUnfocused]}
        >
          <TabScene isFocused={isFocused} index={index} lastIndex={lastIndex}>
            {descriptor.render()}
          </TabScene>
        </Screen>
      );
    },
    [],
  );

  return (
    <Tabs>
      <TabSlot renderFn={renderTab} />
      {/* TabTriggers must be DIRECT children of TabList — expo-router's trigger
          parser only descends into Fragments and TabList, so wrapping them in a
          View silently unregisters them and their onPress becomes a no-op.
          The glass pill is therefore a backdrop behind the first two slots. */}
      <TabList
        style={[
          styles.bar,
          { bottom: insets.bottom + 14 },
          hideBar && styles.barHidden,
        ]}
      >
        <View style={styles.pill} pointerEvents="none">
          <GlassSurface
            shape="capsule"
            bordered={false}
            style={[StyleSheet.absoluteFill, styles.pillGlass] as any}
          />
        </View>

        <TabTrigger name="index" href="/(tabs)" asChild>
          <NavSlot icon="home" />
        </TabTrigger>
        <TabTrigger name="plan" href="/(tabs)/plan" asChild>
          <NavSlot icon="plan" />
        </TabTrigger>
        <TabTrigger name="albums" href="/(tabs)/albums" asChild>
          <NavSlot icon="albums" />
        </TabTrigger>
        <TabTrigger name="settings" href="/(tabs)/settings" asChild>
          <NavSlot icon="settings" />
        </TabTrigger>

        <TabTrigger name="create" href="/(tabs)/create" asChild>
          <CreateButton />
        </TabTrigger>
      </TabList>

      {/* Right edge, a little above the nav pill (pill bottom + pill + gap). */}
      {showAssistant && <AssistantFab bottom={insets.bottom + 14 + PILL_H + 18} />}
    </Tabs>
  );
}

const GLASS_BORDER = "rgba(255,255,255,0.7)";
// Sits *under* the glass so the bar keeps a legible base over photos, where a
// purely translucent surface leaves the icons unreadable.
const GLASS_BASE = "rgba(255,255,255,0.55)";
const LIFT = {
  shadowColor: "#3A2E14",
  shadowOffset: { width: 0, height: 14 },
  shadowOpacity: 0.28,
  shadowRadius: 22,
  elevation: 10,
};

const SLOT = 46;
const PILL_PAD = 7;
const SLOT_GAP = 4;
const PILL_W = PILL_PAD * 2 + SLOT * 4 + SLOT_GAP * 3;
const PILL_H = PILL_PAD * 2 + SLOT;

const styles = StyleSheet.create({
  // tabScreen / tabFocused / tabUnfocused copy expo-router's TabSlot styles.
  tabScreen: { flex: 1, position: "relative", height: "100%" },
  tabFocused: { zIndex: 1, display: "flex", flexShrink: 0, flexGrow: 1 },
  tabUnfocused: { zIndex: -1, display: "none", flexShrink: 1, flexGrow: 0 },
  scene: { flex: 1, backgroundColor: colors.backgroundPrimary },
  bar: {
    position: "absolute",
    bottom: 26,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  barHidden: { display: "none" },
  // Backdrop only — the two nav slots sit on top of it as siblings.
  pill: {
    position: "absolute",
    left: 0,
    top: 0,
    width: PILL_W,
    height: PILL_H,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    backgroundColor: GLASS_BASE,
    ...LIFT, // shadow lives here (no overflow:hidden, so it isn't clipped)
  },
  pillGlass: {
    borderRadius: 999, // rounds the blur; GlassSurface adds overflow:hidden
  },
  slot: {
    width: SLOT,
    height: SLOT,
    borderRadius: SLOT / 2,
    marginVertical: PILL_PAD,
    justifyContent: "center",
    alignItems: "center",
  },
  slotFirst: { marginLeft: PILL_PAD, marginRight: SLOT_GAP / 2 },
  slotMiddle: { marginHorizontal: SLOT_GAP / 2 },
  slotLast: { marginLeft: SLOT_GAP / 2, marginRight: PILL_PAD },
  slotActive: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.accentDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  createOuter: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12, // detaches the create circle from the pill
  },
  createShadow: {
    borderRadius: 27,
    ...LIFT, // shadow on the outer wrapper so the glass clip doesn't cut it
  },
  createGlass: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    backgroundColor: GLASS_BASE,
    justifyContent: "center",
    alignItems: "center",
  },
});
