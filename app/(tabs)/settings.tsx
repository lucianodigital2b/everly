import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { CreditCard, Bell, HelpCircle, Shield, Trash2, ChevronRight, LogOut, Sparkles, Globe } from 'lucide-react-native';
import { loadDemoWedding } from '../../utils/devSeed';
import { colors } from '../../constants/colors';
import { authApi } from '../../services/api';
import { wipeLocalData } from '../../utils/wipeLocalData';
import { useRevenueCat } from '../../hooks/useRevenueCat';
import { authStore } from '../../zustand/auth-store';
import actions from '../../zustand/auth-store/actions';
import { t, LANGUAGE } from '../../i18n';

const SUPPORT_EMAIL = 'luciano@getclevernote.app';
const PRIVACY_URL = 'https://everly.koffeecode.com/privacy';

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

const SettingItem = ({ icon: Icon, label, onPress, isDestructive = false, value }: any) => (
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
    <View className="flex-row items-center">
      {value ? (
        <Text className="font-sans text-sm text-textSecondary mr-1">{value}</Text>
      ) : null}
      <ChevronRight size={20} color={colors.textSecondary} />
    </View>
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
    Alert.alert(t("settings.signOutTitle"), t("settings.signOutMessage"), [
      { text: t("settings.cancel"), style: 'cancel' },
      {
        text: t("settings.signOutTitle"),
        style: 'destructive',
        onPress: async () => {
          await logout();
          // Straight to welcome: '/' also matches the Home tab (app/(tabs)/index),
          // so replacing to '/' left the signed-out user inside the app.
          if (router.canDismiss()) router.dismissAll();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  const handleHelp = async () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(t('settings.helpSubject'))}`;
    if (await Linking.canOpenURL(url)) {
      Linking.openURL(url);
    } else {
      Alert.alert(t('settings.noMailApp'), t('settings.reachUs', { email: SUPPORT_EMAIL }));
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t("settings.deleteAccountTitle"),
      t("settings.deleteAccountMessage"),
      [
        { text: t("settings.cancel"), style: 'cancel' },
        {
          text: t("settings.delete"),
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await authApi.deleteAccount();
              // The plan, budget and guest list are stored only on this phone;
              // the server delete can't reach them.
              await wipeLocalData();
              await logout();
              if (router.canDismiss()) router.dismissAll();
              router.replace('/(auth)/welcome');
            } catch (e: any) {
              Alert.alert(
                t("settings.deleteAccountErrorTitle"),
                e?.response?.data?.message ?? t("settings.deleteAccountErrorFallback")
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
      <Text className="text-3xl font-serif text-textPrimary mt-6 mb-8">{t("settings.title")}</Text>

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
              {user?.name ?? t("settings.yourAccount")}
            </Text>
            <Text className="font-sans text-xs text-textSecondary mt-0.5" numberOfLines={1}>
              {user?.email ?? t("settings.noEmail")}
            </Text>
          </View>
        </View>

        <View className="bg-backgroundSecondary rounded-3xl p-6 mb-6" style={CARD_SHADOW}>
          <SettingItem icon={CreditCard} label={t("settings.purchases")} onPress={openCustomerCenter} />
          <SettingItem icon={Bell} label={t("settings.notifications")} onPress={() => Linking.openSettings()} />
          {/* iOS per-app language (Settings > Everly > Language): the app declares en + pt
              in app.json "locales", and i18n reads it at launch; iOS relaunches the app on change. */}
          <SettingItem
            icon={Globe}
            label={t("settings.language")}
            value={LANGUAGE === 'pt' ? 'Português' : 'English'}
            onPress={() => Linking.openSettings()}
          />
          <SettingItem icon={HelpCircle} label={t("settings.help")} onPress={handleHelp} />
          <SettingItem icon={Shield} label={t("settings.privacyPolicy")} onPress={() => Linking.openURL(PRIVACY_URL)} />
          {__DEV__ ? (
            <SettingItem
              icon={Sparkles}
              label={t("settings.loadDemoWedding")}
              onPress={() => {
                loadDemoWedding();
                router.push('/(tabs)/plan');
              }}
            />
          ) : null}
        </View>

        <View className="bg-backgroundSecondary rounded-3xl p-6" style={CARD_SHADOW}>
          <SettingItem icon={LogOut} label={t("settings.signOutTitle")} onPress={handleLogout} isDestructive />
          {isDeleting ? (
            <View className="py-4 items-center">
              <ActivityIndicator color={colors.error} />
            </View>
          ) : (
            <SettingItem icon={Trash2} label={t("settings.deleteAccountTitle")} onPress={handleDeleteAccount} isDestructive />
          )}
        </View>

        <Text className="text-center text-textSecondary font-sansSemiBold text-xs mt-8">
          {t("settings.appVersion", { version: Constants.expoConfig?.version })}
        </Text>
      </ScrollView>
    </ScreenWrapper>
  );
}
