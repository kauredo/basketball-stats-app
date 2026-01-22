import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import Icon from "../components/Icon";
import type { RootStackParamList } from "../navigation/AppNavigator";
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
    setTimeout(() => setRefreshing(false), 500);
  };

  const renderTeam = ({ item: team }: { item: Team }) => (
    <TouchableOpacity
      className="bg-surface-100 dark:bg-surface-800/50 rounded-xl p-4 mb-2 flex-row items-center"
      onPress={() => navigation.navigate("TeamDetail", { teamId: team.id, teamName: team.name })}
      activeOpacity={0.7}
    >
      {/* Team Logo */}
      <View className="w-12 h-12 rounded-xl bg-white dark:bg-surface-700 items-center justify-center mr-4 border border-surface-200 dark:border-surface-600">
        {team.logoUrl ? (
          <Image
            source={{ uri: team.logoUrl }}
            className="w-10 h-10 rounded-lg"
            resizeMode="contain"
          />
        ) : (
          <Icon name="users" size={24} color={resolvedTheme === "dark" ? "#9CA3AF" : "#6B7280"} />
        )}
      </View>

      {/* Team Info */}
      <View className="flex-1">
        <Text className="text-surface-900 dark:text-white text-base font-semibold">
          {team.name}
        </Text>
        {team.city && (
          <Text className="text-surface-500 dark:text-surface-400 text-sm">{team.city}</Text>
        )}
      </View>

      {/* Player count & chevron */}
      <View className="items-end mr-2">
        <Text className="text-surface-900 dark:text-white text-lg font-bold">
          {team.activePlayersCount || 0}
        </Text>
        <Text className="text-surface-500 dark:text-surface-400 text-xs">players</Text>
      </View>

      <Icon
        name="chevron-right"
        size={18}
        color={resolvedTheme === "dark" ? "#6B7280" : "#9CA3AF"}
      />
    </TouchableOpacity>
  );

  const statusBarStyle = resolvedTheme === "dark" ? "light" : "dark";

  if (teamsData === undefined) {
    return (
      <View className="flex-1 bg-surface-50 dark:bg-surface-950">
        <ScrollView className="p-4">
          <SkeletonCard style={{ marginBottom: 12 }} />
          <SkeletonCard style={{ marginBottom: 12 }} />
          <SkeletonCard style={{ marginBottom: 12 }} />
          <SkeletonCard style={{ marginBottom: 12 }} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface-50 dark:bg-surface-950">
      <StatusBar style={statusBarStyle} />
      <FlatList
        data={teams}
        renderItem={renderTeam}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View className="mb-4">
            {/* Create Team Quick Action */}
            <TouchableOpacity
              className="flex-row items-center justify-between bg-primary-500 rounded-2xl p-4 mb-4"
              onPress={() => navigation.navigate("CreateTeam")}
              activeOpacity={0.8}
              style={{
                shadowColor: "#F97316",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center mr-3">
                  <Icon name="plus" size={22} color="#FFFFFF" />
                </View>
                <View>
                  <Text className="text-white text-base font-bold">Create Team</Text>
                  <Text className="text-white/70 text-xs">Add a new team to your league</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>

            {/* Teams Section Header */}
            {teams.length > 0 && (
              <View className="flex-row items-center">
                <Icon name="users" size={14} color="#F97316" style={{ marginRight: 8 }} />
                <Text className="text-sm font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                  All Teams
                </Text>
                <Text className="text-xs text-surface-400 dark:text-surface-500 ml-2">
                  ({teams.length})
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View className="items-center justify-center pt-12">
            <View className="w-16 h-16 rounded-2xl bg-primary-500/10 items-center justify-center mb-4">
              <Icon name="users" size={32} color="#F97316" />
            </View>
            <Text className="text-surface-900 dark:text-white text-lg font-bold mb-2">
              No teams yet
            </Text>
            <Text className="text-surface-600 dark:text-surface-400 text-sm text-center leading-5 px-8 mb-6">
              Create your first team to start building your roster
            </Text>
            <TouchableOpacity
              className="flex-row items-center bg-primary-500 rounded-xl px-5 py-3"
              onPress={() => navigation.navigate("CreateTeam")}
              activeOpacity={0.8}
              style={{
                shadowColor: "#F97316",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Icon name="plus" size={18} color="#FFFFFF" />
              <Text className="text-white text-sm font-bold ml-2">Create your first team</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}
