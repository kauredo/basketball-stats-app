import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { ChartBarIcon } from "@heroicons/react/24/outline";

interface TimelineEvent {
  id: string;
  quarter: number;
  gameTimeElapsed: number;
  gameTimeElapsedFormatted: string;
  homeScore: number;
  awayScore: number;
  scoreDifferential: number;
  description?: string;
  points?: number;
  isHomeTeam?: boolean | null;
}

interface QuarterBoundary {
  quarter: number;
  gameTimeElapsed: number;
  label: string;
}

interface ScoringRun {
  startIndex: number;
  endIndex: number;
  team: "home" | "away";
  points: number;
  opponentPoints: number;
  quarter: number;
  description: string;
}

interface GameFlowChartProps {
  timeline: TimelineEvent[];
  quarterBoundaries: QuarterBoundary[];
  runs: ScoringRun[];
  homeTeamName: string;
  awayTeamName: string;
  summary: {
    finalHomeScore: number;
    finalAwayScore: number;
    largestLead: { home: number; away: number };
    leadChanges: number;
    timesTied: number;
  };
}

// Custom tooltip component
const CustomTooltip = ({
  active,
  payload,
  homeTeamName,
  awayTeamName,
}: {
  active?: boolean;
  payload?: Array<{ payload: TimelineEvent }>;
  homeTeamName: string;
  awayTeamName: string;
}) => {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0].payload;
  const differential = data.scoreDifferential;
  const leader = differential > 0 ? homeTeamName : differential < 0 ? awayTeamName : "Tied";

  return (
    <div className="bg-surface-900 dark:bg-surface-700 text-white rounded-lg p-3 shadow-lg border border-surface-700 dark:border-surface-600">
      <p className="text-xs text-surface-300 mb-1">
        Q{data.quarter} - {data.gameTimeElapsedFormatted}
      </p>
      <div className="flex items-center gap-4 mb-2">
        <div className="text-center">
          <p className="text-xs text-primary-400">{homeTeamName}</p>
          <p className="text-lg font-bold">{data.homeScore}</p>
        </div>
        <span className="text-surface-400">-</span>
        <div className="text-center">
          <p className="text-xs text-blue-400">{awayTeamName}</p>
          <p className="text-lg font-bold">{data.awayScore}</p>
        </div>
      </div>
      <p
        className={`text-xs font-medium ${
          differential > 0
            ? "text-primary-400"
            : differential < 0
              ? "text-blue-400"
              : "text-surface-300"
        }`}
      >
        {differential === 0 ? "Tied" : `${leader} +${Math.abs(differential)}`}
      </p>
      {data.description && data.points && (
        <p className="text-xs text-surface-400 mt-1 border-t border-surface-600 pt-1">
          {data.description}
        </p>
      )}
    </div>
  );
};

export const GameFlowChart: React.FC<GameFlowChartProps> = ({
  timeline,
  quarterBoundaries,
  runs,
  homeTeamName,
  awayTeamName,
  summary,
}) => {
  const [showRuns, setShowRuns] = useState(true);

  const hasData = timeline.length > 1;

  if (!hasData) {
    return (
      <div className="surface-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <ChartBarIcon className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-bold text-surface-900 dark:text-white">Game Flow</h3>
        </div>
        <p className="text-sm text-surface-500 dark:text-surface-400 text-center py-8">
          Game flow chart will appear once scoring events are recorded
        </p>
      </div>
    );
  }

  // Calculate Y-axis domain based on max lead
  const maxDiff = Math.max(summary.largestLead.home, summary.largestLead.away, 10);
  const yDomain = [-Math.ceil(maxDiff / 5) * 5, Math.ceil(maxDiff / 5) * 5];

  // Format X-axis ticks to show time
  const formatXAxis = (value: number) => {
    const minutes = Math.floor(value / 60);
    return `${minutes}:00`;
  };

  return (
    <div className="surface-card overflow-hidden">
      <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-primary-500" />
            <h3 className="font-bold text-surface-900 dark:text-white">Game Flow</h3>
          </div>
          {runs.length > 0 && (
            <button
              onClick={() => setShowRuns(!showRuns)}
              className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                showRuns
                  ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                  : "bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400"
              }`}
            >
              {showRuns ? "Hide Runs" : "Show Runs"}
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Team legend */}
        <div className="flex items-center justify-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary-500" />
            <span className="text-sm text-surface-600 dark:text-surface-400">
              {homeTeamName} lead
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm text-surface-600 dark:text-surface-400">
              {awayTeamName} lead
            </span>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeline} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-surface-200)"
              className="dark:stroke-surface-700"
            />

            {/* Quarter boundaries */}
            {quarterBoundaries.map((boundary) => (
              <ReferenceLine
                key={boundary.quarter}
                x={boundary.gameTimeElapsed}
                stroke="var(--color-surface-400)"
                strokeDasharray="5 5"
                label={{
                  value: boundary.label,
                  position: "top",
                  fill: "var(--color-surface-500)",
                  fontSize: 10,
                }}
              />
            ))}

            {/* Zero line (tie game) */}
            <ReferenceLine y={0} stroke="var(--color-surface-600)" strokeWidth={2} />

            {/* Scoring runs highlights */}
            {showRuns &&
              runs.map((run, index) => {
                const startEvent = timeline[run.startIndex];
                const endEvent = timeline[run.endIndex];
                if (!startEvent || !endEvent) return null;

                return (
                  <ReferenceArea
                    key={index}
                    x1={startEvent.gameTimeElapsed}
                    x2={endEvent.gameTimeElapsed}
                    y1={run.team === "home" ? 0 : yDomain[0]}
                    y2={run.team === "home" ? yDomain[1] : 0}
                    fill={run.team === "home" ? "#3b82f6" : "#f97316"}
                    fillOpacity={0.1}
                  />
                );
              })}

            <XAxis
              dataKey="gameTimeElapsed"
              tickFormatter={formatXAxis}
              stroke="var(--color-surface-500)"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              domain={yDomain}
              stroke="var(--color-surface-500)"
              fontSize={11}
              tickLine={false}
              tickFormatter={(value) => (value > 0 ? `+${value}` : value.toString())}
            />
            <Tooltip
              content={<CustomTooltip homeTeamName={homeTeamName} awayTeamName={awayTeamName} />}
            />

            {/* Main line with gradient based on score differential */}
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#6b7280" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
            <Line
              type="stepAfter"
              dataKey="scoreDifferential"
              stroke="url(#lineGradient)"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 6,
                fill: "#f97316",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Game Summary Stats */}
        <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary-500">+{summary.largestLead.home}</p>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                {homeTeamName} largest
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-500">+{summary.largestLead.away}</p>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                {awayTeamName} largest
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">
                {summary.leadChanges}
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400">Lead changes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">
                {summary.timesTied}
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400">Times tied</p>
            </div>
          </div>
        </div>

        {/* Scoring Runs */}
        {runs.length > 0 && showRuns && (
          <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
            <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">
              Scoring Runs (8+ points)
            </h4>
            <div className="flex flex-wrap gap-2">
              {runs.map((run, index) => (
                <div
                  key={index}
                  className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    run.team === "home"
                      ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                      : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  }`}
                >
                  Q{run.quarter}: {run.team === "home" ? homeTeamName : awayTeamName}{" "}
                  {run.description}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameFlowChart;
