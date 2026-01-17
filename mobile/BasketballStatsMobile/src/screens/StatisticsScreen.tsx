import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from "react-native";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";

const screenWidth = Dimensions.get("window").width;

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

function StatCard({ title, value, subtitle, color = "#EA580C" }: StatCardProps) {
  return (
    <View className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 flex-row items-center w-[48%] border border-gray-200 dark:border-gray-600">
      <View
        className="w-10 h-10 rounded-full justify-center items-center mr-3"
        style={{ backgroundColor: color }}
      >
        <Icon name="stats" size={16} color="#FFFFFF" />
      </View>
      <View className="flex-1">
        <Text className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-0.5">{title}</Text>
        <Text className="text-gray-900 dark:text-white text-xl font-bold mb-0.5">{value}</Text>
        {subtitle && <Text className="text-gray-500 text-xs">{subtitle}</Text>}
      </View>
    </View>
  );
}

interface LeaderItemProps {
  rank: number;
  playerName: string;
  value: number;
  unit?: string;
}

function LeaderItem({ rank, playerName, value, unit = "" }: LeaderItemProps) {
  return (
    <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mb-2">
      <View className="w-6 h-6 rounded-full bg-primary-500 justify-center items-center mr-3">
        <Text className="text-white text-xs font-bold">{rank}</Text>
      </View>
      <View className="flex-1 flex-row justify-between items-center">
        <Text className="text-gray-900 dark:text-white text-sm font-medium">{playerName}</Text>
        <Text className="text-gray-600 dark:text-gray-400 text-sm">
          {value.toFixed(1)}
          {unit}
        </Text>
      </View>
    </View>
  );
}

interface StandingsItemProps {
  rank: number;
  teamName: string;
  wins: number;
  losses: number;
  winPercentage: number;
  avgPoints?: number;
}

function StandingsItem({
  rank,
  teamName,
  wins,
  losses,
  winPercentage,
  avgPoints,
}: StandingsItemProps) {
  return (
    <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mb-2">
      <View className="w-6 h-6 rounded-full bg-gray-500 justify-center items-center mr-3">
        <Text className="text-white text-xs font-bold">{rank}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-gray-900 dark:text-white text-sm font-medium">{teamName}</Text>
      </View>
      <View className="items-end">
        <Text className="text-gray-900 dark:text-white text-sm font-medium">
          {wins}-{losses}
        </Text>
        <Text className="text-gray-600 dark:text-gray-400 text-xs">
          {winPercentage.toFixed(1)}%
        </Text>
        {avgPoints !== undefined && (
          <Text className="text-gray-600 dark:text-gray-400 text-xs">
            {avgPoints.toFixed(1)} PPG
          </Text>
        )}
      </View>
    </View>
  );
}

