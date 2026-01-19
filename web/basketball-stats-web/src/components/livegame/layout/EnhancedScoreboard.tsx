import React, { useEffect, useRef, useState } from "react";
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
} from "@heroicons/react/24/solid";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { TeamStatsData, GameStatus } from "../../../types/livegame";
import { BonusIndicator } from "../utility/BonusIndicator";
import { TimeoutDots } from "../utility/TimeoutDots";
import { GameClock } from "../clocks/GameClock";
import { ShotClock } from "../clocks/ShotClock";

// ============================================================================
// Types
// ============================================================================

interface GameData {
  status: GameStatus;
  currentQuarter: number;
  timeRemainingSeconds: number;
  homeScore: number;
  awayScore: number;
  homeTeam?: { _id?: Id<"teams">; name: string } | null;
  awayTeam?: { _id?: Id<"teams">; name: string } | null;
}

interface EnhancedScoreboardProps {
  game: GameData;
  homeTeamStats: TeamStatsData;
  awayTeamStats: TeamStatsData;
  timeoutsPerTeam: number;
  onGameControl: (action: "start" | "pause" | "resume" | "end") => void;
  onTimeoutHome?: () => void;
  onTimeoutAway?: () => void;
  onQuarterChange?: (quarter: number) => void;
  showShotClock?: boolean;
  shotClockSeconds?: number;
  quartersCompleted?: number[];
}

// ============================================================================
// Helper Functions
// ============================================================================

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const formatQuarter = (quarter: number): string => {
  if (quarter <= 4) return `Q${quarter}`;
  return `OT${quarter - 4}`;
};

// ============================================================================
// Animated Score Component
// ============================================================================

interface AnimatedScoreProps {
  score: number;
  className?: string;
}

