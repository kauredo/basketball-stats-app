import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";
import { getErrorMessage } from "@basketball-stats/shared";

type Position = "PG" | "SG" | "SF" | "PF" | "C";

const POSITIONS: { value: Position; label: string }[] = [
  { value: "PG", label: "Point Guard" },
  { value: "SG", label: "Shooting Guard" },
  { value: "SF", label: "Small Forward" },
  { value: "PF", label: "Power Forward" },
  { value: "C", label: "Center" },
];

interface Team {
  id: Id<"teams">;
  name: string;
  city?: string;
}

type CreatePlayerRouteParams = {
  CreatePlayer: {
    teamId?: Id<"teams">;
  };
};

export default function CreatePlayerScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<CreatePlayerRouteParams, "CreatePlayer">>();
  const { token, selectedLeague } = useAuth();

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [position, setPosition] = useState<Position | null>(null);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createPlayerMutation = useMutation(api.players.create);

  // Fetch teams
  const teamsData = useQuery(
    api.teams.list,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const teams: Team[] = useMemo(
    () =>
      teamsData?.teams.map((t) => ({
        id: t.id,
        name: t.name,
        city: t.city,
      })) || [],
    [teamsData?.teams]
  );

  // Pre-select team if passed via route params
  React.useEffect(() => {
    if (route.params?.teamId && teams.length > 0) {
      const team = teams.find((t) => t.id === route.params.teamId);
      if (team) {
        setSelectedTeam(team);
      }
    }
  }, [route.params?.teamId, teams]);

  const handleCreatePlayer = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a player name");
      return;
    }

    if (!number.trim() || isNaN(parseInt(number))) {
      Alert.alert("Error", "Please enter a valid jersey number");
      return;
    }

    if (!selectedTeam) {
      Alert.alert("Error", "Please select a team");
      return;
    }

    if (!token) {
      Alert.alert("Error", "Not authenticated");
      return;
    }

    setIsSubmitting(true);

    try {
      await createPlayerMutation({
        token,
        teamId: selectedTeam.id,
        name: name.trim(),
        number: parseInt(number),
        position: position || undefined,
        heightCm: heightCm ? parseInt(heightCm) : undefined,
        weightKg: weightKg ? parseInt(weightKg) : undefined,
      });

      Alert.alert("Success", "Player created successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Error", getErrorMessage(error, "Failed to create player"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedLeague) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-surface-800 p-8">
        <Icon name="basketball" size={64} color="#6B7280" />
        <Text className="text-surface-900 dark:text-white text-2xl font-bold mb-2 mt-4">
          No League Selected
        </Text>
        <Text className="text-surface-600 dark:text-surface-400 text-base text-center">
          Please select a league to add a player.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-surface-50 dark:bg-surface-800"
    >
      <ScrollView className="flex-1 p-4">
        {/* Team Selection */}
        <View className="mb-4">
          <Text className="text-surface-600 dark:text-surface-400 text-sm mb-2">Team *</Text>
          <TouchableOpacity
            className="bg-white dark:bg-surface-700 rounded-xl p-4 border border-surface-200 dark:border-surface-600 flex-row items-center"
            onPress={() => setShowTeamModal(true)}
          >
            {selectedTeam ? (
              <>
                <View className="w-10 h-10 bg-primary-500 rounded-full justify-center items-center mr-3">
                  <Icon name="basketball" size={20} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-surface-900 dark:text-white font-medium">
                    {selectedTeam.name}
                  </Text>
                  {selectedTeam.city && (
                    <Text className="text-surface-600 dark:text-surface-400 text-sm">
                      {selectedTeam.city}
                    </Text>
                  )}
                </View>
                <Icon name="chevron-right" size={20} color="#9CA3AF" />
              </>
            ) : (
              <>
                <View className="w-10 h-10 bg-surface-200 dark:bg-surface-600 rounded-full justify-center items-center mr-3">
                  <Icon name="basketball" size={20} color="#9CA3AF" />
                </View>
                <Text className="text-surface-600 dark:text-surface-400 flex-1">Select a team</Text>
                <Icon name="chevron-right" size={20} color="#9CA3AF" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Player Name */}
        <View className="mb-4">
          <Text className="text-surface-600 dark:text-surface-400 text-sm mb-2">Player Name *</Text>
          <TextInput
            className="bg-white dark:bg-surface-700 rounded-xl p-4 text-surface-900 dark:text-white text-base border border-surface-200 dark:border-surface-600"
            placeholder="Enter player name"
            placeholderTextColor="#6B7280"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        {/* Jersey Number */}
        <View className="mb-4">
          <Text className="text-surface-600 dark:text-surface-400 text-sm mb-2">
            Jersey Number *
          </Text>
          <TextInput
            className="bg-white dark:bg-surface-700 rounded-xl p-4 text-surface-900 dark:text-white text-base border border-surface-200 dark:border-surface-600"
            placeholder="Enter jersey number"
            placeholderTextColor="#6B7280"
            value={number}
            onChangeText={setNumber}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>

        {/* Position */}
        <View className="mb-4">
          <Text className="text-surface-600 dark:text-surface-400 text-sm mb-2">
            Position (optional)
          </Text>
          <TouchableOpacity
            className="bg-white dark:bg-surface-700 rounded-xl p-4 border border-surface-200 dark:border-surface-600 flex-row items-center justify-between"
            onPress={() => setShowPositionModal(true)}
          >
            <Text
              className={
                position
                  ? "text-surface-900 dark:text-white"
                  : "text-surface-600 dark:text-surface-400"
              }
            >
              {position ? POSITIONS.find((p) => p.value === position)?.label : "Select position"}
            </Text>
            <Icon name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Height & Weight */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1">
            <Text className="text-surface-600 dark:text-surface-400 text-sm mb-2">Height (cm)</Text>
            <TextInput
              className="bg-white dark:bg-surface-700 rounded-xl p-4 text-surface-900 dark:text-white text-base border border-surface-200 dark:border-surface-600"
              placeholder="e.g., 185"
              placeholderTextColor="#6B7280"
              value={heightCm}
              onChangeText={setHeightCm}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>
          <View className="flex-1">
            <Text className="text-surface-600 dark:text-surface-400 text-sm mb-2">Weight (kg)</Text>
            <TextInput
              className="bg-white dark:bg-surface-700 rounded-xl p-4 text-surface-900 dark:text-white text-base border border-surface-200 dark:border-surface-600"
              placeholder="e.g., 80"
              placeholderTextColor="#6B7280"
              value={weightKg}
              onChangeText={setWeightKg}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          className={`rounded-xl p-4 items-center mb-8 ${
            name.trim() && number.trim() && selectedTeam && !isSubmitting
              ? "bg-primary-500"
              : "bg-surface-300 dark:bg-surface-600"
          }`}
          onPress={handleCreatePlayer}
          disabled={!name.trim() || !number.trim() || !selectedTeam || isSubmitting}
        >
          <Text className="text-white font-bold text-lg">
            {isSubmitting ? "Creating..." : "Add Player"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Team Selection Modal */}
      <Modal visible={showTeamModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-surface-800 rounded-t-3xl max-h-[70%]">
            <View className="flex-row justify-between items-center p-4 border-b border-surface-200 dark:border-surface-700">
              <Text className="text-surface-900 dark:text-white text-lg font-bold">
                Select Team
              </Text>
              <TouchableOpacity onPress={() => setShowTeamModal(false)}>
                <Icon name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={teams}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="p-4 border-b border-surface-200 dark:border-surface-700 flex-row items-center"
                  onPress={() => {
                    setSelectedTeam(item);
                    setShowTeamModal(false);
                  }}
                >
                  <View className="w-10 h-10 bg-primary-500 rounded-full justify-center items-center mr-3">
                    <Icon name="basketball" size={20} color="#FFFFFF" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-surface-900 dark:text-white font-medium text-base">
                      {item.name}
                    </Text>
                    {item.city && (
                      <Text className="text-surface-600 dark:text-surface-400 text-sm">
                        {item.city}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View className="p-8 items-center">
                  <Text className="text-surface-600 dark:text-surface-400">No teams available</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Position Selection Modal */}
      <Modal visible={showPositionModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-surface-800 rounded-t-3xl">
            <View className="flex-row justify-between items-center p-4 border-b border-surface-200 dark:border-surface-700">
              <Text className="text-surface-900 dark:text-white text-lg font-bold">
                Select Position
              </Text>
              <TouchableOpacity onPress={() => setShowPositionModal(false)}>
                <Icon name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            {POSITIONS.map((pos) => (
              <TouchableOpacity
                key={pos.value}
                className={`p-4 border-b border-surface-200 dark:border-surface-700 flex-row items-center justify-between ${
                  position === pos.value ? "bg-surface-100 dark:bg-surface-700" : ""
                }`}
                onPress={() => {
                  setPosition(pos.value);
                  setShowPositionModal(false);
                }}
              >
                <View>
                  <Text className="text-surface-900 dark:text-white font-medium">{pos.label}</Text>
                  <Text className="text-surface-600 dark:text-surface-400 text-sm">
                    {pos.value}
                  </Text>
                </View>
                {position === pos.value && <Icon name="stats" size={20} color="#F97316" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              className="p-4 border-b border-surface-200 dark:border-surface-700"
              onPress={() => {
                setPosition(null);
                setShowPositionModal(false);
              }}
            >
              <Text className="text-surface-600 dark:text-surface-400">None / Not specified</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
