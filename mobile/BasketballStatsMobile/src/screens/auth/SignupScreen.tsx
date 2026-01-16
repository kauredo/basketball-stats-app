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

interface SignupScreenProps {
  onNavigateToLogin: () => void;
}

export default function SignupScreen({ onNavigateToLogin }: SignupScreenProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    passwordConfirmation: "",
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  const { signup, isLoading, error, clearError } = useAuth();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { firstName, lastName, email, password, passwordConfirmation } =
      formData;

    if (!firstName.trim()) {
      Alert.alert("Validation Error", "Please enter your first name");
      return false;
    }

    if (!lastName.trim()) {
      Alert.alert("Validation Error", "Please enter your last name");
      return false;
    }

    if (!email.trim()) {
      Alert.alert("Validation Error", "Please enter your email");
      return false;
    }

    if (!email.includes("@")) {
      Alert.alert("Validation Error", "Please enter a valid email address");
      return false;
    }

    if (password.length < 6) {
      Alert.alert("Validation Error", "Password must be at least 6 characters");
      return false;
    }

    if (password !== passwordConfirmation) {
      Alert.alert("Validation Error", "Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    try {
      clearError();
      await signup(
        formData.firstName.trim(),
        formData.lastName.trim(),
        formData.email.trim().toLowerCase(),
        formData.password
      );
      // Navigation will be handled by the auth state change
    } catch (err) {
      console.error("Signup error:", err);
      // Error is already handled by the context
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-dark-950"
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
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-8">
          <Icon name="basketball" size={64} color="#EA580C" className="mb-4" />
          <Text className="text-3xl font-bold text-white mb-2">
            Create Account
          </Text>
          <Text className="text-base text-gray-400 text-center">
            Join the basketball community
          </Text>
        </View>

        <View className="mb-8">
          {error && (
            <View className="bg-red-100 border border-red-200 rounded-lg p-3 mb-4">
              <Text className="text-red-600 text-sm text-center">{error}</Text>
            </View>
          )}

          <View className="flex-row gap-3">
            <View className="flex-1 mb-5">
              <Text className="text-sm font-semibold text-white mb-2">
                First Name
              </Text>
              <View className="relative">
                <Icon
                  name="user"
                  size={18}
                  color="#6B7280"
                  className="absolute left-4 top-3 z-10"
                />
                <TextInput
                  className="bg-gray-800 border border-gray-600 rounded-lg pl-11 pr-4 py-3 text-base text-white"
                  value={formData.firstName}
                  onChangeText={value => handleInputChange("firstName", value)}
                  placeholder="John"
                  placeholderTextColor="#6B7280"
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
            </View>

            <View className="flex-1 mb-5">
              <Text className="text-sm font-semibold text-white mb-2">
                Last Name
              </Text>
              <View className="relative">
                <Icon
                  name="user"
                  size={18}
                  color="#6B7280"
                  className="absolute left-4 top-3 z-10"
                />
                <TextInput
                  className="bg-gray-800 border border-gray-600 rounded-lg pl-11 pr-4 py-3 text-base text-white"
                  value={formData.lastName}
                  onChangeText={value => handleInputChange("lastName", value)}
                  placeholder="Doe"
                  placeholderTextColor="#6B7280"
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
            </View>
          </View>

          <View className="mb-5">
            <Text className="text-sm font-semibold text-white mb-2">Email</Text>
            <View className="relative">
              <Icon
                name="mail"
                size={20}
                color="#6B7280"
                className="absolute left-4 top-3 z-10"
              />
              <TextInput
                className="bg-gray-800 border border-gray-600 rounded-lg pl-12 pr-4 py-3 text-base text-white"
                value={formData.email}
                onChangeText={value => handleInputChange("email", value)}
                placeholder="john.doe@example.com"
                placeholderTextColor="#6B7280"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>
          </View>

          <View className="mb-5">
            <Text className="text-sm font-semibold text-white mb-2">
              Password
            </Text>
            <View className="relative">
              <Icon
                name="lock"
                size={20}
                color="#6B7280"
                className="absolute left-4 top-3 z-10"
              />
              <TextInput
                className="bg-gray-800 border border-gray-600 rounded-lg pl-12 pr-12 py-3 text-base text-white"
                value={formData.password}
                onChangeText={value => handleInputChange("password", value)}
                placeholder="Enter password (min. 6 chars)"
                placeholderTextColor="#6B7280"
                secureTextEntry={!isPasswordVisible}
                editable={!isLoading}
              />
              <TouchableOpacity
                className="absolute right-4 top-3"
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              >
                <Icon
                  name={isPasswordVisible ? "eye-off" : "eye"}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-5">
            <Text className="text-sm font-semibold text-white mb-2">
              Confirm Password
            </Text>
            <View className="relative">
              <Icon
                name="lock"
                size={20}
                color="#6B7280"
                className="absolute left-4 top-3 z-10"
              />
              <TextInput
                className="bg-gray-800 border border-gray-600 rounded-lg pl-12 pr-12 py-3 text-base text-white"
                value={formData.passwordConfirmation}
                onChangeText={value =>
                  handleInputChange("passwordConfirmation", value)
                }
                placeholder="Confirm your password"
                placeholderTextColor="#6B7280"
                secureTextEntry={!isConfirmPasswordVisible}
                editable={!isLoading}
              />
              <TouchableOpacity
                className="absolute right-4 top-3"
                onPress={() =>
                  setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
                }
              >
                <Icon
                  name={isConfirmPasswordVisible ? "eye-off" : "eye"}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          <Button
            onPress={handleSignup}
            variant="primary"
            size="lg"
            disabled={isLoading}
            loading={isLoading}
            fullWidth
            className="mt-2"
          >
            Create Account
          </Button>
        </View>

        <View className="flex-row justify-center items-center">
          <Text className="text-gray-400 text-sm mr-2">
            Already have an account?
          </Text>
          <TouchableOpacity onPress={onNavigateToLogin} disabled={isLoading}>
            <Text className="text-primary-500 text-sm font-semibold">
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
