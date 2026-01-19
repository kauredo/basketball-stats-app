import React from "react";
import { PlayerStat } from "../../../types/livegame";

interface TeamBoxScoreProps {
  teamName: string;
  players: PlayerStat[];
  foulLimit: number;
  isHomeTeam?: boolean;
}

/**
 * Compact box score table for a single team.
 * Shows player stats in a scrollable table format.
 */
export const TeamBoxScore: React.FC<TeamBoxScoreProps> = ({
  teamName,
  players,
  foulLimit,
  isHomeTeam = false,
}) => {
  // Sort players: on-court first, then by points
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.isOnCourt && !b.isOnCourt) return -1;
    if (!a.isOnCourt && b.isOnCourt) return 1;
    return b.points - a.points;
  });

  // Calculate team totals
  const totals = players.reduce(
    (acc, p) => ({
      points: acc.points + p.points,
      rebounds: acc.rebounds + p.rebounds,
      assists: acc.assists + p.assists,
      steals: acc.steals + p.steals,
      blocks: acc.blocks + p.blocks,
      turnovers: acc.turnovers + p.turnovers,
      fouls: acc.fouls + p.fouls,
      fgm: acc.fgm + (p.fieldGoalsMade || 0),
      fga: acc.fga + (p.fieldGoalsAttempted || 0),
      tpm: acc.tpm + (p.threePointersMade || 0),
      tpa: acc.tpa + (p.threePointersAttempted || 0),
      ftm: acc.ftm + (p.freeThrowsMade || 0),
      fta: acc.fta + (p.freeThrowsAttempted || 0),
    }),
    { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fouls: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0 }
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className={`px-3 py-2 ${isHomeTeam ? "bg-orange-50 dark:bg-orange-900/20" : "bg-gray-50 dark:bg-gray-700/50"}`}>
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
          {teamName}
        </h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr className="text-gray-500 dark:text-gray-400 uppercase">
              <th className="text-left px-2 py-1.5 font-medium sticky left-0 bg-gray-50 dark:bg-gray-700/50">Player</th>
              <th className="text-center px-1 py-1.5 font-medium">PTS</th>
              <th className="text-center px-1 py-1.5 font-medium">REB</th>
              <th className="text-center px-1 py-1.5 font-medium">AST</th>
              <th className="text-center px-1 py-1.5 font-medium">STL</th>
              <th className="text-center px-1 py-1.5 font-medium">BLK</th>
              <th className="text-center px-1 py-1.5 font-medium">TO</th>
              <th className="text-center px-1 py-1.5 font-medium">PF</th>
              <th className="text-center px-1.5 py-1.5 font-medium">FG</th>
              <th className="text-center px-1.5 py-1.5 font-medium">3P</th>
              <th className="text-center px-1.5 py-1.5 font-medium">FT</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player) => (
              <tr
                key={player.playerId}
                className={`
                  border-t border-gray-100 dark:border-gray-700
                  ${player.fouledOut ? "bg-red-50 dark:bg-red-900/10 text-gray-400 dark:text-gray-500" : ""}
                  ${player.isOnCourt && !player.fouledOut ? "bg-green-50/50 dark:bg-green-900/10" : ""}
                `}
              >
                <td className="px-2 py-1.5 sticky left-0 bg-inherit">
                  <div className="flex items-center gap-1">
                    {player.isOnCourt && !player.fouledOut && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    )}
                    <span className={`font-medium ${player.fouledOut ? "line-through" : "text-gray-900 dark:text-white"}`}>
                      #{player.player?.number}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 truncate max-w-[60px]">
                      {player.player?.name?.split(" ").pop()}
                    </span>
                  </div>
                </td>
                <td className="text-center px-1 py-1.5 font-semibold text-gray-900 dark:text-white">{player.points}</td>
                <td className="text-center px-1 py-1.5 text-gray-700 dark:text-gray-300">{player.rebounds}</td>
                <td className="text-center px-1 py-1.5 text-gray-700 dark:text-gray-300">{player.assists}</td>
                <td className="text-center px-1 py-1.5 text-gray-700 dark:text-gray-300">{player.steals}</td>
                <td className="text-center px-1 py-1.5 text-gray-700 dark:text-gray-300">{player.blocks}</td>
                <td className="text-center px-1 py-1.5 text-gray-700 dark:text-gray-300">{player.turnovers}</td>
                <td className={`text-center px-1 py-1.5 ${player.fouls >= foulLimit ? "text-red-600 font-bold" : player.fouls >= foulLimit - 1 ? "text-yellow-600" : "text-gray-700 dark:text-gray-300"}`}>
                  {player.fouls}
                </td>
                <td className="text-center px-1.5 py-1.5 text-gray-600 dark:text-gray-400">
                  {player.fieldGoalsMade || 0}/{player.fieldGoalsAttempted || 0}
                </td>
                <td className="text-center px-1.5 py-1.5 text-gray-600 dark:text-gray-400">
                  {player.threePointersMade || 0}/{player.threePointersAttempted || 0}
                </td>
                <td className="text-center px-1.5 py-1.5 text-gray-600 dark:text-gray-400">
                  {player.freeThrowsMade || 0}/{player.freeThrowsAttempted || 0}
                </td>
              </tr>
            ))}
            {/* Totals Row */}
            <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 font-semibold">
              <td className="px-2 py-1.5 sticky left-0 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">TOTAL</td>
              <td className="text-center px-1 py-1.5 text-gray-900 dark:text-white">{totals.points}</td>
              <td className="text-center px-1 py-1.5 text-gray-700 dark:text-gray-300">{totals.rebounds}</td>
              <td className="text-center px-1 py-1.5 text-gray-700 dark:text-gray-300">{totals.assists}</td>
              <td className="text-center px-1 py-1.5 text-gray-700 dark:text-gray-300">{totals.steals}</td>
              <td className="text-center px-1 py-1.5 text-gray-700 dark:text-gray-300">{totals.blocks}</td>
              <td className="text-center px-1 py-1.5 text-gray-700 dark:text-gray-300">{totals.turnovers}</td>
              <td className="text-center px-1 py-1.5 text-gray-700 dark:text-gray-300">{totals.fouls}</td>
              <td className="text-center px-1.5 py-1.5 text-gray-600 dark:text-gray-400">{totals.fgm}/{totals.fga}</td>
              <td className="text-center px-1.5 py-1.5 text-gray-600 dark:text-gray-400">{totals.tpm}/{totals.tpa}</td>
              <td className="text-center px-1.5 py-1.5 text-gray-600 dark:text-gray-400">{totals.ftm}/{totals.fta}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamBoxScore;
