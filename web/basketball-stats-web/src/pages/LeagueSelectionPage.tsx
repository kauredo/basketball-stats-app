import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import {
  getErrorMessage,
  type LeagueType,
  type LeagueRole,
  type LeagueStatus,
} from "@basketball-stats/shared";
import {
  PlusIcon,
  ArrowRightIcon,
  Cog6ToothIcon,
  XMarkIcon,
  CheckIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  TrophyIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

// Local interface for league items returned from the API
interface LeagueItem {
  id: Id<"leagues">;
  name: string;
  description?: string;
  season: string;
  leagueType: LeagueType;
  status: LeagueStatus;
  teamsCount?: number;
  membersCount?: number;
  role?: LeagueRole;
  membership?: {
    role?: LeagueRole;
  };
}

const leagueTypes = [
  { value: "recreational", label: "Recreational", shortLabel: "REC" },
  { value: "youth", label: "Youth", shortLabel: "YTH" },
  { value: "high_school", label: "High School", shortLabel: "HS" },
  { value: "college", label: "College", shortLabel: "COL" },
  { value: "professional", label: "Professional", shortLabel: "PRO" },
];

const leagueTypeColors: Record<string, string> = {
  recreational: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  youth: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  high_school: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  college: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  professional: "bg-primary-500/10 text-primary-600 dark:text-primary-400",
};

export default function LeagueSelectionPage() {
  const { token, selectedLeague, selectLeague, user, logout } = useAuth();
  const [inviteCode, setInviteCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Create league state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState<{
    name: string;
    description: string;
    leagueType: LeagueType;
    isPublic: boolean;
  }>({
    name: "",
    description: "",
    leagueType: "recreational",
    isPublic: false,
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsLeagueId, setSettingsLeagueId] = useState<Id<"leagues"> | null>(null);
  const [isSettingsViewOnly, setIsSettingsViewOnly] = useState(false);
  const [settingsFormData, setSettingsFormData] = useState({
    quarterMinutes: 12,
    foulLimit: 6,
    timeoutsPerTeam: 5,
    overtimeMinutes: 5,
    bonusMode: "college" as "college" | "nba",
    playersPerRoster: 12,
    trackAdvancedStats: true,
  });
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const leaguesData = useQuery(api.leagues.list, token ? { token } : "skip");
  const settingsData = useQuery(
    api.leagues.getSettings,
    token && settingsLeagueId ? { token, leagueId: settingsLeagueId } : "skip"
  );
  const joinByCodeMutation = useMutation(api.leagues.joinByCode);
  const createLeague = useMutation(api.leagues.create);
  const updateSettings = useMutation(api.leagues.updateSettings);

  useEffect(() => {
    if (settingsData?.settings) {
      setSettingsFormData({
        quarterMinutes: settingsData.settings.quarterMinutes ?? 12,
        foulLimit: settingsData.settings.foulLimit ?? 6,
        timeoutsPerTeam: settingsData.settings.timeoutsPerTeam ?? 5,
        overtimeMinutes: settingsData.settings.overtimeMinutes ?? 5,
        bonusMode: settingsData.settings.bonusMode ?? "college",
        playersPerRoster: settingsData.settings.playersPerRoster ?? 12,
        trackAdvancedStats: settingsData.settings.trackAdvancedStats ?? true,
      });
    }
  }, [settingsData]);

  const userLeagues = (leaguesData?.leagues || []) as LeagueItem[];

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || !token) return;

    setIsJoining(true);
    setError(null);
    try {
      await joinByCodeMutation({ token, code: inviteCode.trim() });
      setInviteCode("");
      setSuccessMessage("Successfully joined the league!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(getErrorMessage(err, "Invalid invite code"));
    } finally {
      setIsJoining(false);
    }
  };

  const handleSelectLeague = (league: LeagueItem) => {
    selectLeague({
      id: league.id,
      name: league.name,
      season: league.season,
      leagueType: league.leagueType,
      status: league.status,
      role: league.membership?.role || league.role,
    });
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

      selectLeague({
        id: result.league.id,
        name: result.league.name,
        season: result.league.season,
        leagueType: result.league.leagueType,
        status: result.league.status,
        role: "admin",
      });

      setCreateFormData({
        name: "",
        description: "",
        leagueType: "recreational",
        isPublic: false,
      });
      setShowCreateModal(false);
    } catch (err) {
      setCreateError(getErrorMessage(err, "Failed to create league"));
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenSettings = (e: React.MouseEvent, leagueId: Id<"leagues">, viewOnly = false) => {
    e.stopPropagation();
    setSettingsLeagueId(leagueId);
    setIsSettingsViewOnly(viewOnly);
    setShowSettingsModal(true);
    setSettingsError(null);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !settingsLeagueId) return;

    setIsSavingSettings(true);
    setSettingsError(null);
    try {
      await updateSettings({
        token,
        leagueId: settingsLeagueId,
        ...settingsFormData,
      });
      setShowSettingsModal(false);
      setSettingsLeagueId(null);
    } catch (err) {
      setSettingsError(getErrorMessage(err, "Failed to save settings"));
    } finally {
      setIsSavingSettings(false);
    }
  };

  const canManageLeague = (league: LeagueItem) =>
    league.membership?.role === "admin" ||
    league.membership?.role === "owner" ||
    league.role === "admin" ||
    league.role === "owner";

  const getLeagueTypeLabel = (type: string) => {
    const found = leagueTypes.find((t) => t.value === type);
    return found?.shortLabel || type.toUpperCase();
  };

  return (
    <div className="bg-surface-50 dark:bg-surface-950">
      {/* Minimal Header */}
      <header className="border-b border-surface-200 dark:border-surface-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
                <path
                  d="M12 2C12 2 12 12 12 12M2 12H22M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg>
            </div>
            <span className="font-bold text-lg text-surface-900 dark:text-white">
              Basketball Stats
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-surface-900 dark:text-white">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-surface-500">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="text-sm text-surface-500 hover:text-surface-900 dark:hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-display-md text-surface-900 dark:text-white mb-2">Select a League</h1>
          <p className="text-lg text-surface-600 dark:text-surface-400 max-w-xl">
            Choose a league to view stats, manage teams, and track games.
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm animate-slide-in">
            {error}
            <button onClick={() => setError(null)} className="float-right hover:text-red-800">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}
        {successMessage && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm animate-slide-in flex items-center gap-2">
            <CheckIcon className="w-4 h-4" />
            {successMessage}
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Leagues List - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            {userLeagues.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="section-header">Your Leagues</h2>
                  <span className="text-xs text-surface-500">{userLeagues.length} total</span>
                </div>
                <div className="space-y-3">
                  {userLeagues.map((league: LeagueItem) => {
                    const isSelected = selectedLeague?.id === league.id;
                    const role = league.membership?.role || league.role;
                    return (
                      <button
                        key={league.id}
                        type="button"
                        onClick={() => handleSelectLeague(league)}
                        className={`group w-full text-left rounded-xl p-5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                          isSelected
                            ? "bg-primary-500 text-white shadow-elevated ring-2 ring-primary-500"
                            : "bg-white dark:bg-surface-900 hover:bg-surface-100 dark:hover:bg-surface-800 border border-surface-200 dark:border-surface-800"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3
                                className={`font-semibold text-lg truncate ${
                                  isSelected ? "text-white" : "text-surface-900 dark:text-white"
                                }`}
                              >
                                {league.name}
                              </h3>
                              <span
                                className={`shrink-0 px-2 py-0.5 rounded text-xs font-bold tracking-wide ${
                                  isSelected
                                    ? "bg-white/20 text-white"
                                    : leagueTypeColors[league.leagueType] ||
                                      "bg-surface-100 text-surface-600"
                                }`}
                              >
                                {getLeagueTypeLabel(league.leagueType)}
                              </span>
                              {isSelected && (
                                <CheckCircleIcon className="w-5 h-5 text-white shrink-0" />
                              )}
                            </div>
                            {league.description && (
                              <p
                                className={`text-sm mb-3 line-clamp-1 ${
                                  isSelected
                                    ? "text-white/80"
                                    : "text-surface-600 dark:text-surface-400"
                                }`}
                              >
                                {league.description}
                              </p>
                            )}
                            <div
                              className={`flex items-center gap-4 text-sm ${
                                isSelected ? "text-white/70" : "text-surface-500"
                              }`}
                            >
                              <span className="flex items-center gap-1.5">
                                <TrophyIcon className="w-4 h-4" />
                                {league.teamsCount || 0} teams
                              </span>
                              <span className="flex items-center gap-1.5">
                                <UserGroupIcon className="w-4 h-4" />
                                {league.membersCount || 0}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <CalendarDaysIcon className="w-4 h-4" />
                                {league.season}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {role && (
                              <span
                                className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${
                                  isSelected
                                    ? "bg-white/20 text-white"
                                    : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400"
                                }`}
                              >
                                {role}
                              </span>
                            )}
                            {canManageLeague(league) ? (
                              <button
                                type="button"
                                onClick={(e) => handleOpenSettings(e, league.id, false)}
                                className={`p-2 rounded-lg transition-colors ${
                                  isSelected
                                    ? "hover:bg-white/20 text-white"
                                    : "hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-500"
                                }`}
                                aria-label={`Edit settings for ${league.name}`}
                              >
                                <Cog6ToothIcon className="w-5 h-5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => handleOpenSettings(e, league.id, true)}
                                className={`p-2 rounded-lg transition-colors ${
                                  isSelected
                                    ? "hover:bg-white/20 text-white"
                                    : "hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-500"
                                }`}
                                aria-label={`View rules for ${league.name}`}
                              >
                                <InformationCircleIcon className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-16 px-8 rounded-xl border-2 border-dashed border-surface-200 dark:border-surface-800">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                  <TrophyIcon className="w-8 h-8 text-surface-400" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                  No leagues yet
                </h3>
                <p className="text-surface-600 dark:text-surface-400 mb-6 max-w-sm mx-auto">
                  Create your own league to start tracking games and stats, or join an existing one.
                </p>
                <button onClick={() => setShowCreateModal(true)} className="btn-primary px-6 py-3">
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Create Your First League
                </button>
              </div>
            )}
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            {/* Join League Card */}
            <div className="bg-white dark:bg-surface-900 rounded-xl p-6 border border-surface-200 dark:border-surface-800">
              <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Join a League</h3>
              <form onSubmit={handleJoinByCode} className="space-y-3">
                <div>
                  <label htmlFor="invite-code" className="sr-only">
                    Invite code
                  </label>
                  <input
                    id="invite-code"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter invite code"
                    className="w-full px-4 py-3 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isJoining || !inviteCode.trim()}
                  className="w-full btn-secondary py-3 disabled:opacity-50"
                >
                  {isJoining ? "Joining..." : "Join League"}
                </button>
              </form>
            </div>

            {/* Create League Card */}
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-6 text-white">
              <h3 className="font-semibold mb-2">Start a New League</h3>
              <p className="text-sm text-white/80 mb-4">
                Create your own league and invite teams to compete.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full py-3 px-4 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                Create League
              </button>
            </div>

            {/* Quick Stats */}
            {userLeagues.length > 0 && (
              <div className="bg-surface-100 dark:bg-surface-900 rounded-xl p-5">
                <h4 className="section-header mb-4">Your Activity</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-surface-900 dark:text-white tabular-nums">
                      {userLeagues.length}
                    </p>
                    <p className="text-xs text-surface-500">Leagues</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-surface-900 dark:text-white tabular-nums">
                      {
                        userLeagues.filter(
                          (l: LeagueItem) => l.membership?.role === "admin" || l.role === "admin"
                        ).length
                      }
                    </p>
                    <p className="text-xs text-surface-500">As Admin</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create League Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}
        >
          <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 w-full max-w-md shadow-dramatic animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-surface-900 dark:text-white">Create League</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-surface-500" />
              </button>
            </div>

            {createError && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateLeague} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  League Name
                </label>
                <input
                  type="text"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Summer Basketball League"
                  className="w-full px-4 py-3 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Description
                  <span className="text-surface-400 font-normal ml-1">(optional)</span>
                </label>
                <textarea
                  value={createFormData.description}
                  onChange={(e) =>
                    setCreateFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="What's this league about?"
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  League Type
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {leagueTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() =>
                        setCreateFormData((prev) => ({
                          ...prev,
                          leagueType: type.value as LeagueType,
                        }))
                      }
                      className={`py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                        createFormData.leagueType === type.value
                          ? "bg-primary-500 text-white shadow-soft"
                          : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700"
                      }`}
                    >
                      {type.shortLabel}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={createFormData.isPublic}
                    onChange={(e) =>
                      setCreateFormData((prev) => ({ ...prev, isPublic: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 rounded border-2 border-surface-300 dark:border-surface-600 peer-checked:border-primary-500 peer-checked:bg-primary-500 transition-colors flex items-center justify-center">
                    {createFormData.isPublic && <CheckIcon className="w-3 h-3 text-white" />}
                  </div>
                </div>
                <span className="text-sm text-surface-700 dark:text-surface-300 group-hover:text-surface-900 dark:group-hover:text-white transition-colors">
                  Make this league public
                </span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 btn-secondary py-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!createFormData.name.trim() || isCreating}
                  className="flex-1 btn-primary py-3"
                >
                  {isCreating ? "Creating..." : "Create League"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* League Settings Modal */}
      {showSettingsModal && settingsLeagueId && (
        <div
          className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowSettingsModal(false)}
        >
          <div className="bg-white dark:bg-surface-900 rounded-2xl w-full max-w-lg shadow-dramatic animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-800">
              <div>
                <h3 className="text-xl font-bold text-surface-900 dark:text-white">
                  {isSettingsViewOnly ? "League Rules" : "League Settings"}
                </h3>
                {isSettingsViewOnly && (
                  <p className="text-sm text-surface-500 mt-1">
                    Contact a league admin to change settings
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  setSettingsLeagueId(null);
                  setIsSettingsViewOnly(false);
                }}
                className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-surface-500" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              {settingsError && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
                  {settingsError}
                </div>
              )}

              {!settingsData ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-surface-500 mt-4 text-sm">Loading settings...</p>
                </div>
              ) : isSettingsViewOnly ? (
                /* View-Only Display */
                <div className="space-y-6">
                  {/* Game Rules */}
                  <div>
                    <h4 className="section-header mb-4">Game Rules</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800">
                        <p className="text-xs text-surface-500 mb-1">Quarter Length</p>
                        <p className="font-medium text-surface-900 dark:text-white">
                          {settingsFormData.quarterMinutes} min
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800">
                        <p className="text-xs text-surface-500 mb-1">Foul Limit</p>
                        <p className="font-medium text-surface-900 dark:text-white">
                          {settingsFormData.foulLimit} fouls
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800">
                        <p className="text-xs text-surface-500 mb-1">Timeouts / Team</p>
                        <p className="font-medium text-surface-900 dark:text-white">
                          {settingsFormData.timeoutsPerTeam}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800">
                        <p className="text-xs text-surface-500 mb-1">Overtime</p>
                        <p className="font-medium text-surface-900 dark:text-white">
                          {settingsFormData.overtimeMinutes} min
                        </p>
                      </div>
                      <div className="col-span-2 p-3 rounded-lg bg-surface-50 dark:bg-surface-800">
                        <p className="text-xs text-surface-500 mb-1">Bonus Mode</p>
                        <p className="font-medium text-surface-900 dark:text-white">
                          {settingsFormData.bonusMode === "college"
                            ? "College (7th team foul)"
                            : "NBA (5th team foul)"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* League Rules */}
                  <div>
                    <h4 className="section-header mb-4">League Rules</h4>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800">
                        <p className="text-xs text-surface-500 mb-1">Max Roster Size</p>
                        <p className="font-medium text-surface-900 dark:text-white">
                          {settingsFormData.playersPerRoster} players
                        </p>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-surface-50 dark:bg-surface-800">
                        <div>
                          <p className="text-xs text-surface-500 mb-1">Advanced Stats</p>
                          <p className="font-medium text-surface-900 dark:text-white">
                            {settingsFormData.trackAdvancedStats ? "Enabled" : "Disabled"}
                          </p>
                        </div>
                        <div
                          className={`w-3 h-3 rounded-full ${
                            settingsFormData.trackAdvancedStats
                              ? "bg-emerald-500"
                              : "bg-surface-300 dark:bg-surface-600"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Editable Form */
                <form id="settings-form" onSubmit={handleSaveSettings} className="space-y-6">
                  {/* Game Rules */}
                  <div>
                    <h4 className="section-header mb-4">Game Rules</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-surface-600 dark:text-surface-400 mb-1.5">
                            Quarter Length
                          </label>
                          <select
                            value={settingsFormData.quarterMinutes}
                            onChange={(e) =>
                              setSettingsFormData((prev) => ({
                                ...prev,
                                quarterMinutes: parseInt(e.target.value),
                              }))
                            }
                            className="w-full px-3 py-2.5 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                          >
                            {[5, 6, 8, 10, 12].map((n) => (
                              <option key={n} value={n}>
                                {n} min
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-surface-600 dark:text-surface-400 mb-1.5">
                            Foul Limit
                          </label>
                          <select
                            value={settingsFormData.foulLimit}
                            onChange={(e) =>
                              setSettingsFormData((prev) => ({
                                ...prev,
                                foulLimit: parseInt(e.target.value),
                              }))
                            }
                            className="w-full px-3 py-2.5 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                          >
                            <option value={5}>5 fouls</option>
                            <option value={6}>6 fouls</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-surface-600 dark:text-surface-400 mb-1.5">
                            Timeouts / Team
                          </label>
                          <select
                            value={settingsFormData.timeoutsPerTeam}
                            onChange={(e) =>
                              setSettingsFormData((prev) => ({
                                ...prev,
                                timeoutsPerTeam: parseInt(e.target.value),
                              }))
                            }
                            className="w-full px-3 py-2.5 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                          >
                            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-surface-600 dark:text-surface-400 mb-1.5">
                            Overtime
                          </label>
                          <select
                            value={settingsFormData.overtimeMinutes}
                            onChange={(e) =>
                              setSettingsFormData((prev) => ({
                                ...prev,
                                overtimeMinutes: parseInt(e.target.value),
                              }))
                            }
                            className="w-full px-3 py-2.5 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                          >
                            {[3, 4, 5].map((n) => (
                              <option key={n} value={n}>
                                {n} min
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-surface-600 dark:text-surface-400 mb-1.5">
                          Bonus Mode
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: "college", label: "College", desc: "7th team foul" },
                            { value: "nba", label: "NBA", desc: "5th team foul" },
                          ].map((mode) => (
                            <button
                              key={mode.value}
                              type="button"
                              onClick={() =>
                                setSettingsFormData((prev) => ({
                                  ...prev,
                                  bonusMode: mode.value as "college" | "nba",
                                }))
                              }
                              className={`p-3 rounded-lg text-left transition-all ${
                                settingsFormData.bonusMode === mode.value
                                  ? "bg-primary-500 text-white"
                                  : "bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700"
                              }`}
                            >
                              <p
                                className={`font-medium text-sm ${settingsFormData.bonusMode === mode.value ? "text-white" : "text-surface-900 dark:text-white"}`}
                              >
                                {mode.label}
                              </p>
                              <p
                                className={`text-xs ${settingsFormData.bonusMode === mode.value ? "text-white/70" : "text-surface-500"}`}
                              >
                                {mode.desc}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* League Rules */}
                  <div>
                    <h4 className="section-header mb-4">League Rules</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-surface-600 dark:text-surface-400 mb-1.5">
                          Max Roster Size
                        </label>
                        <select
                          value={settingsFormData.playersPerRoster}
                          onChange={(e) =>
                            setSettingsFormData((prev) => ({
                              ...prev,
                              playersPerRoster: parseInt(e.target.value),
                            }))
                          }
                          className="w-full px-3 py-2.5 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        >
                          {[8, 10, 12, 13, 15, 17, 20].map((n) => (
                            <option key={n} value={n}>
                              {n} players
                            </option>
                          ))}
                        </select>
                      </div>

                      <label className="flex items-center justify-between p-4 rounded-lg bg-surface-50 dark:bg-surface-800 cursor-pointer group">
                        <div>
                          <p className="font-medium text-sm text-surface-900 dark:text-white">
                            Advanced Stats
                          </p>
                          <p className="text-xs text-surface-500">
                            Track +/-, efficiency, net rating
                          </p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={settingsFormData.trackAdvancedStats}
                          onClick={() =>
                            setSettingsFormData((prev) => ({
                              ...prev,
                              trackAdvancedStats: !prev.trackAdvancedStats,
                            }))
                          }
                          className={`relative w-11 h-6 rounded-full transition-colors ${
                            settingsFormData.trackAdvancedStats
                              ? "bg-primary-500"
                              : "bg-surface-300 dark:bg-surface-600"
                          }`}
                        >
                          <span
                            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              settingsFormData.trackAdvancedStats ? "translate-x-5" : ""
                            }`}
                          />
                        </button>
                      </label>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {settingsData && (
              <div className="p-6 border-t border-surface-200 dark:border-surface-800 flex gap-3">
                {isSettingsViewOnly ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettingsModal(false);
                      setSettingsLeagueId(null);
                      setIsSettingsViewOnly(false);
                    }}
                    className="flex-1 btn-primary py-3"
                  >
                    Close
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSettingsModal(false);
                        setSettingsLeagueId(null);
                      }}
                      className="flex-1 btn-secondary py-3"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      form="settings-form"
                      disabled={isSavingSettings}
                      className="flex-1 btn-primary py-3"
                    >
                      {isSavingSettings ? "Saving..." : "Save Changes"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
