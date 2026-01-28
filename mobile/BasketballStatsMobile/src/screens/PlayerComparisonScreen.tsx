import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from "react-native";
import { useQuery } from "convex/react";
import { BarChart } from "react-native-chart-kit";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";
import { PlayerSelectModal, type PlayerOption } from "../components/PlayerSelectModal";
import { MiniCourt, type ShotMarker } from "../components/court/MiniCourt";

const screenWidth = Dimensions.get("window").width;

// Player colors for up to 4 players
const PLAYER_COLORS = ["#F97316", "#3B82F6", "#10B981", "#8B5CF6"];

interface PlayerStats {
  playerId: Id<"players">;
  playerName: string;
  teamName: string;
  position: string | null | undefined;
  number: number | null | undefined;
  gamesPlayed: number;
  avgPoints: number;
  avgRebounds: number;
  avgAssists: number;
  avgSteals: number;
  avgBlocks: number;
  avgTurnovers: number;
  avgMinutes: number;
  fieldGoalPercentage: number;
  threePointPercentage: number;
  freeThrowPercentage: number;
  totalPoints: number;
  totalRebounds: number;
  totalAssists: number;
}

interface StatRowProps {
  label: string;
  players: PlayerStats[];
  statKey: keyof PlayerStats;
  unit?: string;
  higherIsBetter?: boolean;
}

