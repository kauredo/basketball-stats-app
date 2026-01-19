import React from "react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { PlayerStat, StatType } from "../../../types/livegame";

interface QuickStatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecord: (playerId: Id<"players">) => void;
  statType: StatType | null;
  onCourtPlayers: PlayerStat[];
}

const getStatInfo = (type: StatType) => {
  switch (type) {
    case "assist":
      return { label: "Assist", color: "purple", bgClass: "bg-purple-600" };
    case "steal":
      return { label: "Steal", color: "cyan", bgClass: "bg-cyan-600" };
    case "block":
      return { label: "Block", color: "cyan", bgClass: "bg-cyan-600" };
    case "turnover":
      return { label: "Turnover", color: "amber", bgClass: "bg-amber-600" };
    case "foul":
      return { label: "Foul", color: "red", bgClass: "bg-red-600" };
    case "freethrow":
      return { label: "Free Throw", color: "green", bgClass: "bg-green-600" };
    case "rebound":
      return { label: "Rebound", color: "blue", bgClass: "bg-blue-600" };
    default:
      return { label: type, color: "gray", bgClass: "bg-gray-600" };
  }
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
  if (!isOpen || !statType) return null;

  const { label, color, bgClass } = getStatInfo(statType);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 ${bgClass}`}>
          <h3 className="text-lg font-bold text-white">Record {label}</h3>
          <p className="text-white/80 text-sm">Select a player</p>
        </div>

        {/* Player list */}
        <div className="max-h-80 overflow-y-auto">
          {onCourtPlayers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No players on court</div>
          ) : (
            onCourtPlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => onRecord(player.playerId)}
                className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      #{player.player?.number}
                    </span>
                  </div>
                  <div className="text-left">
                    <div className="text-gray-900 dark:text-white font-medium text-sm">
                      {player.player?.name}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {player.isHomeTeam ? "Home" : "Away"}
                    </div>
                  </div>
                </div>
                <div
                  className={`px-3 py-1 bg-${color}-100 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-300 text-sm font-medium rounded-lg`}
                >
                  +{label.toUpperCase().slice(0, 3)}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Cancel button */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickStatModal;
