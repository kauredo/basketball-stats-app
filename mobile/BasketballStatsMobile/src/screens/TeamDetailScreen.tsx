import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import Icon from "../components/Icon";
import ImagePicker from "../components/ImagePicker";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { FontAwesome5 } from "@expo/vector-icons";

type TeamDetailRouteProp = RouteProp<RootStackParamList, "TeamDetail">;
type TeamDetailNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Player {
  id: Id<"players">;
  name: string;
  number: number;
  position?: "PG" | "SG" | "SF" | "PF" | "C";
  status?: string;
}

export default function TeamDetailScreen() {
  const navigation = useNavigation<TeamDetailNavigationProp>();
  const route = useRoute<TeamDetailRouteProp>();
  const { teamId, teamName } = route.params;
  const { token, selectedLeague } = useAuth();
  const { resolvedTheme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [editForm, setEditForm] = useState({
    name: teamName,
    city: "",
    description: "",
    logoUrl: "",
    logoStorageId: null as Id<"_storage"> | null,
    clearLogo: false,
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Queries
  const teamData = useQuery(
    api.teams.get,
    token && teamId ? { token, teamId: teamId as Id<"teams"> } : "skip"
  );

  const playersData = useQuery(
    api.players.list,
    token && selectedLeague
      ? { token, leagueId: selectedLeague.id, teamId: teamId as Id<"teams"> }
      : "skip"
  );

  // Mutations
  const updateTeam = useMutation(api.teams.update);
  const removeTeam = useMutation(api.teams.remove);

  const players = playersData?.players || [];
  const team = teamData?.team;

  // Initialize edit form when team data loads
  React.useEffect(() => {
    if (team) {
      setEditForm({
        name: team.name || teamName,
        city: team.city || "",
        description: team.description || "",
        logoUrl: team.logoUrl || "",
        logoStorageId: null,
        clearLogo: false,
      });
    }
  }, [team, teamName]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleEditTeam = async () => {
    if (!editForm.name.trim() || !token) return;

    setIsUpdating(true);
    try {
      await updateTeam({
        token,
        teamId: teamId as Id<"teams">,
        name: editForm.name.trim(),
        city: editForm.city.trim() || undefined,
        description: editForm.description.trim() || undefined,
        logoStorageId: editForm.logoStorageId || undefined,
        clearLogo: editForm.clearLogo || undefined,
      });
      setShowEditModal(false);
      // Update the header title
      navigation.setParams({ teamName: editForm.name.trim() });
      Alert.alert("Success", "Team updated successfully");
    } catch (error) {
      console.error("Failed to update team:", error);
      Alert.alert("Error", "Failed to update team. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTeam = () => {
    Alert.alert(
      "Delete Team",
      `Are you sure you want to delete "${team?.name || teamName}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!token) return;
            setIsDeleting(true);
            try {
              await removeTeam({
                token,
                teamId: teamId as Id<"teams">,
              });
              navigation.goBack();
            } catch (error) {
              console.error("Failed to delete team:", error);
              Alert.alert("Error", "Failed to delete team. Please try again.");
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const getPositionColor = (position?: string) => {
    switch (position) {
      case "PG":
        return "#3B82F6"; // Blue
      case "SG":
        return "#8B5CF6"; // Purple
      case "SF":
        return "#10B981"; // Green
      case "PF":
        return "#F59E0B"; // Amber
      case "C":
        return "#EF4444"; // Red
      default:
        return "#6B7280"; // Gray
    }
  };

  const renderPlayer = ({ item: player }: { item: Player }) => (
    <TouchableOpacity
      className="bg-surface-100 dark:bg-surface-800/50 rounded-xl p-4 mb-3 flex-row items-center"
      onPress={() => navigation.navigate("PlayerStats", { playerId: player.id })}
    >
      <View className="w-12 h-12 rounded-full bg-surface-200 dark:bg-surface-700 items-center justify-center mr-4">
        <Text className="text-surface-900 dark:text-white text-lg font-bold">{player.number}</Text>
      </View>

      <View className="flex-1">
        <Text className="text-surface-900 dark:text-white text-base font-semibold">
          {player.name}
        </Text>
        <View className="flex-row items-center mt-1">
          {player.position && (
            <View
              className="px-2 py-0.5 rounded mr-2"
              style={{ backgroundColor: getPositionColor(player.position) + "30" }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: getPositionColor(player.position) }}
              >
                {player.position}
              </Text>
            </View>
          )}
          {player.status && (
            <Text
              className={`text-xs font-medium ${
                player.status === "active"
                  ? "text-green-500"
                  : player.status === "injured"
                    ? "text-red-500"
                    : "text-surface-500"
              }`}
            >
              {player.status.charAt(0).toUpperCase() + player.status.slice(1)}
            </Text>
          )}
        </View>
      </View>

      <Icon
        name="chevron-right"
        size={20}
        color={resolvedTheme === "dark" ? "#9CA3AF" : "#6B7280"}
      />
    </TouchableOpacity>
  );

  const statusBarStyle = resolvedTheme === "dark" ? "light" : "dark";

  // Set header right button with options menu
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View className="flex-row items-center">
          <TouchableOpacity
            className="bg-primary-500 px-3 py-1.5 rounded-lg mr-2"
            onPress={() => navigation.navigate("CreatePlayer", { teamId })}
          >
            <Text className="text-white font-semibold text-sm">Add Player</Text>
          </TouchableOpacity>
          <TouchableOpacity className="p-2 mr-1" onPress={() => setShowOptionsMenu(true)}>
            <FontAwesome5
              name="ellipsis-v"
              size={18}
              color={resolvedTheme === "dark" ? "#9CA3AF" : "#6B7280"}
            />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, teamId, resolvedTheme]);

  if (playersData === undefined) {
    return (
      <View className="flex-1 justify-center items-center bg-surface-50 dark:bg-surface-950">
        <Text className="text-surface-900 dark:text-white text-base">Loading roster...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface-50 dark:bg-surface-950">
      <StatusBar style={statusBarStyle} />

      {/* Players List */}
      <FlatList
        data={players}
        renderItem={renderPlayer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <View className="w-16 h-16 rounded-2xl bg-primary-500/10 items-center justify-center mb-4">
              <Icon name="user" size={32} color="#F97316" />
            </View>
            <Text className="text-surface-900 dark:text-white text-lg font-bold mb-2">
              No players found
            </Text>
            <Text className="text-surface-600 dark:text-surface-400 text-sm text-center leading-5">
              Add players to this team to get started
            </Text>
          </View>
        }
      />

      {/* Options Menu Modal */}
      <Modal
        visible={showOptionsMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setShowOptionsMenu(false)}
        >
          <View className="bg-white dark:bg-surface-800 rounded-t-3xl p-4 pb-8">
            <View className="w-10 h-1 bg-surface-300 dark:bg-surface-600 rounded-full self-center mb-4" />
            <Text className="text-surface-900 dark:text-white text-lg font-bold mb-4 text-center">
              Team Options
            </Text>

            <TouchableOpacity
              className="flex-row items-center p-4 bg-surface-100 dark:bg-surface-800/50 rounded-xl mb-3"
              onPress={() => {
                setShowOptionsMenu(false);
                setShowEditModal(true);
              }}
            >
              <FontAwesome5 name="edit" size={18} color="#3B82F6" />
              <Text className="text-surface-900 dark:text-white font-medium ml-3">Edit Team</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center p-4 bg-red-500/10 rounded-xl"
              onPress={() => {
                setShowOptionsMenu(false);
                handleDeleteTeam();
              }}
              disabled={isDeleting}
            >
              <FontAwesome5 name="trash" size={18} color="#EF4444" />
              <Text className="text-red-600 dark:text-red-400 font-medium ml-3">
                {isDeleting ? "Deleting..." : "Delete Team"}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Team Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-surface-50 dark:bg-surface-950"
        >
          {/* Modal Header */}
          <View className="flex-row items-center justify-between p-4 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text className="text-surface-600 dark:text-surface-400 text-base">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-surface-900 dark:text-white text-lg font-bold">Edit Team</Text>
            <TouchableOpacity
              onPress={handleEditTeam}
              disabled={isUpdating || !editForm.name.trim()}
            >
              <Text
                className={`text-base font-semibold ${
                  isUpdating || !editForm.name.trim() ? "text-surface-400" : "text-primary-500"
                }`}
              >
                {isUpdating ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView className="flex-1 p-4">
            <View className="bg-surface-100 dark:bg-surface-800/50 rounded-xl p-4">
              {/* Team Name */}
              <View className="mb-4">
                <Text className="text-surface-700 dark:text-surface-300 text-sm font-medium mb-2">
                  Team Name *
                </Text>
                <TextInput
                  className="bg-surface-100 dark:bg-surface-700 text-surface-900 dark:text-white p-4 rounded-xl text-base"
                  value={editForm.name}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, name: text }))}
                  placeholder="Enter team name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* City */}
              <View className="mb-4">
                <Text className="text-surface-700 dark:text-surface-300 text-sm font-medium mb-2">
                  City
                </Text>
                <TextInput
                  className="bg-surface-100 dark:bg-surface-700 text-surface-900 dark:text-white p-4 rounded-xl text-base"
                  value={editForm.city}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, city: text }))}
                  placeholder="Enter city (optional)"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Logo Image Picker */}
              <ImagePicker
                currentImageUrl={editForm.clearLogo ? undefined : editForm.logoUrl}
                onImageUploaded={(storageId) =>
                  setEditForm((prev) => ({
                    ...prev,
                    logoStorageId: storageId,
                    clearLogo: false,
                  }))
                }
                onImageCleared={() =>
                  setEditForm((prev) => ({
                    ...prev,
                    logoStorageId: null,
                    clearLogo: true,
                  }))
                }
                label="Team Logo"
                placeholder="Tap to add team logo"
              />

              {/* Description */}
              <View>
                <Text className="text-surface-700 dark:text-surface-300 text-sm font-medium mb-2">
                  Description
                </Text>
                <TextInput
                  className="bg-surface-100 dark:bg-surface-700 text-surface-900 dark:text-white p-4 rounded-xl text-base"
                  value={editForm.description}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, description: text }))}
                  placeholder="Enter description (optional)"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  style={{ minHeight: 100 }}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
