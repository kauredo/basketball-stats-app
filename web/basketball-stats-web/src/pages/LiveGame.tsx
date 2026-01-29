import React from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowUturnLeftIcon,
  Cog6ToothIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import Icon from "../components/Icon";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import type { Id } from "../../../../convex/_generated/dataModel";
import type { StatType, PlayByPlayEvent } from "../types/livegame";

// Custom hooks
import { useLiveGameState } from "../hooks/useLiveGameState";

// Livegame components
import { ShotRecordingModal } from "../components/livegame/modals/ShotRecordingModal";
import { QuickStatModal } from "../components/livegame/modals/QuickStatModal";
import { ReboundPromptModal } from "../components/livegame/modals/ReboundPromptModal";
import { AssistPromptModal } from "../components/livegame/modals/AssistPromptModal";
import { FoulRecordingModal } from "../components/livegame/modals/FoulRecordingModal";
import { FreeThrowSequenceModal } from "../components/livegame/modals/FreeThrowSequenceModal";
import { InteractiveCourt } from "../components/livegame/court/InteractiveCourt";
import { ActiveLineupPanel } from "../components/livegame/lineup/ActiveLineupPanel";
import { QuarterBreakdown } from "../components/livegame/stats/QuarterBreakdown";
import { PlayByPlayList } from "../components/livegame/playbyplay/PlayByPlayList";
import { BonusIndicator } from "../components/livegame/utility/BonusIndicator";
import { TimeoutDots } from "../components/livegame/utility/TimeoutDots";
import { QuickUndoFAB } from "../components/livegame/utility/QuickUndoFAB";

// Get stat type label for display
function getStatLabel(statType: StatType, made?: boolean): string {
  switch (statType) {
    case "shot2":
      return made ? "2PT Made" : "2PT Miss";
    case "shot3":
      return made ? "3PT Made" : "3PT Miss";
    case "freethrow":
      return made ? "FT Made" : "FT Miss";
    case "rebound":
      return "Rebound";
    case "assist":
      return "Assist";
    case "steal":
      return "Steal";
    case "block":
      return "Block";
    case "turnover":
      return "Turnover";
    case "foul":
      return "Foul";
    default:
      return statType;
  }
}

// Team Stats Summary Component
interface TeamStatsSummaryProps {
  stats: {
    fieldGoalsMade?: number;
    fieldGoalsAttempted?: number;
    threePointersMade?: number;
    threePointersAttempted?: number;
    freeThrowsMade?: number;
    freeThrowsAttempted?: number;
    rebounds: number;
    turnovers: number;
    assists: number;
  }[];
  teamName: string;
  onToggle: () => void;
}

const TeamStatsSummary: React.FC<TeamStatsSummaryProps> = ({ stats, teamName, onToggle }) => {
  const totals = stats.reduce(
    (acc, s) => ({
      fgm: acc.fgm + (s.fieldGoalsMade ?? 0),
      fga: acc.fga + (s.fieldGoalsAttempted ?? 0),
      tpm: acc.tpm + (s.threePointersMade ?? 0),
      tpa: acc.tpa + (s.threePointersAttempted ?? 0),
      ftm: acc.ftm + (s.freeThrowsMade ?? 0),
      fta: acc.fta + (s.freeThrowsAttempted ?? 0),
      reb: acc.reb + s.rebounds,
      to: acc.to + s.turnovers,
      ast: acc.ast + s.assists,
    }),
    { fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, reb: 0, to: 0, ast: 0 }
  );

  const fgPct = totals.fga > 0 ? Math.round((totals.fgm / totals.fga) * 100) : 0;
  const tpPct = totals.tpa > 0 ? Math.round((totals.tpm / totals.tpa) * 100) : 0;
  const ftPct = totals.fta > 0 ? Math.round((totals.ftm / totals.fta) * 100) : 0;

  return (
    <button
      onClick={onToggle}
      className="w-full text-left px-3 py-2 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-surface-600 dark:text-surface-400">
          {teamName}
        </span>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-surface-600 dark:text-surface-400">{fgPct}% FG</span>
          <span className="text-surface-600 dark:text-surface-400">{tpPct}% 3P</span>
          <span className="text-surface-600 dark:text-surface-400">{ftPct}% FT</span>
          <span className="text-surface-600 dark:text-surface-400">{totals.reb} REB</span>
          <span className="text-surface-600 dark:text-surface-400">{totals.to} TO</span>
        </div>
      </div>
    </button>
  );
};

// Overtime Prompt Modal
interface OvertimePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartOvertime: () => void;
  onEndAsTie: () => void;
  homeScore: number;
  awayScore: number;
}

