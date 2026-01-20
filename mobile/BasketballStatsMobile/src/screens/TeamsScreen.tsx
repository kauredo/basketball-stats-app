import React from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Image, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import Icon from "../components/Icon";
import { RootStackParamList } from "../navigation/AppNavigator";
import { SkeletonCard } from "../components/Skeleton";

type TeamsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Team {
  id: Id<"teams">;
  name: string;
  city?: string;
  description?: string;
  logoUrl?: string;
  activePlayersCount?: number;
}

export default function TeamsScreen() {
  const navigation = useNavigation<TeamsScreenNavigationProp>();
  const { token, selectedLeague } = useAuth();
  const { resolvedTheme } = useTheme();
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
    <TouchableOpacity
      className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 border border-gray-200 dark:border-gray-700 flex-row"
      onPress={() => navigation.navigate("TeamDetail", { teamId: team.id, teamName: team.name })}
    >
      {/* Team Logo */}
      <View className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-700 items-center justify-center mr-4">
        {team.logoUrl ? (
          <Image
            source={{ uri: team.logoUrl }}
            className="w-12 h-12 rounded-lg"
            resizeMode="contain"
          />
        ) : (
          <Icon
            name="basketball"
            size={28}
            color={resolvedTheme === "dark" ? "#9CA3AF" : "#6B7280"}
          />
        )}
      </View>

      {/* Team Info */}
      <View className="flex-1">
        <Text className="text-gray-900 dark:text-white text-lg font-bold">{team.name}</Text>
        {team.city && (
          <Text className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">{team.city}</Text>
        )}
        <Text className="text-green-500 text-sm font-medium mt-1">
          {team.activePlayersCount || 0} Active Players
        </Text>
        {team.description && (
          <Text
            className="text-gray-500 dark:text-gray-400 text-xs mt-1 leading-4"
            numberOfLines={1}
          >
            {team.description}
          </Text>
        )}
      </View>

      {/* Chevron */}
      <View className="justify-center">
        <Icon
          name="chevron-right"
          size={20}
          color={resolvedTheme === "dark" ? "#9CA3AF" : "#6B7280"}
        />
      </View>
    </TouchableOpacity>
  );

  if (teamsData === undefined) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-dark-950">
        <ScrollView className="p-4">
          <SkeletonCard style={{ marginBottom: 12 }} />
          <SkeletonCard style={{ marginBottom: 12 }} />
          <SkeletonCard style={{ marginBottom: 12 }} />
          <SkeletonCard style={{ marginBottom: 12 }} />
        </ScrollView>
      </View>
    );
  }

  const statusBarStyle = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <View className="flex-1 bg-gray-50 dark:bg-dark-950">
      <StatusBar style={statusBarStyle} />
      <FlatList
        data={teams}
        renderItem={renderTeam}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View className="items-center justify-center pt-15">
            <Icon name="basketball" size={48} color="#6B7280" className="mb-4" />
            <Text className="text-gray-900 dark:text-white text-lg font-bold mb-2">
              No teams found
            </Text>
            <Text className="text-gray-600 dark:text-gray-400 text-sm text-center leading-5">
              Teams will appear here once they're added
            </Text>
          </View>
        }
      />
    </View>
  );
}
