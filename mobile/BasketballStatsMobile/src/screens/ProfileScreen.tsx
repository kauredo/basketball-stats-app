import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { useTheme, ThemeMode } from "../contexts/ThemeContext";
import Icon from "../components/Icon";

const themeModeLabels: Record<ThemeMode, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

const themeModeOrder: ThemeMode[] = ["system", "light", "dark"];

export default function ProfileScreen() {
  const { user, token, selectedLeague, userLeagues, logout, selectLeague } = useAuth();
  const { mode, resolvedTheme, setMode } = useTheme();

  // Fetch user leagues from Convex
  const leaguesData = useQuery(api.leagues.list, token ? { token } : "skip");

  const leagues = leaguesData?.leagues?.filter((l: any) => l.membership) || userLeagues;

  const cycleTheme = () => {
    const currentIndex = themeModeOrder.indexOf(mode);
    const nextIndex = (currentIndex + 1) % themeModeOrder.length;
    setMode(themeModeOrder[nextIndex]);
  };

  const handleLogout = () => {
    Alert.alert("Confirm Logout", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: logout,
      },
    ]);
  };

  const handleSwitchLeague = () => {
    if (leagues.length === 0) {
      Alert.alert("No Leagues", "You are not a member of any leagues.");
      return;
    }

    Alert.alert("Switch League", "Select a different league:", [
      { text: "Cancel", style: "cancel" },
      ...leagues.map((league: any) => ({
        text: league.name,
        onPress: () => selectLeague(league),
      })),
      {
        text: "League Selection",
        onPress: () => selectLeague(null as any),
      },
    ]);
  };

  const statusBarStyle = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <View className="flex-1 bg-gray-50 dark:bg-dark-950">
      <StatusBar style={statusBarStyle} />
      <ScrollView className="flex-1 px-4">
        {/* User Info */}
        <View className="items-center py-8">
          <View className="w-20 h-20 rounded-full bg-red-500 items-center justify-center mb-4">
            <Text className="text-white text-2xl font-bold">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {user?.firstName} {user?.lastName}
          </Text>
          <Text className="text-base text-gray-600 dark:text-gray-400 mb-3">{user?.email}</Text>
          <View className="bg-green-100 dark:bg-green-900 px-3 py-1 rounded-xl">
            <Text className="text-green-700 dark:text-green-400 text-xs font-semibold">
              {user?.role === "admin" ? "Administrator" : "User"}
            </Text>
          </View>
        </View>

        {/* Current League */}
        {selectedLeague && (
          <View className="mb-8">
            <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Current League
            </Text>
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 flex-row justify-between items-center border border-gray-200 dark:border-gray-700">
              <View className="flex-1">
                <Text className="text-base font-bold text-gray-900 dark:text-white mb-1">
                  {selectedLeague.name}
                </Text>
                <Text className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {selectedLeague.leagueType}
                </Text>
                <Text className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  Season: {selectedLeague.season}
                </Text>
                {selectedLeague.membership && (
                  <View className="self-start bg-green-100 dark:bg-green-900 px-2 py-1 rounded-md mt-2">
                    <Text className="text-green-700 dark:text-green-400 text-xs font-semibold capitalize">
                      {selectedLeague.membership.role}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-md"
                onPress={handleSwitchLeague}
              >
                <Text className="text-gray-900 dark:text-white text-sm font-semibold">Switch</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* League Stats */}
        <View className="mb-8">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">My Leagues</Text>
          <View className="flex-row flex-wrap gap-3">
            <View className="bg-white dark:bg-gray-800 rounded-lg p-4 items-center flex-1 min-w-[45%] border border-gray-200 dark:border-gray-700">
              <Text className="text-2xl font-bold text-red-500 mb-1">{leagues.length}</Text>
              <Text className="text-xs text-gray-600 dark:text-gray-400 text-center">
                Total Leagues
              </Text>
            </View>
            <View className="bg-white dark:bg-gray-800 rounded-lg p-4 items-center flex-1 min-w-[45%] border border-gray-200 dark:border-gray-700">
              <Text className="text-2xl font-bold text-red-500 mb-1">
                {leagues.filter((l: any) => l.membership?.role === "admin").length}
              </Text>
              <Text className="text-xs text-gray-600 dark:text-gray-400 text-center">As Admin</Text>
            </View>
            <View className="bg-white dark:bg-gray-800 rounded-lg p-4 items-center flex-1 min-w-[45%] border border-gray-200 dark:border-gray-700">
              <Text className="text-2xl font-bold text-red-500 mb-1">
                {leagues.filter((l: any) => l.membership?.role === "coach").length}
              </Text>
              <Text className="text-xs text-gray-600 dark:text-gray-400 text-center">As Coach</Text>
            </View>
            <View className="bg-white dark:bg-gray-800 rounded-lg p-4 items-center flex-1 min-w-[45%] border border-gray-200 dark:border-gray-700">
              <Text className="text-2xl font-bold text-red-500 mb-1">
                {leagues.filter((l: any) => l.status === "active").length}
              </Text>
              <Text className="text-xs text-gray-600 dark:text-gray-400 text-center">Active</Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View className="mb-8">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">Settings</Text>

          <TouchableOpacity
            className="bg-white dark:bg-gray-800 rounded-lg p-4 flex-row justify-between items-center mb-2 border border-gray-200 dark:border-gray-700"
            onPress={cycleTheme}
          >
            <Text className="text-base text-gray-900 dark:text-white">Appearance</Text>
            <View className="flex-row items-center">
              <Text className="text-sm text-gray-600 dark:text-gray-400 mr-2">
                {themeModeLabels[mode]}
              </Text>
              <Icon
                name="arrow-right"
                size={16}
                color={resolvedTheme === "dark" ? "#9CA3AF" : "#6B7280"}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity className="bg-white dark:bg-gray-800 rounded-lg p-4 flex-row justify-between items-center mb-2 border border-gray-200 dark:border-gray-700">
            <Text className="text-base text-gray-900 dark:text-white">Account Settings</Text>
            <Icon
              name="arrow-right"
              size={16}
              color={resolvedTheme === "dark" ? "#9CA3AF" : "#6B7280"}
            />
          </TouchableOpacity>

          <TouchableOpacity className="bg-white dark:bg-gray-800 rounded-lg p-4 flex-row justify-between items-center mb-2 border border-gray-200 dark:border-gray-700">
            <Text className="text-base text-gray-900 dark:text-white">Notifications</Text>
            <Icon
              name="arrow-right"
              size={16}
              color={resolvedTheme === "dark" ? "#9CA3AF" : "#6B7280"}
            />
          </TouchableOpacity>

          <TouchableOpacity className="bg-white dark:bg-gray-800 rounded-lg p-4 flex-row justify-between items-center mb-2 border border-gray-200 dark:border-gray-700">
            <Text className="text-base text-gray-900 dark:text-white">Help & Support</Text>
            <Icon
              name="arrow-right"
              size={16}
              color={resolvedTheme === "dark" ? "#9CA3AF" : "#6B7280"}
            />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View className="mb-8">
          <TouchableOpacity
            className="bg-red-600 rounded-lg p-4 items-center"
            onPress={handleLogout}
          >
            <Text className="text-white text-base font-semibold">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
