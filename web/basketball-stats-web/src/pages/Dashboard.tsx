import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { PlayIcon, ClockIcon, TrophyIcon, ChartBarIcon } from "@heroicons/react/24/outline";

const Dashboard: React.FC = () => {
  const { token, selectedLeague } = useAuth();

  const gamesData = useQuery(
    api.games.list,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const games = gamesData?.games || [];
  const liveGames = games.filter((game) => game.status === "active" || game.status === "paused");
  const recentGames = games.filter((game) => game.status === "completed").slice(0, 5);
  const upcomingGames = games.filter((game) => game.status === "scheduled").slice(0, 5);

  // Return Tailwind classes for game status - simplified to use subtle styling
  const getStatusClasses = (status: string) => {
    switch (status) {
      case "active":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300";
      case "paused":
        return "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300";
      case "completed":
        return "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400";
      case "scheduled":
        return "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Live";
      case "paused":
        return "Paused";
      case "completed":
        return "Final";
      case "scheduled":
        return "Scheduled";
      default:
        return status;
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const renderGameCard = (game: any, showActions = false) => {
    const isGameLive = game.status === "active";
    const winner =
      game.status === "completed"
        ? game.homeScore > game.awayScore
          ? "home"
          : game.awayScore > game.homeScore
            ? "away"
            : "tie"
        : null;

    return (
      <div
        key={game.id}
        className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            <div
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses(game.status)}`}
            >
              {getStatusLabel(game.status)}
            </div>
            {isGameLive && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>}
          </div>

          {(game.status === "active" || game.status === "paused") && (
            <div className="text-right text-sm text-gray-700 dark:text-gray-300">
              <div>Q{game.currentQuarter}</div>
              <div className="font-mono">{formatTime(game.timeRemainingSeconds)}</div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span
              className={`${winner === "away" ? "font-semibold text-gray-900 dark:text-white" : "font-normal text-gray-600 dark:text-gray-400"}`}
            >
              {game.awayTeam?.name || "Away Team"}
            </span>
            <span
              className={`text-lg ${winner === "away" ? "font-bold text-gray-900 dark:text-white" : "font-medium text-gray-600 dark:text-gray-400"}`}
            >
              {game.awayScore}
            </span>
          </div>
          <div className="text-center text-gray-400 dark:text-gray-500 text-xs">vs</div>
          <div className="flex justify-between items-center">
            <span
              className={`${winner === "home" ? "font-semibold text-gray-900 dark:text-white" : "font-normal text-gray-600 dark:text-gray-400"}`}
            >
              {game.homeTeam?.name || "Home Team"}
            </span>
            <span
              className={`text-lg ${winner === "home" ? "font-bold text-gray-900 dark:text-white" : "font-medium text-gray-600 dark:text-gray-400"}`}
            >
              {game.homeScore}
            </span>
          </div>
        </div>

        {game.status === "completed" && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Final Score</span>
              {winner !== "tie" && <span>Margin: {Math.abs(game.homeScore - game.awayScore)}</span>}
            </div>
          </div>
        )}

        {game.status === "scheduled" && game.scheduledAt && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center">
              <ClockIcon className="w-4 h-4 mr-1" />
              {new Date(game.scheduledAt).toLocaleDateString()}
            </div>
          </div>
        )}

        {showActions && (game.status === "active" || game.status === "paused") && (
          <div className="mt-4 flex space-x-2">
            <Link
              to={`/app/games/${game.id}/live`}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded text-sm font-medium text-center transition-colors"
            >
              Coach View
            </Link>
            <Link
              to={`/app/games/${game.id}/analysis`}
              className="flex-1 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 px-3 py-2 rounded text-sm font-medium text-center transition-colors"
            >
              Analysis
            </Link>
          </div>
        )}
      </div>
    );
  };

  if (gamesData === undefined) {
    return (
      <div className="space-y-8" aria-busy="true" aria-label="Loading dashboard">
        {/* Header skeleton */}
        <div>
          <div className="h-9 w-72 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="h-5 w-56 bg-gray-200 dark:bg-gray-700 rounded mt-2 animate-pulse" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-8 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Games section skeleton */}
        <div>
          <div className="h-7 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-6 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-6 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Basketball Stats Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor live games and track team performance
        </p>
      </div>

      {/* Quick Stats - simplified with monochrome icons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {liveGames.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Live</div>
            </div>
            <PlayIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {recentGames.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
            </div>
            <TrophyIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {upcomingGames.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Upcoming</div>
            </div>
            <ClockIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{games.length}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
            </div>
            <ChartBarIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
        </div>
      </div>

      {/* Live Games */}
      {liveGames.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
              Live Games
            </h2>
            <Link to="/app/games" className="text-orange-500 hover:text-orange-400 font-medium">
              View All Games
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveGames.map((game) => renderGameCard(game, true))}
          </div>
        </div>
      )}

      {/* Recent Games */}
      {recentGames.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Games</h2>
            <Link to="/app/games" className="text-orange-500 hover:text-orange-400 font-medium">
              View All Games
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentGames.map((game) => renderGameCard(game))}
          </div>
        </div>
      )}

      {/* Upcoming Games */}
      {upcomingGames.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upcoming Games</h2>
            <Link to="/app/games" className="text-orange-500 hover:text-orange-400 font-medium">
              View All Games
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingGames.map((game) => renderGameCard(game))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {games.length === 0 && (
        <div className="text-center py-12">
          <TrophyIcon className="mx-auto h-12 w-12 text-gray-600 dark:text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No games</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Get started by creating your first game.
          </p>
          <div className="mt-6">
            <Link
              to="/app/games"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Create Game
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
