import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { getErrorMessage } from "../utils/error";
import {
  ArrowRightIcon,
  CalendarIcon,
  ChartBarIcon,
  PlusIcon,
  BoltIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const Dashboard: React.FC = () => {
  const { token, selectedLeague } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Quick Game modal state
  const [showQuickGameModal, setShowQuickGameModal] = useState(false);
  const [quickGameSettings, setQuickGameSettings] = useState({
    homeTeamName: "",
    awayTeamName: "",
    quarterMinutes: 12,
  });
  const [isCreating, setIsCreating] = useState(false);

  const gamesData = useQuery(
    api.games.list,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const createQuickGame = useMutation(api.games.createQuickGame);

  const games = gamesData?.games || [];
  const liveGames = games.filter((game) => game.status === "active" || game.status === "paused");
  const recentGames = games.filter((game) => game.status === "completed").slice(0, 4);
  const upcomingGames = games.filter((game) => game.status === "scheduled").slice(0, 3);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleCreateQuickGame = async () => {
    if (
      !quickGameSettings.homeTeamName.trim() ||
      !quickGameSettings.awayTeamName.trim() ||
      !token ||
      !selectedLeague
    ) {
      return;
    }

    setIsCreating(true);
    try {
      const result = await createQuickGame({
        token,
        leagueId: selectedLeague.id,
        homeTeamName: quickGameSettings.homeTeamName.trim(),
        awayTeamName: quickGameSettings.awayTeamName.trim(),
        quarterMinutes: quickGameSettings.quarterMinutes,
      });
      toast.success("Game started!");
      setShowQuickGameModal(false);
      setQuickGameSettings({ homeTeamName: "", awayTeamName: "", quarterMinutes: 12 });
      navigate(`/app/games/${result.gameId}/live`);
    } catch (error) {
      console.error("Failed to create quick game:", error);
      const message = getErrorMessage(error, "Failed to create game. Please try again.");
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  // Loading state with skeleton
  if (gamesData === undefined) {
    return (
      <div className="space-y-12 animate-fade-in" aria-busy="true" aria-label="Loading dashboard">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-10 w-48 bg-surface-200 dark:bg-surface-800 rounded-lg animate-pulse" />
          <div className="h-5 w-72 bg-surface-200 dark:bg-surface-800 rounded animate-pulse" />
        </div>

        {/* Live games skeleton */}
        <div className="space-y-4">
          <div className="h-6 w-32 bg-surface-200 dark:bg-surface-800 rounded animate-pulse" />
          <div className="h-48 bg-surface-200 dark:bg-surface-800 rounded-2xl animate-pulse" />
        </div>

        {/* Stats row skeleton */}
        <div className="grid grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-12 w-16 bg-surface-200 dark:bg-surface-800 rounded animate-pulse" />
              <div className="h-4 w-20 bg-surface-200 dark:bg-surface-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header - Editorial style, no card */}
      <header className="space-y-1">
        <h1 className="text-display-lg text-surface-900 dark:text-surface-50">Dashboard</h1>
        <p className="text-lg text-surface-500 dark:text-surface-400">
          {selectedLeague?.name || "Your games at a glance"}
        </p>
      </header>

      {/* Live Games - Dramatic, full-width treatment */}
      {liveGames.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="live-indicator text-sm font-bold uppercase tracking-wider text-status-active">
              Live Now
            </h2>
            <Link
              to="/app/games"
              className="text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors flex items-center gap-1 group"
            >
              All games
              <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid gap-4">
            {liveGames.map((game) => (
              <Link
                key={game.id}
                to={`/app/games/${game.id}/live`}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-900 to-surface-800 dark:from-surface-800 dark:to-surface-900 p-6 shadow-dramatic hover:shadow-glow-orange transition-all duration-300"
              >
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative flex items-center justify-between">
                  {/* Away Team */}
                  <div className="flex-1 text-center">
                    <div className="text-lg font-semibold text-surface-100 mb-1">
                      {game.awayTeam?.name || "Away"}
                    </div>
                    <div className="stat-display-xl text-white" data-stat>
                      {game.awayScore}
                    </div>
                  </div>

                  {/* Center - Game Info */}
                  <div className="px-8 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-status-active/20 text-status-active text-xs font-bold uppercase tracking-wider mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-status-active animate-pulse-live" />
                      Live
                    </div>
                    <div className="text-surface-300 text-sm font-medium">
                      Q{game.currentQuarter}
                    </div>
                    <div className="text-white font-mono text-xl font-semibold" data-stat>
                      {formatTime(game.timeRemainingSeconds)}
                    </div>
                  </div>

                  {/* Home Team */}
                  <div className="flex-1 text-center">
                    <div className="text-lg font-semibold text-surface-100 mb-1">
                      {game.homeTeam?.name || "Home"}
                    </div>
                    <div className="stat-display-xl text-white" data-stat>
                      {game.homeScore}
                    </div>
                  </div>
                </div>

                {/* Action hint */}
                <div className="absolute bottom-4 right-4 flex items-center gap-1 text-xs font-medium text-surface-400 group-hover:text-primary-400 transition-colors">
                  Open Scorebook
                  <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Quick Stats - Not cards, just bold numbers */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-8">
        <div className="space-y-1">
          <div className="stat-display text-surface-900 dark:text-surface-50" data-stat>
            {liveGames.length}
          </div>
          <div className="text-sm text-surface-500 dark:text-surface-400 font-medium">
            Live games
          </div>
        </div>
        <div className="space-y-1">
          <div className="stat-display text-surface-900 dark:text-surface-50" data-stat>
            {recentGames.length}
          </div>
          <div className="text-sm text-surface-500 dark:text-surface-400 font-medium">
            Completed
          </div>
        </div>
        <div className="space-y-1">
          <div className="stat-display text-surface-900 dark:text-surface-50" data-stat>
            {upcomingGames.length}
          </div>
          <div className="text-sm text-surface-500 dark:text-surface-400 font-medium">Upcoming</div>
        </div>
        <div className="space-y-1">
          <div className="stat-display text-surface-900 dark:text-surface-50" data-stat>
            {games.length}
          </div>
          <div className="text-sm text-surface-500 dark:text-surface-400 font-medium">
            Total games
          </div>
        </div>
      </section>

      {/* Quick Action - New Game */}
      <section className="flex items-center gap-4">
        <button
          onClick={() => setShowQuickGameModal(true)}
          className="group relative flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl shadow-soft hover:shadow-glow-orange transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-surface-900"
        >
          <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
            <BoltIcon className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold">New Game</div>
            <div className="text-xs text-white/70">Start tracking now</div>
          </div>
          <ArrowRightIcon className="w-4 h-4 ml-2 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
        </button>

        <Link
          to="/app/games"
          className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Create with teams
        </Link>
      </section>

      {/* Two-column layout for Recent and Upcoming - asymmetric */}
      <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
        {/* Recent Games - Larger, list format */}
        <section className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-header">Recent Results</h2>
            <Link
              to="/app/games"
              className="text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors"
            >
              View all
            </Link>
          </div>

          {recentGames.length > 0 ? (
            <div className="space-y-2">
              {recentGames.map((game) => {
                const homeWon = game.homeScore > game.awayScore;
                const awayWon = game.awayScore > game.homeScore;

                return (
                  <Link
                    key={game.id}
                    to={`/app/games/${game.id}/analysis`}
                    className="group flex items-center gap-4 p-4 rounded-xl bg-surface-100 dark:bg-surface-800/50 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
                  >
                    {/* Teams and Scores */}
                    <div className="flex-1 grid grid-cols-[1fr,auto,1fr] items-center gap-4">
                      <div
                        className={`text-right ${awayWon ? "font-semibold text-surface-900 dark:text-surface-50" : "text-surface-500 dark:text-surface-400"}`}
                      >
                        {game.awayTeam?.name || "Away"}
                      </div>
                      <div className="flex items-center gap-2 font-mono text-lg" data-stat>
                        <span
                          className={
                            awayWon
                              ? "font-bold text-surface-900 dark:text-surface-50"
                              : "text-surface-500 dark:text-surface-400"
                          }
                        >
                          {game.awayScore}
                        </span>
                        <span className="text-surface-300 dark:text-surface-600">-</span>
                        <span
                          className={
                            homeWon
                              ? "font-bold text-surface-900 dark:text-surface-50"
                              : "text-surface-500 dark:text-surface-400"
                          }
                        >
                          {game.homeScore}
                        </span>
                      </div>
                      <div
                        className={`text-left ${homeWon ? "font-semibold text-surface-900 dark:text-surface-50" : "text-surface-500 dark:text-surface-400"}`}
                      >
                        {game.homeTeam?.name || "Home"}
                      </div>
                    </div>

                    {/* Final badge */}
                    <div className="px-2 py-0.5 rounded text-xs font-medium bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300">
                      Final
                    </div>

                    <ArrowRightIcon className="w-4 h-4 text-surface-400 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <ChartBarIcon className="w-10 h-10 mx-auto text-surface-300 dark:text-surface-600 mb-3" />
              <p className="text-surface-500 dark:text-surface-400">No completed games yet</p>
            </div>
          )}
        </section>

        {/* Upcoming Games - Sidebar style, compact */}
        <section className="lg:col-span-2 space-y-4">
          <h2 className="section-header">Coming Up</h2>

          {upcomingGames.length > 0 ? (
            <div className="space-y-3">
              {upcomingGames.map((game) => (
                <Link
                  key={game.id}
                  to={`/app/games/${game.id}/live`}
                  className="group block p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800/30 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="w-4 h-4 text-primary-500" />
                      <span className="text-sm font-medium text-surface-600 dark:text-surface-300">
                        {game.scheduledAt
                          ? new Date(game.scheduledAt).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })
                          : "TBD"}
                      </span>
                    </div>
                    <ArrowRightIcon className="w-4 h-4 text-surface-400 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-surface-900 dark:text-surface-100">
                        {game.awayTeam?.name || "Away"}
                      </span>
                      <span className="text-xs text-surface-400">@</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-surface-900 dark:text-surface-100">
                        {game.homeTeam?.name || "Home"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center border border-dashed border-surface-200 dark:border-surface-700 rounded-xl">
              <CalendarIcon className="w-8 h-8 mx-auto text-surface-300 dark:text-surface-600 mb-2" />
              <p className="text-sm text-surface-500 dark:text-surface-400">No upcoming games</p>
            </div>
          )}
        </section>
      </div>

      {/* Empty State - When no games at all */}
      {games.length === 0 && (
        <section className="py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500/10 mb-6">
            <ChartBarIcon className="w-8 h-8 text-primary-500" />
          </div>
          <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-2">
            No games yet
          </h3>
          <p className="text-surface-500 dark:text-surface-400 mb-6 max-w-sm mx-auto">
            Create your first game to start tracking stats and building your season history.
          </p>
          <Link to="/app/games" className="btn-primary px-6 py-3 rounded-xl text-base">
            Create your first game
          </Link>
        </section>
      )}

      {/* Quick Game Modal */}
      {showQuickGameModal && (
        <div className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-surface-800 rounded-2xl w-full max-w-md shadow-dramatic border border-surface-200 dark:border-surface-700 animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center">
                  <BoltIcon className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                    Quick Game
                  </h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    Start tracking immediately
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowQuickGameModal(false);
                  setQuickGameSettings({ homeTeamName: "", awayTeamName: "", quarterMinutes: 12 });
                }}
                className="p-2 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Home Team Name
                </label>
                <input
                  type="text"
                  value={quickGameSettings.homeTeamName}
                  onChange={(e) =>
                    setQuickGameSettings((prev) => ({ ...prev, homeTeamName: e.target.value }))
                  }
                  placeholder="e.g., Lakers"
                  className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-50 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Away Team Name
                </label>
                <input
                  type="text"
                  value={quickGameSettings.awayTeamName}
                  onChange={(e) =>
                    setQuickGameSettings((prev) => ({ ...prev, awayTeamName: e.target.value }))
                  }
                  placeholder="e.g., Celtics"
                  className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-50 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Quarter Length
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 8, 10, 12].map((mins) => (
                    <button
                      key={mins}
                      onClick={() =>
                        setQuickGameSettings((prev) => ({ ...prev, quarterMinutes: mins }))
                      }
                      className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                        quickGameSettings.quarterMinutes === mins
                          ? "bg-primary-500 text-white shadow-soft"
                          : "bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600"
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-surface-50 dark:bg-surface-900 rounded-xl p-4">
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  Creates two temporary teams with 15 numbered players each. You can select lineups
                  and track full stats.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-surface-200 dark:border-surface-700">
              <button
                onClick={() => {
                  setShowQuickGameModal(false);
                  setQuickGameSettings({ homeTeamName: "", awayTeamName: "", quarterMinutes: 12 });
                }}
                className="btn-secondary px-4 py-2.5 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateQuickGame}
                disabled={
                  !quickGameSettings.homeTeamName.trim() ||
                  !quickGameSettings.awayTeamName.trim() ||
                  isCreating
                }
                className="btn-primary px-4 py-2.5 rounded-xl"
              >
                {isCreating ? "Starting..." : "Start Game"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
