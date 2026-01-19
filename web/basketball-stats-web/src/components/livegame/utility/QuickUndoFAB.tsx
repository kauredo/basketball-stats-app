import React, { useEffect, useRef, useState } from "react";
import { ArrowUturnLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { LastAction, STAT_TYPE_LABELS } from "../../../types/livegame";

interface QuickUndoFABProps {
  action: LastAction | null;
  onUndo: (action: LastAction) => void;
  onDismiss: () => void;
  autoDismissMs?: number;
}

/**
 * Floating Action Button for quick undo of the last recorded stat.
 * Auto-dismisses after configurable timeout (default 8s).
 * Shows progress bar countdown.
 */
export const QuickUndoFAB: React.FC<QuickUndoFABProps> = ({
  action,
  onUndo,
  onDismiss,
  autoDismissMs = 8000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (action) {
      // Clear existing timers
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);

      // Show animation
      setIsVisible(true);
      setProgress(100);

      // Progress countdown
      const startTime = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / autoDismissMs) * 100);
        setProgress(remaining);
      }, 50);

      // Auto-dismiss
      timeoutRef.current = setTimeout(() => {
        handleDismiss();
      }, autoDismissMs);
    } else {
      setIsVisible(false);
      setProgress(100);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [action, autoDismissMs]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeout(onDismiss, 200); // Wait for animation
  };

  const handleUndo = () => {
    if (!action) return;
    onUndo(action);
    handleDismiss();
  };

  if (!action) return null;

  const statLabel = STAT_TYPE_LABELS[action.statType] || action.statType.toUpperCase();
  const madeText =
    action.wasMade !== undefined ? (action.wasMade ? " Made" : " Missed") : "";

  return (
    <div
      className={`fixed bottom-6 left-6 z-40 transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-700 overflow-hidden min-w-[280px]">
        {/* Content */}
        <div className="flex items-center gap-3 p-3">
          {/* Undo Icon */}
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
            <ArrowUturnLeftIcon className="h-5 w-5 text-orange-500" />
          </div>

          {/* Action Text */}
          <div className="flex-1 min-w-0">
            <span className="text-gray-400 text-xs">Undo:</span>
            <p className="text-white font-semibold text-sm truncate">
              #{action.playerNumber} {statLabel}
              {madeText}
            </p>
          </div>

          {/* Undo Button */}
          <button
            onClick={handleUndo}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-lg transition-colors"
          >
            UNDO
          </button>

          {/* Dismiss Button */}
          <button
            onClick={handleDismiss}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-800">
          <div
            className="h-full bg-orange-500 transition-all duration-50"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default QuickUndoFAB;
