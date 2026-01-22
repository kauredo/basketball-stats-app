import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";
import { BarChart } from "react-native-chart-kit";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";
import { PlayerSelectModal, type PlayerOption } from "../components/PlayerSelectModal";

const screenWidth = Dimensions.get("window").width;

interface StatComparisonProps {
  label: string;
  value1: number;
  value2: number;
  unit?: string;
  higherIsBetter?: boolean;
}

function StatComparison({
  label,
  value1,
  value2,
  unit = "",
  higherIsBetter = true,
}: StatComparisonProps) {
  const winner =
    value1 === value2 ? null : higherIsBetter ? (value1 > value2 ? 1 : 2) : value1 < value2 ? 1 : 2;

  return (
    <View className="flex-row items-center py-3 border-b border-surface-200 dark:border-surface-600">
      <View className="flex-1 items-end pr-3">
        <Text
          className={`text-lg font-bold ${winner === 1 ? "text-green-400" : "text-surface-900 dark:text-white"}`}
        >
          {value1}
          {unit}
        </Text>
      </View>
      <View className="w-24 items-center">
        <Text className="text-sm text-surface-600 dark:text-surface-400">{label}</Text>
      </View>
      <View className="flex-1 items-start pl-3">
        <Text
          className={`text-lg font-bold ${winner === 2 ? "text-green-400" : "text-surface-900 dark:text-white"}`}
        >
          {value2}
          {unit}
        </Text>
      </View>
    </View>
  );
}

