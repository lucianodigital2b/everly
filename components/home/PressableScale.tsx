import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = React.ComponentProps<typeof Pressable> & {
  style?: StyleProp<ViewStyle>;
};

export function PressableScale({
  children,
  style,
  onPress,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        scale.value = withTiming(0.97, {
          duration: 120,
          easing: Easing.bezier(0.23, 1, 0.32, 1),
        });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withTiming(1, {
          duration: 160,
          easing: Easing.bezier(0.23, 1, 0.32, 1),
        });
        onPressOut?.(e);
      }}
      onPress={(e) => {
        Haptics.selectionAsync();
        onPress?.(e);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
