import React from "react";
import { View, Text, Modal, TouchableOpacity, ScrollView } from "react-native";
import * as Haptics from "expo-haptics";
import Icon from "../Icon";
import type { Id } from "../../../../../convex/_generated/dataModel";
import type { OnCourtPlayer } from "./ShotRecordingModal";

export type QuickStatType =
  | "rebound"
  | "assist"
  | "steal"
  | "block"
  | "turnover"
  | "foul"
  | "freethrow";

interface QuickStatModalProps {
  visible: boolean;
  onClose: () => void;
  onRecord: (playerId: Id<"players">) => void;
  statType: QuickStatType;
  onCourtPlayers: OnCourtPlayer[];
  homeTeamName?: string;
  awayTeamName?: string;
}

const STAT_CONFIG: Record<
  QuickStatType,
  { label: string; shortLabel: string; color: string; bgClass: string; textClass: string }
> = {
  rebound: {
    label: "Rebound",
    shortLabel: "+REB",
    color: "#2563EB",
    bgClass: "bg-blue-600",
    textClass: "text-blue-700 dark:text-blue-300",
  },
  assist: {
    label: "Assist",
    shortLabel: "+AST",
    color: "#7C3AED",
    bgClass: "bg-violet-600",
    textClass: "text-violet-700 dark:text-violet-300",
  },
  steal: {
    label: "Steal",
    shortLabel: "+STL",
    color: "#0891B2",
    bgClass: "bg-cyan-600",
    textClass: "text-cyan-700 dark:text-cyan-300",
  },
  block: {
    label: "Block",
    shortLabel: "+BLK",
    color: "#0D9488",
    bgClass: "bg-teal-600",
    textClass: "text-teal-700 dark:text-teal-300",
  },
  turnover: {
    label: "Turnover",
    shortLabel: "+TO",
    color: "#F59E0B",
    bgClass: "bg-amber-500",
    textClass: "text-amber-700 dark:text-amber-300",
  },
  foul: {
    label: "Foul",
    shortLabel: "+PF",
    color: "#DC2626",
    bgClass: "bg-red-600",
    textClass: "text-red-700 dark:text-red-300",
  },
  freethrow: {
    label: "Free Throw",
    shortLabel: "FT",
    color: "#059669",
    bgClass: "bg-emerald-600",
    textClass: "text-emerald-700 dark:text-emerald-300",
  },
};

/**
 * Modal for recording non-shot stats.
 * Shows stat type header and player selection list.
 * Matches web version pattern - no pre-selected player needed.
 */
export function QuickStatModal({
  visible,
  onClose,
  onRecord,
  statType,
  onCourtPlayers,
  homeTeamName = "Home",
  awayTeamName = "Away",
}: QuickStatModalProps) {
  const config = STAT_CONFIG[statType];

  // Group players by team
  const activePlayers = onCourtPlayers.filter((p) => p.isOnCourt);
  const homePlayers = activePlayers.filter((p) => p.isHomeTeam);
  const awayPlayers = activePlayers.filter((p) => !p.isHomeTeam);

  const handleRecord = (playerId: Id<"players">) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRecord(playerId);
  };

  const getStatValue = (player: OnCourtPlayer): number => {
    switch (statType) {
      case "rebound":
        return player.rebounds || 0;
      case "assist":
        return player.assists || 0;
      case "steal":
        return player.steals || 0;
      case "block":
        return player.blocks || 0;
      case "turnover":
        return player.turnovers || 0;
      case "foul":
        return player.fouls || 0;
      case "freethrow":
        return player.freeThrowsMade || 0;
      default:
        return 0;
    }
  };

  const renderPlayer = (item: OnCourtPlayer) => {
    if (!item.player) return null;

    // Team-specific avatar colors: home = blue, away = orange
    const avatarBg = item.isHomeTeam ? "bg-blue-600" : "bg-orange-500";

    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => handleRecord(item.playerId)}
        className="flex-row items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-700 active:bg-surface-50 dark:active:bg-surface-700"
        activeOpacity={0.7}
      >
        <View className="flex-row items-center flex-1">
          <View className={`w-10 h-10 rounded-full justify-center items-center mr-3 ${avatarBg}`}>
            <Text className="text-white font-bold text-sm">#{item.player.number}</Text>
          </View>
          <View>
            <Text className="text-surface-900 dark:text-white font-medium text-sm">
              {item.player.name}
            </Text>
            <Text className="text-surface-500 text-xs">
              {getStatValue(item)} {config.label.toUpperCase().slice(0, 3)}
            </Text>
          </View>
        </View>
        <View className="px-3 py-1 bg-surface-100 dark:bg-surface-700 rounded-lg">
          <Text className={`text-sm font-medium ${config.textClass}`}>{config.shortLabel}</Text>
        </View>
      </TouchableOpacity>
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
          {/* Header with stat type */}
          <View className={`px-6 py-4 ${config.bgClass}`}>
            <Text className="text-lg font-bold text-white">{config.label}</Text>
            <Text className="text-white/70 text-sm">Select player</Text>
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

export default QuickStatModal;
