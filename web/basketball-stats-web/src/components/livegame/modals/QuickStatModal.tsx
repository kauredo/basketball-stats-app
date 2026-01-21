import React, { useEffect, useRef } from "react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { PlayerStat, StatType } from "../../../types/livegame";
import { useFocusTrap } from "../../../hooks/useFocusTrap";

interface QuickStatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecord: (playerId: Id<"players">) => void;
  statType: StatType | null;
  onCourtPlayers: PlayerStat[];
}

const STAT_INFO: Record<StatType, { label: string; bgClass: string; badgeClass: string }> = {
  assist: {
    label: "Assist",
    bgClass: "bg-purple-600",
    badgeClass: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  },
  steal: {
    label: "Steal",
    bgClass: "bg-cyan-600",
    badgeClass: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300",
  },
  block: {
    label: "Block",
    bgClass: "bg-cyan-600",
    badgeClass: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300",
  },
  turnover: {
    label: "Turnover",
    bgClass: "bg-amber-600",
    badgeClass: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
  },
  foul: {
    label: "Foul",
    bgClass: "bg-red-600",
    badgeClass: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  },
  freethrow: {
    label: "Free Throw",
    bgClass: "bg-green-600",
    badgeClass: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  },
  rebound: {
    label: "Rebound",
    bgClass: "bg-blue-600",
    badgeClass: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  },
  shot2: {
    label: "2-Point Shot",
    bgClass: "bg-blue-600",
    badgeClass: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  },
  shot3: {
    label: "3-Point Shot",
    bgClass: "bg-purple-600",
    badgeClass: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  },
};

const getStatInfo = (type: StatType) => {
  return (
    STAT_INFO[type] || {
      label: type,
      bgClass: "bg-surface-600",
      badgeClass: "bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300",
    }
  );
};

/**
 * Generic modal for recording non-shot stats like rebounds, assists, steals, etc.
 * Shows list of on-court players for selection.
 */
export const QuickStatModal: React.FC<QuickStatModalProps> = ({
  isOpen,
  onClose,
  onRecord,
  statType,
  onCourtPlayers,
}) => {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const focusTrapRef = useFocusTrap(isOpen && !!statType, {
    initialFocusRef: cancelButtonRef,
  });

  // Handle escape key to close modal
  useEffect(() => {
    if (!isOpen || !statType) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, statType, onClose]);

  if (!isOpen || !statType) return null;

  const { label, bgClass, badgeClass } = getStatInfo(statType);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quickstat-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={focusTrapRef}
        className="bg-white dark:bg-surface-800 rounded-2xl w-full max-w-md border border-surface-200 dark:border-surface-700 overflow-hidden"
      >
        {/* Header */}
        <div className={`px-6 py-4 ${bgClass}`}>
          <h3 id="quickstat-modal-title" className="text-lg font-bold text-white">
            Record {label}
          </h3>
          <p className="text-white/80 text-sm">Select a player</p>
        </div>

        {/* Player list */}
        <div className="max-h-80 overflow-y-auto">
          {onCourtPlayers.length === 0 ? (
            <div className="p-8 text-center text-surface-500">No players on court</div>
          ) : (
            onCourtPlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => onRecord(player.playerId)}
                className="w-full flex items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-700 last:border-0 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">#{player.player?.number}</span>
                  </div>
                  <div className="text-left">
                    <div className="text-surface-900 dark:text-white font-medium text-sm">
                      {player.player?.name}
                    </div>
                    <div className="text-surface-500 text-xs">
                      {player.isHomeTeam ? "Home" : "Away"}
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 text-sm font-medium rounded-lg ${badgeClass}`}>
                  +{label.toUpperCase().slice(0, 3)}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Cancel button */}
        <div className="px-4 py-3 bg-surface-50 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700">
          <button
            ref={cancelButtonRef}
            onClick={onClose}
            className="w-full py-2.5 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickStatModal;
