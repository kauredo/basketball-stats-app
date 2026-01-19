import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { EnhancedScoreboard } from "./EnhancedScoreboard";
import { ModeTabNavigation } from "./ModeTabNavigation";
import { QuickUndoFAB } from "../utility/QuickUndoFAB";
import { GameMode, TeamStatsData, LastAction, GameStatus } from "../../../types/livegame";
import { Id } from "../../../../../../convex/_generated/dataModel";

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

interface LiveGameLayoutProps {
  children: React.ReactNode;
  game: GameData;
  homeTeamStats: TeamStatsData;
  awayTeamStats: TeamStatsData;
  timeoutsPerTeam: number;
  activeMode: GameMode;
  onModeChange: (mode: GameMode) => void;
  onGameControl: (action: "start" | "pause" | "resume" | "end") => void;
  onTimeoutHome?: () => void;
  onTimeoutAway?: () => void;
  onQuarterChange?: (quarter: number) => void;
  quartersCompleted?: number[];
  // Undo FAB
  lastAction: LastAction | null;
  onUndo: (action: LastAction) => void;
  onDismissUndo: () => void;
  // Optional shot clock
  showShotClock?: boolean;
  shotClockSeconds?: number;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Main layout container for the live game page.
 * Uses h-dvh (dynamic viewport height) for one-page, no-scroll design.
 * Pro sports broadcast aesthetic with dramatic dark styling.
 *
 * Structure:
 * - Scoreboard (dynamic height)
 * - Mode tabs (fixed 44px)
 * - Main content (flex-1, fills remaining space)
 * - QuickUndo FAB (absolute positioned)
 */
export const LiveGameLayout: React.FC<LiveGameLayoutProps> = ({
  children,
  game,
  homeTeamStats,
  awayTeamStats,
  timeoutsPerTeam,
  activeMode,
  onModeChange,
  onGameControl,
  onTimeoutHome,
  onTimeoutAway,
  onQuarterChange,
  quartersCompleted = [],
  lastAction,
  onUndo,
  onDismissUndo,
  showShotClock = false,
  shotClockSeconds = 24,
}) => {
  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Subtle gradient overlay for depth */}
      <div
        className="absolute inset-0 pointer-events-none opacity-50 dark:opacity-30"
        style={{
          background: `
            radial-gradient(ellipse at 20% 0%, rgba(249, 115, 22, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 100%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)
          `,
        }}
      />

      {/* Back button - Fixed at top left */}
      <Link
        to="/app/games"
        className="absolute top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 shadow-sm"
      >
        <XMarkIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
        <span className="text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Exit</span>
      </Link>

      {/* Scoreboard */}
      <div className="relative flex-shrink-0 px-4 pt-4 pb-3">
        <EnhancedScoreboard
          game={game}
          homeTeamStats={homeTeamStats}
          awayTeamStats={awayTeamStats}
          timeoutsPerTeam={timeoutsPerTeam}
          onGameControl={onGameControl}
          onTimeoutHome={onTimeoutHome}
          onTimeoutAway={onTimeoutAway}
          onQuarterChange={onQuarterChange}
          quartersCompleted={quartersCompleted}
          showShotClock={showShotClock}
          shotClockSeconds={shotClockSeconds}
        />
      </div>

      {/* Mode Tabs */}
      <div className="relative flex-shrink-0 px-4 pb-3">
        <ModeTabNavigation
          activeMode={activeMode}
          onModeChange={onModeChange}
        />
      </div>

      {/* Main Content - Fills remaining space */}
      <div className="relative flex-1 min-h-0 overflow-hidden px-4 pb-4">
        {children}
      </div>

      {/* Quick Undo FAB */}
      <QuickUndoFAB
        action={lastAction}
        onUndo={onUndo}
        onDismiss={onDismissUndo}
      />
    </div>
  );
};

export default LiveGameLayout;
