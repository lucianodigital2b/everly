import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <View
      className={`bg-white rounded-3xl p-6 shadow-sm border border-stone-100 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
};
