import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Clipboard,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { X, Copy, Check } from "lucide-react-native";
import { colors } from "../constants/colors";
import { joinLink } from "../constants/links";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// Big enough that a phone camera locks on from a comfortable distance.
const QR_SIZE = Math.min(SCREEN_WIDTH - 128, 260);

export default function QrScreen() {
  const { token, name } = useLocalSearchParams<{
    token?: string;
    name?: string;
  }>();

  const [copied, setCopied] = useState(false);
  const copiedAnim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setCopied(true);

    if (timer.current) clearTimeout(timer.current);
    Animated.spring(copiedAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 14,
      stiffness: 180,
    }).start();

    timer.current = setTimeout(() => {
      Animated.timing(copiedAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setCopied(false));
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
          style={({ pressed }) => [
            styles.copyBtn,
            pressed && { opacity: 0.75 },
          ]}
        >
          {copied ? (
            <Animated.View style={[styles.copyInner, { opacity: copiedAnim }]}>
              <Check size={16} color={colors.accentDeep} strokeWidth={3} />
              <Text style={styles.copyText}>Link copied</Text>
            </Animated.View>
          ) : (
            <View style={styles.copyInner}>
              <Copy size={16} color={colors.accentDeep} />
              <Text style={styles.copyText}>Copy link</Text>
            </View>
          )}
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
  copyInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  copyText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 14,
    color: colors.accentDeep,
  },
});
