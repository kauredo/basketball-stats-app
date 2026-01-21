import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";
import ImagePicker from "../components/ImagePicker";

export default function CreateTeamScreen() {
  const navigation = useNavigation();
  const { token, selectedLeague } = useAuth();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [logoStorageId, setLogoStorageId] = useState<Id<"_storage"> | null>(null);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createTeamMutation = useMutation(api.teams.create);

  const handleCreateTeam = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a team name");
      return;
    }

    if (!token || !selectedLeague) {
      Alert.alert("Error", "Not authenticated or no league selected");
      return;
    }

    setIsSubmitting(true);

    try {
      await createTeamMutation({
        token,
        leagueId: selectedLeague.id,
        name: name.trim(),
        city: city.trim() || undefined,
        logoStorageId: logoStorageId || undefined,
        description: description.trim() || undefined,
      });

      Alert.alert("Success", "Team created successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create team");
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
          Please select a league to create a team.
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
        {/* Team Name */}
        <View className="mb-4">
          <Text className="text-surface-700 dark:text-surface-300 text-sm font-medium mb-2">
            Team Name <Text className="text-primary-500">*</Text>
          </Text>
          <TextInput
            className="bg-white dark:bg-surface-800 rounded-xl px-4 py-3.5 text-surface-900 dark:text-white text-base border border-surface-300 dark:border-surface-600 min-h-[48px]"
            placeholder="Enter team name"
            placeholderTextColor="#a69f96"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        {/* City */}
        <View className="mb-4">
          <Text className="text-surface-700 dark:text-surface-300 text-sm font-medium mb-2">
            City <Text className="text-surface-500">(optional)</Text>
          </Text>
          <TextInput
            className="bg-white dark:bg-surface-800 rounded-xl px-4 py-3.5 text-surface-900 dark:text-white text-base border border-surface-300 dark:border-surface-600 min-h-[48px]"
            placeholder="Enter city"
            placeholderTextColor="#a69f96"
            value={city}
            onChangeText={setCity}
            autoCapitalize="words"
          />
        </View>

        {/* Logo Image Picker */}
        <ImagePicker
          onImageUploaded={(storageId) => setLogoStorageId(storageId)}
          onImageCleared={() => setLogoStorageId(null)}
          label="Team Logo"
          placeholder="Tap to add team logo"
        />

        {/* Description */}
        <View className="mb-6">
          <Text className="text-surface-700 dark:text-surface-300 text-sm font-medium mb-2">
            Description <Text className="text-surface-500">(optional)</Text>
          </Text>
          <TextInput
            className="bg-white dark:bg-surface-800 rounded-xl px-4 py-3.5 text-surface-900 dark:text-white text-base border border-surface-300 dark:border-surface-600"
            placeholder="Enter team description"
            placeholderTextColor="#a69f96"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={{ minHeight: 100 }}
          />
        </View>

        {/* Create Button */}
        <TouchableOpacity
          className={`rounded-xl p-4 items-center mb-8 ${
            name.trim() && !isSubmitting ? "bg-primary-500" : "bg-surface-300 dark:bg-surface-600"
          }`}
          onPress={handleCreateTeam}
          disabled={!name.trim() || isSubmitting}
        >
          <Text className="text-white font-bold text-lg">
            {isSubmitting ? "Creating..." : "Create Team"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
