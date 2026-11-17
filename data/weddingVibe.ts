// "About our wedding" answers: asked in the setup wizard, shown and edited on
// the Plan tab. Ids are persisted, so never rename an existing one.

export type VibeField = 'color' | 'season' | 'style' | 'honeymoon';

export interface VibeOption {
  id: string;
  label: string;
  hex?: string; // colors only
}

export const VIBE_COLORS: VibeOption[] = [
  { id: 'blush', label: 'Blush', hex: '#E6A9B4' },
  { id: 'sage', label: 'Sage', hex: '#A7B89A' },
  { id: 'dusty_blue', label: 'Dusty blue', hex: '#8FA9C7' },
  { id: 'terracotta', label: 'Terracotta', hex: '#C9775A' },
  { id: 'lavender', label: 'Lavender', hex: '#B7A3D6' },
  { id: 'burgundy', label: 'Burgundy', hex: '#7E2F3E' },
  { id: 'emerald', label: 'Emerald', hex: '#2F6F57' },
  { id: 'gold', label: 'Gold', hex: '#C9A45C' },
  { id: 'ivory', label: 'Ivory', hex: '#EFE6D6' },
  { id: 'black_white', label: 'Black & white', hex: '#2E2429' },
];

export const VIBE_SEASONS: VibeOption[] = [
  { id: 'spring', label: 'Spring' },
  { id: 'summer', label: 'Summer' },
  { id: 'fall', label: 'Fall' },
  { id: 'winter', label: 'Winter' },
];

export const VIBE_STYLES: VibeOption[] = [
  { id: 'classic', label: 'Classic' },
  { id: 'rustic', label: 'Rustic' },
  { id: 'boho', label: 'Boho' },
  { id: 'modern', label: 'Modern' },
  { id: 'garden', label: 'Garden / outdoor' },
  { id: 'beach', label: 'Beach' },
  { id: 'glam', label: 'Glam' },
  { id: 'minimal', label: 'Minimal' },
];

export const VIBE_HONEYMOONS: VibeOption[] = [
  { id: 'beach', label: 'Beach & islands' },
  { id: 'europe', label: 'Europe' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'city', label: 'City break' },
  { id: 'road_trip', label: 'Road trip' },
  { id: 'staycation', label: 'Staycation' },
  { id: 'undecided', label: 'Not sure yet' },
];

export const VIBE_FIELDS: { field: VibeField; label: string; options: VibeOption[] }[] = [
  { field: 'color', label: 'Color', options: VIBE_COLORS },
  { field: 'season', label: 'Season', options: VIBE_SEASONS },
  { field: 'style', label: 'Style', options: VIBE_STYLES },
  { field: 'honeymoon', label: 'Honeymoon', options: VIBE_HONEYMOONS },
];

export function vibeOption(field: VibeField, id: string | null): VibeOption | null {
  if (!id) return null;
  return VIBE_FIELDS.find((f) => f.field === field)?.options.find((o) => o.id === id) ?? null;
}

// Northern-hemisphere season of a YYYY-MM-DD date (the app's copy is US English).
export function seasonFromDate(iso: string): string {
  const month = Number(iso.split('-')[1]);
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}
