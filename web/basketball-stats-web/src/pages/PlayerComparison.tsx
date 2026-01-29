import React, { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import {
  UserIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
  ChevronDownIcon,
  MapIcon,
} from "@heroicons/react/24/outline";
import { PrintableShotChart } from "../components/export/PrintableShotChart";
import type { ShotLocation } from "../types/livegame";
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
import { PlayerSelectorModal } from "../components/PlayerSelectorModal";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

interface PlayerOption {
  id: Id<"players">;
  name: string;
  team: string;
  teamId: Id<"teams">;
  number: number;
  position?: string;
}

const PlayerComparison: React.FC = () => {
  const { token, selectedLeague } = useAuth();
  const [player1Id, setPlayer1Id] = useState<Id<"players"> | null>(null);
  const [player2Id, setPlayer2Id] = useState<Id<"players"> | null>(null);
  const [showPlayer1Modal, setShowPlayer1Modal] = useState(false);
  const [showPlayer2Modal, setShowPlayer2Modal] = useState(false);

  // Fetch all players for selection
  const teamsData = useQuery(
    api.teams.list,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  // Build player options from teams data
  const playerOptions: PlayerOption[] = useMemo(() => {
    const options: PlayerOption[] = [];
    if (teamsData?.teams) {
      for (const team of teamsData.teams) {
        if (team.players) {
          for (const player of team.players) {
            options.push({
              id: player.id as Id<"players">,
              name: player.name,
              team: team.name,
              teamId: team.id as Id<"teams">,
              number: player.number,
              position: player.position,
            });
          }
        }
      }
    }
    return options;
  }, [teamsData]);

  // Get selected player info for display
  const player1Info = playerOptions.find((p) => p.id === player1Id);
  const player2Info = playerOptions.find((p) => p.id === player2Id);

  // Fetch comparison data when both players are selected
  const comparisonData = useQuery(
    api.statistics.comparePlayersStats,
    token && selectedLeague && player1Id && player2Id
      ? { token, leagueId: selectedLeague.id, player1Id, player2Id }
      : "skip"
  );

  // Fetch shot chart data for both players
  const player1ShotData = useQuery(
    api.shots.getPlayerShotChart,
    token && selectedLeague && player1Id
      ? { token, leagueId: selectedLeague.id, playerId: player1Id }
      : "skip"
  );

  const player2ShotData = useQuery(
    api.shots.getPlayerShotChart,
    token && selectedLeague && player2Id
      ? { token, leagueId: selectedLeague.id, playerId: player2Id }
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

  // Prepare normalized radar chart data
  const radarData = useMemo(() => {
    if (!comparisonData) return [];

    const p1 = comparisonData.player1;
    const p2 = comparisonData.player2;

    // Get max of both players for each stat to normalize to 0-100 scale
    const normalize = (v1: number, v2: number) => {
      const max = Math.max(v1, v2, 1);
      return {
        p1Normalized: (v1 / max) * 100,
        p2Normalized: (v2 / max) * 100,
        p1Actual: v1,
        p2Actual: v2,
      };
    };

    const points = normalize(p1.avgPoints, p2.avgPoints);
    const rebounds = normalize(p1.avgRebounds, p2.avgRebounds);
    const assists = normalize(p1.avgAssists, p2.avgAssists);
    const steals = normalize(p1.avgSteals, p2.avgSteals);
    const blocks = normalize(p1.avgBlocks, p2.avgBlocks);

    return [
      {
        stat: "Points",
        player1: points.p1Normalized,
        player2: points.p2Normalized,
        actual1: points.p1Actual,
        actual2: points.p2Actual,
      },
      {
        stat: "Rebounds",
        player1: rebounds.p1Normalized,
        player2: rebounds.p2Normalized,
        actual1: rebounds.p1Actual,
        actual2: rebounds.p2Actual,
      },
      {
        stat: "Assists",
        player1: assists.p1Normalized,
        player2: assists.p2Normalized,
        actual1: assists.p1Actual,
        actual2: assists.p2Actual,
      },
      {
        stat: "Steals",
        player1: steals.p1Normalized,
        player2: steals.p2Normalized,
        actual1: steals.p1Actual,
        actual2: steals.p2Actual,
      },
      {
        stat: "Blocks",
        player1: blocks.p1Normalized,
        player2: blocks.p2Normalized,
        actual1: blocks.p1Actual,
        actual2: blocks.p2Actual,
      },
    ];
  }, [comparisonData]);

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

  // Custom tooltip for radar chart showing actual values
  const CustomRadarTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: { stat: string; actual1: number; actual2: number } }>;
  }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface-800 border border-surface-700 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-white mb-2">{data.stat}</p>
          <p className="text-sm text-primary-400">
            {comparisonData?.player1.playerName}: {data.actual1}
          </p>
          <p className="text-sm text-blue-400">
            {comparisonData?.player2.playerName}: {data.actual2}
          </p>
        </div>
      );
    }
    return null;
  };

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
          <button
            onClick={() => setShowPlayer1Modal(true)}
            className="w-full px-4 py-3 bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl text-left flex items-center justify-between hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          >
            {player1Info ? (
              <span className="text-surface-900 dark:text-white">
                #{player1Info.number} {player1Info.name}
                <span className="text-surface-500 ml-2">({player1Info.team})</span>
              </span>
            ) : (
              <span className="text-surface-400">Select a player</span>
            )}
            <ChevronDownIcon className="w-5 h-5 text-surface-400" />
          </button>
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
          <button
            onClick={() => setShowPlayer2Modal(true)}
            className="w-full px-4 py-3 bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl text-left flex items-center justify-between hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          >
            {player2Info ? (
              <span className="text-surface-900 dark:text-white">
                #{player2Info.number} {player2Info.name}
                <span className="text-surface-500 ml-2">({player2Info.team})</span>
              </span>
            ) : (
              <span className="text-surface-400">Select a player</span>
            )}
            <ChevronDownIcon className="w-5 h-5 text-surface-400" />
          </button>
        </div>
      </div>

      {/* Player Selection Modals */}
      <PlayerSelectorModal
        isOpen={showPlayer1Modal}
        onClose={() => setShowPlayer1Modal(false)}
        onSelect={setPlayer1Id}
        players={playerOptions}
        selectedId={player1Id}
        excludeIds={player2Id ? [player2Id] : []}
        title="Select Player 1"
      />
      <PlayerSelectorModal
        isOpen={showPlayer2Modal}
        onClose={() => setShowPlayer2Modal(false)}
        onSelect={setPlayer2Id}
        players={playerOptions}
        selectedId={player2Id}
        excludeIds={player1Id ? [player1Id] : []}
        title="Select Player 2"
      />

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
                      formatter={(value) => (value != null ? `${Number(value).toFixed(1)}%` : "")}
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
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
              Overall Comparison
            </h3>
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
              Stats normalized to 0-100 scale for comparison. Hover for actual values.
            </p>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--color-surface-700)" />
                  {/* @ts-expect-error - recharts types not fully compatible with React 19 */}
                  <PolarAngleAxis dataKey="stat" tick={{ fill: "var(--color-surface-500)" }} />
                  <PolarRadiusAxis
                    domain={[0, 100]}
                    tick={{ fill: "var(--color-surface-500)" }}
                    tickCount={5}
                  />
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
                  <Tooltip content={<CustomRadarTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Shot Chart Comparison */}
          <div className="surface-card p-6">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2 flex items-center">
              <MapIcon className="w-5 h-5 mr-2 text-primary-500" />
              Shot Chart Comparison
            </h3>
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">
              Side-by-side shooting locations with heatmap visualization
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Player 1 Shot Chart */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                  <span className="font-medium text-surface-900 dark:text-white">
                    {comparisonData.player1.playerName}
                  </span>
                </div>
                {player1ShotData?.shots && player1ShotData.shots.length > 0 ? (
                  <div className="flex flex-col items-center">
                    <PrintableShotChart
                      shots={
                        player1ShotData.shots.map((s) => ({
                          x: s.x,
                          y: s.y,
                          made: s.made,
                          is3pt: s.shotType === "3pt",
                        })) as ShotLocation[]
                      }
                      width={280}
                      height={264}
                      showHeatMap={true}
                      theme="light"
                    />
                    <div className="mt-3 text-sm text-surface-600 dark:text-surface-400">
                      {player1ShotData.shots.length} shots •{" "}
                      {player1ShotData.stats?.overallPercentage.toFixed(1)}% FG
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 bg-surface-100 dark:bg-surface-800 rounded-xl">
                    <p className="text-surface-500">No shot data available</p>
                  </div>
                )}
              </div>

              {/* Player 2 Shot Chart */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="font-medium text-surface-900 dark:text-white">
                    {comparisonData.player2.playerName}
                  </span>
                </div>
                {player2ShotData?.shots && player2ShotData.shots.length > 0 ? (
                  <div className="flex flex-col items-center">
                    <PrintableShotChart
                      shots={
                        player2ShotData.shots.map((s) => ({
                          x: s.x,
                          y: s.y,
                          made: s.made,
                          is3pt: s.shotType === "3pt",
                        })) as ShotLocation[]
                      }
                      width={280}
                      height={264}
                      showHeatMap={true}
                      theme="light"
                    />
                    <div className="mt-3 text-sm text-surface-600 dark:text-surface-400">
                      {player2ShotData.shots.length} shots •{" "}
                      {player2ShotData.stats?.overallPercentage.toFixed(1)}% FG
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 bg-surface-100 dark:bg-surface-800 rounded-xl">
                    <p className="text-surface-500">No shot data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Zone Comparison */}
            {player1ShotData?.stats && player2ShotData?.stats && (
              <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-700">
                <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4">
                  Shooting by Zone
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {/* 2-Point */}
                  <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-4">
                    <p className="text-xs text-surface-500 uppercase tracking-wide mb-2">2-Point</p>
                    <div className="flex justify-between items-baseline">
                      <span className="text-lg font-bold text-primary-500">
                        {player1ShotData.stats.twoPoint?.percentage?.toFixed(1) ?? "0.0"}%
                      </span>
                      <span className="text-lg font-bold text-blue-500">
                        {player2ShotData.stats.twoPoint?.percentage?.toFixed(1) ?? "0.0"}%
                      </span>
                    </div>
                  </div>

                  {/* Three-Point */}
                  <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-4">
                    <p className="text-xs text-surface-500 uppercase tracking-wide mb-2">3-Point</p>
                    <div className="flex justify-between items-baseline">
                      <span className="text-lg font-bold text-primary-500">
                        {player1ShotData.stats.threePoint?.percentage?.toFixed(1) ?? "0.0"}%
                      </span>
                      <span className="text-lg font-bold text-blue-500">
                        {player2ShotData.stats.threePoint?.percentage?.toFixed(1) ?? "0.0"}%
                      </span>
                    </div>
                  </div>

                  {/* Overall FG */}
                  <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-4">
                    <p className="text-xs text-surface-500 uppercase tracking-wide mb-2">
                      Overall FG
                    </p>
                    <div className="flex justify-between items-baseline">
                      <span className="text-lg font-bold text-primary-500">
                        {player1ShotData.stats.overallPercentage?.toFixed(1) ?? "0.0"}%
                      </span>
                      <span className="text-lg font-bold text-blue-500">
                        {player2ShotData.stats.overallPercentage?.toFixed(1) ?? "0.0"}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : player1Id && player2Id ? (
        <LoadingSpinner label="Loading comparison" />
      ) : (
        <div className="surface-card p-12 text-center">
          <UserIcon className="mx-auto h-12 w-12 text-surface-400 mb-4" />
          <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
            Select Players to Compare
          </h3>
          <p className="text-surface-600 dark:text-surface-400">
            Choose two players from the buttons above to see a side-by-side comparison of their
            statistics.
          </p>
        </div>
      )}
    </div>
  );
};

export default PlayerComparison;
