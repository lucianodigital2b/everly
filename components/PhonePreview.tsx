import React from "react";
import {
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";
import { ImageUp } from "lucide-react-native";
import { colors } from "../constants/colors";
import { getFilterMatrix, type FilterKey } from "../constants/filters";

// ─── Geometry ─────────────────────────────────────────────────────────────────

// The mock is sized off the *height* left under the step heading, then the
// width follows from the phone's aspect ratio — a device mock that overflows
// vertically reads as a bug, a narrow one just reads as a smaller phone. The
// budget also has to leave room for the cover picker below it.
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const PHONE_H = Math.min(SCREEN_H * 0.42, 440, SCREEN_W * 1.05);
const PHONE_W = PHONE_H * 0.472;

// Every inner measurement is expressed against a 240pt-wide reference phone so
// the frame keeps its proportions on small and large screens alike.
const s = (n: number) => (n * PHONE_W) / 240;

const RIM = s(3); // polished metal edge
const BEZEL = s(4); // black border between rim and screen
const R_OUTER = s(42);
const R_SCREEN = R_OUTER - RIM - BEZEL;

// The bloom extends well past the frame; it's drawn behind everything and
// clipped by nothing, so the step needs no extra padding for it.
// Capped to the viewport: an Android ScrollView clips at its own bounds, and a
// bloom cut off mid-fade would show a hard edge.
const GLOW_W = Math.min(PHONE_W * 2.1, SCREEN_W);
const GLOW_H = PHONE_H * 1.42;

// ─── Status bar ───────────────────────────────────────────────────────────────

const SignalBars = ({ tint }: { tint: string }) => (
  <View style={{ flexDirection: "row", alignItems: "flex-end", gap: s(1.6) }}>
    {[s(3), s(4.5), s(6), s(7.5)].map((h, i) => (
      <View
        key={i}
        style={{
          width: s(2.6),
          height: h,
          borderRadius: s(1),
          backgroundColor: tint,
        }}
      />
    ))}
  </View>
);

const WifiGlyph = ({ tint }: { tint: string }) => (
  // Three stacked arcs, faked with rotated square outlines — cheaper than an
  // icon font and it scales with the mock.
  <View
    style={{
      width: s(11),
      height: s(8),
      alignItems: "center",
      justifyContent: "flex-end",
    }}
  >
    {[s(11), s(7.5), s(4)].map((w, i) => (
      <View
        key={i}
        style={{
          position: "absolute",
          bottom: s(i * 2.4),
          width: w,
          height: w * 0.55,
          borderTopLeftRadius: w,
          borderTopRightRadius: w,
          borderWidth: s(1.4),
          borderBottomWidth: 0,
          borderColor: tint,
        }}
      />
    ))}
  </View>
);

const BatteryGlyph = ({ tint }: { tint: string }) => (
  <View style={{ flexDirection: "row", alignItems: "center" }}>
    <View
      style={{
        width: s(16),
        height: s(8),
        borderRadius: s(2.6),
        borderWidth: s(1.2),
        borderColor: tint,
        padding: s(1.2),
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: "72%",
          height: "100%",
          borderRadius: s(1.2),
          backgroundColor: tint,
        }}
      />
    </View>
    <View
      style={{
        width: s(1.4),
        height: s(3.4),
        marginLeft: s(0.8),
        borderRadius: s(1),
        backgroundColor: tint,
      }}
    />
  </View>
);

const StatusBar = ({ tint }: { tint: string }) => {
  // Rendered once per mount — a ticking clock inside a static mock would draw
  // the eye away from the photo, which is the thing being previewed.
  const time = React.useMemo(
    () =>
      new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    []
  );

  return (
    <View style={styles.statusBar} pointerEvents="none">
      <Text style={[styles.statusTime, { color: tint }]}>{time}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: s(5) }}>
        <SignalBars tint={tint} />
        <WifiGlyph tint={tint} />
        <BatteryGlyph tint={tint} />
      </View>
    </View>
  );
};

// ─── Overlay content ──────────────────────────────────────────────────────────

// Depth of the darkened, blurred band the title and date sit on.
const VEIL_H = s(170);

// Fade curve shared by the mask and the darkening gradient, so the blur and the
// black arrive together instead of one leading the other.
const VEIL_STOPS = [0, 0.34, 0.68, 1] as const;

