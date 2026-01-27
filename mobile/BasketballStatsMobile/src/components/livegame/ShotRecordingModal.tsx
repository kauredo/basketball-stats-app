import React from "react";
import { View, Text, Modal, TouchableOpacity, ScrollView, useColorScheme } from "react-native";
import * as Haptics from "expo-haptics";
import Icon from "../Icon";
import type { Id } from "../../../../../convex/_generated/dataModel";

export interface OnCourtPlayer {
  id: string;
  playerId: Id<"players">;
  teamId: Id<"teams">;
  isHomeTeam: boolean;
  player: {
    id: Id<"players">;
    name: string;
    number: number;
  } | null;
  points: number;
  rebounds?: number;
  assists?: number;
  steals?: number;
  blocks?: number;
  turnovers?: number;
  fouls?: number;
  freeThrowsMade?: number;
  isOnCourt: boolean;
}

interface ShotRecordingModalProps {
  visible: boolean;
  onClose: () => void;
  onRecord: (playerId: Id<"players">, made: boolean) => void;
  shotType: "2pt" | "3pt";
  zoneName: string;
  onCourtPlayers: OnCourtPlayer[];
  homeTeamName?: string;
  awayTeamName?: string;
}

/**
 * Modal for recording shots after tapping the court.
 * Shows shot location zone, point value, and player selection with made/missed buttons.
 * Matches web version pattern - no pre-selected player needed.
 */
export function ShotRecordingModal({
  visible,
  onClose,
  onRecord,
  shotType,
  zoneName,
  onCourtPlayers,
  homeTeamName = "Home",
  awayTeamName = "Away",
}: ShotRecordingModalProps) {
  const colorScheme = useColorScheme();
  const _isDark = colorScheme === "dark";

  const points = shotType === "3pt" ? 3 : 2;

  // Group players by team
  const activePlayers = onCourtPlayers.filter((p) => p.isOnCourt);
  const homePlayers = activePlayers.filter((p) => p.isHomeTeam);
  const awayPlayers = activePlayers.filter((p) => !p.isHomeTeam);

  const handleRecord = (playerId: Id<"players">, made: boolean) => {
    if (made) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    onRecord(playerId, made);
  };

  const renderPlayer = (item: OnCourtPlayer) => {
    if (!item.player) return null;

    // Team-specific colors: home = blue, away = orange
    const avatarBg = item.isHomeTeam ? "bg-blue-600" : "bg-orange-500";

    return (
      <View
        key={item.id}
        className="flex-row items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-700"
      >
        <View className="flex-row items-center flex-1">
          <View className={`w-10 h-10 rounded-full justify-center items-center mr-3 ${avatarBg}`}>
            <Text className="text-white font-bold text-sm">#{item.player.number}</Text>
          </View>
          <View>
            <Text className="text-surface-900 dark:text-white font-medium text-sm">
              {item.player.name}
            </Text>
            <Text className="text-surface-500 text-xs">{item.points} PTS</Text>
          </View>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => handleRecord(item.playerId, true)}
            className="px-4 py-2 bg-green-600 rounded-lg active:bg-green-700"
            activeOpacity={0.8}
          >
            <Text className="text-white text-sm font-bold">MADE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleRecord(item.playerId, false)}
            className="px-4 py-2 bg-red-600 rounded-lg active:bg-red-700"
            activeOpacity={0.8}
          >
            <Text className="text-white text-sm font-bold">MISS</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderTeamSection = (players: OnCourtPlayer[], teamName: string, isHome: boolean) => {
    if (players.length === 0) return null;

    const headerBg = isHome
      ? "bg-blue-100 dark:bg-blue-900/30"
      : "bg-orange-100 dark:bg-orange-900/30";
    const headerText = isHome
      ? "text-blue-700 dark:text-blue-300"
      : "text-orange-700 dark:text-orange-300";

    return (
      <View key={isHome ? "home" : "away"}>
        <View className={`px-4 py-2 ${headerBg}`}>
          <Text className={`text-xs font-bold uppercase tracking-wide ${headerText}`}>
            {teamName}
          </Text>
        </View>
        {players.map(renderPlayer)}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View className="flex-1 bg-black/70 justify-center items-center px-4 py-2">
        <View className="bg-surface-50 dark:bg-surface-800 rounded-2xl max-h-[96%] w-full max-w-lg border border-surface-200 dark:border-surface-700 overflow-hidden">
          {/* Header with zone info */}
          <View className="bg-surface-50 dark:bg-surface-900 px-6 py-4 border-b border-surface-200 dark:border-surface-700">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-lg font-bold text-surface-900 dark:text-white">
                  {shotType === "3pt" ? "3-Point Shot" : "2-Point Shot"}
                </Text>
                <Text className="text-sm text-surface-500 dark:text-surface-400">
                  Shot from{" "}
                  <Text className="font-medium text-surface-700 dark:text-surface-300">
                    {zoneName}
                  </Text>
                </Text>
              </View>
              <View
                className={`px-3 py-1 rounded-full ${
                  shotType === "3pt"
                    ? "bg-purple-100 dark:bg-purple-900/30"
                    : "bg-blue-100 dark:bg-blue-900/30"
                }`}
              >
                <Text
                  className={`text-sm font-bold ${
                    shotType === "3pt"
                      ? "text-purple-700 dark:text-purple-300"
                      : "text-blue-700 dark:text-blue-300"
                  }`}
                >
                  +{points} PTS
                </Text>
              </View>
            </View>
          </View>

          {/* Player list grouped by team */}
          {activePlayers.length === 0 ? (
            <View className="p-8 items-center">
              <Icon name="users" size={32} color="#9CA3AF" />
              <Text className="text-surface-500 mt-2">No players on court</Text>
            </View>
          ) : (
            <ScrollView className="max-h-80">
              {renderTeamSection(homePlayers, homeTeamName, true)}
              {renderTeamSection(awayPlayers, awayTeamName, false)}
            </ScrollView>
          )}

          {/* Cancel button */}
          <View className="px-4 py-3 bg-surface-50 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700">
            <TouchableOpacity onPress={onClose} className="py-3" activeOpacity={0.7}>
              <Text className="text-surface-600 dark:text-surface-400 font-medium text-center">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default ShotRecordingModal;
