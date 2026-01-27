import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation } from "convex/react";
import * as Haptics from "expo-haptics";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { getErrorMessage } from "@basketball-stats/shared";

type CreateLeagueNavigationProp = NativeStackNavigationProp<RootStackParamList, "CreateLeague">;

type LeagueType = "professional" | "college" | "high_school" | "youth" | "recreational";

const LEAGUE_TYPES: { value: LeagueType; label: string; description: string }[] = [
  { value: "recreational", label: "Recreational", description: "Casual play" },
  { value: "youth", label: "Youth", description: "Under 18" },
  { value: "high_school", label: "High School", description: "School teams" },
  { value: "college", label: "College", description: "University level" },
  { value: "professional", label: "Professional", description: "Pro leagues" },
];

export default function CreateLeagueScreen() {
  const navigation = useNavigation<CreateLeagueNavigationProp>();
  const { token, selectLeague } = useAuth();
  const createLeague = useMutation(api.leagues.create);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [leagueType, setLeagueType] = useState<LeagueType>("recreational");
  const [season, setSeason] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});

  const validate = () => {
    const newErrors: { name?: string } = {};
    if (!name.trim()) {
      newErrors.name = "League name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (name.trim().length > 100) {
      newErrors.name = "Name must be less than 100 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate() || !token) return;

    setIsCreating(true);
    try {
      const result = await createLeague({
        token,
        name: name.trim(),
        description: description.trim() || undefined,
        leagueType,
        season: season.trim() || undefined,
        isPublic,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Auto-select the new league
      if (result.league) {
        selectLeague({
          id: result.league.id,
          name: result.league.name,
          season: result.league.season,
        });
      }

      navigation.goBack();
    } catch (error) {
      console.error("Failed to create league:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", getErrorMessage(error, "Failed to create league. Please try again."));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-surface-50 dark:bg-surface-950"
    >
      {/* Header */}
      <View className="bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex-row items-center px-4 py-4">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
          <Icon name="arrow-left" size={24} color="#64748B" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-bold text-surface-900 dark:text-white ml-2">
          Create League
        </Text>
        <TouchableOpacity
          onPress={handleCreate}
          disabled={isCreating || !name.trim()}
          className={`px-4 py-2 rounded-lg ${
            isCreating || !name.trim() ? "bg-surface-200 dark:bg-surface-700" : "bg-primary-500"
          }`}
        >
          <Text
            className={`font-semibold ${
              isCreating || !name.trim() ? "text-surface-400" : "text-white"
            }`}
          >
            {isCreating ? "Creating..." : "Create"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Name */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            League Name <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors({});
            }}
            placeholder="e.g., Downtown Basketball League"
            placeholderTextColor="#94A3B8"
            className={`bg-white dark:bg-surface-800 border rounded-xl px-4 py-3 text-surface-900 dark:text-white ${
              errors.name ? "border-red-500" : "border-surface-200 dark:border-surface-700"
            }`}
          />
          {errors.name && <Text className="text-red-500 text-sm mt-1">{errors.name}</Text>}
        </View>

        {/* League Type */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            League Type
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {LEAGUE_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                onPress={() => setLeagueType(type.value)}
                className={`px-4 py-2 rounded-xl border-2 ${
                  leagueType === type.value
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800"
                }`}
              >
                <Text
                  className={`font-medium ${
                    leagueType === type.value
                      ? "text-primary-600 dark:text-primary-400"
                      : "text-surface-700 dark:text-surface-300"
                  }`}
                >
                  {type.label}
                </Text>
                <Text
                  className={`text-xs ${
                    leagueType === type.value
                      ? "text-primary-500 dark:text-primary-400"
                      : "text-surface-500 dark:text-surface-400"
                  }`}
                >
                  {type.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Season */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            Season
          </Text>
          <TextInput
            value={season}
            onChangeText={setSeason}
            placeholder="e.g., 2025-2026"
            placeholderTextColor="#94A3B8"
            className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-surface-900 dark:text-white"
          />
        </View>

        {/* Description */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            Description
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Brief description of the league..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-surface-900 dark:text-white min-h-[80px]"
          />
        </View>

        {/* Public Toggle */}
        <View className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-4 flex-row items-center justify-between">
          <View className="flex-1 mr-4">
            <Text className="font-medium text-surface-900 dark:text-white">Public League</Text>
            <Text className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
              Anyone can find and join this league
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setIsPublic(!isPublic)}
            className={`w-12 h-7 rounded-full p-0.5 ${
              isPublic ? "bg-primary-500" : "bg-surface-300 dark:bg-surface-600"
            }`}
          >
            <View
              className={`w-6 h-6 rounded-full bg-white shadow-sm transform transition-transform ${
                isPublic ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mt-6 flex-row gap-3">
          <Icon name="info" size={20} color="#3B82F6" />
          <View className="flex-1">
            <Text className="text-blue-800 dark:text-blue-300 text-sm font-medium">
              What happens next?
            </Text>
            <Text className="text-blue-600 dark:text-blue-400 text-xs mt-1">
              After creating your league, you can add teams, invite members, and start scheduling
              games.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
