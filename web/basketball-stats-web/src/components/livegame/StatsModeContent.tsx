import React from "react";
import { PlayerStat } from "../../types/livegame";
import { TeamBoxScore } from "./stats/TeamBoxScore";
import { QuarterBreakdown } from "./stats/QuarterBreakdown";

interface StatsModeContentProps {
  homeTeamName: string;
  awayTeamName: string;
  homeStats: PlayerStat[];
  awayStats: PlayerStat[];
  foulLimit: number;
  currentQuarter: number;
  homeScoresByQuarter?: number[];
  awayScoresByQuarter?: number[];
}

/**
 * Stats mode content - shows box scores and quarter breakdown.
 * Content is scrollable within the fixed viewport.
 */
export const StatsModeContent: React.FC<StatsModeContentProps> = ({
  homeTeamName,
  awayTeamName,
  homeStats,
  awayStats,
  foulLimit,
  currentQuarter,
  homeScoresByQuarter = [],
  awayScoresByQuarter = [],
}) => {
  return (
    <div className="h-full overflow-auto space-y-3">
      {/* Quarter Breakdown */}
      <QuarterBreakdown
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        homeScoresByQuarter={homeScoresByQuarter}
        awayScoresByQuarter={awayScoresByQuarter}
        currentQuarter={currentQuarter}
      />

      {/* Team Box Scores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Away Team */}
        <TeamBoxScore teamName={awayTeamName} players={awayStats} foulLimit={foulLimit} />

        {/* Home Team */}
        <TeamBoxScore
          teamName={homeTeamName}
          players={homeStats}
          foulLimit={foulLimit}
          isHomeTeam
        />
      </div>
    </div>
  );
};

export default StatsModeContent;
