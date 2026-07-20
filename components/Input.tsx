import React, { forwardRef, useState } from 'react';
import { TextInput, View, Text, TextInputProps, Pressable } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors } from '../constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: string;
}

// The ref lands on the inner TextInput, so callers can drive focus() — that's
// what makes returnKeyType="next" actually move between fields.
export const Input = forwardRef<TextInput, InputProps>(({
  label,
  error,
  containerStyle = '',
  className = '',
  secureTextEntry,
  ...props
}, ref) => {
  const [revealed, setRevealed] = useState(false);
  const isPassword = !!secureTextEntry;

  return (
    <View className={`w-full ${containerStyle}`}>
      {label && (
        <Text className="text-textSecondary font-sansSemiBold mb-2 text-sm uppercase tracking-wider">
          {label}
        </Text>
      )}
      <View
        className={`bg-surface2 h-14 rounded-2xl border ${error ? 'border-error' : 'border-black/5'} px-4 flex-row items-center`}
      >
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textTertiary}
          className={`font-sans text-textPrimary text-base h-full flex-1 ${className}`}
          secureTextEntry={isPassword && !revealed}
          {...props}
        />
        {isPassword && (
          <Pressable
            onPress={() => setRevealed((v) => !v)}
            hitSlop={10}
            className="pl-3"
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
          >
            {revealed ? (
              <EyeOff size={19} color={colors.textSecondary} />
            ) : (
              <Eye size={19} color={colors.textSecondary} />
            )}
          </Pressable>
        )}
      </View>
      {error && <Text className="text-error text-xs mt-1 font-sans">{error}</Text>}
    </View>
  );
});

Input.displayName = 'Input';
