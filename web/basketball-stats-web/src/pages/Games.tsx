import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { getErrorMessage } from "../utils/error";
import {
  PlusIcon,
  PlayIcon,
  ChartBarIcon,
  CalendarIcon,
  ClockIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";

const Games: React.FC = () => {
  const { token, selectedLeague } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQuickGameModal, setShowQuickGameModal] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<{ home: string | null; away: string | null }>({
    home: null,
    away: null,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [quickGameSettings, setQuickGameSettings] = useState({
    homeTeamName: "",
    awayTeamName: "",
    quarterMinutes: 12,
  });

  const gamesData = useQuery(
    api.games.list,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const teamsData = useQuery(
    api.teams.list,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const createGame = useMutation(api.games.create);
  const createQuickGame = useMutation(api.games.createQuickGame);

  const games = gamesData?.games || [];
  const teams = teamsData?.teams || [];

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Return Tailwind background classes for game status
  const getStatusBgClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-red-500"; // Live games
      case "paused":
        return "bg-amber-500"; // Paused games
      case "completed":
        return "bg-green-500"; // Finished games
      case "scheduled":
        return "bg-blue-500"; // Upcoming games
      default:
        return "bg-gray-500";
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

  const handleCreateGame = async () => {
    if (
      !selectedTeams.home ||
      !selectedTeams.away ||
      selectedTeams.home === selectedTeams.away ||
      !token ||
      !selectedLeague
    ) {
      return;
    }

    setIsCreating(true);
    try {
      await createGame({
        token,
        homeTeamId: selectedTeams.home as Id<"teams">,
        awayTeamId: selectedTeams.away as Id<"teams">,
      });
      toast.success("Game created successfully");
      setShowCreateModal(false);
      setSelectedTeams({ home: null, away: null });
    } catch (error) {
      console.error("Failed to create game:", error);
      const message = getErrorMessage(error, "Failed to create game. Please try again.");
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
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
      toast.success("Quick game started!");
      setShowQuickGameModal(false);
      setQuickGameSettings({ homeTeamName: "", awayTeamName: "", quarterMinutes: 12 });
      // Navigate directly to the live game page
      navigate(`/app/games/${result.gameId}/live`);
    } catch (error) {
      console.error("Failed to create quick game:", error);
      const message = getErrorMessage(error, "Failed to create quick game. Please try again.");
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const renderGameRow = (game: any) => {
    const isGameLive = game.status === "active";
    const winner =
      game.status === "completed"
        ? game.homeScore > game.awayScore
          ? "home"
          : game.awayScore > game.homeScore
            ? "away"
            : "tie"
        : null;
    const canGoToLive = game.status !== "completed";

    return (
      <tr key={game.id} className="border-b border-gray-200 dark:border-gray-700">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center space-x-3">
            <div
              className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusBgClass(game.status)}`}
            >
              {getStatusLabel(game.status)}
            </div>
            {isGameLive && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>}
          </div>
        </td>

        <td className="px-6 py-4 whitespace-nowrap">
          <div className="space-y-1">
            <div
              className={`font-medium ${winner === "away" ? "text-green-400" : "text-gray-800 dark:text-gray-200"}`}
            >
              {game.awayTeam?.name || "Away Team"}
            </div>
            <div className="text-sm text-gray-500">@ {game.homeTeam?.name || "Home Team"}</div>
          </div>
        </td>

        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-lg font-bold">
            <span
              className={winner === "away" ? "text-green-400" : "text-gray-800 dark:text-gray-200"}
            >
              {game.awayScore}
            </span>
            <span className="text-gray-500 mx-2">-</span>
            <span
              className={winner === "home" ? "text-green-400" : "text-gray-800 dark:text-gray-200"}
            >
              {game.homeScore}
            </span>
          </div>
        </td>

        <td className="px-6 py-4 whitespace-nowrap">
          {isGameLive && (
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <div>Q{game.currentQuarter}</div>
              <div className="font-mono">{formatTime(game.timeRemainingSeconds)}</div>
            </div>
          )}
          {game.status === "completed" && (
            <div className="text-sm text-gray-500">
              <div>Final</div>
            </div>
          )}
          {game.status === "scheduled" && game.scheduledAt && (
            <div className="text-sm text-gray-500 flex items-center">
              <CalendarIcon className="w-4 h-4 mr-1" />
              {new Date(game.scheduledAt).toLocaleDateString()}
            </div>
          )}
        </td>

        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center space-x-2">
            {canGoToLive && (
              <Link
                to={`/app/games/${game.id}/live`}
                className="p-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white transition-colors inline-flex"
                title="Live Game"
              >
                <PlayIcon className="w-4 h-4" />
              </Link>
            )}

            <Link
              to={`/app/games/${game.id}/analysis`}
              className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors inline-flex"
              title="Analysis"
            >
              <ChartBarIcon className="w-4 h-4" />
            </Link>
          </div>
        </td>
      </tr>
    );
  };

  if (gamesData === undefined || teamsData === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Games</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and monitor basketball games</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowQuickGameModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <BoltIcon className="w-4 h-4 mr-2" />
            Quick Game
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Game
          </button>
        </div>
      </div>

      {/* Games Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Matchup
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {games.map(renderGameRow)}
            </tbody>
          </table>
        </div>

        {games.length === 0 && (
          <div className="text-center py-12">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-600 dark:text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No games</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Get started by creating your first game.
            </p>
          </div>
        )}
      </div>

      {/* Create Game Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Create New Game
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Home Team
                </label>
                <select
                  value={selectedTeams.home || ""}
                  onChange={(e) =>
                    setSelectedTeams((prev) => ({ ...prev, home: e.target.value || null }))
                  }
                  className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select Home Team</option>
                  {teams.map((team: any) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Away Team
                </label>
                <select
                  value={selectedTeams.away || ""}
                  onChange={(e) =>
                    setSelectedTeams((prev) => ({ ...prev, away: e.target.value || null }))
                  }
                  className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select Away Team</option>
                  {teams.map((team: any) => (
                    <option key={team.id} value={team.id} disabled={team.id === selectedTeams.home}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedTeams({ home: null, away: null });
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGame}
                disabled={
                  !selectedTeams.home ||
                  !selectedTeams.away ||
                  selectedTeams.home === selectedTeams.away ||
                  isCreating
                }
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? "Creating..." : "Create Game"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Game Modal */}
      {showQuickGameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <BoltIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Quick Game</h3>
                <p className="text-sm text-gray-500">Play without adding teams to your league</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Home Team Name
                </label>
                <input
                  type="text"
                  value={quickGameSettings.homeTeamName}
                  onChange={(e) =>
                    setQuickGameSettings((prev) => ({ ...prev, homeTeamName: e.target.value }))
                  }
                  placeholder="e.g., Lakers"
                  className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Away Team Name
                </label>
                <input
                  type="text"
                  value={quickGameSettings.awayTeamName}
                  onChange={(e) =>
                    setQuickGameSettings((prev) => ({ ...prev, awayTeamName: e.target.value }))
                  }
                  placeholder="e.g., Celtics"
                  className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quarter Length
                </label>
                <div className="flex gap-2">
                  {[5, 8, 10, 12].map((mins) => (
                    <button
                      key={mins}
                      onClick={() =>
                        setQuickGameSettings((prev) => ({ ...prev, quarterMinutes: mins }))
                      }
                      className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                        quickGameSettings.quarterMinutes === mins
                          ? "bg-purple-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This will create two temporary teams with 15 numbered players each (Player 1,
                  Player 2, etc.). You can select starting lineups and track full stats.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowQuickGameModal(false);
                  setQuickGameSettings({ homeTeamName: "", awayTeamName: "", quarterMinutes: 12 });
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
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
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? "Creating..." : "Start Quick Game"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Games;
