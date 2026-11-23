import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  BackHandler,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
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
import {
  enqueueUpload,
  startUploadSession,
} from "../zustand/capture-store/uploader";
import { authStore } from "../zustand/auth-store";
import { t } from "../i18n";

// ── Control cycles ──────────────────────────────────────────────────────────
type Flash = "off" | "on" | "auto";
const FLASH_NEXT: Record<Flash, Flash> = { off: "on", on: "auto", auto: "off" };
const FLASH_LABEL: Record<Flash, string> = {
  off: t("camera.flash.off"),
  on: t("camera.flash.on"),
  auto: t("camera.flash.auto"),
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

  // ── Handing the roll back ───────────────────────────────────────────
  //
  // The captures only exist on this screen — once it pops, the URIs are gone
  // and nothing can recover them. So *every* way out delivers them: the Done
  // chip, the thumbnail, and the X, which used to `router.back()` and silently
  // throw a full roll away. The left-edge swipe is disabled for this route in
  // `app/_layout.tsx` for the same reason; Android's back button is caught
  // below. Delivering an empty roll is a no-op, so backing out before shooting
  // anything still behaves like a cancel.
  //
  // When the camera is opened with an upload target set (the create wizard,
  // right after the event is made), each shot goes up in the background as
  // it's taken — see `capture-store/uploader` — so "Done" has nothing left to
  // wait for. Without a target (the guest flow, which reviews and filters each
  // photo before sending it) the roll is handed back through the store exactly
  // as before.
  const uploads = captureStore((s) => s.uploads);

  // Latched once, on mount, rather than tracked from the store. Two things
  // would otherwise restart the session in the middle of a roll — discarding
  // its `guest_token` and its progress: a late auth hydration changing the
  // name, and the wizard clearing the handoff the moment it navigates away,
  // which would also flip this screen back into hand-the-roll-back mode during
  // teardown and leave a duplicate roll in the store.
  const uploadsLiveRef = useRef(false);
  useEffect(() => {
    const target = captureStore.getState().target;
    if (!target) return;
    uploadsLiveRef.current = true;
    startUploadSession({
      token: target.token,
      eventId: target.eventId,
      name: authStore.getState().data?.user?.name,
    });
  }, []);

  // Mirrored during render rather than in an effect: `deliver` runs from a tap
  // and from teardown, and must never see a roll one commit out of date.
  const capturedRef = useRef<string[]>(captured);
  capturedRef.current = captured;

  const delivered = useRef(false);
  const deliver = useCallback(() => {
    if (delivered.current) return;
    delivered.current = true;
    // Already uploaded, or still uploading. Handing the URIs back as well
    // would make the wizard queue the very same roll a second time.
    if (uploadsLiveRef.current) return;
    const photos = capturedRef.current;
    // Shots are prepended as they're taken, so reverse back to the order they
    // were actually shot in.
    if (photos.length) captureStore.getState().setPhotos([...photos].reverse());
  }, []);

  const finish = useCallback(() => {
    deliver();
    router.back();
  }, [deliver]);

  // Last resort: any teardown that didn't go through `finish` still hands the
  // roll over rather than dropping it.
  useEffect(() => deliver, [deliver]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      finish();
      return true;
    });
    return () => sub.remove();
  }, [finish]);

  // Shutter press feedback on the dial.
  const dialScale = useSharedValue(1);
  // Full-screen white flash when a frame is taken.
  const frameFlash = useSharedValue(0);

  // Both live on the UI thread. The countdown re-renders this screen once a
  // second and every capture re-renders it again; a core Animated value in an
  // inline style array is re-attached on each of those renders, which is what
  // made the flash and the dial stutter over the live preview.
  const dialStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dialScale.get() }],
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: frameFlash.get() }));

  const capture = async () => {
    if (done || busy || !cameraRef.current) return;
    setBusy(true);
    try {
      const pic = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (pic?.uri) {
        setCaptured((c) => [pic.uri, ...c]);
        // Straight onto the wire. The shutter stays responsive because the
        // queue drains on its own — nothing here is awaited.
        if (uploadsLiveRef.current) enqueueUpload(pic.uri);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        frameFlash.set(0.9);
        frameFlash.set(
          withTiming(0, { duration: 260, easing: Easing.bezier(0.23, 1, 0.32, 1) })
        );
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
    dialScale.set(0.9);
    dialScale.set(withSpring(1, { duration: 400, dampingRatio: 0.6 }));

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
        <Text style={styles.permTitle}>{t("camera.permissionTitle")}</Text>
        <Text style={styles.permText}>
          {t("camera.permissionText")}
        </Text>
        <View style={{ width: "100%", marginTop: 20, gap: 10 }}>
          <Button title={t("camera.allowCamera")} onPress={requestPermission} />
          <Button title={t("camera.notNow")} variant="outline" onPress={finish} />
        </View>
      </SafeAreaView>
    );
  }

  const lastShot = captured[0];
  const uploadingCount = uploads.filter((u) => u.status === "pending").length;

  return (
    <View style={styles.black}>
      <StatusBar style="light" />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
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
              { backgroundColor: "#fff" },
              flashStyle,
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

          {/* Close, and a status pill that appears only for non-default modes —
              everything else is already legible from the buttons below. */}
          <View style={styles.finderTop} pointerEvents="box-none">
            <Pressable onPress={finish} hitSlop={10} style={styles.closeBtn}>
              <X size={20} color="#fff" strokeWidth={2.2} />
            </Pressable>

            {(flash !== "off" || timerSecs !== 0) && (
              <View style={styles.statusPill} pointerEvents="none">
                {flash !== "off" && (
                  <>
                    <Zap
                      size={13}
                      color={colors.accentBright}
                      strokeWidth={2}
                      fill={colors.accentBright}
                    />
                    <Text style={styles.statusText}>{FLASH_LABEL[flash]}</Text>
                  </>
                )}
                {flash !== "off" && timerSecs !== 0 && (
                  <View style={styles.statusDivider} />
                )}
                {timerSecs !== 0 && (
                  <>
                    <Timer size={13} color={colors.accentBright} strokeWidth={2} />
                    <Text style={styles.statusText}>{timerSecs}s</Text>
                  </>
                )}
              </View>
            )}
          </View>

          {uploadingCount > 0 && (
            <View style={styles.uploadPill} pointerEvents="none">
              <View style={styles.uploadDot} />
              <Text style={styles.uploadText}>
                {t("camera.uploading", { count: uploadingCount })}
              </Text>
            </View>
          )}

          {done && (
            <View style={styles.noShots}>
              <Text style={styles.noShotsText}>
                {t("camera.allShotsUsed", { count: total })}
              </Text>
            </View>
          )}
        </View>

        {/* ── Body ── */}
        <View style={styles.body}>
          {/* Control row */}
          <View style={styles.controlRow}>
            <MetalButton
              label={t("camera.flashLabel")}
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
              label={timerSecs === 0 ? t("camera.timer") : t("camera.timerSeconds", { seconds: timerSecs })}
              onPress={() => setTimerIdx((i) => (i + 1) % TIMERS.length)}
            >
              <Timer
                size={22}
                color={timerSecs === 0 ? "#fff" : colors.accentBright}
                strokeWidth={1.9}
              />
            </MetalButton>

            <MetalButton
              label={t("camera.flip")}
              onPress={() =>
                setFacing((f) => (f === "back" ? "front" : "back"))
              }
            >
              <RefreshCw size={22} color="#fff" strokeWidth={1.9} />
            </MetalButton>

            <MetalButton label={t("camera.grid")} onPress={() => setGrid((g) => !g)}>
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
              onPress={finish}
              disabled={captured.length === 0}
              style={[
                styles.doneChip,
                captured.length === 0 && { opacity: 0.4 },
              ]}
            >
              <Check size={16} color="#fff" strokeWidth={2.6} />
              <Text style={styles.doneText}>
                {captured.length > 0
                  ? t("camera.doneWithCount", { count: captured.length })
                  : t("camera.done")}
              </Text>
            </Pressable>

            {/* Shutter dial */}
            <Animated.View style={dialStyle}>
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
              onPress={() => captured.length > 0 && finish()}
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

  // Viewfinder
  finder: {
    flex: 1,
    borderRadius: 28,
    overflow: "hidden",
    marginHorizontal: 12,
    marginTop: 10,
    backgroundColor: "#000",
  },
  // Pushed clear of the corner radius so the L brackets read as a frame
  // inside the curve rather than colliding with it.
  finderFrame: {
    ...StyleSheet.absoluteFillObject,
    margin: 18,
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
  finderTop: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  statusText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 12,
    color: "#fff",
  },
  statusDivider: {
    width: StyleSheet.hairlineWidth,
    height: 12,
    marginHorizontal: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  // Sits opposite the "all shots used" pill so the two never collide.
  uploadPill: {
    position: "absolute",
    bottom: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  uploadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentBright,
  },
  uploadText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 12,
    color: "#fff",
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
