import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { CameraView, useCameraPermissions, type CameraType } from "expo-camera";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import {
  Camera,
  Check,
  Grid3x3,
  RefreshCw,
  Timer,
  X,
  Zap,
  ZapOff,
} from "lucide-react-native";
import { Button } from "../components/Button";
import { colors } from "../constants/colors";
import { captureStore } from "../zustand/capture-store";

const finishWith = (photos: string[]) => {
  if (photos.length) captureStore.getState().setPhotos([...photos].reverse());
  router.back();
};

// ── Control cycles ──────────────────────────────────────────────────────────
type Flash = "off" | "on" | "auto";
const FLASH_NEXT: Record<Flash, Flash> = { off: "on", on: "auto", auto: "off" };
const FLASH_LABEL: Record<Flash, string> = {
  off: "Off",
  on: "On",
  auto: "Auto",
};

const TIMERS = [0, 3, 10] as const;

// ── Corner bracket ──────────────────────────────────────────────────────────
// The L that frames each corner of the viewfinder and the little readout tiles.
const Bracket = ({
  corner,
  size = 16,
  thickness = 2,
  color = "rgba(255,255,255,0.9)",
}: {
  corner: "tl" | "tr" | "bl" | "br";
  size?: number;
  thickness?: number;
  color?: string;
}) => {
  const top = corner[0] === "t";
  const left = corner[1] === "l";
  return (
    <View
      style={{
        position: "absolute",
        width: size,
        height: size,
        top: top ? 0 : undefined,
        bottom: top ? undefined : 0,
        left: left ? 0 : undefined,
        right: left ? undefined : 0,
        borderColor: color,
        borderTopWidth: top ? thickness : 0,
        borderBottomWidth: top ? 0 : thickness,
        borderLeftWidth: left ? thickness : 0,
        borderRightWidth: left ? 0 : thickness,
      }}
    />
  );
};

// A bracketed readout tile in the top status strip. Display-only — it mirrors
// the state the buttons below actually drive.
const Readout = ({
  icon,
  value,
  active,
}: {
  icon: React.ReactNode;
  value: string;
  active?: boolean;
}) => (
  <View style={styles.readout}>
    <Bracket corner="tl" size={9} thickness={1.5} color="rgba(255,255,255,0.3)" />
    <Bracket corner="tr" size={9} thickness={1.5} color="rgba(255,255,255,0.3)" />
    <Bracket corner="bl" size={9} thickness={1.5} color="rgba(255,255,255,0.3)" />
    <Bracket corner="br" size={9} thickness={1.5} color="rgba(255,255,255,0.3)" />
    <View style={{ height: 22, justifyContent: "center" }}>{icon}</View>
    <Text
      style={[styles.readoutValue, active && { color: colors.accentBright }]}
    >
      {value}
    </Text>
  </View>
);

