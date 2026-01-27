import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";
import type { RootStackParamList } from "../navigation/AppNavigator";
import type { Id } from "../../../../convex/_generated/dataModel";

type StatisticsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

/** Local interface for leader stats from getDashboard query */
interface LeaderStat {
  id?: string;
  name: string;
  value: number;
  team: string;
}

/** Local interface for standings from getDashboard query */
interface StandingTeam {
  teamId: Id<"teams">;
  teamName: string;
  logoUrl?: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winPercentage: number;
  avgPoints: number;
}

/** Local interface for recent game from getDashboard query */
interface RecentGame {
  id: Id<"games">;
  date?: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  totalPoints: number;
}

const screenWidth = Dimensions.get("window").width;

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

function StatCard({ title, value, subtitle, color = "#EA580C" }: StatCardProps) {
  return (
    <View className="bg-surface-100 dark:bg-surface-800/50 rounded-xl p-4">
      <Text className="text-surface-500 dark:text-surface-400 text-xs uppercase mb-1">{title}</Text>
      <Text className="text-2xl font-bold text-surface-900 dark:text-white">{value}</Text>
      {subtitle && <Text className="text-surface-500 text-xs mt-0.5">{subtitle}</Text>}
    </View>
  );
}

interface LeaderItemProps {
  rank: number;
  playerName: string;
  teamName?: string;
  value: number;
  unit?: string;
  playerId?: string;
  onPress?: (id: string) => void;
}

function LeaderItem({
  rank,
  playerName,
  teamName,
  value,
  unit = "",
  playerId,
  onPress,
}: LeaderItemProps) {
  const handlePress = () => {
    if (playerId && onPress) {
      onPress(playerId);
    }
  };

  const nameContent = (
    <>
      <Text
        className={`text-sm font-semibold ${playerId && onPress ? "text-primary-500" : "text-surface-900 dark:text-white"}`}
      >
        {playerName}
      </Text>
      {teamName && (
        <Text className="text-surface-500 dark:text-surface-400 text-xs">{teamName}</Text>
      )}
    </>
  );

  return (
    <View className="flex-row items-center bg-surface-100 dark:bg-surface-800/50 p-4 rounded-xl mb-2">
      <View
        className={`w-8 h-8 rounded-full justify-center items-center mr-3 ${
          rank === 1
            ? "bg-amber-500"
            : rank === 2
              ? "bg-surface-400"
              : rank === 3
                ? "bg-amber-700"
                : "bg-surface-300 dark:bg-surface-600"
        }`}
      >
        <Text
          className={`text-xs font-bold ${rank <= 3 ? "text-white" : "text-surface-600 dark:text-surface-300"}`}
        >
          {rank}
        </Text>
      </View>
      {playerId && onPress ? (
        <TouchableOpacity className="flex-1" onPress={handlePress} activeOpacity={0.7}>
          {nameContent}
        </TouchableOpacity>
      ) : (
        <View className="flex-1">{nameContent}</View>
      )}
      <Text className="text-primary-500 text-lg font-bold">
        {value.toFixed(1)}
        {unit}
      </Text>
    </View>
  );
}

interface StandingsItemProps {
  rank: number;
  teamName: string;
  teamId?: string;
  logoUrl?: string;
  wins: number;
  losses: number;
  winPercentage: number;
  avgPoints?: number;
  onPress?: (teamId: string, teamName: string) => void;
}

