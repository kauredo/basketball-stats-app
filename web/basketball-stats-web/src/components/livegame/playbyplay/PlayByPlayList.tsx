import React, { useMemo, useRef, useEffect } from "react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { PlayByPlayEvent } from "../../../types/livegame";
import { GameEventCard } from "./GameEventCard";

interface PlayByPlayListProps {
  events: PlayByPlayEvent[];
  homeTeamId: Id<"teams">;
  filterQuarter?: number | "all";
  autoScrollToLatest?: boolean;
}

/**
 * Scrollable list of play-by-play events.
 * Supports filtering by quarter and auto-scrolling to latest.
 */
export const PlayByPlayList: React.FC<PlayByPlayListProps> = ({
  events,
  homeTeamId,
  filterQuarter = "all",
  autoScrollToLatest = true,
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
      <div className="h-full flex items-center justify-center text-surface-500 dark:text-surface-400 text-sm">
        No plays recorded yet
      </div>
    );
  }

  return (
    <div ref={listRef} className="h-full overflow-auto space-y-1 pr-1">
      {sortedEvents.map((event) => (
        <GameEventCard key={event._id} event={event} isHomeTeam={event.teamId === homeTeamId} />
      ))}
    </div>
  );
};

export default PlayByPlayList;
