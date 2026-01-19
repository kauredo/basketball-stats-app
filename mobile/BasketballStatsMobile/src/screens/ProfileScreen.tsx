import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import Icon from "../components/Icon";

export default function ProfileScreen() {
  const { user, token, selectedLeague, userLeagues, logout, selectLeague, refreshUser } = useAuth();
  const { resolvedTheme } = useTheme();

  // Edit profile state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState(user?.firstName || "");
  const [editLastName, setEditLastName] = useState(user?.lastName || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Change password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Mutations
  const updateProfileMutation = useMutation(api.auth.updateProfile);
  const changePasswordMutation = useMutation(api.auth.changePassword);

  // Fetch user leagues from Convex
  const leaguesData = useQuery(api.leagues.list, token ? { token } : "skip");

  const leagues = leaguesData?.leagues?.filter((l: any) => l.membership) || userLeagues;

  const handleOpenEditProfile = () => {
    setEditFirstName(user?.firstName || "");
    setEditLastName(user?.lastName || "");
    setShowEditProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!token) return;
    if (!editFirstName.trim() || !editLastName.trim()) {
      Alert.alert("Error", "First name and last name are required");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      await updateProfileMutation({
        token,
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
      });
      await refreshUser?.();
      setShowEditProfile(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleOpenChangePassword = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowChangePassword(true);
  };

  const handleChangePassword = async () => {
    if (!token) return;
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "All fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePasswordMutation({
        token,
        currentPassword,
        newPassword,
        newPasswordConfirmation: confirmPassword,
      });
      setShowChangePassword(false);
      Alert.alert("Success", "Password changed successfully");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
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
          <View className="relative">
            <View className="w-20 h-20 rounded-full bg-orange-500 items-center justify-center mb-4">
              <Text className="text-white text-2xl font-bold">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </Text>
            </View>
            <TouchableOpacity
              className="absolute bottom-2 right-0 w-8 h-8 rounded-full bg-gray-800 dark:bg-gray-600 items-center justify-center border-2 border-white dark:border-gray-900"
              onPress={handleOpenEditProfile}
            >
              <Icon name="settings" size={14} color="#FFFFFF" />
            </TouchableOpacity>
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

        {/* Account */}
        <View className="mb-8">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">Account</Text>

          <TouchableOpacity
            className="bg-white dark:bg-gray-800 rounded-lg p-4 flex-row items-center mb-2 border border-gray-200 dark:border-gray-700"
            onPress={handleOpenEditProfile}
          >
            <View className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full items-center justify-center mr-3">
              <Icon name="user" size={20} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text className="text-base text-gray-900 dark:text-white font-medium">Edit Profile</Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                Change your name
              </Text>
            </View>
            <Icon
              name="chevron-right"
              size={20}
              color={resolvedTheme === "dark" ? "#9CA3AF" : "#6B7280"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-white dark:bg-gray-800 rounded-lg p-4 flex-row items-center mb-2 border border-gray-200 dark:border-gray-700"
            onPress={handleOpenChangePassword}
          >
            <View className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full items-center justify-center mr-3">
              <Icon name="settings" size={20} color="#F59E0B" />
            </View>
            <View className="flex-1">
              <Text className="text-base text-gray-900 dark:text-white font-medium">Change Password</Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                Update your password
              </Text>
            </View>
            <Icon
              name="chevron-right"
              size={20}
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

      {/* Edit Profile Modal */}
      <Modal visible={showEditProfile} animationType="fade" transparent>
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center"
          onPress={() => setShowEditProfile(false)}
        >
          <Pressable
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 mx-6 w-[90%] max-w-sm"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-gray-900 dark:text-white text-xl font-bold text-center mb-6">
              Edit Profile
            </Text>

            <View className="mb-4">
              <Text className="text-gray-600 dark:text-gray-400 text-sm mb-2">First Name</Text>
              <TextInput
                className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-3 text-base"
                value={editFirstName}
                onChangeText={setEditFirstName}
                placeholder="Enter first name"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
              />
            </View>

            <View className="mb-6">
              <Text className="text-gray-600 dark:text-gray-400 text-sm mb-2">Last Name</Text>
              <TextInput
                className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-3 text-base"
                value={editLastName}
                onChangeText={setEditLastName}
                placeholder="Enter last name"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-gray-200 dark:bg-gray-700 py-3 rounded-lg"
                onPress={() => setShowEditProfile(false)}
              >
                <Text className="text-gray-700 dark:text-gray-300 text-center font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-orange-500 py-3 rounded-lg flex-row justify-center items-center"
                onPress={handleSaveProfile}
                disabled={isUpdatingProfile}
              >
                {isUpdatingProfile ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-white text-center font-semibold">Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={showChangePassword} animationType="fade" transparent>
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center"
          onPress={() => setShowChangePassword(false)}
        >
          <Pressable
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 mx-6 w-[90%] max-w-sm"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-gray-900 dark:text-white text-xl font-bold text-center mb-6">
              Change Password
            </Text>

            <View className="mb-4">
              <Text className="text-gray-600 dark:text-gray-400 text-sm mb-2">Current Password</Text>
              <TextInput
                className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-3 text-base"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-600 dark:text-gray-400 text-sm mb-2">New Password</Text>
              <TextInput
                className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-3 text-base"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
              />
            </View>

            <View className="mb-6">
              <Text className="text-gray-600 dark:text-gray-400 text-sm mb-2">Confirm New Password</Text>
              <TextInput
                className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-3 text-base"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-gray-200 dark:bg-gray-700 py-3 rounded-lg"
                onPress={() => setShowChangePassword(false)}
              >
                <Text className="text-gray-700 dark:text-gray-300 text-center font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-orange-500 py-3 rounded-lg flex-row justify-center items-center"
                onPress={handleChangePassword}
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-white text-center font-semibold">Change</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
