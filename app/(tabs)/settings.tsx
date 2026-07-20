import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { CreditCard, Bell, HelpCircle, Trash2, ChevronRight, LogOut } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { authApi } from '../../services/api';
import { useRevenueCat } from '../../hooks/useRevenueCat';
import { authStore } from '../../zustand/auth-store';
import actions from '../../zustand/auth-store/actions';

const SUPPORT_EMAIL = 'luciano@getclevernote.app';

// Tailwind's `shadow-sm` translates to a tight, offset iOS shadow that reads as a
// hard band on the right/bottom edge. A wide, low-opacity shadow matches the
// soft/editorial design language instead.
const CARD_SHADOW = {
  shadowColor: '#2E2429',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.06,
  shadowRadius: 20,
  elevation: 3,
};

const SettingItem = ({ icon: Icon, label, onPress, isDestructive = false }: any) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center justify-between py-4 border-b border-white/10"
  >
    <View className="flex-row items-center">
      <View className={`p-2 rounded-full mr-4 ${isDestructive ? 'bg-error/10' : 'bg-backgroundSecondary'}`}>
        <Icon size={20} color={isDestructive ? colors.error : colors.textPrimary} />
      </View>
      <Text className={`font-sansMedium text-base ${isDestructive ? 'text-error' : 'text-textPrimary'}`}>
        {label}
      </Text>
    </View>
    <ChevronRight size={20} color={colors.textSecondary} />
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const router = useRouter();
  const dispatch = authStore((s) => s.dispatch);
  const { logout } = actions(dispatch);
  const user = authStore((s) => s.data?.user);
  const { openCustomerCenter } = useRevenueCat();

  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  };

  const handleHelp = async () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Everly — Help')}`;
    if (await Linking.canOpenURL(url)) {
      Linking.openURL(url);
    } else {
      Alert.alert('No mail app', `Reach us at ${SUPPORT_EMAIL}.`);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This permanently deletes your account, your events and every photo your guests uploaded. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await authApi.deleteAccount();
              await logout();
              router.replace('/(auth)/welcome');
            } catch (e: any) {
              Alert.alert(
                "Couldn't delete account",
                e?.response?.data?.message ?? 'Please try again, or contact support.'
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper>
      <Text className="text-3xl font-serif text-textPrimary mt-6 mb-8">Settings</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Account — the signed-in user, not a link to a screen that doesn't exist */}
        <View className="bg-backgroundSecondary rounded-3xl p-6 mb-6 flex-row items-center" style={CARD_SHADOW}>
          <View className="w-14 h-14 rounded-full bg-accent/15 items-center justify-center mr-4">
            <Text className="font-sansBold text-lg text-accentDeep">
              {(user?.name ?? '?').trim().charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="font-sansSemiBold text-base text-textPrimary" numberOfLines={1}>
              {user?.name ?? 'Your account'}
            </Text>
            <Text className="font-sans text-xs text-textSecondary mt-0.5" numberOfLines={1}>
              {user?.email ?? '—'}
            </Text>
          </View>
        </View>

        <View className="bg-backgroundSecondary rounded-3xl p-6 mb-6" style={CARD_SHADOW}>
          <SettingItem icon={CreditCard} label="Purchases" onPress={openCustomerCenter} />
          <SettingItem icon={Bell} label="Notifications" onPress={() => Linking.openSettings()} />
          <SettingItem icon={HelpCircle} label="Help" onPress={handleHelp} />
        </View>

        <View className="bg-backgroundSecondary rounded-3xl p-6" style={CARD_SHADOW}>
          <SettingItem icon={LogOut} label="Sign Out" onPress={handleLogout} isDestructive />
          {isDeleting ? (
            <View className="py-4 items-center">
              <ActivityIndicator color={colors.error} />
            </View>
          ) : (
            <SettingItem icon={Trash2} label="Delete Account" onPress={handleDeleteAccount} isDestructive />
          )}
        </View>

        <Text className="text-center text-textSecondary font-sansSemiBold text-xs mt-8">
          Everly v1.0.0
        </Text>
      </ScrollView>
    </ScreenWrapper>
  );
}
