import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { User, CreditCard, Bell, HardDrive, HelpCircle, Trash2, ChevronRight } from 'lucide-react-native';
import { colors } from '../../constants/colors';

const SettingItem = ({ icon: Icon, label, onPress, isDestructive = false }: any) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center justify-between py-4 border-b border-stone-100"
  >
    <View className="flex-row items-center">
      <View className={`p-2 rounded-full mr-4 ${isDestructive ? 'bg-red-50' : 'bg-backgroundSecondary'}`}>
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
  return (
    <ScreenWrapper>
      <Text className="text-3xl font-serif text-textPrimary mt-6 mb-8">Settings</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="bg-white rounded-3xl p-6 shadow-sm mb-6">
          <SettingItem icon={User} label="Profile" onPress={() => {}} />
          <SettingItem icon={CreditCard} label="Purchases" onPress={() => {}} />
          <SettingItem icon={Bell} label="Notifications" onPress={() => {}} />
          <SettingItem icon={HardDrive} label="Storage" onPress={() => {}} />
          <SettingItem icon={HelpCircle} label="Help" onPress={() => {}} />
        </View>

        <View className="bg-white rounded-3xl p-6 shadow-sm">
          <SettingItem icon={Trash2} label="Delete Account" onPress={() => {}} isDestructive />
        </View>

        <Text className="text-center text-textSecondary font-sansLight text-xs mt-8">
          Everly v1.0.0
        </Text>
      </ScrollView>
    </ScreenWrapper>
  );
}
