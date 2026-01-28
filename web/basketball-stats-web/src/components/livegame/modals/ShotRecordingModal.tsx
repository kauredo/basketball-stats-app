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
  homeTeamName?: string;
  awayTeamName?: string;
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
  homeTeamName = "Home",
  awayTeamName = "Away",
}) => {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const points = shotType === "3pt" ? 3 : 2;

  // Group players by team
  const homePlayers = onCourtPlayers.filter((p) => p.isHomeTeam);
  const awayPlayers = onCourtPlayers.filter((p) => !p.isHomeTeam);

  const renderPlayer = (player: PlayerStat) => {
    // Team-specific avatar colors: home = blue, away = orange
    const avatarBg = player.isHomeTeam
      ? "bg-blue-600"
      : "bg-orange-500";

    return (
      <div
        key={player.id}
        className="flex items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-700 last:border-0"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${avatarBg} rounded-full flex items-center justify-center flex-shrink-0`}>
            <span className="text-white font-bold text-sm">#{player.player?.number}</span>
          </div>
          <div className="text-left">
            <div className="text-surface-900 dark:text-white font-medium text-sm">
              {player.player?.name}
            </div>
            <div className="text-surface-500 text-xs">
              {player.points} PTS
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <MadeButton onClick={() => onRecord(player.playerId, true)} />
          <MissButton onClick={() => onRecord(player.playerId, false)} />
        </div>
      </div>
    );
  };

  const renderTeamSection = (players: PlayerStat[], teamName: string, isHome: boolean) => {
    if (players.length === 0) return null;

    const headerBg = isHome
      ? "bg-blue-100 dark:bg-blue-900/30"
      : "bg-orange-100 dark:bg-orange-900/30";
    const headerText = isHome
      ? "text-blue-700 dark:text-blue-300"
      : "text-orange-700 dark:text-orange-300";

    return (
      <div key={isHome ? "home" : "away"}>
        <div className={`px-4 py-2 ${headerBg}`}>
          <span className={`text-xs font-bold uppercase tracking-wide ${headerText}`}>
            {teamName}
          </span>
        </div>
        {players.map(renderPlayer)}
      </div>
    );
  };

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
          <>
            {renderTeamSection(homePlayers, homeTeamName, true)}
            {renderTeamSection(awayPlayers, awayTeamName, false)}
          </>
        )}
      </ModalBody>

      <ModalFooter>
        <ModalCancelButton onClick={onClose} />
      </ModalFooter>
    </BaseModal>
  );
};

export default ShotRecordingModal;
