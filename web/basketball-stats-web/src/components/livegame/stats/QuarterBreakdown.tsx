import React from "react";
import type { ScoreByPeriod } from "../../../types/livegame";

interface QuarterBreakdownProps {
  homeTeamName: string;
  awayTeamName: string;
  scoreByPeriod?: ScoreByPeriod;
  currentQuarter: number;
  homeScore: number;
  awayScore: number;
}

/**
 * Quarter-by-quarter scoring breakdown table.
 * Handles the backend format: {q1: {home, away}, q2: {home, away}, ...}
 */
export const QuarterBreakdown: React.FC<QuarterBreakdownProps> = ({
  homeTeamName,
  awayTeamName,
  scoreByPeriod,
  currentQuarter,
  homeScore,
  awayScore,
}) => {
  // Determine how many quarters/periods to show
  const quarters = Math.max(4, currentQuarter);
  const quarterLabels = Array.from({ length: quarters }, (_, i) =>
    i < 4 ? `Q${i + 1}` : `OT${i - 3}`
  );

  // Get score for a specific period and team
  const getQuarterScore = (quarterIndex: number, team: "home" | "away"): number | null => {
    if (!scoreByPeriod) return null;
    const periodKey = quarterIndex < 4 ? `q${quarterIndex + 1}` : `ot${quarterIndex - 3}`;
    const periodData = scoreByPeriod[periodKey];
    return periodData ? periodData[team] : null;
  };

  // Calculate totals from period data, falling back to provided totals
  const calculateTotal = (team: "home" | "away"): number => {
    if (!scoreByPeriod) return team === "home" ? homeScore : awayScore;

    let total = 0;
    for (const periodKey in scoreByPeriod) {
      total += scoreByPeriod[periodKey]?.[team] || 0;
    }
    // Return the max of calculated vs provided (handles edge cases)
    return Math.max(total, team === "home" ? homeScore : awayScore);
  };

  const homeTotal = calculateTotal("home");
  const awayTotal = calculateTotal("away");

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
      <div className="px-3 py-2 bg-surface-50 dark:bg-surface-700/50">
        <h3 className="font-semibold text-surface-900 dark:text-white text-sm">Score by Quarter</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-surface-500 dark:text-surface-400 text-xs uppercase">
              <th className="text-left px-3 py-2 font-medium">Team</th>
              {quarterLabels.map((label, i) => (
                <th
                  key={i}
                  className={`text-center px-2 py-2 font-medium ${
                    i + 1 === currentQuarter ? "text-primary-600 dark:text-primary-400" : ""
                  }`}
                >
                  {label}
                </th>
              ))}
              <th className="text-center px-3 py-2 font-bold">T</th>
            </tr>
          </thead>
          <tbody>
            {/* Away Team */}
            <tr className="border-t border-surface-100 dark:border-surface-700">
              <td className="px-3 py-2 font-medium text-surface-900 dark:text-white">
                {awayTeamName}
              </td>
              {quarterLabels.map((_, i) => {
                const score = getQuarterScore(i, "away");
                return (
                  <td
                    key={i}
                    className={`text-center px-2 py-2 ${
                      i + 1 === currentQuarter
                        ? "font-semibold text-surface-900 dark:text-white"
                        : "text-surface-600 dark:text-surface-400"
                    }`}
                  >
                    {score !== null ? score : "-"}
                  </td>
                );
              })}
              <td className="text-center px-3 py-2 font-bold text-surface-900 dark:text-white">
                {awayTotal}
              </td>
            </tr>
            {/* Home Team */}
            <tr className="border-t border-surface-100 dark:border-surface-700 bg-primary-50/30 dark:bg-primary-900/10">
              <td className="px-3 py-2 font-medium text-surface-900 dark:text-white">
                {homeTeamName}
              </td>
              {quarterLabels.map((_, i) => {
                const score = getQuarterScore(i, "home");
                return (
                  <td
                    key={i}
                    className={`text-center px-2 py-2 ${
                      i + 1 === currentQuarter
                        ? "font-semibold text-surface-900 dark:text-white"
                        : "text-surface-600 dark:text-surface-400"
                    }`}
                  >
                    {score !== null ? score : "-"}
                  </td>
                );
              })}
              <td className="text-center px-3 py-2 font-bold text-surface-900 dark:text-white">
                {homeTotal}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuarterBreakdown;
