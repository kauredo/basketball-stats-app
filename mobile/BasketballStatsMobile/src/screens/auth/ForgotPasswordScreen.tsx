import React, { useState } from "react";
import { View, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/Button";
import Icon from "../../components/Icon";

interface ForgotPasswordScreenProps {
  initialEmail?: string;
  onNavigateToLogin: () => void;
}

export default function ForgotPasswordScreen({
  initialEmail = "",
  onNavigateToLogin,
}: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState(initialEmail);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { forgotPassword, isLoading, error, clearError } = useAuth();

  const handleSubmit = async () => {
    if (!email.trim()) {
      return;
    }

    try {
      clearError();
      await forgotPassword(email.trim().toLowerCase());
      setIsSubmitted(true);
    } catch (err) {
      console.error("Reset password error:", err);
    }
  };

  if (isSubmitted) {
    return (
      <KeyboardAvoidingView
        className="flex-1 bg-surface-50 dark:bg-surface-950"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <StatusBar style="light" />
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 24,
            paddingVertical: 32,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center mb-12">
            <Icon name="basketball" size={64} color="#EA580C" className="mb-4" />
            <Text className="text-3xl font-bold text-surface-900 dark:text-white mb-2">
              Check your email
            </Text>
            <Text className="text-base text-surface-600 dark:text-surface-400 text-center">
              We've sent a password reset link to {email}
            </Text>
          </View>

          <View className="mb-8">
            <View className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-800 rounded-xl p-4 mb-6">
              <Text className="text-green-800 dark:text-green-300 text-sm text-center leading-5">
                Password reset instructions have been sent to your email address. Please check your
                inbox and follow the instructions to reset your password.
              </Text>
            </View>

            <Button onPress={onNavigateToLogin} variant="primary" size="lg" fullWidth>
              Back to Sign In
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface-50 dark:bg-surface-950"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="light" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
          paddingVertical: 32,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-12">
          <Icon name="basketball" size={64} color="#EA580C" className="mb-4" />
          <Text className="text-3xl font-bold text-surface-900 dark:text-white mb-2">
            Reset Password
          </Text>
          <Text className="text-base text-surface-600 dark:text-surface-400 text-center px-4">
            Enter your email address and we'll send you a link to reset your password.
          </Text>
        </View>

        <View className="mb-8">
          {error && (
            <View className="bg-red-100 border border-red-200 rounded-lg p-3 mb-4">
              <Text className="text-red-600 text-sm text-center">{error}</Text>
            </View>
          )}

          <View className="mb-5">
            <Text className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Email
            </Text>
            <View className="relative">
              <View className="absolute left-4 top-3.5 z-10">
                <Icon name="mail" size={20} color="#a69f96" />
              </View>
              <TextInput
                className="bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-xl pl-12 pr-4 py-3.5 text-base text-surface-900 dark:text-white min-h-[48px]"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#a69f96"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>
          </View>

          <Button
            onPress={handleSubmit}
            variant="primary"
            size="lg"
            disabled={isLoading || !email.trim()}
            loading={isLoading}
            fullWidth
            className="mt-2"
          >
            Send Reset Link
          </Button>

          <Button
            onPress={onNavigateToLogin}
            variant="secondary"
            size="lg"
            disabled={isLoading}
            fullWidth
            className="mt-3"
          >
            Back to Sign In
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
