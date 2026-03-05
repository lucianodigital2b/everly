import React from "react";
import { ActivityIndicator, Text, TouchableOpacity } from "react-native";

const CustomButton = ({
  title,
  handlePress,
  containerStyles,
  textStyles,
  isLoading,
  secondary,
  icon
}) => {
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className={`${secondary ? 'bg-secondary-100 border border-secondary-100': 'bg-secondary'}  rounded-xl min-h-[62px] flex flex-row justify-center items-center ${containerStyles} ${isLoading ? "opacity-50" : ""} `}
      disabled={isLoading}
    >
      {icon}

      {isLoading ? 
        <ActivityIndicator
          animating={isLoading}
          color="#fff"
          size="small"
          className="ml-2"
        /> : <Text className={`${secondary ? 'text-secondary': 'text-primary'}  font-psemibold text-lg ${textStyles}`}>{title}</Text>
      }
    </TouchableOpacity>
  );
};

export default CustomButton;
