import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";
import { PlusIcon, UsersIcon, TrophyIcon, CalendarIcon } from "@heroicons/react/24/outline";

export default function LeagueSelectionPage() {
  const { token, selectedLeague, selectLeague, user, logout } = useAuth();
  const [inviteCode, setInviteCode] = useState("");
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const leaguesData = useQuery(api.leagues.list, token ? { token } : "skip");
  const joinLeagueMutation = useMutation(api.leagues.join);
  const joinByCodeMutation = useMutation(api.leagues.joinByCode);

  const userLeagues = leaguesData?.leagues || [];

  const handleJoinLeague = async (leagueId: Id<"leagues">) => {
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Icon name="basketball" size={32} className="mr-3 text-orange-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Basketball Stats
                </h1>
                <p className="text-gray-600 dark:text-gray-400">Select a league to continue</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm"
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
            <div className="mb-4 bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* My Leagues */}
          {userLeagues.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">My Leagues</h2>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {userLeagues.map((league: any) => {
                  const isSelected = selectedLeague?.id === league.id;
                  return (
                    <div
                      key={league.id}
                      className={`relative rounded-lg border p-6 cursor-pointer transition-all ${
                        isSelected
                          ? "border-orange-500 bg-orange-100 dark:bg-orange-900/20 ring-2 ring-orange-500"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                      onClick={() => handleSelectLeague(league)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {league.name}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {league.leagueType}
                        </span>
                      </div>

                      {league.description && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                          {league.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <TrophyIcon className="h-4 w-4 mr-1" />
                          <span>{league.teamsCount || 0} teams</span>
                        </div>
                        <div className="flex items-center">
                          <UsersIcon className="h-4 w-4 mr-1" />
                          <span>{league.membersCount || 0} members</span>
                        </div>
                      </div>

                      <div className="mt-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          Season: {league.season}
                        </div>
                      </div>

                      {league.role && (
                        <div className="mt-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {league.role}
                          </span>
                        </div>
                      )}

                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Join League Section */}
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4 w-full">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Join a League</h2>
                <button
                  onClick={() => setShowJoinForm(!showJoinForm)}
                  className="inline-flex items-center px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  {showJoinForm ? "Cancel" : "Join by Code"}
                </button>
              </div>

              {showJoinForm && (
                <form onSubmit={handleJoinByCode} className="flex gap-4">
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter invite code (e.g., league-name-123)"
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                  <button
                    type="submit"
                    disabled={isJoining || !inviteCode.trim()}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <TrophyIcon className="mx-auto h-12 w-12 text-gray-600 dark:text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No leagues available
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Ask a league administrator for an invite code to join a league.
              </p>
            </div>
          )}

          {/* Continue Button */}
          {selectedLeague && (
            <div className="fixed bottom-6 right-6">
              <button
                onClick={() => {
                  /* Navigation will be handled by auth state */
                }}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                Continue to {selectedLeague.name}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
