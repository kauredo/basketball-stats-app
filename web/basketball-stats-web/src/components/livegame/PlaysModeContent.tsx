import React, { useState } from "react";
import { Id } from "../../../../../convex/_generated/dataModel";
import { PlayByPlayEvent } from "../../types/livegame";
import { PlayByPlayList } from "./playbyplay/PlayByPlayList";
import { QuarterFilterTabs } from "./playbyplay/QuarterFilterTabs";

interface PlaysModeContentProps {
  events: PlayByPlayEvent[];
  homeTeamId: Id<"teams">;
  currentQuarter: number;
}

/**
 * Plays mode content - shows play-by-play events with quarter filtering.
 */
export const PlaysModeContent: React.FC<PlaysModeContentProps> = ({
  events,
  homeTeamId,
  currentQuarter,
}) => {
  const [selectedQuarter, setSelectedQuarter] = useState<number | "all">("all");

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header with filter */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Play-by-Play</h3>
        <QuarterFilterTabs
          currentQuarter={currentQuarter}
          selectedQuarter={selectedQuarter}
          onSelectQuarter={setSelectedQuarter}
        />
      </div>

      {/* Events list */}
      <div className="flex-1 min-h-0 p-2">
        <PlayByPlayList events={events} homeTeamId={homeTeamId} filterQuarter={selectedQuarter} />
      </div>
    </div>
  );
};

export default PlaysModeContent;
