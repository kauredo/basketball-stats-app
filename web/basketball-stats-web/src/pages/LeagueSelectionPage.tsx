import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";
import { PlusIcon, UsersIcon, TrophyIcon, CalendarIcon } from "@heroicons/react/24/outline";

const leagueTypes = [
  { value: "recreational", label: "Recreational" },
  { value: "youth", label: "Youth" },
  { value: "high_school", label: "High School" },
  { value: "college", label: "College" },
  { value: "professional", label: "Professional" },
];

export default function LeagueSelectionPage() {
  const { token, selectedLeague, selectLeague, user, logout } = useAuth();
  const [inviteCode, setInviteCode] = useState("");
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create league modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: "",
    description: "",
    leagueType: "recreational" as const,
    isPublic: false,
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const leaguesData = useQuery(api.leagues.list, token ? { token } : "skip");
  const joinLeagueMutation = useMutation(api.leagues.join);
  const joinByCodeMutation = useMutation(api.leagues.joinByCode);
  const createLeague = useMutation(api.leagues.create);

  const userLeagues = leaguesData?.leagues || [];

  const _handleJoinLeague = async (leagueId: Id<"leagues">) => {
    if (!token) return;
    setIsJoining(true);
    setError(null);
    try {
      await joinLeagueMutation({ token, leagueId });
    } catch (err: any) {
      console.error("Failed to join league:", err);
      setError(err.message || "Failed to join league");
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || !token) return;

    setIsJoining(true);
    setError(null);
    try {
      await joinByCodeMutation({ token, code: inviteCode.trim() });
      setInviteCode("");
      setShowJoinForm(false);
    } catch (err: any) {
      console.error("Failed to join league by code:", err);
      setError(err.message || "Failed to join league");
    } finally {
      setIsJoining(false);
    }
  };

  const handleSelectLeague = (league: any) => {
    selectLeague({
      id: league.id,
      name: league.name,
      description: league.description,
      leagueType: league.leagueType,
      season: league.season,
      status: league.status,
      isPublic: league.isPublic,
      teamsCount: league.teamsCount,
      membersCount: league.membersCount,
      gamesCount: league.gamesCount,
      role: league.role,
      createdAt: league.createdAt,
    });
  };

  const handleLogout = () => {
    logout();
  };

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.name.trim() || !token) return;

    setIsCreating(true);
    setCreateError(null);
    try {
      const result = await createLeague({
        token,
        name: createFormData.name.trim(),
        description: createFormData.description.trim() || undefined,
        leagueType: createFormData.leagueType,
        isPublic: createFormData.isPublic,
      });

      // Auto-select the newly created league
      selectLeague({
        id: result.league.id,
        name: result.league.name,
        description: result.league.description,
        leagueType: result.league.leagueType,
        season: result.league.season,
        isPublic: result.league.isPublic,
        role: "admin",
        teamsCount: 0,
        membersCount: 1,
        gamesCount: 0,
        status: result.league.status,
        createdAt: result.league.createdAt,
      });

      // Reset form and close modal
      setCreateFormData({
        name: "",
        description: "",
        leagueType: "recreational",
        isPublic: false,
      });
      setShowCreateModal(false);
    } catch (err: any) {
      console.error("Failed to create league:", err);
      setCreateError(err.message || "Failed to create league");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div className="bg-white dark:bg-surface-800 shadow-soft border-b border-surface-200 dark:border-surface-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Icon name="basketball" size={32} className="mr-3 text-primary-500" />
              <div>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                  Basketball Stats
                </h1>
                <p className="text-surface-600 dark:text-surface-400">
                  Select a league to continue
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                <PlusIcon className="h-4 w-4 mr-2" />
                Create League
              </button>
              <div className="text-right">
                <p className="text-sm font-medium text-surface-900 dark:text-white">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-surface-600 dark:text-surface-400">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white text-sm transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* My Leagues */}
          {userLeagues.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                  My Leagues
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {userLeagues.map((league: any) => {
                  const isSelected = selectedLeague?.id === league.id;
                  return (
                    <button
                      key={league.id}
                      type="button"
                      className={`relative rounded-2xl border p-6 cursor-pointer transition-all text-left w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                        isSelected
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500"
                          : "border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-surface-300 dark:hover:border-surface-600 hover:shadow-soft"
                      }`}
                      onClick={() => handleSelectLeague(league)}
                      aria-pressed={isSelected}
                      aria-label={`Select ${league.name} league`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                          {league.name}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                          {league.leagueType}
                        </span>
                      </div>

                      {league.description && (
                        <p className="text-surface-600 dark:text-surface-400 text-sm mb-4 line-clamp-2">
                          {league.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-sm text-surface-600 dark:text-surface-400">
                        <div className="flex items-center">
                          <TrophyIcon className="h-4 w-4 mr-1" />
                          <span>{league.teamsCount || 0} teams</span>
                        </div>
                        <div className="flex items-center">
                          <UsersIcon className="h-4 w-4 mr-1" />
                          <span>{league.membersCount || 0} members</span>
                        </div>
                      </div>

                      <div className="mt-4 text-xs text-surface-500">
                        <div className="flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          Season: {league.season}
                        </div>
                      </div>

                      {league.role && (
                        <div className="mt-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                            {league.role}
                          </span>
                        </div>
                      )}

                      {isSelected && (
                        <div className="absolute top-2 right-2" aria-hidden="true">
                          <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Join League Section */}
          <div className="mb-8">
            <div className="surface-card p-6">
              <div className="flex items-center justify-between mb-4 w-full">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                  Join a League
                </h2>
                <button onClick={() => setShowJoinForm(!showJoinForm)} className="btn-secondary">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  {showJoinForm ? "Cancel" : "Join by Code"}
                </button>
              </div>

              {showJoinForm && (
                <form onSubmit={handleJoinByCode} className="flex gap-4">
                  <label htmlFor="invite-code" className="sr-only">
                    Invite code
                  </label>
                  <input
                    id="invite-code"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter invite code (e.g., league-name-123)"
                    className="flex-1 px-4 py-3 border border-surface-200 dark:border-surface-600 bg-surface-100 dark:bg-surface-700 text-surface-900 dark:text-white placeholder-surface-500 dark:placeholder-surface-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isJoining || !inviteCode.trim()}
                    className="btn-primary"
                  >
                    {isJoining ? "Joining..." : "Join"}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Empty State */}
          {userLeagues.length === 0 && (
            <div className="text-center py-12">
              <TrophyIcon className="mx-auto h-12 w-12 text-surface-400" />
              <h3 className="mt-2 text-sm font-medium text-surface-900 dark:text-white">
                No leagues yet
              </h3>
              <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">
                Create your own league or join an existing one with an invite code.
              </p>
              <div className="mt-6">
                <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create League
                </button>
              </div>
            </div>
          )}

          {/* Continue Button */}
          {selectedLeague && (
            <div className="fixed bottom-6 right-6">
              <button
                onClick={() => {
                  /* Navigation will be handled by auth state */
                }}
                className="bg-primary-500 text-white px-6 py-3 rounded-xl shadow-elevated hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              >
                Continue to {selectedLeague.name}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create League Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-league-modal-title"
          onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}
          onKeyDown={(e) => e.key === "Escape" && setShowCreateModal(false)}
        >
          <div className="surface-card p-6 w-full max-w-md animate-scale-in">
            <h3
              id="create-league-modal-title"
              className="text-lg font-semibold text-surface-900 dark:text-white mb-4"
            >
              Create New League
            </h3>

            {createError && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateLeague} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  League Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter league name"
                  className="w-full bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl px-4 py-3 text-surface-900 dark:text-white placeholder-surface-500 dark:placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Description
                </label>
                <textarea
                  value={createFormData.description}
                  onChange={(e) =>
                    setCreateFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Enter league description (optional)"
                  rows={3}
                  className="w-full bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl px-4 py-3 text-surface-900 dark:text-white placeholder-surface-500 dark:placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  League Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={createFormData.leagueType}
                  onChange={(e) =>
                    setCreateFormData((prev) => ({
                      ...prev,
                      leagueType: e.target.value as typeof createFormData.leagueType,
                    }))
                  }
                  className="w-full bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl px-4 py-3 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                >
                  {leagueTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={createFormData.isPublic}
                  onChange={(e) =>
                    setCreateFormData((prev) => ({ ...prev, isPublic: e.target.checked }))
                  }
                  className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-surface-300 dark:border-surface-600 rounded"
                />
                <label
                  htmlFor="isPublic"
                  className="ml-2 block text-sm text-surface-700 dark:text-surface-300"
                >
                  Public League (anyone can discover and request to join)
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateFormData({
                      name: "",
                      description: "",
                      leagueType: "recreational",
                      isPublic: false,
                    });
                    setCreateError(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!createFormData.name.trim() || isCreating}
                  className="btn-primary"
                >
                  {isCreating ? "Creating..." : "Create League"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
