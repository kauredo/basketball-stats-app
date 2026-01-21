import React, { useEffect, useRef, useState } from "react";
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowPathIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/solid";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { TeamStatsData, GameStatus } from "../../../types/livegame";
import { BonusIndicator } from "../utility/BonusIndicator";
import { TimeoutDots } from "../utility/TimeoutDots";
import { GameClock } from "../clocks/GameClock";
import { ShotClock } from "../clocks/ShotClock";
import { BaseModal, ModalHeader, ModalBody, ModalFooter } from "../../ui/BaseModal";

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
  onGameControl: (action: "start" | "pause" | "resume" | "end" | "reactivate") => void;
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
  isWinning?: boolean;
}

const AnimatedScore: React.FC<AnimatedScoreProps> = ({ score, isWinning = false }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const prevScore = useRef(score);

  useEffect(() => {
    if (score !== prevScore.current) {
      setIsAnimating(true);
      prevScore.current = score;
      const timer = setTimeout(() => setIsAnimating(false), 400);
      return () => clearTimeout(timer);
    }
  }, [score]);

  return (
    <div className="relative">
      <span
        className={`
          font-mono text-4xl sm:text-5xl font-black tabular-nums tracking-tight
          transition-all duration-300 ease-out
          ${isAnimating ? "scale-110 text-primary-500" : "scale-100"}
          ${isWinning ? "text-emerald-600 dark:text-emerald-400" : "text-surface-900 dark:text-white"}
        `}
      >
        {score}
      </span>
      {isAnimating && (
        <span className="absolute inset-0 font-mono text-4xl sm:text-5xl font-black tabular-nums tracking-tight text-primary-500 animate-ping opacity-50">
          {score}
        </span>
      )}
    </div>
  );
};

// ============================================================================
// Team Panel Component
// ============================================================================

interface TeamPanelProps {
  name: string;
  score: number;
  isWinning: boolean;
  fouls: number;
  inBonus: boolean;
  inDoubleBonus: boolean;
  timeoutsRemaining: number;
  totalTimeouts: number;
  onTimeout?: () => void;
  disabled: boolean;
  isHome?: boolean;
}