const AnimatedScore: React.FC<AnimatedScoreProps> = ({ score, className = "" }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const prevScore = useRef(score);

  useEffect(() => {
    if (score !== prevScore.current) {
      setIsAnimating(true);
      prevScore.current = score;
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [score]);

  return (
    <span
      className={`tabular-nums transition-transform duration-300 ${
        isAnimating ? "scale-125" : "scale-100"
      } ${className}`}
    >
      {score}
    </span>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const EnhancedScoreboard: React.FC<EnhancedScoreboardProps> = ({
  game,
  homeTeamStats,
  awayTeamStats,
  timeoutsPerTeam,
  onGameControl,
  onTimeoutHome,
  onTimeoutAway,
  onQuarterChange,
  showShotClock = false,
  shotClockSeconds = 24,
  quartersCompleted = [],
}) => {
  const [showQuarterSelector, setShowQuarterSelector] = useState(false);

  const isActive = game.status === "active";
  const isPaused = game.status === "paused";
  const isCompleted = game.status === "completed";
  const isScheduled = game.status === "scheduled";

  const canStart = isScheduled;
  const canPause = isActive;
  const canResume = isPaused;
  const canEnd = isActive || isPaused;

  // Score differential
  const differential = game.homeScore - game.awayScore;
  const diffText = differential > 0 ? `+${differential}` : differential < 0 ? `${differential}` : "TIE";

  return (
    <div className="bg-gray-900 rounded-xl px-4 py-3 border border-gray-700 h-20 flex items-center">
      <div className="flex items-center justify-between w-full">
        {/* Away Team */}
        <div className="flex items-center gap-3 flex-1">
          <AnimatedScore
            score={game.awayScore}
            className="text-4xl font-bold text-white w-14 text-center"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-gray-400 truncate max-w-[100px]">
              {game.awayTeam?.name || "Away"}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-gray-500">
                TF: {awayTeamStats.foulsThisQuarter}
              </span>
              <BonusIndicator
                inBonus={awayTeamStats.inBonus}
                inDoubleBonus={awayTeamStats.inDoubleBonus}
              />
            </div>
            <div className="flex items-center gap-1 mt-1">
              <TimeoutDots
                remaining={awayTeamStats.timeoutsRemaining}
                total={timeoutsPerTeam}
                teamSide="left"
                onTimeoutClick={onTimeoutAway}
                disabled={isCompleted}
              />
              {!isCompleted && onTimeoutAway && (
                <button
                  onClick={onTimeoutAway}
                  className="text-[10px] text-orange-500 hover:text-orange-400 font-medium ml-1"
                >
                  TO
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Center: Clock, Quarter, Status, Controls */}
        <div className="flex flex-col items-center gap-1 px-4">
          {/* Status Badge */}
          <div
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
              isActive
                ? "bg-red-600 text-white animate-pulse"
                : isPaused
                  ? "bg-yellow-600 text-white"
                  : isCompleted
                    ? "bg-gray-600 text-white"
                    : "bg-blue-600 text-white"
            }`}
          >
            {isActive ? "LIVE" : isPaused ? "PAUSED" : isCompleted ? "FINAL" : "PRE-GAME"}
          </div>

          {/* Clock Row */}
          <div className="flex items-center gap-2">
            {/* Game Clock */}
            <GameClock
              displayTime={formatTime(game.timeRemainingSeconds)}
              isRunning={isActive}
              size="md"
            />

            {/* Shot Clock */}
            {showShotClock && (isActive || isPaused) && (
              <ShotClock
                seconds={shotClockSeconds}
                isRunning={isActive}
                isWarning={shotClockSeconds <= 5}
                isViolation={shotClockSeconds === 0}
                size="md"
              />
            )}
          </div>

          {/* Quarter Selector & Controls Row */}
          <div className="flex items-center gap-2">
            {/* Quarter Dots */}
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((q) => (
                <div
                  key={q}
                  className={`w-1.5 h-1.5 rounded-full ${
                    quartersCompleted.includes(q)
                      ? "bg-green-500"
                      : game.currentQuarter === q
                        ? "bg-orange-500"
                        : "bg-gray-600"
                  }`}
                />
              ))}
            </div>

            {/* Quarter Button */}
            <div className="relative">
              <button
                onClick={() => !isCompleted && setShowQuarterSelector(!showQuarterSelector)}
                disabled={isCompleted}
                className={`text-sm font-bold px-2 py-0.5 rounded text-gray-300 ${
                  !isCompleted ? "hover:bg-gray-700 cursor-pointer" : ""
                }`}
              >
                {formatQuarter(game.currentQuarter)}
              </button>
              {showQuarterSelector && onQuarterChange && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-20 p-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          onQuarterChange(q);
                          setShowQuarterSelector(false);
                        }}
                        className={`w-8 h-8 rounded font-bold text-sm ${
                          game.currentQuarter === q
                            ? "bg-orange-600 text-white"
                            : quartersCompleted.includes(q)
                              ? "bg-green-900/50 text-green-400"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Control Buttons */}
            {!isCompleted && (
              <div className="flex gap-1">
                {canStart && (
                  <button
                    onClick={() => onGameControl("start")}
                    className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    title="Start Game"
                  >
                    <PlayIcon className="h-4 w-4" />
                  </button>
                )}
                {canPause && (
                  <button
                    onClick={() => onGameControl("pause")}
                    className="p-1.5 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                    title="Pause"
                  >
                    <PauseIcon className="h-4 w-4" />
                  </button>
                )}
                {canResume && (
                  <button
                    onClick={() => onGameControl("resume")}
                    className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    title="Resume"
                  >
                    <PlayIcon className="h-4 w-4" />
                  </button>
                )}
                {canEnd && (
                  <button
                    onClick={() => onGameControl("end")}
                    className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    title="End Period"
                  >
                    <StopIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Home Team */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="flex flex-col items-end min-w-0">
            <span className="text-sm font-medium text-gray-400 truncate max-w-[100px]">
              {game.homeTeam?.name || "Home"}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <BonusIndicator
                inBonus={homeTeamStats.inBonus}
                inDoubleBonus={homeTeamStats.inDoubleBonus}
              />
              <span className="text-[10px] text-gray-500">
                TF: {homeTeamStats.foulsThisQuarter}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              {!isCompleted && onTimeoutHome && (
                <button
                  onClick={onTimeoutHome}
                  className="text-[10px] text-orange-500 hover:text-orange-400 font-medium mr-1"
                >
                  TO
                </button>
              )}
              <TimeoutDots
                remaining={homeTeamStats.timeoutsRemaining}
                total={timeoutsPerTeam}
                teamSide="right"
                onTimeoutClick={onTimeoutHome}
                disabled={isCompleted}
              />
            </div>
          </div>
          <AnimatedScore
            score={game.homeScore}
            className="text-4xl font-bold text-white w-14 text-center"
          />
        </div>
      </div>

      {/* Score Differential Badge */}
      <div
        className={`absolute top-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-bold ${
          differential > 0
            ? "bg-green-900/50 text-green-400"
            : differential < 0
              ? "bg-red-900/50 text-red-400"
              : "bg-gray-700 text-gray-400"
        }`}
      >
        {diffText}
      </div>
    </div>
  );
};

export default EnhancedScoreboard;
