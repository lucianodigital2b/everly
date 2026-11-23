import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Headset } from 'lucide-react-native';
import { colors } from '../constants/colors';
import { t } from '../i18n';

/**
 * Floating button that opens the wedding assistant (support chat). The tab
 * layout passes `bottom` (bottom inset + nav pill + gap, applied by hand).
 * Same gold-to-rose gradient as the active tab, so it reads as part of the bar.
 *
 * The app's Pressable comes through NativeWind, which drops function styles
 * (`style={({ pressed }) => …}`): with one, the button lost its placement and
 * rendered at the left edge. Styles here are plain arrays.
 */
export function AssistantFab({ bottom }: { bottom: number }) {
  // NativeWind's Pressable drops function styles, so pressed comes from state.
  const [pressed, setPressed] = useState(false);
  return (
    <View style={[styles.anchor, { bottom }]} pointerEvents="box-none">
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          router.push('/assistant');
        }}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={[styles.shadow, pressed && styles.pressed]}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={t('assistant.open')}
      >
        <LinearGradient
          colors={[colors.accentBright, colors.accentDeep]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.circle}
        >
          <Headset size={24} color="#2E2429" strokeWidth={2.1} />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const SIZE = 54;

const styles = StyleSheet.create({
  anchor: { position: 'absolute', right: 20, alignItems: 'flex-end' },
  pressed: { transform: [{ scale: 0.94 }] },
  shadow: {
    borderRadius: SIZE / 2,
    shadowColor: colors.accentDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
