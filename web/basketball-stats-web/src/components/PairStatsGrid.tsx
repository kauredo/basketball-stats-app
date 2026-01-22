import React, { useState, useMemo } from "react";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  UserGroupIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

interface PairPlayer {
  id: string;
  name: string;
  number: number;
}

interface PairData {
  player1: PairPlayer;
  player2: PairPlayer;
  player1Id: string;
  player2Id: string;
  minutesTogether: number;
  plusMinus: number;
  gamesPlayed: number;
  netRating: number;
}

interface PairStatsGridProps {
  pairs: PairData[];
  isLoading?: boolean;
  initialRowCount?: number;
}

type SortField = "minutesTogether" | "plusMinus" | "netRating" | "pmPerMin" | "gamesPlayed";
type SortDirection = "asc" | "desc";

// Compute additional stats
function computeStats(pair: PairData) {
  const minutes = pair.minutesTogether || 1;
  // Plus/minus per minute
  const pmPerMin = pair.plusMinus / minutes;

  return { pmPerMin };
}

// Get chemistry rating based on net rating (for visual indicator)
function getChemistryLevel(netRating: number): { label: string; color: string; bg: string } {
  if (netRating >= 15)
    return { label: "Elite", color: "text-green-600 dark:text-green-400", bg: "bg-green-500" };
  if (netRating >= 5)
    return { label: "Good", color: "text-green-600 dark:text-green-400", bg: "bg-green-400" };
  if (netRating >= -5) return { label: "Neutral", color: "text-surface-500", bg: "bg-surface-400" };
  if (netRating >= -15)
    return { label: "Poor", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500" };
  return { label: "Bad", color: "text-red-600 dark:text-red-400", bg: "bg-red-500" };
}

const PairStatsGrid: React.FC<PairStatsGridProps> = ({ pairs, isLoading, initialRowCount = 5 }) => {
  const [sortField, setSortField] = useState<SortField>("minutesTogether");
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

  const enrichedPairs = useMemo(() => {
    return pairs.map((pair) => ({
      ...pair,
      ...computeStats(pair),
    }));
  }, [pairs]);

  const sortedPairs = useMemo(() => {
    return [...enrichedPairs].sort((a, b) => {
      const multiplier = sortDirection === "asc" ? 1 : -1;
      const aVal = a[sortField as keyof typeof a] as number;
      const bVal = b[sortField as keyof typeof b] as number;
      return (aVal - bVal) * multiplier;
    });
  }, [enrichedPairs, sortField, sortDirection]);

  const displayedPairs = isExpanded ? sortedPairs : sortedPairs.slice(0, initialRowCount);

  const hasMore = sortedPairs.length > initialRowCount;

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
          <p className="text-sm text-surface-500">Loading chemistry data...</p>
        </div>
      </div>
    );
  }

  if (pairs.length === 0) {
    return (
      <div className="p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-surface-100 to-surface-200 dark:from-surface-700 dark:to-surface-800 flex items-center justify-center mb-4 shadow-soft">
            <UserGroupIcon className="w-7 h-7 text-surface-400" />
          </div>
          <p className="text-surface-900 dark:text-white font-semibold mb-1">
            No chemistry data yet
          </p>
          <p className="text-surface-500 dark:text-surface-400 text-sm max-w-[240px]">
            Play games to discover which player pairs have the best on-court synergy
          </p>
        </div>
      </div>
    );
  }

  // Find best pair for highlighting
  const maxNetRating = Math.max(...enrichedPairs.map((p) => p.netRating));

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-200 dark:border-surface-700">
              <th className="text-left py-3 px-4 font-medium text-[11px] uppercase tracking-wider text-surface-500 dark:text-surface-400">
                Player Pair
              </th>
              <th className="text-center py-3 px-2 font-medium text-[11px] uppercase tracking-wider text-surface-500 dark:text-surface-400">
                Chemistry
              </th>
              <SortHeader field="minutesTogether" label="MIN" title="Minutes Together" />
              <SortHeader field="plusMinus" label="+/−" title="Plus/Minus" />
              <SortHeader field="pmPerMin" label="+/− PM" title="Plus/Minus Per Minute" />
              <SortHeader field="netRating" label="NET" title="Net Rating (per 40 min)" />
              <SortHeader field="gamesPlayed" label="GP" title="Games Played" />
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {displayedPairs.map((pair, index) => {
              const chemistry = getChemistryLevel(pair.netRating);
              const isBestPair = pair.netRating === maxNetRating && maxNetRating > 5;

              return (
                <tr
                  key={`${pair.player1Id}-${pair.player2Id}`}
                  className={`
                    group transition-colors
                    ${isBestPair ? "bg-green-500/5 dark:bg-green-500/10" : ""}
                    hover:bg-surface-50 dark:hover:bg-surface-800/50
                  `}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {/* Rank */}
                      <span className="w-5 h-5 flex items-center justify-center rounded bg-surface-100 dark:bg-surface-700 text-[10px] font-bold text-surface-500 dark:text-surface-400">
                        {index + 1}
                      </span>
                      {/* Player pair display */}
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-700/80 text-[11px] font-medium text-surface-700 dark:text-surface-300">
                          <span className="text-surface-400 dark:text-surface-500">
                            {pair.player1.number}
                          </span>
                          <span>{pair.player1.name.split(" ").pop()}</span>
                        </span>
                        <span className="text-surface-300 dark:text-surface-600 text-xs">+</span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-700/80 text-[11px] font-medium text-surface-700 dark:text-surface-300">
                          <span className="text-surface-400 dark:text-surface-500">
                            {pair.player2.number}
                          </span>
                          <span>{pair.player2.name.split(" ").pop()}</span>
                        </span>
                      </div>
                      {/* Best pair badge */}
                      {isBestPair && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                          <SparklesIcon className="w-3 h-3" />
                          <span className="text-[10px] font-semibold uppercase tracking-wide">
                            Best
                          </span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center justify-center">
                      {/* Chemistry indicator dots */}
                      <div className="flex items-center gap-0.5" title={chemistry.label}>
                        {[...Array(5)].map((_, i) => {
                          const filled =
                            (pair.netRating >= 15 && i < 5) ||
                            (pair.netRating >= 5 && i < 4) ||
                            (pair.netRating >= -5 && i < 3) ||
                            (pair.netRating >= -15 && i < 2) ||
                            i < 1;
                          return (
                            <div
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                filled ? chemistry.bg : "bg-surface-200 dark:bg-surface-700"
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-3 px-2 tabular-nums text-sm text-surface-700 dark:text-surface-300">
                    {pair.minutesTogether.toFixed(1)}
                  </td>
                  <td className="text-right py-3 px-2">
                    <span
                      className={`
                        tabular-nums text-sm font-semibold
                        ${pair.plusMinus > 0 ? "text-green-600 dark:text-green-400" : ""}
                        ${pair.plusMinus < 0 ? "text-red-600 dark:text-red-400" : ""}
                        ${pair.plusMinus === 0 ? "text-surface-500" : ""}
                      `}
                    >
                      {pair.plusMinus > 0 ? "+" : ""}
                      {pair.plusMinus}
                    </span>
                  </td>
                  <td className="text-right py-3 px-2">
                    <span
                      className={`
                        tabular-nums text-sm font-medium
                        ${pair.pmPerMin > 0 ? "text-green-600 dark:text-green-400" : ""}
                        ${pair.pmPerMin < 0 ? "text-red-600 dark:text-red-400" : ""}
                        ${pair.pmPerMin === 0 ? "text-surface-500" : ""}
                      `}
                    >
                      {pair.pmPerMin > 0 ? "+" : ""}
                      {pair.pmPerMin.toFixed(2)}
                    </span>
                  </td>
                  <td className="text-right py-3 px-2">
                    <div className="flex items-center justify-end gap-1.5">
                      <span
                        className={`
                          tabular-nums text-sm font-semibold
                          ${pair.netRating > 0 ? "text-green-600 dark:text-green-400" : ""}
                          ${pair.netRating < 0 ? "text-red-600 dark:text-red-400" : ""}
                          ${pair.netRating === 0 ? "text-surface-500" : ""}
                        `}
                      >
                        {pair.netRating > 0 ? "+" : ""}
                        {pair.netRating.toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-2 tabular-nums text-sm text-surface-500">
                    {pair.gamesPlayed}
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
                Show {sortedPairs.length - initialRowCount} More
                <ChevronDownIcon className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default PairStatsGrid;
