import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
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
  XMarkIcon,
  UserGroupIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const statusConfig = {
  scheduled: {
    label: "Scheduled",
    classes: "bg-status-scheduled/10 text-status-scheduled",
    animate: false,
  },
  active: {
    label: "Live",
    classes: "bg-status-active/15 text-status-active",
    animate: true,
  },
  paused: {
    label: "Paused",
    classes: "bg-status-paused/10 text-status-paused",
    animate: false,
  },
  completed: {
    label: "Final",
    classes: "bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300",
    animate: false,
  },
};

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
  const [scheduleForLater, setScheduleForLater] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [quickGameSettings, setQuickGameSettings] = useState({
    homeTeamName: "",
    awayTeamName: "",
    quarterMinutes: 12,
  });
  const [showQuickTeamModal, setShowQuickTeamModal] = useState(false);
  const [quickTeamType, setQuickTeamType] = useState<"home" | "away">("home");
  const [quickTeamSettings, setQuickTeamSettings] = useState({
    teamName: "",
    playerCount: 5,
  });
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  const gamesData = useQuery(
    api.games.list,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const teamsData = useQuery(
    api.teams.list,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  // Fetch league settings for display in game creation
  const leagueSettingsData = useQuery(
    api.leagues.getSettings,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );
  const leagueSettings = leagueSettingsData?.settings;

  const createGame = useMutation(api.games.create);
  const createQuickGame = useMutation(api.games.createQuickGame);
  const createTeam = useMutation(api.teams.create);
  const createPlayer = useMutation(api.players.create);

  const games = gamesData?.games || [];
  const teams = teamsData?.teams || [];

  // Check for existing or similar team names in quick create
  const normalizedQuickTeamName = quickTeamSettings.teamName.trim().toLowerCase();
  const exactTeamMatch = teams.find((t: any) => t.name.toLowerCase() === normalizedQuickTeamName);
  const similarTeamMatch =
    !exactTeamMatch && normalizedQuickTeamName.length >= 3
      ? teams.find(
          (t: any) =>
            t.name.toLowerCase().includes(normalizedQuickTeamName) ||
            normalizedQuickTeamName.includes(t.name.toLowerCase())
        )
      : null;

  // Sort games: live first, then scheduled by date, then completed (most recent first)
  const sortedGames = [...games].sort((a, b) => {
    const statusOrder: Record<string, number> = {
      active: 0,
      paused: 1,
      scheduled: 2,
      completed: 3,
    };
    const aOrder = statusOrder[a.status] ?? 4;
    const bOrder = statusOrder[b.status] ?? 4;

    if (aOrder !== bOrder) return aOrder - bOrder;

    if (a.status === "scheduled" && b.status === "scheduled") {
      return (a.scheduledAt || 0) - (b.scheduledAt || 0);
    }
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
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

    // Validate scheduled date/time if scheduling for later
    if (scheduleForLater && (!scheduledDate || !scheduledTime)) {
      toast.error("Please select a date and time for the scheduled game");
      return;
    }

    setIsCreating(true);
    try {
      // Parse scheduled date/time if provided
      let scheduledAt: number | undefined;
      if (scheduleForLater && scheduledDate && scheduledTime) {
        const dateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        scheduledAt = dateTime.getTime();
      }

      await createGame({
        token,
        homeTeamId: selectedTeams.home as Id<"teams">,
        awayTeamId: selectedTeams.away as Id<"teams">,
        scheduledAt,
      });
      toast.success(scheduleForLater ? "Game scheduled successfully" : "Game created successfully");
      setShowCreateModal(false);
      setSelectedTeams({ home: null, away: null });
      setScheduleForLater(false);
      setScheduledDate("");
      setScheduledTime("");
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
      navigate(`/app/games/${result.gameId}/live`);
    } catch (error) {
      console.error("Failed to create quick game:", error);
      const message = getErrorMessage(error, "Failed to create quick game. Please try again.");
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateQuickTeam = async () => {
    if (!quickTeamSettings.teamName.trim() || !token || !selectedLeague) {
      return;
    }

    setIsCreatingTeam(true);
    try {
      // Create the team
      const result = await createTeam({
        token,
        leagueId: selectedLeague.id,
        name: quickTeamSettings.teamName.trim(),
      });
      const newTeam = result.team;

      // Create default players
      for (let i = 1; i <= quickTeamSettings.playerCount; i++) {
        await createPlayer({
          token,
          teamId: newTeam.id,
          name: `Player ${i}`,
          number: i,
          active: true,
        });
      }

      // Set the team as selected
      if (quickTeamType === "home") {
        setSelectedTeams((prev) => ({ ...prev, home: newTeam.id }));
      } else {
        setSelectedTeams((prev) => ({ ...prev, away: newTeam.id }));
      }

      toast.success(`Team "${newTeam.name}" created with ${quickTeamSettings.playerCount} players`);
      setShowQuickTeamModal(false);
      setQuickTeamSettings({ teamName: "", playerCount: 5 });
    } catch (error) {
      console.error("Failed to create team:", error);
      const message = getErrorMessage(error, "Failed to create team. Please try again.");
      toast.error(message);
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const renderGameRow = (game: any) => {
    const isGameLive = game.status === "active";
    const status = statusConfig[game.status as keyof typeof statusConfig];
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
      <tr
        key={game.id}
        className="border-b border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.classes}`}
            >
              {status.animate && (
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-live" />
              )}
              {status.label}
            </div>
          </div>
        </td>

        <td className="px-6 py-4 whitespace-nowrap">
          <div className="space-y-0.5">
            <div
              className={`font-medium ${winner === "away" ? "text-surface-900 dark:text-surface-50" : "text-surface-600 dark:text-surface-300"}`}
            >
              {game.awayTeam?.name || "Away Team"}
            </div>
            <div className="text-sm text-surface-500 dark:text-surface-400">
              @ {game.homeTeam?.name || "Home Team"}
            </div>
          </div>
        </td>

        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2 font-mono text-lg" data-stat>
            <span
              className={
                winner === "away"
                  ? "font-bold text-surface-900 dark:text-surface-50"
                  : "text-surface-500 dark:text-surface-400"
              }
            >
              {game.awayScore}
            </span>
            <span className="text-surface-300 dark:text-surface-600">–</span>
            <span
              className={
                winner === "home"
                  ? "font-bold text-surface-900 dark:text-surface-50"
                  : "text-surface-500 dark:text-surface-400"
              }
            >
              {game.homeScore}
            </span>
          </div>
        </td>

        <td className="px-6 py-4 whitespace-nowrap">
          {isGameLive && (
            <div className="text-sm">
              <div className="text-surface-500 dark:text-surface-400">Q{game.currentQuarter}</div>
              <div
                className="font-mono font-medium text-surface-900 dark:text-surface-50"
                data-stat
              >
                {formatTime(game.timeRemainingSeconds)}
              </div>
            </div>
          )}
          {game.status === "scheduled" && game.scheduledAt && (
            <div className="flex items-center gap-1.5 text-sm text-surface-500 dark:text-surface-400">
              <CalendarIcon className="w-4 h-4" />
              {new Date(game.scheduledAt).toLocaleDateString()}
            </div>
          )}
        </td>

        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            {canGoToLive && (
              <Link
                to={`/app/games/${game.id}/live`}
                className="btn-primary p-2 rounded-lg"
                title="Live Game"
              >
                <PlayIcon className="w-4 h-4" />
              </Link>
            )}
            <Link
              to={`/app/games/${game.id}/analysis`}
              className="btn-secondary p-2 rounded-lg"
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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display-lg text-surface-900 dark:text-surface-50">Games</h1>
          <p className="text-surface-500 dark:text-surface-400">
            Manage and monitor your basketball games
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowQuickGameModal(true)}
            className="group flex items-center gap-2 px-4 py-2.5 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 text-sm font-medium rounded-xl border border-surface-200 dark:border-surface-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-surface-900"
          >
            <BoltIcon className="w-4 h-4 text-primary-500" />
            Quick Game
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="group flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white text-sm font-medium rounded-xl shadow-soft hover:shadow-glow-orange transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-surface-900"
          >
            <PlusIcon className="w-4 h-4" />
            Create Game
          </button>
        </div>
      </div>

      {/* Games Table */}
      <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700">
                <th className="px-6 py-3 text-left section-header">Status</th>
                <th className="px-6 py-3 text-left section-header">Matchup</th>
                <th className="px-6 py-3 text-left section-header">Score</th>
                <th className="px-6 py-3 text-left section-header">Time</th>
                <th className="px-6 py-3 text-left section-header">Actions</th>
              </tr>
            </thead>
            <tbody>{sortedGames.map(renderGameRow)}</tbody>
          </table>
        </div>

        {games.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-surface-100 dark:bg-surface-800 mb-4">
              <ClockIcon className="w-7 h-7 text-surface-400" />
            </div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-1">
              No games yet
            </h3>
            <p className="text-surface-500 dark:text-surface-400 mb-6">
              Create your first game to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="group inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium rounded-xl shadow-soft hover:shadow-glow-orange transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-surface-900"
            >
              <PlusIcon className="w-5 h-5" />
              Create your first game
            </button>
          </div>
        )}
      </div>

      {/* Create Game Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-surface-800 rounded-2xl w-full max-w-md shadow-dramatic border border-surface-200 dark:border-surface-700 animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-700">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                Create New Game
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedTeams({ home: null, away: null });
                  setScheduleForLater(false);
                  setScheduledDate("");
                  setScheduledTime("");
                }}
                className="p-2 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Home Team
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedTeams.home || ""}
                    onChange={(e) =>
                      setSelectedTeams((prev) => ({ ...prev, home: e.target.value || null }))
                    }
                    className="flex-1 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                  >
                    <option value="">Select Home Team</option>
                    {teams.map((team: any) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickTeamType("home");
                      setShowQuickTeamModal(true);
                    }}
                    className="px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors"
                    title="Create New Team"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Away Team
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedTeams.away || ""}
                    onChange={(e) =>
                      setSelectedTeams((prev) => ({ ...prev, away: e.target.value || null }))
                    }
                    className="flex-1 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                  >
                    <option value="">Select Away Team</option>
                    {teams.map((team: any) => (
                      <option
                        key={team.id}
                        value={team.id}
                        disabled={team.id === selectedTeams.home}
                      >
                        {team.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickTeamType("away");
                      setShowQuickTeamModal(true);
                    }}
                    className="px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors"
                    title="Create New Team"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Schedule Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleForLater}
                    onChange={(e) => setScheduleForLater(e.target.checked)}
                    className="w-5 h-5 rounded border-surface-300 dark:border-surface-600 text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
                  />
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Schedule for later
                  </span>
                </label>
              </div>

              {/* Schedule Date/Time Fields */}
              {scheduleForLater && (
                <div className="grid grid-cols-2 gap-3 animate-fade-in">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                    />
                  </div>
                </div>
              )}

              {/* League Settings Info */}
              {leagueSettings && (
                <div className="pt-2">
                  <div className="flex items-start gap-2 p-3 bg-surface-50 dark:bg-surface-900 rounded-xl">
                    <InformationCircleIcon className="w-5 h-5 text-surface-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        Game will use league settings
                      </p>
                      <p className="text-xs text-surface-500">
                        {leagueSettings.quarterMinutes} min quarters • {leagueSettings.foulLimit}{" "}
                        foul limit • {leagueSettings.bonusMode === "college" ? "College" : "NBA"}{" "}
                        bonus
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-surface-200 dark:border-surface-700">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedTeams({ home: null, away: null });
                  setScheduleForLater(false);
                  setScheduledDate("");
                  setScheduledTime("");
                }}
                className="btn-secondary px-4 py-2.5 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGame}
                disabled={
                  !selectedTeams.home ||
                  !selectedTeams.away ||
                  selectedTeams.home === selectedTeams.away ||
                  isCreating ||
                  (scheduleForLater && (!scheduledDate || !scheduledTime))
                }
                className="btn-primary px-4 py-2.5 rounded-xl"
              >
                {isCreating
                  ? scheduleForLater
                    ? "Scheduling..."
                    : "Creating..."
                  : scheduleForLater
                    ? "Schedule Game"
                    : "Create Game"}
              </button>
            </div>
          </div>
        </div>
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
                    Play without adding teams
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

              <div className="bg-surface-50 dark:bg-surface-900 rounded-xl p-4 space-y-2">
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  Creates two temporary teams with 15 numbered players each. You can select lineups
                  and track full stats.
                </p>
                {leagueSettings && (
                  <p className="text-xs text-surface-400 pt-1 border-t border-surface-200 dark:border-surface-700">
                    Uses league rules: {leagueSettings.foulLimit} foul limit •{" "}
                    {leagueSettings.bonusMode === "college" ? "College" : "NBA"} bonus
                  </p>
                )}
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
                {isCreating ? "Creating..." : "Start Game"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Team Create Modal */}
      {showQuickTeamModal && (
        <div className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-surface-800 rounded-2xl w-full max-w-md shadow-dramatic border border-surface-200 dark:border-surface-700 animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center">
                  <UserGroupIcon className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                    Quick Create {quickTeamType === "home" ? "Home" : "Away"} Team
                  </h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    Create team with default players
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowQuickTeamModal(false);
                  setQuickTeamSettings({ teamName: "", playerCount: 5 });
                }}
                className="p-2 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Team Name
                </label>
                <input
                  type="text"
                  value={quickTeamSettings.teamName}
                  onChange={(e) =>
                    setQuickTeamSettings((prev) => ({ ...prev, teamName: e.target.value }))
                  }
                  placeholder="Enter team name"
                  className={`w-full bg-surface-50 dark:bg-surface-900 border rounded-xl px-4 py-3 text-surface-900 dark:text-surface-50 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow ${
                    exactTeamMatch
                      ? "border-amber-500 border-2"
                      : "border-surface-200 dark:border-surface-700"
                  }`}
                />

                {/* Exact match warning */}
                {exactTeamMatch && (
                  <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                    <div className="flex items-start gap-2">
                      <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                          Team &quot;{exactTeamMatch.name}&quot; already exists
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            if (quickTeamType === "home") {
                              setSelectedTeams((prev) => ({ ...prev, home: exactTeamMatch.id }));
                            } else {
                              setSelectedTeams((prev) => ({ ...prev, away: exactTeamMatch.id }));
                            }
                            setShowQuickTeamModal(false);
                            setQuickTeamSettings({ teamName: "", playerCount: 5 });
                          }}
                          className="mt-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Use Existing Team
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Similar match warning */}
                {similarTeamMatch && !exactTeamMatch && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <div className="flex items-start gap-2">
                      <InformationCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Similar team exists: &quot;{similarTeamMatch.name}&quot;
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            if (quickTeamType === "home") {
                              setSelectedTeams((prev) => ({ ...prev, home: similarTeamMatch.id }));
                            } else {
                              setSelectedTeams((prev) => ({ ...prev, away: similarTeamMatch.id }));
                            }
                            setShowQuickTeamModal(false);
                            setQuickTeamSettings({ teamName: "", playerCount: 5 });
                          }}
                          className="mt-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Use &quot;{similarTeamMatch.name}&quot; Instead
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Number of Players
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      setQuickTeamSettings((prev) => ({
                        ...prev,
                        playerCount: Math.max(1, prev.playerCount - 1),
                      }))
                    }
                    className="w-10 h-10 bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 rounded-xl flex items-center justify-center text-surface-900 dark:text-white font-bold transition-colors"
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold text-surface-900 dark:text-surface-50 w-12 text-center">
                    {quickTeamSettings.playerCount}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuickTeamSettings((prev) => ({
                        ...prev,
                        playerCount: Math.min(15, prev.playerCount + 1),
                      }))
                    }
                    className="w-10 h-10 bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 rounded-xl flex items-center justify-center text-surface-900 dark:text-white font-bold transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <InformationCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Players will be created as &quot;Player 1&quot;, &quot;Player 2&quot;, etc. with
                  jersey numbers 1, 2, 3... You can edit names later from the Teams page.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-surface-200 dark:border-surface-700">
              <button
                onClick={() => {
                  setShowQuickTeamModal(false);
                  setQuickTeamSettings({ teamName: "", playerCount: 5 });
                }}
                className="btn-secondary px-4 py-2.5 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateQuickTeam}
                disabled={!quickTeamSettings.teamName.trim() || isCreatingTeam || !!exactTeamMatch}
                className="btn-primary px-4 py-2.5 rounded-xl"
              >
                {isCreatingTeam
                  ? "Creating..."
                  : `Create Team with ${quickTeamSettings.playerCount} Players`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Games;
