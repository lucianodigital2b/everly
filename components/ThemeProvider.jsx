import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { View } from 'react-native';

const ThemeProvider = ({ children }) => {
  const { colorScheme, setColorScheme } = useColorScheme();

  useEffect(() => {
    // Apply the color scheme to the entire app
    if (colorScheme === 'dark') {
      // Apply dark theme styles
    } else {
      // Apply light theme styles
    }
    // Optional: Persist the theme preference if needed
    // For example, using AsyncStorage
  }, [colorScheme]);

  // This is a simplified example. In a real app, you might use a context provider
  // to make the theme and toggle function available throughout your app.
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} backgroundColor={colorScheme === 'dark' ? '#1a1a1a' : '#f9f7fa'} />
      {children}
    </View>
  );
};

export default ThemeProvider;