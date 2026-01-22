import React from "react";
import { View, Text, ScrollView, useWindowDimensions } from "react-native";
import type { Id } from "../../../../../convex/_generated/dataModel";

interface PlayerStat {
  id: string;
  playerId: Id<"players">;
  player: {
    id: Id<"players">;
    name: string;
    number: number;
    position?: string;
  } | null;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fouledOut?: boolean;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  minutesPlayed: number;
  plusMinus: number;
  isOnCourt: boolean;
}

interface TeamBoxScoreProps {
  teamName: string;
  players: PlayerStat[];
  foulLimit: number;
  isHomeTeam?: boolean;
}

/**
 * Compact box score table for a single team.
 * Responsive - wider columns in landscape mode.
 * Uses NativeWind for theming (light/dark mode support).
 */
export function TeamBoxScore({
  teamName,
  players,
  foulLimit,
  isHomeTeam = false,
}: TeamBoxScoreProps) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Sort players: on-court first, then by points
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.isOnCourt && !b.isOnCourt) return -1;
    if (!a.isOnCourt && b.isOnCourt) return 1;
    return b.points - a.points;
  });

  // Calculate team totals
  const totals = players.reduce(
    (acc, p) => ({
      points: acc.points + p.points,
      rebounds: acc.rebounds + p.rebounds,
      assists: acc.assists + p.assists,
      steals: acc.steals + p.steals,
      blocks: acc.blocks + p.blocks,
      turnovers: acc.turnovers + p.turnovers,
      fouls: acc.fouls + p.fouls,
      fgm: acc.fgm + (p.fieldGoalsMade || 0),
      fga: acc.fga + (p.fieldGoalsAttempted || 0),
      tpm: acc.tpm + (p.threePointersMade || 0),
      tpa: acc.tpa + (p.threePointersAttempted || 0),
      ftm: acc.ftm + (p.freeThrowsMade || 0),
      fta: acc.fta + (p.freeThrowsAttempted || 0),
      plusMinus: acc.plusMinus + (p.plusMinus || 0),
    }),
    {
      points: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      fouls: 0,
      fgm: 0,
      fga: 0,
      tpm: 0,
      tpa: 0,
      ftm: 0,
      fta: 0,
      plusMinus: 0,
    }
  );

  const formatPlusMinus = (value: number) => {
    if (value > 0) return `+${value}`;
    if (value < 0) return `${value}`;
    return "0";
  };

  const getPlusMinusClass = (value: number) => {
    if (value > 0) return "text-green-500";
    if (value < 0) return "text-red-500";
    return "text-surface-500 dark:text-surface-400";
  };

  const getFoulClass = (fouls: number) => {
    if (fouls >= foulLimit) return "text-red-600 font-bold";
    if (fouls >= foulLimit - 1) return "text-yellow-500";
    return "text-surface-700 dark:text-surface-300";
  };

  // Dynamic column widths based on orientation
  const cols = {
    player: isLandscape ? 150 : 112,
    pts: isLandscape ? 44 : 36,
    stat: isLandscape ? 38 : 32,
    shooting: isLandscape ? 54 : 48,
    plusMinus: isLandscape ? 46 : 40,
  };

  // Calculate total table width
  const tableWidth = cols.player + cols.pts + cols.stat * 6 + cols.shooting * 3 + cols.plusMinus;

  return (
    <View className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden mb-4">
      {/* Header */}
      <View
        className={`px-3 py-2 ${isHomeTeam ? "bg-primary-50 dark:bg-primary-900/20" : "bg-surface-50 dark:bg-surface-700/50"}`}
      >
        <Text className="font-semibold text-surface-900 dark:text-white text-sm">{teamName}</Text>
      </View>

      {/* Table */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={isLandscape}
        contentContainerStyle={isLandscape ? { minWidth: width - 32 } : undefined}
      >
        <View style={{ width: Math.max(tableWidth, isLandscape ? width - 32 : 0) }}>
          {/* Header Row */}
          <View className="flex-row bg-surface-50 dark:bg-surface-700/50 border-b border-surface-200 dark:border-surface-600">
            <View style={{ width: cols.player }} className="px-2 py-1.5">
              <Text className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">
                Player
              </Text>
            </View>
            <View style={{ width: cols.pts }} className="items-center justify-center py-1.5">
              <Text className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">
                PTS
              </Text>
            </View>
            <View style={{ width: cols.stat }} className="items-center justify-center py-1.5">
              <Text className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">
                REB
              </Text>
            </View>
            <View style={{ width: cols.stat }} className="items-center justify-center py-1.5">
              <Text className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">
                AST
              </Text>
            </View>
            <View style={{ width: cols.stat }} className="items-center justify-center py-1.5">
              <Text className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">
                STL
              </Text>
            </View>
            <View style={{ width: cols.stat }} className="items-center justify-center py-1.5">
              <Text className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">
                BLK
              </Text>
            </View>
            <View style={{ width: cols.stat }} className="items-center justify-center py-1.5">
              <Text className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">
                TO
              </Text>
            </View>
            <View style={{ width: cols.stat }} className="items-center justify-center py-1.5">
              <Text className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">
                PF
              </Text>
            </View>
            <View style={{ width: cols.shooting }} className="items-center justify-center py-1.5">
              <Text className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">
                FG
              </Text>
            </View>
            <View style={{ width: cols.shooting }} className="items-center justify-center py-1.5">
              <Text className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">
                3P
              </Text>
            </View>
            <View style={{ width: cols.shooting }} className="items-center justify-center py-1.5">
              <Text className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">
                FT
              </Text>
            </View>
            <View style={{ width: cols.plusMinus }} className="items-center justify-center py-1.5">
              <Text className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">
                +/-
              </Text>
            </View>
          </View>

          {/* Player Rows */}
          {sortedPlayers.map((player) => (
            <View
              key={player.playerId}
              className={`flex-row border-b border-surface-100 dark:border-surface-700 ${
                player.fouledOut
                  ? "bg-red-50 dark:bg-red-900/10"
                  : player.isOnCourt
                    ? "bg-green-50/50 dark:bg-green-900/10"
                    : ""
              }`}
            >
              <View style={{ width: cols.player }} className="flex-row items-center px-2 py-1.5">
                {player.isOnCourt && !player.fouledOut && (
                  <View className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1" />
                )}
                <Text
                  className={`text-xs font-medium ${player.fouledOut ? "line-through text-surface-400" : "text-surface-900 dark:text-white"}`}
                  numberOfLines={1}
                >
                  #{player.player?.number}
                </Text>
                <Text
                  className="text-xs text-surface-500 dark:text-surface-400 ml-1 flex-1"
                  numberOfLines={1}
                >
                  {isLandscape ? player.player?.name : player.player?.name?.split(" ").pop()}
                </Text>
              </View>
              <View style={{ width: cols.pts }} className="items-center justify-center py-1.5">
                <Text className="text-xs font-semibold text-surface-900 dark:text-white">
                  {player.points}
                </Text>
              </View>
              <View style={{ width: cols.stat }} className="items-center justify-center py-1.5">
                <Text className="text-xs text-surface-700 dark:text-surface-300">
                  {player.rebounds}
                </Text>
              </View>
              <View style={{ width: cols.stat }} className="items-center justify-center py-1.5">
                <Text className="text-xs text-surface-700 dark:text-surface-300">
                  {player.assists}
                </Text>
              </View>
              <View style={{ width: cols.stat }} className="items-center justify-center py-1.5">
                <Text className="text-xs text-surface-700 dark:text-surface-300">
                  {player.steals}
                </Text>
              </View>
              <View style={{ width: cols.stat }} className="items-center justify-center py-1.5">
                <Text className="text-xs text-surface-700 dark:text-surface-300">
                  {player.blocks}
                </Text>
              </View>
              <View style={{ width: cols.stat }} className="items-center justify-center py-1.5">
                <Text className="text-xs text-surface-700 dark:text-surface-300">
                  {player.turnovers}
                </Text>
              </View>
              <View style={{ width: cols.stat }} className="items-center justify-center py-1.5">
                <Text className={`text-xs ${getFoulClass(player.fouls)}`}>{player.fouls}</Text>
              </View>
              <View style={{ width: cols.shooting }} className="items-center justify-center py-1.5">
                <Text className="text-xs text-surface-600 dark:text-surface-400">
                  {player.fieldGoalsMade || 0}/{player.fieldGoalsAttempted || 0}
                </Text>
              </View>
              <View style={{ width: cols.shooting }} className="items-center justify-center py-1.5">
                <Text className="text-xs text-surface-600 dark:text-surface-400">
                  {player.threePointersMade || 0}/{player.threePointersAttempted || 0}
                </Text>
              </View>
              <View style={{ width: cols.shooting }} className="items-center justify-center py-1.5">
                <Text className="text-xs text-surface-600 dark:text-surface-400">
                  {player.freeThrowsMade || 0}/{player.freeThrowsAttempted || 0}
                </Text>
              </View>
              <View
                style={{ width: cols.plusMinus }}
                className="items-center justify-center py-1.5"
              >
                <Text className={`text-xs font-medium ${getPlusMinusClass(player.plusMinus || 0)}`}>
                  {formatPlusMinus(player.plusMinus || 0)}
                </Text>
              </View>
            </View>
          ))}

          {/* Totals Row */}
          <View className="flex-row bg-surface-100 dark:bg-surface-700 border-t-2 border-surface-300 dark:border-surface-600">
            <View style={{ width: cols.player }} className="px-2 py-1.5">
              <Text className="text-xs font-bold text-surface-900 dark:text-white">TOTAL</Text>
            </View>
            <View style={{ width: cols.pts }} className="items-center justify-center py-1.5">
              <Text className="text-xs font-bold text-surface-900 dark:text-white">
                {totals.points}
              </Text>
            </View>
            <View style={{ width: cols.stat }} className="items-center justify-center py-1.5">
              <Text className="text-xs font-semibold text-surface-700 dark:text-surface-300">
                {totals.rebounds}
              </Text>
            </View>
            <View style={{ width: cols.stat }} className="items-center justify-center py-1.5">
              <Text className="text-xs font-semibold text-surface-700 dark:text-surface-300">
                {totals.assists}
              </Text>
            </View>
            <View style={{ width: cols.stat }} className="items-center justify-center py-1.5">
              <Text className="text-xs font-semibold text-surface-700 dark:text-surface-300">
                {totals.steals}
              </Text>
            </View>
            <View style={{ width: cols.stat }} className="items-center justify-center py-1.5">
              <Text className="text-xs font-semibold text-surface-700 dark:text-surface-300">
                {totals.blocks}
              </Text>
            </View>
            <View style={{ width: cols.stat }} className="items-center justify-center py-1.5">
              <Text className="text-xs font-semibold text-surface-700 dark:text-surface-300">
                {totals.turnovers}
              </Text>
            </View>
            <View style={{ width: cols.stat }} className="items-center justify-center py-1.5">
              <Text className="text-xs font-semibold text-surface-700 dark:text-surface-300">
                {totals.fouls}
              </Text>
            </View>
            <View style={{ width: cols.shooting }} className="items-center justify-center py-1.5">
              <Text className="text-xs font-semibold text-surface-600 dark:text-surface-400">
                {totals.fgm}/{totals.fga}
              </Text>
            </View>
            <View style={{ width: cols.shooting }} className="items-center justify-center py-1.5">
              <Text className="text-xs font-semibold text-surface-600 dark:text-surface-400">
                {totals.tpm}/{totals.tpa}
              </Text>
            </View>
            <View style={{ width: cols.shooting }} className="items-center justify-center py-1.5">
              <Text className="text-xs font-semibold text-surface-600 dark:text-surface-400">
                {totals.ftm}/{totals.fta}
              </Text>
            </View>
            <View style={{ width: cols.plusMinus }} className="items-center justify-center py-1.5">
              <Text className={`text-xs font-semibold ${getPlusMinusClass(totals.plusMinus)}`}>
                {formatPlusMinus(totals.plusMinus)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default TeamBoxScore;
