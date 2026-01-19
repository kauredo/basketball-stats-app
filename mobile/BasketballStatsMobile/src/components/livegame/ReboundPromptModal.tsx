import React, { useEffect, useRef } from "react";
import { View, Text, Modal, TouchableOpacity, ScrollView } from "react-native";
import * as Haptics from "expo-haptics";
import { Id } from "../../../../../convex/_generated/dataModel";
import { OnCourtPlayer } from "./ShotRecordingModal";

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
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/70 justify-end">
        <View className="bg-white dark:bg-gray-800 rounded-t-2xl max-h-[80%] border-t border-gray-200 dark:border-gray-700">
          {/* Header - Blue to indicate rebound opportunity */}
          <View className="bg-blue-600 px-6 py-4 rounded-t-2xl">
            <Text className="text-lg font-bold text-white">Rebound</Text>
            <Text className="text-blue-200 text-sm">Missed {getShotTypeLabel(shotType)}</Text>
          </View>

          <ScrollView className="max-h-80">
            {/* Offensive Rebound - Shooter's Team */}
            <View className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="font-semibold text-orange-600 dark:text-orange-400 text-sm">
                  OFFENSIVE ({shooterTeamName})
                </Text>
                <TouchableOpacity
                  onPress={() => handleTeamRebound(shooterTeamId, "offensive")}
                  className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 rounded active:bg-orange-200"
                  activeOpacity={0.7}
                >
                  <Text className="text-orange-700 dark:text-orange-300 text-xs font-medium">
                    TEAM
                  </Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {shooterOnCourt.map((player) => (
                  <TouchableOpacity
                    key={player.id}
                    onPress={() => handlePlayerRebound(player.playerId, "offensive")}
                    className="px-4 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg active:bg-orange-100"
                    activeOpacity={0.7}
                  >
                    <Text className="text-gray-900 dark:text-white text-sm font-medium">
                      #{player.player?.number}
                    </Text>
                  </TouchableOpacity>
                ))}
                {shooterOnCourt.length === 0 && (
                  <Text className="text-gray-500 text-sm">No players on court</Text>
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
                    className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg active:bg-blue-100"
                    activeOpacity={0.7}
                  >
                    <Text className="text-gray-900 dark:text-white text-sm font-medium">
                      #{player.player?.number}
                    </Text>
                  </TouchableOpacity>
                ))}
                {opposingOnCourt.length === 0 && (
                  <Text className="text-gray-500 text-sm">No players on court</Text>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <TouchableOpacity onPress={onClose} className="py-3" activeOpacity={0.7}>
              <Text className="text-gray-600 dark:text-gray-400 font-medium text-center">
                Dismiss / No Rebound
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default ReboundPromptModal;
