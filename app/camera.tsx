import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { CameraView, useCameraPermissions, type CameraType } from "expo-camera";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { Camera, Check, SwitchCamera, X, Zap, ZapOff } from "lucide-react-native";
import { Button } from "../components/Button";
import { GlassSurface } from "../components/GlassSurface";
import { colors } from "../constants/colors";
import { captureStore } from "../zustand/capture-store";

const finishWith = (photos: string[]) => {
  if (photos.length) captureStore.getState().setPhotos([...photos].reverse());
  router.back();
};

export default function CameraScreen() {
  const params = useLocalSearchParams<{ limit?: string }>();
  const total = Math.max(1, parseInt(params.limit ?? "10", 10) || 10);

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [captured, setCaptured] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const remaining = total - captured.length;
  const done = remaining <= 0;

  // Pop the counter when it changes.
  const pop = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.spring(pop, { toValue: 1.25, useNativeDriver: true, damping: 6, stiffness: 220 }),
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 180 }),
    ]).start();
  }, [remaining, pop]);

  const takePhoto = async () => {
    if (done || busy || !cameraRef.current) return;
    setBusy(true);
    try {
      const pic = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (pic?.uri) {
        setCaptured((c) => [pic.uri, ...c]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch {
      // ignore transient capture errors
    } finally {
      setBusy(false);
    }
  };

  // ── Permission states ──────────────────────────────────────────────
  if (!permission) {
    return <View style={styles.black} />;
  }
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permWrap}>
        <StatusBar style="light" />
        <Camera size={40} color={colors.accentBright} strokeWidth={1.5} />
        <Text style={styles.permTitle}>Camera access</Text>
        <Text style={styles.permText}>
          Everly needs your camera to capture photos for this event.
        </Text>
        <View style={{ width: "100%", marginTop: 20, gap: 10 }}>
          <Button title="Allow camera" onPress={requestPermission} />
          <Button title="Not now" variant="outline" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.black}>
      <StatusBar style="light" />
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} flash={flash} />

      <SafeAreaView style={styles.overlay} edges={["top", "bottom"]}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <GlassSurface tint="dark" shape="circle" style={styles.roundBtn}>
              <X size={22} color="#fff" />
            </GlassSurface>
          </Pressable>

          {/* Shots-remaining counter (top corner) */}
          <Animated.View style={{ transform: [{ scale: pop }] }}>
            <GlassSurface
              tint="dark"
              shape="capsule"
              cornerRadius={999}
              style={styles.counter}
            >
              <Camera size={15} color="#fff" strokeWidth={2} />
              <Text style={styles.counterNum}>{remaining}</Text>
              <Text style={styles.counterLabel}>left</Text>
            </GlassSurface>
          </Animated.View>
        </View>

        <View style={{ flex: 1 }} />

        {done && (
          <View style={styles.noShots}>
            <Text style={styles.noShotsText}>You've used all {total} shots</Text>
          </View>
        )}

        {/* Bottom controls */}
        <View style={styles.bottom}>
          {/* Thumbnail strip */}
          <View style={styles.stripRow}>
            {captured.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
              >
                {captured.map((uri) => (
                  <Image key={uri} source={{ uri }} style={styles.thumb} />
                ))}
              </ScrollView>
            )}
          </View>

          <View style={styles.controls}>
            <Pressable
              onPress={() => setFlash((f) => (f === "off" ? "on" : "off"))}
              hitSlop={8}
            >
              <GlassSurface tint="dark" shape="circle" style={styles.sideBtn}>
                {flash === "off" ? (
                  <ZapOff size={24} color="#fff" strokeWidth={1.8} />
                ) : (
                  <Zap size={24} color={colors.accentBright} strokeWidth={1.8} fill={colors.accentBright} />
                )}
              </GlassSurface>
            </Pressable>

            {/* Shutter */}
            <Pressable onPress={takePhoto} disabled={done || busy}>
              <View style={[styles.shutterRing, done && { opacity: 0.4 }]}>
                <View style={styles.shutterInner} />
              </View>
            </Pressable>

            <Pressable
              onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
              hitSlop={8}
            >
              <GlassSurface tint="dark" shape="circle" style={styles.sideBtn}>
                <SwitchCamera size={24} color="#fff" strokeWidth={1.8} />
              </GlassSurface>
            </Pressable>
          </View>

          {/* Done */}
          <Pressable
            onPress={() => finishWith(captured)}
            style={[styles.doneBtn, captured.length === 0 && { opacity: 0.5 }]}
            disabled={captured.length === 0}
          >
            <Check size={17} color="#2E2429" strokeWidth={2.4} />
            <Text style={styles.doneText}>
              Done{captured.length > 0 ? ` · ${captured.length}` : ""}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  black: { flex: 1, backgroundColor: "#000" },
  overlay: { flex: 1, justifyContent: "space-between" },

  permWrap: {
    flex: 1,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  permTitle: {
    fontFamily: "Inter-ExtraBold",
    fontSize: 22,
    color: "#fff",
    marginTop: 16,
  },
  permText: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 6,
  },
  roundBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  counterNum: {
    fontFamily: "Inter-ExtraBold",
    fontSize: 17,
    color: "#fff",
    fontVariant: ["tabular-nums"],
  },
  counterLabel: {
    fontFamily: "Inter-Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },

  noShots: {
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 14,
  },
  noShotsText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 13,
    color: "#fff",
  },

  bottom: { paddingBottom: 8 },
  stripRow: { minHeight: 56, justifyContent: "center", marginBottom: 12 },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 24,
  },
  sideBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterRing: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
  },
  doneBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    alignSelf: "center",
    marginTop: 16,
    backgroundColor: colors.accentBright,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 11,
  },
  doneText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 15,
    color: "#2E2429",
  },
});
