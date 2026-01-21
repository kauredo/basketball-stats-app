import React from "react";
import { PlayIcon, PauseIcon, StopIcon } from "@heroicons/react/24/solid";
import type { GameStatus } from "../../types/livegame";

interface ClockModeContentProps {
  // Clock state
  timeRemainingSeconds: number;
  shotClockSeconds: number;
  shotClockFormatted?: string; // Formatted display like "24.0"
  shotClockIsWarning?: boolean; // Is in warning state
  shotClockIsViolation?: boolean; // Is at 0 (violation)
  showViolationButton?: boolean; // Show the retroactive stop button
  violationGameTime?: number | null; // Game time when violation occurred
  onViolationPause?: () => void; // Handler for retroactive pause
  currentQuarter: number;
  status: GameStatus;

  // Controls
  onGameControl: (action: "start" | "pause" | "resume" | "end") => void;
  onResetShotClock?: (seconds?: number) => void;
  onEndPeriod?: () => void;
  // Time editing
  onEditGameClock?: () => void;
  onEditShotClock?: () => void;
}

/**
 * Clock mode content - dedicated view for clock management
 * Designed for use on a separate device/screen during games.
 * Features large, easily readable displays optimized for at-a-glance viewing.
 */
export const ClockModeContent: React.FC<ClockModeContentProps> = ({
  timeRemainingSeconds,
  shotClockSeconds,
  shotClockFormatted,
  shotClockIsWarning,
  showViolationButton,
  violationGameTime,
  onViolationPause,
  currentQuarter,
  status,
  onGameControl,
  onResetShotClock,
  onEndPeriod,
  onEditGameClock,
  onEditShotClock,
}) => {
  // Format game clock time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Format quarter display
  const formatQuarter = (quarter: number): string => {
    if (quarter <= 4) return `Q${quarter}`;
    return `OT${quarter - 4}`;
  };

  const isActive = status === "active";
  const isPaused = status === "paused";
  const canStart = status === "scheduled" || status === "paused";
  const canPause = status === "active";

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* Main Clock Display */}
      <div className="h-full flex-1 flex flex-col items-center justify-center bg-surface-900 rounded-2xl p-8 min-h-[500px]">
        {/* Quarter Badge */}
        <div className="mb-4">
          <span className="px-4 py-2 bg-primary-500 text-white text-xl font-bold rounded-full">
            {formatQuarter(currentQuarter)}
          </span>
        </div>

        {/* Game Clock */}
        <div className="text-center mb-8">
          <button
            onClick={onEditGameClock}
            disabled={!onEditGameClock}
            className={`font-mono font-bold tracking-wider transition-colors ${
              timeRemainingSeconds <= 60 && isActive ? "text-red-500 animate-pulse" : "text-white"
            } ${onEditGameClock ? "hover:opacity-80 cursor-pointer" : ""}`}
            style={{ fontSize: "clamp(4rem, 15vw, 12rem)" }}
            title={onEditGameClock ? "Click to edit time" : undefined}
          >
            {formatTime(timeRemainingSeconds)}
          </button>
          <p className="text-surface-400 text-lg mt-2 uppercase tracking-widest">
            Game Clock {onEditGameClock && <span className="text-xs">(tap to edit)</span>}
          </p>
        </div>

        {/* Shot Clock */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onEditShotClock}
            disabled={!onEditShotClock}
            className={`text-center px-8 py-4 rounded-xl border-2 ${
              (shotClockIsWarning || shotClockSeconds <= 5) && isActive
                ? "bg-red-500/20 border-red-500 animate-pulse"
                : "bg-surface-800 border-surface-700"
            } ${onEditShotClock ? "hover:opacity-80 cursor-pointer" : ""}`}
            title={onEditShotClock ? "Click to edit time" : undefined}
          >
            <div
              className={`font-mono font-bold text-6xl ${
                (shotClockIsWarning || shotClockSeconds <= 5) && isActive
                  ? "text-red-500"
                  : "text-amber-400"
              }`}
            >
              {shotClockFormatted || shotClockSeconds}
            </div>
            <p className="text-surface-400 text-sm mt-1 uppercase tracking-wider">
              Shot Clock {onEditShotClock && <span className="text-xs">(tap to edit)</span>}
            </p>
          </button>

          {/* Shot Clock Reset Buttons */}
          {onResetShotClock && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onResetShotClock(24)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors"
              >
                24
              </button>
              <button
                onClick={() => onResetShotClock(14)}
                className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors"
              >
                14
              </button>
            </div>
          )}
        </div>

        {/* Violation Button - appears for 5 seconds when shot clock hits 0 */}
        {showViolationButton && onViolationPause && (
          <div className="mb-6 animate-pulse">
            <button
              onClick={onViolationPause}
              className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white text-xl font-bold rounded-xl transition-colors shadow-lg border-2 border-red-400"
            >
              <div className="flex items-center gap-3">
                <StopIcon className="w-8 h-8" />
                <div className="text-left">
                  <div>SHOT CLOCK VIOLATION</div>
                  <div className="text-sm font-normal opacity-80">
                    Tap to stop clock at {formatTime(violationGameTime ?? 0)}
                  </div>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Game Control Buttons */}
        <div className="flex gap-4">
          {canStart && (
            <button
              onClick={() => onGameControl(status === "scheduled" ? "start" : "resume")}
              className="flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-500 text-white text-xl font-bold rounded-xl transition-colors shadow-lg"
            >
              <PlayIcon className="w-8 h-8" />
              {status === "scheduled" ? "Start Game" : "Resume"}
            </button>
          )}

          {canPause && (
            <button
              onClick={() => onGameControl("pause")}
              className="flex items-center gap-2 px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white text-xl font-bold rounded-xl transition-colors shadow-lg"
            >
              <PauseIcon className="w-8 h-8" />
              Pause
            </button>
          )}

          {isPaused && onEndPeriod && (
            <button
              onClick={onEndPeriod}
              className="flex items-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-500 text-white text-xl font-bold rounded-xl transition-colors shadow-lg"
            >
              <StopIcon className="w-8 h-8" />
              End Period
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClockModeContent;
