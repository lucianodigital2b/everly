import { useEffect, useState, useRef } from "react";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, ScrollView, Dimensions, Alert, Image, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Icons from "react-native-heroicons/outline";
import { useColorScheme as useNativewindColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";

import { images } from "../../constants";
import { CustomButton, FormField } from "../../components";
import { authStore } from "../../zustand/auth-store";
import actions from "../../zustand/auth-store/actions";
import { LinearGradient } from "expo-linear-gradient";

const SignIn = () => {
  const { t } = useTranslation();
  const { colorScheme } = useNativewindColorScheme();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const { fields: { email, password }, isLoading, data } = authStore();
  const dispatch = authStore(state => state.dispatch);
  const { changeFields, login } = actions(dispatch);

  const startLogin = async () => {
    login();
  }

  useEffect(() => {
    if(data?.token){
      console.log(data.user)
      if(data.user.onboarding_completed == '0'){
        router.replace({ pathname: '/', params: { step: 1 } });
      }else {
        router.replace("/home");
      }
    }
  }, [data?.token])
  
  return (

      <SafeAreaView className="flex-1 bg-primary-dark">
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'light'} />
        
        <KeyboardAvoidingView 
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
          <View className="flex-1 justify-center px-8">
            {/* Header Section */}
            <View className="items-center mb-12">
              <View className="bg-white/10 backdrop-blur-lg rounded-full p-6 mb-6">
                <Icons.LockClosedIcon size={48} color="white" strokeWidth={1.5} />
              </View>
              <Text className="text-4xl font-pbold text-white text-center mb-2">
                {t('auth:welcome_back')}
              </Text>
              <Text className="text-lg font-pregular text-white/80 text-center">
                {t('auth:sign_in_subtitle')}
              </Text>
            </View>

            {/* Form Section */}
            <View className="space-y-6">
              <View className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
                <FormField
                  ref={emailRef}
                  title={t('auth:email_address')}
                  value={email}
                  handleChangeText={(e) => changeFields({key: 'email', value: e})}
                  otherStyles="mb-4"
                  keyboardType="email-address"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  outlined={false}
                />

                <FormField
                  ref={passwordRef}
                  title={t('auth:password')}
                  value={password}
                  handleChangeText={(e) => changeFields({key: 'password', value: e})}
                  otherStyles="mb-6"
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={startLogin}
                  outlined={false}
                />

                <CustomButton
                  title={t('auth:sign_in')}
                  handlePress={startLogin}
                  textStyles="text-white-600 font-pbold"
                  isLoading={isLoading}
                />
              </View>

              {/* Additional Options */}
              <View className="items-center space-y-4 mt-5">
                <TouchableOpacity>
                  <Text className="text-white/80 font-pregular text-base">
                    {t('auth:forgot_password')}
                  </Text>
                </TouchableOpacity>
                
                <View className="flex-row items-center">
                  <Text className="text-white/80 font-pregular text-base mr-2">
                    {t('auth:dont_have_account')}
                  </Text>
                  <TouchableOpacity onPress={() => router.push('/sign-up')}>
                    <Text className="text-white font-psemibold text-base">
                      {t('auth:sign_up')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Decorative Elements */}
            <View className="absolute top-20 left-8 opacity-20">
              <Icons.SparklesIcon size={24} color="white" />
            </View>
            <View className="absolute top-32 right-12 opacity-20">
              <Icons.StarIcon size={20} color="white" />
            </View>
            <View className="absolute bottom-32 left-12 opacity-20">
              <Icons.HeartIcon size={18} color="white" />
            </View>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
  );
};

export default SignIn;
