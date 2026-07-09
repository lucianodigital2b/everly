import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { EventCard } from '../../components/EventCard';
import { Button } from '../../components/Button';
import { eventsApi, type Event } from '../../services/api';
import { colors } from '../../constants/colors';

const mapStatus = (event: Event): 'Draft' | 'Live' | 'Revealed' => {
  if (event.is_revealed) return 'Revealed';
  if (event.status === 'active') return 'Live';
  return 'Draft';
};

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return 'No date set';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function EventsScreen() {
  const router = useRouter();

  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: eventsApi.index,
  });

  const activeEventsWithCover = (events ?? []).filter(
    (event) => event.status === 'active' && !!event.cover_image_url
  );

  const renderItem = ({ item }: { item: Event }) => (
    <EventCard
      title={item.name}
      date={formatDate(item.expires_at)}
      participantCount={item.participant_limit ?? 0}
      status={mapStatus(item)}
      thumbnailUrl={item.cover_image_url ?? undefined}
      onPress={() => router.push(`/event/${item.id}`)}
    />
  );

  const renderActiveCarouselItem = ({ item }: { item: Event }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push(`/event/${item.id}`)}
      className="mr-4"
      style={{ width: 280 }}
    >
      <Image
        source={{ uri: item.cover_image_url as string }}
        resizeMode="cover"
        className="w-full rounded-2xl"
        style={{ aspectRatio: 16 / 9 }}
      />
      <Text className="text-textPrimary font-sansSemiBold text-base mt-2" numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
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

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={events ?? []}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            activeEventsWithCover.length > 0 ? (
              <View className="mb-6">
                <Text className="text-textPrimary font-sansSemiBold text-xl mb-3">
                  Active Now
                </Text>
                <FlatList
                  data={activeEventsWithCover}
                  horizontal
                  keyExtractor={(item) => `active-${item.id}`}
                  renderItem={renderActiveCarouselItem}
                  showsHorizontalScrollIndicator={false}
                />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center mt-20">
              <Text className="text-textSecondary font-sansSemiBold text-lg mb-6">
                Create your first event
              </Text>
              <Button
                title="Create Event"
                onPress={() => router.push('/(tabs)/create')}
                className="w-48"
              />
            </View>
          }
        />
      )}
    </ScreenWrapper>
  );
}
