import React from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import * as Haptics from "expo-haptics";
import Icon from "../Icon";
import { BaseModal, ModalHeader, ModalBody, ModalFooter, ModalButton } from "../ui";
import type { Id } from "../../../../../convex/_generated/dataModel";
import type { OnCourtPlayer } from "./ShotRecordingModal";

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
  shotType: _shotType,
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
            <Text className="text-surface-500 text-xs">{item.assists || 0} AST</Text>
          </View>
        </View>
        <View className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <Text className="text-purple-700 dark:text-purple-300 text-sm font-medium">+AST</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const badge = (
    <View className="px-3 py-1 bg-white/20 rounded-full">
      <Text className="text-white text-sm font-bold">+{points} PTS</Text>
    </View>
  );

  return (
    <BaseModal visible={visible} onClose={onClose} title="Assist" maxWidth="lg">
      <ModalHeader
        title="Assist?"
        subtitle={`#${scorerNumber} ${scorerName} scored ${points}PT`}
        variant="success"
        badge={badge}
        showCloseButton={false}
      />

      {/* Section header */}
      <View className="px-4 py-2 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700">
        <Text className="text-xs text-surface-500 uppercase">Who assisted?</Text>
      </View>

      <ModalBody scrollable={true} maxHeight={240} padding="none">
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
            scrollEnabled={false}
          />
        )}
      </ModalBody>

      <ModalFooter layout="split">
        <ModalButton variant="secondary" onPress={handleNoAssist}>
          No Assist
        </ModalButton>
        <ModalButton variant="cancel" onPress={onClose}>
          Cancel
        </ModalButton>
      </ModalFooter>
    </BaseModal>
  );
}

export default AssistPromptModal;
