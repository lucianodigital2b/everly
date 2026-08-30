// 4×5 colour matrices, the format Skia's `<ColorMatrix>` takes.
//
// These exist because React Native's `filter` style prop is not an option on
// iOS: `grayscale`, `contrast`, `saturate`, `hueRotate` and `blur` are only
// applied when the view is wrapped in a SwiftUI hosting view, which is gated
// behind the `enableSwiftUIBasedFilters` feature flag — `false` by default
// (see ReactNativeFeatureFlagsDefaults.h). `sepia` isn't implemented on iOS at
// all. Only `brightness` and `opacity` survive, so a `grayscale: 1` preset
// silently did nothing at all.
//
// The maths is CSS's: same coefficients as the filter functions of the same
// name, so a preset reads the way it would in a browser.

/** 20 values, row-major: 4 rows (R, G, B, A) of 5 columns (r, g, b, a, offset). */
export type ColorMatrix = number[];

export const IDENTITY: ColorMatrix = [
  1, 0, 0, 0, 0,
  0, 1, 0, 0, 0,
  0, 0, 1, 0, 0,
  0, 0, 0, 1, 0,
];

/** `m · n` — n is applied to the colour first, then m. */
const multiply = (m: ColorMatrix, n: ColorMatrix): ColorMatrix => {
  const out = new Array<number>(20).fill(0);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += m[row * 5 + k] * n[k * 5 + col];
      // The offset column carries the row's own translation through.
      if (col === 4) sum += m[row * 5 + 4];
      out[row * 5 + col] = sum;
    }
  }
  return out;
};

/**
 * Folds a chain into one matrix, applied left to right — `compose(a, b)` means
 * a first, then b, matching how CSS reads a `filter` list.
 */
export const compose = (...matrices: ColorMatrix[]): ColorMatrix =>
  matrices.reduce((acc, m) => multiply(m, acc), IDENTITY);

/** Scales RGB. 1 is unchanged, >1 brightens. */
export const brightness = (amount: number): ColorMatrix => [
  amount, 0, 0, 0, 0,
  0, amount, 0, 0, 0,
  0, 0, amount, 0, 0,
  0, 0, 0, 1, 0,
];

/**
 * Pushes RGB away from mid-grey. The offset keeps the midpoint at 0.5 rather
 * than letting the whole image drift dark as contrast rises.
 */
export const contrast = (amount: number): ColorMatrix => {
  const t = (1 - amount) / 2;
  return [
    amount, 0, 0, 0, t,
    0, amount, 0, 0, t,
    0, 0, amount, 0, t,
    0, 0, 0, 1, 0,
  ];
};

/** 1 is unchanged, 0 is fully desaturated. Uses the sRGB luma coefficients. */
export const saturate = (amount: number): ColorMatrix => {
  const r = 0.213;
  const g = 0.715;
  const b = 0.072;
  return [
    r + 0.787 * amount, g - g * amount, b - b * amount, 0, 0,
    r - r * amount, g + 0.285 * amount, b - b * amount, 0, 0,
    r - r * amount, g - g * amount, b + 0.928 * amount, 0, 0,
    0, 0, 0, 1, 0,
  ];
};

/** 1 is fully black and white. Defined by CSS as the inverse of saturate. */
export const grayscale = (amount: number): ColorMatrix => saturate(1 - amount);

/** 1 is full sepia; anything between blends with the original. */
export const sepia = (amount: number): ColorMatrix => {
  const a = amount;
  const i = 1 - amount;
  return [
    0.393 * a + i, 0.769 * a, 0.189 * a, 0, 0,
    0.349 * a, 0.686 * a + i, 0.168 * a, 0, 0,
    0.272 * a, 0.534 * a, 0.131 * a + i, 0, 0,
    0, 0, 0, 1, 0,
  ];
};

/** True when the matrix would leave every pixel untouched — skip Skia entirely. */
export const isIdentity = (matrix: ColorMatrix) =>
  matrix.length === IDENTITY.length &&
  matrix.every((value, i) => Math.abs(value - IDENTITY[i]) < 1e-6);
