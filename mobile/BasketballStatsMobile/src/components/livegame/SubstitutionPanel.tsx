import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import Icon from "../Icon";
import type { Id } from "../../../../../convex/_generated/dataModel";

// Basketball court positions
const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;
type Position = (typeof POSITIONS)[number];

const POSITION_NAMES: Record<Position, string> = {
  PG: "Point Guard",
  SG: "Shooting Guard",
  SF: "Small Forward",
  PF: "Power Forward",
  C: "Center",
};

interface PlayerStat {
  playerId: Id<"players">;
  player: {
    number: number;
    name: string;
    position?: string;
  } | null;
  points: number;
  rebounds: number;
  assists: number;
  fouls: number;
  fouledOut: boolean;
  isOnCourt: boolean;
}

interface SubstitutionPanelProps {
  teamName: string;
  players: PlayerStat[];
  foulLimit: number;
  onSwap: (playerOut: Id<"players">, playerIn: Id<"players">) => void;
  onSubIn?: (playerId: Id<"players">) => void;
  disabled?: boolean;
  isHomeTeam?: boolean;
}

/**
 * Position-based substitution panel for mobile.
 * Shows court formation with 5 positions and bench below.
 * Tap court player → tap bench player to substitute.
 * Tap bench player when slots available → pluss to court.
 */
