import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { colors } from '../constants/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  className = '',
}) => {
  const baseStyle = "h-14 rounded-full items-center justify-center w-full shadow-sm";
  const variantStyles = {
    primary: "bg-accent",
    secondary: "bg-backgroundSecondary",
    outline: "border border-accent bg-transparent",
  };
  const textStyles = {
    primary: "text-white font-serifBold text-lg",
    secondary: "text-textPrimary font-serifBold text-lg",
    outline: "text-accent font-serifBold text-lg",
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      className={`${baseStyle} ${variantStyles[variant]} ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.accent : colors.white} />
      ) : (
        <Text className={textStyles[variant]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
