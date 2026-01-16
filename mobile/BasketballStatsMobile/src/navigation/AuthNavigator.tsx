import React, { useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/auth/LoginScreen";
import SignupScreen from "../screens/auth/SignupScreen";
import LeagueSelectionScreen from "../screens/auth/LeagueSelectionScreen";

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  LeagueSelection: undefined;
  ForgotPassword: { email?: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  const [currentScreen, setCurrentScreen] = useState<"Login" | "Signup" | "LeagueSelection">(
    "Login"
  );

  const navigateToLogin = () => setCurrentScreen("Login");
  const navigateToSignup = () => setCurrentScreen("Signup");
  const navigateToLeagueSelection = () => setCurrentScreen("LeagueSelection");
  const navigateToForgotPassword = () => {
    // For now, just show an alert - you can implement a proper screen later
    console.log("Navigate to forgot password");
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case "Signup":
        return <SignupScreen onNavigateToLogin={navigateToLogin} />;
      case "LeagueSelection":
        return <LeagueSelectionScreen />;
      case "Login":
      default:
        return (
          <LoginScreen
            onNavigateToSignup={navigateToSignup}
            onNavigateToForgotPassword={navigateToForgotPassword}
          />
        );
    }
  };

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Disable swipe back for auth screens
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="Login">{() => renderCurrentScreen()}</Stack.Screen>
    </Stack.Navigator>
  );
}