export default function StatisticsScreen() {
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

  if (dashboardData === undefined) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-gray-800">
        <Text className="text-gray-600 dark:text-gray-400 mt-4 text-base">
          Loading statistics...
        </Text>
      </View>
    );
  }

  if (!selectedLeague) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-gray-800 p-8">
        <Icon name="basketball" size={64} color="#6B7280" className="mb-4" />
        <Text className="text-gray-900 dark:text-white text-2xl font-bold mb-2">
          No League Selected
        </Text>
        <Text className="text-gray-600 dark:text-gray-400 text-base text-center">
          Please select a league to view statistics.
        </Text>
      </View>
    );
  }

  const leaders = dashboardData?.leaders || {};
  const standings = dashboardData?.standings || [];
  const recentGames = dashboardData?.recentGames || [];

  return (
    <View className="flex-1 bg-white dark:bg-gray-800">
      {/* Header */}
      <View className="bg-gray-100 dark:bg-gray-700 p-5 pt-15">
        <Text className="text-gray-900 dark:text-white text-2xl font-bold mb-1">
          Statistics Dashboard
        </Text>
        <Text className="text-gray-600 dark:text-gray-400 text-base">
          {selectedLeague.name} • {selectedLeague.season}
        </Text>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        <TouchableOpacity
          className={`flex-1 py-4 items-center border-b-2 ${
            activeTab === "overview" ? "border-primary-500" : "border-transparent"
          }`}
          onPress={() => setActiveTab("overview")}
        >
          <Text
            className={`text-base font-medium ${
              activeTab === "overview" ? "text-primary-500" : "text-gray-600 dark:text-gray-400"
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
              activeTab === "leaders" ? "text-primary-500" : "text-gray-600 dark:text-gray-400"
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
              activeTab === "standings" ? "text-primary-500" : "text-gray-600 dark:text-gray-400"
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
              activeTab === "charts" ? "text-primary-500" : "text-gray-600 dark:text-gray-400"
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
            {/* League Stats Overview */}
            <View className="mb-6">
              <Text className="text-gray-900 dark:text-white text-xl font-bold mb-4">
                League Overview
              </Text>
              <View className="flex-row flex-wrap gap-4">
                <StatCard
                  title="Total Games"
                  value={recentGames.length || 0}
                  subtitle="Completed games"
                  color="#10B981"
                />
                <StatCard
                  title="Total Teams"
                  value={standings.length || 0}
                  subtitle="Active teams"
                  color="#3B82F6"
                />
                <StatCard
                  title="Total Players"
                  value={leaders.scoring?.length || leaders.rebounding?.length || 0}
                  subtitle="Registered players"
                  color="#8B5CF6"
                />
                <StatCard
                  title="Average PPG"
                  value={
                    recentGames.length > 0
                      ? (
                          recentGames.reduce(
                            (sum: number, game: any) =>
                              sum + (game.homeScore || 0) + (game.awayScore || 0),
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

            {/* Recent Games */}
            {recentGames.length > 0 && (
              <View className="mb-6">
                <Text className="text-gray-900 dark:text-white text-xl font-bold mb-4">
                  Recent Games
                </Text>
                {recentGames.slice(0, 5).map((game: any, index: number) => (
                  <View
                    key={game.id || index}
                    className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-2 flex-row justify-between items-center"
                  >
                    <View className="flex-row items-center flex-1">
                      <Text className="text-gray-900 dark:text-white text-sm font-medium">
                        {game.homeTeam?.name || "Home"}
                      </Text>
                      <Text className="text-gray-600 dark:text-gray-400 text-xs mx-2">vs</Text>
                      <Text className="text-gray-900 dark:text-white text-sm font-medium">
                        {game.awayTeam?.name || "Away"}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-gray-900 dark:text-white text-base font-bold">
                        {game.homeScore} - {game.awayScore}
                      </Text>
                      <Text className="text-gray-600 dark:text-gray-400 text-xs">
                        ({(game.homeScore || 0) + (game.awayScore || 0)} pts)
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Leaders Tab */}
        {activeTab === "leaders" && (
          <View className="p-4">
            {/* Scoring Leaders */}
            <View className="mb-6">
              <Text className="text-gray-900 dark:text-white text-xl font-bold mb-4">
                Scoring Leaders
              </Text>
              {(leaders.scoring || []).slice(0, 5).map((leader: any, index: number) => (
                <LeaderItem
                  key={leader.playerId || index}
                  rank={index + 1}
                  playerName={leader.playerName || "Unknown"}
                  value={leader.avgPoints || 0}
                  unit=" PPG"
                />
              ))}
              {(!leaders.scoring || leaders.scoring.length === 0) && (
                <Text className="text-gray-600 dark:text-gray-400 text-sm">
                  No scoring data available
                </Text>
              )}
            </View>

            {/* Rebounding Leaders */}
            <View className="mb-6">
              <Text className="text-gray-900 dark:text-white text-xl font-bold mb-4">
                Rebounding Leaders
              </Text>
              {(leaders.rebounding || []).slice(0, 5).map((leader: any, index: number) => (
                <LeaderItem
                  key={leader.playerId || index}
                  rank={index + 1}
                  playerName={leader.playerName || "Unknown"}
                  value={leader.avgRebounds || 0}
                  unit=" RPG"
                />
              ))}
              {(!leaders.rebounding || leaders.rebounding.length === 0) && (
                <Text className="text-gray-600 dark:text-gray-400 text-sm">
                  No rebounding data available
                </Text>
              )}
            </View>

            {/* Assists Leaders */}
            <View className="mb-6">
              <Text className="text-gray-900 dark:text-white text-xl font-bold mb-4">
                Assists Leaders
              </Text>
              {(leaders.assists || []).slice(0, 5).map((leader: any, index: number) => (
                <LeaderItem
                  key={leader.playerId || index}
                  rank={index + 1}
                  playerName={leader.playerName || "Unknown"}
                  value={leader.avgAssists || 0}
                  unit=" APG"
                />
              ))}
              {(!leaders.assists || leaders.assists.length === 0) && (
                <Text className="text-gray-600 dark:text-gray-400 text-sm">
                  No assists data available
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Standings Tab */}
        {activeTab === "standings" && (
          <View className="p-4">
            <View className="mb-6">
              <Text className="text-gray-900 dark:text-white text-xl font-bold mb-4">
                League Standings
              </Text>
              {standings.slice(0, 10).map((team: any, index: number) => (
                <StandingsItem
                  key={team.teamId || index}
                  rank={index + 1}
                  teamName={team.teamName || "Unknown"}
                  wins={team.wins || 0}
                  losses={team.losses || 0}
                  winPercentage={team.winPercentage || 0}
                  avgPoints={team.avgPoints}
                />
              ))}
              {standings.length === 0 && (
                <Text className="text-gray-600 dark:text-gray-400 text-sm">
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
                <Text className="text-gray-900 dark:text-white text-xl font-bold mb-4">
                  Team Performance
                </Text>
                <View className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 mb-4 items-center">
                  <BarChart
                    data={{
                      labels: standings
                        .slice(0, 6)
                        .map((team: any) =>
                          (team.teamName || "").length > 8
                            ? (team.teamName || "").substring(0, 8) + "..."
                            : team.teamName || ""
                        ),
                      datasets: [
                        {
                          data: standings.slice(0, 6).map((team: any) => team.avgPoints || 0),
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
                  <Text className="text-gray-600 dark:text-gray-400 text-xs text-center mt-2 font-medium">
                    Average Points Per Game
                  </Text>
                </View>
              </View>
            )}

            {/* Win Distribution Pie Chart */}
            {standings.length > 0 && (
              <View className="mb-6">
                <Text className="text-gray-900 dark:text-white text-xl font-bold mb-4">
                  Win Distribution
                </Text>
                <View className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 mb-4 items-center">
                  <PieChart
                    data={standings.slice(0, 5).map((team: any, index: number) => ({
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
                  <Text className="text-gray-600 dark:text-gray-400 text-xs text-center mt-2 font-medium">
                    Total Wins by Team
                  </Text>
                </View>
              </View>
            )}

            {/* Recent Games Trend */}
            {recentGames.length > 0 && (
              <View className="mb-6">
                <Text className="text-gray-900 dark:text-white text-xl font-bold mb-4">
                  Scoring Trends
                </Text>
                <View className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 mb-4 items-center">
                  <LineChart
                    data={{
                      labels: recentGames.slice(-7).map((_: any, index: number) => `G${index + 1}`),
                      datasets: [
                        {
                          data: recentGames
                            .slice(-7)
                            .map((game: any) => (game.homeScore || 0) + (game.awayScore || 0)),
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
                  <Text className="text-gray-600 dark:text-gray-400 text-xs text-center mt-2 font-medium">
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