export default function PlayerComparisonScreen() {
  const { token, selectedLeague } = useAuth();
  const [player1, setPlayer1] = useState<PlayerOption | null>(null);
  const [player2, setPlayer2] = useState<PlayerOption | null>(null);
  const [showPlayer1Modal, setShowPlayer1Modal] = useState(false);
  const [showPlayer2Modal, setShowPlayer2Modal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all players for selection using the efficient players.list query
  const playersData = useQuery(
    api.players.list,
    token && selectedLeague ? { token, leagueId: selectedLeague.id, activeOnly: true } : "skip"
  );

  // Build player options from players data
  const playerOptions: PlayerOption[] = (playersData?.players || []).map((player) => ({
    id: player.id as Id<"players">,
    name: player.name,
    team: player.team?.name || "Unknown",
    number: player.number,
    position: player.position,
  }));

  // Fetch comparison data when both players are selected
  const comparisonData = useQuery(
    api.statistics.comparePlayersStats,
    token && selectedLeague && player1 && player2
      ? { token, leagueId: selectedLeague.id, player1Id: player1.id, player2Id: player2.id }
      : "skip"
  );

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  if (!selectedLeague) {
    return (
      <View className="flex-1 justify-center items-center bg-surface-50 dark:bg-surface-950 p-8">
        <View className="w-16 h-16 rounded-2xl bg-primary-500/10 items-center justify-center mb-4">
          <Icon name="users" size={32} color="#F97316" />
        </View>
        <Text className="text-surface-900 dark:text-white text-lg font-bold mb-2">
          No League Selected
        </Text>
        <Text className="text-surface-600 dark:text-surface-400 text-sm text-center">
          Please select a league to compare players.
        </Text>
      </View>
    );
  }

  // Prepare shooting chart data
  const shootingData = comparisonData
    ? {
        labels: ["FG%", "3P%", "FT%"],
        datasets: [
          {
            data: [
              comparisonData.player1.fieldGoalPercentage,
              comparisonData.player1.threePointPercentage,
              comparisonData.player1.freeThrowPercentage,
            ],
          },
        ],
      }
    : null;

  const shootingData2 = comparisonData
    ? {
        labels: ["FG%", "3P%", "FT%"],
        datasets: [
          {
            data: [
              comparisonData.player2.fieldGoalPercentage,
              comparisonData.player2.threePointPercentage,
              comparisonData.player2.freeThrowPercentage,
            ],
          },
        ],
      }
    : null;

  return (
    <View className="flex-1 bg-surface-50 dark:bg-surface-950">
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Player Selection */}
        <View className="p-4">
          <View className="flex-row items-center justify-between mb-6">
            {/* Player 1 Selector */}
            <TouchableOpacity
              className="flex-1 bg-surface-100 dark:bg-surface-800/50 rounded-xl p-4 border-2 border-orange-500 mr-2"
              onPress={() => setShowPlayer1Modal(true)}
            >
              {player1 ? (
                <View className="items-center">
                  <View className="w-14 h-14 bg-orange-600 rounded-full justify-center items-center mb-2">
                    <Text className="text-surface-900 dark:text-white font-bold text-lg">
                      #{player1.number}
                    </Text>
                  </View>
                  <Text
                    className="text-surface-900 dark:text-white font-medium text-center"
                    numberOfLines={1}
                  >
                    {player1.name}
                  </Text>
                  <Text className="text-surface-600 dark:text-surface-400 text-sm text-center">
                    {player1.team}
                  </Text>
                </View>
              ) : (
                <View className="items-center py-4">
                  <Icon name="user" size={32} color="#9CA3AF" />
                  <Text className="text-surface-600 dark:text-surface-400 mt-2">
                    Select Player 1
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* VS Icon */}
            <View className="w-12 h-12 bg-surface-200 dark:bg-surface-600 rounded-full justify-center items-center mx-2">
              <Text className="text-surface-900 dark:text-white font-bold">VS</Text>
            </View>

            {/* Player 2 Selector */}
            <TouchableOpacity
              className="flex-1 bg-surface-100 dark:bg-surface-800/50 rounded-xl p-4 border-2 border-blue-500 ml-2"
              onPress={() => setShowPlayer2Modal(true)}
            >
              {player2 ? (
                <View className="items-center">
                  <View className="w-14 h-14 bg-blue-600 rounded-full justify-center items-center mb-2">
                    <Text className="text-surface-900 dark:text-white font-bold text-lg">
                      #{player2.number}
                    </Text>
                  </View>
                  <Text
                    className="text-surface-900 dark:text-white font-medium text-center"
                    numberOfLines={1}
                  >
                    {player2.name}
                  </Text>
                  <Text className="text-surface-600 dark:text-surface-400 text-sm text-center">
                    {player2.team}
                  </Text>
                </View>
              ) : (
                <View className="items-center py-4">
                  <Icon name="user" size={32} color="#9CA3AF" />
                  <Text className="text-surface-600 dark:text-surface-400 mt-2">
                    Select Player 2
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Comparison Results */}
          {comparisonData ? (
            <View>
              {/* Player Info Cards */}
              <View className="flex-row mb-4">
                <View className="flex-1 bg-surface-100 dark:bg-surface-800/50 rounded-xl p-4 mr-2 border-l-4 border-orange-500">
                  <Text className="text-orange-500 font-bold text-base">
                    {comparisonData.player1.playerName}
                  </Text>
                  <Text className="text-surface-600 dark:text-surface-400 text-sm">
                    {comparisonData.player1.teamName} • {comparisonData.player1.position || "N/A"}
                  </Text>
                  <Text className="text-surface-500 text-xs mt-1">
                    {comparisonData.player1.gamesPlayed} games played
                  </Text>
                </View>
                <View className="flex-1 bg-surface-100 dark:bg-surface-800/50 rounded-xl p-4 ml-2 border-l-4 border-blue-500">
                  <Text className="text-blue-500 font-bold text-base">
                    {comparisonData.player2.playerName}
                  </Text>
                  <Text className="text-surface-600 dark:text-surface-400 text-sm">
                    {comparisonData.player2.teamName} • {comparisonData.player2.position || "N/A"}
                  </Text>
                  <Text className="text-surface-500 text-xs mt-1">
                    {comparisonData.player2.gamesPlayed} games played
                  </Text>
                </View>
              </View>

              {/* Per Game Averages */}
              <View className="bg-surface-100 dark:bg-surface-800/50 rounded-xl p-4 mb-4">
                <View className="flex-row items-center mb-4">
                  <Icon name="stats" size={16} color="#F97316" />
                  <Text className="text-sm font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 ml-2">
                    Per Game Averages
                  </Text>
                </View>

                <View className="flex-row items-center mb-2 pb-2 border-b border-surface-200 dark:border-surface-600">
                  <View className="flex-1 items-end pr-3">
                    <Text className="text-orange-500 font-medium text-xs">
                      {comparisonData.player1.playerName.split(" ")[0]}
                    </Text>
                  </View>
                  <View className="w-24 items-center">
                    <Text className="text-surface-500 text-xs">STAT</Text>
                  </View>
                  <View className="flex-1 items-start pl-3">
                    <Text className="text-blue-500 font-medium text-xs">
                      {comparisonData.player2.playerName.split(" ")[0]}
                    </Text>
                  </View>
                </View>

                <StatComparison
                  label="Points"
                  value1={comparisonData.player1.avgPoints}
                  value2={comparisonData.player2.avgPoints}
                />
                <StatComparison
                  label="Rebounds"
                  value1={comparisonData.player1.avgRebounds}
                  value2={comparisonData.player2.avgRebounds}
                />
                <StatComparison
                  label="Assists"
                  value1={comparisonData.player1.avgAssists}
                  value2={comparisonData.player2.avgAssists}
                />
                <StatComparison
                  label="Steals"
                  value1={comparisonData.player1.avgSteals}
                  value2={comparisonData.player2.avgSteals}
                />
                <StatComparison
                  label="Blocks"
                  value1={comparisonData.player1.avgBlocks}
                  value2={comparisonData.player2.avgBlocks}
                />
                <StatComparison
                  label="Turnovers"
                  value1={comparisonData.player1.avgTurnovers}
                  value2={comparisonData.player2.avgTurnovers}
                  higherIsBetter={false}
                />
                <StatComparison
                  label="Minutes"
                  value1={comparisonData.player1.avgMinutes}
                  value2={comparisonData.player2.avgMinutes}
                />
              </View>

              {/* Shooting Percentages */}
              <View className="bg-surface-100 dark:bg-surface-800/50 rounded-xl p-4 mb-4">
                <Text className="text-sm font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-4">
                  Shooting Percentages
                </Text>

                <View className="flex-row items-center mb-2 pb-2 border-b border-surface-200 dark:border-surface-600">
                  <View className="flex-1 items-end pr-3">
                    <Text className="text-orange-500 font-medium text-xs">
                      {comparisonData.player1.playerName.split(" ")[0]}
                    </Text>
                  </View>
                  <View className="w-24 items-center">
                    <Text className="text-surface-500 text-xs">STAT</Text>
                  </View>
                  <View className="flex-1 items-start pl-3">
                    <Text className="text-blue-500 font-medium text-xs">
                      {comparisonData.player2.playerName.split(" ")[0]}
                    </Text>
                  </View>
                </View>

                <StatComparison
                  label="FG%"
                  value1={comparisonData.player1.fieldGoalPercentage}
                  value2={comparisonData.player2.fieldGoalPercentage}
                  unit="%"
                />
                <StatComparison
                  label="3P%"
                  value1={comparisonData.player1.threePointPercentage}
                  value2={comparisonData.player2.threePointPercentage}
                  unit="%"
                />
                <StatComparison
                  label="FT%"
                  value1={comparisonData.player1.freeThrowPercentage}
                  value2={comparisonData.player2.freeThrowPercentage}
                  unit="%"
                />
              </View>

              {/* Shooting Chart */}
              {shootingData && shootingData2 && (
                <View className="bg-surface-100 dark:bg-surface-800/50 rounded-xl p-4">
                  <Text className="text-sm font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-4">
                    Shooting Chart
                  </Text>

                  <View className="flex-row">
                    <View className="flex-1 items-center">
                      <Text className="text-orange-500 font-medium mb-2">
                        {comparisonData.player1.playerName.split(" ")[0]}
                      </Text>
                      <BarChart
                        data={shootingData}
                        width={(screenWidth - 64) / 2}
                        height={150}
                        yAxisLabel=""
                        yAxisSuffix="%"
                        chartConfig={{
                          backgroundColor: "#374151",
                          backgroundGradientFrom: "#374151",
                          backgroundGradientTo: "#374151",
                          decimalPlaces: 0,
                          color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
                          labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
                          propsForLabels: {
                            fontSize: 10,
                          },
                        }}
                        style={{
                          borderRadius: 8,
                        }}
                        showBarTops={false}
                        fromZero
                      />
                    </View>
                    <View className="flex-1 items-center">
                      <Text className="text-blue-500 font-medium mb-2">
                        {comparisonData.player2.playerName.split(" ")[0]}
                      </Text>
                      <BarChart
                        data={shootingData2}
                        width={(screenWidth - 64) / 2}
                        height={150}
                        yAxisLabel=""
                        yAxisSuffix="%"
                        chartConfig={{
                          backgroundColor: "#374151",
                          backgroundGradientFrom: "#374151",
                          backgroundGradientTo: "#374151",
                          decimalPlaces: 0,
                          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                          labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
                          propsForLabels: {
                            fontSize: 10,
                          },
                        }}
                        style={{
                          borderRadius: 8,
                        }}
                        showBarTops={false}
                        fromZero
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>
          ) : player1 && player2 ? (
            <View className="flex-1 justify-center items-center py-12">
              <View className="animate-spin">
                <Icon name="basketball" size={32} color="#F97316" />
              </View>
              <Text className="text-surface-600 dark:text-surface-400 mt-4">
                Loading comparison...
              </Text>
            </View>
          ) : (
            <View className="bg-surface-100 dark:bg-surface-800/50 rounded-xl p-8 items-center">
              <View className="w-16 h-16 rounded-2xl bg-primary-500/10 items-center justify-center mb-4">
                <Icon name="users" size={32} color="#F97316" />
              </View>
              <Text className="text-surface-900 dark:text-white text-lg font-bold mb-2">
                Select Players to Compare
              </Text>
              <Text className="text-surface-600 dark:text-surface-400 text-sm text-center">
                Tap on the player cards above to select two players and see a side-by-side
                comparison of their statistics.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Player Selection Modals */}
      <PlayerSelectModal
        visible={showPlayer1Modal}
        onClose={() => setShowPlayer1Modal(false)}
        onSelect={setPlayer1}
        players={playerOptions}
        excludeIds={player2 ? [player2.id] : []}
        selectedId={player1?.id}
        title="Select Player 1"
      />
      <PlayerSelectModal
        visible={showPlayer2Modal}
        onClose={() => setShowPlayer2Modal(false)}
        onSelect={setPlayer2}
        players={playerOptions}
        excludeIds={player1 ? [player1.id] : []}
        selectedId={player2?.id}
        title="Select Player 2"
      />
    </View>
  );
}
