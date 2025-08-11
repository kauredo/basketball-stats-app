import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import { basketballAPI } from "@basketball-stats/shared";
import { useAuthStore } from "../hooks/useAuthStore";
import Icon from "../components/Icon";

const screenWidth = Dimensions.get("window").width;

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

function StatCard({
  title,
  value,
  subtitle,
  color = "#EA580C",
}: StatCardProps) {
  return (
    <View className="bg-gray-700 rounded-xl p-4 flex-row items-center w-[48%] border border-gray-600">
      <View
        className="w-10 h-10 rounded-full justify-center items-center mr-3"
        style={{ backgroundColor: color }}
      >
        <Icon name="stats" size={16} color="#FFFFFF" />
      </View>
      <View className="flex-1">
        <Text className="text-gray-400 text-xs font-medium mb-0.5">
          {title}
        </Text>
        <Text className="text-white text-xl font-bold mb-0.5">{value}</Text>
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
    <View className="flex-row items-center bg-gray-700 p-3 rounded-lg mb-2">
      <View className="w-6 h-6 rounded-full bg-primary-500 justify-center items-center mr-3">
        <Text className="text-white text-xs font-bold">{rank}</Text>
      </View>
      <View className="flex-1 flex-row justify-between items-center">
        <Text className="text-white text-sm font-medium">{playerName}</Text>
        <Text className="text-gray-400 text-sm">
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
    <View className="flex-row items-center bg-gray-700 p-3 rounded-lg mb-2">
      <View className="w-6 h-6 rounded-full bg-gray-500 justify-center items-center mr-3">
        <Text className="text-white text-xs font-bold">{rank}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-white text-sm font-medium">{teamName}</Text>
      </View>
      <View className="items-end">
        <Text className="text-white text-sm font-medium">
          {wins}-{losses}
        </Text>
        <Text className="text-gray-400 text-xs">
          {winPercentage.toFixed(1)}%
        </Text>
        {avgPoints && (
          <Text className="text-gray-400 text-xs">
            {avgPoints.toFixed(1)} PPG
          </Text>
        )}
      </View>
    </View>
  );
}

