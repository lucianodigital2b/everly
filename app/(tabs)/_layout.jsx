import React, { useRef, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { Tabs, useRouter } from "expo-router";
import {
  Text,
  View,
  Animated,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import * as Icons from "react-native-heroicons/outline";

// ─── Tab Icon ────────────────────────────────────────────────────────────────
const TabIcon = ({ icon, focused }) => (
  <View style={styles.tabIconWrapper}>
    {React.cloneElement(icon, {
      color: focused ? "#10b981" : "#9ca3af",
      size: focused ? 26 : 24,
    })}
  </View>
);

// ─── Floating Glass Tab Bar ───────────────────────────────────────────────────
const FloatingTabBar = ({ state, descriptors, navigation }) => {
  const animatedValues = useRef(
    state.routes.map((_, i) => new Animated.Value(i === state.index ? 1 : 0))
  ).current;

  React.useEffect(() => {
    animatedValues.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: state.index === i ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [state.index]);

  return (
    <View style={styles.tabBarOuter}>
      <BlurView intensity={80} tint="light" style={styles.blurView}>
        <View style={styles.glassOverlay} />
        <View style={styles.tabRow}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const scale = animatedValues[index].interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.15],
            });
            const translateY = animatedValues[index].interpolate({
              inputRange: [0, 1],
              outputRange: [0, -3],
            });

            const onPress = () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.tabButton}
                activeOpacity={0.8}
              >
                <Animated.View
                  style={{
                    transform: [{ scale }, { translateY }],
                    alignItems: "center",
                  }}
                >
                  {options.tabBarIcon?.({
                    focused: isFocused,
                    color: isFocused ? "#10b981" : "#9ca3af",
                    size: 24,
                  })}
                  {isFocused && <View style={styles.activeDot} />}
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
};

// ─── Layout ───────────────────────────────────────────────────────────────────
const TabLayout = () => {
  const router = useRouter();
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Events",
            tabBarIcon: ({ focused }) => (
              <TabIcon icon={<Icons.PhotoIcon />} focused={focused} />
            ),
          }}
        />

        {/* Keep create route hidden from tab labels; navigate via floating button */}
        <Tabs.Screen name="create" options={{ href: null }} />

        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ focused }) => (
              <TabIcon icon={<Icons.Cog6ToothIcon />} focused={focused} />
            ),
          }}
        />
      </Tabs>

      {/* Floating center Create button */}
      <View style={styles.fabContainer} pointerEvents="box-none">
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/(tabs)/create");
          }}
          style={styles.fab}
          activeOpacity={0.9}
        >
          <Icons.PlusIcon color="#fff" size={28} />
        </TouchableOpacity>
      </View>

      <StatusBar style="dark" />
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarOuter: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    height: 68,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 16,
  },
  blurView: {
    flex: 1,
    borderRadius: 34,
    overflow: "hidden",
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 34,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
  },
  tabRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  tabIconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#10b981",
    marginTop: 2,
  },
  fabContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 52,
    alignItems: "center",
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#C6A96B",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
});

export default TabLayout;
