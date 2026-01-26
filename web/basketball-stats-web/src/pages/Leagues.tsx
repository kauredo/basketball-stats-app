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
  ExclamationTriangleIcon,
  XMarkIcon,
  UsersIcon,
  TrophyIcon,
  CalendarIcon,
  GlobeAltIcon,
  LockClosedIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

type LeagueType = "professional" | "college" | "high_school" | "youth" | "recreational";
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
  const [leagueForm, setLeagueForm] = useState({
    name: "",
    description: "",
    leagueType: "recreational" as LeagueType,
    season: "",
    isPublic: false,
  });
  const [formErrors, setFormErrors] = useState<{ name?: string }>({});
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

  // Validation
  const validateLeagueName = (name: string) => {
    if (!name.trim()) return "League name is required";
    if (name.trim().length < 2) return "League name must be at least 2 characters";
    if (name.trim().length > 100) return "League name must be less than 100 characters";
    return undefined;
  };

  // Handlers
  const handleCreateLeague = async () => {
    const nameError = validateLeagueName(leagueForm.name);
    if (nameError) {
      setFormErrors({ name: nameError });
      return;
    }

    if (!token) return;

    setIsCreating(true);
    try {
      const result = await createLeague({
        token,
        name: leagueForm.name.trim(),
        description: leagueForm.description.trim() || undefined,
        leagueType: leagueForm.leagueType,
        season: leagueForm.season.trim() || undefined,
        isPublic: leagueForm.isPublic,
      });
      setShowCreateModal(false);
      setLeagueForm({
        name: "",
        description: "",
        leagueType: "recreational",
        season: "",
        isPublic: false,
      });
      setFormErrors({});
      toast.success(`League "${leagueForm.name.trim()}" created successfully`);

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
    setLeagueForm({
      name: league.name,
      description: league.description || "",
      leagueType: league.leagueType,
      season: league.season || "",
      isPublic: league.isPublic,
    });
    setShowEditModal(true);
  };

  const handleUpdateLeague = async () => {
    const nameError = validateLeagueName(leagueForm.name);
    if (nameError) {
      setFormErrors({ name: nameError });
      return;
    }

    if (!selectedLeagueItem || !token) return;

    setIsUpdating(true);
    try {
      await updateLeague({
        token,
        leagueId: selectedLeagueItem.id,
        name: leagueForm.name.trim(),
        description: leagueForm.description.trim() || undefined,
        leagueType: leagueForm.leagueType,
        season: leagueForm.season.trim() || undefined,
        isPublic: leagueForm.isPublic,
      });
      setShowEditModal(false);
      setSelectedLeagueItem(null);
      setFormErrors({});
      toast.success(`League "${leagueForm.name.trim()}" updated successfully`);
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-md animate-scale-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-league-title"
          >
            <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
              <h2
                id="create-league-title"
                className="text-lg font-semibold text-surface-900 dark:text-white"
              >
                Create League
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  League Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={leagueForm.name}
                  onChange={(e) => {
                    setLeagueForm({ ...leagueForm, name: e.target.value });
                    if (formErrors.name) setFormErrors({});
                  }}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    formErrors.name
                      ? "border-red-500 focus:ring-red-500"
                      : "border-surface-300 dark:border-surface-600 focus:ring-primary-500"
                  } bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:ring-2`}
                  placeholder="e.g., Downtown Basketball League"
                />
                {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  League Type
                </label>
                <select
                  value={leagueForm.leagueType}
                  onChange={(e) =>
                    setLeagueForm({ ...leagueForm, leagueType: e.target.value as LeagueType })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {LEAGUE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Season */}
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Season
                </label>
                <input
                  type="text"
                  value={leagueForm.season}
                  onChange={(e) => setLeagueForm({ ...leagueForm, season: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., 2025-2026"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Description
                </label>
                <textarea
                  value={leagueForm.description}
                  onChange={(e) => setLeagueForm({ ...leagueForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Brief description of the league..."
                />
              </div>

              {/* Public Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    Public League
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    Anyone can find and join this league
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={leagueForm.isPublic}
                  onClick={() => setLeagueForm({ ...leagueForm, isPublic: !leagueForm.isPublic })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    leagueForm.isPublic ? "bg-primary-500" : "bg-surface-300 dark:bg-surface-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      leagueForm.isPublic ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-surface-200 dark:border-surface-700">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLeague}
                disabled={isCreating || !leagueForm.name.trim()}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-surface-300 dark:disabled:bg-surface-600 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                {isCreating ? "Creating..." : "Create League"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedLeagueItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-md animate-scale-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-league-title"
          >
            <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
              <h2
                id="edit-league-title"
                className="text-lg font-semibold text-surface-900 dark:text-white"
              >
                Edit League
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Same form fields as Create */}
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  League Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={leagueForm.name}
                  onChange={(e) => {
                    setLeagueForm({ ...leagueForm, name: e.target.value });
                    if (formErrors.name) setFormErrors({});
                  }}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    formErrors.name
                      ? "border-red-500 focus:ring-red-500"
                      : "border-surface-300 dark:border-surface-600 focus:ring-primary-500"
                  } bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:ring-2`}
                />
                {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  League Type
                </label>
                <select
                  value={leagueForm.leagueType}
                  onChange={(e) =>
                    setLeagueForm({ ...leagueForm, leagueType: e.target.value as LeagueType })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {LEAGUE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Season
                </label>
                <input
                  type="text"
                  value={leagueForm.season}
                  onChange={(e) => setLeagueForm({ ...leagueForm, season: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Description
                </label>
                <textarea
                  value={leagueForm.description}
                  onChange={(e) => setLeagueForm({ ...leagueForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    Public League
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    Anyone can find and join
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={leagueForm.isPublic}
                  onClick={() => setLeagueForm({ ...leagueForm, isPublic: !leagueForm.isPublic })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    leagueForm.isPublic ? "bg-primary-500" : "bg-surface-300 dark:bg-surface-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      leagueForm.isPublic ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-surface-200 dark:border-surface-700">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateLeague}
                disabled={isUpdating || !leagueForm.name.trim()}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-surface-300 dark:disabled:bg-surface-600 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedLeagueItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-md animate-scale-in"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-league-title"
          >
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3
                id="delete-league-title"
                className="text-lg font-semibold text-surface-900 dark:text-white mb-2"
              >
                Delete League
              </h3>
              <p className="text-surface-600 dark:text-surface-400 mb-2">
                Are you sure you want to delete <strong>{selectedLeagueItem.name}</strong>?
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                This will permanently delete all {selectedLeagueItem.teamsCount} teams,{" "}
                {selectedLeagueItem.gamesCount} games, and associated data.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-surface-200 dark:border-surface-700">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedLeagueItem(null);
                }}
                className="px-4 py-2 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLeague}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete League"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leagues;
