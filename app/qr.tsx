import React, { useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Clipboard,
  Dimensions,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { X, Copy, Check } from "lucide-react-native";
import { colors } from "../constants/colors";
import { joinLink } from "../constants/links";

const COPY_EASE = Easing.bezier(0.23, 1, 0.32, 1);

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// Big enough that a phone camera locks on from a comfortable distance.
const QR_SIZE = Math.min(SCREEN_WIDTH - 128, 260);

export default function QrScreen() {
  const { token, name } = useLocalSearchParams<{
    token?: string;
    name?: string;
  }>();

  // Both labels stay mounted and cross-fade. Swapping them on a `copied` flag
  // meant the button was empty for the frame between the state change and the
  // fade starting, and the way back was an instant pop.
  const copiedAnim = useSharedValue(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pressing, setPressing] = React.useState(false);

  const copyStyle = useAnimatedStyle(() => ({ opacity: 1 - copiedAnim.get() }));
  const copiedStyle = useAnimatedStyle(() => ({ opacity: copiedAnim.get() }));

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const link = token ? joinLink(token) : "";

  const handleCopy = () => {
    if (!link) return;
    Clipboard.setString(link);

    if (timer.current) clearTimeout(timer.current);
    // Timing, not a spring: a spring overshoots past 1 and the clamp reads as a
    // flash on an opacity.
    copiedAnim.set(withTiming(1, { duration: 160, easing: COPY_EASE }));

    timer.current = setTimeout(() => {
      copiedAnim.set(withTiming(0, { duration: 220, easing: COPY_EASE }));
    }, 1800);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />

      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={styles.closeBtn}
          hitSlop={8}
        >
          <X size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {name || "Scan to join"}
        </Text>
        <Text style={styles.subtitle}>
          Point a camera at this code to join the event and start adding photos.
        </Text>

        <View style={styles.qrCard}>
          {link ? (
            <QRCode
              value={link}
              size={QR_SIZE}
              color={colors.textPrimary}
              backgroundColor="#FFFFFF"
            />
          ) : (
            <Text style={styles.subtitle}>This event has no join code.</Text>
          )}
        </View>

        <Pressable
          onPress={handleCopy}
          disabled={!link}
          onPressIn={() => setPressing(true)}
          onPressOut={() => setPressing(false)}
          // Object styles, not Pressable's function form: that form renders the
          // button completely unstyled here (same failure as SuccessSheet's
          // link row), which costs the pill its shape rather than just its
          // press feedback.
          style={[styles.copyBtn, pressing && styles.copyBtnPressed]}
        >
          <View>
            {/* Invisible sizer: holds the wider of the two labels so the pill
                keeps one width through the swap. */}
            <View style={[styles.copyInner, { opacity: 0 }]} pointerEvents="none">
              <Check size={16} color={colors.accentDeep} strokeWidth={3} />
              <Text style={styles.copyText} numberOfLines={1}>
                Link copied
              </Text>
            </View>
            <Animated.View
              style={[styles.copyInner, styles.copyOverlay, copyStyle]}
              pointerEvents="none"
            >
              <Copy size={16} color={colors.accentDeep} />
              <Text style={styles.copyText} numberOfLines={1}>
                Copy link
              </Text>
            </Animated.View>
            <Animated.View
              style={[styles.copyInner, styles.copyOverlay, copiedStyle]}
              pointerEvents="none"
            >
              <Check size={16} color={colors.accentDeep} strokeWidth={3} />
              <Text style={styles.copyText} numberOfLines={1}>
                Link copied
              </Text>
            </Animated.View>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.backgroundPrimary },
  topBar: { paddingHorizontal: 20, paddingTop: 8 },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  title: {
    fontFamily: "Inter-ExtraBold",
    fontSize: 28,
    lineHeight: 34,
    color: colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 300,
  },
  // White quiet zone around the code — scanners need the padding to lock on.
  qrCard: {
    marginTop: 32,
    padding: 24,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2E2429",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  copyBtn: {
    marginTop: 28,
    borderRadius: 100,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "rgba(230,169,180,0.12)",
    borderWidth: 1,
    borderColor: "rgba(230,169,180,0.3)",
  },
  copyBtnPressed: { opacity: 0.75 },
  copyInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  // Sits exactly on top of the sizer so the two labels cross-fade in place.
  copyOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
  },
  copyText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 14,
    color: colors.accentDeep,
  },
});
