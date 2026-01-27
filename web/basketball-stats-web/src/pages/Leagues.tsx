import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { getErrorMessage } from "../utils/error";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TrophyIcon,
  GlobeAltIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import {
  LeagueFormModal,
  DeleteConfirmationModal,
  type LeagueFormData,
  type LeagueType,
} from "../components/modals";

type LeagueStatus = "draft" | "active" | "completed" | "archived";

interface League {
  id: Id<"leagues">;
  name: string;
  description?: string;
  leagueType: LeagueType;
  season?: string;
  status: LeagueStatus;
  isPublic: boolean;
  teamsCount: number;
  membersCount: number;
  gamesCount: number;
  createdAt: number;
  owner?: {
    id: Id<"users">;
    name: string;
    email: string;
  } | null;
  membership?: {
    role: string;
    canManageLeague: boolean;
  } | null;
}

const LEAGUE_TYPES: { value: LeagueType; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "college", label: "College" },
  { value: "high_school", label: "High School" },
  { value: "youth", label: "Youth" },
  { value: "recreational", label: "Recreational" },
];

const STATUS_COLORS: Record<LeagueStatus, string> = {
  draft: "bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400",
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  archived: "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-500",
};

const Leagues: React.FC = () => {
  const { token, selectLeague, selectedLeague } = useAuth();
  const toast = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLeagueItem, setSelectedLeagueItem] = useState<League | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Queries
  const leaguesData = useQuery(api.leagues.list, token ? { token } : "skip");

  // Mutations
  const createLeague = useMutation(api.leagues.create);
  const updateLeague = useMutation(api.leagues.update);
  const removeLeague = useMutation(api.leagues.remove);

  const leagues = (leaguesData?.leagues || []) as League[];

  // Handlers
  const handleCreateLeague = async (data: LeagueFormData) => {
    if (!token) return;

    setIsCreating(true);
    try {
      const result = await createLeague({
        token,
        name: data.name.trim(),
        description: data.description.trim() || undefined,
        leagueType: data.leagueType,
        season: data.season.trim() || undefined,
        isPublic: data.isPublic,
      });
      setShowCreateModal(false);
      toast.success(`League "${data.name.trim()}" created successfully`);

      // Auto-select the new league
      if (result.league) {
        selectLeague({
          id: result.league.id,
          name: result.league.name,
          season: result.league.season,
        });
      }
    } catch (error) {
      console.error("Failed to create league:", error);
      const message = getErrorMessage(error, "Failed to create league. Please try again.");
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditLeague = (league: League) => {
    setSelectedLeagueItem(league);
    setShowEditModal(true);
  };

  const handleUpdateLeague = async (data: LeagueFormData) => {
    if (!selectedLeagueItem || !token) return;

    setIsUpdating(true);
    try {
      await updateLeague({
        token,
        leagueId: selectedLeagueItem.id,
        name: data.name.trim(),
        description: data.description.trim() || undefined,
        leagueType: data.leagueType,
        season: data.season.trim() || undefined,
        isPublic: data.isPublic,
      });
      setShowEditModal(false);
      setSelectedLeagueItem(null);
      toast.success(`League "${data.name.trim()}" updated successfully`);
    } catch (error) {
      console.error("Failed to update league:", error);
      const message = getErrorMessage(error, "Failed to update league. Please try again.");
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteLeague = async () => {
    if (!selectedLeagueItem || !token) return;

    setIsDeleting(true);
    try {
      await removeLeague({
        token,
        leagueId: selectedLeagueItem.id,
        force: true,
      });
      setShowDeleteModal(false);
      toast.success(`League "${selectedLeagueItem.name}" deleted successfully`);

      // If deleted league was selected, clear selection
      if (selectedLeague?.id === selectedLeagueItem.id) {
        selectLeague(null);
      }
      setSelectedLeagueItem(null);
    } catch (error) {
      console.error("Failed to delete league:", error);
      const message = getErrorMessage(error, "Failed to delete league. Please try again.");
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteModal = (league: League) => {
    setSelectedLeagueItem(league);
    setShowDeleteModal(true);
  };

  const handleSelectLeague = (league: League) => {
    selectLeague({
      id: league.id,
      name: league.name,
      season: league.season,
    });
    toast.success(`Switched to ${league.name}`);
  };

  const getLeagueTypeLabel = (type: LeagueType) => {
    return LEAGUE_TYPES.find((t) => t.value === type)?.label || type;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Leagues</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">
            Manage your basketball leagues
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Create League
        </button>
      </div>

      {/* Leagues Grid */}
      {leagues.length === 0 ? (
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-12 text-center">
          <TrophyIcon className="w-16 h-16 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
            No leagues yet
          </h3>
          <p className="text-surface-500 dark:text-surface-400 mb-6">
            Create your first league to start tracking basketball stats
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Create League
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leagues.map((league) => (
            <div
              key={league.id}
              className={`bg-white dark:bg-surface-800 rounded-xl border-2 overflow-hidden transition-all hover:shadow-lg ${
                selectedLeague?.id === league.id
                  ? "border-primary-500"
                  : "border-surface-200 dark:border-surface-700"
              }`}
            >
              {/* Card Header */}
              <div className="p-4 border-b border-surface-100 dark:border-surface-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-surface-900 dark:text-white truncate">
                        {league.name}
                      </h3>
                      {league.isPublic ? (
                        <GlobeAltIcon className="w-4 h-4 text-surface-400" title="Public" />
                      ) : (
                        <LockClosedIcon className="w-4 h-4 text-surface-400" title="Private" />
                      )}
                    </div>
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      {getLeagueTypeLabel(league.leagueType)}
                      {league.season && ` • ${league.season}`}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[league.status]}`}
                  >
                    {league.status.charAt(0).toUpperCase() + league.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4">
                {league.description && (
                  <p className="text-sm text-surface-600 dark:text-surface-400 mb-4 line-clamp-2">
                    {league.description}
                  </p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-surface-900 dark:text-white">
                      {league.teamsCount}
                    </p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">Teams</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-surface-900 dark:text-white">
                      {league.gamesCount}
                    </p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">Games</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-surface-900 dark:text-white">
                      {league.membersCount}
                    </p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">Members</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSelectLeague(league)}
                    className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                      selectedLeague?.id === league.id
                        ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                        : "bg-surface-100 text-surface-700 hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-300 dark:hover:bg-surface-600"
                    }`}
                  >
                    {selectedLeague?.id === league.id ? "Selected" : "Select"}
                  </button>
                  {league.membership?.canManageLeague && (
                    <>
                      <button
                        onClick={() => handleEditLeague(league)}
                        className="p-2 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                        title="Edit league"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(league)}
                        className="p-2 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete league"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create League Modal */}
      <LeagueFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateLeague}
        isSubmitting={isCreating}
        mode="create"
      />

      {/* Edit League Modal */}
      <LeagueFormModal
        isOpen={showEditModal && !!selectedLeagueItem}
        onClose={() => {
          setShowEditModal(false);
          setSelectedLeagueItem(null);
        }}
        onSubmit={handleUpdateLeague}
        isSubmitting={isUpdating}
        mode="edit"
        initialData={
          selectedLeagueItem
            ? {
                name: selectedLeagueItem.name,
                description: selectedLeagueItem.description || "",
                leagueType: selectedLeagueItem.leagueType,
                season: selectedLeagueItem.season || "",
                isPublic: selectedLeagueItem.isPublic,
              }
            : undefined
        }
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal && !!selectedLeagueItem}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedLeagueItem(null);
        }}
        onConfirm={handleDeleteLeague}
        isDeleting={isDeleting}
        title="Delete League"
        itemName={selectedLeagueItem?.name || ""}
        warningMessage={`This will permanently delete all ${selectedLeagueItem?.teamsCount || 0} teams, ${selectedLeagueItem?.gamesCount || 0} games, and associated data.`}
      />
    </div>
  );
};

export default Leagues;
