import { Tabs } from 'expo-router';
import { View, TouchableOpacity } from 'react-native';
import { Home, Plus, Settings } from 'lucide-react-native';
import { colors } from '../../constants/colors';

const CreateButton = ({ children, onPress }: any) => (
  <TouchableOpacity
    style={{
      top: -30,
      justifyContent: 'center',
      alignItems: 'center',
    }}
    onPress={onPress}
    activeOpacity={0.9}
  >
    <View
      style={{
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
      }}
    >
      <Plus size={32} color="#fff" strokeWidth={2.5} />
    </View>
  </TouchableOpacity>
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 25,
          left: 20,
          right: 20,
          elevation: 0,
          backgroundColor: '#ffffff',
          borderRadius: 24,
          height: 80,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          borderTopWidth: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Home
                size={24}
                color={focused ? colors.accent : colors.textSecondary}
                strokeWidth={focused ? 2.5 : 2}
              />
              {focused && (
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent, marginTop: 4 }} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          tabBarButton: (props) => <CreateButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Settings
                size={24}
                color={focused ? colors.accent : colors.textSecondary}
                strokeWidth={focused ? 2.5 : 2}
              />
              {focused && (
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent, marginTop: 4 }} />
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
