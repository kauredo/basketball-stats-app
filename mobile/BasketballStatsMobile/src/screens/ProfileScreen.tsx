import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "../hooks/useAuthStore";
import Icon from "../components/Icon";

export default function ProfileScreen() {
  const { user, selectedLeague, userLeagues, logout, selectLeague } =
    useAuthStore();

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
    Alert.alert("Switch League", "Select a different league:", [
      { text: "Cancel", style: "cancel" },
      ...userLeagues.map(league => ({
        text: league.name,
        onPress: () => selectLeague(league),
      })),
      {
        text: "League Selection",
        onPress: () => selectLeague(null),
      },
    ]);
  };

  return (
    <View className="flex-1 bg-dark-950">
      <StatusBar style="light" />
      <ScrollView className="flex-1 px-4">
        {/* User Info */}
        <View className="items-center py-8">
          <View className="w-20 h-20 rounded-full bg-red-500 items-center justify-center mb-4">
            <Text className="text-white text-2xl font-bold">
              {user?.first_name?.[0]}
              {user?.last_name?.[0]}
            </Text>
          </View>
          <Text className="text-2xl font-bold text-white mb-1">
            {user?.full_name}
          </Text>
          <Text className="text-base text-gray-400 mb-3">{user?.email}</Text>
          <View className="bg-green-900 px-3 py-1 rounded-xl">
            <Text className="text-green-400 text-xs font-semibold">
              {user?.role === "admin" ? "Administrator" : "User"}
            </Text>
          </View>
        </View>

        {/* Current League */}
        {selectedLeague && (
          <View className="mb-8">
            <Text className="text-lg font-bold text-white mb-4">
              Current League
            </Text>
            <View className="bg-gray-800 rounded-xl p-4 flex-row justify-between items-center border border-gray-700">
              <View className="flex-1">
                <Text className="text-base font-bold text-white mb-1">
                  {selectedLeague.name}
                </Text>
                <Text className="text-sm text-gray-400 capitalize">
                  {selectedLeague.league_type}
                </Text>
                <Text className="text-sm text-gray-400 mt-0.5">
                  Season: {selectedLeague.season}
                </Text>
                {selectedLeague.membership && (
                  <View className="self-start bg-green-900 px-2 py-1 rounded-md mt-2">
                    <Text className="text-green-400 text-xs font-semibold">
                      {selectedLeague.membership.display_role}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                className="bg-gray-700 px-3 py-2 rounded-md"
                onPress={handleSwitchLeague}
              >
                <Text className="text-white text-sm font-semibold">Switch</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* League Stats */}
        <View className="mb-8">
          <Text className="text-lg font-bold text-white mb-4">My Leagues</Text>
          <View className="flex-row flex-wrap gap-3">
            <View className="bg-gray-800 rounded-lg p-4 items-center flex-1 min-w-[45%] border border-gray-700">
              <Text className="text-2xl font-bold text-red-500 mb-1">
                {userLeagues.length}
              </Text>
              <Text className="text-xs text-gray-400 text-center">
                Total Leagues
              </Text>
            </View>
            <View className="bg-gray-800 rounded-lg p-4 items-center flex-1 min-w-[45%] border border-gray-700">
              <Text className="text-2xl font-bold text-red-500 mb-1">
                {userLeagues.filter(l => l.membership?.role === "admin").length}
              </Text>
              <Text className="text-xs text-gray-400 text-center">
                As Admin
              </Text>
            </View>
            <View className="bg-gray-800 rounded-lg p-4 items-center flex-1 min-w-[45%] border border-gray-700">
              <Text className="text-2xl font-bold text-red-500 mb-1">
                {userLeagues.filter(l => l.membership?.role === "coach").length}
              </Text>
              <Text className="text-xs text-gray-400 text-center">
                As Coach
              </Text>
            </View>
            <View className="bg-gray-800 rounded-lg p-4 items-center flex-1 min-w-[45%] border border-gray-700">
              <Text className="text-2xl font-bold text-red-500 mb-1">
                {userLeagues.filter(l => l.status === "active").length}
              </Text>
              <Text className="text-xs text-gray-400 text-center">Active</Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View className="mb-8">
          <Text className="text-lg font-bold text-white mb-4">Settings</Text>

          <TouchableOpacity className="bg-gray-800 rounded-lg p-4 flex-row justify-between items-center mb-2 border border-gray-700">
            <Text className="text-base text-white">Account Settings</Text>
            <Icon name="arrow-right" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="bg-gray-800 rounded-lg p-4 flex-row justify-between items-center mb-2 border border-gray-700">
            <Text className="text-base text-white">Notifications</Text>
            <Icon name="arrow-right" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="bg-gray-800 rounded-lg p-4 flex-row justify-between items-center mb-2 border border-gray-700">
            <Text className="text-base text-white">Help & Support</Text>
            <Icon name="arrow-right" size={16} color="#9CA3AF" />
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
