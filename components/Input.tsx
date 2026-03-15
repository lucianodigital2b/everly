import React from 'react';
import { TextInput, View, Text, TextInputProps } from 'react-native';
import { colors } from '../constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle = '',
  className = '',
  ...props
}) => {
  return (
    <View className={`w-full ${containerStyle}`}>
      {label && (
        <Text className="text-textSecondary font-sansSemiBold mb-2 text-sm uppercase tracking-wider">
          {label}
        </Text>
      )}
      <View className={`bg-backgroundSecondary h-14 rounded-2xl border ${error ? 'border-error' : 'border-white/10'} px-4 justify-center`}>
        <TextInput
          placeholderTextColor={colors.textSecondary}
          className={`font-sans text-textPrimary text-base h-full ${className}`}
          {...props}
        />
      </View>
      {error && <Text className="text-error text-xs mt-1 font-sans">{error}</Text>}
    </View>
  );
};
