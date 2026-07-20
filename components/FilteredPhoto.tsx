import React, { useMemo } from "react";
import {
  Canvas,
  Fill,
  Shader,
  ImageShader,
  Skia,
  type SkImage,
  type CanvasRef,
} from "@shopify/react-native-skia";
import {
  ANALOG_SHADER_SOURCE,
  type AnalogFilterPreset,
} from "../constants/analogFilters";

const analogEffect = Skia.RuntimeEffect.Make(ANALOG_SHADER_SOURCE);

interface FilteredPhotoProps {
  image: SkImage;
  width: number;
  height: number;
  preset: AnalogFilterPreset;
  seed?: number;
  canvasRef?: React.Ref<CanvasRef>;
}

export const FilteredPhoto: React.FC<FilteredPhotoProps> = ({
  image,
  width,
  height,
  preset,
  seed = 0,
  canvasRef,
}) => {
  const uniforms = useMemo(
    () => ({
      resolution: [width, height],
      seed,
      ...preset.uniforms,
    }),
    [width, height, seed, preset]
  );

  if (!analogEffect) return null;

  return (
    <Canvas ref={canvasRef} style={{ width, height }}>
      <Fill>
        <Shader source={analogEffect} uniforms={uniforms}>
          <ImageShader
            image={image}
            fit="cover"
            rect={{ x: 0, y: 0, width, height }}
          />
        </Shader>
      </Fill>
    </Canvas>
  );
};