const OvertimePromptModal: React.FC<OvertimePromptModalProps> = ({
  isOpen,
  onClose,
  onStartOvertime,
  onEndAsTie,
  homeScore,
  awayScore,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-surface-800 rounded-2xl w-full max-w-sm border border-surface-200 dark:border-surface-700 overflow-hidden">
        <div className="bg-primary-600 px-6 py-4">
          <h3 className="text-lg font-bold text-white text-center">
            Game Tied {homeScore}-{awayScore}
          </h3>
          <p className="text-primary-200 text-sm text-center">End of Regulation</p>
        </div>

        <div className="p-6 space-y-3">
          <button
            onClick={onStartOvertime}
            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors"
          >
            Start Overtime
          </button>
          <button
            onClick={onEndAsTie}
            className="w-full py-4 bg-surface-200 dark:bg-surface-700 hover:bg-surface-300 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-300 font-medium rounded-xl transition-colors"
          >
            End as Tie
          </button>
        </div>

        <div className="px-4 py-3 bg-surface-50 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const LiveGame: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { token } = useAuth();

  const {
    // State
    activeTab,
    setActiveTab,
    pendingShot,
    setPendingShot,
    recentShots,
    actionHistory,
    showQuarterSelector,
    setShowQuarterSelector,
    showEndPeriodConfirm,
    setShowEndPeriodConfirm,
    showActionHistory,
    setShowActionHistory,
    quarterMinutes,
    setQuarterMinutes,
    foulLimitSetting,
    setFoulLimitSetting,
    homeStarters,
    awayStarters,
    pendingRebound,
    setPendingRebound,
    pendingAssist,
    setPendingAssist,
    pendingQuickStat,
    setPendingQuickStat,
    pendingFoul,
    setPendingFoul,
    freeThrowSequence,
    showOvertimePrompt,
    setShowOvertimePrompt,
    showHomeStatsSummary,
    setShowHomeStatsSummary,
    showAwayStatsSummary,
    setShowAwayStatsSummary,
    swappingPlayer,
    setSwappingPlayer,

    // Data
    gameData,
    liveStats,
    gameEvents,
    game,
    homeStats,
    awayStats,
    allOnCourtPlayers,
    homeTeamStats,
    awayTeamStats,
    gameSettings,
    foulLimit,

    // Status flags
    isActive,
    isPaused,
    isCompleted,
    isScheduled,
    canRecordStats,

    // Handlers
    handleGameControl,
    handleRecordStat,
    handleUndo,
    handleQuarterChange,
    handleEndPeriod,
    handleSwapSubstitute,
    handlePlayerRebound,
    handleTeamRebound,
    handleAssist,
    handleQuickStatFromModal,
    handleRecordFoulWithContext,
    handleFreeThrowResult,
    handleTimeout,
    handleStartOvertime,
    handleEndAsTie,
    toggleStarter,
  } = useLiveGameState({ gameId, token });

  // Court click handler
  const handleCourtClick = (x: number, y: number, is3pt: boolean, zoneName: string) => {
    setPendingShot({ x, y, is3pt, zoneName });
  };

  // Shot recording from modal
  const handleShotFromModal = (playerId: Id<"players">, made: boolean) => {
    if (!pendingShot) return;
    const statType = pendingShot.is3pt ? "shot3" : "shot2";
    handleRecordStat(playerId, statType, made, { x: pendingShot.x, y: pendingShot.y });
    setPendingShot(null);
  };

  // Loading state
  if (gameData === undefined || liveStats === undefined) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" label="Loading game" centered={false} />
          <p className="text-surface-600 dark:text-surface-400 mt-4">Loading game...</p>
        </div>
      </div>
    );
  }

  // Game not found
  if (!game) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
        <div className="text-center py-12">
          <Icon
            name="basketball"
            size={48}
            className="mx-auto mb-4 text-surface-600 dark:text-surface-400"
          />
          <h3 className="text-lg font-medium text-surface-900 dark:text-white mb-2">
            Game not found
          </h3>
          <p className="text-surface-600 dark:text-surface-400">
            The requested game could not be found.
          </p>
        </div>
      </div>
    );
  }

  // Extract quarters completed for indicators
  const quartersCompleted = gameSettings.quartersCompleted || [];
  const isQuickGame = gameSettings.isQuickGame;

  // Pre-game configuration screen
  if (isScheduled) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 mb-6 border border-surface-200 dark:border-surface-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Cog6ToothIcon className="h-8 w-8 text-primary-500" />
                <div>
                  <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                    Pre-Game Setup
                  </h1>
                  <p className="text-surface-600 dark:text-surface-400">
                    Configure game settings before starting
                  </p>
                </div>
              </div>
              {isQuickGame && (
                <span className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full">
                  Quick Game
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-8 items-center py-4 border-t border-surface-200 dark:border-surface-700">
              <div className="text-center">
                <h2 className="text-lg font-bold text-surface-700 dark:text-surface-300">
                  {game.awayTeam?.name}
                </h2>
              </div>
              <div className="text-center text-2xl font-bold text-surface-500">VS</div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-surface-700 dark:text-surface-300">
                  {game.homeTeam?.name}
                </h2>
              </div>
            </div>
          </div>

          {/* Game Settings Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Quarter Duration */}
            <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
                Quarter Duration
              </h3>
              <div className="flex flex-wrap gap-3">
                {[5, 8, 10, 12].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setQuarterMinutes(mins)}
                    className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
                      quarterMinutes === mins
                        ? "bg-primary-600 text-white"
                        : "bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600"
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={quarterMinutes}
                    onChange={(e) =>
                      setQuarterMinutes(Math.min(20, Math.max(1, parseInt(e.target.value) || 12)))
                    }
                    className="w-16 px-2 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white text-center"
                  />
                  <span className="text-surface-600 dark:text-surface-400 text-sm">min</span>
                </div>
              </div>
            </div>

            {/* Foul Limit */}
            <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
                Foul Limit
              </h3>
              <p className="text-sm text-surface-500 mb-4">
                Players foul out after this many fouls
              </p>
              <div className="flex gap-3">
                {[5, 6].map((limit) => (
                  <button
                    key={limit}
                    onClick={() => setFoulLimitSetting(limit as 5 | 6)}
                    className={`flex-1 px-6 py-3 rounded-xl font-medium transition-colors ${
                      foulLimitSetting === limit
                        ? "bg-primary-600 text-white"
                        : "bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600"
                    }`}
                  >
                    {limit} Fouls
                    <div className="text-xs opacity-75 mt-0.5">
                      {limit === 5 ? "(HS/College)" : "(NBA/Pro)"}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Starting Five Selection */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-1">
              Starting Lineups
            </h3>
            <p className="text-sm text-surface-500">
              First 5 players are selected by default. Tap to change.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Away Team Starters */}
            <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                  {game.awayTeam?.name}
                </h3>
                <span
                  className={`text-sm font-medium ${awayStarters.length === 5 ? "text-green-500" : "text-primary-500"}`}
                >
                  {awayStarters.length}/5 selected
                </span>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {awayStats.map((stat) => (
                  <button
                    key={stat.id}
                    onClick={() => toggleStarter(stat.playerId, false)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      awayStarters.includes(stat.playerId)
                        ? "bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500"
                        : "bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600"
                    }`}
                  >
                    <span className="text-surface-900 dark:text-white font-medium">
                      #{stat.player?.number} {stat.player?.name}
                    </span>
                    {awayStarters.includes(stat.playerId) && (
                      <CheckIcon className="h-5 w-5 text-primary-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Home Team Starters */}
            <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                  {game.homeTeam?.name}
                </h3>
                <span
                  className={`text-sm font-medium ${homeStarters.length === 5 ? "text-green-500" : "text-primary-500"}`}
                >
                  {homeStarters.length}/5 selected
                </span>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {homeStats.map((stat) => (
                  <button
                    key={stat.id}
                    onClick={() => toggleStarter(stat.playerId, true)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      homeStarters.includes(stat.playerId)
                        ? "bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500"
                        : "bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600"
                    }`}
                  >
                    <span className="text-surface-900 dark:text-white font-medium">
                      #{stat.player?.number} {stat.player?.name}
                    </span>
                    {homeStarters.includes(stat.playerId) && (
                      <CheckIcon className="h-5 w-5 text-primary-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Start Game Button */}
          <button
            onClick={() => handleGameControl("start")}
            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white text-lg font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <PlayIcon className="h-6 w-6" />
            Start Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 p-6">
      {/* Compact Scoreboard with Team Fouls & Timeouts */}
      <div className="bg-white dark:bg-surface-800 rounded-xl p-3 mb-4 border border-surface-200 dark:border-surface-700">
        <div className="flex items-center justify-between">
          {/* Away Team */}
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-surface-900 dark:text-white w-12 text-center">
                {game.awayScore}
              </div>
              <div className="flex flex-col">
                <div className="text-sm font-medium text-surface-600 dark:text-surface-400 max-w-[100px] truncate">
                  {game.awayTeam?.name}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-surface-500">
                    TF: {awayTeamStats?.foulsThisQuarter || 0}
                  </span>
                  <BonusIndicator
                    inBonus={awayTeamStats?.inBonus || false}
                    inDoubleBonus={awayTeamStats?.inDoubleBonus || false}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TimeoutDots
                remaining={awayTeamStats?.timeoutsRemaining ?? gameSettings.timeoutsPerTeam ?? 4}
                total={gameSettings.timeoutsPerTeam || 4}
                teamSide="left"
              />
              {canRecordStats && (
                <button
                  onClick={() =>
                    game.awayTeam?.id && handleTimeout(game.awayTeam.id as Id<"teams">)
                  }
                  className="text-[10px] text-primary-600 hover:text-primary-700 font-medium"
                >
                  TO
                </button>
              )}
            </div>
          </div>

          {/* Center: Period, Status, Controls */}
          <div className="flex items-center gap-3">
            {/* Quarter indicators */}
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((q) => (
                <div
                  key={q}
                  title={`Q${q}`}
                  className={`w-2 h-2 rounded-full ${
                    quartersCompleted.includes(q)
                      ? "bg-green-500"
                      : game.currentQuarter === q
                        ? "bg-primary-500"
                        : "bg-surface-300 dark:bg-surface-600"
                  }`}
                />
              ))}
            </div>

            {/* Period selector */}
            <div className="relative">
              <button
                onClick={() => !isCompleted && setShowQuarterSelector(!showQuarterSelector)}
                disabled={isCompleted}
                className={`text-sm font-bold px-2 py-1 rounded ${!isCompleted ? "hover:bg-surface-100 dark:hover:bg-surface-700 cursor-pointer" : ""}`}
              >
                {game.currentQuarter <= 4
                  ? `Q${game.currentQuarter}`
                  : `OT${game.currentQuarter - 4}`}
              </button>
              {showQuarterSelector && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white dark:bg-surface-800 rounded-lg shadow-lg border border-surface-200 dark:border-surface-700 z-20 p-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((q) => (
                      <button
                        key={q}
                        onClick={() => handleQuarterChange(q)}
                        className={`w-8 h-8 rounded font-bold text-sm ${
                          game.currentQuarter === q
                            ? "bg-primary-600 text-white"
                            : quartersCompleted.includes(q)
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700"
                              : "bg-surface-100 dark:bg-surface-700 hover:bg-surface-200"
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Status badge */}
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                isActive
                  ? "bg-red-600 text-white animate-pulse"
                  : isPaused
                    ? "bg-yellow-600 text-white"
                    : isCompleted
                      ? "bg-surface-600 text-white"
                      : "bg-blue-600 text-white"
              }`}
            >
              {isActive ? "LIVE" : isPaused ? "PAUSED" : isCompleted ? "FINAL" : "SCHEDULED"}
            </span>

            {/* Control buttons */}
            {!isCompleted && (
              <div className="flex gap-1">
                {actionHistory.length > 0 && (
                  <button
                    onClick={() => setShowActionHistory(!showActionHistory)}
                    className="p-1.5 bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 rounded hover:bg-surface-200 dark:hover:bg-surface-600"
                    title="Undo"
                  >
                    <ArrowUturnLeftIcon className="h-4 w-4" />
                  </button>
                )}
                {!isActive && (
                  <button
                    onClick={() => handleGameControl(isPaused ? "resume" : "start")}
                    className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700"
                    title={isPaused ? "Resume" : "Start"}
                  >
                    <PlayIcon className="h-4 w-4" />
                  </button>
                )}
                {isActive && (
                  <button
                    onClick={() => handleGameControl("pause")}
                    className="p-1.5 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                    title="Pause"
                  >
                    <PauseIcon className="h-4 w-4" />
                  </button>
                )}
                {(isActive || isPaused) && (
                  <button
                    onClick={() => handleGameControl("stop")}
                    className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700"
                    title={`End Q${game.currentQuarter}`}
                  >
                    <StopIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Home Team */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <div className="text-sm font-medium text-surface-600 dark:text-surface-400 max-w-[100px] truncate text-right">
                  {game.homeTeam?.name}
                </div>
                <div className="flex items-center gap-2">
                  <BonusIndicator
                    inBonus={homeTeamStats?.inBonus || false}
                    inDoubleBonus={homeTeamStats?.inDoubleBonus || false}
                  />
                  <span className="text-[10px] text-surface-500">
                    TF: {homeTeamStats?.foulsThisQuarter || 0}
                  </span>
                </div>
              </div>
              <div className="text-3xl font-bold text-surface-900 dark:text-white w-12 text-center">
                {game.homeScore}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canRecordStats && (
                <button
                  onClick={() =>
                    game.homeTeam?.id && handleTimeout(game.homeTeam.id as Id<"teams">)
                  }
                  className="text-[10px] text-primary-600 hover:text-primary-700 font-medium"
                >
                  TO
                </button>
              )}
              <TimeoutDots
                remaining={homeTeamStats?.timeoutsRemaining ?? gameSettings.timeoutsPerTeam ?? 4}
                total={gameSettings.timeoutsPerTeam || 4}
                teamSide="right"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-6">
        {[
          { key: "court", label: "Court & Subs", icon: ChartBarIcon },
          { key: "stats", label: "Box Score", icon: UserGroupIcon },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-primary-600 text-white"
                : "bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700"
            }`}
            onClick={() => setActiveTab(tab.key as "court" | "stats")}
          >
            <tab.icon className="h-5 w-5 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "court" && (
        <>
          {/* Court, Quick Stats, and Substitutions in one row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Court - Smaller, left side */}
            <div className="lg:col-span-5 bg-white dark:bg-surface-800 rounded-xl p-3 border border-surface-200 dark:border-surface-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-surface-900 dark:text-white font-semibold text-sm">
                  Tap Court to Record
                </h3>
                <div className="flex gap-1">
                  <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded">
                    2PT
                  </span>
                  <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded">
                    3PT
                  </span>
                </div>
              </div>
              <div className="max-w-[280px] mx-auto">
                <InteractiveCourt
                  onCourtClick={handleCourtClick}
                  disabled={!canRecordStats}
                  recentShots={recentShots}
                />
              </div>

              {/* Quick Stats below court */}
              <div className="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
                <p className="text-surface-500 text-xs mb-2">Quick Stats</p>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    onClick={() => setPendingQuickStat("rebound")}
                    disabled={!canRecordStats}
                    className="py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-surface-300 dark:disabled:bg-surface-700 text-white rounded-lg font-bold transition-colors text-xs"
                  >
                    REB
                  </button>
                  <button
                    onClick={() => setPendingQuickStat("assist")}
                    disabled={!canRecordStats}
                    className="py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-surface-300 dark:disabled:bg-surface-700 text-white rounded-lg font-bold transition-colors text-xs"
                  >
                    AST
                  </button>
                  <button
                    onClick={() => setPendingQuickStat("steal")}
                    disabled={!canRecordStats}
                    className="py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-surface-300 dark:disabled:bg-surface-700 text-white rounded-lg font-bold transition-colors text-xs"
                  >
                    STL
                  </button>
                  <button
                    onClick={() => setPendingQuickStat("block")}
                    disabled={!canRecordStats}
                    className="py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-surface-300 dark:disabled:bg-surface-700 text-white rounded-lg font-bold transition-colors text-xs"
                  >
                    BLK
                  </button>
                  <button
                    onClick={() => setPendingQuickStat("turnover")}
                    disabled={!canRecordStats}
                    className="py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-surface-300 dark:disabled:bg-surface-700 text-white rounded-lg font-bold transition-colors text-xs"
                  >
                    TO
                  </button>
                  <button
                    onClick={() => setPendingQuickStat("foul")}
                    disabled={!canRecordStats}
                    className="py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-surface-300 dark:disabled:bg-surface-700 text-white rounded-lg font-bold transition-colors text-xs"
                  >
                    FOUL
                  </button>
                  <button
                    onClick={() => setPendingQuickStat("freethrow")}
                    disabled={!canRecordStats}
                    className="py-2 bg-green-600 hover:bg-green-700 disabled:bg-surface-300 dark:disabled:bg-surface-700 text-white rounded-lg font-bold transition-colors text-xs col-span-2"
                  >
                    FREE THROW
                  </button>
                </div>
              </div>
            </div>

            {/* Substitution Panels - Right side */}
            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
              <ActiveLineupPanel
                teamName={game.awayTeam?.name || "Away"}
                teamId={game.awayTeam?.id as Id<"teams">}
                players={awayStats}
                foulLimit={foulLimit}
                onSwap={handleSwapSubstitute}
                swappingPlayer={swappingPlayer}
                onStartSwap={setSwappingPlayer}
                onCancelSwap={() => setSwappingPlayer(null)}
                disabled={isCompleted}
                isHomeTeam={false}
              />
              <ActiveLineupPanel
                teamName={game.homeTeam?.name || "Home"}
                teamId={game.homeTeam?.id as Id<"teams">}
                players={homeStats}
                foulLimit={foulLimit}
                onSwap={handleSwapSubstitute}
                swappingPlayer={swappingPlayer}
                onStartSwap={setSwappingPlayer}
                onCancelSwap={() => setSwappingPlayer(null)}
                disabled={isCompleted}
                isHomeTeam={true}
              />
            </div>
          </div>
        </>
      )}

      {activeTab === "stats" && (
        <div className="space-y-6">
          {/* Quarter Breakdown */}
          <QuarterBreakdown
            homeTeamName={game.homeTeam?.name || "Home"}
            awayTeamName={game.awayTeam?.name || "Away"}
            scoreByPeriod={gameSettings.scoreByPeriod || {}}
            currentQuarter={game.currentQuarter}
            homeScore={game.homeScore}
            awayScore={game.awayScore}
          />

          {/* Team Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
              <TeamStatsSummary
                stats={awayStats}
                teamName={game.awayTeam?.name || "Away"}
                onToggle={() => setShowAwayStatsSummary(!showAwayStatsSummary)}
              />
            </div>
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
              <TeamStatsSummary
                stats={homeStats}
                teamName={game.homeTeam?.name || "Home"}
                onToggle={() => setShowHomeStatsSummary(!showHomeStatsSummary)}
              />
            </div>
          </div>

          {/* Box Scores */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Away Team Stats */}
            <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
                {game.awayTeam?.name} - Player Stats
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-surface-300 dark:border-surface-600">
                      <th className="text-left py-2 px-3 text-xs font-medium text-surface-700 dark:text-surface-300 uppercase">
                        Player
                      </th>
                      <th className="text-center py-2 px-2 text-xs font-medium text-surface-700 dark:text-surface-300 uppercase">
                        PTS
                      </th>
                      <th className="text-center py-2 px-2 text-xs font-medium text-surface-700 dark:text-surface-300 uppercase">
                        REB
                      </th>
                      <th className="text-center py-2 px-2 text-xs font-medium text-surface-700 dark:text-surface-300 uppercase">
                        AST
                      </th>
                      <th className="text-center py-2 px-2 text-xs font-medium text-surface-700 dark:text-surface-300 uppercase">
                        STL
                      </th>
                      <th className="text-center py-2 px-2 text-xs font-medium text-surface-700 dark:text-surface-300 uppercase">
                        BLK
                      </th>
                      <th className="text-center py-2 px-2 text-xs font-medium text-surface-700 dark:text-surface-300 uppercase">
                        TO
                      </th>
                      <th className="text-center py-2 px-2 text-xs font-medium text-surface-700 dark:text-surface-300 uppercase">
                        PF
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                    {awayStats.map((stat) => (
                      <tr key={stat.id} className={stat.isOnCourt ? "" : "opacity-50"}>
                        <td className="py-3 px-3 text-sm text-surface-900 dark:text-white">
                          #{stat.player?.number} {stat.player?.name}
                          {stat.isOnCourt && (
                            <span className="ml-2 text-green-400 text-xs">ON</span>
                          )}
                          {stat.fouledOut && <span className="ml-2 text-red-400 text-xs">OUT</span>}
                        </td>
                        <td className="py-3 px-2 text-center text-sm text-surface-900 dark:text-white font-bold">
                          {stat.points}
                        </td>
                        <td className="py-3 px-2 text-center text-sm text-surface-900 dark:text-white">
                          {stat.rebounds}
                        </td>
                        <td className="py-3 px-2 text-center text-sm text-surface-900 dark:text-white">
                          {stat.assists}
                        </td>
                        <td className="py-3 px-2 text-center text-sm text-surface-900 dark:text-white">
                          {stat.steals}
                        </td>
                        <td className="py-3 px-2 text-center text-sm text-surface-900 dark:text-white">
                          {stat.blocks}
                        </td>
                        <td className="py-3 px-2 text-center text-sm text-surface-900 dark:text-white">
                          {stat.turnovers}
                        </td>
                        <td className="py-3 px-2 text-center text-sm text-surface-900 dark:text-white">
                          {stat.fouls}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Home Team Stats */}
            <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
                {game.homeTeam?.name} - Player Stats
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-surface-300 dark:border-surface-600">
                      <th className="text-left py-2 px-3 text-xs font-medium text-surface-700 dark:text-surface-300 uppercase">
                        Player
                      </th>
                      <th className="text-center py-2 px-2 text-xs font-medium text-surface-700 dark:text-surface-300 uppercase">
                        PTS
                      </th>
                      <th className="text-center py-2 px-2 text-xs font-medium text-surface-700 dark:text-surface-300 uppercase">
                        REB
                      </th>
                      <th className="text-center py-2 px-2 text-xs font-medium text-surface-700 dark:text-surface-300 uppercase">
                        AST
                      </th>
                      <th className="text-center py-2 px-2 text-xs font-medium text-surface-700 dark:text-surface-300 uppercase">
                        STL
                      </th>
                      <th className="text-center py-2 px-2 text-xs font-medium text-surface-700 dark:text-surface-300 uppercase">
                        BLK
                      </th>
                      <th className="text-center py-2 px-2 text-xs font-medium text-surface-700 dark:text-surface-300 uppercase">
                        TO
                      </th>
                      <th className="text-center py-2 px-2 text-xs font-medium text-surface-700 dark:text-surface-300 uppercase">
                        PF
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                    {homeStats.map((stat) => (
                      <tr key={stat.id} className={stat.isOnCourt ? "" : "opacity-50"}>
                        <td className="py-3 px-3 text-sm text-surface-900 dark:text-white">
                          #{stat.player?.number} {stat.player?.name}
                          {stat.isOnCourt && (
                            <span className="ml-2 text-green-400 text-xs">ON</span>
                          )}
                          {stat.fouledOut && <span className="ml-2 text-red-400 text-xs">OUT</span>}
                        </td>
                        <td className="py-3 px-2 text-center text-sm text-surface-900 dark:text-white font-bold">
                          {stat.points}
                        </td>
                        <td className="py-3 px-2 text-center text-sm text-surface-900 dark:text-white">
                          {stat.rebounds}
                        </td>
                        <td className="py-3 px-2 text-center text-sm text-surface-900 dark:text-white">
                          {stat.assists}
                        </td>
                        <td className="py-3 px-2 text-center text-sm text-surface-900 dark:text-white">
                          {stat.steals}
                        </td>
                        <td className="py-3 px-2 text-center text-sm text-surface-900 dark:text-white">
                          {stat.blocks}
                        </td>
                        <td className="py-3 px-2 text-center text-sm text-surface-900 dark:text-white">
                          {stat.turnovers}
                        </td>
                        <td className="py-3 px-2 text-center text-sm text-surface-900 dark:text-white">
                          {stat.fouls}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Play-by-Play */}
          <PlayByPlayList events={(gameEvents?.events || []) as PlayByPlayEvent[]} />
        </div>
      )}

      {/* Modals */}
      <ShotRecordingModal
        isOpen={!!pendingShot}
        onClose={() => setPendingShot(null)}
        onRecord={handleShotFromModal}
        shotType={pendingShot?.is3pt ? "3pt" : "2pt"}
        zoneName={pendingShot?.zoneName || ""}
        onCourtPlayers={allOnCourtPlayers}
        homeTeamName={game?.homeTeam?.name || "Home"}
        awayTeamName={game?.awayTeam?.name || "Away"}
      />

      <QuickStatModal
        isOpen={!!pendingQuickStat}
        onClose={() => setPendingQuickStat(null)}
        onRecord={handleQuickStatFromModal}
        statType={pendingQuickStat}
        onCourtPlayers={allOnCourtPlayers}
        homeTeamName={game?.homeTeam?.name || "Home"}
        awayTeamName={game?.awayTeam?.name || "Away"}
      />

      {pendingRebound && game && (
        <ReboundPromptModal
          isOpen={!!pendingRebound}
          onClose={() => setPendingRebound(null)}
          onPlayerRebound={handlePlayerRebound}
          onTeamRebound={handleTeamRebound}
          shooterTeamId={pendingRebound.shooterTeamId}
          shooterTeamName={
            pendingRebound.isHomeTeam
              ? game.homeTeam?.name || "Home"
              : game.awayTeam?.name || "Away"
          }
          opposingTeamId={
            pendingRebound.isHomeTeam
              ? (game.awayTeam?.id as Id<"teams">)
              : (game.homeTeam?.id as Id<"teams">)
          }
          opposingTeamName={
            pendingRebound.isHomeTeam
              ? game.awayTeam?.name || "Away"
              : game.homeTeam?.name || "Home"
          }
          shooterTeamPlayers={pendingRebound.isHomeTeam ? homeStats : awayStats}
          opposingTeamPlayers={pendingRebound.isHomeTeam ? awayStats : homeStats}
          shotType={pendingRebound.shotType as StatType}
        />
      )}

      {pendingAssist && (
        <AssistPromptModal
          isOpen={!!pendingAssist}
          onClose={() => setPendingAssist(null)}
          onAssist={handleAssist}
          onNoAssist={() => setPendingAssist(null)}
          scorerName={pendingAssist.scorerName}
          scorerNumber={pendingAssist.scorerNumber}
          shotType={pendingAssist.shotType}
          points={pendingAssist.points}
          teammates={(pendingAssist.isHomeTeam ? homeStats : awayStats).filter(
            (s) => s.isOnCourt && s.playerId !== pendingAssist.scorerPlayerId
          )}
        />
      )}

      <FoulRecordingModal
        isOpen={!!pendingFoul}
        onClose={() => setPendingFoul(null)}
        onRecord={handleRecordFoulWithContext}
        selectedPlayer={pendingFoul}
        opponentPlayers={pendingFoul?.isHomeTeam ? awayStats : homeStats}
      />

      <FreeThrowSequenceModal
        isOpen={!!freeThrowSequence}
        onClose={() => {}}
        onRecord={handleFreeThrowResult}
        sequence={freeThrowSequence}
      />

      <OvertimePromptModal
        isOpen={showOvertimePrompt}
        onClose={() => setShowOvertimePrompt(false)}
        onStartOvertime={handleStartOvertime}
        onEndAsTie={handleEndAsTie}
        homeScore={game.homeScore}
        awayScore={game.awayScore}
      />

      {/* Quick Undo FAB */}
      <QuickUndoFAB
        action={
          actionHistory[0]
            ? {
                playerId: actionHistory[0].playerId,
                playerNumber: actionHistory[0].playerNumber,
                playerName: actionHistory[0].playerName,
                statType: actionHistory[0].statType,
                wasMade: actionHistory[0].made,
                displayText: `#${actionHistory[0].playerNumber} ${getStatLabel(actionHistory[0].statType, actionHistory[0].made)}`,
                timestamp: actionHistory[0].timestamp,
              }
            : null
        }
        onUndo={(action) => {
          const historyItem = actionHistory.find((a) => a.playerId === action.playerId);
          if (historyItem) handleUndo(historyItem);
        }}
        onDismiss={() => {}}
      />

      {/* Action History Panel */}
      {showActionHistory && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-surface-800 rounded-2xl w-96 max-h-[70vh] overflow-hidden border border-surface-200 dark:border-surface-700">
            <div className="flex justify-between items-center p-4 border-b border-surface-200 dark:border-surface-700">
              <h3 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
                <ArrowUturnLeftIcon className="h-5 w-5" />
                Action History
              </h3>
              <button
                onClick={() => setShowActionHistory(false)}
                className="text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white"
              >
                <Icon name="x" size={24} />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(70vh-120px)]">
              {actionHistory.length === 0 ? (
                <div className="p-8 text-center text-surface-500">No actions recorded yet</div>
              ) : (
                actionHistory.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700"
                  >
                    <div>
                      <div className="text-surface-900 dark:text-white font-medium">
                        #{action.playerNumber} {action.playerName}
                      </div>
                      <div className="text-surface-600 dark:text-surface-400 text-sm">
                        {getStatLabel(action.statType, action.made)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUndo(action)}
                      className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      Undo
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900">
              <button
                onClick={() => setShowActionHistory(false)}
                className="w-full py-2 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Period Confirmation Modal */}
      {showEndPeriodConfirm && game && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 w-96 border border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  game.currentQuarter >= 4
                    ? "bg-red-100 dark:bg-red-900/30"
                    : "bg-primary-100 dark:bg-primary-900/30"
                }`}
              >
                <StopIcon
                  className={`h-6 w-6 ${
                    game.currentQuarter >= 4 ? "text-red-600" : "text-primary-600"
                  }`}
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-surface-900 dark:text-white">
                  {game.currentQuarter >= 4 ? "End Game?" : `End Quarter ${game.currentQuarter}?`}
                </h3>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  {game.currentQuarter >= 4
                    ? "This will mark the game as complete"
                    : `Move to Q${game.currentQuarter + 1}`}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4].map((q) => (
                  <div
                    key={q}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                      quartersCompleted.includes(q)
                        ? "bg-green-500 text-white"
                        : game.currentQuarter === q
                          ? "bg-primary-500 text-white"
                          : "bg-surface-200 dark:bg-surface-700 text-surface-500"
                    }`}
                  >
                    Q{q}
                  </div>
                ))}
              </div>
              <p className="text-surface-600 dark:text-surface-400 text-center text-sm">
                {game.currentQuarter >= 4
                  ? "The game will be marked as final."
                  : `Quarter ${game.currentQuarter} will be marked complete and the game will pause for Q${game.currentQuarter + 1}.`}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEndPeriodConfirm(false)}
                className="flex-1 py-3 bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-xl font-medium hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEndPeriod}
                className={`flex-1 py-3 text-white rounded-xl font-medium transition-colors ${
                  game.currentQuarter >= 4
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-primary-600 hover:bg-primary-700"
                }`}
              >
                {game.currentQuarter >= 4 ? "End Game" : `End Q${game.currentQuarter}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveGame;
