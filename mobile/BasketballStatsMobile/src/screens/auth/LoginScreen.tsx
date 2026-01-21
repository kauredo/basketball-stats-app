import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/Button";
import Icon from "../../components/Icon";

interface LoginScreenProps {
  onNavigateToSignup: () => void;
  onNavigateToForgotPassword: () => void;
}

export default function LoginScreen({
  onNavigateToSignup,
  onNavigateToForgotPassword,
}: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const { login, isLoading, error, clearError } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    try {
      clearError();
      await login(email.trim().toLowerCase(), password);
      // Navigation will be handled by the auth state change
    } catch (err) {
      console.error("Login error:", err);
      // Error is already handled by the context
    }
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      Alert.alert("Enter Email", "Please enter your email address first");
      return;
    }
    onNavigateToForgotPassword();
  };

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
            Basketball Stats
          </Text>
          <Text className="text-base text-surface-600 dark:text-surface-400 text-center">
            Sign in to your account
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

          <View className="mb-5">
            <Text className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Password
            </Text>
            <View className="relative">
              <View className="absolute left-4 top-3.5 z-10">
                <Icon name="lock" size={20} color="#a69f96" />
              </View>
              <TextInput
                className="bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-xl pl-12 pr-14 py-3.5 text-base text-surface-900 dark:text-white min-h-[48px]"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#a69f96"
                secureTextEntry={!isPasswordVisible}
                editable={!isLoading}
              />
              <TouchableOpacity
                className="absolute right-2 top-1 min-w-[44px] min-h-[44px] items-center justify-center"
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              >
                <Icon name={isPasswordVisible ? "eye-off" : "eye"} size={20} color="#a69f96" />
              </TouchableOpacity>
            </View>
          </View>

          <Button
            onPress={handleLogin}
            variant="primary"
            size="lg"
            disabled={isLoading}
            loading={isLoading}
            fullWidth
            className="mt-2"
          >
            Sign In
          </Button>

          <TouchableOpacity
            className="items-center mt-4"
            onPress={handleForgotPassword}
            disabled={isLoading}
          >
            <Text className="text-primary-500 text-sm font-medium">Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center items-center">
          <Text className="text-surface-600 dark:text-surface-400 text-sm mr-2">
            Don&apos;t have an account?
          </Text>
          <TouchableOpacity onPress={onNavigateToSignup} disabled={isLoading}>
            <Text className="text-primary-500 text-sm font-semibold">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