const TeamPanel: React.FC<TeamPanelProps> = ({
  name,
  score,
  isWinning,
  fouls,
  inBonus,
  inDoubleBonus,
  timeoutsRemaining,
  totalTimeouts,
  onTimeout,
  disabled,
  isHome = false,
}) => {
  return (
    <div className={`flex items-center gap-3 sm:gap-4 ${isHome ? "flex-row-reverse" : ""}`}>
      {/* Score */}
      <AnimatedScore score={score} isWinning={isWinning} />

      {/* Team Info */}
      <div className={`flex flex-col gap-1 ${isHome ? "items-end" : "items-start"}`}>
        {/* Team Name */}
        <span
          className="text-sm font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wide truncate max-w-[100px] sm:max-w-[120px]"
          title={name}
        >
          {name}
        </span>

        {/* Stats Row */}
        <div className={`flex items-center gap-2 ${isHome ? "flex-row-reverse" : ""}`}>
          {/* Fouls */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-surface-500 dark:text-surface-500 uppercase">
              Fouls
            </span>
            <span
              className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                fouls >= 4
                  ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
                  : "bg-surface-200 dark:bg-surface-700/50 text-surface-600 dark:text-surface-400"
              }`}
            >
              {fouls}
            </span>
          </div>

          {/* Bonus */}
          <BonusIndicator inBonus={inBonus} inDoubleBonus={inDoubleBonus} />
        </div>

        {/* Timeouts */}
        <div className={`flex items-center gap-1.5 ${isHome ? "flex-row-reverse" : ""}`}>
          <TimeoutDots
            remaining={timeoutsRemaining}
            total={totalTimeouts}
            teamSide={isHome ? "right" : "left"}
            onTimeoutClick={onTimeout}
            disabled={disabled}
          />
          {!disabled && onTimeout && (
            <button
              onClick={onTimeout}
              aria-label="Call timeout"
              className="text-[10px] px-2.5 py-1.5 min-h-[32px] min-w-[32px] rounded bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-500/30 font-semibold uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              TO
            </button>
          )}
        </div>
      </div>
    </div>
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
  const [showEndPeriodModal, setShowEndPeriodModal] = useState(false);
  const [showReactivateConfirm, setShowReactivateConfirm] = useState(false);
  const quarterSelectorRef = useRef<HTMLDivElement>(null);
  const quarterButtonRef = useRef<HTMLButtonElement>(null);
  const [focusedQuarter, setFocusedQuarter] = useState<number | null>(null);

  // Handle escape key and click outside for quarter selector
  useEffect(() => {
    if (!showQuarterSelector) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowQuarterSelector(false);
        quarterButtonRef.current?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        quarterSelectorRef.current &&
        !quarterSelectorRef.current.contains(e.target as Node) &&
        quarterButtonRef.current &&
        !quarterButtonRef.current.contains(e.target as Node)
      ) {
        setShowQuarterSelector(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);

    // Focus first option when opened
    setFocusedQuarter(game.currentQuarter);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showQuarterSelector, game.currentQuarter]);

  // Handle arrow key navigation within dropdown
  const handleQuarterKeyDown = (e: React.KeyboardEvent, quarter: number) => {
    const quarters = [1, 2, 3, 4];
    const currentIndex = quarters.indexOf(quarter);

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % quarters.length;
      setFocusedQuarter(quarters[nextIndex]);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + quarters.length) % quarters.length;
      setFocusedQuarter(quarters[prevIndex]);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onQuarterChange?.(quarter);
      setShowQuarterSelector(false);
      quarterButtonRef.current?.focus();
    }
  };

  // Focus the appropriate quarter button when focusedQuarter changes
  useEffect(() => {
    if (showQuarterSelector && focusedQuarter !== null) {
      const button = quarterSelectorRef.current?.querySelector(
        `[data-quarter="${focusedQuarter}"]`
      ) as HTMLButtonElement;
      button?.focus();
    }
  }, [focusedQuarter, showQuarterSelector]);

  const isActive = game.status === "active";
  const isPaused = game.status === "paused";
  const isCompleted = game.status === "completed";
  const isScheduled = game.status === "scheduled";

  const canStart = isScheduled;
  const canPause = isActive;
  const canResume = isPaused;
  const canEnd = isActive || isPaused;
  const canReactivate = isCompleted;

  // End Period handlers
  const handleEndQuarter = () => {
    setShowEndPeriodModal(false);
    // Advance to next quarter
    if (onQuarterChange) {
      onQuarterChange(game.currentQuarter + 1);
    }
    // Pause the game when ending quarter
    if (isActive) {
      onGameControl("pause");
    }
  };

  const handleEndHalf = () => {
    setShowEndPeriodModal(false);
    // End of first half (Q2) → go to Q3, End of second half (Q4) → end game or OT
    if (game.currentQuarter <= 2) {
      // First half - advance to Q3
      if (onQuarterChange) {
        onQuarterChange(3);
      }
      if (isActive) {
        onGameControl("pause");
      }
    } else {
      // Second half - this is essentially end game
      onGameControl("end");
    }
  };

  const handleEndGame = () => {
    setShowEndPeriodModal(false);
    onGameControl("end");
  };

  const handleReactivateGame = () => {
    setShowReactivateConfirm(false);
    onGameControl("reactivate");
  };

  const getEndPeriodOptions = () => {
    const quarter = game.currentQuarter;
    const isFirstHalf = quarter <= 2;
    const isOvertime = quarter > 4;

    return {
      quarterLabel: isOvertime ? `End OT${quarter - 4}` : `End Q${quarter}`,
      halfLabel: isFirstHalf ? "End 1st Half" : "End 2nd Half",
      showHalf: !isOvertime,
    };
  };

  // Score differential
  const differential = game.homeScore - game.awayScore;
  const homeWinning = differential > 0;
  const awayWinning = differential < 0;

  return (
    <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-sm">
      {/* Main content */}
      <div className="relative px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Away Team */}
          <TeamPanel
            name={game.awayTeam?.name || "Away"}
            score={game.awayScore}
            isWinning={awayWinning}
            fouls={awayTeamStats.foulsThisQuarter}
            inBonus={awayTeamStats.inBonus}
            inDoubleBonus={awayTeamStats.inDoubleBonus}
            timeoutsRemaining={awayTeamStats.timeoutsRemaining}
            totalTimeouts={timeoutsPerTeam}
            onTimeout={onTimeoutAway}
            disabled={isCompleted}
          />

          {/* Center: Clock & Controls */}
          <div className="flex flex-col items-center gap-2 px-2 sm:px-6">
            {/* Status Badge */}
            <div
              className={`
                px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest
                border transition-all duration-300
                ${
                  isActive
                    ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-300 dark:border-red-500/50"
                    : isPaused
                      ? "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-500/50"
                      : isCompleted
                        ? "bg-surface-100 dark:bg-surface-600/50 text-surface-600 dark:text-surface-400 border-surface-300 dark:border-surface-500/50"
                        : "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-500/50"
                }
              `}
            >
              <span className={isActive ? "animate-pulse" : ""}>
                {isActive ? "Live" : isPaused ? "Paused" : isCompleted ? "Final" : "Pre-Game"}
              </span>
            </div>

            {/* Clock Row */}
            <div className="flex items-center gap-3">
              <GameClock
                displayTime={formatTime(game.timeRemainingSeconds)}
                isRunning={isActive}
                size="lg"
              />

              {showShotClock && (isActive || isPaused) && (
                <ShotClock
                  seconds={shotClockSeconds}
                  isRunning={isActive}
                  isWarning={shotClockSeconds <= 5}
                  isViolation={shotClockSeconds === 0}
                />
              )}
            </div>

            {/* Quarter & Controls Row */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Quarter Progress Dots */}
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((q) => (
                  <div
                    key={q}
                    className={`
                      w-2 h-2 rounded-full transition-all duration-200
                      ${
                        quartersCompleted.includes(q)
                          ? "bg-emerald-500 dark:bg-emerald-400"
                          : game.currentQuarter === q
                            ? "bg-primary-500 dark:bg-primary-400"
                            : "bg-surface-300 dark:bg-surface-600"
                      }
                    `}
                  />
                ))}
              </div>

              {/* Quarter Selector */}
              <div className="relative">
                <button
                  ref={quarterButtonRef}
                  onClick={() => !isCompleted && setShowQuarterSelector(!showQuarterSelector)}
                  disabled={isCompleted}
                  aria-expanded={showQuarterSelector}
                  aria-haspopup="listbox"
                  aria-controls="quarter-selector-listbox"
                  aria-label={`Current quarter: ${formatQuarter(game.currentQuarter)}. Click to change quarter.`}
                  className={`
                    text-sm font-bold px-3 py-1 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                    ${
                      !isCompleted
                        ? "bg-surface-100 dark:bg-surface-700/50 border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 hover:border-surface-400 dark:hover:border-surface-500"
                        : "bg-surface-50 dark:bg-surface-800/30 border-surface-200 dark:border-surface-700 text-surface-400 dark:text-surface-500 cursor-default"
                    }
                  `}
                >
                  {formatQuarter(game.currentQuarter)}
                </button>
                {showQuarterSelector && onQuarterChange && (
                  <div
                    ref={quarterSelectorRef}
                    id="quarter-selector-listbox"
                    role="listbox"
                    aria-label="Select quarter"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 mt-2 bg-white dark:bg-surface-800 backdrop-blur rounded-xl shadow-lg border border-surface-200 dark:border-surface-600 z-20 p-2"
                  >
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((q) => (
                        <button
                          key={q}
                          data-quarter={q}
                          role="option"
                          aria-selected={game.currentQuarter === q}
                          onClick={() => {
                            onQuarterChange(q);
                            setShowQuarterSelector(false);
                            quarterButtonRef.current?.focus();
                          }}
                          onKeyDown={(e) => handleQuarterKeyDown(e, q)}
                          className={`
                            w-10 h-10 rounded-lg font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset
                            ${
                              game.currentQuarter === q
                                ? "bg-primary-500 text-white"
                                : quartersCompleted.includes(q)
                                  ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30"
                                  : "bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600"
                            }
                          `}
                        >
                          Q{q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Control Buttons */}
              <div className="flex gap-1.5" role="group" aria-label="Game controls">
                {canStart && (
                  <button
                    onClick={() => onGameControl("start")}
                    className="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                    aria-label="Start game"
                  >
                    <PlayIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
                {canPause && (
                  <button
                    onClick={() => onGameControl("pause")}
                    className="p-2 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                    aria-label="Pause game"
                  >
                    <PauseIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
                {canResume && (
                  <button
                    onClick={() => onGameControl("resume")}
                    className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="Resume game"
                  >
                    <PlayIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
                {canEnd && (
                  <button
                    onClick={() => setShowEndPeriodModal(true)}
                    className="p-2 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-500/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    aria-label="Stop game options"
                  >
                    <StopIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
                {canReactivate && (
                  <button
                    onClick={() => setShowReactivateConfirm(true)}
                    className="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                    aria-label="Resume ended game"
                  >
                    <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Home Team */}
          <TeamPanel
            name={game.homeTeam?.name || "Home"}
            score={game.homeScore}
            isWinning={homeWinning}
            fouls={homeTeamStats.foulsThisQuarter}
            inBonus={homeTeamStats.inBonus}
            inDoubleBonus={homeTeamStats.inDoubleBonus}
            timeoutsRemaining={homeTeamStats.timeoutsRemaining}
            totalTimeouts={timeoutsPerTeam}
            onTimeout={onTimeoutHome}
            disabled={isCompleted}
            isHome
          />
        </div>
      </div>

      {/* Bottom accent line */}
      <div
        className={`h-1 w-full ${
          isActive
            ? "bg-gradient-to-r from-transparent via-red-500/50 to-transparent"
            : isPaused
              ? "bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"
              : "bg-gradient-to-r from-transparent via-surface-300 dark:via-surface-600 to-transparent"
        }`}
      />

      {/* End Period Modal */}
      <BaseModal
        isOpen={showEndPeriodModal}
        onClose={() => setShowEndPeriodModal(false)}
        title="Stop Game"
        maxWidth="sm"
      >
        <ModalHeader title="Stop Game" subtitle="What would you like to do?" />
        <ModalBody padding="lg" scrollable={false}>
          <div className="flex flex-col gap-3">
            {/* End Quarter */}
            <button
              onClick={handleEndQuarter}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-colors border border-amber-200 dark:border-amber-500/30"
            >
              <ArrowRightIcon className="h-5 w-5" />
              <span className="font-semibold">{getEndPeriodOptions().quarterLabel}</span>
            </button>

            {/* End Half (only show if not in overtime) */}
            {getEndPeriodOptions().showHalf && (
              <button
                onClick={handleEndHalf}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-500/30 transition-colors border border-orange-200 dark:border-orange-500/30"
              >
                <PauseIcon className="h-5 w-5" />
                <span className="font-semibold">{getEndPeriodOptions().halfLabel}</span>
              </button>
            )}

            {/* End Game */}
            <button
              onClick={handleEndGame}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors border border-red-200 dark:border-red-500/30"
            >
              <StopIcon className="h-5 w-5" />
              <span className="font-semibold">End Game</span>
            </button>
          </div>
        </ModalBody>
        <ModalFooter>
          <button
            onClick={() => setShowEndPeriodModal(false)}
            className="w-full py-2.5 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white font-medium transition-colors"
          >
            Cancel
          </button>
        </ModalFooter>
      </BaseModal>

      {/* Reactivate Game Modal */}
      <BaseModal
        isOpen={showReactivateConfirm}
        onClose={() => setShowReactivateConfirm(false)}
        title="Resume Game"
        maxWidth="sm"
      >
        <ModalHeader title="Resume Game" subtitle="This game has ended" />
        <ModalBody padding="lg" scrollable={false}>
          <p className="text-surface-600 dark:text-surface-400 text-center">
            Do you want to resume this game? It will be set to paused so you can review before continuing.
          </p>
        </ModalBody>
        <ModalFooter align="between">
          <button
            onClick={() => setShowReactivateConfirm(false)}
            className="flex-1 py-2.5 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white font-medium transition-colors rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleReactivateGame}
            className="flex-1 py-2.5 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Resume Game
          </button>
        </ModalFooter>
      </BaseModal>
    </div>
  );
};

export default EnhancedScoreboard;
