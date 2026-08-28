import React from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { ImageUp } from "lucide-react-native";
import { colors } from "../constants/colors";
import { COVER_PRESETS, isHostedCover } from "../constants/sampleImages";

const TILE_W = 62;
const TILE_H = 84;
const RING = 2.5;
const RADIUS = 15;

// ─── Tile ─────────────────────────────────────────────────────────────────────

const Tile = ({
  children,
  selected,
  onPress,
}: {
  children: React.ReactNode;
  selected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    style={[styles.tile, selected && styles.tileOn]}
  >
    <View style={styles.tileInner}>{children}</View>
  </TouchableOpacity>
);

/**
 * "Your photo". RN draws a dashed border as solid on Android as soon as there's
 * a corner radius, so the outline is an SVG rect with a dash pattern instead —
 * same dashes on both platforms.
 */
const DashedTile = ({
  preview,
  selected,
  onPress,
}: {
  preview: string | null;
  selected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    style={[styles.tile, selected && styles.tileOn]}
  >
    <View style={[styles.tileInner, styles.dashedInner]}>
      {preview ? (
        <Image source={{ uri: preview }} style={styles.image} resizeMode="cover" />
      ) : (
        <>
          <Svg
            width={TILE_W}
            height={TILE_H}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            <Rect
              x={0.75}
              y={0.75}
              width={TILE_W - 1.5}
              height={TILE_H - 1.5}
              rx={RADIUS - RING}
              ry={RADIUS - RING}
              fill="none"
              stroke={colors.textTertiary}
              strokeWidth={1.5}
              strokeDasharray="5 4"
            />
          </Svg>
          <ImageUp size={19} color={colors.accentDeep} />
        </>
      )}
    </View>
  </TouchableOpacity>
);

// ─── Component ────────────────────────────────────────────────────────────────

interface CoverPickerProps {
  /** The form's cover — a preset URL, a local picker URI, or null. */
  value: string | null;
  onSelect: (uri: string) => void;
  /** Opens the system picker. */
  onPickOwn: () => void;
}

export const CoverPicker = ({ value, onSelect, onPickOwn }: CoverPickerProps) => {
  // Anything that isn't one of the hosted presets came from the picker, so it
  // previews inside the last tile rather than being invisible.
  const own = value && !isHostedCover(value) ? value : null;

  return (
    <View>
      <Text style={styles.label}>Bring your own, or pick a cover</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {/* Own photo leads the row: bringing a real one is the intent the step
            is really asking about, the presets are the fallback. */}
        <DashedTile preview={own} selected={!!own} onPress={onPickOwn} />

        {COVER_PRESETS.map((preset) => (
          <Tile
            key={preset.key}
            selected={value === preset.uri}
            onPress={() => onSelect(preset.uri)}
          >
            <Image
              source={{ uri: preset.thumb }}
              style={styles.image}
              resizeMode="cover"
            />
          </Tile>
        ))}
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  label: {
    fontFamily: "Inter-Medium",
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 10,
    marginLeft: 2,
  },
  row: {
    gap: 10,
    paddingRight: 24,
    paddingVertical: 2,
  },
  tile: {
    width: TILE_W + RING * 2,
    height: TILE_H + RING * 2,
    borderRadius: RADIUS + 1,
    padding: RING,
    backgroundColor: "transparent",
  },
  tileOn: {
    backgroundColor: colors.accent,
  },
  tileInner: {
    flex: 1,
    borderRadius: RADIUS - RING,
    overflow: "hidden",
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  dashedInner: {
    backgroundColor: colors.backgroundSecondary,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
