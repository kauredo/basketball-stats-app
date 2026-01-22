import React from "react";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, TouchableOpacity, Image, useColorScheme } from "react-native";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { NAV_COLORS } from "@basketball-stats/shared";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import Icon from "../components/Icon";
import NotificationBell from "../components/NotificationBell";
import { OfflineBanner } from "../components/OfflineBanner";

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
import TeamDetailScreen from "../screens/TeamDetailScreen";
import StandingsScreen from "../screens/StandingsScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import GameAnalysisScreen from "../screens/GameAnalysisScreen";
import LeagueSettingsScreen from "../screens/LeagueSettingsScreen";
import LeagueMembersScreen from "../screens/LeagueMembersScreen";

// Navigation parameter types
export type RootStackParamList = {
  Main: undefined;
  LiveGame: { gameId: string };
  PlayerStats: { playerId: string };
  LeagueSelection: undefined;
  PlayerComparison: undefined;
  ShotChart: undefined;
  CreateGame: undefined;
  CreateTeam: undefined;
  CreatePlayer: { teamId?: string } | undefined;
  TeamDetail: { teamId: string; teamName: string };
  Standings: undefined;
  Notifications: undefined;
  GameAnalysis: { gameId: string };
  LeagueSettings: undefined;
  LeagueMembers: undefined;
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
  const colors = isDark ? NAV_COLORS.dark : NAV_COLORS.light;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
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
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.tabBarBorder,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: NAV_COLORS.primary,
        tabBarInactiveTintColor: colors.inactiveTab,
        headerStyle: {
          backgroundColor: colors.headerBg,
        },
        headerTintColor: colors.headerText,
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
          headerRight: () => (
            <View style={{ marginRight: 8 }}>
              <NotificationBell color={colors.inactiveTab} />
            </View>
          ),
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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <View className="flex-1 justify-center items-center bg-surface-50 dark:bg-surface-950">
      <Image
        source={isDark ? require("../../assets/logo-light.png") : require("../../assets/logo.png")}
        style={{ width: 128, height: 128 }}
        resizeMode="contain"
      />
      <Text className="text-base text-surface-600 dark:text-surface-400 mt-4">Loading...</Text>
    </View>
  );
}

function AppContent() {
  const { isAuthenticated, selectedLeague, isLoading } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Custom navigation themes using design system tokens
  const LightNavigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: NAV_COLORS.light.background,
      card: NAV_COLORS.light.card,
      text: NAV_COLORS.light.text,
      border: NAV_COLORS.light.border,
      primary: NAV_COLORS.primary,
    },
  };

  const DarkNavigationTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: NAV_COLORS.dark.background,
      card: NAV_COLORS.dark.card,
      text: NAV_COLORS.dark.text,
      border: NAV_COLORS.dark.border,
      primary: NAV_COLORS.primary,
    },
  };

  const colors = isDark ? NAV_COLORS.dark : NAV_COLORS.light;

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
              backgroundColor: colors.headerBg,
            },
            headerTintColor: colors.headerText,
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
            options={{ title: "Player Comparison" }}
          />
          <Stack.Screen
            name="ShotChart"
            component={ShotChartScreen}
            options={{ title: "Shot Chart" }}
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
            name="TeamDetail"
            component={TeamDetailScreen}
            options={({ route }) => ({
              title: route.params.teamName,
            })}
          />
          <Stack.Screen
            name="Standings"
            component={StandingsScreen}
            options={{ title: "League Standings" }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ title: "Notifications" }}
          />
          <Stack.Screen
            name="GameAnalysis"
            component={GameAnalysisScreen}
            options={{ title: "Game Analysis" }}
          />
          <Stack.Screen
            name="LeagueSettings"
            component={LeagueSettingsScreen}
            options={{ title: "League Settings" }}
          />
          <Stack.Screen
            name="LeagueMembers"
            component={LeagueMembersScreen}
            options={{ title: "League Members" }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default function AppNavigator() {
  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <AppContent />
    </View>
  );
}
