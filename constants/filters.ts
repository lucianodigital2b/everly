export type FilterKey = 'none' | 'warm' | 'film' | 'mono';

export interface FilterPreset {
  key: FilterKey;
  label: string;
  matrix: object[];
}

export const FILTERS: FilterPreset[] = [
  {
    key: 'none',
    label: 'Natural',
    matrix: [],
  },
  {
    key: 'warm',
    label: 'Warm',
    matrix: [{ saturate: 1.4 }, { brightness: 1.08 }, { contrast: 1.05 }],
  },
  {
    key: 'film',
    label: 'Film',
    matrix: [{ sepia: 0.55 }, { contrast: 1.15 }, { brightness: 0.97 }],
  },
  {
    key: 'mono',
    label: 'Mono',
    matrix: [{ grayscale: 1 }, { contrast: 1.1 }],
  },
];

export const getFilterMatrix = (key: FilterKey): object[] =>
  FILTERS.find((f) => f.key === key)?.matrix ?? [];
