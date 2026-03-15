import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { authStore } from '../zustand/auth-store';
import { colors } from '../constants/colors';

export default function Index() {
  const [hydrated, setHydrated] = useState(
    () => authStore.persist.hasHydrated()
  );
  const token = authStore((s) => s.data?.token);

  useEffect(() => {
    if (hydrated) return;
    const unsub = authStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, [hydrated]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.backgroundPrimary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return <Redirect href={token ? '/(tabs)' : '/(auth)/sign-in'} />;
}
