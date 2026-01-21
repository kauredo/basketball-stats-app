import React, { useEffect, useState, useRef } from "react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { PlayerStat, StatType } from "../../../types/livegame";
import {
  BaseModal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCancelButton,
} from "../../ui/BaseModal";

interface ReboundPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayerRebound: (playerId: Id<"players">, type: "offensive" | "defensive") => void;
  onTeamRebound: (teamId: Id<"teams">, type: "offensive" | "defensive") => void;
  shooterTeamId: Id<"teams">;
  shooterTeamName: string;
  opposingTeamId: Id<"teams">;
  opposingTeamName: string;
  shooterTeamPlayers: PlayerStat[];
  opposingTeamPlayers: PlayerStat[];
  shotType: StatType;
  autoDismissMs?: number;
}

/**
 * Modal that appears after a missed shot to record a rebound.
 * Shows two sections: offensive (shooter's team) and defensive (opposing team).
 * Auto-dismisses after configurable timeout (default 8s).
 */
export const ReboundPromptModal: React.FC<ReboundPromptModalProps> = ({
  isOpen,
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
}) => {
  const [autoDismissTimer, setAutoDismissTimer] = useState<number | null>(null);
  const dismissButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Auto-dismiss after timeout
      const timer = window.setTimeout(() => {
        onClose();
      }, autoDismissMs);
      setAutoDismissTimer(timer as unknown as number);
      return () => window.clearTimeout(timer);
    }
    return () => {
      if (autoDismissTimer) window.clearTimeout(autoDismissTimer);
    };
  }, [isOpen, autoDismissMs]);

  const shooterOnCourt = shooterTeamPlayers.filter((p) => p.isOnCourt);
  const opposingOnCourt = opposingTeamPlayers.filter((p) => p.isOnCourt);

  const getShotTypeLabel = (type: StatType) => {
    if (type === "shot3") return "3PT";
    if (type === "freethrow") return "FT";
    return "2PT";
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Rebound"
      maxWidth="lg"
      initialFocusRef={dismissButtonRef}
    >
      <ModalHeader
        title="Rebound"
        subtitle={`Missed ${getShotTypeLabel(shotType)}`}
        variant="info"
      />

      <ModalBody maxHeight="max-h-80">
        {/* Offensive Rebound - Shooter's Team */}
        <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-primary-600 dark:text-primary-400 text-sm">
              OFFENSIVE ({shooterTeamName})
            </h4>
            <button
              onClick={() => onTeamRebound(shooterTeamId, "offensive")}
              className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-medium rounded hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
            >
              TEAM
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {shooterOnCourt.map((player) => (
              <button
                key={player.id}
                onClick={() => onPlayerRebound(player.playerId, "offensive")}
                className="px-3 py-2 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 border border-primary-200 dark:border-primary-700 rounded-lg text-sm font-medium text-surface-900 dark:text-white transition-colors active:scale-95"
              >
                #{player.player?.number}
              </button>
            ))}
          </div>
        </div>

        {/* Defensive Rebound - Opposing Team */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-blue-600 dark:text-blue-400 text-sm">
              DEFENSIVE ({opposingTeamName})
            </h4>
            <button
              onClick={() => onTeamRebound(opposingTeamId, "defensive")}
              className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
              TEAM
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {opposingOnCourt.map((player) => (
              <button
                key={player.id}
                onClick={() => onPlayerRebound(player.playerId, "defensive")}
                className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-lg text-sm font-medium text-surface-900 dark:text-white transition-colors active:scale-95"
              >
                #{player.player?.number}
              </button>
            ))}
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <ModalCancelButton onClick={onClose}>Dismiss / No Rebound</ModalCancelButton>
      </ModalFooter>
    </BaseModal>
  );
};

export default ReboundPromptModal;
