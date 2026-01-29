import React, { useState, useMemo } from "react";
import { View, Text } from "react-native";
import { Pressable, ScrollView } from "react-native-gesture-handler";
import Icon from "../Icon";
import type { Id } from "../../../../../convex/_generated/dataModel";

// Basketball court positions
const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;
type Position = (typeof POSITIONS)[number];

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

  const handleCourtPlayerPress = (player: PlayerStat | null, _positionIndex: number) => {
    if (disabled) return;

    if (!player) {
      // Empty slot tapped
      if (selectedBenchPlayer && onSubIn) {
        // Bench player selected → add them to this empty slot
        onSubIn(selectedBenchPlayer);
        setSelectedBenchPlayer(null);
      }
      // If no bench player selected, do nothing (they need to select one first)
      return;
    }

    // If bench player is selected, swap them with this court player
    if (selectedBenchPlayer) {
      onSwap(player.playerId, selectedBenchPlayer);
      setSelectedBenchPlayer(null);
      setSelectedCourtPlayer(null);
      return;
    }

    // Toggle court player selection
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

    // Toggle bench player selection (for both swap and add-to-empty-slot flows)
    if (selectedBenchPlayer === player.playerId) {
      setSelectedBenchPlayer(null);
    } else {
      setSelectedBenchPlayer(player.playerId);
    }
  };

  // Home team = blue, Away team = orange (consistent with shot chart markers)
  const primaryColor = isHomeTeam ? "#3b82f6" : "#f97316";

  const renderPositionSlot = (position: Position, index: number) => {
    const player = positionAssignments[index];
    const isSelected = player && selectedCourtPlayer === player.playerId;
    const isEmpty = !player;
    const needsSub = player && player.fouls >= foulLimit - 1;

    return (
      <Pressable
        key={position}
        onPress={() => handleCourtPlayerPress(player, index)}
        disabled={disabled}
        className={`
          flex-1 items-center rounded-xl p-1.5 mx-0.5 overflow-hidden
          ${isSelected ? "bg-primary-100 dark:bg-primary-500/20 border-2 border-primary-500" : ""}
          ${needsSub && !isSelected ? "bg-red-50 dark:bg-red-500/10 border-2 border-red-500" : ""}
          ${isEmpty && selectedBenchPlayer ? "bg-green-50 dark:bg-green-500/10 border-2 border-dashed border-green-400 dark:border-green-500" : ""}
          ${isEmpty && !selectedBenchPlayer ? "bg-amber-50 dark:bg-amber-500/5 border-2 border-dashed border-amber-300 dark:border-amber-500/50" : ""}
          ${!isSelected && !needsSub && !isEmpty ? "bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700" : ""}
        `}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        {/* Position Label */}
        <Text className="text-[10px] font-bold text-surface-500 dark:text-surface-400 mb-1">
          {position}
        </Text>

        {player ? (
          <>
            {/* Jersey Number */}
            <View
              className="w-9 h-9 rounded-full items-center justify-center mb-1"
              style={{ backgroundColor: primaryColor }}
            >
              <Text className="text-white font-bold text-base">{player.player?.number || "?"}</Text>
            </View>

            {/* Player Name - constrained width */}
            <Text
              className="text-[10px] font-medium text-surface-900 dark:text-white text-center w-full px-0.5"
              numberOfLines={1}
              ellipsizeMode="tail"
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
            <View
              className={`w-9 h-9 rounded-full items-center justify-center mb-1 border-2 border-dashed ${
                selectedBenchPlayer
                  ? "bg-green-100 dark:bg-green-500/20 border-green-500"
                  : "bg-amber-100 dark:bg-amber-500/20 border-amber-400 dark:border-amber-500"
              }`}
            >
              <Icon name="plus" size={18} color={selectedBenchPlayer ? "#22C55E" : "#F59E0B"} />
            </View>
            <Text
              className={`text-[10px] font-medium ${
                selectedBenchPlayer
                  ? "text-green-600 dark:text-green-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {selectedBenchPlayer ? "Tap" : "Empty"}
            </Text>
          </>
        )}
      </Pressable>
    );
  };

  // Calculate slot width based on 5 slots fitting in the court row
  // This ensures bench/fouled-out cards match court card widths
  const CARD_WIDTH = 64;

  const renderBenchPlayer = (player: PlayerStat) => {
    const isSelected = selectedBenchPlayer === player.playerId;

    return (
      <Pressable
        key={player.playerId}
        onPress={() => handleBenchPlayerPress(player)}
        disabled={disabled}
        className={`
          max-w-[60px] items-center p-1.5 rounded-xl overflow-hidden
          ${isSelected ? "bg-primary-100 dark:bg-primary-500/20 border-2 border-primary-500" : "bg-surface-100 dark:bg-surface-700/50 border border-surface-200 dark:border-surface-600"}
        `}
        style={({ pressed }) => ({
          flexBasis: CARD_WIDTH,
          maxWidth: CARD_WIDTH,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        {/* Jersey Number */}
        <View
          className="w-9 h-9 rounded-full items-center justify-center mb-1"
          style={{ backgroundColor: isSelected ? primaryColor : "#6B7280" }}
        >
          <Text className="text-white font-bold text-base">{player.player?.number || "?"}</Text>
        </View>

        {/* Player Name */}
        <Text
          className="text-[10px] font-medium text-center w-full text-surface-900 dark:text-white"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {player.player?.name?.split(" ").pop() || "Unknown"}
        </Text>

        {/* Stats */}
        <Text className="text-[9px] text-surface-500 dark:text-surface-400">
          {player.points}p {player.rebounds}r
        </Text>
      </Pressable>
    );
  };

  const renderFouledOutPlayer = (player: PlayerStat) => (
    <View
      key={player.playerId}
      className="items-center p-1.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 opacity-60 overflow-hidden"
      style={{ flexBasis: CARD_WIDTH, maxWidth: CARD_WIDTH }}
    >
      <View className="w-9 h-9 rounded-full items-center justify-center mb-1 bg-red-500">
        <Text className="text-white font-bold text-base line-through">
          {player.player?.number || "?"}
        </Text>
      </View>
      <Text
        className="text-[10px] font-medium text-surface-500 dark:text-surface-400 line-through text-center w-full"
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {player.player?.name?.split(" ").pop() || "Unknown"}
      </Text>
      <Text className="text-[9px] text-red-500 font-semibold">Out</Text>
    </View>
  );

  return (
    <View
      className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700"
      collapsable={false}
    >
      {/* Header */}
      <View
        className="px-3 py-2 border-b border-surface-200 dark:border-surface-700"
        style={{ backgroundColor: primaryColor + "15" }}
      >
        <Text className="font-semibold text-surface-900 dark:text-white text-sm">{teamName}</Text>
      </View>

      {/* Substitution Alert */}
      {needsSubs && !selectedBenchPlayer && (
        <View className="flex-row items-center px-3 py-2 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/30">
          <Icon name="alert" size={16} color="#F59E0B" />
          <Text className="text-amber-700 dark:text-amber-400 text-xs font-medium ml-2 flex-1">
            {emptySlots} empty slot{emptySlots > 1 ? "s" : ""} — select a bench player, then tap the
            empty slot
          </Text>
        </View>
      )}

      {/* Selection Hint */}
      {(selectedCourtPlayer || selectedBenchPlayer) && (
        <View className="flex-row items-center px-3 py-1.5 bg-primary-50 dark:bg-primary-500/10 border-b border-primary-200 dark:border-primary-500/30">
          <Icon name="alert" size={14} color="#F97316" />
          <Text className="text-primary-600 dark:text-primary-400 text-xs ml-2 flex-1">
            {selectedCourtPlayer
              ? "Tap a bench player to substitute"
              : needsSubs
                ? "Tap a court player to swap, or tap empty slot to add"
                : "Tap a court player to swap"}
          </Text>
          <Pressable
            onPress={() => {
              setSelectedCourtPlayer(null);
              setSelectedBenchPlayer(null);
            }}
            className="ml-auto pl-2"
          >
            <Text className="text-primary-500 text-xs font-semibold">Cancel</Text>
          </Pressable>
        </View>
      )}

      {/* Court Formation */}
      <View className="p-3">
        <Text className="text-[10px] font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-2">
          On Court ({onCourt.length}/5)
        </Text>
        <View className="flex-row justify-around">
          {POSITIONS.map((pos, idx) => renderPositionSlot(pos, idx))}
        </View>
      </View>

      {/* Bench */}
      <View className="px-3 pb-3">
        <Text className="text-[10px] font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-2">
          Bench ({onBench.length})
        </Text>
        {onBench.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6 }}
          >
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
          {fouledOut.length > 5 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6 }}
            >
              {fouledOut.map(renderFouledOutPlayer)}
            </ScrollView>
          ) : (
            <View className="flex-row flex-wrap gap-1.5">
              {fouledOut.map(renderFouledOutPlayer)}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default SubstitutionPanel;
