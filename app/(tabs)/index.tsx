import React, { useState } from 'react';
import { View, Text, FlatList, Image } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { EventCard } from '../../components/EventCard';
import { Button } from '../../components/Button';
import { useRouter } from 'expo-router';

const mockEvents = [
  {
    id: '1',
    title: 'Sarah & James Wedding',
    date: 'Oct 24, 2026',
    participantCount: 142,
    status: 'Live',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: '2',
    title: 'Summer Getaway',
    date: 'Jul 15, 2026',
    participantCount: 8,
    status: 'Draft',
    thumbnailUrl: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?q=80&w=2070&auto=format&fit=crop',
  },
];

export default function EventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState(mockEvents);

  const renderItem = ({ item }: any) => (
    <EventCard
      title={item.title}
      date={item.date}
      participantCount={item.participantCount}
      status={item.status}
      thumbnailUrl={item.thumbnailUrl}
      onPress={() => router.push(`/event/${item.id}`)}
    />
  );

  return (
    <ScreenWrapper>
      <View className="mt-6 mb-8">
        <Image
          source={require('../../assets/logo_bgless.png')}
          className="h-10 mb-6"
          resizeMode="contain"
          style={{ alignSelf: 'flex-start' }}
        />
        <Text className="text-4xl font-serif text-textPrimary mb-2">Your Moments</Text>
        <Text className="text-textSecondary font-sansSemiBold text-lg">
          Private films for meaningful events.
        </Text>
      </View>

      <FlatList
        data={events}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-20">
            <Text className="text-textSecondary font-sansSemiBold text-lg mb-6">Create your first event</Text>
            <Button
              title="Create Event"
              onPress={() => router.push('/(tabs)/create')}
              className="w-48"
            />
          </View>
        }
      />
    </ScreenWrapper>
  );
}
