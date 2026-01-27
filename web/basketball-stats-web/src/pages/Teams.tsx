import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { getErrorMessage } from "../utils/error";
import type { Position } from "@basketball-stats/shared";
import {
  PlusIcon,
  UsersIcon,
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import ImageUpload from "../components/ImageUpload";

// Local interface for team items returned from the API
interface TeamItem {
  id: Id<"teams">;
  name: string;
  city?: string;
  description?: string;
  logoUrl?: string;
  activePlayersCount?: number;
  wins?: number;
  losses?: number;
}

const Teams: React.FC = () => {
  const { token, selectedLeague } = useAuth();
  const toast = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreatePlayerModal, setShowCreatePlayerModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamItem | null>(null);
  const [teamForm, setTeamForm] = useState({
    name: "",
    city: "",
    description: "",
    logoUrl: "",
    logoStorageId: null as Id<"_storage"> | null,
    clearLogo: false,
  });
  const [teamFormErrors, setTeamFormErrors] = useState<{ name?: string }>({});
  const [playerForm, setPlayerForm] = useState({
    name: "",
    number: "",
    position: "PG" as "PG" | "SG" | "SF" | "PF" | "C",
    heightCm: "",
    weightKg: "",
  });
  const [playerFormErrors, setPlayerFormErrors] = useState<{ name?: string; number?: string }>({});
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Validation functions
  const validateTeamName = (name: string) => {
    if (!name.trim()) return "Team name is required";
    if (name.trim().length < 2) return "Team name must be at least 2 characters";
    if (name.trim().length > 50) return "Team name must be less than 50 characters";
    return undefined;
  };

  const validatePlayerName = (name: string) => {
    if (!name.trim()) return "Player name is required";
    if (name.trim().length < 2) return "Player name must be at least 2 characters";
    return undefined;
  };

  const validateJerseyNumber = (number: string) => {
    if (!number) return "Jersey number is required";
    const num = parseInt(number);
    if (isNaN(num)) return "Jersey number must be a valid number";
    if (num < 0 || num > 99) return "Jersey number must be between 0 and 99";
    return undefined;
  };

  const teamsData = useQuery(
    api.teams.list,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const createTeam = useMutation(api.teams.create);
  const updateTeam = useMutation(api.teams.update);
  const removeTeam = useMutation(api.teams.remove);
  const createPlayer = useMutation(api.players.create);

  const teams = (teamsData?.teams || []) as TeamItem[];

  const handleCreateTeam = async () => {
    if (!teamForm.name.trim() || !token || !selectedLeague) return;

    setIsCreating(true);
    try {
      await createTeam({
        token,
        leagueId: selectedLeague.id,
        name: teamForm.name.trim(),
        city: teamForm.city.trim() || undefined,
        description: teamForm.description.trim() || undefined,
        logoStorageId: teamForm.logoStorageId || undefined,
      });
      setShowCreateModal(false);
      setTeamForm({
        name: "",
        city: "",
        description: "",
        logoUrl: "",
        logoStorageId: null,
        clearLogo: false,
      });
      setTeamFormErrors({});
      toast.success(`Team "${teamForm.name.trim()}" created successfully`);
    } catch (error) {
      console.error("Failed to create team:", error);
      const message = getErrorMessage(error, "Failed to create team. Please try again.");
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreatePlayer = async () => {
    if (!selectedTeam || !playerForm.name.trim() || !playerForm.number || !token) return;

    setIsCreating(true);
    try {
      await createPlayer({
        token,
        teamId: selectedTeam.id as Id<"teams">,
        name: playerForm.name.trim(),
        number: parseInt(playerForm.number),
        position: playerForm.position,
        heightCm: playerForm.heightCm ? parseInt(playerForm.heightCm) : undefined,
        weightKg: playerForm.weightKg ? parseInt(playerForm.weightKg) : undefined,
      });
      toast.success(`Player "${playerForm.name.trim()}" added to ${selectedTeam.name}`);
      setShowCreatePlayerModal(false);
      setPlayerForm({ name: "", number: "", position: "PG", heightCm: "", weightKg: "" });
      setPlayerFormErrors({});
      setSelectedTeam(null);
    } catch (error) {
      console.error("Failed to create player:", error);
      const message = getErrorMessage(error, "Failed to add player. Please try again.");
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditTeam = (team: TeamItem) => {
    setSelectedTeam(team);
    setTeamForm({
      name: team.name,
      city: team.city || "",
      description: team.description || "",
      logoUrl: team.logoUrl || "",
      logoStorageId: null,
      clearLogo: false,
    });
    setTeamFormErrors({});
    setShowEditModal(true);
  };

  const handleUpdateTeam = async () => {
    if (!selectedTeam || !teamForm.name.trim() || !token) return;

    setIsUpdating(true);
    try {
      await updateTeam({
        token,
        teamId: selectedTeam.id as Id<"teams">,
        name: teamForm.name.trim(),
        city: teamForm.city.trim() || undefined,
        description: teamForm.description.trim() || undefined,
        logoStorageId: teamForm.logoStorageId || undefined,
        clearLogo: teamForm.clearLogo || undefined,
      });
      toast.success(`Team "${teamForm.name.trim()}" updated successfully`);
      setShowEditModal(false);
      setTeamForm({
        name: "",
        city: "",
        description: "",
        logoUrl: "",
        logoStorageId: null,
        clearLogo: false,
      });
      setTeamFormErrors({});
      setSelectedTeam(null);
    } catch (error) {
      console.error("Failed to update team:", error);
      const message = getErrorMessage(error, "Failed to update team. Please try again.");
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeam || !token) return;

    const teamName = selectedTeam.name;
    setIsDeleting(true);
    try {
      await removeTeam({
        token,
        teamId: selectedTeam.id as Id<"teams">,
      });
      toast.success(`Team "${teamName}" deleted successfully`);
      setShowDeleteModal(false);
      setSelectedTeam(null);
    } catch (error) {
      console.error("Failed to delete team:", error);
      const message = getErrorMessage(error, "Failed to delete team. Please try again.");
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderTeamCard = (team: TeamItem) => (
    <div
      key={team.id}
      className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700 shadow-soft"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <Link
            to={`/app/teams/${team.id}`}
            className="text-xl font-bold text-surface-900 dark:text-white hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
          >
            {team.name}
          </Link>
          {team.city && (
            <p className="text-surface-600 dark:text-surface-400 text-sm mt-1">{team.city}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEditTeam(team)}
            className="p-2 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors"
            title="Edit team"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedTeam(team);
              setShowDeleteModal(true);
            }}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-xl transition-colors"
            title="Delete team"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {team.description && (
        <p className="text-surface-700 dark:text-surface-300 text-sm mb-4 line-clamp-2">
          {team.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center text-sm text-surface-600 dark:text-surface-400">
          <UsersIcon className="w-4 h-4 mr-2" />
          <span>{team.activePlayersCount || 0} Active Players</span>
        </div>

        <button
          onClick={() => {
            setSelectedTeam(team);
            setShowCreatePlayerModal(true);
          }}
          className="group flex items-center gap-1.5 px-3 py-2 bg-surface-100 dark:bg-surface-700 hover:bg-primary-500 hover:text-white text-surface-700 dark:text-surface-300 text-xs font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-surface-800"
        >
          <UserPlusIcon className="w-4 h-4" />
          Add Player
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-surface-900 dark:text-white" data-stat>
              {team.activePlayersCount || 0}
            </div>
            <div className="text-xs text-surface-600 dark:text-surface-400">Players</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-400" data-stat>
              {team.wins || 0}
            </div>
            <div className="text-xs text-surface-600 dark:text-surface-400">Wins</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-400" data-stat>
              {team.losses || 0}
            </div>
            <div className="text-xs text-surface-600 dark:text-surface-400">Losses</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (teamsData === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-display-lg text-surface-900 dark:text-white">Teams</h1>
          <p className="text-surface-600 dark:text-surface-400">
            Manage basketball teams and their players
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="group flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white text-sm font-medium rounded-xl shadow-soft hover:shadow-glow-orange transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-surface-900"
        >
          <PlusIcon className="w-4 h-4" />
          Create Team
        </button>
      </div>

      {teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map(renderTeamCard)}
        </div>
      ) : (
        <div className="text-center py-12">
          <UsersIcon className="mx-auto h-12 w-12 text-surface-600 dark:text-surface-400" />
          <h3 className="mt-2 text-sm font-medium text-surface-900 dark:text-white">No teams</h3>
          <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">
            Get started by creating your first team.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="group inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white text-sm font-medium rounded-xl shadow-soft hover:shadow-glow-orange transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-surface-900"
            >
              <PlusIcon className="w-5 h-5" />
              Create your first team
            </button>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 w-full max-w-md border border-surface-200 dark:border-surface-700 animate-scale-in shadow-elevated">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-surface-900 dark:text-white">
                Create New Team
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setTeamForm({
                    name: "",
                    city: "",
                    description: "",
                    logoUrl: "",
                    logoStorageId: null,
                    clearLogo: false,
                  });
                  setTeamFormErrors({});
                }}
                className="p-2 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={teamForm.name}
                  onChange={(e) => {
                    setTeamForm((prev) => ({ ...prev, name: e.target.value }));
                    if (teamFormErrors.name) {
                      setTeamFormErrors((prev) => ({
                        ...prev,
                        name: validateTeamName(e.target.value),
                      }));
                    }
                  }}
                  onBlur={(e) =>
                    setTeamFormErrors((prev) => ({
                      ...prev,
                      name: validateTeamName(e.target.value),
                    }))
                  }
                  className={`w-full bg-surface-100 dark:bg-surface-700 border rounded-xl px-3 py-2 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    teamFormErrors.name
                      ? "border-red-500 focus:ring-red-500"
                      : "border-surface-300 dark:border-surface-600"
                  }`}
                  placeholder="Enter team name"
                />
                {teamFormErrors.name && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                    {teamFormErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={teamForm.city}
                  onChange={(e) => setTeamForm((prev) => ({ ...prev, city: e.target.value }))}
                  className="w-full bg-surface-100 dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-xl px-3 py-2 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter city"
                />
              </div>

              <ImageUpload
                label="Team Logo"
                placeholder="Click to upload logo or drag and drop"
                onImageUploaded={(storageId) =>
                  setTeamForm((prev) => ({ ...prev, logoStorageId: storageId }))
                }
                onImageCleared={() => setTeamForm((prev) => ({ ...prev, logoStorageId: null }))}
              />

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Description
                </label>
                <textarea
                  value={teamForm.description}
                  onChange={(e) =>
                    setTeamForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full bg-surface-100 dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-xl px-3 py-2 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter team description"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setTeamForm({
                    name: "",
                    city: "",
                    description: "",
                    logoUrl: "",
                    logoStorageId: null,
                    clearLogo: false,
                  });
                  setTeamFormErrors({});
                }}
                className="btn-secondary px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTeam}
                disabled={!teamForm.name.trim() || !!teamFormErrors.name || isCreating}
                className="btn-primary px-4 py-2 rounded-xl"
              >
                {isCreating ? "Creating..." : "Create Team"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Player Modal */}
      {showCreatePlayerModal && selectedTeam && (
        <div className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 w-full max-w-md border border-surface-200 dark:border-surface-700 animate-scale-in shadow-elevated">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-surface-900 dark:text-white">
                Add Player to {selectedTeam.name}
              </h3>
              <button
                onClick={() => {
                  setShowCreatePlayerModal(false);
                  setPlayerForm({
                    name: "",
                    number: "",
                    position: "PG",
                    heightCm: "",
                    weightKg: "",
                  });
                  setPlayerFormErrors({});
                  setSelectedTeam(null);
                }}
                className="p-2 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Player Name *
                </label>
                <input
                  type="text"
                  value={playerForm.name}
                  onChange={(e) => {
                    setPlayerForm((prev) => ({ ...prev, name: e.target.value }));
                    if (playerFormErrors.name) {
                      setPlayerFormErrors((prev) => ({
                        ...prev,
                        name: validatePlayerName(e.target.value),
                      }));
                    }
                  }}
                  onBlur={(e) =>
                    setPlayerFormErrors((prev) => ({
                      ...prev,
                      name: validatePlayerName(e.target.value),
                    }))
                  }
                  className={`w-full bg-surface-100 dark:bg-surface-700 border rounded-xl px-3 py-2 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    playerFormErrors.name
                      ? "border-red-500 focus:ring-red-500"
                      : "border-surface-300 dark:border-surface-600"
                  }`}
                  placeholder="Enter player name"
                />
                {playerFormErrors.name && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                    {playerFormErrors.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Jersey # *
                  </label>
                  <input
                    type="number"
                    value={playerForm.number}
                    onChange={(e) => {
                      setPlayerForm((prev) => ({ ...prev, number: e.target.value }));
                      if (playerFormErrors.number) {
                        setPlayerFormErrors((prev) => ({
                          ...prev,
                          number: validateJerseyNumber(e.target.value),
                        }));
                      }
                    }}
                    onBlur={(e) =>
                      setPlayerFormErrors((prev) => ({
                        ...prev,
                        number: validateJerseyNumber(e.target.value),
                      }))
                    }
                    className={`w-full bg-surface-100 dark:bg-surface-700 border rounded-xl px-3 py-2 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      playerFormErrors.number
                        ? "border-red-500 focus:ring-red-500"
                        : "border-surface-300 dark:border-surface-600"
                    }`}
                    placeholder="00"
                    min="0"
                    max="99"
                  />
                  {playerFormErrors.number && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                      {playerFormErrors.number}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Position *
                  </label>
                  <select
                    value={playerForm.position}
                    onChange={(e) =>
                      setPlayerForm((prev) => ({ ...prev, position: e.target.value as Position }))
                    }
                    className="w-full bg-surface-100 dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-xl px-3 py-2 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="PG">Point Guard</option>
                    <option value="SG">Shooting Guard</option>
                    <option value="SF">Small Forward</option>
                    <option value="PF">Power Forward</option>
                    <option value="C">Center</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={playerForm.heightCm}
                    onChange={(e) =>
                      setPlayerForm((prev) => ({ ...prev, heightCm: e.target.value }))
                    }
                    className="w-full bg-surface-100 dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-xl px-3 py-2 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="183"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={playerForm.weightKg}
                    onChange={(e) =>
                      setPlayerForm((prev) => ({ ...prev, weightKg: e.target.value }))
                    }
                    className="w-full bg-surface-100 dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-xl px-3 py-2 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="82"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreatePlayerModal(false);
                  setPlayerForm({
                    name: "",
                    number: "",
                    position: "PG",
                    heightCm: "",
                    weightKg: "",
                  });
                  setPlayerFormErrors({});
                  setSelectedTeam(null);
                }}
                className="btn-secondary px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlayer}
                disabled={
                  !playerForm.name.trim() ||
                  !playerForm.number ||
                  !!playerFormErrors.name ||
                  !!playerFormErrors.number ||
                  isCreating
                }
                className="btn-primary px-4 py-2 rounded-xl"
              >
                {isCreating ? "Adding..." : "Add Player"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {showEditModal && selectedTeam && (
        <div className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 w-full max-w-md border border-surface-200 dark:border-surface-700 animate-scale-in shadow-elevated">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-surface-900 dark:text-white">Edit Team</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setTeamForm({
                    name: "",
                    city: "",
                    description: "",
                    logoUrl: "",
                    logoStorageId: null,
                    clearLogo: false,
                  });
                  setTeamFormErrors({});
                  setSelectedTeam(null);
                }}
                className="p-2 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={teamForm.name}
                  onChange={(e) => {
                    setTeamForm((prev) => ({ ...prev, name: e.target.value }));
                    if (teamFormErrors.name) {
                      setTeamFormErrors((prev) => ({
                        ...prev,
                        name: validateTeamName(e.target.value),
                      }));
                    }
                  }}
                  onBlur={(e) =>
                    setTeamFormErrors((prev) => ({
                      ...prev,
                      name: validateTeamName(e.target.value),
                    }))
                  }
                  className={`w-full bg-surface-100 dark:bg-surface-700 border rounded-xl px-3 py-2 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    teamFormErrors.name
                      ? "border-red-500 focus:ring-red-500"
                      : "border-surface-300 dark:border-surface-600"
                  }`}
                  placeholder="Enter team name"
                />
                {teamFormErrors.name && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                    {teamFormErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={teamForm.city}
                  onChange={(e) => setTeamForm((prev) => ({ ...prev, city: e.target.value }))}
                  className="w-full bg-surface-100 dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-xl px-3 py-2 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter city"
                />
              </div>

              <ImageUpload
                label="Team Logo"
                placeholder="Click to upload logo or drag and drop"
                currentImageUrl={teamForm.clearLogo ? undefined : teamForm.logoUrl}
                onImageUploaded={(storageId) =>
                  setTeamForm((prev) => ({ ...prev, logoStorageId: storageId, clearLogo: false }))
                }
                onImageCleared={() =>
                  setTeamForm((prev) => ({ ...prev, logoStorageId: null, clearLogo: true }))
                }
              />

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Description
                </label>
                <textarea
                  value={teamForm.description}
                  onChange={(e) =>
                    setTeamForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full bg-surface-100 dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-xl px-3 py-2 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter team description"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setTeamForm({
                    name: "",
                    city: "",
                    description: "",
                    logoUrl: "",
                    logoStorageId: null,
                    clearLogo: false,
                  });
                  setTeamFormErrors({});
                  setSelectedTeam(null);
                }}
                className="btn-secondary px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTeam}
                disabled={!teamForm.name.trim() || !!teamFormErrors.name || isUpdating}
                className="btn-primary px-4 py-2 rounded-xl"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Team Confirmation Modal */}
      {showDeleteModal && selectedTeam && (
        <div className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 w-full max-w-md border border-surface-200 dark:border-surface-700 animate-scale-in shadow-elevated">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-surface-900 dark:text-white">
                  Delete Team
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedTeam(null);
                }}
                className="p-2 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <p className="text-surface-600 dark:text-surface-400 mb-2">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-surface-900 dark:text-white">
                {selectedTeam.name}
              </span>
              ?
            </p>
            <p className="text-sm text-surface-500 dark:text-surface-500 mb-6">
              This action cannot be undone. All players on this team will also be affected.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedTeam(null);
                }}
                className="btn-secondary px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTeam}
                disabled={isDeleting}
                className="btn-danger px-4 py-2 rounded-xl"
              >
                {isDeleting ? "Deleting..." : "Delete Team"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;
