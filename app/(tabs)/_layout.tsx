import { Tabs, TabList, TabTrigger, TabSlot } from 'expo-router/ui';
import type { TabTriggerSlotProps } from 'expo-router/ui';
import { View, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Home, Plus, Settings } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { forwardRef } from 'react';

const TabButton = forwardRef<View, TabTriggerSlotProps & { icon: 'home' | 'settings' }>(
  ({ isFocused, onPress, icon }, ref) => {
    const Icon = icon === 'home' ? Home : Settings;
    return (
      <Pressable ref={ref} onPress={onPress} style={styles.tabButton}>
        <Icon
          size={24}
          color={isFocused ? colors.accent : colors.textSecondary}
          strokeWidth={isFocused ? 2.5 : 2}
        />
        {isFocused && <View style={styles.dot} />}
      </Pressable>
    );
  }
);

const CreateButton = forwardRef<View, TabTriggerSlotProps>(({ onPress }, ref) => (
  <TouchableOpacity
    ref={ref}
    onPress={onPress}
    style={styles.createOuter}
    activeOpacity={0.9}
  >
    <View style={styles.createInner}>
      <Plus size={32} color="#fff" strokeWidth={2.5} />
    </View>
  </TouchableOpacity>
));

export default function TabLayout() {
  return (
    <Tabs>
      <TabSlot />
      <TabList style={styles.tabList}>
        <TabTrigger name="index" href="/(tabs)" asChild>
          <TabButton icon="home" />
        </TabTrigger>
        <TabTrigger name="create" href="/(tabs)/create" asChild>
          <CreateButton />
        </TabTrigger>
        <TabTrigger name="settings" href="/(tabs)/settings" asChild>
          <TabButton icon="settings" />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabList: {
    position: 'absolute',
    bottom: 25,
    alignSelf: 'center',
    flexDirection: 'row',
    borderRadius: 32,
    backgroundColor: '#2e2c2b',
    height: 80,
    alignItems: 'center',
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  tabButton: {
    width: 72,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginTop: 4,
  },
  createOuter: {
    width: 72,
    height: 80,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 8,
  },
  createInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 4,
    borderColor: colors.backgroundPrimary,
    marginBottom: 8,
  },
});
