import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  interpolate,
} from 'react-native-reanimated';
import {
  AnimatedFeatureIcon,
  AnimatedOption,
  CustomImageBackground,
  FeatureCard,
} from './OnboardingComponents';

import { Redirect, router } from "expo-router";
import { View,Dimensions, Text, Image, Alert, TouchableOpacity, ActivityIndicator, Animated as RNAnimated } from "react-native";
import { AnimatedButton } from 'react-native-3d-animated-buttons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef } from 'react';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { 
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  MicrophoneIcon,
  LanguageIcon,
  DocumentIcon,
  PencilIcon
} from 'react-native-heroicons/outline';

import * as AppleAuthentication from 'expo-apple-authentication';
import { t } from "i18next";
import { CustomButton, Loader } from "../../components";
import { authStore } from "../../zustand/auth-store";
import actions from "../../zustand/auth-store/actions";
import { dimensions, icons, images } from '../../constants';
import { EnvelopeIcon } from "react-native-heroicons/outline";


const { width } = Dimensions.get('window');

export const WelcomeSlide = ({
  slide,
  slideAnimation,
  handleNext,
  colors,
}) => {

  const bottomSheetRef = useRef(null);
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;


  
  
  const dispatch = authStore(state => state.dispatch);
  const { changeFields, appleSignIn } = actions(dispatch);
  const isLoading = authStore(state => state.isLoading);


  // const isLogged = authStore(state => !!state?.data?.token);
  // const data = authStore(state => state?.data);

  // useEffect(() => {
  //   if (isLogged && !(data.user.onboarding_completed === '1' || data.user.onboarding_completed === true)) {
  //     handleNext();
  //   }
  // }, [isLogged, data, handleNext]);

  

  // if (isLogged) return <Redirect href="/home" />;
  
  useEffect(() => {
    const pulsate = () => {
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1500,
          useNativeDriver: false,
        }),
        RNAnimated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
      ]).start(() => pulsate());
    };
    pulsate();
  }, [pulseAnim]);
  
  return (
    <View style={{ width }} className="h-full flex-1">
      {/* Purple to White Gradient Background */}
       <LinearGradient
         colors={[ '#E6C9FF', '#FAF5FF', '#FFF']}
         style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
         start={{ x: 0, y: 0 }}
         end={{ x: 0, y: 1 }}
       />

      {/* Main Content */}
      <View className="flex-1 justify-center items-center px-8">
        {/* Feature Cards Around Logo */}
        <View className="relative w-full max-w-sm mb-10">
          {/* Top Left - Resumir */}
           <View className="absolute -top-16  bg-white rounded-2xl p-3 translate-x-3 translate-y-3 " >
             <View className="items-center flex-row gap-3">
               <View className="w-7 h-7 bg-purple-100 rounded-lg items-center justify-center mb-1">
                 <DocumentTextIcon size={16} color="#8B5CF6" />
               </View>
               <Text className="text-lg font-psemibold text-gray-700 text-center">{t('common:summarize')}</Text>
             </View>
           </View>

          {/* Top Right - Chat de AI */}
           <View className="absolute -top-16 -right-1 bg-white rounded-2xl p-3 " >
             <View className="items-center flex-row gap-3">
               <View className="w-7 h-7 bg-purple-100 rounded-lg items-center justify-center mb-1">
                 <ChatBubbleLeftRightIcon size={16} color="#8B5CF6" />
               </View>
               <Text className="text-sm font-psemibold text-gray-700 text-center">{t('common:ai_chat')}</Text>
             </View>
           </View>

          {/* Left - Transcrever */}
           <View className="absolute top-8 -left-10 bg-white rounded-2xl p-3 " >
             <View className="items-center flex-row gap-3">
               <View className="w-7 h-7 bg-purple-100 rounded-lg items-center justify-center mb-1">
                 <MicrophoneIcon size={16} color="#8B5CF6" />
               </View>
               <Text className="text-sm font-psemibold text-gray-700 text-center">{t('common:transcribe')}</Text>
             </View>
           </View>

          {/* Right - Traduzir */}
           <View className="absolute top-8 -right-8 bg-white rounded-2xl p-3 " >
             <View className="items-center flex-row gap-3">
               <View className="w-7 h-7 bg-purple-100 rounded-lg items-center justify-center mb-1">
                 <LanguageIcon size={16} color="#8B5CF6" />
               </View>
               <Text className="text-sm font-psemibold text-gray-700 text-center">{t('common:translate')}</Text>
             </View>
           </View>

          {/* Bottom Left - PDF */}
           <View className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-3 " >
             <View className="items-center flex-row gap-3">
               <View className="w-7 h-7 bg-purple-100 rounded-lg items-center justify-center mb-1">
                 <DocumentIcon size={16} color="#8B5CF6" />
               </View>
               <Text className="text-lg font-psemibold text-gray-700 text-center">{t('common:pdf')}</Text>
             </View>
           </View>

          {/* Bottom Right - Texto */}
           <View className="absolute -bottom-4 -right-8 bg-white rounded-2xl p-3 ">
             <View className="items-center flex-row gap-3">
               <View className="w-7 h-7 bg-purple-100 rounded-lg items-center justify-center mb-1">
                 <PencilIcon size={16} color="#8B5CF6" />
               </View>
               <Text className="text-lg font-psemibold text-gray-700 text-center">{t('common:text')}</Text>
             </View>
           </View>

          {/* Center Logo */}
           <View className="items-center justify-center  rounded-3xl p-6" style={{ width: 180, height: 180, alignSelf: 'center' }}>
             <View className="items-center">
               <Image 
                 source={require('../../assets/logo_bgless.png')}
                 style={{ width: 100, height: 100, marginBottom: 12 }}
                 resizeMode="contain"
               />
             </View>
           </View>
        </View>

        {/* Bottom Content */}
        <View className="mt-20 items-center">
          {/* Divider */}
          
          {/* Awards */}
          <View className="items-center mb-8">
            <View className="flex-row items-between justify-center mb-4">
              <View className="items-center mx-6 flex-row gap-3">
                <View>
                  <Text>🏆</Text>
                </View>
                <View>
                  <Text className="text-lg font-psemibold text-gray-600 mb-1 text-center">{t('common:best_app')}</Text>
                  <Text className="text-lg font-psemibold text-gray-600 text-center">{t('common:for_note_taking')}</Text>
                </View>
              </View>
              <View className="items-center mx-6">
                <View className="items-center">
                 <Image 
                   source={require('../../assets/4_9.png')}
                   style={{ width: 100, height: 100, marginBottom: 12 }}
                   resizeMode="contain"
                 />
               </View>
            
              </View>
            </View>
          </View>

          {/* Welcome Text */}
          <Text className="text-3xl font-pbold mb-2 text-gray-800">
            {t('common:welcome_to_smart')}
          </Text>
          
          <Text className="text-lg text-center font-psemibold text-gray-600 mb-8">
            {t('common:never_take_notes_again')}
          </Text>

          {/* Start Button */}
          <RNAnimated.View style={{ transform: [{ scaleX: pulseAnim }] }}>
            <AnimatedButton
              title={t('common:start_now')}
              onPress={() => bottomSheetRef.current?.expand()}
              backgroundColor="#8B5CF6"
              shadowColor="#6D28D9"
              textColor="#FFFFFF"
              type="capsule"
              fullWidth={true}
              minHeight={60}
              hapticStyle="Medium"
              style={{ marginBottom: 24 }}
              textStyle={{ fontSize: 20, fontWeight: 'bold' }}
            />
          </RNAnimated.View>

          {/* Sign Up Link */}
          <View className="flex-row items-center">
            <Text className="text-base text-gray-600">
              {t('common:dont_have_account')}{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/sign-up')}>
              <Text className="text-base font-bold text-purple-600">
                {t('common:sign_up')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Retro Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['60%']}
        enablePanDownToClose={true}
        backgroundStyle={{ backgroundColor: '#F3F0FF' }}
        handleIndicatorStyle={{ backgroundColor: '#8B5CF6' }}
      >
        <BottomSheetView className="flex-1 px-6 py-4">
          <Text className="text-3xl font-bold text-center mb-8" style={{ color: '#6B46C1' }}>
            {t('common:sign_in_options')}
          </Text>
          
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={12}
            style={{
              width: '100%',
              height: 62,
              marginBottom: 20
            }}
            onPress={async () => {
              try {
                appleSignIn();
                bottomSheetRef.current?.close();
              } catch (e) {
                if (e.code === 'ERR_REQUEST_CANCELED') {
                  // handle that the user canceled the sign-in flow
                } else {
                  Alert.alert('', t('errors.something_went_wrong'));
                }
              }
            }}
          />

          {/* Google Sign-In Button */}
          <TouchableOpacity
            onPress={async () => {
              try {
                await actions(dispatch).googleSignIn();
                bottomSheetRef.current?.close();
              } catch (error) {
                console.error('Google Sign-In error:', error);
                Alert.alert(t('common:error'), t('common:error_google_signin'));
              }
            }}
            activeOpacity={0.7}
            className={`rounded-xl min-h-[62px] flex flex-row justify-center items-center w-full mb-4 ${isLoading ? "opacity-50" : ""}`}
            style={{
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#E5E7EB',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator
                animating={isLoading}
                color="#6B46C1"
                size="small"
                className="mr-2"
              />
            ) : (
              <>
                <View className="mr-3">
                  <Image 
                    source={icons.googleLogo}
                    className="w-6 h-6"
                    resizeMode="contain"
                  />
                </View>
                <Text className="text-lg font-medium" style={{ color: '#374151' }}>
                  {t('common:continue_with_google')}
                </Text>
              </>
            )}
          </TouchableOpacity>
          
          {/* Email Button */}
          <TouchableOpacity
            onPress={() => {
              bottomSheetRef.current?.close();
              router.push("/sign-in");
            }}
            className="w-full py-4 px-8 rounded-xl flex-row justify-center items-center"
            style={{
              backgroundColor: '#8B5CF6',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4
            }}
          >
            <EnvelopeIcon style={{ marginRight: 8 }} size="24" color="#FFFFFF" />
            <Text className="text-lg font-medium" style={{ color: '#FFFFFF' }}>
              {t('common:sign_in_with_email')}
            </Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
};

export const ChoiceSlide = ({
  slide,
  slideAnimation,
  selectedOptions,
  handleOptionSelect,
  colors,
  isDarkMode,
}) => {
  const slideAnimStyle = useAnimatedStyle(() => {
    return {
      opacity: slideAnimation.value,
      transform: [
        {
          translateX: interpolate(
            slideAnimation.value,
            [0, 1],
            [width * 0.1, 0]
          ),
        },
      ],
    };
  });

  return (
    <View style={{ width }} className="flex-1 px-6 pt-6">
      <Animated.View style={[slideAnimStyle]} className="flex-1">
        <Text
          className="text-2xl font-bold mb-6"
          style={{ color: isDarkMode ? colors.white : colors.gray[900] }}
        >
          {slide.question}
        </Text>

        {slide.description && (
          <Text
            className="text-base mb-6"
            style={{
              color: isDarkMode ? colors.gray[400] : colors.gray[600],
            }}
          >
            {slide.description}
          </Text>
        )}

        <View className="gap-y-3">
          {slide.options?.map((option, index) => {
            const isSelected = selectedOptions.includes(option.id);
            return (
              <AnimatedOption
                key={option.id}
                option={option}
                index={index}
                isSelected={isSelected}
                onSelect={() => handleOptionSelect(option.id)}
                isDarkMode={isDarkMode}
                colors={colors}
              />
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
};

export const NotificationSlide = ({
  slide,
  slideAnimation,
  handleNext,
  colors,
  isDarkMode,
  requestPermissions,
}) => {
  const slideStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(slideAnimation.value, [0, 1], [0.3, 1]),
      transform: [
        {
          translateY: interpolate(slideAnimation.value, [0, 1], [50, 0]),
        },
      ],
    };
  });

  return (
    <View className="flex-1 justify-center items-center px-6" style={{ width }}>
      <Animated.View style={slideStyle} className="items-center">
        <View className="w-20 h-20 rounded-full bg-purple-500/20 items-center justify-center mb-6">
          <Text className="text-4xl">🔔</Text>
        </View>
        
        <Text className="text-3xl font-bold text-center mb-4" style={{ color: isDarkMode ? 'white' : colors.gray[900] }}>
          {slide.title}
        </Text>
        
        <Text className="text-lg text-center mb-8" style={{ color: isDarkMode ? colors.gray[300] : colors.gray[600] }}>
          {slide.description}
        </Text>
        
        {/* <View className="  mb-8">
          {slide.benefits?.map((benefit, index) => (
            <View key={index} className="flex-row items-center p-4 rounded-xl" style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : colors.gray[50] }}>
              <Text className="text-2xl mr-4">{benefit.icon}</Text>
              <Text className="text-base font-medium flex-1" style={{ color: isDarkMode ? 'white' : colors.gray[800] }}>
                {benefit.text}
              </Text>
            </View>
          ))}
        </View> */}
        
        <TouchableOpacity
          onPress={async () => {
            if (requestPermissions) {
              await requestPermissions();
            }
            handleNext();
          }}
          className="w-full py-4 mx-4 rounded-xl justify-center items-center"
          style={{ backgroundColor: colors.primary[500] }}
        >
          <Text className="text-white font-semibold text-lg px-6">
            {t('common:enable_notifications')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={handleNext}
          className="mt-4 py-2"
        >
          <Text className="text-center" style={{ color: isDarkMode ? colors.gray[400] : colors.gray[500] }}>
            {t('common:maybe_later')}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export const FeaturesSlide = ({
  slide,
  slideAnimation,
  colors,
  isDarkMode,
}) => {
  const slideAnimStyle = useAnimatedStyle(() => {
    return {
      opacity: slideAnimation.value,
      transform: [
        {
          translateX: interpolate(
            slideAnimation.value,
            [0, 1],
            [width * 0.1, 0]
          ),
        },
      ],
    };
  });

  return (
    <View style={{ width }} className="flex-1 px-6 pt-6">
      <Animated.View style={[slideAnimStyle]} className="flex-1">
        <Text
          className="text-3xl font-bold mb-3"
          style={{ color: isDarkMode ? colors.white : colors.gray[900] }}
        >
          {slide.title}
        </Text>
        <Text
          className="text-base mb-8"
          style={{
            color: isDarkMode ? colors.gray[400] : colors.gray[600],
          }}
        >
          {slide.description}
        </Text>

        <View className="mb-6">
          {slide.features?.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              feature={feature.text}
              index={index}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
};
