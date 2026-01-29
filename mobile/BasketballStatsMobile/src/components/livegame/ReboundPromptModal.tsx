import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { BaseModal, ModalHeader, ModalBody, ModalFooter, ModalButton } from "../ui";
import type { Id } from "../../../../../convex/_generated/dataModel";
import type { OnCourtPlayer } from "./ShotRecordingModal";

interface ReboundPromptModalProps {
  visible: boolean;
  onClose: () => void;
  onPlayerRebound: (playerId: Id<"players">, type: "offensive" | "defensive") => void;
  onTeamRebound: (teamId: Id<"teams">, type: "offensive" | "defensive") => void;
  shooterTeamId: Id<"teams">;
  shooterTeamName: string;
  opposingTeamId: Id<"teams">;
  opposingTeamName: string;
  shooterTeamPlayers: OnCourtPlayer[];
  opposingTeamPlayers: OnCourtPlayer[];
  shotType: "shot2" | "shot3" | "freethrow";
  autoDismissMs?: number;
}

/**
 * Modal that appears after a missed shot to record a rebound.
 * Shows two sections: offensive (shooter's team) and defensive (opposing team).
 * Auto-dismisses after configurable timeout (default 8s).
 */
export function ReboundPromptModal({
  visible,
  onClose,
  onPlayerRebound,
  onTeamRebound,
  shooterTeamId,
  shooterTeamName,
  opposingTeamId,
  opposingTeamName,
  shooterTeamPlayers,
  opposingTeamPlayers,
  shotType,
  autoDismissMs = 8000,
}: ReboundPromptModalProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      // Auto-dismiss after timeout
      timerRef.current = setTimeout(() => {
        onClose();
      }, autoDismissMs);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [visible, autoDismissMs, onClose]);

  const handlePlayerRebound = (playerId: Id<"players">, type: "offensive" | "defensive") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (timerRef.current) clearTimeout(timerRef.current);
    onPlayerRebound(playerId, type);
  };

  const handleTeamRebound = (teamId: Id<"teams">, type: "offensive" | "defensive") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (timerRef.current) clearTimeout(timerRef.current);
    onTeamRebound(teamId, type);
  };

  const getShotTypeLabel = (type: string) => {
    if (type === "shot3") return "3PT";
    if (type === "freethrow") return "FT";
    return "2PT";
  };

  const shooterOnCourt = shooterTeamPlayers.filter((p) => p.isOnCourt);
  const opposingOnCourt = opposingTeamPlayers.filter((p) => p.isOnCourt);

  return (
    <BaseModal visible={visible} onClose={onClose} title="Rebound" maxWidth="lg">
      <ModalHeader
        title="Rebound"
        subtitle={`Missed ${getShotTypeLabel(shotType)}`}
        variant="rebound"
        showCloseButton={false}
      />

      <ModalBody scrollable={true} maxHeight={320} padding="none">
        {/* Offensive Rebound - Shooter's Team */}
        <View className="px-4 py-3 border-b border-surface-200 dark:border-surface-700">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-semibold text-orange-600 dark:text-orange-400 text-sm">
              OFFENSIVE ({shooterTeamName})
            </Text>
            <TouchableOpacity
              onPress={() => handleTeamRebound(shooterTeamId, "offensive")}
              className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 rounded active:bg-orange-200"
              activeOpacity={0.7}
            >
              <Text className="text-orange-700 dark:text-orange-300 text-xs font-medium">TEAM</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {shooterOnCourt.map((player) => (
              <TouchableOpacity
                key={player.id}
                onPress={() => handlePlayerRebound(player.playerId, "offensive")}
                className="px-3 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg active:bg-orange-100 flex-row items-center"
                activeOpacity={0.7}
              >
                <Text className="text-orange-600 dark:text-orange-400 text-xs font-bold mr-1.5">
                  #{player.player?.number}
                </Text>
                <Text
                  className="text-surface-900 dark:text-white text-sm font-medium"
                  numberOfLines={1}
                >
                  {player.player?.name?.split(" ").pop() || ""}
                </Text>
              </TouchableOpacity>
            ))}
            {shooterOnCourt.length === 0 && (
              <Text className="text-surface-500 text-sm">No players on court</Text>
            )}
          </View>
        </View>

        {/* Defensive Rebound - Opposing Team */}
        <View className="px-4 py-3">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-semibold text-blue-600 dark:text-blue-400 text-sm">
              DEFENSIVE ({opposingTeamName})
            </Text>
            <TouchableOpacity
              onPress={() => handleTeamRebound(opposingTeamId, "defensive")}
              className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded active:bg-blue-200"
              activeOpacity={0.7}
            >
              <Text className="text-blue-700 dark:text-blue-300 text-xs font-medium">TEAM</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {opposingOnCourt.map((player) => (
              <TouchableOpacity
                key={player.id}
                onPress={() => handlePlayerRebound(player.playerId, "defensive")}
                className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg active:bg-blue-100 flex-row items-center"
                activeOpacity={0.7}
              >
                <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold mr-1.5">
                  #{player.player?.number}
                </Text>
                <Text
                  className="text-surface-900 dark:text-white text-sm font-medium"
                  numberOfLines={1}
                >
                  {player.player?.name?.split(" ").pop() || ""}
                </Text>
              </TouchableOpacity>
            ))}
            {opposingOnCourt.length === 0 && (
              <Text className="text-surface-500 text-sm">No players on court</Text>
            )}
          </View>
        </View>
      </ModalBody>

      <ModalFooter layout="single">
        <ModalButton variant="cancel" onPress={onClose}>
          Dismiss / No Rebound
        </ModalButton>
      </ModalFooter>
    </BaseModal>
  );
}

export default ReboundPromptModal;
