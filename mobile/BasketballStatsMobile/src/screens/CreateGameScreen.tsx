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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

interface Team {
  id: Id<"teams">;
  name: string;
  city?: string;
}

interface TeamSelectModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (team: Team) => void;
  teams: Team[];
  excludeId?: Id<"teams"> | null;
  title: string;
}

function TeamSelectModal({
  visible,
  onClose,
  onSelect,
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
                <View className="w-10 h-10 bg-primary-500 rounded-full justify-center items-center mr-3">
                  <Icon name="basketball" size={20} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-surface-900 dark:text-white font-medium text-base">
                    {item.name}
                  </Text>
                  {item.city && (
                    <Text className="text-surface-600 dark:text-surface-400 text-sm">{item.city}</Text>
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
  );
}

export default function CreateGameScreen() {
  const navigation = useNavigation();
  const { token, selectedLeague } = useAuth();
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  const [showHomeTeamModal, setShowHomeTeamModal] = useState(false);
  const [showAwayTeamModal, setShowAwayTeamModal] = useState(false);
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
        scheduledAt: scheduledDate.getTime(),
        quarterMinutes,
      });

      Alert.alert("Success", "Game created successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create game");
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
                <Text className="text-surface-600 dark:text-surface-400 flex-1">Select home team</Text>
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
                <Text className="text-surface-600 dark:text-surface-400 flex-1">Select away team</Text>
                <Icon name="chevron-right" size={20} color="#9CA3AF" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Schedule */}
        <View className="mb-6">
          <Text className="text-surface-900 dark:text-white text-lg font-semibold mb-4">Schedule</Text>

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
            {isSubmitting ? "Creating..." : "Create Game"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Team Selection Modals */}
      <TeamSelectModal
        visible={showHomeTeamModal}
        onClose={() => setShowHomeTeamModal(false)}
        onSelect={setHomeTeam}
        teams={teams}
        excludeId={awayTeam?.id}
        title="Select Home Team"
      />
      <TeamSelectModal
        visible={showAwayTeamModal}
        onClose={() => setShowAwayTeamModal(false)}
        onSelect={setAwayTeam}
        teams={teams}
        excludeId={homeTeam?.id}
        title="Select Away Team"
      />
    </View>
  );
}
