import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { getErrorMessage } from "../utils/error";
import Breadcrumb from "../components/Breadcrumb";
import {
  UserIcon,
  TrophyIcon,
  ChartBarIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CalendarIcon,
  XMarkIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

interface EditFormState {
  name: string;
  city: string;
  description: string;
}

const TeamDetail: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const { token, selectedLeague } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({ name: "", city: "", description: "" });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch team data
  const teamData = useQuery(
    api.teams.get,
    token && teamId ? { token, teamId: teamId as Id<"teams"> } : "skip"
  );

  // Fetch team's players
  const playersData = useQuery(
    api.players.list,
    token && selectedLeague && teamId
      ? { token, leagueId: selectedLeague.id, teamId: teamId as Id<"teams"> }
      : "skip"
  );

  // Fetch team's recent games
  const gamesData = useQuery(
    api.games.list,
    token && selectedLeague && teamId
      ? { token, leagueId: selectedLeague.id, teamId: teamId as Id<"teams">, limit: 10 }
      : "skip"
  );

  // Fetch team statistics
  const teamsStatsData = useQuery(
    api.statistics.getTeamsStats,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const updateTeam = useMutation(api.teams.update);
  const removeTeam = useMutation(api.teams.remove);

  const team = teamData?.team;
  const players = playersData?.players || [];
  const games = gamesData?.games || [];

  // Find this team's stats from the league stats
  const teamStats = teamsStatsData?.teams?.find((t: any) => t.teamId === teamId);

  // Get win/loss record from team data
  const wins = team?.wins ?? 0;
  const losses = team?.losses ?? 0;
  const winPct = team?.winPercentage?.toFixed(1) ?? "0.0";

  const openEditModal = () => {
    if (team) {
      setEditForm({
        name: team.name || "",
        city: team.city || "",
        description: team.description || "",
      });
    }
    setShowEditModal(true);
  };

  const handleUpdateTeam = async () => {
    if (!editForm.name.trim() || !token || !teamId) return;

    setIsUpdating(true);
    try {
      await updateTeam({
        token,
        teamId: teamId as Id<"teams">,
        name: editForm.name.trim(),
        city: editForm.city.trim() || undefined,
        description: editForm.description.trim() || undefined,
      });
      toast.success("Team updated successfully");
      setShowEditModal(false);
    } catch (error) {
      console.error("Failed to update team:", error);
      const message = getErrorMessage(error, "Failed to update team. Please try again.");
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!token || !teamId) return;

    setIsDeleting(true);
    try {
      await removeTeam({
        token,
        teamId: teamId as Id<"teams">,
      });
      toast.success("Team deleted successfully");
      navigate("/app/teams");
    } catch (error) {
      console.error("Failed to delete team:", error);
      const message = getErrorMessage(error, "Failed to delete team. Please try again.");
      toast.error(message);
      setIsDeleting(false);
    }
  };

  const getPositionColor = (position?: string) => {
    switch (position) {
      case "PG":
        return "bg-blue-500/20 text-blue-500";
      case "SG":
        return "bg-violet-500/20 text-violet-500";
      case "SF":
        return "bg-green-500/20 text-green-500";
      case "PF":
        return "bg-amber-500/20 text-amber-500";
      case "C":
        return "bg-red-500/20 text-red-500";
      default:
        return "bg-surface-500/20 text-surface-500";
    }
  };

  if (teamData === undefined || playersData === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Team not found</h3>
        <button
          onClick={() => navigate("/app/teams")}
          className="mt-4 text-primary-500 hover:text-primary-400 transition-colors"
        >
          Back to Teams
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: "Teams", href: "/app/teams" }, { label: team.name }]} />

      {/* Team Header */}
      <div className="surface-card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            {team.logoUrl ? (
              <img
                src={team.logoUrl}
                alt={team.name}
                className="w-20 h-20 rounded-2xl object-cover bg-surface-200 dark:bg-surface-700"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-primary-500/10 flex items-center justify-center">
                <UsersIcon className="w-10 h-10 text-primary-500" />
              </div>
            )}
            <div>
              <h1 className="text-display-sm text-surface-900 dark:text-white">{team.name}</h1>
              {team.city && (
                <p className="text-surface-600 dark:text-surface-400">{team.city}</p>
              )}
              {team.description && (
                <p className="text-sm text-surface-500 dark:text-surface-500 mt-1 max-w-md">
                  {team.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openEditModal}
              className="btn-secondary px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <PencilIcon className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors flex items-center gap-2"
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Record */}
        <div className="surface-card p-4">
          <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400 mb-2">
            <TrophyIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Record</span>
          </div>
          <div className="text-stat-lg text-surface-900 dark:text-white" data-stat>
            {wins}-{losses}
          </div>
          <div className="text-sm text-surface-500">{winPct}% Win Rate</div>
        </div>

        {/* Players */}
        <div className="surface-card p-4">
          <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400 mb-2">
            <UserIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Roster</span>
          </div>
          <div className="text-stat-lg text-surface-900 dark:text-white" data-stat>
            {players.length}
          </div>
          <div className="text-sm text-surface-500">Players</div>
        </div>

        {/* PPG */}
        <div className="surface-card p-4">
          <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400 mb-2">
            <ChartBarIcon className="w-4 h-4" />
            <span className="text-sm font-medium">PPG</span>
          </div>
          <div className="text-stat-lg text-surface-900 dark:text-white" data-stat>
            {teamStats?.avgPoints?.toFixed(1) ?? "0.0"}
          </div>
          <div className="text-sm text-surface-500">Points Per Game</div>
        </div>

        {/* FG% */}
        <div className="surface-card p-4">
          <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400 mb-2">
            <ChartBarIcon className="w-4 h-4" />
            <span className="text-sm font-medium">FG%</span>
          </div>
          <div className="text-stat-lg text-surface-900 dark:text-white" data-stat>
            {teamStats?.fieldGoalPercentage?.toFixed(1) ?? "0.0"}%
          </div>
          <div className="text-sm text-surface-500">Field Goal %</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roster */}
        <div className="lg:col-span-2 surface-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Roster</h2>
            <Link
              to={`/app/teams/${teamId}/players/new`}
              className="btn-primary px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5"
            >
              <PlusIcon className="w-4 h-4" />
              Add Player
            </Link>
          </div>

          {players.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="w-12 h-12 rounded-2xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center mb-3">
                <UserIcon className="w-6 h-6 text-surface-400" />
              </div>
              <p className="text-surface-900 dark:text-white font-semibold mb-1">No players yet</p>
              <p className="text-surface-500 dark:text-surface-400 text-sm text-center">
                Add players to this team to get started
              </p>
            </div>
          ) : (
            <div className="divide-y divide-surface-200 dark:divide-surface-700">
              {players.map((player: any) => (
                <div
                  key={player.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
                    <span className="text-lg font-bold text-surface-900 dark:text-white">
                      {player.number}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-surface-900 dark:text-white truncate">
                      {player.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {player.position && (
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${getPositionColor(player.position)}`}
                        >
                          {player.position}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-surface-600 dark:text-surface-400">
                      {player.status === "active" ? (
                        <span className="text-green-500">Active</span>
                      ) : player.status === "injured" ? (
                        <span className="text-red-500">Injured</span>
                      ) : (
                        <span className="text-surface-500">Inactive</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Games */}
        <div className="surface-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-700">
            <h2 className="font-semibold text-surface-900 dark:text-white">Recent Games</h2>
            <Link
              to="/app/games"
              className="text-sm text-primary-500 hover:text-primary-400 transition-colors"
            >
              View All
            </Link>
          </div>

          {games.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <CalendarIcon className="w-8 h-8 text-surface-400 mb-2" />
              <p className="text-surface-500 dark:text-surface-400 text-sm text-center">
                No games yet
              </p>
            </div>
          ) : (
            <div className="divide-y divide-surface-200 dark:divide-surface-700">
              {games.slice(0, 5).map((game: any) => {
                const isHome = game.homeTeam?.id === teamId;
                const opponent = isHome ? game.awayTeam : game.homeTeam;
                const teamScore = isHome ? game.homeScore : game.awayScore;
                const opponentScore = isHome ? game.awayScore : game.homeScore;
                const won = teamScore > opponentScore;
                const isCompleted = game.status === "completed";

                return (
                  <Link
                    key={game.id}
                    to={`/app/games/${game.id}/analysis`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        isCompleted
                          ? won
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                          : "bg-surface-100 dark:bg-surface-700 text-surface-500"
                      }`}
                    >
                      {isCompleted ? (won ? "W" : "L") : "-"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 dark:text-white truncate">
                        {isHome ? "vs" : "@"} {opponent?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-surface-500">
                        {game.scheduledAt
                          ? new Date(game.scheduledAt).toLocaleDateString()
                          : "No date"}
                      </p>
                    </div>
                    {isCompleted && (
                      <div className="text-sm font-bold tabular-nums text-surface-900 dark:text-white">
                        {teamScore}-{opponentScore}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Team Stats */}
      {teamStats && (
        <div className="surface-card p-6">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
            Team Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div>
              <p className="text-sm text-surface-600 dark:text-surface-400">RPG</p>
              <p className="text-xl font-bold text-surface-900 dark:text-white tabular-nums">
                {teamStats.avgRebounds?.toFixed(1) ?? "0.0"}
              </p>
            </div>
            <div>
              <p className="text-sm text-surface-600 dark:text-surface-400">APG</p>
              <p className="text-xl font-bold text-surface-900 dark:text-white tabular-nums">
                {teamStats.avgAssists?.toFixed(1) ?? "0.0"}
              </p>
            </div>
            <div>
              <p className="text-sm text-surface-600 dark:text-surface-400">3P%</p>
              <p className="text-xl font-bold text-surface-900 dark:text-white tabular-nums">
                {teamStats.threePointPercentage?.toFixed(1) ?? "0.0"}%
              </p>
            </div>
            <div>
              <p className="text-sm text-surface-600 dark:text-surface-400">FT%</p>
              <p className="text-xl font-bold text-surface-900 dark:text-white tabular-nums">
                {teamStats.freeThrowPercentage?.toFixed(1) ?? "0.0"}%
              </p>
            </div>
            <div>
              <p className="text-sm text-surface-600 dark:text-surface-400">SPG</p>
              <p className="text-xl font-bold text-surface-900 dark:text-white tabular-nums">
                {teamStats.avgSteals?.toFixed(1) ?? "0.0"}
              </p>
            </div>
            <div>
              <p className="text-sm text-surface-600 dark:text-surface-400">BPG</p>
              <p className="text-xl font-bold text-surface-900 dark:text-white tabular-nums">
                {teamStats.avgBlocks?.toFixed(1) ?? "0.0"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-surface-800 rounded-2xl w-full max-w-md shadow-dramatic border border-surface-200 dark:border-surface-700 animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-700">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                Edit Team
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                  placeholder="Enter team name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, city: e.target.value }))}
                  className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                  placeholder="Enter city (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow resize-none"
                  placeholder="Enter description (optional)"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-surface-200 dark:border-surface-700">
              <button
                onClick={() => setShowEditModal(false)}
                className="btn-secondary px-4 py-2.5 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTeam}
                disabled={!editForm.name.trim() || isUpdating}
                className="btn-primary px-4 py-2.5 rounded-xl"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-surface-800 rounded-2xl w-full max-w-sm shadow-dramatic border border-surface-200 dark:border-surface-700 animate-scale-in">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrashIcon className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 text-center mb-2">
                Delete Team?
              </h3>
              <p className="text-surface-600 dark:text-surface-400 text-center text-sm">
                Are you sure you want to delete "{team.name}"? This action cannot be undone and will
                also remove all associated player data.
              </p>
            </div>

            <div className="flex gap-3 p-6 border-t border-surface-200 dark:border-surface-700">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 btn-secondary px-4 py-2.5 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTeam}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDetail;
