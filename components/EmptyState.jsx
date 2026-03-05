import { router } from "expo-router";
import { View, Text, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Icons from "react-native-heroicons/outline";
import { useColorScheme as useNativewindColorScheme } from "nativewind";

import { images } from "../constants";
import CustomButton from "./CustomButton";
import { t } from "i18next";

const EmptyState = ({ title, subtitle }) => {
  const { colorScheme } = useNativewindColorScheme();
  
  return (
    <View className="flex-1 justify-center items-center px-8 py-12">
      {/* Illustration Container */}
      <View className="mb-8">
        <Image source={images.empty} className="w-64 h-64" resizeMode="contain" />
      </View>

      {/* Text Content */}
      <View className="items-center space-y-3">
        <Text className="text-xl font-pbold text-white dark:text-gray-200 text-center">
          {title}
        </Text>
        <Text className="text-base text-center font-pregular text-white/70 dark:text-gray-400 leading-6 max-w-xs">
          {subtitle}
        </Text>
      </View>

      {/* Decorative Elements */}
      <View className="absolute top-20 left-8 opacity-20">
        <Icons.SparklesIcon size={20} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
      </View>
      <View className="absolute top-32 right-12 opacity-20">
        <Icons.LightBulbIcon size={16} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
      </View>
      <View className="absolute bottom-32 left-12 opacity-20">
        <Icons.PencilIcon size={18} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
      </View>
    </View>
  );
};

export default EmptyState;
