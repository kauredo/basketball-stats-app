import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { getErrorMessage } from "../utils/error";
import MembersList from "../components/league/MembersList";
import InviteCodeSection from "../components/league/InviteCodeSection";
import {
  Cog6ToothIcon,
  UsersIcon,
  LinkIcon,
  ArrowLeftIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

type Tab = "general" | "members" | "invite";

export default function LeagueSettings() {
  const navigate = useNavigate();
  const { token, selectedLeague } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [isSaving, setIsSaving] = useState(false);

  // Form state for general settings
  const [quarterMinutes, setQuarterMinutes] = useState(12);
  const [foulLimit, setFoulLimit] = useState(6);
  const [timeoutsPerTeam, setTimeoutsPerTeam] = useState(5);
  const [overtimeMinutes, setOvertimeMinutes] = useState(5);
  const [bonusMode, setBonusMode] = useState<"college" | "nba">("college");
  const [playersPerRoster, setPlayersPerRoster] = useState(12);
  const [trackAdvancedStats, setTrackAdvancedStats] = useState(true);

  const canManage =
    selectedLeague?.role === "admin" ||
    selectedLeague?.role === "owner" ||
    (selectedLeague as any)?.membership?.role === "admin" ||
    (selectedLeague as any)?.membership?.role === "owner";

  const settingsData = useQuery(
    api.leagues.getSettings,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const updateSettings = useMutation(api.leagues.updateSettings);

  // Initialize form when settings load
  useEffect(() => {
    if (settingsData?.settings) {
      setQuarterMinutes(settingsData.settings.quarterMinutes ?? 12);
      setFoulLimit(settingsData.settings.foulLimit ?? 6);
      setTimeoutsPerTeam(settingsData.settings.timeoutsPerTeam ?? 5);
      setOvertimeMinutes(settingsData.settings.overtimeMinutes ?? 5);
      setBonusMode(settingsData.settings.bonusMode ?? "college");
      setPlayersPerRoster(settingsData.settings.playersPerRoster ?? 12);
      setTrackAdvancedStats(settingsData.settings.trackAdvancedStats ?? true);
    }
  }, [settingsData]);

  const handleSaveSettings = async () => {
    if (!token || !selectedLeague) return;

    setIsSaving(true);
    try {
      await updateSettings({
        token,
        leagueId: selectedLeague.id,
        quarterMinutes,
        foulLimit,
        timeoutsPerTeam,
        overtimeMinutes,
        bonusMode,
        playersPerRoster,
        trackAdvancedStats,
      });
      toast.success("Settings saved successfully");
    } catch (error) {
      const message = getErrorMessage(error, "Failed to save settings");
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "general" as Tab, name: "General", icon: Cog6ToothIcon },
    { id: "members" as Tab, name: "Members", icon: UsersIcon },
    { id: "invite" as Tab, name: "Invite", icon: LinkIcon },
  ];

  if (!selectedLeague) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Cog6ToothIcon className="w-12 h-12 text-surface-400 mb-4" />
        <p className="text-surface-600 dark:text-surface-400">
          Please select a league to view settings.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back</span>
        </button>
        <h1 className="text-display-sm text-surface-900 dark:text-white mb-2">League Settings</h1>
        <p className="text-surface-600 dark:text-surface-400">
          {selectedLeague.name} · {selectedLeague.leagueType} · {selectedLeague.season}
        </p>
      </div>

      {/* Read-only notice */}
      {!canManage && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700 flex items-start gap-3">
          <InformationCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            You&apos;re viewing league settings in read-only mode. Contact a league admin to make
            changes.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface-100 dark:bg-surface-800 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors ${
              activeTab === tab.id
                ? "bg-primary-500 text-white shadow-soft"
                : "text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-200 dark:hover:bg-surface-700"
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* General Settings Tab */}
      {activeTab === "general" && (
        <div className="space-y-6">
          {/* Game Rules */}
          <div className="surface-card p-6">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
              Game Rules
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quarter Length */}
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Quarter Length
                </label>
                {canManage ? (
                  <select
                    value={quarterMinutes}
                    onChange={(e) => setQuarterMinutes(Number(e.target.value))}
                    className="w-full bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl px-4 py-3 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={5}>5 minutes</option>
                    <option value={6}>6 minutes</option>
                    <option value={8}>8 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={12}>12 minutes</option>
                  </select>
                ) : (
                  <div className="bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl px-4 py-3 text-surface-900 dark:text-white">
                    {quarterMinutes} minutes
                  </div>
                )}
              </div>

              {/* Foul Limit */}
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Foul Limit
                </label>
                {canManage ? (
                  <select
                    value={foulLimit}
                    onChange={(e) => setFoulLimit(Number(e.target.value))}
                    className="w-full bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl px-4 py-3 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={5}>5 fouls</option>
                    <option value={6}>6 fouls</option>
                  </select>
                ) : (
                  <div className="bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl px-4 py-3 text-surface-900 dark:text-white">
                    {foulLimit} fouls
                  </div>
                )}
              </div>

              {/* Timeouts per Team */}
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Timeouts per Team
                </label>
                {canManage ? (
                  <select
                    value={timeoutsPerTeam}
                    onChange={(e) => setTimeoutsPerTeam(Number(e.target.value))}
                    className="w-full bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl px-4 py-3 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl px-4 py-3 text-surface-900 dark:text-white">
                    {timeoutsPerTeam}
                  </div>
                )}
              </div>

              {/* Overtime Length */}
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Overtime Length
                </label>
                {canManage ? (
                  <select
                    value={overtimeMinutes}
                    onChange={(e) => setOvertimeMinutes(Number(e.target.value))}
                    className="w-full bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl px-4 py-3 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={3}>3 minutes</option>
                    <option value={4}>4 minutes</option>
                    <option value={5}>5 minutes</option>
                  </select>
                ) : (
                  <div className="bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl px-4 py-3 text-surface-900 dark:text-white">
                    {overtimeMinutes} minutes
                  </div>
                )}
              </div>

              {/* Bonus Mode */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Bonus Mode
                </label>
                {canManage ? (
                  <select
                    value={bonusMode}
                    onChange={(e) => setBonusMode(e.target.value as "college" | "nba")}
                    className="w-full bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl px-4 py-3 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="college">College (7th foul)</option>
                    <option value="nba">NBA (5th foul)</option>
                  </select>
                ) : (
                  <div className="bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl px-4 py-3 text-surface-900 dark:text-white">
                    {bonusMode === "college" ? "College (7th foul)" : "NBA (5th foul)"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* League Rules */}
          <div className="surface-card p-6">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
              League Rules
            </h3>
            <div className="space-y-4">
              {/* Players per Roster */}
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Players per Roster
                </label>
                {canManage ? (
                  <select
                    value={playersPerRoster}
                    onChange={(e) => setPlayersPerRoster(Number(e.target.value))}
                    className="w-full bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl px-4 py-3 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {[8, 10, 12, 13, 15, 17, 20].map((n) => (
                      <option key={n} value={n}>
                        {n} players
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl px-4 py-3 text-surface-900 dark:text-white">
                    {playersPerRoster} players
                  </div>
                )}
              </div>

              {/* Track Advanced Stats */}
              <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
                <div>
                  <div className="font-medium text-surface-900 dark:text-white">
                    Track Advanced Stats
                  </div>
                  <div className="text-sm text-surface-500 dark:text-surface-400">
                    Plus/minus, efficiency rating, net rating
                  </div>
                </div>
                {canManage ? (
                  <button
                    type="button"
                    onClick={() => setTrackAdvancedStats(!trackAdvancedStats)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                      trackAdvancedStats ? "bg-primary-500" : "bg-surface-300 dark:bg-surface-600"
                    }`}
                    role="switch"
                    aria-checked={trackAdvancedStats}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        trackAdvancedStats ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                ) : (
                  <div
                    className={`w-4 h-4 rounded-full ${
                      trackAdvancedStats ? "bg-green-500" : "bg-surface-300 dark:bg-surface-600"
                    }`}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Save Button */}
          {canManage && (
            <div className="flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="btn-primary px-6 py-3 rounded-xl"
              >
                {isSaving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === "members" && (
        <div className="surface-card p-6">
          <MembersList canManage={canManage} />
        </div>
      )}

      {/* Invite Tab */}
      {activeTab === "invite" && (
        <div className="surface-card p-6">
          <InviteCodeSection />
        </div>
      )}
    </div>
  );
}
