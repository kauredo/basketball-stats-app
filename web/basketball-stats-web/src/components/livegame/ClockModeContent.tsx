import React from "react";
import { PlayIcon, PauseIcon, StopIcon, ClockIcon } from "@heroicons/react/24/solid";
import { GameStatus } from "../../types/livegame";

interface ClockModeContentProps {
  // Clock state
  timeRemainingSeconds: number;
  shotClockSeconds: number;
  currentQuarter: number;
  status: GameStatus;
  isOvertime: boolean;

  // Scores
  homeScore: number;
  awayScore: number;
  homeTeamName: string;
  awayTeamName: string;

  // Timeouts
  homeTimeoutsRemaining: number;
  awayTimeoutsRemaining: number;

  // Controls
  onGameControl: (action: "start" | "pause" | "resume" | "end") => void;
  onTimeoutHome?: () => void;
  onTimeoutAway?: () => void;
  onResetShotClock?: (seconds?: number) => void;
  onEndPeriod?: () => void;
}

/**
 * Clock mode content - dedicated view for clock management
 * Designed for use on a separate device/screen during games.
 * Features large, easily readable displays optimized for at-a-glance viewing.
 */
export const ClockModeContent: React.FC<ClockModeContentProps> = ({
  timeRemainingSeconds,
  shotClockSeconds,
  currentQuarter,
  status,
  isOvertime,
  homeScore,
  awayScore,
  homeTeamName,
  awayTeamName,
  homeTimeoutsRemaining,
  awayTimeoutsRemaining,
  onGameControl,
  onTimeoutHome,
  onTimeoutAway,
  onResetShotClock,
  onEndPeriod,
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
      <div className="flex-1 flex flex-col items-center justify-center bg-surface-900 rounded-2xl p-8 min-h-[300px]">
        {/* Quarter Badge */}
        <div className="mb-4">
          <span className="px-4 py-2 bg-primary-500 text-white text-xl font-bold rounded-full">
            {formatQuarter(currentQuarter)}
          </span>
        </div>

        {/* Game Clock */}
        <div className="text-center mb-8">
          <div
            className={`font-mono font-bold tracking-wider transition-colors ${
              timeRemainingSeconds <= 60 && isActive ? "text-red-500 animate-pulse" : "text-white"
            }`}
            style={{ fontSize: "clamp(4rem, 15vw, 12rem)" }}
          >
            {formatTime(timeRemainingSeconds)}
          </div>
          <p className="text-surface-400 text-lg mt-2 uppercase tracking-widest">Game Clock</p>
        </div>

        {/* Shot Clock */}
        <div className="flex items-center gap-4 mb-8">
          <div
            className={`text-center px-8 py-4 rounded-xl border-2 ${
              shotClockSeconds <= 5 && isActive
                ? "bg-red-500/20 border-red-500 animate-pulse"
                : "bg-surface-800 border-surface-700"
            }`}
          >
            <div
              className={`font-mono font-bold text-6xl ${
                shotClockSeconds <= 5 && isActive ? "text-red-500" : "text-amber-400"
              }`}
            >
              {shotClockSeconds}
            </div>
            <p className="text-surface-400 text-sm mt-1 uppercase tracking-wider">Shot Clock</p>
          </div>

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

      {/* Score Display */}
      <div className="grid grid-cols-3 gap-4">
        {/* Away Team */}
        <div className="bg-white dark:bg-surface-800 rounded-xl p-6 text-center border border-surface-200 dark:border-surface-700">
          <p className="text-surface-500 dark:text-surface-400 text-sm font-semibold uppercase tracking-wider mb-2">
            {awayTeamName}
          </p>
          <p className="text-5xl font-bold text-surface-900 dark:text-white">{awayScore}</p>
          {onTimeoutAway && (
            <button
              onClick={onTimeoutAway}
              disabled={awayTimeoutsRemaining === 0}
              className="mt-4 px-4 py-2 bg-surface-200 dark:bg-surface-700 hover:bg-surface-300 dark:hover:bg-surface-600 text-surface-900 dark:text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Timeout ({awayTimeoutsRemaining})
            </button>
          )}
        </div>

        {/* VS / Clock Icon */}
        <div className="flex flex-col items-center justify-center">
          <ClockIcon className="w-12 h-12 text-surface-400 dark:text-surface-600" />
          <span className="text-surface-400 dark:text-surface-500 text-2xl font-bold mt-2">VS</span>
        </div>

        {/* Home Team */}
        <div className="bg-white dark:bg-surface-800 rounded-xl p-6 text-center border border-surface-200 dark:border-surface-700">
          <p className="text-surface-500 dark:text-surface-400 text-sm font-semibold uppercase tracking-wider mb-2">
            {homeTeamName}
          </p>
          <p className="text-5xl font-bold text-surface-900 dark:text-white">{homeScore}</p>
          {onTimeoutHome && (
            <button
              onClick={onTimeoutHome}
              disabled={homeTimeoutsRemaining === 0}
              className="mt-4 px-4 py-2 bg-surface-200 dark:bg-surface-700 hover:bg-surface-300 dark:hover:bg-surface-600 text-surface-900 dark:text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Timeout ({homeTimeoutsRemaining})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClockModeContent;
