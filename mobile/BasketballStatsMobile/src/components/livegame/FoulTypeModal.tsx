import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from "react-native";
import * as Haptics from "expo-haptics";
import Icon from "../Icon";
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
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header with Player Info */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {step !== "foulType" && (
                <TouchableOpacity
                  onPress={() => {
                    if (step === "shotType") setStep("foulType");
                    else if (step === "andOne") setStep("shotType");
                    else if (step === "fouledPlayer") setStep("andOne");
                  }}
                  style={styles.backButton}
                >
                  <Icon name="arrow-left" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              <View style={styles.playerNumber}>
                <Text style={styles.playerNumberText}>#{player.number}</Text>
              </View>
              <View style={styles.playerDetails}>
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={[styles.playerFouls, isFoulLimitReached && styles.foulWarning]}>
                  {player.fouls} fouls{isFoulLimitReached && " • FOUL TROUBLE"}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Step Content */}
          <ScrollView style={styles.content}>
            {step === "foulType" && (
              <View style={styles.grid}>
                {foulTypes.map((foul) => (
                  <TouchableOpacity
                    key={foul.type}
                    style={[styles.foulButton, { borderColor: foul.color }]}
                    onPress={() => handleFoulTypeSelect(foul.type)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.foulButtonLabel, { color: foul.color }]}>
                      {foul.label}
                    </Text>
                    <Text style={styles.foulButtonDescription}>{foul.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {step === "shotType" && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>What type of shot?</Text>
                <View style={styles.optionRow}>
                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={() => handleShotTypeSelect("2pt")}
                  >
                    <Text style={styles.optionButtonText}>2-Point</Text>
                    <Text style={styles.optionButtonSubtext}>2 FTs</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={() => handleShotTypeSelect("3pt")}
                  >
                    <Text style={styles.optionButtonText}>3-Point</Text>
                    <Text style={styles.optionButtonSubtext}>3 FTs</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {step === "andOne" && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Was the shot made? (And-1)</Text>
                <View style={styles.optionRow}>
                  <TouchableOpacity
                    style={[styles.optionButton, styles.yesButton]}
                    onPress={() => handleAndOneSelect(true)}
                  >
                    <Text style={styles.optionButtonText}>Yes (And-1)</Text>
                    <Text style={styles.optionButtonSubtext}>
                      {shotType === "2pt" ? "+2 PTS + 1 FT" : "+3 PTS + 1 FT"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.optionButton, styles.noButton]}
                    onPress={() => handleAndOneSelect(false)}
                  >
                    <Text style={styles.optionButtonText}>No (Missed)</Text>
                    <Text style={styles.optionButtonSubtext}>
                      {shotType === "2pt" ? "2 FTs" : "3 FTs"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {step === "fouledPlayer" && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Who was fouled?</Text>
                <View style={styles.playerList}>
                  {opposingPlayers.map((p) => (
                    <TouchableOpacity
                      key={p.playerId}
                      style={styles.playerListItem}
                      onPress={() => handleFouledPlayerSelect(p.playerId)}
                    >
                      <View style={styles.playerListNumber}>
                        <Text style={styles.playerListNumberText}>#{p.player?.number}</Text>
                      </View>
                      <Text style={styles.playerListName}>{p.player?.name}</Text>
                      <Icon name="chevron-right" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Cancel Button */}
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  container: {
    backgroundColor: "#1F2937",
    borderRadius: 24,
    maxHeight: "96%",
    width: "100%",
    maxWidth: 500,
    paddingBottom: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#111827",
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  closeButton: {
    padding: 8,
    marginRight: -4,
  },
  playerNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F97316",
    justifyContent: "center",
    alignItems: "center",
  },
  playerNumberText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  playerFouls: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 1,
  },
  foulWarning: {
    color: "#EF4444",
    fontWeight: "600",
  },
  content: {
    padding: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  foulButton: {
    width: "47%",
    backgroundColor: "#111827",
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  foulButtonLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  foulButtonDescription: {
    color: "#9CA3AF",
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
  stepContent: {
    alignItems: "center",
  },
  stepTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  optionButton: {
    flex: 1,
    backgroundColor: "#374151",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  yesButton: {
    backgroundColor: "#166534",
  },
  noButton: {
    backgroundColor: "#991B1B",
  },
  optionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  optionButtonSubtext: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    marginTop: 4,
  },
  playerList: {
    width: "100%",
  },
  playerListItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  playerListNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  playerListNumberText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  playerListName: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
  },
  cancelButton: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#9CA3AF",
    fontSize: 16,
  },
});
