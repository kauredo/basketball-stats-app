import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Linking,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import Icon from "../components/Icon";
import ImagePicker from "../components/ImagePicker";
import ColorPicker from "../components/ui/ColorPicker";
import LineupStatsCard from "../components/LineupStatsCard";
import PairStatsCard from "../components/PairStatsCard";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { FontAwesome5 } from "@expo/vector-icons";
import { exportRosterCSV, exportLineupStatsCSV, exportPairStatsCSV } from "../utils/export";
import { SOCIAL_PLATFORMS, type SocialLinks } from "@basketball-stats/shared";

type TeamDetailRouteProp = RouteProp<RootStackParamList, "TeamDetail">;

/** Local interface for team stats from getTeamsStats query */
interface TeamStat {
  teamId: Id<"teams">;
  teamName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winPercentage: number;
  avgPoints: number;
  avgPointsAllowed: number;
  avgRebounds: number;
  avgOffensiveRebounds: number;
  avgDefensiveRebounds: number;
  avgAssists: number;
  avgSteals: number;
  avgBlocks: number;
  fieldGoalPercentage: number;
  threePointPercentage: number;
  freeThrowPercentage: number;
}

/** Local interface for game data from games.list query */
interface GameListItem {
  id: Id<"games">;
  scheduledAt?: number;
  startedAt?: number;
  endedAt?: number;
  status: "scheduled" | "active" | "paused" | "completed";
  currentQuarter: number;
  timeRemainingSeconds: number;
  timeDisplay: string;
  homeScore: number;
  awayScore: number;
  homeTeam: {
    id: Id<"teams">;
    name: string;
    city?: string;
    logoUrl?: string;
  } | null;
  awayTeam: {
    id: Id<"teams">;
    name: string;
    city?: string;
    logoUrl?: string;
  } | null;
}
type TeamDetailNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Player {
  id: Id<"players">;
  name: string;
  number: number;
  position?: "PG" | "SG" | "SF" | "PF" | "C";
  active?: boolean;
}

interface TeamMembershipItem {
  id: string;
  role: "coach" | "assistant" | "player" | "manager";
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  player: {
    id: string;
    name: string;
    number: number;
  } | null;
  joinedAt: number;
}