// A round, brushed-metal control button.
const MetalButton = ({
  children,
  onPress,
  label,
}: {
  children: React.ReactNode;
  onPress: () => void;
  label?: string;
}) => (
  <View style={{ alignItems: "center", gap: 6 }}>
    <Pressable onPress={onPress} hitSlop={8} style={styles.metalBtn}>
      <LinearGradient
        colors={["#4A4A4E", "#2A2A2C", "#1B1B1D"]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </Pressable>
    {label ? <Text style={styles.metalLabel}>{label}</Text> : null}
  </View>
);

export default function CameraScreen() {
  const params = useLocalSearchParams<{ limit?: string }>();
  const total = Math.max(1, parseInt(params.limit ?? "10", 10) || 10);

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<Flash>("off");
  const [timerIdx, setTimerIdx] = useState(0);
  const [grid, setGrid] = useState(false);
  const [captured, setCaptured] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const timerSecs = TIMERS[timerIdx];
  const remaining = total - captured.length;
  const done = remaining <= 0;

  // Shutter press feedback on the dial.
  const dialScale = useRef(new Animated.Value(1)).current;
  // Full-screen white flash when a frame is taken.
  const frameFlash = useRef(new Animated.Value(0)).current;

  const capture = async () => {
    if (done || busy || !cameraRef.current) return;
    setBusy(true);
    try {
      const pic = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (pic?.uri) {
        setCaptured((c) => [pic.uri, ...c]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        frameFlash.setValue(0.9);
        Animated.timing(frameFlash, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start();
      }
    } catch {
      // ignore transient capture errors
    } finally {
      setBusy(false);
    }
  };

  // Runs the self-timer countdown, then captures. A tap during the countdown
  // does nothing (busy guard) so we don't stack timers.
  const onShutter = () => {
    if (done || busy || countdown !== null) return;
    Animated.sequence([
      Animated.spring(dialScale, {
        toValue: 0.9,
        useNativeDriver: true,
        speed: 60,
      }),
      Animated.spring(dialScale, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();

    if (timerSecs === 0) {
      capture();
      return;
    }
    setCountdown(timerSecs);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      capture();
      return;
    }
    Haptics.selectionAsync();
    const t = setTimeout(() => setCountdown((c) => (c ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

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

  const lastShot = captured[0];

  return (
    <View style={styles.black}>
      <StatusBar style="light" />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* ── Top status strip ── */}
        <View style={styles.topStrip}>
          <Readout
            icon={
              flash === "off" ? (
                <ZapOff size={16} color="#fff" strokeWidth={2} />
              ) : (
                <Zap
                  size={16}
                  color={colors.accentBright}
                  strokeWidth={2}
                  fill={colors.accentBright}
                />
              )
            }
            value={FLASH_LABEL[flash]}
            active={flash !== "off"}
          />
          <Readout
            icon={<Timer size={16} color="#fff" strokeWidth={2} />}
            value={timerSecs === 0 ? "Off" : `${timerSecs}s`}
            active={timerSecs !== 0}
          />
          <Readout
            icon={<Grid3x3 size={16} color="#fff" strokeWidth={2} />}
            value={grid ? "On" : "Off"}
            active={grid}
          />
          <Readout
            icon={<RefreshCw size={16} color="#fff" strokeWidth={2} />}
            value={facing === "back" ? "Rear" : "Front"}
          />
        </View>

        {/* ── Viewfinder ── */}
        <View style={styles.finder}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing={facing}
            flash={flash}
          />

          {/* Frame flash on capture */}
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "#fff", opacity: frameFlash },
            ]}
          />

          {/* Rule-of-thirds grid */}
          {grid && (
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <View style={[styles.gridV, { left: "33.33%" }]} />
              <View style={[styles.gridV, { left: "66.66%" }]} />
              <View style={[styles.gridH, { top: "33.33%" }]} />
              <View style={[styles.gridH, { top: "66.66%" }]} />
            </View>
          )}

          {/* Corner brackets */}
          <View pointerEvents="none" style={styles.finderFrame}>
            <Bracket corner="tl" size={22} />
            <Bracket corner="tr" size={22} />
            <Bracket corner="bl" size={22} />
            <Bracket corner="br" size={22} />
          </View>

          {/* Center reticle */}
          <View pointerEvents="none" style={styles.reticle}>
            <View style={styles.reticleH} />
            <View style={styles.reticleV} />
          </View>

          {/* Countdown */}
          {countdown !== null && countdown > 0 && (
            <View pointerEvents="none" style={styles.countdownWrap}>
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>
          )}

          {/* Close */}
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={styles.closeBtn}
          >
            <X size={20} color="#fff" strokeWidth={2.2} />
          </Pressable>

          {done && (
            <View style={styles.noShots}>
              <Text style={styles.noShotsText}>
                You've used all {total} shots
              </Text>
            </View>
          )}
        </View>

        {/* ── Body ── */}
        <View style={styles.body}>
          {/* Control row */}
          <View style={styles.controlRow}>
            <MetalButton
              label="Flash"
              onPress={() => setFlash((f) => FLASH_NEXT[f])}
            >
              {flash === "off" ? (
                <ZapOff size={22} color="#fff" strokeWidth={1.9} />
              ) : (
                <Zap
                  size={22}
                  color={colors.accentBright}
                  strokeWidth={1.9}
                  fill={colors.accentBright}
                />
              )}
            </MetalButton>

            <MetalButton
              label={timerSecs === 0 ? "Timer" : `${timerSecs}s`}
              onPress={() => setTimerIdx((i) => (i + 1) % TIMERS.length)}
            >
              <Timer
                size={22}
                color={timerSecs === 0 ? "#fff" : colors.accentBright}
                strokeWidth={1.9}
              />
            </MetalButton>

            <MetalButton
              label="Flip"
              onPress={() =>
                setFacing((f) => (f === "back" ? "front" : "back"))
              }
            >
              <RefreshCw size={22} color="#fff" strokeWidth={1.9} />
            </MetalButton>

            <MetalButton label="Grid" onPress={() => setGrid((g) => !g)}>
              <Grid3x3
                size={22}
                color={grid ? colors.accentBright : "#fff"}
                strokeWidth={1.9}
              />
            </MetalButton>
          </View>

          {/* Shutter deck */}
          <View style={styles.deck}>
            {/* Done / finish */}
            <Pressable
              onPress={() => finishWith(captured)}
              disabled={captured.length === 0}
              style={[
                styles.doneChip,
                captured.length === 0 && { opacity: 0.4 },
              ]}
            >
              <Check size={16} color="#fff" strokeWidth={2.6} />
              <Text style={styles.doneText}>
                Done{captured.length > 0 ? ` · ${captured.length}` : ""}
              </Text>
            </Pressable>

            {/* Shutter dial */}
            <Animated.View style={{ transform: [{ scale: dialScale }] }}>
              <Pressable
                onPress={onShutter}
                disabled={done || busy || countdown !== null}
                style={[styles.dialOuter, done && { opacity: 0.4 }]}
              >
                <LinearGradient
                  colors={["#6A6A6E", "#3A3A3C", "#242426"]}
                  locations={[0, 0.55, 1]}
                  style={styles.dialRing}
                >
                  <View style={styles.dialInner}>
                    <LinearGradient
                      colors={["#E8E8EA", "#B8B8BC", "#8E8E92"]}
                      locations={[0, 0.6, 1]}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.dialHub} />
                  </View>
                </LinearGradient>
                <Text style={styles.dialEngrave}>EVERLY</Text>
              </Pressable>
            </Animated.View>

            {/* Last-shot thumbnail / counter */}
            <Pressable
              onPress={() => captured.length > 0 && finishWith(captured)}
              style={styles.thumbSlot}
            >
              {lastShot ? (
                <Image source={{ uri: lastShot }} style={styles.thumbImg} />
              ) : (
                <View style={styles.thumbEmpty}>
                  <Camera size={18} color="rgba(255,255,255,0.5)" />
                </View>
              )}
              <View style={styles.thumbBadge}>
                <Text style={styles.thumbBadgeText}>{remaining}</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  black: { flex: 1, backgroundColor: "#141416" },

  // Permission
  permWrap: {
    flex: 1,
    backgroundColor: "#141416",
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

  // Top strip
  topStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
  },
  readout: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  readoutValue: {
    fontFamily: "Inter-SemiBold",
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
  },

  // Viewfinder
  finder: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    marginHorizontal: 12,
    backgroundColor: "#000",
  },
  finderFrame: {
    ...StyleSheet.absoluteFillObject,
    margin: 12,
  },
  reticle: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 30,
    height: 30,
    marginTop: -15,
    marginLeft: -15,
    alignItems: "center",
    justifyContent: "center",
  },
  reticleH: {
    position: "absolute",
    width: 30,
    height: 1.5,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  reticleV: {
    position: "absolute",
    width: 1.5,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  gridV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  gridH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  countdownWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  countdownText: {
    fontFamily: "Inter-ExtraBold",
    fontSize: 96,
    color: "#fff",
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    left: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  noShots: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  noShotsText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 13,
    color: "#fff",
  },

  // Body
  body: {
    paddingTop: 18,
    paddingBottom: 6,
  },
  controlRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 22,
  },
  metalBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  metalLabel: {
    fontFamily: "Inter-Medium",
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
  },

  // Deck
  deck: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  doneChip: {
    width: 76,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentDeep,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  doneText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 13,
    color: "#fff",
  },
  dialOuter: {
    width: 92,
    height: 92,
    alignItems: "center",
    justifyContent: "center",
  },
  dialRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.5)",
  },
  dialInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.35)",
  },
  dialHub: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  dialEngrave: {
    position: "absolute",
    bottom: 12,
    fontFamily: "Inter-ExtraBold",
    fontSize: 8,
    letterSpacing: 2,
    color: "rgba(0,0,0,0.35)",
  },
  thumbSlot: {
    width: 76,
    height: 48,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  thumbImg: { width: "100%", height: "100%" },
  thumbEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbBadge: {
    position: "absolute",
    top: 3,
    right: 3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbBadgeText: {
    fontFamily: "Inter-ExtraBold",
    fontSize: 11,
    color: "#fff",
    fontVariant: ["tabular-nums"],
  },
});
