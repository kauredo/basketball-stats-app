import React from "react";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, TouchableOpacity } from "react-native";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import Icon from "../components/Icon";

// Import screens
import HomeScreen from "../screens/HomeScreen";
import TeamsScreen from "../screens/TeamsScreen";
import GamesScreen from "../screens/GamesScreen";
import StatisticsScreen from "../screens/StatisticsScreen";
import LiveGameScreen from "../screens/LiveGameScreen";
import PlayerStatsScreen from "../screens/PlayerStatsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import AuthNavigator from "./AuthNavigator";
import LeagueSelectionScreen from "../screens/auth/LeagueSelectionScreen";
import PlayerComparisonScreen from "../screens/PlayerComparisonScreen";
import ShotChartScreen from "../screens/ShotChartScreen";
import CreateGameScreen from "../screens/CreateGameScreen";
import CreateTeamScreen from "../screens/CreateTeamScreen";
import CreatePlayerScreen from "../screens/CreatePlayerScreen";
import SettingsScreen from "../screens/SettingsScreen";
import TeamDetailScreen from "../screens/TeamDetailScreen";

// Navigation parameter types
export type RootStackParamList = {
  Main: undefined;
  LiveGame: { gameId: string };
  PlayerStats: { playerId: string };
  PlayerStatistics: { playerId: string; playerName?: string };
  LeagueSelection: undefined;
  PlayerComparison: undefined;
  ShotChart: undefined;
  CreateGame: undefined;
  CreateTeam: undefined;
  CreatePlayer: { teamId?: string } | undefined;
  Settings: undefined;
  TeamDetail: { teamId: string; teamName: string };
};

export type TabParamList = {
  Home: undefined;
  Statistics: undefined;
  Teams: undefined;
  Games: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          // Set the icon based on the route name
          if (route.name === "Home") {
            return <FontAwesome5 name="home" size={size} color={color} />;
          } else if (route.name === "Statistics") {
            return <FontAwesome5 name="chart-bar" size={size} color={color} />;
          } else if (route.name === "Teams") {
            return <FontAwesome5 name="users" size={size} color={color} />;
          } else if (route.name === "Games") {
            return <FontAwesome5 name="basketball-ball" size={size} color={color} />;
          } else if (route.name === "Profile") {
            return <FontAwesome5 name="user" size={size} color={color} />;
          }
        },
        tabBarStyle: {
          backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
          borderTopColor: isDark ? "#374151" : "#E5E7EB",
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: "#EF4444",
        tabBarInactiveTintColor: isDark ? "#9CA3AF" : "#6B7280",
        headerStyle: {
          backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
        },
        headerTintColor: isDark ? "#F9FAFB" : "#111827",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Basketball Stats",
          tabBarLabel: "Home",
        }}
      />
      <Tab.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{
          title: "Statistics",
          tabBarLabel: "Stats",
        }}
      />
      <Tab.Screen
        name="Teams"
        component={TeamsScreen}
        options={{
          title: "Teams",
          tabBarLabel: "Teams",
        }}
      />
      <Tab.Screen
        name="Games"
        component={GamesScreen}
        options={{
          title: "Games",
          tabBarLabel: "Games",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
        }}
      />
    </Tab.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-dark-950">
      <Icon name="basketball" size={64} color="#EA580C" className="mb-4" />
      <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Basketball Stats
      </Text>
      <Text className="text-base text-gray-600 dark:text-gray-400">Loading...</Text>
    </View>
  );
}

function AppContent() {
  const { isAuthenticated, selectedLeague, isLoading } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Custom navigation themes
  const LightNavigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: "#F9FAFB",
      card: "#FFFFFF",
      text: "#111827",
      border: "#E5E7EB",
    },
  };

  const DarkNavigationTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: "#0F1419",
      card: "#1F2937",
      text: "#F9FAFB",
      border: "#374151",
    },
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer theme={isDark ? DarkNavigationTheme : LightNavigationTheme}>
      {!isAuthenticated ? (
        <AuthNavigator />
      ) : !selectedLeague ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="LeagueSelection" component={LeagueSelectionScreen} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
            },
            headerTintColor: isDark ? "#F9FAFB" : "#111827",
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        >
          <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
          <Stack.Screen
            name="LiveGame"
            component={LiveGameScreen}
            options={{
              title: "Live Game",
              presentation: "fullScreenModal",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="PlayerStats"
            component={PlayerStatsScreen}
            options={{ title: "Player Stats" }}
          />
          <Stack.Screen
            name="PlayerComparison"
            component={PlayerComparisonScreen}
            options={{ title: "Player Comparison", headerShown: false }}
          />
          <Stack.Screen
            name="ShotChart"
            component={ShotChartScreen}
            options={{ title: "Shot Chart", headerShown: false }}
          />
          <Stack.Screen
            name="CreateGame"
            component={CreateGameScreen}
            options={{ title: "Create Game" }}
          />
          <Stack.Screen
            name="CreateTeam"
            component={CreateTeamScreen}
            options={{ title: "Create Team" }}
          />
          <Stack.Screen
            name="CreatePlayer"
            component={CreatePlayerScreen}
            options={{ title: "Add Player" }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: "Settings" }}
          />
          <Stack.Screen
            name="TeamDetail"
            component={TeamDetailScreen}
            options={({ route }) => ({
              title: route.params.teamName,
            })}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default function AppNavigator() {
  return <AppContent />;
}