function StandingsItem({
  rank,
  teamName,
  teamId,
  logoUrl,
  wins,
  losses,
  winPercentage,
  avgPoints,
  onPress,
}: StandingsItemProps) {
  const handlePress = () => {
    if (teamId && onPress) {
      onPress(teamId, teamName);
    }
  };

  const teamNameContent = (
    <>
      <Text
        className={`text-sm font-semibold ${teamId && onPress ? "text-primary-500" : "text-surface-900 dark:text-white"}`}
      >
        {teamName}
      </Text>
      {avgPoints !== undefined && avgPoints > 0 && (
        <Text className="text-surface-500 dark:text-surface-400 text-xs">
          {avgPoints.toFixed(1)} PPG
        </Text>
      )}
    </>
  );

  return (
    <View className="flex-row items-center bg-surface-100 dark:bg-surface-800/50 p-4 rounded-xl mb-2">
      <View className="w-8">
        {rank === 1 ? (
          <Icon name="trophy" size={16} color="#EAB308" />
        ) : (
          <Text className="text-surface-600 dark:text-surface-400 font-semibold">{rank}</Text>
        )}
      </View>
      <View className="w-10 h-10 rounded-lg bg-white dark:bg-surface-700 justify-center items-center mr-3">
        {logoUrl ? (
          <Image source={{ uri: logoUrl }} className="w-8 h-8 rounded" resizeMode="contain" />
        ) : (
          <Icon name="basketball" size={20} color="#9CA3AF" />
        )}
      </View>
      {teamId && onPress ? (
        <TouchableOpacity className="flex-1" onPress={handlePress} activeOpacity={0.7}>
          {teamNameContent}
        </TouchableOpacity>
      ) : (
        <View className="flex-1">{teamNameContent}</View>
      )}
      <View className="flex-row items-center mr-3">
        <Text className="text-green-500 font-semibold">{wins}</Text>
        <Text className="text-surface-400 mx-1">-</Text>
        <Text className="text-red-500 font-semibold">{losses}</Text>
      </View>
      <Text className="text-surface-900 dark:text-white font-medium w-12 text-right">
        .{(winPercentage * 10).toFixed(0).padStart(3, "0")}
      </Text>
    </View>
  );
}

