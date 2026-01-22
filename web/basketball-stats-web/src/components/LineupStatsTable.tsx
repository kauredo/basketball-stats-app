import React, { useState, useMemo } from "react";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronDownIcon as ExpandIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

interface LineupPlayer {
  id: string;
  name: string;
  number: number;
}

interface LineupData {
  players: LineupPlayer[];
  playerIds: string[];
  minutesPlayed: number;
  pointsScored: number;
  pointsAllowed: number;
  plusMinus: number;
  gamesPlayed: number;
  netRating: number;
}

interface LineupStatsTableProps {
  lineups: LineupData[];
  isLoading?: boolean;
  initialRowCount?: number;
}

type SortField = "minutesPlayed" | "plusMinus" | "netRating" | "offRating" | "defRating" | "gamesPlayed";
type SortDirection = "asc" | "desc";

// Compute additional stats
function computeStats(lineup: LineupData) {
  const minutes = lineup.minutesPlayed || 1;
  // Points per minute
  const ppm = lineup.pointsScored / minutes;
  // Offensive rating (points per 100 possessions approximation - using per 40 min as proxy)
  const offRating = (lineup.pointsScored / minutes) * 40;
  // Defensive rating
  const defRating = (lineup.pointsAllowed / minutes) * 40;
  // Plus/minus per minute
  const pmPerMin = lineup.plusMinus / minutes;

  return { ppm, offRating, defRating, pmPerMin };
}

