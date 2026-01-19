import React from "react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { PlayerStat } from "../../../types/livegame";

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
  if (!isOpen) return null;

  const points = shotType === "3pt" ? 3 : 2;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header with zone info */}
        <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {shotType === "3pt" ? "3-Point Shot" : "2-Point Shot"}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Shot from{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {zoneName}
                </span>
              </p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-bold ${
                shotType === "3pt"
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                  : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              }`}
            >
              +{points} PTS
            </div>
          </div>
        </div>

        {/* Player list with made/missed buttons */}
        <div className="max-h-80 overflow-y-auto">
          {onCourtPlayers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No players on court</div>
          ) : (
            onCourtPlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      #{player.player?.number}
                    </span>
                  </div>
                  <div>
                    <div className="text-gray-900 dark:text-white font-medium text-sm">
                      {player.player?.name}
                    </div>
                    <div className="text-gray-500 text-xs">{player.points} PTS</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onRecord(player.playerId, true)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors active:scale-95"
                  >
                    MADE
                  </button>
                  <button
                    onClick={() => onRecord(player.playerId, false)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors active:scale-95"
                  >
                    MISS
                  </button>
                </div>
              </div>
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

export default ShotRecordingModal;