export default function StatisticsScreen() {
  const navigation = useNavigation<StatisticsScreenNavigationProp>();
  const { token, selectedLeague } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "leaders" | "standings" | "charts">(
    "overview"
  );
  const [refreshing, setRefreshing] = useState(false);

  // Fetch statistics dashboard from Convex
  const dashboardData = useQuery(
    api.statistics.getDashboard,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const onRefresh = () => {
    setRefreshing(true);
    // Data auto-refreshes with Convex
    setTimeout(() => setRefreshing(false), 500);
  };

  const handlePlayerPress = (playerId: string) => {
    navigation.navigate("PlayerStats", { playerId: playerId as Id<"players"> });
  };

  const handleTeamPress = (teamId: string, teamName: string) => {
    navigation.navigate("TeamDetail", { teamId, teamName });
  };

  if (dashboardData === undefined) {
    return (
      <View className="flex-1 justify-center items-center bg-surface-50 dark:bg-surface-950">
        <Text className="text-surface-600 dark:text-surface-400 mt-4 text-base">
          Loading statistics...
        </Text>
      </View>
    );
  }

  if (!selectedLeague) {
    return (
      <View className="flex-1 justify-center items-center bg-surface-50 dark:bg-surface-950 p-8">
        <View className="w-16 h-16 rounded-2xl bg-primary-500/10 items-center justify-center mb-4">
          <Icon name="basketball" size={32} color="#F97316" />
        </View>
        <Text className="text-surface-900 dark:text-white text-lg font-bold mb-2">
          No League Selected
        </Text>
        <Text className="text-surface-600 dark:text-surface-400 text-sm text-center">
          Please select a league to view statistics.
        </Text>
      </View>
    );
  }

  const leaders = dashboardData?.leaders || {};
  const standings = dashboardData?.standings || [];
  const recentGames = dashboardData?.recentGames || [];
  const leagueInfo = dashboardData?.leagueInfo || {
    totalGames: 0,
    totalTeams: 0,
    totalPlayers: 0,
  };

  return (
    <View className="flex-1 bg-surface-50 dark:bg-surface-950">
      {/* League Info Banner */}
      <View className="bg-primary-500/10 dark:bg-primary-500/20 px-4 py-2 border-b border-primary-500/20">
        <Text className="text-primary-600 dark:text-primary-400 text-sm font-medium text-center">
          {selectedLeague.name} • {selectedLeague.season}
        </Text>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
        <TouchableOpacity
          className={`flex-1 py-4 items-center border-b-2 ${
            activeTab === "overview" ? "border-primary-500" : "border-transparent"
          }`}
          onPress={() => setActiveTab("overview")}
        >
          <Text
            className={`text-base font-medium ${
              activeTab === "overview"
                ? "text-primary-500"
                : "text-surface-600 dark:text-surface-400"
            }`}
          >
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-4 items-center border-b-2 ${
            activeTab === "leaders" ? "border-primary-500" : "border-transparent"
          }`}
          onPress={() => setActiveTab("leaders")}
        >
          <Text
            className={`text-base font-medium ${
              activeTab === "leaders"
                ? "text-primary-500"
                : "text-surface-600 dark:text-surface-400"
            }`}
          >
            Leaders
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-4 items-center border-b-2 ${
            activeTab === "standings" ? "border-primary-500" : "border-transparent"
          }`}
          onPress={() => setActiveTab("standings")}
        >
          <Text
            className={`text-base font-medium ${
              activeTab === "standings"
                ? "text-primary-500"
                : "text-surface-600 dark:text-surface-400"
            }`}
          >
            Standings
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-4 items-center border-b-2 ${
            activeTab === "charts" ? "border-primary-500" : "border-transparent"
          }`}
          onPress={() => setActiveTab("charts")}
        >
          <Text
            className={`text-base font-medium ${
              activeTab === "charts" ? "text-primary-500" : "text-surface-600 dark:text-surface-400"
            }`}
          >
            Charts
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <View className="p-4">
            {/* Analytics & Tools */}
            <View className="mb-6">
              <Text className="text-sm font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-3">
                Analytics & Tools
              </Text>
              <View className="flex-row">
                <TouchableOpacity
                  className="flex-1 bg-surface-100 dark:bg-surface-800/50 rounded-xl p-4 mr-2 flex-row items-center"
                  onPress={() => navigation.navigate("PlayerComparison")}
                >
                  <View className="w-10 h-10 rounded-full bg-primary-500/10 justify-center items-center mr-3">
                    <Icon name="users" size={18} color="#F97316" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-surface-900 dark:text-white text-sm font-semibold">
                      Compare Players
                    </Text>
                    <Text className="text-surface-500 dark:text-surface-400 text-xs">
                      Side by side stats
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={16} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 bg-surface-100 dark:bg-surface-800/50 rounded-xl p-4 flex-row items-center"
                  onPress={() => navigation.navigate("ShotChart")}
                >
                  <View className="w-10 h-10 rounded-full bg-blue-500/10 justify-center items-center mr-3">
                    <Icon name="target" size={18} color="#3B82F6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-surface-900 dark:text-white text-sm font-semibold">
                      Shot Charts
                    </Text>
                    <Text className="text-surface-500 dark:text-surface-400 text-xs">
                      Visual shot maps
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* League Stats Overview */}
            <View className="mb-6">
              <Text className="text-sm font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-3">
                League Overview
              </Text>
              <View className="flex-row flex-wrap justify-between">
                <View className="w-[48%] mb-3">
                  <StatCard
                    title="Total Games"
                    value={leagueInfo.totalGames}
                    subtitle="Completed games"
                    color="#10B981"
                  />
                </View>
                <View className="w-[48%] mb-3">
                  <StatCard
                    title="Total Teams"
                    value={leagueInfo.totalTeams}
                    subtitle="Active teams"
                    color="#3B82F6"
                  />
                </View>
                <View className="w-[48%] mb-3">
                  <StatCard
                    title="Total Players"
                    value={leagueInfo.totalPlayers}
                    subtitle="Registered players"
                    color="#8B5CF6"
                  />
                </View>
                <View className="w-[48%] mb-3">
                  <StatCard
                    title="Average PPG"
                    value={
                      recentGames.length > 0
                        ? (
                            recentGames.reduce(
                              (sum: number, game: RecentGame) => sum + (game.totalPoints || 0),
                              0
                            ) / recentGames.length
                          ).toFixed(1)
                        : "0.0"
                    }
                    subtitle="Points per game"
                    color="#EF4444"
                  />
                </View>
              </View>
            </View>

            {/* Recent Games */}
            {recentGames.length > 0 && (
              <View className="mb-6">
                <Text className="text-sm font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-3">
                  Recent Games
                </Text>
                {recentGames.slice(0, 5).map((game: RecentGame, index: number) => {
                  const homeWon = game.homeScore > game.awayScore;
                  const awayWon = game.awayScore > game.homeScore;
                  return (
                    <View
                      key={game.id || index}
                      className="bg-surface-100 dark:bg-surface-800/50 p-4 rounded-xl mb-2 flex-row items-center"
                    >
                      <View className="flex-1 flex-row items-center">
                        <Text
                          className={`flex-1 text-right ${
                            awayWon
                              ? "font-semibold text-surface-900 dark:text-white"
                              : "text-surface-500 dark:text-surface-400"
                          }`}
                          numberOfLines={1}
                        >
                          {game.awayTeam || "Away"}
                        </Text>
                        <View className="flex-row items-center mx-3">
                          <Text
                            className={`text-lg font-mono ${
                              awayWon
                                ? "font-bold text-surface-900 dark:text-white"
                                : "text-surface-500 dark:text-surface-400"
                            }`}
                          >
                            {game.awayScore}
                          </Text>
                          <Text className="text-surface-300 dark:text-surface-600 mx-1">-</Text>
                          <Text
                            className={`text-lg font-mono ${
                              homeWon
                                ? "font-bold text-surface-900 dark:text-white"
                                : "text-surface-500 dark:text-surface-400"
                            }`}
                          >
                            {game.homeScore}
                          </Text>
                        </View>
                        <Text
                          className={`flex-1 ${
                            homeWon
                              ? "font-semibold text-surface-900 dark:text-white"
                              : "text-surface-500 dark:text-surface-400"
                          }`}
                          numberOfLines={1}
                        >
                          {game.homeTeam || "Home"}
                        </Text>
                      </View>
                      <View className="px-2 py-0.5 rounded bg-surface-200 dark:bg-surface-700 ml-3">
                        <Text className="text-xs font-medium text-surface-600 dark:text-surface-300">
                          Final
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Leaders Tab */}
        {activeTab === "leaders" && (
          <View className="p-4">
            {/* Scoring Leaders */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Icon name="target" size={14} color="#F97316" style={{ marginRight: 8 }} />
                <Text className="text-sm font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                  Scoring Leaders
                </Text>
              </View>
              {(leaders.scoring || []).slice(0, 5).map((leader: LeaderStat, index: number) => (
                <LeaderItem
                  key={index}
                  rank={index + 1}
                  playerName={leader.name || "Unknown"}
                  teamName={leader.team}
                  value={leader.value || 0}
                  unit=" PPG"
                  playerId={leader.id}
                  onPress={handlePlayerPress}
                />
              ))}
              {(!leaders.scoring || leaders.scoring.length === 0) && (
                <Text className="text-surface-600 dark:text-surface-400 text-sm">
                  No scoring data available
                </Text>
              )}
            </View>

            {/* Rebounding Leaders */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Icon name="basketball" size={14} color="#F97316" style={{ marginRight: 8 }} />
                <Text className="text-sm font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                  Rebounding Leaders
                </Text>
              </View>
              {(leaders.rebounding || []).slice(0, 5).map((leader: LeaderStat, index: number) => (
                <LeaderItem
                  key={index}
                  rank={index + 1}
                  playerName={leader.name || "Unknown"}
                  teamName={leader.team}
                  value={leader.value || 0}
                  unit=" RPG"
                  playerId={leader.id}
                  onPress={handlePlayerPress}
                />
              ))}
              {(!leaders.rebounding || leaders.rebounding.length === 0) && (
                <Text className="text-surface-600 dark:text-surface-400 text-sm">
                  No rebounding data available
                </Text>
              )}
            </View>

            {/* Assists Leaders */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Icon name="users" size={14} color="#F97316" style={{ marginRight: 8 }} />
                <Text className="text-sm font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                  Assists Leaders
                </Text>
              </View>
              {(leaders.assists || []).slice(0, 5).map((leader: LeaderStat, index: number) => (
                <LeaderItem
                  key={index}
                  rank={index + 1}
                  playerName={leader.name || "Unknown"}
                  teamName={leader.team}
                  value={leader.value || 0}
                  unit=" APG"
                  playerId={leader.id}
                  onPress={handlePlayerPress}
                />
              ))}
              {(!leaders.assists || leaders.assists.length === 0) && (
                <Text className="text-surface-600 dark:text-surface-400 text-sm">
                  No assists data available
                </Text>
              )}
            </View>

            {/* Shooting Leaders */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Icon name="stats" size={14} color="#F97316" style={{ marginRight: 8 }} />
                <Text className="text-sm font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                  Shooting Leaders
                </Text>
              </View>
              {(leaders.shooting || []).slice(0, 5).map((leader: LeaderStat, index: number) => (
                <LeaderItem
                  key={index}
                  rank={index + 1}
                  playerName={leader.name || "Unknown"}
                  teamName={leader.team}
                  value={leader.value || 0}
                  unit="%"
                  playerId={leader.id}
                  onPress={handlePlayerPress}
                />
              ))}
              {(!leaders.shooting || leaders.shooting.length === 0) && (
                <Text className="text-surface-600 dark:text-surface-400 text-sm">
                  No shooting data available
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Standings Tab */}
        {activeTab === "standings" && (
          <View className="p-4">
            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center">
                  <Icon name="trophy" size={14} color="#F97316" style={{ marginRight: 8 }} />
                  <Text className="text-sm font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    League Standings
                  </Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate("Standings")}>
                  <Text className="text-sm font-medium text-primary-500">Full View</Text>
                </TouchableOpacity>
              </View>
              {standings.slice(0, 5).map((team: StandingTeam, index: number) => (
                <StandingsItem
                  key={team.teamId || index}
                  rank={index + 1}
                  teamName={team.teamName || "Unknown"}
                  teamId={team.teamId}
                  logoUrl={team.logoUrl}
                  wins={team.wins || 0}
                  losses={team.losses || 0}
                  winPercentage={team.winPercentage || 0}
                  avgPoints={team.avgPoints}
                  onPress={handleTeamPress}
                />
              ))}
              {standings.length > 5 && (
                <TouchableOpacity
                  onPress={() => navigation.navigate("Standings")}
                  className="bg-surface-100 dark:bg-surface-700 p-3 rounded-lg mt-2 items-center"
                >
                  <Text className="text-primary-500 font-medium">
                    View all {standings.length} teams
                  </Text>
                </TouchableOpacity>
              )}
              {standings.length === 0 && (
                <Text className="text-surface-600 dark:text-surface-400 text-sm">
                  No standings data available
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Charts Tab */}
        {activeTab === "charts" && (
          <View className="p-4">
            {/* Team Performance Chart */}
            {standings.length > 0 && (
              <View className="mb-6">
                <Text className="text-sm font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-3">
                  Team Performance
                </Text>
                <View className="bg-surface-100 dark:bg-surface-700 rounded-xl p-4 mb-4 items-center">
                  <BarChart
                    data={{
                      labels: standings
                        .slice(0, 6)
                        .map((team: StandingTeam) =>
                          (team.teamName || "").length > 8
                            ? (team.teamName || "").substring(0, 8) + "..."
                            : team.teamName || ""
                        ),
                      datasets: [
                        {
                          data: standings
                            .slice(0, 6)
                            .map((team: StandingTeam) => team.avgPoints || 0),
                        },
                      ],
                    }}
                    width={screenWidth - 64}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix=" pts"
                    chartConfig={{
                      backgroundColor: "#1F2937",
                      backgroundGradientFrom: "#1F2937",
                      backgroundGradientTo: "#374151",
                      decimalPlaces: 1,
                      color: (opacity = 1) => `rgba(234, 88, 12, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
                      style: {
                        borderRadius: 16,
                      },
                      propsForLabels: {
                        fontSize: 10,
                      },
                    }}
                    style={{
                      marginVertical: 8,
                      borderRadius: 16,
                    }}
                    showBarTops={false}
                    fromZero
                  />
                  <Text className="text-surface-600 dark:text-surface-400 text-xs text-center mt-2 font-medium">
                    Average Points Per Game
                  </Text>
                </View>
              </View>
            )}

            {/* Win Distribution Pie Chart */}
            {standings.length > 0 && (
              <View className="mb-6">
                <Text className="text-sm font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-3">
                  Win Distribution
                </Text>
                <View className="bg-surface-100 dark:bg-surface-700 rounded-xl p-4 mb-4 items-center">
                  <PieChart
                    data={standings.slice(0, 5).map((team: StandingTeam, index: number) => ({
                      name:
                        (team.teamName || "").length > 10
                          ? (team.teamName || "").substring(0, 10) + "..."
                          : team.teamName || "",
                      population: team.wins || 1,
                      color: `hsl(${index * 72}, 70%, 50%)`,
                      legendFontColor: "#9CA3AF",
                      legendFontSize: 12,
                    }))}
                    width={screenWidth - 64}
                    height={220}
                    chartConfig={{
                      backgroundColor: "#1F2937",
                      backgroundGradientFrom: "#1F2937",
                      backgroundGradientTo: "#374151",
                      color: (opacity = 1) => `rgba(234, 88, 12, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
                    }}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    style={{
                      marginVertical: 8,
                      borderRadius: 16,
                    }}
                  />
                  <Text className="text-surface-600 dark:text-surface-400 text-xs text-center mt-2 font-medium">
                    Total Wins by Team
                  </Text>
                </View>
              </View>
            )}

            {/* Recent Games Trend */}
            {recentGames.length > 0 && (
              <View className="mb-6">
                <Text className="text-sm font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-3">
                  Scoring Trends
                </Text>
                <View className="bg-surface-100 dark:bg-surface-700 rounded-xl p-4 mb-4 items-center">
                  <LineChart
                    data={{
                      labels: recentGames
                        .slice(-7)
                        .map((_: RecentGame, index: number) => `G${index + 1}`),
                      datasets: [
                        {
                          data: recentGames
                            .slice(-7)
                            .map(
                              (game: RecentGame) => (game.homeScore || 0) + (game.awayScore || 0)
                            ),
                          strokeWidth: 3,
                        },
                      ],
                    }}
                    width={screenWidth - 64}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix=" pts"
                    chartConfig={{
                      backgroundColor: "#1F2937",
                      backgroundGradientFrom: "#1F2937",
                      backgroundGradientTo: "#374151",
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
                      style: {
                        borderRadius: 16,
                      },
                      propsForDots: {
                        r: "4",
                        strokeWidth: "2",
                        stroke: "#3B82F6",
                      },
                      propsForLabels: {
                        fontSize: 10,
                      },
                    }}
                    bezier
                    style={{
                      marginVertical: 8,
                      borderRadius: 16,
                    }}
                  />
                  <Text className="text-surface-600 dark:text-surface-400 text-xs text-center mt-2 font-medium">
                    Recent Games Total Points
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
