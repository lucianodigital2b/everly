import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  View,
  type ImageResizeMode,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  Canvas,
  ColorMatrix,
  Image as SkiaImage,
  useImage,
} from "@shopify/react-native-skia";
import { isIdentity, type ColorMatrix as Matrix } from "../constants/colorMatrix";

interface FilteredImageProps {
  uri: string;
  /** A baked 4×5 matrix from constants/filters or constants/colorMatrix. */
  matrix: Matrix;
  /** Sizes the frame the photo is drawn into. */
  style?: StyleProp<ViewStyle>;
  /** Matches RN's Image, and maps onto Skia's `fit`. */
  resizeMode?: Extract<ImageResizeMode, "cover" | "contain">;
}

/**
 * A photo with a colour grade actually applied to it.
 *
 * This is a Skia canvas rather than an `<Image style={{ filter }}>` because
 * RN's filter prop is inert on iOS for everything except brightness and
 * opacity — see the note at the top of constants/colorMatrix.ts. Skia runs the
 * matrix on the GPU and behaves identically on both platforms.
 *
 * Two paths deliberately fall back to a plain `<Image>`:
 *   - an identity matrix ("Natural"), which has nothing to draw differently and
 *     shouldn't pay for a canvas;
 *   - the moment before Skia has decoded the file, so a cover fades in as a
 *     normal image instead of flashing an empty frame.
 */
export const FilteredImage = ({
  uri,
  matrix,
  style,
  resizeMode = "cover",
}: FilteredImageProps) => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const plain = isIdentity(matrix);
  // Skipped entirely on the identity path — `useImage` is a hook, so it still
  // has to be called, but a null source keeps it from decoding anything.
  const image = useImage(plain ? null : uri);

  if (plain || !image || size.width === 0 || size.height === 0) {
    return (
      <View
        style={style}
        onLayout={(e) => setSize(e.nativeEvent.layout)}
        pointerEvents="none"
      >
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode={resizeMode}
        />
      </View>
    );
  }

  return (
    <View
      style={style}
      onLayout={(e) => setSize(e.nativeEvent.layout)}
      pointerEvents="none"
    >
      <Canvas style={StyleSheet.absoluteFill}>
        <SkiaImage
          image={image}
          x={0}
          y={0}
          width={size.width}
          height={size.height}
          fit={resizeMode}
        >
          <ColorMatrix matrix={matrix} />
        </SkiaImage>
      </Canvas>
    </View>
  );
};
