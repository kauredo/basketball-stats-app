import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import { UserIcon, ArrowsRightLeftIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface PlayerOption {
  id: Id<"players">;
  name: string;
  team: string;
  number: number;
  position?: string;
}

const PlayerComparison: React.FC = () => {
  const { token, selectedLeague } = useAuth();
  const [player1Id, setPlayer1Id] = useState<Id<"players"> | null>(null);
  const [player2Id, setPlayer2Id] = useState<Id<"players"> | null>(null);

  // Fetch all players for selection
  const teamsData = useQuery(
    api.teams.list,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  // Build player options from teams data
  const playerOptions: PlayerOption[] = [];
  if (teamsData?.teams) {
    for (const team of teamsData.teams) {
      if (team.players) {
        for (const player of team.players) {
          playerOptions.push({
            id: player.id as Id<"players">,
            name: player.name,
            team: team.name,
            number: player.number,
            position: player.position,
          });
        }
      }
    }
  }

  // Fetch comparison data when both players are selected
  const comparisonData = useQuery(
    api.statistics.comparePlayersStats,
    token && selectedLeague && player1Id && player2Id
      ? { token, leagueId: selectedLeague.id, player1Id, player2Id }
      : "skip"
  );

  const StatComparison: React.FC<{
    label: string;
    value1: number;
    value2: number;
    unit?: string;
    higherIsBetter?: boolean;
  }> = ({ label, value1, value2, unit = "", higherIsBetter = true }) => {
    const winner =
      value1 === value2
        ? null
        : higherIsBetter
          ? value1 > value2
            ? 1
            : 2
          : value1 < value2
            ? 1
            : 2;

    return (
      <div className="flex items-center py-3 border-b border-surface-200 dark:border-surface-700 last:border-0">
        <div className="flex-1 text-right">
          <span
            className={`text-lg font-bold tabular-nums ${winner === 1 ? "text-green-500" : "text-surface-900 dark:text-white"}`}
            data-stat
          >
            {value1}
            {unit}
          </span>
        </div>
        <div className="w-32 text-center">
          <span className="text-sm text-surface-600 dark:text-surface-400">{label}</span>
        </div>
        <div className="flex-1 text-left">
          <span
            className={`text-lg font-bold tabular-nums ${winner === 2 ? "text-green-500" : "text-surface-900 dark:text-white"}`}
            data-stat
          >
            {value2}
            {unit}
          </span>
        </div>
      </div>
    );
  };

  // Prepare radar chart data
  const radarData = comparisonData
    ? [
        {
          stat: "Points",
          player1: comparisonData.player1.avgPoints,
          player2: comparisonData.player2.avgPoints,
        },
        {
          stat: "Rebounds",
          player1: comparisonData.player1.avgRebounds,
          player2: comparisonData.player2.avgRebounds,
        },
        {
          stat: "Assists",
          player1: comparisonData.player1.avgAssists,
          player2: comparisonData.player2.avgAssists,
        },
        {
          stat: "Steals",
          player1: comparisonData.player1.avgSteals,
          player2: comparisonData.player2.avgSteals,
        },
        {
          stat: "Blocks",
          player1: comparisonData.player1.avgBlocks,
          player2: comparisonData.player2.avgBlocks,
        },
      ]
    : [];

  // Prepare shooting chart data
  const shootingData = comparisonData
    ? [
        {
          name: "FG%",
          player1: comparisonData.player1.fieldGoalPercentage,
          player2: comparisonData.player2.fieldGoalPercentage,
        },
        {
          name: "3P%",
          player1: comparisonData.player1.threePointPercentage,
          player2: comparisonData.player2.threePointPercentage,
        },
        {
          name: "FT%",
          player1: comparisonData.player1.freeThrowPercentage,
          player2: comparisonData.player2.freeThrowPercentage,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-display-sm text-surface-900 dark:text-white mb-2">Player Comparison</h1>
        <p className="text-surface-600 dark:text-surface-400">
          Compare statistics between two players
        </p>
      </div>

      {/* Player Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Player 1 Select */}
        <div className="surface-card p-4">
          <label className="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-2">
            Player 1
          </label>
          <select
            value={player1Id || ""}
            onChange={(e) => setPlayer1Id((e.target.value as Id<"players">) || null)}
            className="w-full px-4 py-3 bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          >
            <option value="">Select a player</option>
            {playerOptions.map((player) => (
              <option key={player.id} value={player.id} disabled={player.id === player2Id}>
                #{player.number} {player.name} ({player.team})
              </option>
            ))}
          </select>
        </div>

        {/* VS Icon */}
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center shadow-soft">
            <ArrowsRightLeftIcon className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Player 2 Select */}
        <div className="surface-card p-4">
          <label className="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-2">
            Player 2
          </label>
          <select
            value={player2Id || ""}
            onChange={(e) => setPlayer2Id((e.target.value as Id<"players">) || null)}
            className="w-full px-4 py-3 bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          >
            <option value="">Select a player</option>
            {playerOptions.map((player) => (
              <option key={player.id} value={player.id} disabled={player.id === player1Id}>
                #{player.number} {player.name} ({player.team})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Results */}
      {comparisonData ? (
        <div className="space-y-6">
          {/* Player Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Player 1 Card */}
            <div className="surface-card p-6 border-l-4 border-primary-500">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white tracking-tight">
                    #{comparisonData.player1.number}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-surface-900 dark:text-white">
                    {comparisonData.player1.playerName}
                  </h3>
                  <p className="text-surface-600 dark:text-surface-400">
                    {comparisonData.player1.teamName} • {comparisonData.player1.position || "N/A"}
                  </p>
                  <p className="text-sm text-surface-500">
                    {comparisonData.player1.gamesPlayed} games played
                  </p>
                </div>
              </div>
            </div>

            {/* Player 2 Card */}
            <div className="surface-card p-6 border-l-4 border-blue-500">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white tracking-tight">
                    #{comparisonData.player2.number}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-surface-900 dark:text-white">
                    {comparisonData.player2.playerName}
                  </h3>
                  <p className="text-surface-600 dark:text-surface-400">
                    {comparisonData.player2.teamName} • {comparisonData.player2.position || "N/A"}
                  </p>
                  <p className="text-sm text-surface-500">
                    {comparisonData.player2.gamesPlayed} games played
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Per Game Averages */}
            <div className="surface-card p-6">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center">
                <ChartBarIcon className="w-5 h-5 mr-2 text-primary-500" />
                Per Game Averages
              </h3>
              <div className="flex items-center mb-4 text-sm">
                <div className="flex-1 text-right">
                  <span className="text-primary-500 font-medium">
                    {comparisonData.player1.playerName}
                  </span>
                </div>
                <div className="w-32"></div>
                <div className="flex-1 text-left">
                  <span className="text-blue-500 font-medium">
                    {comparisonData.player2.playerName}
                  </span>
                </div>
              </div>
              <StatComparison
                label="Points"
                value1={comparisonData.player1.avgPoints}
                value2={comparisonData.player2.avgPoints}
              />
              <StatComparison
                label="Rebounds"
                value1={comparisonData.player1.avgRebounds}
                value2={comparisonData.player2.avgRebounds}
              />
              <StatComparison
                label="Assists"
                value1={comparisonData.player1.avgAssists}
                value2={comparisonData.player2.avgAssists}
              />
              <StatComparison
                label="Steals"
                value1={comparisonData.player1.avgSteals}
                value2={comparisonData.player2.avgSteals}
              />
              <StatComparison
                label="Blocks"
                value1={comparisonData.player1.avgBlocks}
                value2={comparisonData.player2.avgBlocks}
              />
              <StatComparison
                label="Turnovers"
                value1={comparisonData.player1.avgTurnovers}
                value2={comparisonData.player2.avgTurnovers}
                higherIsBetter={false}
              />
              <StatComparison
                label="Minutes"
                value1={comparisonData.player1.avgMinutes}
                value2={comparisonData.player2.avgMinutes}
              />
            </div>

            {/* Shooting Stats */}
            <div className="surface-card p-6">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
                Shooting Percentages
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shootingData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-700)" />
                    <XAxis type="number" domain={[0, 100]} stroke="var(--color-surface-500)" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="var(--color-surface-500)"
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-surface-800)",
                        border: "1px solid var(--color-surface-700)",
                        borderRadius: "12px",
                        color: "white",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="player1"
                      name={comparisonData.player1.playerName}
                      fill="#f97316"
                      radius={[0, 4, 4, 0]}
                    />
                    <Bar
                      dataKey="player2"
                      name={comparisonData.player2.playerName}
                      fill="#3b82f6"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="surface-card p-6">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
              Overall Comparison
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--color-surface-700)" />
                  {/* @ts-expect-error - recharts types not fully compatible with React 19 */}
                  <PolarAngleAxis dataKey="stat" tick={{ fill: "var(--color-surface-500)" }} />
                  <PolarRadiusAxis tick={{ fill: "var(--color-surface-500)" }} />
                  <Radar
                    name={comparisonData.player1.playerName}
                    dataKey="player1"
                    stroke="#f97316"
                    fill="#f97316"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name={comparisonData.player2.playerName}
                    dataKey="player2"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : player1Id && player2Id ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="surface-card p-12 text-center">
          <UserIcon className="mx-auto h-12 w-12 text-surface-400 mb-4" />
          <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
            Select Players to Compare
          </h3>
          <p className="text-surface-600 dark:text-surface-400">
            Choose two players from the dropdowns above to see a side-by-side comparison of their
            statistics.
          </p>
        </div>
      )}
    </div>
  );
};

export default PlayerComparison;
