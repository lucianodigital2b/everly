import React, { useEffect, useRef } from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";

import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { authStore } from "../../zustand/auth-store";
import actions from "../../zustand/auth-store/actions";

const SignIn = () => {
  const emailRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);

  const { fields: { email, password }, isLoading, data } = authStore();
  const dispatch = authStore((state) => state.dispatch);
  const { changeFields, login } = actions(dispatch);

  useEffect(() => {
    if (data?.token) {
      router.replace("/(tabs)");
    }
  }, [data?.token]);

  return (
    <SafeAreaView className="flex-1 bg-backgroundPrimary">
      <StatusBar style="light" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center px-8 py-12">
            {/* Header */}
            <View className="mb-12">
              <Text className="text-4xl font-serif text-textPrimary mb-2">
                Welcome back.
              </Text>
              <Text className="text-base font-sansSemiBold text-textSecondary">
                Sign in to your moments.
              </Text>
            </View>

            {/* Form */}
            <View className="gap-4 mb-8">
              <Input
                ref={emailRef}
                label="Email"
                value={email}
                onChangeText={(v) => changeFields({ key: "email", value: v })}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />

              <Input
                ref={passwordRef}
                label="Password"
                value={password}
                onChangeText={(v) => changeFields({ key: "password", value: v })}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={login}
              />
            </View>

            <Button title="Sign In" onPress={login} isLoading={isLoading} />

            {/* Footer links */}
            <View className="items-center mt-10 gap-4">
              <TouchableOpacity activeOpacity={0.7}>
                <Text className="text-textSecondary font-sans text-sm">
                  Forgot password?
                </Text>
              </TouchableOpacity>

              <View className="flex-row items-center gap-1">
                <Text className="text-textSecondary font-sans text-sm">
                  New to Everly?
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.push("/(auth)/sign-up")}
                >
                  <Text className="text-accent font-sans text-sm">
                    Create an account
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignIn;
