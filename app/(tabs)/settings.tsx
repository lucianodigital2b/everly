import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { User, CreditCard, Bell, HardDrive, HelpCircle, Trash2, ChevronRight, Gift } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { Input } from '../../components/Input';
import { api } from '../../services/api';

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
  const [referralCode, setReferralCode] = useState('');
  const [referralError, setReferralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRedeemReferral = async () => {
    const code = referralCode.trim().toUpperCase();
    if (!code) {
      setReferralError('Please enter a referral code.');
      return;
    }
    setReferralError('');
    setIsSubmitting(true);
    try {
      await api.redeemReferralCode(code, 'current-user-id');
      setReferralCode('');
      Alert.alert('Code applied!', 'Your referral code has been redeemed successfully.');
    } catch {
      setReferralError('Invalid or already used code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenWrapper>
      <Text className="text-3xl font-serif text-textPrimary mt-6 mb-8">Settings</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="bg-backgroundSecondary rounded-3xl p-6 shadow-sm mb-6">
          <SettingItem icon={User} label="Profile" onPress={() => {}} />
          <SettingItem icon={CreditCard} label="Purchases" onPress={() => {}} />
          <SettingItem icon={Bell} label="Notifications" onPress={() => {}} />
          <SettingItem icon={HardDrive} label="Storage" onPress={() => {}} />
          <SettingItem icon={HelpCircle} label="Help" onPress={() => {}} />
        </View>

        <View className="bg-backgroundSecondary rounded-3xl p-6 shadow-sm mb-6">
          <View className="flex-row items-center mb-4">
            <View className="p-2 rounded-full bg-backgroundSecondary mr-4">
              <Gift size={20} color={colors.accent} />
            </View>
            <Text className="font-sansMedium text-base text-textPrimary">Referral Code</Text>
          </View>
          <Input
            placeholder="ENTER CODE"
            value={referralCode}
            onChangeText={(v) => { setReferralCode(v); setReferralError(''); }}
            autoCapitalize="characters"
            error={referralError}
          />
          <TouchableOpacity
            onPress={handleRedeemReferral}
            disabled={isSubmitting}
            className="mt-3 h-12 rounded-2xl items-center justify-center"
            style={{ backgroundColor: colors.accent }}
          >
            {isSubmitting
              ? <ActivityIndicator color="#fff" />
              : <Text className="font-sansSemiBold text-sm text-white">Redeem</Text>
            }
          </TouchableOpacity>
        </View>

        <View className="bg-backgroundSecondary rounded-3xl p-6 shadow-sm">
          <SettingItem icon={Trash2} label="Delete Account" onPress={() => {}} isDestructive />
        </View>

        <Text className="text-center text-textSecondary font-sansSemiBold text-xs mt-8">
          Everly v1.0.0
        </Text>
      </ScrollView>
    </ScreenWrapper>
  );
}
