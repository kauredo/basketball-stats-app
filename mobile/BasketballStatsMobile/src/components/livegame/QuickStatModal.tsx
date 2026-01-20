import React from "react";
import { View, Text, Modal, TouchableOpacity, FlatList } from "react-native";
import * as Haptics from "expo-haptics";
import Icon from "../Icon";
import { Id } from "../../../../../convex/_generated/dataModel";
import { OnCourtPlayer } from "./ShotRecordingModal";

export type QuickStatType = "rebound" | "assist" | "steal" | "block" | "turnover" | "foul" | "freethrow";

interface QuickStatModalProps {
  visible: boolean;
  onClose: () => void;
  onRecord: (playerId: Id<"players">) => void;
  statType: QuickStatType;
  onCourtPlayers: OnCourtPlayer[];
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
}: QuickStatModalProps) {
  const config = STAT_CONFIG[statType];

  const handleRecord = (playerId: Id<"players">) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRecord(playerId);
  };

  const getStatValue = (player: OnCourtPlayer): number => {
    const p = player as any;
    switch (statType) {
      case "rebound":
        return p.rebounds || 0;
      case "assist":
        return p.assists || 0;
      case "steal":
        return p.steals || 0;
      case "block":
        return p.blocks || 0;
      case "turnover":
        return p.turnovers || 0;
      case "foul":
        return p.fouls || 0;
      case "freethrow":
        return p.freeThrowsMade || 0;
      default:
        return 0;
    }
  };

  const renderPlayer = ({ item }: { item: OnCourtPlayer }) => {
    if (!item.player) return null;

    return (
      <TouchableOpacity
        onPress={() => handleRecord(item.playerId)}
        className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 active:bg-gray-50 dark:active:bg-gray-700"
        activeOpacity={0.7}
      >
        <View className="flex-row items-center flex-1">
          <View
            className={`w-10 h-10 rounded-full justify-center items-center mr-3 ${config.bgClass}`}
          >
            <Text className="text-white font-bold text-sm">#{item.player.number}</Text>
          </View>
          <View>
            <Text className="text-gray-900 dark:text-white font-medium text-sm">
              {item.player.name}
            </Text>
            <Text className="text-gray-500 text-xs">
              {getStatValue(item)} {config.label.toUpperCase().slice(0, 3)}
            </Text>
          </View>
        </View>
        <View className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <Text className={`text-sm font-medium ${config.textClass}`}>{config.shortLabel}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/70 justify-end">
        <View className="bg-white dark:bg-gray-800 rounded-t-2xl max-h-[70%] border-t border-gray-200 dark:border-gray-700">
          {/* Header with stat type */}
          <View className={`px-6 py-4 rounded-t-2xl ${config.bgClass}`}>
            <Text className="text-lg font-bold text-white">{config.label}</Text>
            <Text className="text-white/70 text-sm">Select player</Text>
          </View>

          {/* Player list */}
          {onCourtPlayers.length === 0 ? (
            <View className="p-8 items-center">
              <Icon name="users" size={32} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2">No players on court</Text>
            </View>
          ) : (
            <FlatList
              data={onCourtPlayers.filter((p) => p.isOnCourt)}
              keyExtractor={(item) => item.id}
              renderItem={renderPlayer}
              className="max-h-80"
            />
          )}

          {/* Cancel button */}
          <View className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <TouchableOpacity onPress={onClose} className="py-3" activeOpacity={0.7}>
              <Text className="text-gray-600 dark:text-gray-400 font-medium text-center">
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
