import React from "react";
import { useAuthStore } from "./src/hooks/useAuthStore";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
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

function App() {
  // Wrapper for PlayerStatisticsScreen to pass navigation props
  function PlayerStatisticsScreenWrapper(props: any) {
    return <PlayerStatisticsScreen {...props} />;
  }

  // Auth stack wrappers and stack definition must come after all imports

  const AuthStackNav = createNativeStackNavigator();

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

  const Stack = createNativeStackNavigator();

  const { isAuthenticated, selectedLeague, initialize, isLoading } =
    useAuthStore();
  const [isInitializing, setIsInitializing] = React.useState(true);

  React.useEffect(() => {
    const init = async () => {
      try {
        await initialize();
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, [initialize]);

  if (isInitializing || isLoading) {
    return (
      <NavigationContainer>
        <StatusBar style="light" />
        {/* Simple loading screen */}
        <></>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      {isAuthenticated ? (
        selectedLeague ? (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Games" component={GamesScreen} />
            <Stack.Screen name="Teams" component={TeamsScreen} />
            <Stack.Screen name="LiveGame" component={LiveGameScreen} />
            <Stack.Screen name="PlayerStats" component={PlayerStatsScreen} />
            <Stack.Screen
              name="PlayerStatistics"
              component={PlayerStatisticsScreenWrapper}
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

export default App;
