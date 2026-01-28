import React, { useState } from "react";
import { PlayByPlayEvent } from "../../types/livegame";
import { Id } from "../../../../../convex/_generated/dataModel";
import { PlayByPlayList } from "./playbyplay/PlayByPlayList";
import { QuarterFilterTabs } from "./playbyplay/QuarterFilterTabs";

interface PlayerStat {
  playerId: Id<"players">;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
}

interface PlaysModeContentProps {
  events: PlayByPlayEvent[];
  currentQuarter: number;
  playerStats?: PlayerStat[];
  homeTeamId?: Id<"teams">;
}

/**
 * Plays mode content - shows play-by-play events with quarter filtering.
 * Unified design matching mobile PlayByPlayTab.
 */
export const PlaysModeContent: React.FC<PlaysModeContentProps> = ({
  events,
  currentQuarter,
  playerStats = [],
  homeTeamId,
}) => {
  const [selectedQuarter, setSelectedQuarter] = useState<number | "all">("all");

  return (
    <div className="h-full flex flex-col bg-surface-50 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
      {/* Quarter Filter - matches mobile pill style */}
      <div className="border-b border-surface-200 dark:border-surface-700">
        <QuarterFilterTabs
          currentQuarter={currentQuarter}
          selectedQuarter={selectedQuarter}
          onSelectQuarter={setSelectedQuarter}
        />
      </div>

      {/* Events list */}
      <div className="flex-1 min-h-0">
        <PlayByPlayList
          events={events}
          filterQuarter={selectedQuarter}
          playerStats={playerStats}
          homeTeamId={homeTeamId}
        />
      </div>
    </div>
  );
};

export default PlaysModeContent;