const LineupStatsTable: React.FC<LineupStatsTableProps> = ({
  lineups,
  isLoading,
  initialRowCount = 5,
}) => {
  const [sortField, setSortField] = useState<SortField>("minutesPlayed");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const enrichedLineups = useMemo(() => {
    return lineups.map((lineup) => ({
      ...lineup,
      ...computeStats(lineup),
    }));
  }, [lineups]);

  const sortedLineups = useMemo(() => {
    return [...enrichedLineups].sort((a, b) => {
      const multiplier = sortDirection === "asc" ? 1 : -1;
      const aVal = a[sortField as keyof typeof a] as number;
      const bVal = b[sortField as keyof typeof b] as number;
      return (aVal - bVal) * multiplier;
    });
  }, [enrichedLineups, sortField, sortDirection]);

  const displayedLineups = isExpanded
    ? sortedLineups
    : sortedLineups.slice(0, initialRowCount);

  const hasMore = sortedLineups.length > initialRowCount;

  const SortHeader = ({
    field,
    label,
    title,
  }: {
    field: SortField;
    label: string;
    title?: string;
  }) => (
    <th
      className="text-right py-3 px-2 font-medium text-[11px] uppercase tracking-wider text-surface-500 dark:text-surface-400 cursor-pointer select-none group transition-colors hover:text-surface-900 dark:hover:text-white"
      onClick={() => handleSort(field)}
      title={title}
    >
      <span className="inline-flex items-center gap-0.5">
        {label}
        <span className="w-3 h-3 inline-flex items-center justify-center">
          {sortField === field ? (
            sortDirection === "asc" ? (
              <ChevronUpIcon className="w-3 h-3" />
            ) : (
              <ChevronDownIcon className="w-3 h-3" />
            )
          ) : (
            <span className="w-3 h-3 opacity-0 group-hover:opacity-30 transition-opacity">
              <ChevronDownIcon className="w-3 h-3" />
            </span>
          )}
        </span>
      </span>
    </th>
  );

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-surface-200 dark:border-surface-700" />
            <div className="absolute inset-0 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-surface-500">Loading lineups...</p>
        </div>
      </div>
    );
  }

  if (lineups.length === 0) {
    return (
      <div className="p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-surface-100 to-surface-200 dark:from-surface-700 dark:to-surface-800 flex items-center justify-center mb-4 shadow-soft">
            <UsersIcon className="w-7 h-7 text-surface-400" />
          </div>
          <p className="text-surface-900 dark:text-white font-semibold mb-1">
            No lineup data yet
          </p>
          <p className="text-surface-500 dark:text-surface-400 text-sm max-w-[240px]">
            Play games with this team to see how different 5-man combinations perform
          </p>
        </div>
      </div>
    );
  }

  // Find best/worst for highlighting
  const maxNetRating = Math.max(...enrichedLineups.map((l) => l.netRating));
  const minNetRating = Math.min(...enrichedLineups.map((l) => l.netRating));

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-200 dark:border-surface-700">
              <th className="text-left py-3 px-4 font-medium text-[11px] uppercase tracking-wider text-surface-500 dark:text-surface-400">
                Lineup
              </th>
              <SortHeader field="minutesPlayed" label="MIN" title="Minutes Played" />
              <SortHeader field="plusMinus" label="+/−" title="Plus/Minus" />
              <SortHeader field="netRating" label="NET" title="Net Rating (per 40 min)" />
              <SortHeader field="offRating" label="OFF" title="Offensive Rating (per 40 min)" />
              <SortHeader field="defRating" label="DEF" title="Defensive Rating (per 40 min)" />
              <SortHeader field="gamesPlayed" label="GP" title="Games Played" />
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {displayedLineups.map((lineup, index) => {
              const isTopPerformer = lineup.netRating === maxNetRating && maxNetRating > 0;
              const isWorstPerformer = lineup.netRating === minNetRating && minNetRating < 0;

              return (
                <tr
                  key={lineup.playerIds.join("-")}
                  className={`
                    group transition-colors
                    ${isTopPerformer ? "bg-green-500/5 dark:bg-green-500/10" : ""}
                    ${isWorstPerformer ? "bg-red-500/5 dark:bg-red-500/10" : ""}
                    hover:bg-surface-50 dark:hover:bg-surface-800/50
                  `}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {/* Rank indicator */}
                      <span className="w-5 h-5 flex items-center justify-center rounded bg-surface-100 dark:bg-surface-700 text-[10px] font-bold text-surface-500 dark:text-surface-400">
                        {index + 1}
                      </span>
                      {/* Player chips */}
                      <div className="flex flex-wrap gap-1">
                        {lineup.players.map((player) => (
                          <span
                            key={player.id}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-700/80 text-[11px] font-medium text-surface-700 dark:text-surface-300"
                          >
                            <span className="text-surface-400 dark:text-surface-500">
                              {player.number}
                            </span>
                            <span>{player.name.split(" ").pop()}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-3 px-2 tabular-nums text-sm text-surface-700 dark:text-surface-300">
                    {lineup.minutesPlayed.toFixed(1)}
                  </td>
                  <td className="text-right py-3 px-2">
                    <span
                      className={`
                        inline-flex items-center justify-end tabular-nums text-sm font-semibold min-w-[40px]
                        ${lineup.plusMinus > 0 ? "text-green-600 dark:text-green-400" : ""}
                        ${lineup.plusMinus < 0 ? "text-red-600 dark:text-red-400" : ""}
                        ${lineup.plusMinus === 0 ? "text-surface-500" : ""}
                      `}
                    >
                      {lineup.plusMinus > 0 ? "+" : ""}
                      {lineup.plusMinus}
                    </span>
                  </td>
                  <td className="text-right py-3 px-2">
                    <div className="flex items-center justify-end gap-1.5">
                      <span
                        className={`
                          tabular-nums text-sm font-semibold
                          ${lineup.netRating > 0 ? "text-green-600 dark:text-green-400" : ""}
                          ${lineup.netRating < 0 ? "text-red-600 dark:text-red-400" : ""}
                          ${lineup.netRating === 0 ? "text-surface-500" : ""}
                        `}
                      >
                        {lineup.netRating > 0 ? "+" : ""}
                        {lineup.netRating.toFixed(1)}
                      </span>
                      {/* Visual indicator bar */}
                      <div className="w-12 h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className={`h-full rounded-full transition-all ${
                            lineup.netRating >= 0
                              ? "bg-green-500 dark:bg-green-400"
                              : "bg-red-500 dark:bg-red-400"
                          }`}
                          style={{
                            width: `${Math.min(Math.abs(lineup.netRating) * 2, 100)}%`,
                            marginLeft: lineup.netRating < 0 ? "auto" : 0,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-3 px-2 tabular-nums text-sm text-surface-600 dark:text-surface-400">
                    {lineup.offRating.toFixed(1)}
                  </td>
                  <td className="text-right py-3 px-2 tabular-nums text-sm text-surface-600 dark:text-surface-400">
                    {lineup.defRating.toFixed(1)}
                  </td>
                  <td className="text-right py-3 px-2 tabular-nums text-sm text-surface-500 dark:text-surface-500">
                    {lineup.gamesPlayed}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Show More / Show Less */}
      {hasMore && (
        <div className="px-4 py-3 border-t border-surface-100 dark:border-surface-800">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg text-sm font-medium text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-colors"
          >
            {isExpanded ? (
              <>
                Show Less
                <ChevronUpIcon className="w-4 h-4" />
              </>
            ) : (
              <>
                Show {sortedLineups.length - initialRowCount} More
                <ExpandIcon className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default LineupStatsTable;
