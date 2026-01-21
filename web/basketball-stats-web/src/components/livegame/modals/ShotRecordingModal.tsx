import React, { useRef } from "react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { PlayerStat } from "../../../types/livegame";
import {
  BaseModal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCancelButton,
} from "../../ui/BaseModal";
import { PlayerListItem, PlayerListEmpty, MadeButton, MissButton } from "../../ui/PlayerListItem";

interface ShotRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecord: (playerId: Id<"players">, made: boolean) => void;
  shotType: "2pt" | "3pt";
  zoneName: string;
  onCourtPlayers: PlayerStat[];
}

/**
 * Modal for recording shots after tapping the court.
 * Shows shot location zone, point value, and player selection with made/missed buttons.
 */
export const ShotRecordingModal: React.FC<ShotRecordingModalProps> = ({
  isOpen,
  onClose,
  onRecord,
  shotType,
  zoneName,
  onCourtPlayers,
}) => {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const points = shotType === "3pt" ? 3 : 2;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={shotType === "3pt" ? "3-Point Shot" : "2-Point Shot"}
      initialFocusRef={cancelButtonRef}
    >
      <ModalHeader
        title={shotType === "3pt" ? "3-Point Shot" : "2-Point Shot"}
        subtitle={
          <>
            Shot from{" "}
            <span className="font-medium text-surface-700 dark:text-surface-300">{zoneName}</span>
          </>
        }
        badge={
          <div
            className={`px-3 py-1.5 rounded-full text-sm font-bold ${
              shotType === "3pt"
                ? "bg-shots-made3pt/15 text-shots-made3pt dark:bg-shots-made3pt/25"
                : "bg-shots-made2pt/15 text-shots-made2pt dark:bg-shots-made2pt/25"
            }`}
          >
            +{points} PTS
          </div>
        }
      />

      <ModalBody maxHeight="max-h-80">
        {onCourtPlayers.length === 0 ? (
          <PlayerListEmpty message="No players on court" />
        ) : (
          onCourtPlayers.map((player) => (
            <PlayerListItem
              key={player.id}
              player={player.player}
              stats={`${player.points} PTS`}
              actions={
                <>
                  <MadeButton onClick={() => onRecord(player.playerId, true)} />
                  <MissButton onClick={() => onRecord(player.playerId, false)} />
                </>
              }
            />
          ))
        )}
      </ModalBody>

      <ModalFooter>
        <ModalCancelButton onClick={onClose} />
      </ModalFooter>
    </BaseModal>
  );
};

export default ShotRecordingModal;