// iOS masks a single full-strength blur with that curve — a genuinely
// continuous ramp. On Android the mask renders its children offscreen, which
// the dimezis blur can't draw into, so the ramp is approximated there by
// stacking bands that get shorter and stronger toward the bottom; every seam
// lands inside the band below it and the black gradient hides the rest.
const VEIL_STEPS = [
  { ratio: 1, intensity: 7 },
  { ratio: 0.74, intensity: 15 },
  { ratio: 0.5, intensity: 26 },
  { ratio: 0.28, intensity: 40 },
];

const VeilMask = () => (
  <LinearGradient
    colors={["transparent", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.85)", "#000"]}
    locations={VEIL_STOPS}
    style={StyleSheet.absoluteFillObject}
  />
);

const VeilBlur = () =>
  Platform.OS === "ios" ? (
    <MaskedView
      style={StyleSheet.absoluteFillObject}
      maskElement={<VeilMask />}
    >
      <BlurView intensity={42} tint="dark" style={StyleSheet.absoluteFill} />
    </MaskedView>
  ) : (
    <>
      {VEIL_STEPS.map((step) => (
        <BlurView
          key={step.ratio}
          intensity={step.intensity}
          tint="dark"
          experimentalBlurMethod="dimezisBlurView"
          style={[styles.veilBand, { height: VEIL_H * step.ratio }]}
        />
      ))}
    </>
  );

/** Blurred black shelf under the caption, easing out to nothing at the top. */
const BottomVeil = () => (
  <View style={styles.veil} pointerEvents="none">
    <VeilBlur />
    <LinearGradient
      colors={[
        "transparent",
        "rgba(0,0,0,0.28)",
        "rgba(0,0,0,0.62)",
        "rgba(0,0,0,0.86)",
      ]}
      locations={VEIL_STOPS}
      style={StyleSheet.absoluteFillObject}
    />
  </View>
);

// ─── Component ────────────────────────────────────────────────────────────────

interface PhonePreviewProps {
  title: string;
  date: string;
  coverUri: string | null;
  filter?: FilterKey;
  onPress?: () => void;
}

export const PhonePreview = ({
  title,
  date,
  coverUri,
  filter = "none",
  onPress,
}: PhonePreviewProps) => {
  const matrix = getFilterMatrix(filter);
  // With no cover the screen is a blush well, so the status bar and the prompt
  // flip to ink instead of white.
  const tint = coverUri ? "rgba(255,255,255,0.95)" : colors.textSecondary;

  return (
    <View style={styles.stage}>
      {/* Blush bloom behind the device */}
      <Svg
        width={GLOW_W}
        height={GLOW_H}
        style={styles.glow}
        pointerEvents="none"
      >
        <Defs>
          <RadialGradient id="everlyGlowWide" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.accent} stopOpacity={0.42} />
            <Stop offset="0.55" stopColor={colors.accent} stopOpacity={0.16} />
            <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="everlyGlowCore" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.accent} stopOpacity={0.5} />
            <Stop offset="0.6" stopColor={colors.accent} stopOpacity={0.22} />
            <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse
          cx={GLOW_W / 2}
          cy={GLOW_H / 2}
          rx={GLOW_W / 2}
          ry={GLOW_H / 2}
          fill="url(#everlyGlowWide)"
        />
        <Ellipse
          cx={GLOW_W / 2}
          cy={GLOW_H / 2}
          rx={PHONE_W * 0.82}
          ry={PHONE_H * 0.6}
          fill="url(#everlyGlowCore)"
        />
      </Svg>

      <TouchableOpacity
        activeOpacity={onPress ? 0.92 : 1}
        onPress={onPress}
        disabled={!onPress}
        style={styles.frame}
      >
        {/* Side buttons, tucked under the rim so only their edge shows */}
        <View style={[styles.btn, styles.btnLeft, { top: PHONE_H * 0.16 }]} />
        <View
          style={[
            styles.btn,
            styles.btnLeft,
            { top: PHONE_H * 0.24, height: s(30) },
          ]}
        />
        <View
          style={[
            styles.btn,
            styles.btnLeft,
            { top: PHONE_H * 0.325, height: s(30) },
          ]}
        />
        <View
          style={[
            styles.btn,
            styles.btnRight,
            { top: PHONE_H * 0.255, height: s(46) },
          ]}
        />

        {/* Black bezel */}
        <View style={styles.bezel}>
          {/* Screen */}
          <View style={styles.screen}>
            {coverUri ? (
              <Image
                source={{ uri: coverUri }}
                style={[
                  StyleSheet.absoluteFillObject,
                  matrix.length > 0 && ({ filter: matrix } as any),
                ]}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <ImageUp size={s(22)} color={colors.accentDeep} />
                </View>
                <Text style={styles.emptyText} numberOfLines={1}>
                  Tap to add a cover photo
                </Text>
              </View>
            )}

            {coverUri && (
              <>
                {/* Top scrim so the status bar stays legible on light photos */}
                <LinearGradient
                  colors={["rgba(0,0,0,0.35)", "transparent"]}
                  style={styles.topScrim}
                  pointerEvents="none"
                />

                <BottomVeil />

                <View style={styles.overlay} pointerEvents="none">
                  <Text style={styles.title} numberOfLines={2}>
                    {title || "Your Event"}
                  </Text>
                  {!!date && <Text style={styles.date}>{date}</Text>}
                </View>
              </>
            )}

            <StatusBar tint={tint} />

            {/* Dynamic island */}
            <View style={styles.island} pointerEvents="none" />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  stage: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: s(10),
  },
  glow: {
    position: "absolute",
    top: PHONE_H / 2 - GLOW_H / 2,
  },
  frame: {
    width: PHONE_W,
    height: PHONE_H,
    borderRadius: R_OUTER,
    padding: RIM,
    backgroundColor: "#3A3A3E", // brushed metal rail
    shadowColor: "#7A4450",
    shadowOffset: { width: 0, height: s(16) },
    shadowOpacity: 0.3,
    shadowRadius: s(30),
    elevation: 14,
  },
  bezel: {
    flex: 1,
    borderRadius: R_OUTER - RIM,
    padding: BEZEL,
    backgroundColor: "#0B0B0D",
  },
  screen: {
    flex: 1,
    borderRadius: R_SCREEN,
    overflow: "hidden",
    backgroundColor: colors.surface2,
  },
  btn: {
    position: "absolute",
    width: s(2.6),
    height: s(18),
    backgroundColor: "#2C2C30",
  },
  btnLeft: {
    left: -s(2),
    borderTopLeftRadius: s(2),
    borderBottomLeftRadius: s(2),
  },
  btnRight: {
    right: -s(2),
    borderTopRightRadius: s(2),
    borderBottomRightRadius: s(2),
  },
  island: {
    position: "absolute",
    top: s(9),
    alignSelf: "center",
    width: PHONE_W * 0.33,
    height: PHONE_W * 0.095,
    borderRadius: 999,
    backgroundColor: "#000",
  },
  topScrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: s(60),
  },
  statusBar: {
    position: "absolute",
    top: s(11),
    left: s(18),
    right: s(16),
    height: PHONE_W * 0.095,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusTime: {
    fontFamily: "Inter-SemiBold",
    fontSize: s(11),
    letterSpacing: -0.2,
  },
  empty: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: s(12),
    paddingHorizontal: s(8),
    backgroundColor: colors.surface2,
  },
  emptyIcon: {
    width: s(52),
    height: s(52),
    borderRadius: s(26),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(230,169,180,0.28)",
  },
  emptyText: {
    fontFamily: "Inter-SemiBold",
    // Sized to clear the screen width on one line — the prompt reads as a
    // single instruction, not a stacked pair of fragments.
    fontSize: s(12.5),
    lineHeight: s(18),
    letterSpacing: -0.2,
    textAlign: "center",
    color: colors.textSecondary,
  },
  veil: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: VEIL_H,
    overflow: "hidden",
  },
  veilBand: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: s(26),
    paddingHorizontal: s(16),
    alignItems: "center",
  },
  title: {
    fontFamily: "Inter-ExtraBold",
    fontSize: s(22),
    lineHeight: s(26),
    letterSpacing: -0.5,
    textAlign: "center",
    color: "#fff",
  },
  date: {
    fontFamily: "Inter-Medium",
    fontSize: s(12),
    lineHeight: s(16),
    letterSpacing: s(0.6),
    textAlign: "center",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.82)",
    marginTop: s(8),
  },
});
