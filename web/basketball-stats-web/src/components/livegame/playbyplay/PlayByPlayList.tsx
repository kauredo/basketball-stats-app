import React, { useMemo, useRef, useEffect } from "react";
import { PlayByPlayEvent } from "../../../types/livegame";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { GameEventCard } from "./GameEventCard";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";

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

interface PlayByPlayListProps {
  events: PlayByPlayEvent[];
  filterQuarter?: number | "all";
  autoScrollToLatest?: boolean;
  playerStats?: PlayerStat[];
  homeTeamId?: Id<"teams">;
}

/**
 * Scrollable list of play-by-play events.
 * Supports filtering by quarter and auto-scrolling to latest.
 */
export const PlayByPlayList: React.FC<PlayByPlayListProps> = ({
  events,
  filterQuarter = "all",
  autoScrollToLatest = true,
  playerStats = [],
  homeTeamId,
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  // Filter events by quarter
  const filteredEvents = useMemo(() => {
    if (filterQuarter === "all") return events;
    return events.filter((e) => e.quarter === filterQuarter);
  }, [events, filterQuarter]);

  // Sort events by time (most recent first for live view)
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      // Sort by quarter descending, then by time remaining ascending (most recent first)
      if (a.quarter !== b.quarter) return b.quarter - a.quarter;
      return a.timeRemaining - b.timeRemaining;
    });
  }, [filteredEvents]);

  // Auto-scroll to top (latest) when new events added
  useEffect(() => {
    if (autoScrollToLatest && listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [events.length, autoScrollToLatest]);

  if (sortedEvents.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-8 px-6">
        <div className="w-12 h-12 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center mb-3">
          <ClipboardDocumentListIcon className="w-6 h-6 text-surface-400" />
        </div>
        <p className="text-surface-900 dark:text-white text-sm font-semibold mb-1">
          No events recorded yet
        </p>
        <p className="text-surface-500 dark:text-surface-400 text-xs text-center">
          Events will appear here as the game progresses
        </p>
      </div>
    );
  }

  return (
    <div ref={listRef} className="h-full overflow-auto">
      {sortedEvents.map((event) => (
        <GameEventCard
          key={event._id}
          event={event}
          playerStats={playerStats}
          homeTeamId={homeTeamId}
        />
      ))}
    </div>
  );
};

export default PlayByPlayList;
