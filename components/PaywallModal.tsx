import React from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";
import { useHealthStore } from "../zustand/health-store";

type Props = {
  visible: boolean;
  onClose: () => void;
  onRestore?: () => void;
  title?: string;
  description?: string;
};

const FEATURES = [
  "✓  Full health score for every product",
  "✓  Detailed ingredient analysis",
  "✓  AI-generated health summaries",
  "✓  Sort products by health score",
  "✓  Unlimited saved products",
];

const PaywallModalComponent: React.FC<Props> = ({
  visible,
  onClose,
  onRestore,
  title = "Unlock Full Analysis",
  description = "Get unlimited access to health scores, ingredient breakdowns, and AI insights.",
}) => {
  const setIsPremium = useHealthStore((s) => s.setIsPremium);

  const handleUpgrade = () => {
    setIsPremium(true);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <TouchableOpacity activeOpacity={1} onPress={onClose} className="flex-1" />

        <View className="bg-white rounded-t-[28px] p-7 pb-10 items-center">
          <View className="w-10 h-1 rounded-full bg-stone-200 mb-6" />
          <Text className="text-5xl mb-3">🌿</Text>
          <Text className="text-[22px] text-stone-900 text-center mb-2 font-[Poppins-Bold]">
            {title}
          </Text>
          <Text className="text-sm text-stone-500 text-center leading-[22px] mb-5 font-[Poppins-Regular]">
            {description}
          </Text>

          <View className="w-full bg-stone-50 rounded-2xl p-4 gap-2 mb-6">
            {FEATURES.map((f) => (
              <Text key={f} className="text-sm text-stone-700 font-[Poppins-Medium]">
                {f}
              </Text>
            ))}
          </View>

          <TouchableOpacity onPress={handleUpgrade} className="bg-emerald-500 rounded-xl py-4 w-full items-center mb-3">
            <Text className="text-white text-base font-[Poppins-SemiBold]">Start Free Trial</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onRestore ?? onClose} className="py-2">
            <Text className="text-stone-400 text-sm font-[Poppins-Regular]">Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export const PaywallModal = PaywallModalComponent;

