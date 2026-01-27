import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Share,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";
import { SkeletonTable } from "../components/Skeleton";
import { getErrorMessage } from "@basketball-stats/shared";
import type { RootStackParamList } from "../navigation/AppNavigator";

type StandingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface StandingTeam {
  teamId: string;
  teamName: string;
  city?: string;
  rank: number;
  wins: number;
  losses: number;
  winPercentage: number;
  gamesBack: number;
  homeRecord: string;
  awayRecord: string;
  avgPointsFor: number;
  avgPointsAgainst: number;
  pointDiff: number;
  last5: string[];
  streak: string;
  streakType: string | null;
  gamesPlayed?: number;
}

interface StandingsRowProps {
  team: StandingTeam;
  isFirst: boolean;
  isLast: boolean;
  onTeamPress?: (teamId: string, teamName: string) => void;
}

function StandingsRow({ team, isFirst, isLast, onTeamPress }: StandingsRowProps) {
  const [expanded, setExpanded] = useState(false);

  const handleTeamPress = () => {
    if (onTeamPress) {
      onTeamPress(team.teamId, team.teamName);
    }
  };

  return (
    <TouchableOpacity
      onPress={() => setExpanded(!expanded)}
      className={`bg-surface-100 dark:bg-surface-800/50 px-4 py-3 ${
        isFirst ? "rounded-t-xl" : ""
      } ${isLast && !expanded ? "rounded-b-xl" : ""} ${
        team.rank <= 4
          ? "border-l-4 border-l-green-500"
          : team.rank >= 8
            ? "border-l-4 border-l-red-500"
            : "border-l-4 border-l-transparent"
      }`}
      activeOpacity={0.7}
    >
      {/* Main Row */}
      <View className="flex-row items-center">
        {/* Rank */}
        <View className="w-8 items-center">
          {team.rank === 1 ? (
            <Icon name="basketball" size={20} color="#EAB308" />
          ) : (
            <Text className="text-surface-600 dark:text-surface-400 font-bold text-base">
              {team.rank}
            </Text>
          )}
        </View>

        {/* Team Info */}
        <TouchableOpacity className="flex-1 ml-3" onPress={handleTeamPress} activeOpacity={0.7}>
          <Text className="text-primary-500 font-semibold text-base">
            {team.teamName}
          </Text>
          {team.city && (
            <Text className="text-surface-500 dark:text-surface-500 text-xs">{team.city}</Text>
          )}
        </TouchableOpacity>

        {/* Record */}
        <View className="flex-row items-center">
          <Text className="text-green-500 font-bold text-base">{team.wins}</Text>
          <Text className="text-surface-500 dark:text-surface-500 mx-1">-</Text>
          <Text className="text-red-500 font-bold text-base">{team.losses}</Text>
        </View>

        {/* Win Percentage */}
        <View className="w-16 items-end">
          <Text className="text-surface-900 dark:text-white font-medium text-base">
            .{(team.winPercentage * 10).toFixed(0).padStart(3, "0")}
          </Text>
        </View>

        {/* Expand indicator */}
        <View className="ml-2">
          <Icon name={expanded ? "chevron-down" : "chevron-right"} size={16} color="#9CA3AF" />
        </View>
      </View>

      {/* Expanded Details */}
      {expanded && (
        <View
          className={`mt-3 pt-3 border-t border-surface-200 dark:border-surface-700 ${
            isLast ? "rounded-b-xl" : ""
          }`}
        >
          {/* Stats Grid */}
          <View className="flex-row flex-wrap gap-y-3">
            <View className="w-1/3 pr-2">
              <Text className="text-surface-500 dark:text-surface-500 text-xs uppercase">
                Games Back
              </Text>
              <Text className="text-surface-900 dark:text-white font-medium text-sm">
                {team.gamesBack === 0 ? "-" : team.gamesBack.toFixed(1)}
              </Text>
            </View>
            <View className="w-1/3 pr-2">
              <Text className="text-surface-500 dark:text-surface-500 text-xs uppercase">Home</Text>
              <Text className="text-surface-900 dark:text-white font-medium text-sm">
                {team.homeRecord}
              </Text>
            </View>
            <View className="w-1/3">
              <Text className="text-surface-500 dark:text-surface-500 text-xs uppercase">Away</Text>
              <Text className="text-surface-900 dark:text-white font-medium text-sm">
                {team.awayRecord}
              </Text>
            </View>
            <View className="w-1/3 pr-2">
              <Text className="text-surface-500 dark:text-surface-500 text-xs uppercase">PPG</Text>
              <Text className="text-surface-900 dark:text-white font-medium text-sm">
                {team.avgPointsFor.toFixed(1)}
              </Text>
            </View>
            <View className="w-1/3 pr-2">
              <Text className="text-surface-500 dark:text-surface-500 text-xs uppercase">OPPG</Text>
              <Text className="text-surface-900 dark:text-white font-medium text-sm">
                {team.avgPointsAgainst.toFixed(1)}
              </Text>
            </View>
            <View className="w-1/3">
              <Text className="text-surface-500 dark:text-surface-500 text-xs uppercase">Diff</Text>
              <Text
                className={`font-medium text-sm ${
                  team.pointDiff > 0
                    ? "text-green-500"
                    : team.pointDiff < 0
                      ? "text-red-500"
                      : "text-surface-600 dark:text-surface-400"
                }`}
              >
                {team.pointDiff > 0 ? "+" : ""}
                {team.pointDiff.toFixed(1)}
              </Text>
            </View>
          </View>

          {/* Last 5 and Streak */}
          <View className="flex-row items-center mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
            <View className="flex-1">
              <Text className="text-surface-500 dark:text-surface-500 text-xs uppercase mb-1">
                Last 5
              </Text>
              <View className="flex-row gap-1">
                {team.last5.map((result, i) => (
                  <View
                    key={i}
                    className={`w-6 h-6 rounded items-center justify-center ${
                      result === "W" ? "bg-green-600" : "bg-red-600"
                    }`}
                  >
                    <Text className="text-white text-xs font-bold">{result}</Text>
                  </View>
                ))}
                {[...Array(Math.max(0, 5 - team.last5.length))].map((_, i) => (
                  <View
                    key={`empty-${i}`}
                    className="w-6 h-6 rounded bg-surface-200 dark:bg-surface-700 items-center justify-center"
                  >
                    <Text className="text-surface-400 dark:text-surface-500 text-xs">-</Text>
                  </View>
                ))}
              </View>
            </View>
            <View className="items-end">
              <Text className="text-surface-500 dark:text-surface-500 text-xs uppercase mb-1">
                Streak
              </Text>
              <View className="flex-row items-center">
                {team.streakType === "W" ? (
                  <Icon name="stats" size={14} color="#22C55E" />
                ) : team.streakType === "L" ? (
                  <Icon name="stats" size={14} color="#EF4444" />
                ) : null}
                <Text
                  className={`ml-1 font-bold text-sm ${
                    team.streakType === "W"
                      ? "text-green-500"
                      : team.streakType === "L"
                        ? "text-red-500"
                        : "text-surface-500"
                  }`}
                >
                  {team.streak}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function StandingsScreen() {
  const navigation = useNavigation<StandingsScreenNavigationProp>();
  const { token, selectedLeague } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const standingsData = useQuery(
    api.statistics.getStandings,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleTeamPress = (teamId: string, teamName: string) => {
    navigation.navigate("TeamDetail", { teamId, teamName });
  };

  const handleExport = async () => {
    if (!standingsData?.standings || standingsData.standings.length === 0) {
      Alert.alert("No Data", "No standings data available to export");
      return;
    }

    setIsExporting(true);
    try {
      const columns = [
        { key: "rank", label: "Rank" },
        { key: "teamName", label: "Team" },
        { key: "wins", label: "Wins" },
        { key: "losses", label: "Losses" },
        { key: "winPercentage", label: "Win %" },
        { key: "gamesBack", label: "GB" },
        { key: "avgPointsFor", label: "PPG" },
        { key: "avgPointsAgainst", label: "OPPG" },
        { key: "pointDiff", label: "Diff" },
      ];

      const header = columns.map((col) => col.label).join(",");
      const rows = standingsData.standings.map((team: StandingTeam) =>
        columns
          .map((col) => {
            const value = team[col.key as keyof StandingTeam];
            if (typeof value === "number") {
              return col.key.includes("Percentage") || col.key.includes("Diff")
                ? value.toFixed(1)
                : value;
            }
            return `"${value}"`;
          })
          .join(",")
      );

      const csv = [header, ...rows].join("\n");
      const filename = `standings_${selectedLeague?.name || "league"}_${new Date().toISOString().split("T")[0]}`;

      await Share.share({
        message: csv,
        title: `${filename}.csv`,
      });
    } catch (error) {
      if (getErrorMessage(error, "") !== "User did not share") {
        Alert.alert("Error", "Failed to export standings");
      }
    } finally {
      setIsExporting(false);
    }
  };

  if (!selectedLeague) {
    return (
      <View className="flex-1 justify-center items-center bg-surface-50 dark:bg-surface-950 p-8">
        <Icon name="basketball" size={64} color="#6B7280" />
        <Text className="text-surface-900 dark:text-white text-2xl font-bold mt-4 mb-2">
          No League Selected
        </Text>
        <Text className="text-surface-600 dark:text-surface-400 text-base text-center">
          Please select a league to view standings.
        </Text>
      </View>
    );
  }

  if (standingsData === undefined) {
    return (
      <View className="flex-1 bg-surface-50 dark:bg-surface-950">
        <ScrollView className="p-4">
          <SkeletonTable rows={8} style={{ marginBottom: 16 }} />
        </ScrollView>
      </View>
    );
  }

  const standings = standingsData?.standings || [];

  return (
    <View className="flex-1 bg-surface-50 dark:bg-surface-950">
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header Stats */}
        <View className="flex-row p-4 gap-3">
          <View className="flex-1 bg-surface-100 dark:bg-surface-800/50 rounded-xl p-4">
            <Text className="text-surface-500 dark:text-surface-400 text-xs uppercase">League</Text>
            <Text
              className="text-surface-900 dark:text-white font-bold text-base mt-1"
              numberOfLines={1}
            >
              {standingsData?.league?.name || selectedLeague.name}
            </Text>
          </View>
          <View className="flex-1 bg-surface-100 dark:bg-surface-800/50 rounded-xl p-4">
            <Text className="text-surface-500 dark:text-surface-400 text-xs uppercase">
              Total Games
            </Text>
            <Text className="text-surface-900 dark:text-white font-bold text-2xl mt-1">
              {standingsData?.totalGames || 0}
            </Text>
          </View>
        </View>

        {/* Export Button */}
        <View className="px-4 mb-4">
          <TouchableOpacity
            onPress={handleExport}
            disabled={isExporting || standings.length === 0}
            className={`flex-row items-center justify-center py-3 px-4 rounded-xl ${
              standings.length > 0 ? "bg-primary-500" : "bg-surface-300 dark:bg-surface-700"
            }`}
          >
            <Icon name="stats" size={18} color={standings.length > 0 ? "#FFFFFF" : "#9CA3AF"} />
            <Text
              className={`ml-2 font-semibold ${
                standings.length > 0 ? "text-white" : "text-surface-500"
              }`}
            >
              {isExporting ? "Exporting..." : "Export Standings"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Standings List */}
        {standings.length > 0 ? (
          <View className="px-4 pb-8">
            {/* Table Header */}
            <View className="flex-row px-4 py-2 mb-1">
              <View className="w-8" />
              <Text className="flex-1 ml-3 text-surface-500 dark:text-surface-500 text-xs uppercase font-semibold">
                Team
              </Text>
              <Text className="text-surface-500 dark:text-surface-500 text-xs uppercase font-semibold">
                Record
              </Text>
              <Text className="w-16 text-right text-surface-500 dark:text-surface-500 text-xs uppercase font-semibold">
                PCT
              </Text>
              <View className="w-6" />
            </View>

            {/* Standings Rows */}
            <View className="border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
              {standings.map((team: StandingTeam, index: number) => (
                <View
                  key={team.teamId}
                  className={
                    index < standings.length - 1
                      ? "border-b border-surface-200 dark:border-surface-700"
                      : ""
                  }
                >
                  <StandingsRow
                    team={team}
                    isFirst={index === 0}
                    isLast={index === standings.length - 1}
                    onTeamPress={handleTeamPress}
                  />
                </View>
              ))}
            </View>

            {/* Legend */}
            <View className="mt-4 bg-surface-100 dark:bg-surface-800/50 rounded-xl p-4">
              <Text className="text-surface-500 dark:text-surface-400 text-xs uppercase font-semibold mb-3">
                Legend
              </Text>
              <View className="flex-row flex-wrap gap-x-4 gap-y-2">
                <View className="flex-row items-center">
                  <View className="w-3 h-3 bg-green-500 rounded mr-2" />
                  <Text className="text-surface-600 dark:text-surface-400 text-xs">
                    Playoff Position
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-3 h-3 bg-red-500 rounded mr-2" />
                  <Text className="text-surface-600 dark:text-surface-400 text-xs">
                    Bottom of League
                  </Text>
                </View>
              </View>
              <Text className="text-surface-500 dark:text-surface-500 text-xs mt-3">
                Tap a team row to see detailed stats
              </Text>
            </View>
          </View>
        ) : (
          <View className="px-4 py-12 items-center">
            <View className="w-16 h-16 rounded-2xl bg-primary-500/10 items-center justify-center mb-4">
              <Icon name="trophy" size={32} color="#F97316" />
            </View>
            <Text className="text-surface-900 dark:text-white text-lg font-bold mb-2">
              No Standings Yet
            </Text>
            <Text className="text-surface-600 dark:text-surface-400 text-sm text-center">
              Complete some games to see the league standings here.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
