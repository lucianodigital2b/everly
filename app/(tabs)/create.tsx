import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';

export default function CreateScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    date: '',
    revealMode: 'Scheduled',
    shotLimit: '',
    participantLimit: '',
  });

  const handleCreate = () => {
    // API call would go here
    console.log('Creating event:', formData);
    router.push('/(tabs)');
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text className="text-3xl font-serif text-textPrimary mt-6 mb-8">Create a New Moment</Text>

        <View className="space-y-6">
          <Input
            label="Event Name"
            placeholder="e.g. Sarah's Birthday"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            containerStyle="mb-4"
          />

          <Input
            label="Event Type"
            placeholder="e.g. Wedding, Birthday, Trip"
            value={formData.type}
            onChangeText={(text) => setFormData({ ...formData, type: text })}
            containerStyle="mb-4"
          />

          <Input
            label="Event Date"
            placeholder="YYYY-MM-DD"
            value={formData.date}
            onChangeText={(text) => setFormData({ ...formData, date: text })}
            containerStyle="mb-4"
          />

          <View className="mb-4">
            <Text className="text-textSecondary font-sansMedium mb-2 text-sm uppercase tracking-wider">
              Reveal Mode
            </Text>
            <View className="flex-row gap-2">
              {['Instant', 'End', 'Scheduled'].map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setFormData({ ...formData, revealMode: mode })}
                  className={`px-4 py-3 rounded-xl border ${
                    formData.revealMode === mode
                      ? 'bg-accent border-accent'
                      : 'bg-white border-stone-200'
                  }`}
                >
                  <Text
                    className={`font-sansMedium ${
                      formData.revealMode === mode ? 'text-white' : 'text-textSecondary'
                    }`}
                  >
                    {mode}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="flex-row justify-between mb-4">
            <Input
              label="Shot Limit"
              placeholder="e.g. 10"
              keyboardType="numeric"
              value={formData.shotLimit}
              onChangeText={(text) => setFormData({ ...formData, shotLimit: text })}
              containerStyle="w-[48%]"
            />
            <Input
              label="Participant Limit"
              placeholder="e.g. 50"
              keyboardType="numeric"
              value={formData.participantLimit}
              onChangeText={(text) => setFormData({ ...formData, participantLimit: text })}
              containerStyle="w-[48%]"
            />
          </View>

          <Button
            title="Create Event"
            onPress={handleCreate}
            className="mt-4"
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
