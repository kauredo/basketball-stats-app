import React, { useEffect, useState, useRef } from "react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { PlayerStat, StatType } from "../../../types/livegame";
import { useFocusTrap } from "../../../hooks/useFocusTrap";

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
  const focusTrapRef = useFocusTrap(isOpen, {
    initialFocusRef: dismissButtonRef,
  });

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

  // Handle escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Focus management - focus dismiss button when modal opens
  useEffect(() => {
    if (isOpen && dismissButtonRef.current) {
      dismissButtonRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const shooterOnCourt = shooterTeamPlayers.filter((p) => p.isOnCourt);
  const opposingOnCourt = opposingTeamPlayers.filter((p) => p.isOnCourt);

  const getShotTypeLabel = (type: StatType) => {
    if (type === "shot3") return "3PT";
    if (type === "freethrow") return "FT";
    return "2PT";
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rebound-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={focusTrapRef}
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4">
          <h3 id="rebound-modal-title" className="text-lg font-bold text-white">Rebound</h3>
          <p className="text-blue-200 text-sm">Missed {getShotTypeLabel(shotType)}</p>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {/* Offensive Rebound - Shooter's Team */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-orange-600 dark:text-orange-400 text-sm">
                OFFENSIVE ({shooterTeamName})
              </h4>
              <button
                onClick={() => onTeamRebound(shooterTeamId, "offensive")}
                className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium rounded hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
              >
                TEAM
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {shooterOnCourt.map((player) => (
                <button
                  key={player.id}
                  onClick={() => onPlayerRebound(player.playerId, "offensive")}
                  className="px-3 py-2 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 border border-orange-200 dark:border-orange-700 rounded-lg text-sm font-medium text-gray-900 dark:text-white transition-colors active:scale-95"
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
                  className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-lg text-sm font-medium text-gray-900 dark:text-white transition-colors active:scale-95"
                >
                  #{player.player?.number}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <button
            ref={dismissButtonRef}
            onClick={onClose}
            className="w-full py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          >
            Dismiss / No Rebound
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReboundPromptModal;
