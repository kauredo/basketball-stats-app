import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useMutation } from "convex/react";
import { Picker } from "@react-native-picker/picker";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";
import { useTheme } from "../contexts/ThemeContext";

export default function LeagueSettingsScreen() {
  const navigation = useNavigation();
  const { token, selectedLeague } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [isSaving, setIsSaving] = useState(false);

  // Picker colors based on theme
  const pickerTextColor = isDark ? "#FFFFFF" : "#1f2937";
  const pickerIconColor = isDark ? "#9CA3AF" : "#6B7280";

  // Form state
  const [quarterMinutes, setQuarterMinutes] = useState(12);
  const [foulLimit, setFoulLimit] = useState(6);
  const [timeoutsPerTeam, setTimeoutsPerTeam] = useState(5);
  const [overtimeMinutes, setOvertimeMinutes] = useState(5);
  const [bonusMode, setBonusMode] = useState<"college" | "nba">("college");
  const [playersPerRoster, setPlayersPerRoster] = useState(12);
  const [trackAdvancedStats, setTrackAdvancedStats] = useState(true);

  // Fetch current settings
  const settingsData = useQuery(
    api.leagues.getSettings,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const updateSettings = useMutation(api.leagues.updateSettings);

  // Update form when settings are loaded
  useEffect(() => {
    if (settingsData?.settings) {
      setQuarterMinutes(settingsData.settings.quarterMinutes ?? 12);
      setFoulLimit(settingsData.settings.foulLimit ?? 6);
      setTimeoutsPerTeam(settingsData.settings.timeoutsPerTeam ?? 5);
      setOvertimeMinutes(settingsData.settings.overtimeMinutes ?? 5);
      setBonusMode(settingsData.settings.bonusMode ?? "college");
      setPlayersPerRoster(settingsData.settings.playersPerRoster ?? 12);
      setTrackAdvancedStats(settingsData.settings.trackAdvancedStats ?? true);
    }
  }, [settingsData]);

  const handleSave = async () => {
    if (!token || !selectedLeague) {
      Alert.alert("Error", "Not authenticated or no league selected");
      return;
    }

    setIsSaving(true);
    try {
      await updateSettings({
        token,
        leagueId: selectedLeague.id,
        quarterMinutes,
        foulLimit,
        timeoutsPerTeam,
        overtimeMinutes,
        bonusMode,
        playersPerRoster,
        trackAdvancedStats,
      });
      Alert.alert("Success", "Settings saved successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
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
          Please select a league to view settings.
        </Text>
      </View>
    );
  }

  if (!settingsData) {
    return (
      <View
        className="flex-1 justify-center items-center bg-surface-50 dark:bg-surface-900"
        accessibilityRole="progressbar"
        accessibilityLabel="Loading league settings"
      >
        <ActivityIndicator size="large" color="#F97316" />
        <Text className="text-surface-600 dark:text-surface-400 mt-4">Loading settings...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface-50 dark:bg-surface-900">
      <ScrollView className="flex-1 p-4">
        {/* Game Rules Section */}
        <View className="mb-6">
          <Text className="text-surface-600 dark:text-surface-400 text-sm font-semibold mb-3 uppercase">
            Game Rules
          </Text>
          <View className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
            {/* Quarter Length */}
            <View className="p-4 border-b border-surface-200 dark:border-surface-700">
              <Text className="text-surface-900 dark:text-white font-medium mb-2">
                Quarter Length
              </Text>
              <View className="bg-surface-100 dark:bg-surface-700 rounded-lg overflow-hidden">
                <Picker
                  selectedValue={quarterMinutes}
                  onValueChange={(value) => setQuarterMinutes(value)}
                  style={{ color: pickerTextColor }}
                  dropdownIconColor={pickerIconColor}
                >
                  <Picker.Item label="5 minutes" value={5} />
                  <Picker.Item label="6 minutes" value={6} />
                  <Picker.Item label="8 minutes" value={8} />
                  <Picker.Item label="10 minutes" value={10} />
                  <Picker.Item label="12 minutes" value={12} />
                </Picker>
              </View>
            </View>

            {/* Foul Limit */}
            <View className="p-4 border-b border-surface-200 dark:border-surface-700">
              <Text className="text-surface-900 dark:text-white font-medium mb-2">Foul Limit</Text>
              <View className="bg-surface-100 dark:bg-surface-700 rounded-lg overflow-hidden">
                <Picker
                  selectedValue={foulLimit}
                  onValueChange={(value) => setFoulLimit(value)}
                  style={{ color: pickerTextColor }}
                  dropdownIconColor={pickerIconColor}
                >
                  <Picker.Item label="5 fouls" value={5} />
                  <Picker.Item label="6 fouls" value={6} />
                </Picker>
              </View>
            </View>

            {/* Timeouts per Team */}
            <View className="p-4 border-b border-surface-200 dark:border-surface-700">
              <Text className="text-surface-900 dark:text-white font-medium mb-2">
                Timeouts per Team
              </Text>
              <View className="bg-surface-100 dark:bg-surface-700 rounded-lg overflow-hidden">
                <Picker
                  selectedValue={timeoutsPerTeam}
                  onValueChange={(value) => setTimeoutsPerTeam(value)}
                  style={{ color: pickerTextColor }}
                  dropdownIconColor={pickerIconColor}
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <Picker.Item key={n} label={`${n}`} value={n} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Overtime Length */}
            <View className="p-4 border-b border-surface-200 dark:border-surface-700">
              <Text className="text-surface-900 dark:text-white font-medium mb-2">
                Overtime Length
              </Text>
              <View className="bg-surface-100 dark:bg-surface-700 rounded-lg overflow-hidden">
                <Picker
                  selectedValue={overtimeMinutes}
                  onValueChange={(value) => setOvertimeMinutes(value)}
                  style={{ color: pickerTextColor }}
                  dropdownIconColor={pickerIconColor}
                >
                  <Picker.Item label="3 minutes" value={3} />
                  <Picker.Item label="4 minutes" value={4} />
                  <Picker.Item label="5 minutes" value={5} />
                </Picker>
              </View>
            </View>

            {/* Bonus Mode */}
            <View className="p-4">
              <Text className="text-surface-900 dark:text-white font-medium mb-2">Bonus Mode</Text>
              <View className="bg-surface-100 dark:bg-surface-700 rounded-lg overflow-hidden">
                <Picker
                  selectedValue={bonusMode}
                  onValueChange={(value) => setBonusMode(value)}
                  style={{ color: pickerTextColor }}
                  dropdownIconColor={pickerIconColor}
                >
                  <Picker.Item label="College (7th foul)" value="college" />
                  <Picker.Item label="NBA (5th foul)" value="nba" />
                </Picker>
              </View>
            </View>
          </View>
        </View>

        {/* League Rules Section */}
        <View className="mb-6">
          <Text className="text-surface-600 dark:text-surface-400 text-sm font-semibold mb-3 uppercase">
            League Rules
          </Text>
          <View className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
            {/* Players per Roster */}
            <View className="p-4 border-b border-surface-200 dark:border-surface-700">
              <Text className="text-surface-900 dark:text-white font-medium mb-2">
                Players per Roster
              </Text>
              <View className="bg-surface-100 dark:bg-surface-700 rounded-lg overflow-hidden">
                <Picker
                  selectedValue={playersPerRoster}
                  onValueChange={(value) => setPlayersPerRoster(value)}
                  style={{ color: pickerTextColor }}
                  dropdownIconColor={pickerIconColor}
                >
                  {[8, 10, 12, 13, 15, 17, 20].map((n) => (
                    <Picker.Item key={n} label={`${n} players`} value={n} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Track Advanced Stats */}
            <View className="flex-row items-center justify-between p-4">
              <View className="flex-1 mr-4">
                <Text className="text-surface-900 dark:text-white font-medium">
                  Track Advanced Stats
                </Text>
                <Text className="text-surface-600 dark:text-surface-400 text-sm">
                  Plus/minus, efficiency rating, net rating
                </Text>
              </View>
              <Switch
                value={trackAdvancedStats}
                onValueChange={setTrackAdvancedStats}
                trackColor={{ false: "#374151", true: "#F97316" }}
                thumbColor={trackAdvancedStats ? "#FFFFFF" : "#9CA3AF"}
                accessibilityRole="switch"
                accessibilityLabel="Track advanced stats"
                accessibilityState={{ checked: trackAdvancedStats }}
              />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          className={`rounded-xl items-center mb-8 min-h-[48px] justify-center ${
            isSaving ? "bg-surface-300 dark:bg-surface-600" : "bg-primary-500 active:bg-primary-600"
          }`}
          style={{ paddingVertical: 16 }}
          onPress={handleSave}
          disabled={isSaving}
          accessibilityRole="button"
          accessibilityLabel={isSaving ? "Saving settings" : "Save settings"}
          accessibilityState={{ disabled: isSaving }}
        >
          <Text className="text-white font-bold text-lg">
            {isSaving ? "Saving..." : "Save Settings"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
