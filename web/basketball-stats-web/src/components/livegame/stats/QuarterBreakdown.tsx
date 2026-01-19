import React from "react";

interface QuarterBreakdownProps {
  homeTeamName: string;
  awayTeamName: string;
  homeScoresByQuarter: number[];
  awayScoresByQuarter: number[];
  currentQuarter: number;
}

/**
 * Quarter-by-quarter scoring breakdown table.
 */
export const QuarterBreakdown: React.FC<QuarterBreakdownProps> = ({
  homeTeamName,
  awayTeamName,
  homeScoresByQuarter,
  awayScoresByQuarter,
  currentQuarter,
}) => {
  const quarters = Math.max(4, currentQuarter);
  const quarterLabels = Array.from({ length: quarters }, (_, i) =>
    i < 4 ? `Q${i + 1}` : `OT${i - 3}`
  );

  const homeTotal = homeScoresByQuarter.reduce((a, b) => a + b, 0);
  const awayTotal = awayScoresByQuarter.reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
          Score by Quarter
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 dark:text-gray-400 text-xs uppercase">
              <th className="text-left px-3 py-2 font-medium">Team</th>
              {quarterLabels.map((label, i) => (
                <th
                  key={i}
                  className={`text-center px-2 py-2 font-medium ${
                    i + 1 === currentQuarter ? "text-orange-600 dark:text-orange-400" : ""
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
            <tr className="border-t border-gray-100 dark:border-gray-700">
              <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">
                {awayTeamName}
              </td>
              {quarterLabels.map((_, i) => (
                <td
                  key={i}
                  className={`text-center px-2 py-2 ${
                    i + 1 === currentQuarter
                      ? "font-semibold text-gray-900 dark:text-white"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {awayScoresByQuarter[i] ?? "-"}
                </td>
              ))}
              <td className="text-center px-3 py-2 font-bold text-gray-900 dark:text-white">
                {awayTotal}
              </td>
            </tr>
            {/* Home Team */}
            <tr className="border-t border-gray-100 dark:border-gray-700 bg-orange-50/30 dark:bg-orange-900/10">
              <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">
                {homeTeamName}
              </td>
              {quarterLabels.map((_, i) => (
                <td
                  key={i}
                  className={`text-center px-2 py-2 ${
                    i + 1 === currentQuarter
                      ? "font-semibold text-gray-900 dark:text-white"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {homeScoresByQuarter[i] ?? "-"}
                </td>
              ))}
              <td className="text-center px-3 py-2 font-bold text-gray-900 dark:text-white">
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
