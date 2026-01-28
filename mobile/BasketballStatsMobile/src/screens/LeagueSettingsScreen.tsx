import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useMutation } from "convex/react";
import { Picker } from "@react-native-picker/picker";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";
import { getErrorMessage } from "@basketball-stats/shared";
import { useTheme } from "../contexts/ThemeContext";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function LeagueSettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { token, selectedLeague } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [isSaving, setIsSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Check if user can edit settings
  const canEdit =
    selectedLeague?.role === "admin" ||
    selectedLeague?.role === "owner" ||
    selectedLeague?.membership?.role === "admin" ||
    selectedLeague?.membership?.role === "owner";

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

  // Fetch members for count
  const membersData = useQuery(
    api.leagues.getMembers,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  // Fetch invite code
  const inviteData = useQuery(
    api.leagues.getInviteCode,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const updateSettings = useMutation(api.leagues.updateSettings);

  const handleCopyInviteCode = () => {
    if (!inviteData?.inviteCode) return;
    Alert.alert("Invite Code", inviteData.inviteCode, [{ text: "OK" }], { cancelable: true });
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

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
    } catch (error) {
      Alert.alert("Error", getErrorMessage(error, "Failed to save settings"));
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

  // Helper component for read-only display
  const ReadOnlyValue = ({ label, value }: { label: string; value: string }) => (
    <View className="p-4 border-b border-surface-200 dark:border-surface-700">
      <Text className="text-surface-500 dark:text-surface-400 text-xs mb-1">{label}</Text>
      <Text className="text-surface-900 dark:text-white font-medium text-base">{value}</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-surface-50 dark:bg-surface-900">
      <ScrollView className="flex-1 p-4">
        {/* View-only notice for non-admins */}
        {!canEdit && (
          <View className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <Text className="text-blue-700 dark:text-blue-300 text-sm text-center">
              Contact a league admin to change these settings
            </Text>
          </View>
        )}

        {/* Game Rules Section */}
        <View className="mb-6">
          <Text className="text-surface-600 dark:text-surface-400 text-sm font-semibold mb-3 uppercase">
            Game Rules
          </Text>
          <View className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
            {canEdit ? (
              <>
                {/* Quarter Length - Editable */}
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

                {/* Foul Limit - Editable */}
                <View className="p-4 border-b border-surface-200 dark:border-surface-700">
                  <Text className="text-surface-900 dark:text-white font-medium mb-2">
                    Foul Limit
                  </Text>
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

                {/* Timeouts per Team - Editable */}
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

                {/* Overtime Length - Editable */}
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

                {/* Bonus Mode - Editable */}
                <View className="p-4">
                  <Text className="text-surface-900 dark:text-white font-medium mb-2">
                    Bonus Mode
                  </Text>
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
              </>
            ) : (
              <>
                {/* View-only displays */}
                <ReadOnlyValue label="Quarter Length" value={`${quarterMinutes} minutes`} />
                <ReadOnlyValue label="Foul Limit" value={`${foulLimit} fouls`} />
                <ReadOnlyValue label="Timeouts per Team" value={`${timeoutsPerTeam}`} />
                <ReadOnlyValue label="Overtime Length" value={`${overtimeMinutes} minutes`} />
                <View className="p-4">
                  <Text className="text-surface-500 dark:text-surface-400 text-xs mb-1">
                    Bonus Mode
                  </Text>
                  <Text className="text-surface-900 dark:text-white font-medium text-base">
                    {bonusMode === "college" ? "College (7th foul)" : "NBA (5th foul)"}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* League Rules Section */}
        <View className="mb-6">
          <Text className="text-surface-600 dark:text-surface-400 text-sm font-semibold mb-3 uppercase">
            League Rules
          </Text>
          <View className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
            {canEdit ? (
              <>
                {/* Players per Roster - Editable */}
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

                {/* Track Advanced Stats - Editable */}
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
              </>
            ) : (
              <>
                {/* View-only displays */}
                <ReadOnlyValue label="Players per Roster" value={`${playersPerRoster} players`} />
                <View className="flex-row items-center justify-between p-4">
                  <View className="flex-1 mr-4">
                    <Text className="text-surface-500 dark:text-surface-400 text-xs mb-1">
                      Track Advanced Stats
                    </Text>
                    <Text className="text-surface-900 dark:text-white font-medium text-base">
                      {trackAdvancedStats ? "Enabled" : "Disabled"}
                    </Text>
                  </View>
                  <View
                    className={`w-4 h-4 rounded-full ${
                      trackAdvancedStats ? "bg-emerald-500" : "bg-surface-300 dark:bg-surface-600"
                    }`}
                  />
                </View>
              </>
            )}
          </View>
        </View>

        {/* Members Section */}
        <View className="mb-6">
          <Text className="text-surface-600 dark:text-surface-400 text-sm font-semibold mb-3 uppercase">
            Members
          </Text>
          <View className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
            <TouchableOpacity
              className="flex-row items-center justify-between p-4"
              onPress={() => navigation.navigate("LeagueMembers")}
              accessibilityRole="button"
              accessibilityLabel="View league members"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl items-center justify-center mr-3">
                  <Icon name="users" size={20} color="#F97316" />
                </View>
                <View className="flex-1">
                  <Text className="text-surface-900 dark:text-white font-medium">
                    Manage Members
                  </Text>
                  <Text className="text-surface-500 dark:text-surface-400 text-sm">
                    {membersData?.members?.length ?? 0} member
                    {(membersData?.members?.length ?? 0) !== 1 ? "s" : ""} in this league
                  </Text>
                </View>
              </View>
              <Icon name="chevron-right" size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Invite Code Section */}
        <View className="mb-6">
          <Text className="text-surface-600 dark:text-surface-400 text-sm font-semibold mb-3 uppercase">
            Invite Others
          </Text>
          <View className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
            <Text className="text-surface-600 dark:text-surface-400 text-sm mb-2">
              Share this code with others to let them join your league
            </Text>
            <View className="flex-row items-center bg-surface-100 dark:bg-surface-700 rounded-lg p-3 mb-3">
              <Text className="flex-1 text-surface-900 dark:text-white font-mono text-base">
                {inviteData?.inviteCode ?? "Loading..."}
              </Text>
              <TouchableOpacity
                onPress={handleCopyInviteCode}
                className="bg-primary-500 rounded-lg px-3 py-2 ml-2"
                accessibilityRole="button"
                accessibilityLabel="Copy invite code"
              >
                <Text className="text-white text-sm font-medium">
                  {copiedCode ? "Copied!" : "Copy"}
                </Text>
              </TouchableOpacity>
            </View>
            <Text className="text-surface-500 dark:text-surface-400 text-xs">
              New members will join as "Member" role by default
            </Text>
          </View>
        </View>

        {/* Save Button - Only show for admins */}
        {canEdit && (
          <TouchableOpacity
            className={`rounded-xl items-center mb-8 min-h-[48px] justify-center ${
              isSaving
                ? "bg-surface-300 dark:bg-surface-600"
                : "bg-primary-500 active:bg-primary-600"
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
        )}
      </ScrollView>
    </View>
  );
}
