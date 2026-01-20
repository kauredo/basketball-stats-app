import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeftIcon, ChartBarIcon, UserIcon, TrophyIcon } from "@heroicons/react/24/outline";

interface StatCardProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

function StatCard({ label, value, highlight = false }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <p className="text-gray-500 dark:text-gray-400 text-sm">{label}</p>
      <p
        className={`text-2xl font-bold ${
          highlight ? "text-primary-500" : "text-gray-900 dark:text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

interface StatRowProps {
  label: string;
  value: string | number;
}

function StatRow({ label, value }: StatRowProps) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className="text-gray-900 dark:text-white font-medium">{value}</span>
    </div>
  );
}

const PlayerDetail: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const { token, selectedLeague } = useAuth();

  const playerData = useQuery(
    api.players.get,
    token && playerId ? { token, playerId: playerId as Id<"players"> } : "skip"
  );

  const playerStats = useQuery(
    api.statistics.getPlayerSeasonStats,
    token && selectedLeague && playerId
      ? { token, leagueId: selectedLeague.id, playerId: playerId as Id<"players"> }
      : "skip"
  );

  if (!selectedLeague) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <UserIcon className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No League Selected
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please select a league to view player details.
        </p>
      </div>
    );
  }

  if (playerData === undefined || playerStats === undefined) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const player = playerData?.player;
  const stats = playerStats?.stats;
  const recentGames = playerStats?.recentGames || [];

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <UserIcon className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Player Not Found
        </h2>
        <button
          onClick={() => navigate("/app/players")}
          className="text-primary-500 hover:underline"
        >
          Back to Players
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back
        </button>

        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold">#{player.number}</span>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{player.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-white/80">
                <span>{player.position || "N/A"}</span>
                {player.heightCm && <span>{player.heightCm} cm</span>}
                {player.weightKg && <span>{player.weightKg} kg</span>}
              </div>
              <Link to={`/app/teams`} className="text-white/90 hover:text-white mt-1 inline-block">
                {player.team?.name || "No Team"}
              </Link>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/app/shot-charts?player=${playerId}`)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-2"
              >
                <ChartBarIcon className="w-5 h-5" />
                Shot Chart
              </button>
              <button
                onClick={() => navigate(`/app/compare?player1=${playerId}`)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-2"
              >
                <TrophyIcon className="w-5 h-5" />
                Compare
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <StatCard label="Games Played" value={stats.gamesPlayed || 0} />
            <StatCard label="PPG" value={stats.avgPoints?.toFixed(1) || "0.0"} highlight />
            <StatCard label="RPG" value={stats.avgRebounds?.toFixed(1) || "0.0"} highlight />
            <StatCard label="APG" value={stats.avgAssists?.toFixed(1) || "0.0"} highlight />
            <StatCard label="FG%" value={`${stats.fieldGoalPercentage?.toFixed(1) || "0.0"}%`} />
            <StatCard label="3P%" value={`${stats.threePointPercentage?.toFixed(1) || "0.0"}%`} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Scoring Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Scoring</h3>
              <div className="space-y-1">
                <StatRow label="Total Points" value={stats.totalPoints || 0} />
                <StatRow
                  label="Field Goals"
                  value={`${stats.totalFieldGoalsMade || 0}/${stats.totalFieldGoalsAttempted || 0}`}
                />
                <StatRow
                  label="3-Pointers"
                  value={`${stats.totalThreePointersMade || 0}/${stats.totalThreePointersAttempted || 0}`}
                />
                <StatRow
                  label="Free Throws"
                  value={`${stats.totalFreeThrowsMade || 0}/${stats.totalFreeThrowsAttempted || 0}`}
                />
                <StatRow label="FT%" value={`${stats.freeThrowPercentage?.toFixed(1) || "0.0"}%`} />
              </div>
            </div>

            {/* Other Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Other Stats
              </h3>
              <div className="space-y-1">
                <StatRow label="Total Rebounds" value={stats.totalRebounds || 0} />
                <StatRow label="Total Assists" value={stats.totalAssists || 0} />
                <StatRow label="Total Steals" value={stats.totalSteals || 0} />
                <StatRow label="Total Blocks" value={stats.totalBlocks || 0} />
                <StatRow label="Total Turnovers" value={stats.totalTurnovers || 0} />
                <StatRow label="Total Fouls" value={stats.totalFouls || 0} />
                <StatRow label="Total Minutes" value={Math.round(stats.totalMinutes || 0)} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Recent Games */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Games</h3>
        </div>
        {recentGames.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Opponent
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    PTS
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    REB
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    AST
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    FG%
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentGames.slice(0, 10).map((game: any, index: number) => (
                  <tr
                    key={game.gameId || index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {game.gameDate ? new Date(game.gameDate).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      vs {game.opponent || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-900 dark:text-white">
                      {game.points || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                      {game.rebounds || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                      {game.assists || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                      {game.fieldGoalPercentage?.toFixed(0) || 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No games played yet this season.
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerDetail;
