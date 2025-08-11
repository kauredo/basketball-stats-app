import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, TouchableOpacity } from "react-native";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { useAuthStore } from "../hooks/useAuthStore";
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

// Navigation parameter types
export type RootStackParamList = {
  Main: undefined;
  LiveGame: { gameId: number };
  PlayerStats: { playerId: number };
  LeagueSelection: undefined;
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
            return (
              <FontAwesome5 name="basketball-ball" size={size} color={color} />
            );
          } else if (route.name === "Profile") {
            return <FontAwesome5 name="user" size={size} color={color} />;
          }
        },
        tabBarStyle: {
          backgroundColor: "#1F2937",
          borderTopColor: "#374151",
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: "#EF4444",
        tabBarInactiveTintColor: "#9CA3AF",
        headerStyle: {
          backgroundColor: "#1F2937",
        },
        headerTintColor: "#F9FAFB",
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
    <View className="flex-1 justify-center items-center bg-dark-950">
      <Icon name="basketball" size={64} color="#EA580C" className="mb-4" />
      <Text className="text-2xl font-bold text-white mb-2">Basketball Stats</Text>
      <Text className="text-base text-gray-400">Loading...</Text>
    </View>
  );
}

function AppContent() {
  const { isAuthenticated, selectedLeague, initialize } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initialize();
      } catch (error) {
        console.error("App initialization error:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, [initialize]);

  if (isInitializing) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthNavigator />
      ) : !selectedLeague ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="LeagueSelection"
            component={LeagueSelectionScreen}
          />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: "#1F2937",
            },
            headerTintColor: "#F9FAFB",
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        >
          <Stack.Screen
            name="Main"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="LiveGame"
            component={LiveGameScreen}
            options={{
              title: "Live Game",
              presentation: "fullScreenModal",
            }}
          />
          <Stack.Screen
            name="PlayerStats"
            component={PlayerStatsScreen}
            options={{ title: "Player Stats" }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default function AppNavigator() {
  return <AppContent />;
}

