import React from "react";
import { FreeThrowSequence } from "../../../types/livegame";

interface FreeThrowSequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecord: (made: boolean) => void;
  sequence: FreeThrowSequence | null;
}

/**
 * Modal for tracking free throw sequences.
 * Shows current attempt (e.g., "2 of 3"), prior results, and made/missed buttons.
 * Handles 1-and-1 situations (college rules).
 */
export const FreeThrowSequenceModal: React.FC<FreeThrowSequenceModalProps> = ({
  isOpen,
  onClose,
  onRecord,
  sequence,
}) => {
  if (!isOpen || !sequence) return null;

  const { playerName, playerNumber, totalAttempts, currentAttempt, isOneAndOne, results } =
    sequence;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 px-6 py-4">
          <h3 className="text-lg font-bold text-white">Free Throw</h3>
          <p className="text-green-200 text-sm">
            #{playerNumber} {playerName}
          </p>
        </div>

        <div className="p-6">
          {/* Attempt indicator */}
          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {currentAttempt} of {totalAttempts}
            </div>
            {isOneAndOne && (
              <div className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                1-and-1 (Second FT only if first made)
              </div>
            )}
          </div>

          {/* Prior attempts */}
          {results.length > 0 && (
            <div className="flex justify-center gap-2 mb-6">
              {results.map((made, index) => (
                <div
                  key={index}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    made ? "bg-green-600" : "bg-red-600"
                  }`}
                >
                  {made ? "✓" : "✗"}
                </div>
              ))}
              {/* Current attempt placeholder */}
              <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-dashed border-gray-400 dark:border-gray-600 text-gray-400 font-bold text-sm">
                ?
              </div>
            </div>
          )}

          {/* Made/Missed buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => onRecord(true)}
              className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white text-xl font-bold rounded-xl transition-colors active:scale-95"
            >
              MADE
            </button>
            <button
              onClick={() => onRecord(false)}
              className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white text-xl font-bold rounded-xl transition-colors active:scale-95"
            >
              MISSED
            </button>
          </div>
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

export default FreeThrowSequenceModal;
