import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import Icon from "../Icon";
import { BaseModal, ModalHeader, ModalBody, ModalFooter, ModalButton } from "../ui";
import type { Id } from "../../../../../convex/_generated/dataModel";

export type FoulType =
  | "personal"
  | "shooting"
  | "offensive"
  | "technical"
  | "flagrant1"
  | "flagrant2";

interface PlayerInfo {
  id: Id<"players">;
  name: string;
  number: number;
  fouls: number;
}

interface OnCourtPlayer {
  playerId: Id<"players">;
  player: { id: Id<"players">; name: string; number: number } | null;
}

interface ShootingFoulDetails {
  shotType: "2pt" | "3pt";
  wasAndOne: boolean;
  fouledPlayerId: Id<"players">;
}

interface FoulTypeModalProps {
  visible: boolean;
  onClose: () => void;
  player: PlayerInfo | null;
  foulLimit: number;
  onSelectFoul: (foulType: FoulType, shootingDetails?: ShootingFoulDetails) => void;
  onCourtPlayers: OnCourtPlayer[];
  playerTeamId?: Id<"teams">;
}

type ModalStep = "foulType" | "shotType" | "andOne" | "fouledPlayer";

export default function FoulTypeModal({
  visible,
  onClose,
  player,
  foulLimit,
  onSelectFoul,
  onCourtPlayers,
  playerTeamId,
}: FoulTypeModalProps) {
  const [step, setStep] = useState<ModalStep>("foulType");
  const [_selectedFoulType, setSelectedFoulType] = useState<FoulType | null>(null);
  const [shotType, setShotType] = useState<"2pt" | "3pt" | null>(null);
  const [wasAndOne, setWasAndOne] = useState<boolean | null>(null);

  // Get opposing team players (who could be fouled)
  const opposingPlayers = onCourtPlayers.filter(
    (p) => p.player && playerTeamId && p.playerId !== player?.id
  );

  const resetState = () => {
    setStep("foulType");
    setSelectedFoulType(null);
    setShotType(null);
    setWasAndOne(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFoulTypeSelect = (foulType: FoulType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedFoulType(foulType);

    if (foulType === "shooting") {
      setStep("shotType");
    } else {
      // Non-shooting fouls complete immediately
      onSelectFoul(foulType);
      handleClose();
    }
  };

  const handleShotTypeSelect = (type: "2pt" | "3pt") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShotType(type);
    setStep("andOne");
  };

  const handleAndOneSelect = (andOne: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWasAndOne(andOne);
    setStep("fouledPlayer");
  };

  const handleFouledPlayerSelect = (fouledPlayerId: Id<"players">) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (shotType !== null && wasAndOne !== null) {
      onSelectFoul("shooting", {
        shotType,
        wasAndOne,
        fouledPlayerId,
      });
    }
    handleClose();
  };

  const handleBack = () => {
    if (step === "shotType") setStep("foulType");
    else if (step === "andOne") setStep("shotType");
    else if (step === "fouledPlayer") setStep("andOne");
  };

  const foulTypes: Array<{
    type: FoulType;
    label: string;
    description: string;
    color: string;
  }> = [
    {
      type: "personal",
      label: "Personal",
      description: "Non-shooting foul",
      color: "#F59E0B",
    },
    {
      type: "shooting",
      label: "Shooting",
      description: "Foul during shot attempt",
      color: "#EF4444",
    },
    {
      type: "offensive",
      label: "Offensive",
      description: "Charge or illegal screen",
      color: "#8B5CF6",
    },
    {
      type: "technical",
      label: "Technical",
      description: "Unsportsmanlike conduct",
      color: "#3B82F6",
    },
    {
      type: "flagrant1",
      label: "Flagrant 1",
      description: "Unnecessary contact",
      color: "#DC2626",
    },
    {
      type: "flagrant2",
      label: "Flagrant 2",
      description: "Unnecessary & excessive",
      color: "#991B1B",
    },
  ];

  if (!visible || !player) return null;

  const isFoulLimitReached = player.fouls >= foulLimit - 1;

  return (
    <BaseModal visible={visible} onClose={handleClose} title="Foul Type" maxWidth="lg">
      <ModalHeader
        title="Foul Type"
        variant="foul"
        playerInfo={{
          number: player.number,
          name: player.name,
          subtitle: `${player.fouls} fouls${isFoulLimitReached ? " • FOUL TROUBLE" : ""}`,
          subtitleDanger: isFoulLimitReached,
        }}
        showBackButton={step !== "foulType"}
        onBack={handleBack}
        onClose={handleClose}
      />

      <ModalBody scrollable={true} maxHeight={320} padding="md">
        {step === "foulType" && (
          <View className="flex-row flex-wrap justify-between">
            {foulTypes.map((foul) => (
              <TouchableOpacity
                key={foul.type}
                className="w-[48%] bg-surface-100 dark:bg-surface-900 border-2 rounded-xl py-3 px-4 items-center mb-3 min-h-[44px]"
                style={{ borderColor: foul.color }}
                onPress={() => handleFoulTypeSelect(foul.type)}
                activeOpacity={0.7}
              >
                <Text className="text-base font-bold" style={{ color: foul.color }}>
                  {foul.label}
                </Text>
                <Text className="text-surface-500 dark:text-surface-400 text-[11px] mt-1 text-center">
                  {foul.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === "shotType" && (
          <View className="items-center">
            <Text className="text-surface-900 dark:text-white text-base font-semibold mb-4">
              What type of shot?
            </Text>
            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                className="flex-1 bg-surface-200 dark:bg-surface-700 rounded-xl p-5 items-center min-h-[44px]"
                onPress={() => handleShotTypeSelect("2pt")}
              >
                <Text className="text-surface-900 dark:text-white text-base font-bold">
                  2-Point
                </Text>
                <Text className="text-surface-500 dark:text-surface-400 text-xs mt-1">2 FTs</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-surface-200 dark:bg-surface-700 rounded-xl p-5 items-center min-h-[44px]"
                onPress={() => handleShotTypeSelect("3pt")}
              >
                <Text className="text-surface-900 dark:text-white text-base font-bold">
                  3-Point
                </Text>
                <Text className="text-surface-500 dark:text-surface-400 text-xs mt-1">3 FTs</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === "andOne" && (
          <View className="items-center">
            <Text className="text-surface-900 dark:text-white text-base font-semibold mb-4">
              Was the shot made? (And-1)
            </Text>
            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                className="flex-1 bg-green-600 rounded-xl p-5 items-center min-h-[44px]"
                onPress={() => handleAndOneSelect(true)}
              >
                <Text className="text-white text-base font-bold">Yes (And-1)</Text>
                <Text className="text-white/70 text-xs mt-1">
                  {shotType === "2pt" ? "+2 PTS + 1 FT" : "+3 PTS + 1 FT"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-red-600 rounded-xl p-5 items-center min-h-[44px]"
                onPress={() => handleAndOneSelect(false)}
              >
                <Text className="text-white text-base font-bold">No (Missed)</Text>
                <Text className="text-white/70 text-xs mt-1">
                  {shotType === "2pt" ? "2 FTs" : "3 FTs"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === "fouledPlayer" && (
          <View className="items-center">
            <Text className="text-surface-900 dark:text-white text-base font-semibold mb-4">
              Who was fouled?
            </Text>
            <View className="w-full">
              {opposingPlayers.map((p) => (
                <TouchableOpacity
                  key={p.playerId}
                  className="flex-row items-center bg-surface-100 dark:bg-surface-900 p-3 rounded-lg mb-2 min-h-[44px]"
                  onPress={() => handleFouledPlayerSelect(p.playerId)}
                >
                  <View className="w-10 h-10 rounded-full bg-surface-200 dark:bg-surface-700 justify-center items-center mr-3">
                    <Text className="text-surface-900 dark:text-white font-semibold text-sm">
                      #{p.player?.number}
                    </Text>
                  </View>
                  <Text className="flex-1 text-surface-900 dark:text-white text-[15px]">
                    {p.player?.name}
                  </Text>
                  <Icon name="chevron-right" size={20} color="#6B7280" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ModalBody>

      <ModalFooter layout="single">
        <ModalButton variant="cancel" onPress={handleClose}>
          Cancel
        </ModalButton>
      </ModalFooter>
    </BaseModal>
  );
}
