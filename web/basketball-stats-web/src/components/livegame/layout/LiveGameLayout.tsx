import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
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
 *
 * Structure:
 * - Scoreboard (fixed 80px)
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
    <div className="h-dvh bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Back button - Fixed at top left */}
      <Link
        to="/app/games"
        className="absolute top-3 left-3 z-50 flex items-center gap-1 px-2 py-1 bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg text-xs font-medium transition-colors backdrop-blur-sm"
      >
        <ArrowLeftIcon className="h-3 w-3" />
        <span>Exit</span>
      </Link>

      {/* Scoreboard - Fixed height */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2">
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

      {/* Mode Tabs - Fixed height */}
      <div className="flex-shrink-0 px-4 py-2">
        <ModeTabNavigation
          activeMode={activeMode}
          onModeChange={onModeChange}
        />
      </div>

      {/* Main Content - Fills remaining space */}
      <div className="flex-1 min-h-0 overflow-hidden px-4 pb-4">
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
