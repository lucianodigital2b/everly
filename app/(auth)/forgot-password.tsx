import React, { useState } from "react";
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
import { MailCheck } from "lucide-react-native";

import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { BackButton } from "../../components/BackButton";
import { authApi } from "../../services/api";
import { colors } from "../../constants/colors";

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const value = email.trim();
    if (!isValidEmail(value)) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email: value });
      setSent(true);
    } catch (e) {
      // The endpoint returns 200 even for unknown emails, so a failure here is a
      // network/server problem — not a hint about whether the email exists.
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-backgroundPrimary">
      <StatusBar style="dark" />

      <View className="px-8 pt-2">
        <BackButton fallback="/(auth)/sign-in" />
      </View>

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
          {sent ? (
            // ── Confirmation ──────────────────────────────────────────────
            <View className="flex-1 justify-center px-8 py-12">
              <View className="items-center mb-8">
                <View
                  className="w-20 h-20 rounded-full items-center justify-center mb-6"
                  style={{
                    backgroundColor: "rgba(230,169,180,0.14)",
                    borderWidth: 1,
                    borderColor: "rgba(199,126,141,0.28)",
                  }}
                >
                  <MailCheck size={34} color={colors.accentDeep} strokeWidth={1.8} />
                </View>
                <Text className="text-3xl font-serif text-textPrimary mb-3 text-center">
                  Check your email
                </Text>
                <Text className="text-base font-sans text-textSecondary text-center leading-6">
                  If an account exists for{"\n"}
                  <Text className="font-sansSemiBold text-textPrimary">
                    {email.trim()}
                  </Text>
                  , we've sent a link to reset your password.
                </Text>
              </View>

              <Button
                title="Back to Sign In"
                onPress={() => router.replace("/(auth)/sign-in")}
              />

              <View className="flex-row items-center justify-center mt-8 gap-1">
                <Text className="text-textSecondary font-sans text-sm">
                  Didn't get it?
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSent(false)}
                >
                  <Text className="text-accent font-sans text-sm">
                    Try another email
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // ── Form ──────────────────────────────────────────────────────
            <View className="flex-1 justify-center px-8 py-12">
              {/* Header */}
              <View className="mb-12">
                <Text className="text-4xl font-serif text-textPrimary mb-2">
                  Forgot password?
                </Text>
                <Text className="text-base font-sansSemiBold text-textSecondary">
                  Enter your email and we'll send you a link to reset it.
                </Text>
              </View>

              {/* Form */}
              <View className="gap-2 mb-8">
                <Input
                  label="Email"
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (error) setError(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
                {error && (
                  <Text className="text-sm font-sans px-1" style={{ color: colors.error }}>
                    {error}
                  </Text>
                )}
              </View>

              <Button
                title="Send reset link"
                onPress={handleSubmit}
                isLoading={isLoading}
              />

              {/* Footer */}
              <View className="flex-row items-center justify-center mt-10 gap-1">
                <Text className="text-textSecondary font-sans text-sm">
                  Remembered it?
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.replace("/(auth)/sign-in")}
                >
                  <Text className="text-accent font-sans text-sm">
                    Sign in
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPassword;
