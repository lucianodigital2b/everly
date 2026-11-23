import React, { useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { QrCode, X } from "lucide-react-native";
import { Button } from "../components/Button";
import { GlassSurface } from "../components/GlassSurface";
import { colors } from "../constants/colors";
import { t } from "../i18n";

// Pull the event token out of whatever the QR encodes:
// everly://upload/<token>, https://.../upload/<token>, or a bare token.
const parseToken = (data: string): string => {
  const m = data.match(/upload\/([^/?#\s]+)/i);
  if (m) return m[1];
  return data.trim();
};

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const handled = useRef(false);

  const onScanned = ({ data }: { data: string }) => {
    if (handled.current || !data) return;
    handled.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const token = parseToken(data);
    router.replace(`/upload/${token}` as any);
  };

  if (!permission) return <View style={styles.black} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permWrap}>
        <StatusBar style="light" />
        <QrCode size={40} color={colors.accentBright} strokeWidth={1.5} />
        <Text style={styles.permTitle}>{t("scan.permissionTitle")}</Text>
        <Text style={styles.permText}>
          {t("scan.permissionText")}
        </Text>
        <View style={{ width: "100%", marginTop: 20, gap: 10 }}>
          <Button title={t("scan.allowCamera")} onPress={requestPermission} />
          <Button title={t("scan.notNow")} variant="outline" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.black}>
      <StatusBar style="light" />
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={onScanned}
      />

      {/* Dimmed frame + cut-out */}
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.frame}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
      </View>

      <SafeAreaView style={styles.ui} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <GlassSurface tint="dark" shape="circle" style={styles.roundBtn}>
              <X size={22} color="#fff" />
            </GlassSurface>
          </Pressable>
        </View>
        <View style={{ flex: 1 }} />
        <GlassSurface
          tint="dark"
          shape="capsule"
          cornerRadius={999}
          style={styles.hintPill}
        >
          <Text style={styles.hint}>{t("scan.hint")}</Text>
        </GlassSurface>
      </SafeAreaView>
    </View>
  );
}

const FRAME = 250;

const styles = StyleSheet.create({
  black: { flex: 1, backgroundColor: "#000" },

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

  overlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  frame: { width: FRAME, height: FRAME },
  corner: {
    position: "absolute",
    width: 34,
    height: 34,
    borderColor: colors.accentBright,
  },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 14 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 14 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 14 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 14 },

  ui: { flex: 1, justifyContent: "space-between" },
  topBar: { paddingHorizontal: 18, paddingTop: 6 },
  roundBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  hintPill: {
    alignSelf: "center",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginBottom: 40,
  },
  hint: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
  },
});
