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
import { Id } from "../../../../convex/_generated/dataModel";
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
      <View className="flex-1 justify-center items-center bg-white dark:bg-gray-800 p-8">
        <Icon name="basketball" size={64} color="#6B7280" />
        <Text className="text-gray-900 dark:text-white text-2xl font-bold mb-2 mt-4">
          No League Selected
        </Text>
        <Text className="text-gray-600 dark:text-gray-400 text-base text-center">
          Please select a league to create a team.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-gray-50 dark:bg-gray-800"
    >
      <ScrollView className="flex-1 p-4">
        {/* Team Name */}
        <View className="mb-4">
          <Text className="text-gray-600 dark:text-gray-400 text-sm mb-2">Team Name *</Text>
          <TextInput
            className="bg-white dark:bg-gray-700 rounded-xl p-4 text-gray-900 dark:text-white text-base border border-gray-200 dark:border-gray-600"
            placeholder="Enter team name"
            placeholderTextColor="#6B7280"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        {/* City */}
        <View className="mb-4">
          <Text className="text-gray-600 dark:text-gray-400 text-sm mb-2">City (optional)</Text>
          <TextInput
            className="bg-white dark:bg-gray-700 rounded-xl p-4 text-gray-900 dark:text-white text-base border border-gray-200 dark:border-gray-600"
            placeholder="Enter city"
            placeholderTextColor="#6B7280"
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
          <Text className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            Description (optional)
          </Text>
          <TextInput
            className="bg-white dark:bg-gray-700 rounded-xl p-4 text-gray-900 dark:text-white text-base border border-gray-200 dark:border-gray-600"
            placeholder="Enter team description"
            placeholderTextColor="#6B7280"
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
            name.trim() && !isSubmitting ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-600"
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
