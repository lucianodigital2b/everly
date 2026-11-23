// Shared surface for the floating cards on Home: big continuous (squircle)
// corners, a thin white rim over a slightly translucent fill so the edge reads
// like glass, and a wide, faint rose-tinted shadow instead of a grey one.
import type { ViewStyle } from 'react-native';

export const CARD_RADIUS = 28;

export const cardSurface: ViewStyle = {
  backgroundColor: 'rgba(255,255,255,0.78)',
  borderRadius: CARD_RADIUS,
  borderCurve: 'continuous',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.95)',
  shadowColor: '#8B5A66',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.08,
  shadowRadius: 28,
  elevation: 3,
};
