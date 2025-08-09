import React, { useEffect, useState } from 'react';
import { League, basketballAPI } from '@basketball-stats/shared';
import { useAuthStore } from '../hooks/useAuthStore';
import {
  PlusIcon,
  UsersIcon,
  TrophyIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

export default function LeagueSelectionPage() {
  const { 
    userLeagues, 
    selectedLeague, 
    selectLeague, 
    joinLeagueByCode, 
    loadUserLeagues, 
    isLoading, 
    user, 
    logout,
    joinLeague
  } = useAuthStore();
  const [availableLeagues, setAvailableLeagues] = useState<League[]>([]);
  const [inviteCode, setInviteCode] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAvailableLeagues();
  }, []);

  const loadAvailableLeagues = async () => {
    try {
      const response = await basketballAPI.getLeagues();
      const publicLeagues = response.leagues.filter(league => 
        league.is_public && !userLeagues.some((ul: League) => ul.id === league.id)
      );
      setAvailableLeagues(publicLeagues);
    } catch (error) {
      console.error('Failed to load available leagues:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadUserLeagues();
      await loadAvailableLeagues();
    } finally {
      setRefreshing(false);
    }
  };

  const handleJoinLeague = async (leagueId: number) => {
    try {
      await joinLeague(leagueId);
      await loadAvailableLeagues();
    } catch (error) {
      console.error('Failed to join league:', error);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    try {
      await joinLeagueByCode(inviteCode.trim());
      setInviteCode('');
      setShowJoinForm(false);
      await loadAvailableLeagues();
    } catch (error) {
      console.error('Failed to join league by code:', error);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🏀</span>
              <div>
                <h1 className="text-2xl font-bold text-white">Basketball Stats</h1>
                <p className="text-gray-400">Select a league to continue</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.full_name}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-white text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* My Leagues */}
          {userLeagues.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-white">My Leagues</h2>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="text-orange-500 hover:text-orange-400 text-sm disabled:opacity-50"
                >
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {userLeagues.map((league: League) => {
                  const isSelected = selectedLeague?.id === league.id;
                  return (
                    <div
                      key={league.id}
                      className={`relative rounded-lg border p-6 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-orange-500 bg-orange-900/20 ring-2 ring-orange-500'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      }`}
                      onClick={() => selectLeague(league)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-white">{league.name}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {league.league_type}
                        </span>
                      </div>
                      
                      {league.description && (
                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                          {league.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <div className="flex items-center">
                          <TrophyIcon className="h-4 w-4 mr-1" />
                          <span>{league.teams_count || 0} teams</span>
                        </div>
                        <div className="flex items-center">
                          <UsersIcon className="h-4 w-4 mr-1" />
                          <span>{league.members_count || 0} members</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          Season: {league.season}
                        </div>
                      </div>
                      
                      {league.membership && (
                        <div className="mt-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {league.membership.display_role}
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
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-white">Join a League</h2>
                <button
                  onClick={() => setShowJoinForm(!showJoinForm)}
                  className="inline-flex items-center px-3 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  {showJoinForm ? 'Cancel' : 'Join by Code'}
                </button>
              </div>
              
              {showJoinForm && (
                <form onSubmit={handleJoinByCode} className="flex gap-4">
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter invite code (e.g., league-name-123)"
                    className="flex-1 px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !inviteCode.trim()}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Joining...' : 'Join'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Public Leagues */}
          {availableLeagues.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-medium text-white mb-4">Public Leagues</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {availableLeagues.map((league: League) => (
                  <div key={league.id} className="border border-gray-700 bg-gray-800 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-white">{league.name}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Public
                      </span>
                    </div>
                    
                    {league.description && (
                      <p className="text-gray-400 text-sm mb-4">
                        {league.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                      <div className="flex items-center">
                        <TrophyIcon className="h-4 w-4 mr-1" />
                        <span>{league.teams_count || 0} teams</span>
                      </div>
                      <div className="flex items-center">
                        <UsersIcon className="h-4 w-4 mr-1" />
                        <span>{league.members_count || 0} members</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleJoinLeague(league.id)}
                      disabled={isLoading}
                      className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Join League
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {userLeagues.length === 0 && availableLeagues.length === 0 && (
            <div className="text-center py-12">
              <TrophyIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-white">No leagues available</h3>
              <p className="mt-1 text-sm text-gray-400">
                Ask a league administrator for an invite code to join a league.
              </p>
            </div>
          )}

          {/* Continue Button */}
          {selectedLeague && (
            <div className="fixed bottom-6 right-6">
              <button
                onClick={() => {/* Navigation will be handled by auth state */}}
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