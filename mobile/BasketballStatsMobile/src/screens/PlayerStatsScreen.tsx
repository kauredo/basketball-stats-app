import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import Icon from "../components/Icon";

import {
  basketballAPI,
  Player,
  PlayerStat,
  BasketballUtils,
} from "@basketball-stats/shared";

import { RootStackParamList } from "../navigation/AppNavigator";

type PlayerStatsRouteProp = RouteProp<RootStackParamList, "PlayerStats">;
type PlayerStatsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "PlayerStats"
>;

const { width: screenWidth } = Dimensions.get("window");

interface StatCategory {
  title: string;
  stats: Array<{
    label: string;
    value: string | number;
    highlight?: boolean;
  }>;
}

export default function PlayerStatsScreen() {
  const route = useRoute<PlayerStatsRouteProp>();
  const navigation = useNavigation<PlayerStatsNavigationProp>();
  const { playerId } = route.params;

  const [player, setPlayer] = useState<Player | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<"season" | "recent">(
    "season"
  );

  useEffect(() => {
    loadPlayerData();
  }, [playerId]);

  const loadPlayerData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      // Load player details and stats
      const [playerResponse, statsResponse] = await Promise.all([
        basketballAPI.getPlayer(playerId),
        basketballAPI.getPlayerStats(playerId),
      ]);

      setPlayer(playerResponse.player);
      setPlayerStats(statsResponse.stats);

      // Set navigation title to player name
      navigation.setOptions({
        title: `${playerResponse.player.name} Stats`,
      });
    } catch (error) {
      console.error("Failed to load player data:", error);
      Alert.alert("Error", "Failed to load player data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPlayerData(true);
  };

  const calculateAggregatedStats = () => {
    if (!playerStats.length) return null;

    // Filter stats based on selected period
    const filteredStats =
      selectedPeriod === "recent"
        ? playerStats.slice(-10) // Last 10 games
        : playerStats;

    // Calculate totals
    const totals = filteredStats.reduce(
      (acc, stat) => {
        acc.points += stat.points || 0;
        acc.field_goals_made += stat.field_goals_made || 0;
        acc.field_goals_attempted += stat.field_goals_attempted || 0;
        acc.three_pointers_made += stat.three_pointers_made || 0;
        acc.three_pointers_attempted += stat.three_pointers_attempted || 0;
        acc.free_throws_made += stat.free_throws_made || 0;
        acc.free_throws_attempted += stat.free_throws_attempted || 0;
        acc.rebounds_offensive += stat.rebounds_offensive || 0;
        acc.rebounds_defensive += stat.rebounds_defensive || 0;
        acc.assists += stat.assists || 0;
        acc.steals += stat.steals || 0;
        acc.blocks += stat.blocks || 0;
        acc.turnovers += stat.turnovers || 0;
        acc.fouls_personal += stat.fouls_personal || 0;
        acc.minutes_played += stat.minutes_played || 0;
        return acc;
      },
      {
        points: 0,
        field_goals_made: 0,
        field_goals_attempted: 0,
        three_pointers_made: 0,
        three_pointers_attempted: 0,
        free_throws_made: 0,
        free_throws_attempted: 0,
        rebounds_offensive: 0,
        rebounds_defensive: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        fouls_personal: 0,
        minutes_played: 0,
      }
    );

    const games = filteredStats.length;
    const totalRebounds = totals.rebounds_offensive + totals.rebounds_defensive;

    // Calculate averages and percentages
    const averages = {
      points: games > 0 ? (totals.points / games).toFixed(1) : "0.0",
      rebounds: games > 0 ? (totalRebounds / games).toFixed(1) : "0.0",
      assists: games > 0 ? (totals.assists / games).toFixed(1) : "0.0",
      fg_percentage:
        totals.field_goals_attempted > 0
          ? (
              (totals.field_goals_made / totals.field_goals_attempted) *
              100
            ).toFixed(1)
          : "0.0",
      three_percentage:
        totals.three_pointers_attempted > 0
          ? (
              (totals.three_pointers_made / totals.three_pointers_attempted) *
              100
            ).toFixed(1)
          : "0.0",
      ft_percentage:
        totals.free_throws_attempted > 0
          ? (
              (totals.free_throws_made / totals.free_throws_attempted) *
              100
            ).toFixed(1)
          : "0.0",
    };

    return { totals, averages, games };
  };

  const getStatCategories = (): StatCategory[] => {
    const stats = calculateAggregatedStats();
    if (!stats) return [];

    const { totals, averages, games } = stats;

    return [
      {
        title: "Scoring",
        stats: [
          { label: "PPG", value: averages.points, highlight: true },
          { label: "Total Points", value: totals.points },
          { label: "FG%", value: `${averages.fg_percentage}%` },
          {
            label: "FGM/FGA",
            value: `${totals.field_goals_made}/${totals.field_goals_attempted}`,
          },
          { label: "3P%", value: `${averages.three_percentage}%` },
          {
            label: "3PM/3PA",
            value: `${totals.three_pointers_made}/${totals.three_pointers_attempted}`,
          },
          { label: "FT%", value: `${averages.ft_percentage}%` },
          {
            label: "FTM/FTA",
            value: `${totals.free_throws_made}/${totals.free_throws_attempted}`,
          },
        ],
      },
      {
        title: "Rebounds & Assists",
        stats: [
          { label: "RPG", value: averages.rebounds, highlight: true },
          {
            label: "Total Rebounds",
            value: totals.rebounds_offensive + totals.rebounds_defensive,
          },
          { label: "Offensive Rebounds", value: totals.rebounds_offensive },
          { label: "Defensive Rebounds", value: totals.rebounds_defensive },
          { label: "APG", value: averages.assists, highlight: true },
          { label: "Total Assists", value: totals.assists },
        ],
      },
      {
        title: "Defense & Hustle",
        stats: [
          { label: "Steals", value: totals.steals },
          { label: "Blocks", value: totals.blocks },
          { label: "Turnovers", value: totals.turnovers },
          { label: "Personal Fouls", value: totals.fouls_personal },
        ],
      },
      {
        title: "Game Info",
        stats: [
          { label: "Games Played", value: games },
          { label: "Total Minutes", value: Math.round(totals.minutes_played) },
          {
            label: "Avg Minutes",
            value:
              games > 0 ? (totals.minutes_played / games).toFixed(1) : "0.0",
          },
        ],
      },
    ];
  };

  const renderStatCard = (category: StatCategory) => (
    <View key={category.title} className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
      <Text className="text-white text-base font-bold mb-3">{category.title}</Text>
      <View className="flex-row flex-wrap justify-between">
        {category.stats.map((stat, index) => (
          <View key={index} className="w-[48%] items-center mb-3">
            <Text
              className={`text-white text-lg font-bold ${
                stat.highlight ? "text-red-500 text-2xl" : ""
              }`}
            >
              {stat.value}
            </Text>
            <Text className="text-gray-400 text-xs mt-0.5">{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderRecentGames = () => {
    const recentGames = playerStats.slice(-5).reverse(); // Last 5 games, most recent first

    if (!recentGames.length) {
      return (
        <View className="items-center justify-center py-10">
          <Text className="text-gray-400 text-base">No recent games</Text>
        </View>
      );
    }

    return (
      <View className="mt-2">
        <Text className="text-white text-lg font-bold mb-3">Recent Games</Text>
        {recentGames.map((stat, index) => (
          <View key={stat.id} className="bg-gray-800 rounded-lg p-3 mb-2 border border-gray-700">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-400 text-xs">
                {BasketballUtils.formatGameDate(stat.created_at)}
              </Text>
              <Text className="text-white text-xs font-semibold">
                vs{" "}
                {stat.game?.away_team?.name ||
                  stat.game?.home_team?.name ||
                  "Opponent"}
              </Text>
            </View>
            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-white text-base font-bold">{stat.points || 0}</Text>
                <Text className="text-gray-400 text-xs mt-0.5">PTS</Text>
              </View>
              <View className="items-center">
                <Text className="text-white text-base font-bold">
                  {(stat.rebounds_offensive || 0) +
                    (stat.rebounds_defensive || 0)}
                </Text>
                <Text className="text-gray-400 text-xs mt-0.5">REB</Text>
              </View>
              <View className="items-center">
                <Text className="text-white text-base font-bold">{stat.assists || 0}</Text>
                <Text className="text-gray-400 text-xs mt-0.5">AST</Text>
              </View>
              <View className="items-center">
                <Text className="text-white text-base font-bold">
                  {stat.field_goals_attempted > 0
                    ? `${(
                        (stat.field_goals_made / stat.field_goals_attempted) *
                        100
                      ).toFixed(0)}%`
                    : "0%"}
                </Text>
                <Text className="text-gray-400 text-xs mt-0.5">FG%</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-dark-950">
        <Text className="text-white text-base">Loading player stats...</Text>
      </View>
    );
  }

  if (!player) {
    return (
      <View className="flex-1 justify-center items-center bg-dark-950">
        <Text className="text-white text-base">Player not found</Text>
      </View>
    );
  }

  const statCategories = getStatCategories();

  return (
    <View className="flex-1 bg-dark-950">
      <StatusBar style="light" />

      {/* Player Header */}
      <View className="bg-gray-800 p-4 border-b border-gray-700">
        <View className="flex-row items-center mb-4">
          <Text className="text-red-500 text-4xl font-bold mr-4">#{player.jersey_number}</Text>
          <View className="flex-1">
            <Text className="text-white text-xl font-bold">{player.name}</Text>
            <Text className="text-gray-400 text-sm mt-0.5">
              {player.position} • {player.height}" • {player.weight}lbs
            </Text>
            <Text className="text-green-400 text-sm font-semibold mt-1">{player.team?.name}</Text>
          </View>
        </View>

        {/* Period Selector */}
        <View className="flex-row bg-dark-950 rounded-lg p-1">
          <TouchableOpacity
            className={`flex-1 py-2 px-4 rounded-md items-center ${
              selectedPeriod === "season" ? "bg-red-500" : ""
            }`}
            onPress={() => setSelectedPeriod("season")}
          >
            <Text
              className={`text-sm font-semibold ${
                selectedPeriod === "season" ? "text-white" : "text-gray-400"
              }`}
            >
              Season
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-2 px-4 rounded-md items-center ${
              selectedPeriod === "recent" ? "bg-red-500" : "
            }`}
            onPress={() => setSelectedPeriod("recent")}
          >
            <Text
              className={`text-sm font-semibold ${
                selectedPeriod === "recent" ? "text-white" : "text-gray-400"
              }`}
            >
              Recent
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 p-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        {statCategories.map(category => renderStatCard(category))}

        {/* Recent Games */}
        {renderRecentGames()}
      </ScrollView>
    </View>
  );
}

