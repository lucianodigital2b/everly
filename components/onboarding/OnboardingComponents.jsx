import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  interpolate,
} from 'react-native-reanimated';
// import CustomImage from '@/components/ui/CustomImage';
import { CheckBadgeIcon } from 'react-native-heroicons/outline';
import CustomImage from './CustomImage';
import { colors } from '../../constants';

export const FeatureCard = ({
  icon,
  feature,
  index,
}) => {
  const isDarkMode = true;
  const animatedValue = useSharedValue(0);

  React.useEffect(() => {
    animatedValue.value = withTiming(1, { duration: 400 + index * 100 });
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: animatedValue.value,
      transform: [
        { translateY: interpolate(animatedValue.value, [0, 1], [20, 0]) },
      ],
    };
  });

  return (
    <Animated.View
      className="flex-row items-center mb-4 p-3 rounded-xl"
      style={[
        animatedStyle,
        {
          backgroundColor: isDarkMode ? '#222222' : 'rgba(0,0,0,0.03)',
        },
      ]}
    >
      <Text className="text-xl mr-3">{icon}</Text>
      <Text
        className="text-base flex-1 font-medium"
        style={{
          color: isDarkMode ? colors.white : colors.gray[900],
        }}
      >
        {feature}
      </Text>
    </Animated.View>
  );
};

export const CustomImageBackground = ({
  source,
  style,
  className,
  children,
}) => {
  return (
    <View style={[styles.imageBackground, style]} className={className}>
      <CustomImage
        source={source}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      {children}
    </View>
  );
};

export const AnimatedOption = ({
  option,
  index,
  isSelected,
  onSelect,
  isDarkMode,
  colors,
}) => {
  const animatedValue = useSharedValue(0);

  React.useEffect(() => {
    animatedValue.value = withTiming(1, { duration: 400 + index * 100 });
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: animatedValue.value,
      transform: [
        { translateY: interpolate(animatedValue.value, [0, 1], [20, 0]) },
      ],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPress={onSelect}
        className={`p-4 rounded-xl border-2 flex-row items-center ${
          isSelected
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
            : isDarkMode
            ? 'border-gray-800 bg-gray-900'
            : 'border-gray-200 bg-white'
        }`}
        style={{
          transform: [{ scale: isSelected ? 1.02 : 1 }],
          backgroundColor: isSelected
            ? isDarkMode
              ? 'rgba(130, 0, 252, 0.15)'
              : colors.primary[50]
            : isDarkMode
            ? '#1e1e1e'
            : colors.white,
          borderColor: isSelected
            ? colors.primary[500]
            : isDarkMode
            ? '#2c2c2c'
            : colors.gray[200],
        }}
      >
        <Text className="text-2xl mr-3">{option.icon}</Text>
        <Text
          className="text-lg flex-1"
          style={{
            color: isSelected
              ? colors.primary[500]
              : isDarkMode
              ? colors.white
              : colors.gray[900],
            fontWeight: isSelected ? '600' : 'normal',
          }}
        >
          {option.text}
        </Text>
        {isSelected && (
          <Animated.View
            entering={FadeIn.duration(200)}
            className="w-6 h-6 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary[500] }}
          >
            <CheckBadgeIcon size={16} color="white" />
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export const AnimatedFeatureIcon = ({
  icon,
  label,
  index,
  marginRight = false,
}) => {
  const animatedValue = useSharedValue(0);

  React.useEffect(() => {
    animatedValue.value = withTiming(1, { duration: 400 + index * 100 });
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: animatedValue.value,
      transform: [
        { translateY: interpolate(animatedValue.value, [0, 1], [20, 0]) },
      ],
    };
  });

  return (
    <Animated.View style={animatedStyle} className={marginRight ? 'mr-3' : ''}>
      <View className="bg-white/20 p-3 rounded-xl items-center">
        {icon}
        <Text className="text-white text-xs mt-1">{label}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  imageBackground: {
    flex: 1,
    position: 'relative',
  },
});
