import React from 'react';
import { SafeAreaView, StatusBar, View } from 'react-native';
import { colors } from '../constants/colors';

interface ScreenWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ children, className = '' }) => {
  return (
    <SafeAreaView
      className="flex-1 bg-backgroundPrimary"
      style={{ flex: 1, backgroundColor: colors.backgroundPrimary }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.backgroundPrimary} />
      <View className={`flex-1 px-6 ${className}`} style={{ flex: 1 }}>
        {children}
      </View>
    </SafeAreaView>
  );
};