export default function StatisticsScreen() {
  const { selectedLeague } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "leaders" | "standings" | "charts"
  >("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (selectedLeague) {
      loadStatistics();
    }
  }, [selectedLeague]);

  const loadStatistics = async () => {
    if (!selectedLeague) return;

    try {
      setLoading(true);
      const dashboard = await basketballAPI.getStatisticsDashboard(
        selectedLeague.id
      );
      setDashboardData(dashboard);
    } catch (error) {
      console.error("Failed to load statistics:", error);
      Alert.alert("Error", "Failed to load statistics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStatistics();
    setRefreshing(false);
  };

  if (loading && !dashboardData) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-800">
        <ActivityIndicator size="large" color="#EA580C" />
        <Text className="text-gray-400 mt-4 text-base">
          Loading statistics...
        </Text>
      </View>
    );
  }

  if (!selectedLeague) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-800 p-8">
        <Icon name="basketball" size={64} color="#6B7280" className="mb-4" />
        <Text className="text-white text-2xl font-bold mb-2">
          No League Selected
        </Text>
        <Text className="text-gray-400 text-base text-center">
          Please select a league to view statistics.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-800">
      {/* Header */}
      <View className="bg-gray-700 p-5 pt-15">
        <Text className="text-white text-2xl font-bold mb-1">
          Statistics Dashboard
        </Text>
        <Text className="text-gray-400 text-base">
          {selectedLeague.name} • {selectedLeague.season}
        </Text>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row bg-gray-700 border-b border-gray-600">
        <TouchableOpacity
          className={`flex-1 py-4 items-center border-b-2 ${
            activeTab === "overview"
              ? "border-primary-500"
              : "border-transparent"
          }`}
          onPress={() => setActiveTab("overview")}
        >
          <Text
            className={`text-base font-medium ${
              activeTab === "overview" ? "text-primary-500" : "text-gray-400"
            }`}
          >
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-4 items-center border-b-2 ${
            activeTab === "leaders"
              ? "border-primary-500"
              : "border-transparent"
          }`}
          onPress={() => setActiveTab("leaders")}
        >
          <Text
            className={`text-base font-medium ${
              activeTab === "leaders" ? "text-primary-500" : "text-gray-400"
            }`}
          >
            Leaders
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-4 items-center border-b-2 ${
            activeTab === "standings"
              ? "border-primary-500"
              : "border-transparent"
          }`}
          onPress={() => setActiveTab("standings")}
        >
          <Text
            className={`text-base font-medium ${
              activeTab === "standings" ? "text-primary-500" : "text-gray-400"
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
              activeTab === "charts" ? "text-primary-500" : "text-gray-400"
            }`}
          >
            Charts
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Overview Tab */}
        {activeTab === "overview" && dashboardData && (
          <View className="p-4">
            {/* League Stats Overview */}
            <View className="mb-6">
              <Text className="text-white text-xl font-bold mb-4">
                League Overview
              </Text>
              <View className="flex-row flex-wrap gap-4">
                <StatCard
                  title="Total Games"
                  value={dashboardData.league_info?.total_games || 0}
                  subtitle="Completed games"
                  color="#10B981"
                />
                <StatCard
                  title="Total Teams"
                  value={dashboardData.league_info?.total_teams || 0}
                  subtitle="Active teams"
                  color="#3B82F6"
                />
                <StatCard
                  title="Total Players"
                  value={dashboardData.league_info?.total_players || 0}
                  subtitle="Registered players"
                  color="#8B5CF6"
                />
                <StatCard
                  title="Average PPG"
                  value={
                    dashboardData.recent_games?.length > 0
                      ? (
                          dashboardData.recent_games.reduce(
                            (sum: number, game: any) => sum + game.total_points,
                            0
                          ) / dashboardData.recent_games.length
                        ).toFixed(1)
                      : "0.0"
                  }
                  subtitle="Points per game"
                  color="#EF4444"
                />
              </View>
            </View>

            {/* Recent Games */}
            {dashboardData.recent_games?.length > 0 && (
              <View className="mb-6">
                <Text className="text-white text-xl font-bold mb-4">
                  Recent Games
                </Text>
                {dashboardData.recent_games
                  .slice(0, 5)
                  .map((game: any, index: number) => (
                    <View
                      key={game.id}
                      className="bg-gray-700 p-4 rounded-lg mb-2 flex-row justify-between items-center"
                    >
                      <View className="flex-row items-center flex-1">
                        <Text className="text-white text-sm font-medium">
                          {game.home_team}
                        </Text>
                        <Text className="text-gray-400 text-xs mx-2">vs</Text>
                        <Text className="text-white text-sm font-medium">
                          {game.away_team}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-white text-base font-bold">
                          {game.home_score} - {game.away_score}
                        </Text>
                        <Text className="text-gray-400 text-xs">
                          ({game.total_points} pts)
                        </Text>
                      </View>
                    </View>
                  ))}
              </View>
            )}
          </View>
        )}

        {/* Leaders Tab */}
        {activeTab === "leaders" && dashboardData && (
          <View className="p-4">
            {/* Scoring Leaders */}
            <View className="mb-6">
              <Text className="text-white text-xl font-bold mb-4">
                Scoring Leaders
              </Text>
              {Object.entries(dashboardData.leaders?.scoring || {})
                .slice(0, 5)
                .map(([player, points], index) => (
                  <LeaderItem
                    key={player}
                    rank={index + 1}
                    playerName={player}
                    value={points as number}
                    unit=" PPG"
                  />
                ))}
            </View>

            {/* Rebounding Leaders */}
            <View className="mb-6">
              <Text className="text-white text-xl font-bold mb-4">
                Rebounding Leaders
              </Text>
              {Object.entries(dashboardData.leaders?.rebounding || {})
                .slice(0, 5)
                .map(([player, rebounds], index) => (
                  <LeaderItem
                    key={player}
                    rank={index + 1}
                    playerName={player}
                    value={rebounds as number}
                    unit=" RPG"
                  />
                ))}
            </View>

            {/* Assists Leaders */}
            <View className="mb-6">
              <Text className="text-white text-xl font-bold mb-4">
                Assists Leaders
              </Text>
              {Object.entries(dashboardData.leaders?.assists || {})
                .slice(0, 5)
                .map(([player, assists], index) => (
                  <LeaderItem
                    key={player}
                    rank={index + 1}
                    playerName={player}
                    value={assists as number}
                    unit=" APG"
                  />
                ))}
            </View>

            {/* Shooting Leaders */}
            <View className="mb-6">
              <Text className="text-white text-xl font-bold mb-4">
                Shooting Leaders (FG%)
              </Text>
              {Object.entries(dashboardData.leaders?.shooting || {})
                .slice(0, 5)
                .map(([player, percentage], index) => (
                  <LeaderItem
                    key={player}
                    rank={index + 1}
                    playerName={player}
                    value={percentage as number}
                    unit="%"
                  />
                ))}
            </View>
          </View>
        )}

        {/* Standings Tab */}
        {activeTab === "standings" && dashboardData && (
          <View className="p-4">
            <View className="mb-6">
              <Text className="text-white text-xl font-bold mb-4">
                League Standings
              </Text>
              {dashboardData.standings
                ?.slice(0, 10)
                .map((team: any, index: number) => (
                  <StandingsItem
                    key={team.team_id}
                    rank={index + 1}
                    teamName={team.team_name}
                    wins={team.wins}
                    losses={team.losses}
                    winPercentage={team.win_percentage}
                    avgPoints={team.avg_points}
                  />
                ))}
            </View>
          </View>
        )}

        {/* Charts Tab */}
        {activeTab === "charts" && dashboardData && (
          <View className="p-4">
            {/* Team Performance Chart */}
            {dashboardData.standings?.length > 0 && (
              <View className="mb-6">
                <Text className="text-white text-xl font-bold mb-4">
                  Team Performance
                </Text>
                <View className="bg-gray-700 rounded-xl p-4 mb-4 items-center">
                  <BarChart
                    data={{
                      labels: dashboardData.standings
                        .slice(0, 6)
                        .map((team: any) =>
                          team.team_name.length > 8
                            ? team.team_name.substring(0, 8) + "..."
                            : team.team_name
                        ),
                      datasets: [
                        {
                          data: dashboardData.standings
                            .slice(0, 6)
                            .map((team: any) => team.avg_points || 0),
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
                      labelColor: (opacity = 1) =>
                        `rgba(156, 163, 175, ${opacity})`,
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
                  <Text className="text-gray-400 text-xs text-center mt-2 font-medium">
                    Average Points Per Game
                  </Text>
                </View>
              </View>
            )}

            {/* Win Distribution Pie Chart */}
            {dashboardData.standings?.length > 0 && (
              <View className="mb-6">
                <Text className="text-white text-xl font-bold mb-4">
                  Win Distribution
                </Text>
                <View className="bg-gray-700 rounded-xl p-4 mb-4 items-center">
                  <PieChart
                    data={dashboardData.standings
                      .slice(0, 5)
                      .map((team: any, index: number) => ({
                        name:
                          team.team_name.length > 10
                            ? team.team_name.substring(0, 10) + "..."
                            : team.team_name,
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
                      labelColor: (opacity = 1) =>
                        `rgba(156, 163, 175, ${opacity})`,
                    }}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    style={{
                      marginVertical: 8,
                      borderRadius: 16,
                    }}
                  />
                  <Text className="text-gray-400 text-xs text-center mt-2 font-medium">
                    Total Wins by Team
                  </Text>
                </View>
              </View>
            )}

            {/* Scoring Leaders Chart */}
            {dashboardData.leaders?.scoring &&
              Object.keys(dashboardData.leaders.scoring).length > 0 && (
                <View className="mb-6">
                  <Text className="text-white text-xl font-bold mb-4">
                    Top Scorers
                  </Text>
                  <View className="bg-gray-700 rounded-xl p-4 mb-4 items-center">
                    <BarChart
                      data={{
                        labels: Object.keys(dashboardData.leaders.scoring)
                          .slice(0, 5)
                          .map((name: string) =>
                            name.length > 8
                              ? name.substring(0, 8) + "..."
                              : name
                          ),
                        datasets: [
                          {
                            data: Object.values(dashboardData.leaders.scoring)
                              .slice(0, 5)
                              .map((value: any) => Number(value)),
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
                        color: (opacity = 1) =>
                          `rgba(16, 185, 129, ${opacity})`,
                        labelColor: (opacity = 1) =>
                          `rgba(156, 163, 175, ${opacity})`,
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
                    <Text className="text-gray-400 text-xs text-center mt-2 font-medium">
                      Points Per Game
                    </Text>
                  </View>
                </View>
              )}

            {/* Recent Games Trend */}
            {dashboardData.recent_games?.length > 0 && (
              <View className="mb-6">
                <Text className="text-white text-xl font-bold mb-4">
                  Scoring Trends
                </Text>
                <View className="bg-gray-700 rounded-xl p-4 mb-4 items-center">
                  <LineChart
                    data={{
                      labels: dashboardData.recent_games
                        .slice(-7)
                        .map((_: any, index: number) => `G${index + 1}`),
                      datasets: [
                        {
                          data: dashboardData.recent_games
                            .slice(-7)
                            .map((game: any) => game.total_points || 0),
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
                      labelColor: (opacity = 1) =>
                        `rgba(156, 163, 175, ${opacity})`,
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
                  <Text className="text-gray-400 text-xs text-center mt-2 font-medium">
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
