import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { PaywallModal } from '../../components/PaywallModal';
import { colors } from '../../constants/colors';
import { QrCode, Clock, Users, Camera, ChevronLeft, Share } from 'lucide-react-native';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [showPaywall, setShowPaywall] = useState(false);

  // Mock data based on ID
  const event = {
    title: 'Sarah & James Wedding',
    date: 'Oct 24, 2026',
    shotLimit: 10,
    participantLimit: 100,
    revealTime: 'Scheduled',
    tier: 'Celebration',
    isRevealed: false,
    participants: 42,
  };

  return (
    <ScreenWrapper>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View className="flex-row justify-between items-center py-4">
        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-white rounded-full shadow-sm">
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity className="p-2 bg-white rounded-full shadow-sm">
          <Share size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text className="text-4xl font-serif text-textPrimary mb-2 mt-4">{event.title}</Text>
        <Text className="text-textSecondary font-sans text-lg mb-8">{event.date}</Text>

        {/* QRCodeCard */}
        <Card className="items-center mb-6 bg-accent/10 border-accent/20">
          <View className="bg-white p-4 rounded-2xl mb-4 shadow-sm">
            <QrCode size={120} color={colors.textPrimary} />
          </View>
          <Text className="text-textPrimary font-serifBold text-xl mb-2">Scan to Join</Text>
          <Button
            title="Copy Link"
            onPress={() => {}}
            variant="outline"
            className="h-10 w-40"
          />
        </Card>

        {/* SettingsSummaryCard */}
        <Card className="mb-6">
          <Text className="text-xl font-serifBold text-textPrimary mb-4">Event Details</Text>
          <View className="flex-row flex-wrap justify-between">
            <View className="w-[48%] bg-backgroundPrimary p-4 rounded-2xl mb-4">
              <Camera size={20} color={colors.accent} className="mb-2" />
              <Text className="text-textSecondary font-sans text-xs">Shot Limit</Text>
              <Text className="text-textPrimary font-serifBold text-lg">{event.shotLimit}</Text>
            </View>
            <View className="w-[48%] bg-backgroundPrimary p-4 rounded-2xl mb-4">
              <Users size={20} color={colors.accent} className="mb-2" />
              <Text className="text-textSecondary font-sans text-xs">Participants</Text>
              <Text className="text-textPrimary font-serifBold text-lg">{event.participants}/{event.participantLimit}</Text>
            </View>
            <View className="w-[48%] bg-backgroundPrimary p-4 rounded-2xl mb-4">
              <Clock size={20} color={colors.accent} className="mb-2" />
              <Text className="text-textSecondary font-sans text-xs">Reveal</Text>
              <Text className="text-textPrimary font-serifBold text-lg">{event.revealTime}</Text>
            </View>
            <View className="w-[48%] bg-backgroundPrimary p-4 rounded-2xl mb-4">
              <Text className="text-accent font-serifBold text-xs mb-2 uppercase">Tier</Text>
              <Text className="text-textPrimary font-serifBold text-lg">{event.tier}</Text>
            </View>
          </View>
        </Card>

        {/* GalleryPreview */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-serifBold text-textPrimary">Gallery</Text>
            <Text className="text-textSecondary font-sans text-sm">
              {event.isRevealed ? 'Revealed' : 'Hidden until reveal'}
            </Text>
          </View>
          
          <View className="flex-row flex-wrap justify-between">
            {[1, 2, 3, 4].map((i) => (
              <View key={i} className="w-[48%] h-32 bg-stone-200 rounded-2xl mb-4 overflow-hidden relative">
                <Image
                  source={{ uri: `https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=200&auto=format&fit=crop` }}
                  className={`w-full h-full ${!event.isRevealed ? 'opacity-50' : ''}`}
                  blurRadius={!event.isRevealed ? 10 : 0}
                />
                {!event.isRevealed && (
                  <View className="absolute inset-0 items-center justify-center">
                    <View className="bg-white/80 p-2 rounded-full">
                      <Clock size={16} color={colors.textSecondary} />
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* UpgradeButton */}
        <Button
          title="Upgrade Event"
          onPress={() => setShowPaywall(true)}
          className="mb-8"
        />
      </ScrollView>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onRestore={() => console.log('Restore')}
      />
    </ScreenWrapper>
  );
}