function StatRow({ label, players, statKey, unit = "", higherIsBetter = true }: StatRowProps) {
  const values = players.map((p) => p[statKey] as number);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const bestValue = higherIsBetter ? maxValue : minValue;

  return (
    <View className="flex-row items-center py-3 border-b border-surface-200 dark:border-surface-700">
      <View className="w-20">
        <Text className="text-xs text-surface-500 dark:text-surface-400">{label}</Text>
      </View>
      {players.map((player) => {
        const value = player[statKey] as number;
        const isBest = values.filter((v) => v === bestValue).length === 1 && value === bestValue;
        return (
          <View key={player.playerId} className="flex-1 items-center">
            <Text
              className={`text-sm font-semibold ${isBest ? "text-green-500" : "text-surface-900 dark:text-white"}`}
            >
              {value}
              {unit}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function PlayerComparisonScreen() {
  const { token, selectedLeague } = useAuth();
  const [selectedPlayers, setSelectedPlayers] = useState<PlayerOption[]>([]);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all players for selection
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

  // Fetch comparison data when at least 2 players are selected
  const comparisonData = useQuery(
    api.statistics.compareMultiplePlayersStats,
    token && selectedLeague && selectedPlayers.length >= 2
      ? {
          token,
          leagueId: selectedLeague.id,
          playerIds: selectedPlayers.map((p) => p.id),
        }
      : "skip"
  );

  // Fetch shot chart data for all selected players
  const player1ShotData = useQuery(
    api.shots.getPlayerShotChart,
    token && selectedLeague && selectedPlayers[0]
      ? { token, leagueId: selectedLeague.id, playerId: selectedPlayers[0].id }
      : "skip"
  );

  const player2ShotData = useQuery(
    api.shots.getPlayerShotChart,
    token && selectedLeague && selectedPlayers[1]
      ? { token, leagueId: selectedLeague.id, playerId: selectedPlayers[1].id }
      : "skip"
  );

  const player3ShotData = useQuery(
    api.shots.getPlayerShotChart,
    token && selectedLeague && selectedPlayers[2]
      ? { token, leagueId: selectedLeague.id, playerId: selectedPlayers[2].id }
      : "skip"
  );

  const player4ShotData = useQuery(
    api.shots.getPlayerShotChart,
    token && selectedLeague && selectedPlayers[3]
      ? { token, leagueId: selectedLeague.id, playerId: selectedPlayers[3].id }
      : "skip"
  );

  // Combine shot data into array matching selected players
  const playerShotDataArray = [player1ShotData, player2ShotData, player3ShotData, player4ShotData];

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleAddPlayer = () => {
    if (selectedPlayers.length < 4) {
      setEditingSlot(selectedPlayers.length);
      setShowPlayerModal(true);
    }
  };

  const handleEditPlayer = (index: number) => {
    setEditingSlot(index);
    setShowPlayerModal(true);
  };

  const handleRemovePlayer = (index: number) => {
    setSelectedPlayers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectPlayer = (player: PlayerOption) => {
    if (editingSlot !== null) {
      setSelectedPlayers((prev) => {
        const newPlayers = [...prev];
        if (editingSlot < prev.length) {
          newPlayers[editingSlot] = player;
        } else {
          newPlayers.push(player);
        }
        return newPlayers;
      });
    }
    setShowPlayerModal(false);
    setEditingSlot(null);
  };

  // Prepare chart data for points comparison
  const getComparisonChartData = () => {
    if (!comparisonData?.players || comparisonData.players.length < 2) return null;

    return {
      labels: comparisonData.players.map((p) => p.playerName.split(" ")[0].substring(0, 6)),
      datasets: [
        {
          data: comparisonData.players.map((p) => p.avgPoints),
        },
      ],
    };
  };

  const chartData = getComparisonChartData();

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

  return (
    <View className="flex-1 bg-surface-50 dark:bg-surface-950">
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Player Selection */}
        <View className="p-4">
          <Text className="text-sm font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-3">
            Select Players (2-4)
          </Text>

          <View className="flex-row flex-wrap gap-2 mb-4">
            {selectedPlayers.map((player, index) => (
              <TouchableOpacity
                key={player.id}
                className="bg-surface-100 dark:bg-surface-800 rounded-xl p-3 flex-row items-center"
                style={{ borderLeftWidth: 4, borderLeftColor: PLAYER_COLORS[index] }}
                onPress={() => handleEditPlayer(index)}
              >
                <View
                  className="w-10 h-10 rounded-full justify-center items-center mr-2"
                  style={{ backgroundColor: PLAYER_COLORS[index] }}
                >
                  <Text className="text-white font-bold text-sm">#{player.number}</Text>
                </View>
                <View className="flex-1 mr-2">
                  <Text
                    className="text-surface-900 dark:text-white font-medium text-sm"
                    numberOfLines={1}
                  >
                    {player.name}
                  </Text>
                  <Text className="text-surface-500 text-xs">{player.team}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemovePlayer(index)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="x" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}

            {selectedPlayers.length < 4 && (
              <TouchableOpacity
                className="bg-surface-100 dark:bg-surface-800 rounded-xl p-3 flex-row items-center justify-center min-w-[120px]"
                onPress={handleAddPlayer}
              >
                <Icon name="plus" size={20} color="#F97316" />
                <Text className="text-primary-500 font-medium ml-2">Add Player</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Comparison Results */}
          {comparisonData?.players && comparisonData.players.length >= 2 ? (
            <View>
              {/* Player Headers */}
              <View className="bg-surface-100 dark:bg-surface-800/50 rounded-xl p-4 mb-4">
                <View className="flex-row">
                  <View className="w-20" />
                  {comparisonData.players.map((player, idx) => (
                    <View key={player.playerId} className="flex-1 items-center">
                      <View
                        className="w-10 h-10 rounded-full justify-center items-center mb-1"
                        style={{ backgroundColor: PLAYER_COLORS[idx] }}
                      >
                        <Text className="text-white font-bold text-xs">#{player.number}</Text>
                      </View>
                      <Text
                        className="text-surface-900 dark:text-white font-medium text-xs text-center"
                        numberOfLines={1}
                      >
                        {player.playerName.split(" ")[0]}
                      </Text>
                      <Text className="text-surface-500 text-xs">{player.gamesPlayed}G</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Points Chart */}
              {chartData && (
                <View className="bg-surface-100 dark:bg-surface-800/50 rounded-xl p-4 mb-4">
                  <Text className="text-sm font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-2">
                    Points Per Game
                  </Text>
                  <View className="items-center">
                    <BarChart
                      data={chartData}
                      width={screenWidth - 48}
                      height={180}
                      yAxisLabel=""
                      yAxisSuffix=""
                      chartConfig={{
                        backgroundColor: "#374151",
                        backgroundGradientFrom: "#374151",
                        backgroundGradientTo: "#374151",
                        decimalPlaces: 1,
                        color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
                        labelColor: () => "#9CA3AF",
                        propsForLabels: {
                          fontSize: 10,
                        },
                        barPercentage: 0.7,
                      }}
                      style={{
                        borderRadius: 8,
                      }}
                      showBarTops={false}
                      fromZero
                    />
                  </View>
                </View>
              )}

              {/* Per Game Averages */}
              <View className="bg-surface-100 dark:bg-surface-800/50 rounded-xl p-4 mb-4">
                <Text className="text-sm font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-3">
                  Per Game Averages
                </Text>

                <StatRow label="Points" players={comparisonData.players} statKey="avgPoints" />
                <StatRow label="Rebounds" players={comparisonData.players} statKey="avgRebounds" />
                <StatRow label="Assists" players={comparisonData.players} statKey="avgAssists" />
                <StatRow label="Steals" players={comparisonData.players} statKey="avgSteals" />
                <StatRow label="Blocks" players={comparisonData.players} statKey="avgBlocks" />
                <StatRow
                  label="Turnovers"
                  players={comparisonData.players}
                  statKey="avgTurnovers"
                  higherIsBetter={false}
                />
                <StatRow label="Minutes" players={comparisonData.players} statKey="avgMinutes" />
              </View>

              {/* Shooting Percentages */}
              <View className="bg-surface-100 dark:bg-surface-800/50 rounded-xl p-4 mb-4">
                <Text className="text-sm font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-3">
                  Shooting Percentages
                </Text>

                <StatRow
                  label="FG%"
                  players={comparisonData.players}
                  statKey="fieldGoalPercentage"
                  unit="%"
                />
                <StatRow
                  label="3P%"
                  players={comparisonData.players}
                  statKey="threePointPercentage"
                  unit="%"
                />
                <StatRow
                  label="FT%"
                  players={comparisonData.players}
                  statKey="freeThrowPercentage"
                  unit="%"
                />
              </View>

              {/* Shot Chart Comparison */}
              <View className="bg-surface-100 dark:bg-surface-800/50 rounded-xl p-4 mb-4">
                <View className="flex-row items-center mb-3">
                  <Icon name="target" size={16} color="#F97316" />
                  <Text className="text-sm font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 ml-2">
                    Shot Charts
                  </Text>
                </View>

                <View className="flex-row flex-wrap justify-between">
                  {selectedPlayers.slice(0, comparisonData.players.length).map((player, idx) => {
                    const shotData = playerShotDataArray[idx];
                    const shots: ShotMarker[] = shotData?.shots
                      ? shotData.shots.map((s) => ({
                          x: s.x,
                          y: s.y,
                          made: s.made,
                          is3pt: s.shotType === "3pt",
                        }))
                      : [];

                    return (
                      <View
                        key={player.id}
                        className="mb-4"
                        style={{
                          width: selectedPlayers.length <= 2 ? "48%" : "48%",
                        }}
                      >
                        <View className="flex-row items-center mb-2">
                          <View
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: PLAYER_COLORS[idx] }}
                          />
                          <Text
                            className="text-surface-900 dark:text-white font-medium text-xs"
                            numberOfLines={1}
                          >
                            {player.name.split(" ")[0]}
                          </Text>
                        </View>

                        {shots.length > 0 ? (
                          <View className="bg-surface-200 dark:bg-surface-700 rounded-lg overflow-hidden">
                            <MiniCourt shots={shots} displayMode="all" showHeatmap={true} />
                            <View className="p-2">
                              <Text className="text-surface-500 text-xs text-center">
                                {shots.length} shots •{" "}
                                {shotData?.stats?.overallPercentage?.toFixed(1) || "0.0"}% FG
                              </Text>
                            </View>
                          </View>
                        ) : (
                          <View className="bg-surface-200 dark:bg-surface-700 rounded-lg p-8 items-center justify-center">
                            <Text className="text-surface-400 text-xs">No shots</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Zone Comparison Summary */}
                {selectedPlayers.length >= 2 &&
                  playerShotDataArray[0]?.stats &&
                  playerShotDataArray[1]?.stats && (
                    <View className="mt-2 pt-4 border-t border-surface-200 dark:border-surface-600">
                      <Text className="text-xs font-semibold text-surface-500 dark:text-surface-400 mb-2">
                        Shooting Breakdown
                      </Text>
                      <View className="flex-row justify-between">
                        <View className="flex-1 items-center">
                          <Text className="text-xs text-surface-400 mb-1">2PT</Text>
                          <View className="flex-row items-baseline">
                            <Text className="font-bold text-sm" style={{ color: PLAYER_COLORS[0] }}>
                              {playerShotDataArray[0]?.stats?.twoPoint?.percentage?.toFixed(0) ||
                                "0"}
                              %
                            </Text>
                            {selectedPlayers.length >= 2 && (
                              <Text
                                className="font-bold text-sm ml-2"
                                style={{ color: PLAYER_COLORS[1] }}
                              >
                                {playerShotDataArray[1]?.stats?.twoPoint?.percentage?.toFixed(0) ||
                                  "0"}
                                %
                              </Text>
                            )}
                          </View>
                        </View>
                        <View className="flex-1 items-center">
                          <Text className="text-xs text-surface-400 mb-1">3PT</Text>
                          <View className="flex-row items-baseline">
                            <Text className="font-bold text-sm" style={{ color: PLAYER_COLORS[0] }}>
                              {playerShotDataArray[0]?.stats?.threePoint?.percentage?.toFixed(0) ||
                                "0"}
                              %
                            </Text>
                            {selectedPlayers.length >= 2 && (
                              <Text
                                className="font-bold text-sm ml-2"
                                style={{ color: PLAYER_COLORS[1] }}
                              >
                                {playerShotDataArray[1]?.stats?.threePoint?.percentage?.toFixed(
                                  0
                                ) || "0"}
                                %
                              </Text>
                            )}
                          </View>
                        </View>
                        <View className="flex-1 items-center">
                          <Text className="text-xs text-surface-400 mb-1">Overall</Text>
                          <View className="flex-row items-baseline">
                            <Text className="font-bold text-sm" style={{ color: PLAYER_COLORS[0] }}>
                              {playerShotDataArray[0]?.stats?.overallPercentage?.toFixed(0) || "0"}%
                            </Text>
                            {selectedPlayers.length >= 2 && (
                              <Text
                                className="font-bold text-sm ml-2"
                                style={{ color: PLAYER_COLORS[1] }}
                              >
                                {playerShotDataArray[1]?.stats?.overallPercentage?.toFixed(0) ||
                                  "0"}
                                %
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
              </View>
            </View>
          ) : selectedPlayers.length >= 2 ? (
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
                Add 2-4 players to see a side-by-side comparison of their statistics with charts and
                detailed breakdowns.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Player Selection Modal */}
      <PlayerSelectModal
        visible={showPlayerModal}
        onClose={() => {
          setShowPlayerModal(false);
          setEditingSlot(null);
        }}
        onSelect={handleSelectPlayer}
        players={playerOptions}
        excludeIds={selectedPlayers.map((p) => p.id)}
        selectedId={
          editingSlot !== null && editingSlot < selectedPlayers.length
            ? selectedPlayers[editingSlot]?.id
            : undefined
        }
        title={
          editingSlot !== null && editingSlot < selectedPlayers.length
            ? "Change Player"
            : "Add Player"
        }
      />
    </View>
  );
}
