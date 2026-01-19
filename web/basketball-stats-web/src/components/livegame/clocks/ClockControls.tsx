import React from "react";
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/solid";

interface ClockControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onResetShotClock?: (to24: boolean) => void;
  size?: "sm" | "md";
  showShotClockReset?: boolean;
}

/**
 * Game control buttons for starting, pausing, resuming, and ending the game.
 * Optionally includes shot clock reset buttons (24s / 14s).
 */
export const ClockControls: React.FC<ClockControlsProps> = ({
  isRunning,
  isPaused,
  isCompleted,
  onStart,
  onPause,
  onResume,
  onEnd,
  onResetShotClock,
  size = "md",
  showShotClockReset = false,
}) => {
  const buttonSize = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const smallButtonSize = size === "sm" ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs";

  if (isCompleted) {
    return (
      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium px-3">
        FINAL
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {/* Play/Pause Button */}
      {!isRunning && !isPaused ? (
        <button
          onClick={onStart}
          className={`${buttonSize} rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center transition-colors active:scale-95`}
          title="Start game"
        >
          <PlayIcon className={iconSize} />
        </button>
      ) : isRunning ? (
        <button
          onClick={onPause}
          className={`${buttonSize} rounded-full bg-yellow-500 hover:bg-yellow-600 text-black flex items-center justify-center transition-colors active:scale-95`}
          title="Pause game"
        >
          <PauseIcon className={iconSize} />
        </button>
      ) : (
        <button
          onClick={onResume}
          className={`${buttonSize} rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center transition-colors active:scale-95`}
          title="Resume game"
        >
          <PlayIcon className={iconSize} />
        </button>
      )}

      {/* Stop Button (only when running or paused) */}
      {(isRunning || isPaused) && (
        <button
          onClick={onEnd}
          className={`${buttonSize} rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors active:scale-95`}
          title="End period"
        >
          <StopIcon className={iconSize} />
        </button>
      )}

      {/* Shot Clock Reset Buttons */}
      {showShotClockReset && onResetShotClock && (isRunning || isPaused) && (
        <>
          <div className="w-px h-6 bg-gray-600 mx-1" />
          <button
            onClick={() => onResetShotClock(true)}
            className={`${smallButtonSize} rounded bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold flex items-center justify-center transition-colors active:scale-95`}
            title="Reset shot clock to 24"
          >
            24
          </button>
          <button
            onClick={() => onResetShotClock(false)}
            className={`${smallButtonSize} rounded bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold flex items-center justify-center transition-colors active:scale-95`}
            title="Reset shot clock to 14"
          >
            14
          </button>
        </>
      )}
    </div>
  );
};

export default ClockControls;
