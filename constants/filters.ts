import {
  brightness,
  compose,
  contrast,
  grayscale,
  IDENTITY,
  saturate,
  sepia,
  type ColorMatrix,
} from './colorMatrix';
import { t } from '../i18n';

export type FilterKey = 'none' | 'warm' | 'film' | 'mono';

export interface FilterPreset {
  key: FilterKey;
  label: string;
  /** Baked 4×5 matrix — feed it to `<FilteredImage>`, not to a `filter` style. */
  matrix: ColorMatrix;
}

// The look a guest shoots the whole event in — chosen once, on the create
// wizard's "Set the mood" step, and not overridable afterwards.
//
// Each preset is composed left to right, the way the same chain would read as a
// CSS `filter`. They're rendered through Skia (see components/FilteredImage):
// RN's `filter` style prop drops all of this on iOS, so what used to be written
// here as `[{ grayscale: 1 }]` was rendering as an untouched, full-colour photo.
export const FILTERS: FilterPreset[] = [
  {
    key: 'none',
    label: t('filters.natural'),
    matrix: IDENTITY,
  },
  {
    key: 'warm',
    label: t('filters.warm'),
    matrix: compose(saturate(1.4), brightness(1.08), contrast(1.05)),
  },
  {
    key: 'film',
    label: t('filters.film'),
    matrix: compose(sepia(0.55), contrast(1.15), brightness(0.97)),
  },
  {
    key: 'mono',
    label: t('filters.bw'),
    // Grayscale on its own comes out flat and grey. The extra contrast is what
    // makes it read as black and white rather than as a drained photo — the
    // look of the moodboard's monochrome frames.
    matrix: compose(grayscale(1), contrast(1.35), brightness(0.98)),
  },
];

export const getFilterMatrix = (key: FilterKey): ColorMatrix =>
  FILTERS.find((f) => f.key === key)?.matrix ?? IDENTITY;
