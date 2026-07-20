import React from 'react';
import { View, ViewProps } from 'react-native';
import { colors } from '../constants/colors';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

// Puffy floating card: white fill, generous radius, soft lift + hairline border.
export const Card: React.FC<CardProps> = ({ children, className = '', style, ...props }) => {
  return (
    <View
      className={`bg-backgroundSecondary rounded-[26px] p-6 border ${className}`}
      style={[
        {
          borderColor: colors.border,
          shadowColor: '#3A2E14',
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.16,
          shadowRadius: 26,
          elevation: 4,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};
