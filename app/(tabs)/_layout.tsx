import { Tabs, TabList, TabTrigger, TabSlot } from "expo-router/ui";
import { usePathname } from "expo-router";
import type { TabTriggerSlotProps } from "expo-router/ui";
import { View, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Home, Plus, Settings } from "lucide-react-native";
import { forwardRef } from "react";
import { colors } from "../../constants/colors";
import { GlassSurface } from "../../components/GlassSurface";

// A single nav slot inside the glass pill. Active → gold gradient circle.
const NavSlot = forwardRef<
  View,
  TabTriggerSlotProps & { icon: "home" | "settings" }
>(({ isFocused, onPress, icon }, ref) => {
  const Icon = icon === "home" ? Home : Settings;
  return (
    <Pressable
      ref={ref}
      onPress={onPress}
      style={[styles.slot, icon === "home" ? styles.slotFirst : styles.slotLast]}
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
  const hideBar = usePathname() === "/create";
  return (
    <Tabs>
      <TabSlot />
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
        <TabTrigger name="settings" href="/(tabs)/settings" asChild>
          <NavSlot icon="settings" />
        </TabTrigger>

        <TabTrigger name="create" href="/(tabs)/create" asChild>
          <CreateButton />
        </TabTrigger>
      </TabList>
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
const PILL_W = PILL_PAD * 2 + SLOT * 2 + SLOT_GAP;
const PILL_H = PILL_PAD * 2 + SLOT;

const styles = StyleSheet.create({
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
