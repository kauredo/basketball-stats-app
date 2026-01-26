import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation } from "convex/react";
import * as Haptics from "expo-haptics";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";
import type { RootStackParamList } from "../navigation/AppNavigator";

type LeaguesNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface League {
  id: Id<"leagues">;
  name: string;
  description?: string;
  leagueType: string;
  season?: string;
  status: string;
  isPublic: boolean;
  teamsCount: number;
  membersCount: number;
  gamesCount: number;
  membership?: {
    role: string;
    canManageLeague: boolean;
  } | null;
}

const LEAGUE_TYPE_LABELS: Record<string, string> = {
  professional: "Professional",
  college: "College",
  high_school: "High School",
  youth: "Youth",
  recreational: "Recreational",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: {
    bg: "bg-surface-200 dark:bg-surface-700",
    text: "text-surface-600 dark:text-surface-400",
  },
  active: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
  completed: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
  archived: { bg: "bg-surface-200 dark:bg-surface-700", text: "text-surface-500" },
};

export default function LeaguesScreen() {
  const navigation = useNavigation<LeaguesNavigationProp>();
  const { token, selectLeague, selectedLeague } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const leaguesData = useQuery(api.leagues.list, token ? { token } : "skip");
  const removeLeague = useMutation(api.leagues.remove);

  const leagues = (leaguesData?.leagues || []) as League[];

  const onRefresh = async () => {
    setRefreshing(true);
    // Query will auto-refresh
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleSelectLeague = (league: League) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    selectLeague({
      id: league.id,
      name: league.name,
      season: league.season,
    });
  };

  const handleDeleteLeague = (league: League) => {
    Alert.alert(
      "Delete League",
      `Are you sure you want to delete "${league.name}"? This will permanently delete all ${league.teamsCount} teams, ${league.gamesCount} games, and associated data.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await removeLeague({ token: token!, leagueId: league.id, force: true });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              if (selectedLeague?.id === league.id) {
                selectLeague(null);
              }
            } catch (error) {
              console.error("Failed to delete league:", error);
              Alert.alert("Error", "Failed to delete league");
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
          },
        },
      ]
    );
  };

  const renderLeagueItem = ({ item: league }: { item: League }) => {
    const isSelected = selectedLeague?.id === league.id;
    const statusColor = STATUS_COLORS[league.status] || STATUS_COLORS.draft;

    return (
      <TouchableOpacity
        onPress={() => handleSelectLeague(league)}
        onLongPress={() => {
          if (league.membership?.canManageLeague) {
            Alert.alert(league.name, "What would you like to do?", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => handleDeleteLeague(league),
              },
            ]);
          }
        }}
        className={`bg-white dark:bg-surface-800 mx-4 mb-3 rounded-xl border-2 overflow-hidden ${
          isSelected ? "border-primary-500" : "border-surface-200 dark:border-surface-700"
        }`}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View className="p-4 border-b border-surface-100 dark:border-surface-700">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 mr-2">
              <View className="flex-row items-center gap-2">
                <Text className="font-semibold text-surface-900 dark:text-white text-base">
                  {league.name}
                </Text>
                <Icon name={league.isPublic ? "globe" : "lock"} size={14} color="#94A3B8" />
              </View>
              <Text className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                {LEAGUE_TYPE_LABELS[league.leagueType] || league.leagueType}
                {league.season && ` • ${league.season}`}
              </Text>
            </View>
            <View className={`px-2 py-1 rounded-full ${statusColor.bg}`}>
              <Text className={`text-xs font-medium ${statusColor.text}`}>
                {league.status.charAt(0).toUpperCase() + league.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row p-4">
          <View className="flex-1 items-center">
            <Text className="text-xl font-bold text-surface-900 dark:text-white">
              {league.teamsCount}
            </Text>
            <Text className="text-xs text-surface-500 dark:text-surface-400">Teams</Text>
          </View>
          <View className="flex-1 items-center border-x border-surface-100 dark:border-surface-700">
            <Text className="text-xl font-bold text-surface-900 dark:text-white">
              {league.gamesCount}
            </Text>
            <Text className="text-xs text-surface-500 dark:text-surface-400">Games</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-xl font-bold text-surface-900 dark:text-white">
              {league.membersCount}
            </Text>
            <Text className="text-xs text-surface-500 dark:text-surface-400">Members</Text>
          </View>
        </View>

        {/* Selected indicator */}
        {isSelected && (
          <View className="bg-primary-50 dark:bg-primary-900/20 px-4 py-2 flex-row items-center justify-center gap-2">
            <Icon name="check-circle" size={16} color="#F97316" />
            <Text className="text-primary-600 dark:text-primary-400 font-medium text-sm">
              Currently Selected
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-surface-50 dark:bg-surface-950">
      {/* Header */}
      <View className="bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 px-4 py-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-surface-900 dark:text-white">Leagues</Text>
            <Text className="text-surface-500 dark:text-surface-400 text-sm mt-0.5">
              {leagues.length} league{leagues.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate("CreateLeague")}
            className="bg-primary-500 px-4 py-2 rounded-lg flex-row items-center gap-2"
            activeOpacity={0.8}
          >
            <Icon name="plus" size={18} color="#FFFFFF" />
            <Text className="text-white font-semibold">New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={leagues}
        keyExtractor={(item) => item.id}
        renderItem={renderLeagueItem}
        contentContainerStyle={{ paddingVertical: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-16 px-8">
            <View className="w-20 h-20 bg-surface-100 dark:bg-surface-800 rounded-full items-center justify-center mb-4">
              <Icon name="trophy" size={40} color="#94A3B8" />
            </View>
            <Text className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
              No leagues yet
            </Text>
            <Text className="text-surface-500 dark:text-surface-400 text-center mb-6">
              Create your first league to start tracking basketball stats
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("CreateLeague")}
              className="bg-primary-500 px-6 py-3 rounded-xl flex-row items-center gap-2"
            >
              <Icon name="plus" size={20} color="#FFFFFF" />
              <Text className="text-white font-semibold">Create League</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}
