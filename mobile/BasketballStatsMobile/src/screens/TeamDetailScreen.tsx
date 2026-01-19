import React from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import Icon from "../components/Icon";
import { RootStackParamList } from "../navigation/AppNavigator";

type TeamDetailRouteProp = RouteProp<RootStackParamList, "TeamDetail">;
type TeamDetailNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Player {
  id: Id<"players">;
  name: string;
  number: number;
  position?: "PG" | "SG" | "SF" | "PF" | "C";
  status?: string;
}

export default function TeamDetailScreen() {
  const navigation = useNavigation<TeamDetailNavigationProp>();
  const route = useRoute<TeamDetailRouteProp>();
  const { teamId, teamName } = route.params;
  const { token, selectedLeague } = useAuth();
  const { resolvedTheme } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);

  const playersData = useQuery(
    api.players.list,
    token && selectedLeague
      ? { token, leagueId: selectedLeague.id, teamId: teamId as Id<"teams"> }
      : "skip"
  );

  const players = playersData?.players || [];

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const getPositionColor = (position?: string) => {
    switch (position) {
      case "PG":
        return "#3B82F6"; // Blue
      case "SG":
        return "#8B5CF6"; // Purple
      case "SF":
        return "#10B981"; // Green
      case "PF":
        return "#F59E0B"; // Amber
      case "C":
        return "#EF4444"; // Red
      default:
        return "#6B7280"; // Gray
    }
  };

  const renderPlayer = ({ item: player }: { item: Player }) => (
    <TouchableOpacity
      className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 border border-gray-200 dark:border-gray-700 flex-row items-center"
      onPress={() => navigation.navigate("PlayerStats", { playerId: player.id })}
    >
      <View className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center mr-4">
        <Text className="text-gray-900 dark:text-white text-lg font-bold">{player.number}</Text>
      </View>

      <View className="flex-1">
        <Text className="text-gray-900 dark:text-white text-base font-semibold">{player.name}</Text>
        <View className="flex-row items-center mt-1">
          {player.position && (
            <View
              className="px-2 py-0.5 rounded mr-2"
              style={{ backgroundColor: getPositionColor(player.position) + "30" }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: getPositionColor(player.position) }}
              >
                {player.position}
              </Text>
            </View>
          )}
          {player.status && (
            <Text
              className={`text-xs font-medium ${
                player.status === "active"
                  ? "text-green-500"
                  : player.status === "injured"
                    ? "text-red-500"
                    : "text-gray-500"
              }`}
            >
              {player.status.charAt(0).toUpperCase() + player.status.slice(1)}
            </Text>
          )}
        </View>
      </View>

      <Icon
        name="chevron-right"
        size={20}
        color={resolvedTheme === "dark" ? "#9CA3AF" : "#6B7280"}
      />
    </TouchableOpacity>
  );

  const statusBarStyle = resolvedTheme === "dark" ? "light" : "dark";

  // Set header right button
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          className="bg-primary-500 px-3 py-1.5 rounded-lg mr-2"
          onPress={() => navigation.navigate("CreatePlayer", { teamId })}
        >
          <Text className="text-white font-semibold text-sm">Add Player</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, teamId]);

  if (playersData === undefined) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-dark-950">
        <Text className="text-gray-900 dark:text-white text-base">Loading roster...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-dark-950">
      <StatusBar style={statusBarStyle} />

      {/* Players List */}
      <FlatList
        data={players}
        renderItem={renderPlayer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View className="items-center justify-center pt-15">
            <Icon name="user" size={48} color="#6B7280" className="mb-4" />
            <Text className="text-gray-900 dark:text-white text-lg font-bold mb-2">
              No players found
            </Text>
            <Text className="text-gray-600 dark:text-gray-400 text-sm text-center leading-5">
              Add players to this team to get started
            </Text>
          </View>
        }
      />
    </View>
  );
}
