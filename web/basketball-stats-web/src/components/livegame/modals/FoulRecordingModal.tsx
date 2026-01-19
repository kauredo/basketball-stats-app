import React, { useState, useEffect } from "react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { PlayerStat, FoulType, FOUL_TYPE_LABELS } from "../../../types/livegame";

interface FoulRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecord: (
    playerId: Id<"players">,
    foulType: FoulType,
    options?: {
      wasAndOne?: boolean;
      shotType?: "2pt" | "3pt";
      fouledPlayerId?: Id<"players">;
    }
  ) => void;
  selectedPlayer: PlayerStat | null;
  opponentPlayers: PlayerStat[];
}

/**
 * Enhanced foul recording modal with foul type selection.
 * For shooting fouls, allows specifying shot type, and-one, and who was fouled.
 */
export const FoulRecordingModal: React.FC<FoulRecordingModalProps> = ({
  isOpen,
  onClose,
  onRecord,
  selectedPlayer,
  opponentPlayers,
}) => {
  const [foulType, setFoulType] = useState<FoulType>("personal");
  const [showShootingDetails, setShowShootingDetails] = useState(false);
  const [shotType, setShotType] = useState<"2pt" | "3pt">("2pt");
  const [wasAndOne, setWasAndOne] = useState(false);
  const [fouledPlayer, setFouledPlayer] = useState<Id<"players"> | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFoulType("personal");
      setShowShootingDetails(false);
      setShotType("2pt");
      setWasAndOne(false);
      setFouledPlayer(null);
    }
  }, [isOpen]);

  if (!isOpen || !selectedPlayer) return null;

  const handleFoulTypeSelect = (type: FoulType) => {
    setFoulType(type);
    if (type === "shooting") {
      setShowShootingDetails(true);
    } else {
      setShowShootingDetails(false);
      onRecord(selectedPlayer.playerId, type);
      onClose();
    }
  };

  const handleShootingFoulConfirm = () => {
    if (!fouledPlayer) return;
    onRecord(selectedPlayer.playerId, "shooting", {
      wasAndOne,
      shotType,
      fouledPlayerId: fouledPlayer,
    });
    onClose();
  };

  const opponentOnCourt = opponentPlayers.filter((p) => p.isOnCourt);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-amber-600 px-6 py-4">
          <h3 className="text-lg font-bold text-white">
            FOUL - #{selectedPlayer.player?.number} {selectedPlayer.player?.name}
          </h3>
          <p className="text-amber-200 text-sm">
            Current fouls: {selectedPlayer.fouls}
          </p>
        </div>

        {!showShootingDetails ? (
          /* Foul Type Selection */
          <div className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Select foul type:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(FOUL_TYPE_LABELS) as FoulType[]).map((type) => {
                const colorClasses: Record<FoulType, string> = {
                  personal:
                    "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white",
                  shooting:
                    "bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300",
                  offensive:
                    "bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300",
                  technical:
                    "bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300",
                  flagrant1:
                    "bg-red-200 dark:bg-red-800/30 hover:bg-red-300 dark:hover:bg-red-800/50 text-red-800 dark:text-red-200",
                  flagrant2:
                    "bg-red-300 dark:bg-red-700/30 hover:bg-red-400 dark:hover:bg-red-700/50 text-red-900 dark:text-red-100",
                };

                return (
                  <button
                    key={type}
                    onClick={() => handleFoulTypeSelect(type)}
                    className={`py-3 px-4 rounded-lg font-medium transition-colors active:scale-95 ${colorClasses[type]}`}
                  >
                    {FOUL_TYPE_LABELS[type]}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Shooting Foul Details */
          <div className="p-4">
            <button
              onClick={() => setShowShootingDetails(false)}
              className="text-sm text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-1"
            >
              ← Back to foul types
            </button>

            <div className="space-y-4">
              {/* Shot Type */}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Shot type:
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShotType("2pt")}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      shotType === "2pt"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    2PT
                  </button>
                  <button
                    onClick={() => setShotType("3pt")}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      shotType === "3pt"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    3PT
                  </button>
                </div>
              </div>

              {/* And-1 */}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  And-1? (shot was made)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setWasAndOne(false)}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      !wasAndOne
                        ? "bg-red-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    No
                  </button>
                  <button
                    onClick={() => setWasAndOne(true)}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      wasAndOne
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    Yes (And-1)
                  </button>
                </div>
              </div>

              {/* Who was fouled */}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Who was fouled?
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {opponentOnCourt.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => setFouledPlayer(player.playerId)}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg transition-colors ${
                        fouledPlayer === player.playerId
                          ? "bg-green-100 dark:bg-green-900/30 border-2 border-green-500"
                          : "bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <span className="font-bold text-sm text-gray-900 dark:text-white">
                        #{player.player?.number}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {player.player?.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleShootingFoulConfirm}
                disabled={!fouledPlayer}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-bold rounded-lg transition-colors"
              >
                Confirm Shooting Foul
              </button>
            </div>
          </div>
        )}

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

export default FoulRecordingModal;
