import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  Platform,
  Switch,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";
import { getErrorMessage } from "@basketball-stats/shared";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";

interface Team {
  id: Id<"teams">;
  name: string;
  city?: string;
}

interface TeamSelectModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (team: Team) => void;
  onCreateNew: () => void;
  teams: Team[];
  excludeId?: Id<"teams"> | null;
  title: string;
}

function TeamSelectModal({
  visible,
  onClose,
  onSelect,
  onCreateNew,
  teams,
  excludeId,
  title,
}: TeamSelectModalProps) {
  const filteredTeams = excludeId ? teams.filter((t) => t.id !== excludeId) : teams;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white dark:bg-surface-800 rounded-t-3xl max-h-[70%]">
          <View className="flex-row justify-between items-center p-4 border-b border-surface-200 dark:border-surface-700">
            <Text className="text-surface-900 dark:text-white text-lg font-bold">{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          {/* Create New Team Button */}
          <TouchableOpacity
            className="p-4 border-b border-surface-200 dark:border-surface-700 flex-row items-center bg-primary-50 dark:bg-primary-900/20"
            onPress={() => {
              onClose();
              onCreateNew();
            }}
          >
            <View className="w-10 h-10 bg-primary-500 rounded-full justify-center items-center mr-3">
              <Icon name="plus" size={20} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-primary-600 dark:text-primary-400 font-medium text-base">
                Create New Team
              </Text>
              <Text className="text-surface-500 dark:text-surface-400 text-sm">
                Quick setup with default players
              </Text>
            </View>
          </TouchableOpacity>
          <FlatList
            data={filteredTeams}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="p-4 border-b border-surface-200 dark:border-surface-700 flex-row items-center"
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <View className="w-10 h-10 bg-surface-300 dark:bg-surface-600 rounded-full justify-center items-center mr-3">
                  <Icon name="basketball" size={20} color="#6B7280" />
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
                <Text className="text-surface-600 dark:text-surface-400">No existing teams</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

interface QuickTeamCreateModalProps {
  visible: boolean;
  onClose: () => void;
  onTeamCreated: (team: Team) => void;
  teamType: "home" | "away";
}

function QuickTeamCreateModal({
  visible,
  onClose,
  onTeamCreated,
  teamType,
}: QuickTeamCreateModalProps) {
  const { token, selectedLeague } = useAuth();
  const [teamName, setTeamName] = useState("");
  const [playerCount, setPlayerCount] = useState(5);
  const [_useDefaultNames, setUseDefaultNames] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const createTeamMutation = useMutation(api.teams.create);
  const createPlayerMutation = useMutation(api.players.create);

  // Fetch existing teams to check for duplicates
  const teamsData = useQuery(
    api.teams.list,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );
  const existingTeams = teamsData?.teams || [];

  // Check for existing or similar team names
  const normalizedInput = teamName.trim().toLowerCase();
  const exactMatch = existingTeams.find((t) => t.name.toLowerCase() === normalizedInput);
  const similarMatch =
    !exactMatch && normalizedInput.length >= 3
      ? existingTeams.find(
          (t) =>
            t.name.toLowerCase().includes(normalizedInput) ||
            normalizedInput.includes(t.name.toLowerCase())
        )
      : null;

  const handleCreate = async () => {
    if (!teamName.trim()) {
      Alert.alert("Error", "Please enter a team name");
      return;
    }

    if (!token || !selectedLeague) {
      Alert.alert("Error", "Not authenticated");
      return;
    }

    setIsCreating(true);

    try {
      // Create the team
      const result = await createTeamMutation({
        token,
        leagueId: selectedLeague.id,
        name: teamName.trim(),
      });
      const newTeam = result.team;

      // Create default players
      for (let i = 1; i <= playerCount; i++) {
        await createPlayerMutation({
          token,
          teamId: newTeam.id,
          name: `Player ${i}`,
          number: i,
          active: true,
        });
      }

      onTeamCreated({
        id: newTeam.id,
        name: newTeam.name,
        city: newTeam.city,
      });

      // Reset form
      setTeamName("");
      setPlayerCount(5);
      setUseDefaultNames(true);
      onClose();
    } catch (error) {
      Alert.alert("Error", getErrorMessage(error, "Failed to create team"));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white dark:bg-surface-800 rounded-t-3xl">
          <View className="flex-row justify-between items-center p-4 border-b border-surface-200 dark:border-surface-700">
            <Text className="text-surface-900 dark:text-white text-lg font-bold">
              Quick Create {teamType === "home" ? "Home" : "Away"} Team
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <View className="p-4">
            {/* Team Name */}
            <View className="mb-4">
              <Text className="text-surface-700 dark:text-surface-300 text-sm font-medium mb-2">
                Team Name
              </Text>
              <TextInput
                className={`bg-surface-100 dark:bg-surface-700 rounded-xl px-4 py-3 text-surface-900 dark:text-white text-base ${
                  exactMatch ? "border-2 border-amber-500" : ""
                }`}
                placeholder="Enter team name"
                placeholderTextColor="#9CA3AF"
                value={teamName}
                onChangeText={setTeamName}
                autoCapitalize="words"
              />

              {/* Exact match warning */}
              {exactMatch && (
                <View className="mt-2 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl">
                  <View className="flex-row items-start">
                    <Icon name="alert" size={16} color="#F59E0B" />
                    <View className="ml-2 flex-1">
                      <Text className="text-amber-700 dark:text-amber-300 text-sm font-medium">
                        Team "{exactMatch.name}" already exists
                      </Text>
                      <TouchableOpacity
                        className="mt-2 bg-amber-500 rounded-lg py-2 px-3 self-start"
                        onPress={() => {
                          onTeamCreated({
                            id: exactMatch.id,
                            name: exactMatch.name,
                            city: exactMatch.city,
                          });
                          setTeamName("");
                          onClose();
                        }}
                      >
                        <Text className="text-white font-medium text-sm">Use Existing Team</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* Similar match warning */}
              {similarMatch && !exactMatch && (
                <View className="mt-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
                  <View className="flex-row items-start">
                    <Icon name="alert" size={16} color="#3B82F6" />
                    <View className="ml-2 flex-1">
                      <Text className="text-blue-700 dark:text-blue-300 text-sm">
                        Similar team exists: "{similarMatch.name}"
                      </Text>
                      <TouchableOpacity
                        className="mt-2 bg-blue-500 rounded-lg py-2 px-3 self-start"
                        onPress={() => {
                          onTeamCreated({
                            id: similarMatch.id,
                            name: similarMatch.name,
                            city: similarMatch.city,
                          });
                          setTeamName("");
                          onClose();
                        }}
                      >
                        <Text className="text-white font-medium text-sm">
                          Use "{similarMatch.name}" Instead
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Player Count */}
            <View className="mb-4">
              <Text className="text-surface-700 dark:text-surface-300 text-sm font-medium mb-2">
                Number of Players
              </Text>
              <View className="flex-row items-center justify-between bg-surface-100 dark:bg-surface-700 rounded-xl p-3">
                <TouchableOpacity
                  className="w-10 h-10 bg-surface-200 dark:bg-surface-600 rounded-full justify-center items-center"
                  onPress={() => setPlayerCount(Math.max(1, playerCount - 1))}
                >
                  <Text className="text-surface-900 dark:text-white text-xl font-bold">-</Text>
                </TouchableOpacity>
                <Text className="text-surface-900 dark:text-white text-2xl font-bold">
                  {playerCount}
                </Text>
                <TouchableOpacity
                  className="w-10 h-10 bg-surface-200 dark:bg-surface-600 rounded-full justify-center items-center"
                  onPress={() => setPlayerCount(Math.min(15, playerCount + 1))}
                >
                  <Text className="text-surface-900 dark:text-white text-xl font-bold">+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Default Names Info */}
            <View className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
              <View className="flex-row items-center">
                <Icon name="alert" size={16} color="#3B82F6" />
                <Text className="text-blue-700 dark:text-blue-300 text-sm ml-2 flex-1">
                  Players will be created as "Player 1", "Player 2", etc. with jersey numbers 1, 2,
                  3... You can edit names later.
                </Text>
              </View>
            </View>

            {/* Create Button */}
            <TouchableOpacity
              className={`rounded-xl p-4 items-center ${
                teamName.trim() && !isCreating && !exactMatch
                  ? "bg-primary-500"
                  : "bg-surface-300 dark:bg-surface-600"
              }`}
              onPress={handleCreate}
              disabled={!teamName.trim() || isCreating || !!exactMatch}
            >
              <Text className="text-white font-bold text-lg">
                {isCreating ? "Creating..." : `Create Team with ${playerCount} Players`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function CreateGameScreen() {
  const navigation = useNavigation();
  const { token, selectedLeague } = useAuth();
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  const [showHomeTeamModal, setShowHomeTeamModal] = useState(false);
  const [showAwayTeamModal, setShowAwayTeamModal] = useState(false);
  const [showQuickCreateModal, setShowQuickCreateModal] = useState(false);
  const [quickCreateTeamType, setQuickCreateTeamType] = useState<"home" | "away">("home");
  const [scheduleForLater, setScheduleForLater] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [quarterMinutes, setQuarterMinutes] = useState(12);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const createGameMutation = useMutation(api.games.create);

  // Fetch teams
  const teamsData = useQuery(
    api.teams.list,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  // Fetch league settings
  const leagueSettingsData = useQuery(
    api.leagues.getSettings,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );
  const leagueSettings = leagueSettingsData?.settings;

  const teams: Team[] =
    teamsData?.teams.map((t) => ({
      id: t.id,
      name: t.name,
      city: t.city,
    })) || [];

  const handleCreateGame = async () => {
    if (!homeTeam || !awayTeam) {
      Alert.alert("Error", "Please select both teams");
      return;
    }

    if (!token) {
      Alert.alert("Error", "Not authenticated");
      return;
    }

    setIsSubmitting(true);

    try {
      await createGameMutation({
        token,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        scheduledAt: scheduleForLater ? scheduledDate.getTime() : undefined,
        quarterMinutes,
      });

      Alert.alert("Success", "Game created successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Error", getErrorMessage(error, "Failed to create game"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const newDate = new Date(scheduledDate);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setScheduledDate(newDate);
    }
  };

  const onTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      const newDate = new Date(scheduledDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setScheduledDate(newDate);
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
          Please select a league to create a game.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface-50 dark:bg-surface-800">
      <ScrollView className="flex-1 p-4">
        {/* Team Selection */}
        <View className="mb-6">
          <Text className="text-surface-900 dark:text-white text-lg font-semibold mb-4">Teams</Text>

          {/* Home Team */}
          <TouchableOpacity
            className="bg-white dark:bg-surface-700 rounded-xl p-4 border border-surface-200 dark:border-surface-600 mb-3"
            onPress={() => setShowHomeTeamModal(true)}
          >
            <Text className="text-surface-600 dark:text-surface-400 text-xs mb-1">HOME TEAM</Text>
            {homeTeam ? (
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-orange-600 rounded-full justify-center items-center mr-3">
                  <Icon name="basketball" size={20} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-surface-900 dark:text-white font-medium text-lg">
                    {homeTeam.name}
                  </Text>
                  {homeTeam.city && (
                    <Text className="text-surface-600 dark:text-surface-400">{homeTeam.city}</Text>
                  )}
                </View>
                <Icon name="chevron-right" size={20} color="#9CA3AF" />
              </View>
            ) : (
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-surface-200 dark:bg-surface-600 rounded-full justify-center items-center mr-3">
                  <Icon name="user" size={20} color="#9CA3AF" />
                </View>
                <Text className="text-surface-600 dark:text-surface-400 flex-1">
                  Select home team
                </Text>
                <Icon name="chevron-right" size={20} color="#9CA3AF" />
              </View>
            )}
          </TouchableOpacity>

          {/* VS Indicator */}
          <View className="items-center my-2">
            <View className="w-10 h-10 bg-surface-200 dark:bg-surface-600 rounded-full justify-center items-center">
              <Text className="text-surface-900 dark:text-white font-bold text-sm">VS</Text>
            </View>
          </View>

          {/* Away Team */}
          <TouchableOpacity
            className="bg-white dark:bg-surface-700 rounded-xl p-4 border border-surface-200 dark:border-surface-600"
            onPress={() => setShowAwayTeamModal(true)}
          >
            <Text className="text-surface-600 dark:text-surface-400 text-xs mb-1">AWAY TEAM</Text>
            {awayTeam ? (
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-blue-600 rounded-full justify-center items-center mr-3">
                  <Icon name="basketball" size={20} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-surface-900 dark:text-white font-medium text-lg">
                    {awayTeam.name}
                  </Text>
                  {awayTeam.city && (
                    <Text className="text-surface-600 dark:text-surface-400">{awayTeam.city}</Text>
                  )}
                </View>
                <Icon name="chevron-right" size={20} color="#9CA3AF" />
              </View>
            ) : (
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-surface-200 dark:bg-surface-600 rounded-full justify-center items-center mr-3">
                  <Icon name="user" size={20} color="#9CA3AF" />
                </View>
                <Text className="text-surface-600 dark:text-surface-400 flex-1">
                  Select away team
                </Text>
                <Icon name="chevron-right" size={20} color="#9CA3AF" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Schedule Toggle */}
        <View className="mb-6">
          <TouchableOpacity
            className="bg-white dark:bg-surface-700 rounded-xl p-4 border border-surface-200 dark:border-surface-600 flex-row items-center justify-between"
            onPress={() => setScheduleForLater(!scheduleForLater)}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center flex-1">
              <Icon name="calendar" size={20} color="#F97316" />
              <View className="ml-3 flex-1">
                <Text className="text-surface-900 dark:text-white font-medium">
                  Schedule for later
                </Text>
                <Text className="text-surface-500 dark:text-surface-400 text-sm">
                  {scheduleForLater ? "Set a date and time" : "Start the game immediately"}
                </Text>
              </View>
            </View>
            <Switch
              value={scheduleForLater}
              onValueChange={setScheduleForLater}
              trackColor={{ false: "#d1d5db", true: "#fdba74" }}
              thumbColor={scheduleForLater ? "#F97316" : "#f4f4f5"}
            />
          </TouchableOpacity>
        </View>

        {/* Schedule Date/Time (conditional) */}
        {scheduleForLater && (
          <View className="mb-6">
            <Text className="text-surface-900 dark:text-white text-lg font-semibold mb-4">
              Schedule
            </Text>

            {/* Date */}
            <View className="bg-white dark:bg-surface-700 rounded-xl p-4 border border-surface-200 dark:border-surface-600 mb-3">
              <Text className="text-surface-600 dark:text-surface-400 text-xs mb-2">DATE</Text>
              {Platform.OS === "ios" ? (
                <DateTimePicker
                  value={scheduledDate}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  minimumDate={new Date()}
                  style={{ marginLeft: -10 }}
                />
              ) : (
                <>
                  <TouchableOpacity
                    className="flex-row items-center justify-between py-2"
                    onPress={() => setShowDatePicker(true)}
                  >
                    <View className="flex-row items-center">
                      <Icon name="timer" size={20} color="#9CA3AF" />
                      <Text className="text-surface-900 dark:text-white font-medium text-lg ml-3">
                        {scheduledDate.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={scheduledDate}
                      mode="date"
                      display="default"
                      onChange={onDateChange}
                      minimumDate={new Date()}
                    />
                  )}
                </>
              )}
            </View>

            {/* Time */}
            <View className="bg-white dark:bg-surface-700 rounded-xl p-4 border border-surface-200 dark:border-surface-600">
              <Text className="text-surface-600 dark:text-surface-400 text-xs mb-2">TIME</Text>
              {Platform.OS === "ios" ? (
                <DateTimePicker
                  value={scheduledDate}
                  mode="time"
                  display="default"
                  onChange={onTimeChange}
                  minuteInterval={5}
                  style={{ marginLeft: -10 }}
                />
              ) : (
                <>
                  <TouchableOpacity
                    className="flex-row items-center justify-between py-2"
                    onPress={() => setShowTimePicker(true)}
                  >
                    <View className="flex-row items-center">
                      <Icon name="alarm" size={20} color="#9CA3AF" />
                      <Text className="text-surface-900 dark:text-white font-medium text-lg ml-3">
                        {scheduledDate.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                  {showTimePicker && (
                    <DateTimePicker
                      value={scheduledDate}
                      mode="time"
                      display="default"
                      onChange={onTimeChange}
                      minuteInterval={5}
                    />
                  )}
                </>
              )}
            </View>
          </View>
        )}

        {/* Game Settings */}
        <View className="mb-6">
          <Text className="text-surface-900 dark:text-white text-lg font-semibold mb-4">
            Game Settings
          </Text>

          <View className="bg-white dark:bg-surface-700 rounded-xl p-4 border border-surface-200 dark:border-surface-600">
            <Text className="text-surface-600 dark:text-surface-400 text-xs mb-2">
              QUARTER LENGTH (minutes)
            </Text>
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                className="w-12 h-12 bg-surface-200 dark:bg-surface-600 rounded-full justify-center items-center"
                onPress={() => setQuarterMinutes(Math.max(1, quarterMinutes - 1))}
              >
                <Text className="text-surface-900 dark:text-white text-2xl font-bold">-</Text>
              </TouchableOpacity>
              <Text className="text-surface-900 dark:text-white text-3xl font-bold">
                {quarterMinutes}
              </Text>
              <TouchableOpacity
                className="w-12 h-12 bg-surface-200 dark:bg-surface-600 rounded-full justify-center items-center"
                onPress={() => setQuarterMinutes(Math.min(20, quarterMinutes + 1))}
              >
                <Text className="text-surface-900 dark:text-white text-2xl font-bold">+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* League Settings Info */}
          {leagueSettings && (
            <View className="mt-3 bg-surface-100 dark:bg-surface-800 rounded-xl p-3">
              <View className="flex-row items-start">
                <Icon name="alert" size={16} color="#6B7280" />
                <View className="ml-2 flex-1">
                  <Text className="text-surface-700 dark:text-surface-300 text-sm font-medium">
                    Other rules from league settings
                  </Text>
                  <Text className="text-surface-500 dark:text-surface-400 text-xs mt-1">
                    {leagueSettings.foulLimit} foul limit • {leagueSettings.timeoutsPerTeam}{" "}
                    timeouts • {leagueSettings.bonusMode === "college" ? "College" : "NBA"} bonus
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Create Button */}
        <TouchableOpacity
          className={`rounded-xl p-4 items-center mb-8 ${
            homeTeam && awayTeam && !isSubmitting
              ? "bg-primary-500"
              : "bg-surface-300 dark:bg-surface-600"
          }`}
          onPress={handleCreateGame}
          disabled={!homeTeam || !awayTeam || isSubmitting}
        >
          <Text className="text-white font-bold text-lg">
            {isSubmitting
              ? scheduleForLater
                ? "Scheduling..."
                : "Creating..."
              : scheduleForLater
                ? "Schedule Game"
                : "Create Game"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Team Selection Modals */}
      <TeamSelectModal
        visible={showHomeTeamModal}
        onClose={() => setShowHomeTeamModal(false)}
        onSelect={setHomeTeam}
        onCreateNew={() => {
          setQuickCreateTeamType("home");
          setShowQuickCreateModal(true);
        }}
        teams={teams}
        excludeId={awayTeam?.id}
        title="Select Home Team"
      />
      <TeamSelectModal
        visible={showAwayTeamModal}
        onClose={() => setShowAwayTeamModal(false)}
        onSelect={setAwayTeam}
        onCreateNew={() => {
          setQuickCreateTeamType("away");
          setShowQuickCreateModal(true);
        }}
        teams={teams}
        excludeId={homeTeam?.id}
        title="Select Away Team"
      />

      {/* Quick Team Create Modal */}
      <QuickTeamCreateModal
        visible={showQuickCreateModal}
        onClose={() => setShowQuickCreateModal(false)}
        onTeamCreated={(team) => {
          if (quickCreateTeamType === "home") {
            setHomeTeam(team);
          } else {
            setAwayTeam(team);
          }
        }}
        teamType={quickCreateTeamType}
      />
    </View>
  );
}
