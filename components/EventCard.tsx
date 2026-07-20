import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Card } from './Card';
import { colors } from '../constants/colors';
import { eventCover } from '../constants/sampleImages';
import { ArrowRight } from 'lucide-react-native';

interface EventCardProps {
  title: string;
  date: string;
  participantCount: number;
  status: 'Draft' | 'Live' | 'Revealed';
  thumbnailUrl?: string;
  onPress: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  title,
  date,
  participantCount,
  status,
  thumbnailUrl,
  onPress,
}) => {
  const statusColors = {
    Draft: 'bg-black/5 text-textSecondary',
    Live: 'bg-success/15 text-success',
    Revealed: 'bg-accent/15 text-accentDeep',
  };

  const [bgClass, textClass] = statusColors[status].split(' ');

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} className="mb-4">
      <Card className="p-0 overflow-hidden bg-ivory rounded-[28px]">
        <Image
          source={{ uri: eventCover(thumbnailUrl) }}
          className="w-full opacity-90"
          style={{ aspectRatio: 16 / 9 }}
          resizeMode="cover"
        />
        <View className="p-6">
          <View className="flex-row justify-between items-start mb-2">
            <View className={`px-3 py-1 rounded-full self-start ${bgClass}`}>
              <Text className={`text-xs font-sansMedium uppercase tracking-wide ${textClass}`}>
                {status}
              </Text>
            </View>
            <Text className="text-textSecondary font-sansSemiBold text-xs">{date}</Text>
          </View>
          
          <Text className="text-2xl font-serif text-textPrimary mb-2">{title}</Text>
          
          <View className="flex-row justify-between items-center mt-2">
            <Text className="text-textSecondary font-sansSemiBold text-sm">
              {participantCount} {participantCount === 1 ? 'Guest' : 'Guests'}
            </Text>
            <View className="bg-surface2 p-2 rounded-full">
              <ArrowRight size={16} color={colors.textPrimary} />
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};
