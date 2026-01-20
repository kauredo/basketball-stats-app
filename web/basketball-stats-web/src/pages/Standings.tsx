import React, { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import {
  TrophyIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { exportToCSV, standingsColumns, printPage } from "../utils/export";

type SortField =
  | "rank"
  | "wins"
  | "losses"
  | "winPercentage"
  | "pointDiff"
  | "avgPointsFor"
  | "avgPointsAgainst";
type SortDirection = "asc" | "desc";

const validSortFields: SortField[] = [
  "rank",
  "wins",
  "losses",
  "winPercentage",
  "pointDiff",
  "avgPointsFor",
  "avgPointsAgainst",
];

const Standings: React.FC = () => {
  const { token, selectedLeague } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL params or defaults
  const [sortField, setSortField] = useState<SortField>(() => {
    const field = searchParams.get("sort") as SortField;
    return validSortFields.includes(field) ? field : "rank";
  });
  const [sortDirection, setSortDirection] = useState<SortDirection>(() => {
    const dir = searchParams.get("dir");
    return dir === "desc" ? "desc" : "asc";
  });

  // Sync state changes to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (sortField !== "rank") params.set("sort", sortField);
    if (sortDirection !== "asc") params.set("dir", sortDirection);
    setSearchParams(params, { replace: true });
  }, [sortField, sortDirection, setSearchParams]);

  const standingsData = useQuery(
    api.statistics.getStandings,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "rank" ? "asc" : "desc");
    }
  };

  const sortedStandings = standingsData?.standings
    ? [...standingsData.standings].sort((a, b) => {
        const multiplier = sortDirection === "asc" ? 1 : -1;
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (typeof aVal === "number" && typeof bVal === "number") {
          return (aVal - bVal) * multiplier;
        }
        return 0;
      })
    : [];

  const SortHeader: React.FC<{
    field: SortField;
    label: string;
    className?: string;
  }> = ({ field, label, className = "" }) => (
    <th
      className={`px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        {sortField === field && (
          <span className="text-orange-500">{sortDirection === "asc" ? "↑" : "↓"}</span>
        )}
      </div>
    </th>
  );

  if (standingsData === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            League Standings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {standingsData?.league?.name} - {standingsData?.league?.season}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Export Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => {
                if (sortedStandings.length > 0) {
                  const filename = `standings_${standingsData?.league?.name || "league"}_${new Date().toISOString().split("T")[0]}`;
                  exportToCSV(sortedStandings, standingsColumns, filename);
                }
              }}
              disabled={sortedStandings.length === 0}
              className="flex items-center space-x-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export to CSV"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>CSV</span>
            </button>
            <button
              onClick={printPage}
              className="flex items-center space-x-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm transition-colors"
              title="Print / Save as PDF"
            >
              <PrinterIcon className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Games</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {standingsData?.totalGames || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Standings Table */}
      {sortedStandings.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <SortHeader field="rank" label="#" className="w-12" />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Team
                  </th>
                  <SortHeader field="wins" label="W" />
                  <SortHeader field="losses" label="L" />
                  <SortHeader field="winPercentage" label="PCT" />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    GB
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Home
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Away
                  </th>
                  <SortHeader field="avgPointsFor" label="PPG" />
                  <SortHeader field="avgPointsAgainst" label="OPPG" />
                  <SortHeader field="pointDiff" label="DIFF" />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    L5
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    STRK
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedStandings.map((team, index) => (
                  <tr
                    key={team.teamId}
                    className={`hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors ${
                      index < 4
                        ? "bg-green-900/10"
                        : index >= sortedStandings.length - 2
                          ? "bg-red-900/10"
                          : ""
                    }`}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        {team.rank === 1 ? (
                          <TrophyIcon className="w-5 h-5 text-yellow-500" />
                        ) : (
                          <span className="text-gray-600 dark:text-gray-400 font-medium">
                            {team.rank}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mr-3">
                          <span className="text-xs font-bold text-gray-900 dark:text-white">
                            {team.teamName.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {team.teamName}
                          </div>
                          {team.city && <div className="text-xs text-gray-500">{team.city}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-green-400 font-medium">
                      {team.wins}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-red-400 font-medium">
                      {team.losses}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                      .{team.winPercentage.toFixed(0).padStart(3, "0")}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {team.gamesBack === 0 ? "-" : team.gamesBack.toFixed(1)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {team.homeRecord}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {team.awayRecord}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {team.avgPointsFor}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {team.avgPointsAgainst}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-medium ${
                          team.pointDiff > 0
                            ? "text-green-400"
                            : team.pointDiff < 0
                              ? "text-red-400"
                              : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {team.pointDiff > 0 ? "+" : ""}
                        {team.pointDiff}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex space-x-1">
                        {team.last5.map((result, i) => (
                          <span
                            key={i}
                            className={`w-5 h-5 rounded text-xs font-medium flex items-center justify-center ${
                              result === "W" ? "bg-green-600 text-white" : "bg-red-600 text-white"
                            }`}
                          >
                            {result}
                          </span>
                        ))}
                        {[...Array(5 - team.last5.length)].map((_, i) => (
                          <span
                            key={`empty-${i}`}
                            className="w-5 h-5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 text-xs font-medium flex items-center justify-center"
                          >
                            -
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        {team.streakType === "W" ? (
                          <ArrowTrendingUpIcon className="w-4 h-4 text-green-400" />
                        ) : team.streakType === "L" ? (
                          <ArrowTrendingDownIcon className="w-4 h-4 text-red-400" />
                        ) : null}
                        <span
                          className={`text-sm font-medium ${
                            team.streakType === "W"
                              ? "text-green-400"
                              : team.streakType === "L"
                                ? "text-red-400"
                                : "text-gray-500"
                          }`}
                        >
                          {team.streak}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
          <TrophyIcon className="mx-auto h-12 w-12 text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Standings Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Complete some games to see the league standings here.
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Legend</h4>
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 dark:text-gray-400">W</span>
            <span className="text-gray-500">- Wins</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 dark:text-gray-400">L</span>
            <span className="text-gray-500">- Losses</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 dark:text-gray-400">PCT</span>
            <span className="text-gray-500">- Win Percentage</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 dark:text-gray-400">GB</span>
            <span className="text-gray-500">- Games Back</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 dark:text-gray-400">PPG</span>
            <span className="text-gray-500">- Points Per Game</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 dark:text-gray-400">OPPG</span>
            <span className="text-gray-500">- Opponent PPG</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 dark:text-gray-400">DIFF</span>
            <span className="text-gray-500">- Point Differential</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 dark:text-gray-400">L5</span>
            <span className="text-gray-500">- Last 5 Games</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 dark:text-gray-400">STRK</span>
            <span className="text-gray-500">- Current Streak</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Standings;
