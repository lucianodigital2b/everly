import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNotifications } from '../hooks/useNotifications';
import { useTranslation } from 'react-i18next';
import * as Icons from 'react-native-heroicons/outline';
import { authStore } from '../zustand/auth-store';

const NotificationPrompt = ({ onDismiss }) => {
  const { t } = useTranslation();
  const { permissionStatus, requestPermissions, scheduleDailyNotifications } = useNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Get user data from auth store
  const userData = authStore(state => state?.data?.user);
  const completedOnboarding = userData?.onboarding_completed === "1" || userData?.onboarding_completed === true;

  // Don't show if already granted, dismissed, or user completed onboarding (which includes notification setup)
  if (permissionStatus === 'granted' || dismissed || completedOnboarding) {
    return null;
  }

  const handleEnableNotifications = async () => {
    setLoading(true);
    const success = await scheduleDailyNotifications();
    setLoading(false);
    
    if (success) {
      // If successful, this will hide the prompt since permissionStatus will update
      if (onDismiss) onDismiss();
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  return (
    <View className="mb-6 bg-purple-900/30 border border-purple-500/30 rounded-2xl p-4">
      <View className="flex-row items-start">
        <View className="bg-purple-500/20 rounded-full p-2 mr-3">
          <Icons.BellAlertIcon size={24} color="#d8b4fe" />
        </View>
        <View className="flex-1">
          <Text className="text-white font-psemibold text-base mb-1">
            {t('notifications:enable_title', 'Stay on top of your studies')}
          </Text>
          <Text className="text-white/80 font-pregular text-sm mb-3">
            {t('notifications:enable_description', 'Enable notifications to get daily reminders and never miss your study sessions.')}
          </Text>
          <View className="flex-row">
            <TouchableOpacity
              onPress={handleEnableNotifications}
              disabled={loading}
              className="bg-purple-600 rounded-xl py-2 px-4 mr-3"
            >
              <Text className="text-white font-pmedium text-sm">
                {loading ? t('common:loading') : t('notifications:enable_button', 'Enable Notifications')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDismiss}
              className="bg-white/10 rounded-xl py-2 px-4"
            >
              <Text className="text-white/70 font-pmedium text-sm">
                {t('common:not_now', 'Not Now')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default NotificationPrompt;