export const SubstitutionPanel: React.FC<SubstitutionPanelProps> = ({
  teamName,
  players,
  foulLimit,
  onSwap,
  onSubIn,
  disabled = false,
  isHomeTeam = false,
}) => {
  const [selectedCourtPlayer, setSelectedCourtPlayer] = useState<Id<"players"> | null>(null);
  const [selectedBenchPlayer, setSelectedBenchPlayer] = useState<Id<"players"> | null>(null);

  // Separate players by status
  const onCourt = players.filter((p) => p.isOnCourt && !p.fouledOut);
  const onBench = players.filter((p) => !p.isOnCourt && !p.fouledOut);
  const fouledOut = players.filter((p) => p.fouledOut);

  const needsSubs = onCourt.length < 5;
  const emptySlots = 5 - onCourt.length;

  // Assign players to positions
  const positionAssignments = useMemo(() => {
    const assignedPlayerIds = new Set<Id<"players">>();

    return POSITIONS.map((pos) => {
      // Try to find a player with matching position
      const matchingPlayer = onCourt.find(
        (p) => p.player?.position?.toUpperCase() === pos && !assignedPlayerIds.has(p.playerId)
      );

      if (matchingPlayer) {
        assignedPlayerIds.add(matchingPlayer.playerId);
        return matchingPlayer;
      }

      // Otherwise, find the first unassigned player
      const unassignedPlayer = onCourt.find((p) => !assignedPlayerIds.has(p.playerId));
      if (unassignedPlayer) {
        assignedPlayerIds.add(unassignedPlayer.playerId);
        return unassignedPlayer;
      }

      return null;
    });
  }, [onCourt]);

  const handleCourtPlayerPress = (player: PlayerStat | null, positionIndex: number) => {
    if (disabled) return;

    if (!player) {
      // Empty slot - if bench player selected, plus them
      if (selectedBenchPlayer && onSubIn) {
        onSubIn(selectedBenchPlayer);
        setSelectedBenchPlayer(null);
      }
      return;
    }

    // If bench player is selected, swap them
    if (selectedBenchPlayer) {
      onSwap(player.playerId, selectedBenchPlayer);
      setSelectedBenchPlayer(null);
      setSelectedCourtPlayer(null);
      return;
    }

    // Toggle selection
    if (selectedCourtPlayer === player.playerId) {
      setSelectedCourtPlayer(null);
    } else {
      setSelectedCourtPlayer(player.playerId);
    }
  };

  const handleBenchPlayerPress = (player: PlayerStat) => {
    if (disabled) return;

    // If court player is selected, complete the swap
    if (selectedCourtPlayer) {
      onSwap(selectedCourtPlayer, player.playerId);
      setSelectedCourtPlayer(null);
      setSelectedBenchPlayer(null);
      return;
    }

    // If there are empty slots, plus directly to court
    if (needsSubs && onSubIn) {
      onSubIn(player.playerId);
      return;
    }

    // Toggle selection for bench-first flow
    if (selectedBenchPlayer === player.playerId) {
      setSelectedBenchPlayer(null);
    } else {
      setSelectedBenchPlayer(player.playerId);
    }
  };

  const primaryColor = isHomeTeam ? "#f97316" : "#3b82f6";

  const renderPositionSlot = (position: Position, index: number) => {
    const player = positionAssignments[index];
    const isSelected = player && selectedCourtPlayer === player.playerId;
    const isEmpty = !player;
    const needsSub = player && player.fouls >= foulLimit - 1;

    return (
      <TouchableOpacity
        key={position}
        onPress={() => handleCourtPlayerPress(player, index)}
        disabled={disabled}
        className={`
          items-center justify-center rounded-xl p-2 min-w-[60px]
          ${isSelected ? "bg-primary-100 dark:bg-primary-500/20 border-2 border-primary-500" : ""}
          ${needsSub && !isSelected ? "bg-red-50 dark:bg-red-500/10 border-2 border-red-500" : ""}
          ${isEmpty ? "border-2 border-dashed border-surface-300 dark:border-surface-600 bg-surface-100 dark:bg-surface-800/50" : ""}
          ${!isSelected && !needsSub && !isEmpty ? "bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700" : ""}
        `}
        activeOpacity={0.7}
      >
        {/* Position Label */}
        <Text className="text-[10px] font-bold text-surface-500 dark:text-surface-400 mb-1">
          {position}
        </Text>

        {player ? (
          <>
            {/* Jersey Number */}
            <View
              className="w-10 h-10 rounded-full items-center justify-center mb-1"
              style={{ backgroundColor: primaryColor }}
            >
              <Text className="text-white font-bold text-lg">{player.player?.number || "?"}</Text>
            </View>

            {/* Player Name */}
            <Text
              className="text-xs font-medium text-surface-900 dark:text-white text-center"
              numberOfLines={1}
            >
              {player.player?.name?.split(" ").pop() || "Unknown"}
            </Text>

            {/* Fouls */}
            {player.fouls > 0 && (
              <View className="flex-row items-center mt-0.5">
                <Text
                  className={`text-[10px] font-bold ${
                    player.fouls >= foulLimit - 1
                      ? "text-red-500"
                      : player.fouls >= foulLimit - 2
                        ? "text-amber-500"
                        : "text-surface-500"
                  }`}
                >
                  {player.fouls}F
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            <View className="w-10 h-10 rounded-full items-center justify-center mb-1 bg-surface-200 dark:bg-surface-700">
              <Icon name="plus" size={20} color="#9CA3AF" />
            </View>
            <Text className="text-[10px] text-surface-400 dark:text-surface-500">Empty</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  const renderBenchPlayer = (player: PlayerStat) => {
    const isSelected = selectedBenchPlayer === player.playerId;

    return (
      <TouchableOpacity
        key={player.playerId}
        onPress={() => handleBenchPlayerPress(player)}
        disabled={disabled}
        className={`
          flex-row items-center p-2 rounded-lg mr-2 min-w-[100px]
          ${isSelected ? "bg-primary-100 dark:bg-primary-500/20 border-2 border-primary-500" : "bg-surface-100 dark:bg-surface-700/50 border border-surface-200 dark:border-surface-600"}
        `}
        activeOpacity={0.7}
      >
        {/* Jersey Number */}
        <View
          className="w-8 h-8 rounded-full items-center justify-center mr-2"
          style={{ backgroundColor: isSelected ? primaryColor : "#6B7280" }}
        >
          <Text className="text-white font-bold text-sm">{player.player?.number || "?"}</Text>
        </View>

        {/* Player Info */}
        <View className="flex-1">
          <Text className="text-xs font-medium text-surface-900 dark:text-white" numberOfLines={1}>
            {player.player?.name?.split(" ").pop() || "Unknown"}
          </Text>
          <Text className="text-[10px] text-surface-500 dark:text-surface-400">
            {player.points}pts {player.rebounds}reb
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFouledOutPlayer = (player: PlayerStat) => (
    <View
      key={player.playerId}
      className="flex-row items-center p-2 rounded-lg mr-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 opacity-60"
    >
      <View className="w-8 h-8 rounded-full items-center justify-center mr-2 bg-red-500">
        <Text className="text-white font-bold text-sm line-through">
          {player.player?.number || "?"}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-xs font-medium text-surface-500 dark:text-surface-400 line-through">
          {player.player?.name?.split(" ").pop() || "Unknown"}
        </Text>
        <Text className="text-[10px] text-red-500 font-semibold">Fouled Out</Text>
      </View>
    </View>
  );

  return (
    <View className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
      {/* Header */}
      <View
        className="px-3 py-2 border-b border-surface-200 dark:border-surface-700"
        style={{ backgroundColor: primaryColor + "15" }}
      >
        <Text className="font-semibold text-surface-900 dark:text-white text-sm">{teamName}</Text>
      </View>

      {/* Substitution Alert */}
      {needsSubs && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          className="flex-row items-center px-3 py-2 bg-red-50 dark:bg-red-500/10 border-b border-red-200 dark:border-red-500/30"
        >
          <Icon name="alert" size={16} color="#EF4444" />
          <Text className="text-red-600 dark:text-red-400 text-xs font-medium ml-2">
            {emptySlots} empty slot{emptySlots > 1 ? "s" : ""} - tap bench player to plus
          </Text>
        </Animated.View>
      )}

      {/* Selection Hint */}
      {(selectedCourtPlayer || selectedBenchPlayer) && (
        <View className="flex-row items-center px-3 py-1.5 bg-primary-50 dark:bg-primary-500/10 border-b border-primary-200 dark:border-primary-500/30">
          <Icon name="alert" size={14} color="#F97316" />
          <Text className="text-primary-600 dark:text-primary-400 text-xs ml-2">
            {selectedCourtPlayer
              ? "Tap a bench player to substitute"
              : "Tap a court player to swap"}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setSelectedCourtPlayer(null);
              setSelectedBenchPlayer(null);
            }}
            className="ml-auto"
          >
            <Text className="text-primary-500 text-xs font-semibold">Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Court Formation */}
      <View className="p-3">
        <Text className="text-[10px] font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-2">
          On Court ({onCourt.length}/5)
        </Text>
        <View className="flex-row justify-between">
          {POSITIONS.map((pos, idx) => renderPositionSlot(pos, idx))}
        </View>
      </View>

      {/* Bench */}
      <View className="px-3 pb-3">
        <Text className="text-[10px] font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-2">
          Bench ({onBench.length})
        </Text>
        {onBench.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {onBench.map(renderBenchPlayer)}
          </ScrollView>
        ) : (
          <Text className="text-xs text-surface-400 dark:text-surface-500 italic">
            No players on bench
          </Text>
        )}
      </View>

      {/* Fouled Out Section */}
      {fouledOut.length > 0 && (
        <View className="px-3 pb-3 border-t border-surface-200 dark:border-surface-700 pt-2">
          <Text className="text-[10px] font-semibold text-red-500 uppercase tracking-wide mb-2">
            Fouled Out ({fouledOut.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {fouledOut.map(renderFouledOutPlayer)}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default SubstitutionPanel;
