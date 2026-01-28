import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { getErrorMessage } from "../utils/error";
import {
  PlusIcon,
  UsersIcon,
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  TeamFormModal,
  PlayerFormModal,
  DeleteConfirmationModal,
  type TeamFormData,
  type PlayerFormData,
} from "../components/modals";

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
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const teamsData = useQuery(
    api.teams.list,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const createTeam = useMutation(api.teams.create);
  const updateTeam = useMutation(api.teams.update);
  const removeTeam = useMutation(api.teams.remove);
  const createPlayer = useMutation(api.players.create);

  const teams = (teamsData?.teams || []) as TeamItem[];

  const handleCreateTeam = async (data: TeamFormData, logoStorageId?: Id<"_storage"> | null) => {
    if (!token || !selectedLeague) return;

    setIsCreating(true);
    try {
      await createTeam({
        token,
        leagueId: selectedLeague.id,
        name: data.name.trim(),
        city: data.city.trim() || undefined,
        description: data.description.trim() || undefined,
        logoStorageId: logoStorageId || undefined,
      });
      setShowCreateModal(false);
      toast.success(`Team "${data.name.trim()}" created successfully`);
    } catch (error) {
      console.error("Failed to create team:", error);
      const message = getErrorMessage(error, "Failed to create team. Please try again.");
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreatePlayer = async (data: PlayerFormData) => {
    if (!selectedTeam || !token) return;

    setIsCreating(true);
    try {
      await createPlayer({
        token,
        teamId: selectedTeam.id as Id<"teams">,
        name: data.name.trim(),
        number: parseInt(data.number),
        position: data.position,
        heightCm: data.heightCm ? parseInt(data.heightCm) : undefined,
        weightKg: data.weightKg ? parseInt(data.weightKg) : undefined,
      });
      toast.success(`Player "${data.name.trim()}" added to ${selectedTeam.name}`);
      setShowCreatePlayerModal(false);
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
    setShowEditModal(true);
  };

  const handleUpdateTeam = async (
    data: TeamFormData,
    logoStorageId?: Id<"_storage"> | null,
    clearLogo?: boolean
  ) => {
    if (!selectedTeam || !token) return;

    setIsUpdating(true);
    try {
      await updateTeam({
        token,
        teamId: selectedTeam.id as Id<"teams">,
        name: data.name.trim(),
        city: data.city.trim() || undefined,
        description: data.description.trim() || undefined,
        logoStorageId: logoStorageId || undefined,
        clearLogo: clearLogo || undefined,
      });
      toast.success(`Team "${data.name.trim()}" updated successfully`);
      setShowEditModal(false);
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
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleEditTeam(team)}
            className="p-2.5 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors"
            title="Edit team"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedTeam(team);
              setShowDeleteModal(true);
            }}
            className="p-2.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-xl transition-colors"
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
      <TeamFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTeam}
        isSubmitting={isCreating}
        mode="create"
      />

      {/* Edit Team Modal */}
      <TeamFormModal
        isOpen={showEditModal && !!selectedTeam}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTeam(null);
        }}
        onSubmit={handleUpdateTeam}
        isSubmitting={isUpdating}
        mode="edit"
        initialData={
          selectedTeam
            ? {
                name: selectedTeam.name,
                city: selectedTeam.city || "",
                description: selectedTeam.description || "",
                logoUrl: selectedTeam.logoUrl,
              }
            : undefined
        }
      />

      {/* Create Player Modal */}
      <PlayerFormModal
        isOpen={showCreatePlayerModal && !!selectedTeam}
        onClose={() => {
          setShowCreatePlayerModal(false);
          setSelectedTeam(null);
        }}
        onSubmit={handleCreatePlayer}
        isSubmitting={isCreating}
        mode="create"
        teamName={selectedTeam?.name}
      />

      {/* Delete Team Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal && !!selectedTeam}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedTeam(null);
        }}
        onConfirm={handleDeleteTeam}
        isDeleting={isDeleting}
        title="Delete Team"
        itemName={selectedTeam?.name || ""}
        warningMessage="This action cannot be undone. All players on this team will also be affected."
      />
    </div>
  );
};

export default Teams;
