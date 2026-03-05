import React, { useState, useEffect, forwardRef } from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import MaskInput, { Masks } from 'react-native-mask-input';
import  * as Icons  from "react-native-heroicons/outline";
import { icons } from "../constants";

const FormField = forwardRef(({
  title,
  value,
  placeholder,
  handleChangeText,
  otherStyles,
  secureTextEntry,
  masked,
  clearAction,
  outlined,
  error,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [query, setQuery] = useState(value || null);
  
  
  const changeText = (text) => {
    setQuery(text);
    if (handleChangeText) {
      handleChangeText(text); // Notify parent if onChangeText is provided
    }
  };

  const handleClear = () => {
    setQuery(null);
    if (handleChangeText) {
      handleChangeText(''); // Notify parent that the value has been cleared
    }
  };

  useEffect(() => {
    setQuery(value);
  }, [value])
  

  
  return (
    <View className={`space-y-2 ${otherStyles}`}>
      {title && (
        <Text className={`text-base font-psemibold mb-1 ${
          outlined === false ? 'text-white/90' : 'text-black-100'
        }`}>
          {title}
        </Text>
      )}

      <View 
        className={`w-full h-16 px-5 rounded-lg flex flex-row items-center ${
          outlined ? `bg-transparent border-2 ${error ? 'border-red-500' : 'border-secondary-300'}` : ''
        }`} 
        style={!outlined ? {
          backgroundColor: outlined === false ? 'rgba(255, 255, 255, 0.15)' : '#F9F9F9',
          ...(error && { borderWidth: 2, borderColor: '#EF4444' })
        } : {}}
      >

        {masked ?
         
        <MaskInput 
          ref={ref}
          className="flex-1 text-black-100 font-pmedium text-base"
          value={query?.toString()}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          onChangeText={changeText}
          mask={Masks.BRL_CURRENCY}
          keyboardType='numeric'
          {...props}
        /> : 
        <TextInput
          ref={ref}
          className={`flex-1 font-pmedium text-base ${
            outlined === false ? 'text-white' : 'text-black-100'
          }`}
          value={query?.toString()}
          placeholder={placeholder}
          placeholderTextColor={outlined === false ? "rgba(255, 255, 255, 0.7)" : "#9CA3AF"}
          onChangeText={changeText}
          secureTextEntry={secureTextEntry && !showPassword}
          {...props}
          style={{margin: 0}}
        />}


        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Image
              source={!showPassword ? icons.eye : icons.eyeHide}
              className="w-6 h-6"
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}

        {clearAction && query && (
          <TouchableOpacity onPress={() => handleClear()} className="flex justify-center">
            <Icons.XMarkIcon 
              color={outlined === false ? 'white' : 'black'} 
              size={24} 
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text className="text-red-500 text-sm font-pmedium mt-1">
          {error}
        </Text>
      )}
    </View>
  );
});

export default FormField;
