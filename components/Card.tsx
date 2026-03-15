import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <View
      className={`bg-backgroundSecondary rounded-3xl p-6 shadow-sm border border-white/10 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
};
