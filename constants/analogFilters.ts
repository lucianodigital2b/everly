export type AnalogFilterKey = "none" | "kodak" | "fuji" | "faded" | "noir";

export interface AnalogFilterUniforms {
  grain: number;
  vignette: number;
  haloStrength: number;
  haloThreshold: number;
  contrast: number;
  brightness: number;
  saturation: number;
  tint: [number, number, number];
  mono: number;
}

export interface AnalogFilterPreset {
  key: AnalogFilterKey;
  label: string;
  uniforms: AnalogFilterUniforms;
}

export const ANALOG_FILTERS: AnalogFilterPreset[] = [
  {
    key: "none",
    label: "Original",
    uniforms: {
      grain: 0,
      vignette: 0,
      haloStrength: 0,
      haloThreshold: 1,
      contrast: 1,
      brightness: 0,
      saturation: 1,
      tint: [0, 0, 0],
      mono: 0,
    },
  },
  {
    key: "kodak",
    label: "Kodak Gold",
    uniforms: {
      grain: 0.05,
      vignette: 0.35,
      haloStrength: 0.22,
      haloThreshold: 0.72,
      contrast: 1.08,
      brightness: 0.02,
      saturation: 1.15,
      tint: [0.04, 0.015, -0.03],
      mono: 0,
    },
  },
  {
    key: "fuji",
    label: "Fuji Superia",
    uniforms: {
      grain: 0.035,
      vignette: 0.2,
      haloStrength: 0.08,
      haloThreshold: 0.8,
      contrast: 1.03,
      brightness: 0,
      saturation: 0.92,
      tint: [-0.015, 0.02, 0.01],
      mono: 0,
    },
  },
  {
    key: "faded",
    label: "Faded Film",
    uniforms: {
      grain: 0.07,
      vignette: 0.12,
      haloStrength: 0.05,
      haloThreshold: 0.85,
      contrast: 0.82,
      brightness: 0.08,
      saturation: 0.78,
      tint: [0.02, 0.01, -0.01],
      mono: 0,
    },
  },
  {
    key: "noir",
    label: "Noir",
    uniforms: {
      grain: 0.11,
      vignette: 0.5,
      haloStrength: 0,
      haloThreshold: 1,
      contrast: 1.25,
      brightness: -0.02,
      saturation: 1,
      tint: [0, 0, 0],
      mono: 1,
    },
  },
];

export const getAnalogFilter = (key: AnalogFilterKey): AnalogFilterPreset =>
  ANALOG_FILTERS.find((f) => f.key === key) ?? ANALOG_FILTERS[0];

// SkSL runtime shader: color grade + halation (ring-sampled highlight bloom)
// + radial vignette + hash-based film grain, composited in a single pass.
export const ANALOG_SHADER_SOURCE = `
uniform shader image;
uniform float2 resolution;
uniform float grain;
uniform float vignette;
uniform float haloStrength;
uniform float haloThreshold;
uniform float contrast;
uniform float brightness;
uniform float saturation;
uniform float3 tint;
uniform float mono;
uniform float seed;

float hash(float2 p) {
  float3 p3 = fract(p.xyx * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

half4 main(float2 xy) {
  half4 c = image.eval(xy);

  // Halation: bloom of bright highlights, tinted warm, ring-sampled around
  // the pixel so it stays a single shader pass (no separate blur pass).
  half3 halo = half3(0.0);
  float radius = 6.0 + haloStrength * 14.0;
  for (int i = 0; i < 8; i++) {
    float a = 6.28318530718 * float(i) / 8.0;
    float2 offset = float2(cos(a), sin(a)) * radius;
    half4 s = image.eval(xy + offset);
    float lum = dot(s.rgb, half3(0.299, 0.587, 0.114));
    float bright = smoothstep(haloThreshold, 1.0, lum);
    halo += s.rgb * bright;
  }
  halo /= 8.0;
  c.rgb += halo * half3(1.0, 0.55, 0.32) * haloStrength;

  // Color grade: contrast, brightness, saturation, tint, monochrome mix.
  c.rgb = (c.rgb - 0.5) * contrast + 0.5 + brightness;
  float l = dot(c.rgb, half3(0.299, 0.587, 0.114));
  c.rgb = mix(half3(l), c.rgb, saturation);
  c.rgb += half3(tint);
  c.rgb = mix(c.rgb, half3(l), mono);

  // Vignette: radial falloff from center, aspect-corrected.
  float2 uv = xy / resolution;
  float2 centered = uv - 0.5;
  float aspect = resolution.x / resolution.y;
  float dist = length(centered * float2(aspect, 1.0));
  float vig = 1.0 - smoothstep(0.25, 0.85, dist);
  c.rgb *= mix(1.0, vig, vignette);

  // Grain: per-pixel hash noise, re-seeded per bake.
  float n = hash(xy + seed) - 0.5;
  c.rgb += n * grain;

  return half4(clamp(c.rgb, 0.0, 1.0) * c.a, c.a);
}
`;
