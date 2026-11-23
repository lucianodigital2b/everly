import { LANGUAGE, t } from '../i18n';

// "About our wedding" answers: asked in the setup wizard, shown and edited on
// the Plan tab. Ids are persisted, so never rename an existing one.

export type VibeField = 'color' | 'season' | 'style' | 'honeymoon';

export interface VibeOption {
  id: string;
  label: string;
  hex?: string; // colors only
}

export const VIBE_COLORS: VibeOption[] = [
  { id: 'blush', label: t('vibe.colors.blush'), hex: '#E6A9B4' },
  { id: 'sage', label: t('vibe.colors.sage'), hex: '#A7B89A' },
  { id: 'dusty_blue', label: t('vibe.colors.dustyBlue'), hex: '#8FA9C7' },
  { id: 'terracotta', label: t('vibe.colors.terracotta'), hex: '#C9775A' },
  { id: 'lavender', label: t('vibe.colors.lavender'), hex: '#B7A3D6' },
  { id: 'burgundy', label: t('vibe.colors.burgundy'), hex: '#7E2F3E' },
  { id: 'emerald', label: t('vibe.colors.emerald'), hex: '#2F6F57' },
  { id: 'gold', label: t('vibe.colors.gold'), hex: '#C9A45C' },
  { id: 'ivory', label: t('vibe.colors.ivory'), hex: '#EFE6D6' },
  { id: 'black_white', label: t('vibe.colors.blackWhite'), hex: '#2E2429' },
];

export const VIBE_SEASONS: VibeOption[] = [
  { id: 'spring', label: t('vibe.seasons.spring') },
  { id: 'summer', label: t('vibe.seasons.summer') },
  { id: 'fall', label: t('vibe.seasons.fall') },
  { id: 'winter', label: t('vibe.seasons.winter') },
];

export const VIBE_STYLES: VibeOption[] = [
  { id: 'classic', label: t('vibe.styles.classic') },
  { id: 'rustic', label: t('vibe.styles.rustic') },
  { id: 'boho', label: t('vibe.styles.boho') },
  { id: 'modern', label: t('vibe.styles.modern') },
  { id: 'garden', label: t('vibe.styles.garden') },
  { id: 'beach', label: t('vibe.styles.beach') },
  { id: 'glam', label: t('vibe.styles.glam') },
  { id: 'minimal', label: t('vibe.styles.minimal') },
];

export const VIBE_HONEYMOONS: VibeOption[] = [
  { id: 'beach', label: t('vibe.honeymoons.beach') },
  { id: 'europe', label: t('vibe.honeymoons.europe') },
  { id: 'adventure', label: t('vibe.honeymoons.adventure') },
  { id: 'city', label: t('vibe.honeymoons.city') },
  { id: 'road_trip', label: t('vibe.honeymoons.roadTrip') },
  { id: 'staycation', label: t('vibe.honeymoons.staycation') },
  { id: 'undecided', label: t('vibe.honeymoons.undecided') },
];

export const VIBE_FIELDS: { field: VibeField; label: string; options: VibeOption[] }[] = [
  { field: 'color', label: t('vibe.fields.color'), options: VIBE_COLORS },
  { field: 'season', label: t('vibe.fields.season'), options: VIBE_SEASONS },
  { field: 'style', label: t('vibe.fields.style'), options: VIBE_STYLES },
  { field: 'honeymoon', label: t('vibe.fields.honeymoon'), options: VIBE_HONEYMOONS },
];

export function vibeOption(field: VibeField, id: string | null): VibeOption | null {
  if (!id) return null;
  return VIBE_FIELDS.find((f) => f.field === field)?.options.find((o) => o.id === id) ?? null;
}

// Northern-hemisphere season of a YYYY-MM-DD date. Brazilian users are in the
// southern hemisphere, so December is summer there, not winter: when the app
// runs in Portuguese we flip the northern result.
export function seasonFromDate(iso: string): string {
  const month = Number(iso.split('-')[1]);
  let season = 'winter';
  if (month >= 3 && month <= 5) season = 'spring';
  if (month >= 6 && month <= 8) season = 'summer';
  if (month >= 9 && month <= 11) season = 'fall';
  if (LANGUAGE === 'pt') {
    if (season === 'spring') return 'fall';
    if (season === 'fall') return 'spring';
    if (season === 'summer') return 'winter';
    if (season === 'winter') return 'summer';
  }
  return season;
}