export default function TeamDetailScreen() {
  const navigation = useNavigation<TeamDetailNavigationProp>();
  const route = useRoute<TeamDetailRouteProp>();
  const { teamId, teamName } = route.params;
  const { token, selectedLeague } = useAuth();
  const { resolvedTheme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [editForm, setEditForm] = useState({
    name: teamName,
    city: "",
    description: "",
    logoUrl: "",
    logoStorageId: null as Id<"_storage"> | null,
    clearLogo: false,
    primaryColor: undefined as string | undefined,
    secondaryColor: undefined as string | undefined,
    websiteUrl: "",
    socialLinks: {} as SocialLinks,
  });
  const [showSocialLinksEdit, setShowSocialLinksEdit] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Queries
  const teamData = useQuery(
    api.teams.get,
    token && teamId ? { token, teamId: teamId as Id<"teams"> } : "skip"
  );

  const playersData = useQuery(
    api.players.list,
    token && selectedLeague
      ? { token, leagueId: selectedLeague.id, teamId: teamId as Id<"teams"> }
      : "skip"
  );

  // Fetch team's recent games
  const gamesData = useQuery(
    api.games.list,
    token && selectedLeague
      ? { token, leagueId: selectedLeague.id, teamId: teamId as Id<"teams">, limit: 5 }
      : "skip"
  );

  // Fetch team statistics
  const teamsStatsData = useQuery(
    api.statistics.getTeamsStats,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  // Fetch lineup stats
  const lineupStatsData = useQuery(
    api.lineups.getTeamLineupStats,
    token && teamId ? { token, teamId: teamId as Id<"teams">, limit: 5 } : "skip"
  );

  // Fetch pair stats
  const pairStatsData = useQuery(
    api.lineups.getTeamPairStats,
    token && teamId ? { token, teamId: teamId as Id<"teams">, limit: 20 } : "skip"
  );

  // Fetch team memberships (coaches, managers, etc.)
  const teamMembershipsData = useQuery(
    api.teamMemberships.list,
    token && teamId ? { token, teamId: teamId as Id<"teams"> } : "skip"
  );

  // Mutations
  const updateTeam = useMutation(api.teams.update);
  const removeTeam = useMutation(api.teams.remove);

  const players = playersData?.players || [];
  const team = teamData?.team;
  const games = gamesData?.games || [];

  // Find this team's stats from the league stats
  const teamStats = teamsStatsData?.teams?.find((t: TeamStat) => t.teamId === teamId);

  // Get win/loss record from team data
  const wins = team?.wins ?? 0;
  const losses = team?.losses ?? 0;
  const winPct = team?.winPercentage?.toFixed(1) ?? "0.0";

  // Initialize edit form when team data loads
  React.useEffect(() => {
    if (team) {
      setEditForm({
        name: team.name || teamName,
        city: team.city || "",
        description: team.description || "",
        logoUrl: team.logoUrl || "",
        logoStorageId: null,
        clearLogo: false,
        primaryColor: team.primaryColor,
        secondaryColor: team.secondaryColor,
        websiteUrl: team.websiteUrl || "",
        socialLinks: team.socialLinks || {},
      });
    }
  }, [team, teamName]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleEditTeam = async () => {
    if (!editForm.name.trim() || !token) return;

    // Filter out empty social links
    const filteredSocialLinks = Object.fromEntries(
      Object.entries(editForm.socialLinks).filter(([, url]) => url && url.trim() !== "")
    );

    setIsUpdating(true);
    try {
      await updateTeam({
        token,
        teamId: teamId as Id<"teams">,
        name: editForm.name.trim(),
        city: editForm.city.trim() || undefined,
        description: editForm.description.trim() || undefined,
        logoStorageId: editForm.logoStorageId || undefined,
        clearLogo: editForm.clearLogo || undefined,
        primaryColor: editForm.primaryColor || undefined,
        secondaryColor: editForm.secondaryColor || undefined,
        websiteUrl: editForm.websiteUrl.trim() || undefined,
        socialLinks: Object.keys(filteredSocialLinks).length > 0 ? filteredSocialLinks : undefined,
      });
      setShowEditModal(false);
      setShowSocialLinksEdit(false);
      navigation.setParams({ teamName: editForm.name.trim() });
      Alert.alert("Success", "Team updated successfully");
    } catch (error) {
      console.error("Failed to update team:", error);
      Alert.alert("Error", "Failed to update team. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTeam = () => {
    Alert.alert(
      "Delete Team",
      `Are you sure you want to delete "${team?.name || teamName}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!token) return;
            setIsDeleting(true);
            try {
              await removeTeam({
                token,
                teamId: teamId as Id<"teams">,
              });
              navigation.goBack();
            } catch (error) {
              console.error("Failed to delete team:", error);
              Alert.alert("Error", "Failed to delete team. Please try again.");
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  // Export handlers
  const handleExportRoster = async () => {
    if (players.length === 0) {
      Alert.alert("No Data", "No players to export");
      return;
    }
    setIsExporting(true);
    setShowOptionsMenu(false);
    try {
      await exportRosterCSV(players, team?.name || teamName);
    } catch (error) {
      console.error("Failed to export roster:", error);
      Alert.alert("Error", "Failed to export roster. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportLineups = async () => {
    const lineups = lineupStatsData?.lineups || [];
    if (lineups.length === 0) {
      Alert.alert("No Data", "No lineup data to export");
      return;
    }
    setIsExporting(true);
    setShowOptionsMenu(false);
    try {
      await exportLineupStatsCSV(lineups, team?.name || teamName);
    } catch (error) {
      console.error("Failed to export lineups:", error);
      Alert.alert("Error", "Failed to export lineup stats. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPairs = async () => {
    const pairs = pairStatsData?.pairs || [];
    if (pairs.length === 0) {
      Alert.alert("No Data", "No pair data to export");
      return;
    }
    setIsExporting(true);
    setShowOptionsMenu(false);
    try {
      await exportPairStatsCSV(pairs, team?.name || teamName);
    } catch (error) {
      console.error("Failed to export pairs:", error);
      Alert.alert("Error", "Failed to export pair stats. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const getPositionColor = (position?: string) => {
    switch (position) {
      case "PG":
        return "#3B82F6";
      case "SG":
        return "#8B5CF6";
      case "SF":
        return "#10B981";
      case "PF":
        return "#F59E0B";
      case "C":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const statusBarStyle = resolvedTheme === "dark" ? "light" : "dark";

  // Set header right button with options menu
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity className="p-2 mr-1" onPress={() => setShowOptionsMenu(true)}>
          <FontAwesome5
            name="ellipsis-v"
            size={18}
            color={resolvedTheme === "dark" ? "#9CA3AF" : "#6B7280"}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, resolvedTheme]);

  if (teamData === undefined || playersData === undefined) {
    return (
      <View className="flex-1 justify-center items-center bg-surface-50 dark:bg-surface-950">
        <Text className="text-surface-900 dark:text-white text-base">Loading team...</Text>
      </View>
    );
  }

  const renderHeader = () => (
    <View className="px-4 pt-4">
      {/* Team Header Card */}
      <View className="bg-white dark:bg-surface-800 rounded-2xl p-4 mb-4 border border-surface-200 dark:border-surface-700">
        <View className="flex-row items-center">
          {team?.logoUrl ? (
            <Image
              source={{ uri: team.logoUrl }}
              className="w-16 h-16 rounded-xl bg-surface-200 dark:bg-surface-700"
              resizeMode="cover"
            />
          ) : (
            <View className="w-16 h-16 rounded-xl bg-primary-500/10 items-center justify-center">
              <Icon name="users" size={28} color="#F97316" />
            </View>
          )}
          <View className="flex-1 ml-4">
            <Text className="text-xl font-bold text-surface-900 dark:text-white">
              {team?.name || teamName}
            </Text>
            {team?.city && (
              <Text className="text-surface-600 dark:text-surface-400 text-sm">{team.city}</Text>
            )}
            {team?.description && (
              <Text className="text-surface-500 text-xs mt-1" numberOfLines={2}>
                {team.description}
              </Text>
            )}
          </View>
        </View>

        {/* Team Colors */}
        {(team?.primaryColor || team?.secondaryColor) && (
          <View className="flex-row items-center mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
            <Text className="text-surface-500 text-xs mr-2">Team Colors:</Text>
            {team?.primaryColor && (
              <View
                className="w-6 h-6 rounded-lg mr-2 border border-surface-300 dark:border-surface-600"
                style={{ backgroundColor: team.primaryColor }}
              />
            )}
            {team?.secondaryColor && (
              <View
                className="w-6 h-6 rounded-lg border border-surface-300 dark:border-surface-600"
                style={{ backgroundColor: team.secondaryColor }}
              />
            )}
          </View>
        )}

        {/* Links Row */}
        {(team?.websiteUrl ||
          (team?.socialLinks && Object.values(team.socialLinks).some((v) => v))) && (
          <View className="flex-row flex-wrap items-center gap-2 mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
            {team?.websiteUrl && (
              <TouchableOpacity
                onPress={() => Linking.openURL(team.websiteUrl!)}
                className="flex-row items-center bg-surface-100 dark:bg-surface-700 px-3 py-1.5 rounded-lg"
              >
                <Icon name="globe" size={14} color="#F97316" />
                <Text className="text-primary-500 text-xs ml-1">Website</Text>
              </TouchableOpacity>
            )}
            {team?.socialLinks &&
              SOCIAL_PLATFORMS.map((platform) => {
                const url = team.socialLinks?.[platform.key as keyof typeof team.socialLinks];
                if (!url) return null;
                return (
                  <TouchableOpacity
                    key={platform.key}
                    onPress={() => Linking.openURL(url)}
                    className="bg-surface-100 dark:bg-surface-700 p-2 rounded-lg"
                  >
                    <FontAwesome5
                      name={
                        platform.key === "twitter"
                          ? "twitter"
                          : platform.key === "tiktok"
                            ? "tiktok"
                            : platform.key
                      }
                      size={14}
                      color="#F97316"
                    />
                  </TouchableOpacity>
                );
              })}
          </View>
        )}
      </View>

      {/* Stats Overview */}
      <View className="flex-row mb-4">
        {/* Record */}
        <View className="flex-1 bg-white dark:bg-surface-800 rounded-xl p-3 mr-2 border border-surface-200 dark:border-surface-700">
          <View className="flex-row items-center mb-1">
            <Icon name="trophy" size={14} color="#F97316" />
            <Text className="text-xs text-surface-600 dark:text-surface-400 ml-1">Record</Text>
          </View>
          <Text className="text-xl font-bold text-surface-900 dark:text-white">
            {wins}-{losses}
          </Text>
          <Text className="text-xs text-surface-500">{winPct}% Win</Text>
        </View>

        {/* Players */}
        <View className="flex-1 bg-white dark:bg-surface-800 rounded-xl p-3 mr-2 border border-surface-200 dark:border-surface-700">
          <View className="flex-row items-center mb-1">
            <Icon name="user" size={14} color="#F97316" />
            <Text className="text-xs text-surface-600 dark:text-surface-400 ml-1">Roster</Text>
          </View>
          <Text className="text-xl font-bold text-surface-900 dark:text-white">
            {players.length}
          </Text>
          <Text className="text-xs text-surface-500">Players</Text>
        </View>

        {/* PPG */}
        <View className="flex-1 bg-white dark:bg-surface-800 rounded-xl p-3 border border-surface-200 dark:border-surface-700">
          <View className="flex-row items-center mb-1">
            <Icon name="stats" size={14} color="#F97316" />
            <Text className="text-xs text-surface-600 dark:text-surface-400 ml-1">PPG</Text>
          </View>
          <Text className="text-xl font-bold text-surface-900 dark:text-white">
            {teamStats?.avgPoints?.toFixed(1) ?? "0.0"}
          </Text>
          <Text className="text-xs text-surface-500">Per Game</Text>
        </View>
      </View>

      {/* Team Statistics */}
      {teamStats && (
        <View className="bg-white dark:bg-surface-800 rounded-xl p-4 mb-4 border border-surface-200 dark:border-surface-700">
          <Text className="text-sm font-semibold text-surface-900 dark:text-white mb-3">
            Team Statistics
          </Text>
          <View className="flex-row flex-wrap">
            <View className="w-1/3 mb-3">
              <Text className="text-xs text-surface-500">RPG</Text>
              <Text className="text-base font-bold text-surface-900 dark:text-white">
                {teamStats.avgRebounds?.toFixed(1) ?? "0.0"}
              </Text>
            </View>
            <View className="w-1/3 mb-3">
              <Text className="text-xs text-surface-500">APG</Text>
              <Text className="text-base font-bold text-surface-900 dark:text-white">
                {teamStats.avgAssists?.toFixed(1) ?? "0.0"}
              </Text>
            </View>
            <View className="w-1/3 mb-3">
              <Text className="text-xs text-surface-500">FG%</Text>
              <Text className="text-base font-bold text-surface-900 dark:text-white">
                {teamStats.fieldGoalPercentage?.toFixed(1) ?? "0.0"}%
              </Text>
            </View>
            <View className="w-1/3">
              <Text className="text-xs text-surface-500">3P%</Text>
              <Text className="text-base font-bold text-surface-900 dark:text-white">
                {teamStats.threePointPercentage?.toFixed(1) ?? "0.0"}%
              </Text>
            </View>
            <View className="w-1/3">
              <Text className="text-xs text-surface-500">FT%</Text>
              <Text className="text-base font-bold text-surface-900 dark:text-white">
                {teamStats.freeThrowPercentage?.toFixed(1) ?? "0.0"}%
              </Text>
            </View>
            <View className="w-1/3">
              <Text className="text-xs text-surface-500">SPG</Text>
              <Text className="text-base font-bold text-surface-900 dark:text-white">
                {teamStats.avgSteals?.toFixed(1) ?? "0.0"}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Lineup Stats */}
      <LineupStatsCard
        lineups={lineupStatsData?.lineups || []}
        isLoading={lineupStatsData === undefined}
      />

      {/* Pair Stats */}
      <View className="mt-4">
        <PairStatsCard pairs={pairStatsData?.pairs || []} isLoading={pairStatsData === undefined} />
      </View>

      {/* Recent Games */}
      {games.length > 0 && (
        <View className="bg-white dark:bg-surface-800 rounded-xl mb-4 mt-4 border border-surface-200 dark:border-surface-700 overflow-hidden">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-700">
            <Text className="text-sm font-semibold text-surface-900 dark:text-white">
              Recent Games
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Games" as never)}>
              <Text className="text-xs text-primary-500">View All</Text>
            </TouchableOpacity>
          </View>
          {games.slice(0, 5).map((game: GameListItem) => {
            const isHome = game.homeTeam?.id === teamId;
            const opponent = isHome ? game.awayTeam : game.homeTeam;
            const teamScore = isHome ? game.homeScore : game.awayScore;
            const opponentScore = isHome ? game.awayScore : game.homeScore;
            const won = teamScore > opponentScore;
            const isCompleted = game.status === "completed";

            return (
              <TouchableOpacity
                key={game.id}
                className="flex-row items-center px-4 py-3 border-b border-surface-100 dark:border-surface-700"
                onPress={() => navigation.navigate("GameAnalysis", { gameId: game.id })}
              >
                <View
                  className={`w-8 h-8 rounded-lg items-center justify-center ${
                    isCompleted
                      ? won
                        ? "bg-green-500/10"
                        : "bg-red-500/10"
                      : "bg-surface-100 dark:bg-surface-700"
                  }`}
                >
                  <Text
                    className={`text-sm font-bold ${
                      isCompleted ? (won ? "text-green-500" : "text-red-500") : "text-surface-500"
                    }`}
                  >
                    {isCompleted ? (won ? "W" : "L") : "-"}
                  </Text>
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-sm font-medium text-surface-900 dark:text-white">
                    {isHome ? "vs" : "@"} {opponent?.name || "Unknown"}
                  </Text>
                  <Text className="text-xs text-surface-500">
                    {game.scheduledAt ? new Date(game.scheduledAt).toLocaleDateString() : "No date"}
                  </Text>
                </View>
                {isCompleted && (
                  <Text className="text-sm font-bold text-surface-900 dark:text-white">
                    {teamScore}-{opponentScore}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Roster Card */}
      <View className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden mb-4">
        {/* Roster Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-700">
          <View className="flex-row items-center">
            <Text className="text-base font-semibold text-surface-900 dark:text-white">Roster</Text>
            <View className="ml-2 px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700">
              <Text className="text-xs font-medium text-surface-600 dark:text-surface-400">
                {players.length}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            className="bg-surface-100 dark:bg-surface-700 px-3 py-2 rounded-xl flex-row items-center"
            onPress={() => navigation.navigate("CreatePlayer", { teamId })}
            activeOpacity={0.7}
          >
            <Icon name="user-plus" size={14} color="#F97316" />
            <Text className="text-primary-500 font-semibold text-xs ml-1.5">Add Player</Text>
          </TouchableOpacity>
        </View>

        {/* Player List */}
        {players.length === 0 ? (
          <View className="items-center justify-center py-12 px-4">
            <View className="w-14 h-14 rounded-2xl bg-primary-500/10 items-center justify-center mb-4">
              <Icon name="user" size={28} color="#F97316" />
            </View>
            <Text className="text-surface-900 dark:text-white font-semibold mb-1">
              No players yet
            </Text>
            <Text className="text-surface-500 text-sm text-center">
              Add players to this team to start tracking their stats
            </Text>
          </View>
        ) : (
          <View>
            {players.map((player: Player, index: number) => (
              <TouchableOpacity
                key={player.id}
                className={`flex-row items-center px-4 py-3 ${
                  index < players.length - 1
                    ? "border-b border-surface-100 dark:border-surface-800"
                    : ""
                }`}
                onPress={() => navigation.navigate("PlayerStats", { playerId: player.id })}
              >
                <View className="w-11 h-11 rounded-xl bg-surface-100 dark:bg-surface-700 items-center justify-center">
                  <Text className="text-surface-900 dark:text-white text-base font-bold">
                    {player.number}
                  </Text>
                </View>

                <View className="flex-1 ml-3">
                  <Text className="text-surface-900 dark:text-white text-sm font-semibold">
                    {player.name}
                  </Text>
                  <View className="flex-row items-center mt-0.5">
                    {player.position && (
                      <View
                        className="px-1.5 py-0.5 rounded mr-2"
                        style={{ backgroundColor: getPositionColor(player.position) + "20" }}
                      >
                        <Text
                          className="text-[10px] font-semibold"
                          style={{ color: getPositionColor(player.position) }}
                        >
                          {player.position}
                        </Text>
                      </View>
                    )}
                    <Text
                      className={`text-[10px] font-medium ${
                        player.active !== false ? "text-green-500" : "text-surface-500"
                      }`}
                    >
                      {player.active !== false ? "Active" : "Inactive"}
                    </Text>
                  </View>
                </View>

                <Icon
                  name="chevron-right"
                  size={18}
                  color={resolvedTheme === "dark" ? "#6B7280" : "#9CA3AF"}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Team Staff Section */}
      {(teamMembershipsData?.memberships?.length ?? 0) > 0 && (
        <View className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden mb-4">
          <View className="flex-row items-center px-4 py-3 border-b border-surface-200 dark:border-surface-700">
            <Icon name="users" size={18} color="#F97316" />
            <Text className="text-base font-semibold text-surface-900 dark:text-white ml-2">
              Team Staff
            </Text>
            <View className="ml-2 px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700">
              <Text className="text-xs font-medium text-surface-600 dark:text-surface-400">
                {teamMembershipsData?.memberships?.length ?? 0}
              </Text>
            </View>
          </View>
          <View className="divide-y divide-surface-100 dark:divide-surface-700">
            {(teamMembershipsData?.memberships as TeamMembershipItem[] | undefined)?.map(
              (membership) => (
                <View key={membership.id} className="flex-row items-center px-4 py-3">
                  <View className="w-10 h-10 rounded-full bg-primary-500 items-center justify-center">
                    <Text className="text-white font-semibold text-sm">
                      {membership.user?.firstName?.[0]?.toUpperCase() || "?"}
                      {membership.user?.lastName?.[0]?.toUpperCase() || ""}
                    </Text>
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-surface-900 dark:text-white text-sm font-semibold">
                      {membership.user
                        ? `${membership.user.firstName} ${membership.user.lastName}`
                        : "Unknown"}
                    </Text>
                    <Text className="text-surface-500 text-xs capitalize">{membership.role}</Text>
                  </View>
                  {membership.player && (
                    <View className="px-2 py-1 rounded-lg bg-surface-100 dark:bg-surface-700">
                      <Text className="text-xs text-surface-600 dark:text-surface-400">
                        #{membership.player.number}
                      </Text>
                    </View>
                  )}
                </View>
              )
            )}
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-surface-50 dark:bg-surface-950">
      <StatusBar style={statusBarStyle} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {renderHeader()}
      </ScrollView>

      {/* Options Menu Modal */}
      <Modal
        visible={showOptionsMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setShowOptionsMenu(false)}
        >
          <View className="bg-white dark:bg-surface-800 rounded-t-3xl p-4 pb-8">
            <View className="w-10 h-1 bg-surface-300 dark:bg-surface-600 rounded-full self-center mb-4" />
            <Text className="text-surface-900 dark:text-white text-lg font-bold mb-4 text-center">
              Team Options
            </Text>

            {team?.canManage && (
              <TouchableOpacity
                className="flex-row items-center p-4 bg-surface-100 dark:bg-surface-700/50 rounded-xl mb-3"
                onPress={() => {
                  setShowOptionsMenu(false);
                  setShowEditModal(true);
                }}
              >
                <FontAwesome5 name="edit" size={18} color="#3B82F6" />
                <Text className="text-surface-900 dark:text-white font-medium ml-3">Edit Team</Text>
              </TouchableOpacity>
            )}

            {/* Export Options */}
            <View className="border-t border-surface-200 dark:border-surface-700 my-3 pt-3">
              <Text className="text-surface-500 dark:text-surface-400 text-xs font-semibold uppercase mb-2 ml-1">
                Export Data
              </Text>
              <TouchableOpacity
                className="flex-row items-center p-4 bg-surface-100 dark:bg-surface-700/50 rounded-xl mb-2"
                onPress={handleExportRoster}
                disabled={isExporting || players.length === 0}
              >
                <FontAwesome5 name="users" size={18} color="#10B981" />
                <Text className="text-surface-900 dark:text-white font-medium ml-3">
                  Export Roster
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center p-4 bg-surface-100 dark:bg-surface-700/50 rounded-xl mb-2"
                onPress={handleExportLineups}
                disabled={isExporting || !lineupStatsData?.lineups?.length}
              >
                <FontAwesome5 name="layer-group" size={18} color="#8B5CF6" />
                <Text className="text-surface-900 dark:text-white font-medium ml-3">
                  Export Lineups
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center p-4 bg-surface-100 dark:bg-surface-700/50 rounded-xl mb-3"
                onPress={handleExportPairs}
                disabled={isExporting || !pairStatsData?.pairs?.length}
              >
                <FontAwesome5 name="handshake" size={18} color="#F59E0B" />
                <Text className="text-surface-900 dark:text-white font-medium ml-3">
                  Export Pairs
                </Text>
              </TouchableOpacity>
            </View>

            {team?.canManage && (
              <TouchableOpacity
                className="flex-row items-center p-4 bg-red-500/10 rounded-xl"
                onPress={() => {
                  setShowOptionsMenu(false);
                  handleDeleteTeam();
                }}
                disabled={isDeleting}
              >
                <FontAwesome5 name="trash" size={18} color="#EF4444" />
                <Text className="text-red-600 dark:text-red-400 font-medium ml-3">
                  {isDeleting ? "Deleting..." : "Delete Team"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Team Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-surface-50 dark:bg-surface-950"
        >
          {/* Modal Header */}
          <View className="flex-row items-center justify-between p-4 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text className="text-surface-600 dark:text-surface-400 text-base">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-surface-900 dark:text-white text-lg font-bold">Edit Team</Text>
            <TouchableOpacity
              onPress={handleEditTeam}
              disabled={isUpdating || !editForm.name.trim()}
            >
              <Text
                className={`text-base font-semibold ${
                  isUpdating || !editForm.name.trim() ? "text-surface-400" : "text-primary-500"
                }`}
              >
                {isUpdating ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView className="flex-1 p-4">
            <View className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
              {/* Team Name */}
              <View className="mb-4">
                <Text className="text-surface-700 dark:text-surface-300 text-sm font-medium mb-2">
                  Team Name *
                </Text>
                <TextInput
                  className="bg-surface-50 dark:bg-surface-700 text-surface-900 dark:text-white p-4 rounded-xl text-base border border-surface-200 dark:border-surface-600"
                  value={editForm.name}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, name: text }))}
                  placeholder="Enter team name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* City */}
              <View className="mb-4">
                <Text className="text-surface-700 dark:text-surface-300 text-sm font-medium mb-2">
                  City
                </Text>
                <TextInput
                  className="bg-surface-50 dark:bg-surface-700 text-surface-900 dark:text-white p-4 rounded-xl text-base border border-surface-200 dark:border-surface-600"
                  value={editForm.city}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, city: text }))}
                  placeholder="Enter city (optional)"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Logo Image Picker */}
              <ImagePicker
                currentImageUrl={editForm.clearLogo ? undefined : editForm.logoUrl}
                onImageUploaded={(storageId) =>
                  setEditForm((prev) => ({
                    ...prev,
                    logoStorageId: storageId,
                    clearLogo: false,
                  }))
                }
                onImageCleared={() =>
                  setEditForm((prev) => ({
                    ...prev,
                    logoStorageId: null,
                    clearLogo: true,
                  }))
                }
                label="Team Logo"
                placeholder="Tap to add team logo"
              />

              {/* Team Colors */}
              <ColorPicker
                value={editForm.primaryColor}
                onChange={(color) => setEditForm((prev) => ({ ...prev, primaryColor: color }))}
                label="Primary Color"
              />

              <ColorPicker
                value={editForm.secondaryColor}
                onChange={(color) => setEditForm((prev) => ({ ...prev, secondaryColor: color }))}
                label="Secondary Color"
              />

              {/* Website URL */}
              <View className="mb-4">
                <Text className="text-surface-700 dark:text-surface-300 text-sm font-medium mb-2">
                  Website URL
                </Text>
                <TextInput
                  className="bg-surface-50 dark:bg-surface-700 text-surface-900 dark:text-white p-4 rounded-xl text-base border border-surface-200 dark:border-surface-600"
                  value={editForm.websiteUrl}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, websiteUrl: text }))}
                  placeholder="https://example.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Social Links (Expandable) */}
              <View className="mb-4">
                <TouchableOpacity
                  onPress={() => setShowSocialLinksEdit(!showSocialLinksEdit)}
                  className="flex-row items-center justify-between bg-surface-50 dark:bg-surface-700 rounded-xl px-4 py-3.5 border border-surface-200 dark:border-surface-600"
                >
                  <View className="flex-row items-center">
                    <Icon name="globe" size={18} color="#F97316" />
                    <Text className="text-surface-700 dark:text-surface-300 text-sm font-medium ml-2">
                      Social Links
                    </Text>
                  </View>
                  <Icon
                    name={showSocialLinksEdit ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>

                {showSocialLinksEdit && (
                  <View className="mt-2 bg-surface-50 dark:bg-surface-700 rounded-xl p-4 border border-surface-200 dark:border-surface-600">
                    {SOCIAL_PLATFORMS.map((platform) => (
                      <View key={platform.key} className="mb-3 last:mb-0">
                        <Text className="text-surface-600 dark:text-surface-400 text-xs mb-1">
                          {platform.label}
                        </Text>
                        <TextInput
                          className="bg-white dark:bg-surface-600 rounded-lg px-3 py-2.5 text-surface-900 dark:text-white text-sm border border-surface-200 dark:border-surface-500"
                          placeholder={platform.placeholder}
                          placeholderTextColor="#9CA3AF"
                          value={editForm.socialLinks[platform.key as keyof SocialLinks] || ""}
                          onChangeText={(text) =>
                            setEditForm((prev) => ({
                              ...prev,
                              socialLinks: { ...prev.socialLinks, [platform.key]: text },
                            }))
                          }
                          keyboardType="url"
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Description */}
              <View>
                <Text className="text-surface-700 dark:text-surface-300 text-sm font-medium mb-2">
                  Description
                </Text>
                <TextInput
                  className="bg-surface-50 dark:bg-surface-700 text-surface-900 dark:text-white p-4 rounded-xl text-base border border-surface-200 dark:border-surface-600"
                  value={editForm.description}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, description: text }))}
                  placeholder="Enter description (optional)"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  style={{ minHeight: 100 }}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
