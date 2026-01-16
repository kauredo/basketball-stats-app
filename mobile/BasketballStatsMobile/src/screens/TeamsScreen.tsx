import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";

interface Team {
  id: Id<"teams">;
  name: string;
  city?: string;
  description?: string;
  activePlayersCount?: number;
}

export default function TeamsScreen() {
  const { token, selectedLeague } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const teamsData = useQuery(
    api.teams.list,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const teams = teamsData?.teams || [];

  const onRefresh = () => {
    setRefreshing(true);
    // Data auto-refreshes with Convex
    setTimeout(() => setRefreshing(false), 500);
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
          {team.activePlayersCount || 0} Active Players
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

  if (teamsData === undefined) {
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
        keyExtractor={item => item.id}
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
