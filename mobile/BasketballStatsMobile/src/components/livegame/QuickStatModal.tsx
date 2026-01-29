import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import Icon from "../Icon";
import {
  BaseModal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalButton,
  type ModalHeaderVariant,
} from "../ui";
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
  {
    label: string;
    shortLabel: string;
    headerVariant: ModalHeaderVariant;
    textClass: string;
  }
> = {
  rebound: {
    label: "Rebound",
    shortLabel: "+REB",
    headerVariant: "rebound",
    textClass: "text-blue-700 dark:text-blue-300",
  },
  assist: {
    label: "Assist",
    shortLabel: "+AST",
    headerVariant: "assist",
    textClass: "text-violet-700 dark:text-violet-300",
  },
  steal: {
    label: "Steal",
    shortLabel: "+STL",
    headerVariant: "steal",
    textClass: "text-cyan-700 dark:text-cyan-300",
  },
  block: {
    label: "Block",
    shortLabel: "+BLK",
    headerVariant: "block",
    textClass: "text-teal-700 dark:text-teal-300",
  },
  turnover: {
    label: "Turnover",
    shortLabel: "+TO",
    headerVariant: "turnover",
    textClass: "text-amber-700 dark:text-amber-300",
  },
  foul: {
    label: "Foul",
    shortLabel: "+PF",
    headerVariant: "foul",
    textClass: "text-red-700 dark:text-red-300",
  },
  freethrow: {
    label: "Free Throw",
    shortLabel: "FT",
    headerVariant: "success",
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
    <BaseModal visible={visible} onClose={onClose} title={config.label} maxWidth="lg">
      <ModalHeader
        title={config.label}
        subtitle="Select player"
        variant={config.headerVariant}
        showCloseButton={false}
      />

      <ModalBody scrollable={true} maxHeight={320} padding="none">
        {activePlayers.length === 0 ? (
          <View className="p-8 items-center">
            <Icon name="users" size={32} color="#9CA3AF" />
            <Text className="text-surface-500 mt-2">No players on court</Text>
          </View>
        ) : (
          <>
            {renderTeamSection(homePlayers, homeTeamName, true)}
            {renderTeamSection(awayPlayers, awayTeamName, false)}
          </>
        )}
      </ModalBody>

      <ModalFooter layout="single">
        <ModalButton variant="cancel" onPress={onClose}>
          Cancel
        </ModalButton>
      </ModalFooter>
    </BaseModal>
  );
}

export default QuickStatModal;
