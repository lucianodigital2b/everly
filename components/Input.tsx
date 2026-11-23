import React, { forwardRef, useState } from 'react';
import { TextInput, View, Text, TextInputProps, Pressable } from 'react-native';
import { Eye, EyeOff, X } from 'lucide-react-native';
import { colors } from '../constants/colors';
import { t } from '../i18n';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: string;
  /** Shows an X at the end of the field once there's something to clear. */
  onClear?: () => void;
}

// The ref lands on the inner TextInput, so callers can drive focus() — that's
// what makes returnKeyType="next" actually move between fields.
export const Input = forwardRef<TextInput, InputProps>(({
  label,
  error,
  containerStyle = '',
  className = '',
  secureTextEntry,
  onClear,
  ...props
}, ref) => {
  const [revealed, setRevealed] = useState(false);
  const isPassword = !!secureTextEntry;
  // Nothing typed, nothing to clear — an always-on X is just noise.
  const canClear = !!onClear && !!props.value;

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
        {canClear && (
          <Pressable
            onPress={onClear}
            // The glyph is small; the tap target has to be finger-sized.
            hitSlop={12}
            className="pl-3"
            accessibilityRole="button"
            accessibilityLabel={t('input.clear')}
          >
            <X size={18} color={colors.textTertiary} />
          </Pressable>
        )}
        {isPassword && (
          <Pressable
            onPress={() => setRevealed((v) => !v)}
            hitSlop={10}
            className="pl-3"
            accessibilityRole="button"
            accessibilityLabel={revealed ? t('input.hidePassword') : t('input.showPassword')}
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
