import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Icon from "../components/Icon";

import { basketballAPI, Team } from "@basketball-stats/shared";

export default function TeamsScreen() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTeams = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const response = await basketballAPI.getTeams();
      setTeams(response.teams);
    } catch (error) {
      console.error("Failed to load teams:", error);
      Alert.alert("Error", "Failed to load teams");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadTeams(true);
  };

  const renderTeam = ({ item: team }: { item: Team }) => (
    <TouchableOpacity className="bg-gray-800 rounded-xl p-4 mb-3 border border-gray-700">
      <View className="mb-2">
        <Text className="text-white text-lg font-bold">{team.name}</Text>
        {team.city && (
          <Text className="text-gray-400 text-sm mt-0.5">{team.city}</Text>
        )}
      </View>

      <View className="mb-2">
        <Text className="text-green-400 text-sm font-semibold">
          {team.active_players_count} Active Players
        </Text>
      </View>

      {team.description && (
        <Text
          className="text-gray-300 text-sm leading-[18px]"
          numberOfLines={2}
        >
          {team.description}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-dark-950">
        <Text className="text-white text-base">Loading teams...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-dark-950">
      <StatusBar style="light" />
      <FlatList
        data={teams}
        renderItem={renderTeam}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="items-center justify-center pt-15">
            <Icon
              name="basketball"
              size={48}
              color="#6B7280"
              className="mb-4"
            />
            <Text className="text-white text-lg font-bold mb-2">
              No teams found
            </Text>
            <Text className="text-gray-400 text-sm text-center leading-5">
              Teams will appear here once they're added
            </Text>
          </View>
        }
      />
    </View>
  );
}
