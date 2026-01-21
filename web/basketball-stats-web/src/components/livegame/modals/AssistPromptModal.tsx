import React, { useEffect, useRef } from "react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { PlayerStat } from "../../../types/livegame";
import { useFocusTrap } from "../../../hooks/useFocusTrap";

interface AssistPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssist: (playerId: Id<"players">) => void;
  onNoAssist: () => void;
  scorerName: string;
  scorerNumber: number;
  shotType: string;
  points: number;
  teammates: PlayerStat[];
}

/**
 * Modal that appears after a made shot to record an assist.
 * Shows scorer info and list of teammates to select the assister.
 */
export const AssistPromptModal: React.FC<AssistPromptModalProps> = ({
  isOpen,
  onClose,
  onAssist,
  onNoAssist,
  scorerName,
  scorerNumber,
  shotType,
  points,
  teammates,
}) => {
  const noAssistButtonRef = useRef<HTMLButtonElement>(null);
  const focusTrapRef = useFocusTrap(isOpen, {
    initialFocusRef: noAssistButtonRef,
  });

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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assist-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={focusTrapRef}
        className="bg-white dark:bg-surface-800 rounded-2xl w-full max-w-md border border-surface-200 dark:border-surface-700 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-green-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 id="assist-modal-title" className="text-lg font-bold text-white">
                Assist?
              </h3>
              <p className="text-green-200 text-sm">
                #{scorerNumber} {scorerName} scored {points}PT
              </p>
            </div>
            <div className="px-3 py-1 bg-white/20 rounded-full text-white text-sm font-bold">
              +{points} PTS
            </div>
          </div>
        </div>

        {/* Teammate list for assist */}
        <div className="max-h-60 overflow-y-auto">
          <div className="px-4 py-2 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700">
            <span className="text-xs text-surface-500 uppercase">Who assisted?</span>
          </div>
          {teammates.length === 0 ? (
            <div className="p-6 text-center text-surface-500">No other players on court</div>
          ) : (
            teammates.map((player) => (
              <button
                key={player.id}
                onClick={() => onAssist(player.playerId)}
                className="w-full flex items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-700 last:border-0 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">#{player.player?.number}</span>
                  </div>
                  <div className="text-left">
                    <div className="text-surface-900 dark:text-white font-medium text-sm">
                      {player.player?.name}
                    </div>
                    <div className="text-surface-500 text-xs">{player.assists} AST</div>
                  </div>
                </div>
                <div className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium rounded-lg">
                  +AST
                </div>
              </button>
            ))
          )}
        </div>

        {/* No assist / Cancel */}
        <div className="px-4 py-3 bg-surface-50 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700 flex gap-2">
          <button
            ref={noAssistButtonRef}
            onClick={onNoAssist}
            className="flex-1 py-2.5 bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300 font-medium rounded-lg hover:bg-surface-300 dark:hover:bg-surface-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            No Assist
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssistPromptModal;
