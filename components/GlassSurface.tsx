import React from "react";
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

// Native Liquid Glass (@expo/ui) — required defensively so it can't crash on
// Android or on a binary built before the module was added.
let ExpoUI: any = null;
let GlassMod: any = null;
try {
  ExpoUI = require("@expo/ui/swift-ui");
} catch {}
try {
  GlassMod = require("@expo/ui/swift-ui/modifiers");
} catch {}

const iosVersion =
  Platform.OS === "ios" ? parseInt(String(Platform.Version), 10) || 0 : 0;

const supportsLiquidGlass =
  Platform.OS === "ios" &&
  iosVersion >= 26 &&
  !!ExpoUI?.Host &&
  !!ExpoUI?.HStack &&
  typeof GlassMod?.glassEffect === "function";

type GlassShape = "capsule" | "circle" | "roundedRectangle";
type GlassTint = "light" | "dark";

interface GlassSurfaceProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  shape?: GlassShape;
  cornerRadius?: number;
  /** Blur strength for the cross-platform fallback (1–100). */
  intensity?: number;
  /** Frost over light content (default) or a dark, moody glass over photos. */
  tint?: GlassTint;
  /** Draw the luminous hairline edge + top sheen (the "glass" look). */
  bordered?: boolean;
}

/**
 * A frosted, translucent surface. Renders Apple's real Liquid Glass via
 * @expo/ui on iOS 26+, and a blurred translucent panel — with a luminous edge
 * and a soft top sheen — everywhere else.
 * Use it as a background behind touchable content, or wrap content directly.
 */
export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  style,
  shape = "capsule",
  cornerRadius,
  intensity = 42,
  tint = "light",
  bordered = true,
}) => {
  if (supportsLiquidGlass) {
    const { Host, HStack } = ExpoUI;
    const { glassEffect } = GlassMod;
    return (
      <View style={style}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Host style={StyleSheet.absoluteFill}>
            <HStack
              modifiers={[
                glassEffect({
                  // "regular" frosts the backdrop; "clear" is near-transparent and
                  // leaves icons unreadable over photos.
                  glass: { variant: "regular", interactive: true },
                  shape,
                  ...(cornerRadius != null ? { cornerRadius } : {}),
                }),
              ]}
            />
          </Host>
        </View>
        {children}
      </View>
    );
  }

  const isDark = tint === "dark";
  const t = isDark ? DARK : LIGHT;

  return (
    <View
      style={[
        style,
        styles.clip,
        bordered && {
          borderWidth: 1,
          borderColor: t.border,
        },
      ]}
    >
      <BlurView
        tint={isDark ? "dark" : "light"}
        intensity={intensity}
        style={StyleSheet.absoluteFill}
      />
      {/* Translucent wash — blur alone reads too transparent over busy photos. */}
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: t.wash }]}
        pointerEvents="none"
      />
      {/* Top sheen — the reflected-light edge that sells the glass. */}
      {bordered && (
        <LinearGradient
          colors={[t.sheen, "rgba(255,255,255,0)"]}
          locations={[0, 0.55]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}
      {children}
    </View>
  );
};

const LIGHT = {
  wash: "rgba(255,255,255,0.38)",
  border: "rgba(255,255,255,0.55)",
  sheen: "rgba(255,255,255,0.5)",
};
const DARK = {
  wash: "rgba(18,14,20,0.30)",
  border: "rgba(255,255,255,0.20)",
  sheen: "rgba(255,255,255,0.16)",
};

const styles = StyleSheet.create({
  clip: { overflow: "hidden" },
});
