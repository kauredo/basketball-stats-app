import React from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, Text } from "react-native";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import HomeScreen from "./src/screens/HomeScreen";
import GamesScreen from "./src/screens/GamesScreen";
import TeamsScreen from "./src/screens/TeamsScreen";
import LiveGameScreen from "./src/screens/LiveGameScreen";
import PlayerStatsScreen from "./src/screens/PlayerStatsScreen";
import PlayerStatisticsScreen from "./src/screens/PlayerStatisticsScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import StatisticsScreen from "./src/screens/StatisticsScreen";
import LeagueSelectionScreen from "./src/screens/auth/LeagueSelectionScreen";
import LoginScreen from "./src/screens/auth/LoginScreen";
import SignupScreen from "./src/screens/auth/SignupScreen";
import Icon from "./src/components/Icon";

// Initialize Convex client
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || "";
const convex = new ConvexReactClient(convexUrl);

// Navigation types
export type RootStackParamList = {
  Home: undefined;
  Games: undefined;
  Teams: undefined;
  LiveGame: { gameId: string };
  PlayerStats: { playerId: string };
  PlayerStatistics: { playerId: string };
  Profile: undefined;
  Statistics: undefined;
  LeagueSelection: undefined;
  Login: undefined;
  Signup: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStackNav = createNativeStackNavigator<RootStackParamList>();

function AuthLoginScreen({ navigation }: any) {
  return (
    <LoginScreen
      onNavigateToSignup={() => navigation.navigate("Signup")}
      onNavigateToForgotPassword={() => {}}
    />
  );
}

function AuthSignupScreen({ navigation }: any) {
  return (
    <SignupScreen onNavigateToLogin={() => navigation.navigate("Login")} />
  );
}

function AuthStack() {
  return (
    <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackNav.Screen name="Login" component={AuthLoginScreen} />
      <AuthStackNav.Screen name="Signup" component={AuthSignupScreen} />
    </AuthStackNav.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-dark-950">
      <Icon name="basketball" size={64} color="#EA580C" className="mb-4" />
      <Text className="text-2xl font-bold text-white mb-2">Basketball Stats</Text>
      <Text className="text-base text-gray-400">Loading...</Text>
    </View>
  );
}

function AppContent() {
  const { isAuthenticated, selectedLeague, isLoading } = useAuth();

  if (isLoading) {
    return (
      <NavigationContainer>
        <StatusBar style="light" />
        <LoadingScreen />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      {isAuthenticated ? (
        selectedLeague ? (
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              headerStyle: {
                backgroundColor: "#1F2937",
              },
              headerTintColor: "#F9FAFB",
              headerTitleStyle: {
                fontWeight: "bold",
              },
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Games" component={GamesScreen} />
            <Stack.Screen name="Teams" component={TeamsScreen} />
            <Stack.Screen name="LiveGame" component={LiveGameScreen} />
            <Stack.Screen name="PlayerStats" component={PlayerStatsScreen} />
            <Stack.Screen
              name="PlayerStatistics"
              component={PlayerStatisticsScreen}
            />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Statistics" component={StatisticsScreen} />
            <Stack.Screen
              name="LeagueSelection"
              component={LeagueSelectionScreen}
            />
          </Stack.Navigator>
        ) : (
          <LeagueSelectionScreen />
        )
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}

function App() {
  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ConvexProvider>
  );
}

export default App;
