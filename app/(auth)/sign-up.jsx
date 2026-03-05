import { useEffect, useState, useRef } from "react";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, ScrollView, Dimensions, Image, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Icons from "react-native-heroicons/outline";
import { useColorScheme as useNativewindColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";

import { images } from "../../constants";
import { CustomButton, FormField } from "../../components";
import { authStore } from "../../zustand/auth-store";
import actions from "../../zustand/auth-store/actions";
import { LinearGradient } from "expo-linear-gradient";
import { showError } from "../../utils/notifications";
import * as Updates from 'expo-updates';

const SignUp = () => {
  const { t } = useTranslation();
  const { colorScheme } = useNativewindColorScheme();
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const { registerFields: { name, email, password, password_confirmation }, isCreating, data, errors } = authStore();
  const dispatch = authStore(state => state.dispatch);
  const { changeRegisterFields, register } = actions(dispatch);

  const submit = async () => {
    if (name === "" || email === "" || password === "" || password_confirmation === "") {
      showError("Please fill in all fields", "Error");
      return;
    }
    if (password !== password_confirmation) {
      showError("Passwords do not match", "Error");
      return;
    }
    register();
  };


  useEffect(() => {
    if(data?.token){
      console.log('onboarding_completed', data.user.onboarding_completed)
      if(data.user.onboarding_completed != '1'){
        router.replace({ pathname: '/', params: { step: 1 } });
      }else {
        router.replace("/home");
      }
    }
  }, [data?.token])

  const DevResetButton = () => {
    const handleReset = async () => {
      // Clear persisted storage
      await authStore.persist.clearStorage();
      // Optionally reload the app
      Updates.reloadAsync(); // if using expo-updates
    };
  
    return (
      <TouchableOpacity onPress={handleReset}>
        <Text style={{color: 'white'}}>Reset Auth Store</Text>
      </TouchableOpacity>
    );
  };

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
                  <Icons.UserPlusIcon size={48} color="white" strokeWidth={1.5} />
                </View>
                <Text className="text-4xl font-pbold text-white text-center mb-2">
                  {t('auth:create_account')}
                </Text>
                <Text className="text-lg font-pregular text-white/80 text-center">
                  {t('auth:sign_up_subtitle')}
                </Text>
              </View>

  {DevResetButton()}
              {/* Form Section */}
              <View className="space-y-6">
                <View className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
                  <FormField
                    ref={nameRef}
                    title={t('auth:username')}
                    value={name}
                    handleChangeText={(e) => changeRegisterFields({key: 'name', value: e})}
                    otherStyles="mb-4"
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                    outlined={false}
                    error={errors?.name?.[0]}

                  />

                  <FormField
                    ref={emailRef}
                    title={t('auth:email_address')}
                    value={email}
                    handleChangeText={(e) => changeRegisterFields({key: 'email', value: e})}
                    otherStyles="mb-4"
                    keyboardType="email-address"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    outlined={false}
                    error={errors?.email?.[0]}
                  />

                  <FormField
                    ref={passwordRef}
                    title={t('auth:password')}
                    value={password}
                    handleChangeText={(e) => changeRegisterFields({key: 'password', value: e})}
                    otherStyles="mb-4"
                    secureTextEntry
                    returnKeyType="next"
                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                    outlined={false}
                    error={errors?.password?.[0]}

                  />

                  <FormField
                    ref={confirmPasswordRef}
                    title={t('auth:confirm_password')}
                    value={password_confirmation}
                    handleChangeText={(e) => changeRegisterFields({key: 'password_confirmation', value: e})}
                    otherStyles="mb-6"
                    secureTextEntry
                    returnKeyType="done"
                    onSubmitEditing={submit}
                    outlined={false}
                    error={errors?.password_confirmation?.[0]}

                  />

                  <CustomButton
                    title={t('auth:create_account_button')}
                    handlePress={submit}
                    textStyles="text-white-600 font-pbold"
                    isLoading={isCreating}
                  />
                </View>

                {/* Additional Options */}
                <View className="items-center space-y-4 mt-5">
                  <View className="flex-row items-center">
                    <Text className="text-white/80 font-pregular text-base mr-2">
                      {t('auth:already_have_account')}
                    </Text>
                    <TouchableOpacity onPress={() => router.push('/sign-in')}>
                      <Text className="text-white font-psemibold text-base">
                        {t('auth:sign_in_link')}
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

export default SignUp;
