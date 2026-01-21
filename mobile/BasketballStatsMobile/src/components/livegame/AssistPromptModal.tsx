import React from "react";
import { View, Text, Modal, TouchableOpacity, FlatList } from "react-native";
import * as Haptics from "expo-haptics";
import Icon from "../Icon";
import { Id } from "../../../../../convex/_generated/dataModel";
import { OnCourtPlayer } from "./ShotRecordingModal";

interface AssistPromptModalProps {
  visible: boolean;
  onClose: () => void;
  onAssist: (playerId: Id<"players">) => void;
  onNoAssist: () => void;
  scorerName: string;
  scorerNumber: number;
  shotType: string;
  points: number;
  teammates: OnCourtPlayer[];
}

/**
 * Modal that appears after a made shot to record an assist.
 * Shows scorer info and list of teammates to select the assister.
 */
export function AssistPromptModal({
  visible,
  onClose,
  onAssist,
  onNoAssist,
  scorerName,
  scorerNumber,
  shotType,
  points,
  teammates,
}: AssistPromptModalProps) {
  const handleAssist = (playerId: Id<"players">) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAssist(playerId);
  };

  const handleNoAssist = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onNoAssist();
  };

  const renderTeammate = ({ item }: { item: OnCourtPlayer }) => {
    if (!item.player) return null;

    return (
      <TouchableOpacity
        onPress={() => handleAssist(item.playerId)}
        className="flex-row items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-700 active:bg-purple-50 dark:active:bg-purple-900/20"
        activeOpacity={0.7}
      >
        <View className="flex-row items-center flex-1">
          <View className="w-10 h-10 bg-purple-600 rounded-full justify-center items-center mr-3">
            <Text className="text-white font-bold text-sm">#{item.player.number}</Text>
          </View>
          <View>
            <Text className="text-surface-900 dark:text-white font-medium text-sm">
              {item.player.name}
            </Text>
            <Text className="text-surface-500 text-xs">{(item as any).assists || 0} AST</Text>
          </View>
        </View>
        <View className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <Text className="text-purple-700 dark:text-purple-300 text-sm font-medium">+AST</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/70 justify-end">
        <View className="bg-surface-50 dark:bg-surface-800 rounded-t-2xl max-h-[70%] border-t border-surface-200 dark:border-surface-700">
          {/* Header - Green to indicate made shot */}
          <View className="bg-green-600 px-6 py-4 rounded-t-2xl">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-lg font-bold text-white">Assist?</Text>
                <Text className="text-green-200 text-sm">
                  #{scorerNumber} {scorerName} scored {points}PT
                </Text>
              </View>
              <View className="px-3 py-1 bg-white/20 rounded-full">
                <Text className="text-white text-sm font-bold">+{points} PTS</Text>
              </View>
            </View>
          </View>

          {/* Section header */}
          <View className="px-4 py-2 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700">
            <Text className="text-xs text-surface-500 uppercase">Who assisted?</Text>
          </View>

          {/* Teammate list for assist */}
          {teammates.length === 0 ? (
            <View className="p-6 items-center">
              <Icon name="users" size={32} color="#9CA3AF" />
              <Text className="text-surface-500 mt-2 text-center">No other players on court</Text>
            </View>
          ) : (
            <FlatList
              data={teammates}
              keyExtractor={(item) => item.id}
              renderItem={renderTeammate}
              className="max-h-60"
            />
          )}

          {/* No assist / Cancel */}
          <View className="px-4 py-3 bg-surface-50 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700 flex-row gap-2">
            <TouchableOpacity
              onPress={handleNoAssist}
              className="flex-1 py-3 bg-surface-200 dark:bg-surface-700 rounded-lg"
              activeOpacity={0.7}
            >
              <Text className="text-surface-700 dark:text-surface-300 font-medium text-center">
                No Assist
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} className="flex-1 py-3" activeOpacity={0.7}>
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

export default AssistPromptModal;
