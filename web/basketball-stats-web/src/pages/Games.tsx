import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { useAuth } from '../contexts/AuthContext';
import {
  PlusIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  EyeIcon,
  ChartBarIcon,
  CalendarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const Games: React.FC = () => {
  const { token, selectedLeague } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<{ home: string | null; away: string | null }>({
    home: null,
    away: null,
  });
  const [isCreating, setIsCreating] = useState(false);

  const gamesData = useQuery(
    api.games.list,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const teamsData = useQuery(
    api.teams.list,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const createGame = useMutation(api.games.create);
  const startGame = useMutation(api.games.start);
  const pauseGame = useMutation(api.games.pause);
  const resumeGame = useMutation(api.games.resume);
  const endGame = useMutation(api.games.end);

  const games = gamesData?.games || [];
  const teams = teamsData?.teams || [];

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#EF4444';
      case 'paused': return '#F59E0B';
      case 'completed': return '#10B981';
      case 'scheduled': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Live';
      case 'paused': return 'Paused';
      case 'completed': return 'Final';
      case 'scheduled': return 'Scheduled';
      default: return status;
    }
  };

  const handleCreateGame = async () => {
    if (!selectedTeams.home || !selectedTeams.away || selectedTeams.home === selectedTeams.away || !token || !selectedLeague) {
      return;
    }

    setIsCreating(true);
    try {
      await createGame({
        token,
        leagueId: selectedLeague.id,
        homeTeamId: selectedTeams.home as Id<"teams">,
        awayTeamId: selectedTeams.away as Id<"teams">,
      });
      setShowCreateModal(false);
      setSelectedTeams({ home: null, away: null });
    } catch (error) {
      console.error("Failed to create game:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleGameAction = async (gameId: Id<"games">, action: 'start' | 'pause' | 'resume' | 'end') => {
    if (!token) return;

    try {
      switch (action) {
        case 'start':
          await startGame({ token, gameId });
          break;
        case 'pause':
          await pauseGame({ token, gameId });
          break;
        case 'resume':
          await resumeGame({ token, gameId });
          break;
        case 'end':
          await endGame({ token, gameId });
          break;
      }
    } catch (error) {
      console.error(`Failed to ${action} game:`, error);
    }
  };

  const renderGameRow = (game: any) => {
    const isGameLive = game.status === 'active';
    const winner = game.status === 'completed'
      ? game.homeScore > game.awayScore ? 'home' : game.awayScore > game.homeScore ? 'away' : 'tie'
      : null;
    const canStart = game.status === 'scheduled';
    const canPause = game.status === 'active';
    const canResume = game.status === 'paused';
    const canEnd = game.status === 'active' || game.status === 'paused';

    return (
      <tr key={game.id} className="border-b border-gray-700">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center space-x-3">
            <div
              className="px-2 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: getStatusColor(game.status) }}
            >
              {getStatusLabel(game.status)}
            </div>
            {isGameLive && (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            )}
          </div>
        </td>

        <td className="px-6 py-4 whitespace-nowrap">
          <div className="space-y-1">
            <div className={`font-medium ${winner === 'away' ? 'text-green-400' : 'text-gray-200'}`}>
              {game.awayTeam?.name || 'Away Team'}
            </div>
            <div className="text-sm text-gray-500">@ {game.homeTeam?.name || 'Home Team'}</div>
          </div>
        </td>

        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-lg font-bold">
            <span className={winner === 'away' ? 'text-green-400' : 'text-gray-200'}>
              {game.awayScore}
            </span>
            <span className="text-gray-500 mx-2">-</span>
            <span className={winner === 'home' ? 'text-green-400' : 'text-gray-200'}>
              {game.homeScore}
            </span>
          </div>
        </td>

        <td className="px-6 py-4 whitespace-nowrap">
          {isGameLive && (
            <div className="text-sm text-gray-300">
              <div>Q{game.currentQuarter}</div>
              <div className="font-mono">{formatTime(game.timeRemainingSeconds)}</div>
            </div>
          )}
          {game.status === 'completed' && (
            <div className="text-sm text-gray-500">
              <div>Final</div>
            </div>
          )}
          {game.status === 'scheduled' && game.scheduledAt && (
            <div className="text-sm text-gray-500 flex items-center">
              <CalendarIcon className="w-4 h-4 mr-1" />
              {new Date(game.scheduledAt).toLocaleDateString()}
            </div>
          )}
        </td>

        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center space-x-2">
            {canStart && (
              <button
                onClick={() => handleGameAction(game.id, 'start')}
                className="p-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors"
                title="Start Game"
              >
                <PlayIcon className="w-4 h-4" />
              </button>
            )}

            {canPause && (
              <button
                onClick={() => handleGameAction(game.id, 'pause')}
                className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white transition-colors"
                title="Pause Game"
              >
                <PauseIcon className="w-4 h-4" />
              </button>
            )}

            {canResume && (
              <button
                onClick={() => handleGameAction(game.id, 'resume')}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
                title="Resume Game"
              >
                <PlayIcon className="w-4 h-4" />
              </button>
            )}

            {canEnd && (
              <button
                onClick={() => handleGameAction(game.id, 'end')}
                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
                title="End Game"
              >
                <StopIcon className="w-4 h-4" />
              </button>
            )}

            {(isGameLive || game.status === 'paused') && (
              <Link
                to={`/games/${game.id}/live`}
                className="p-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white transition-colors"
                title="Coach View"
              >
                <EyeIcon className="w-4 h-4" />
              </Link>
            )}

            <Link
              to={`/games/${game.id}/analysis`}
              className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
              title="Analysis"
            >
              <ChartBarIcon className="w-4 h-4" />
            </Link>
          </div>
        </td>
      </tr>
    );
  };

  if (gamesData === undefined || teamsData === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Games</h1>
          <p className="text-gray-400">Manage and monitor basketball games</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Game
        </button>
      </div>

      {/* Games Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Matchup
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {games.map(renderGameRow)}
            </tbody>
          </table>
        </div>

        {games.length === 0 && (
          <div className="text-center py-12">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-white">No games</h3>
            <p className="mt-1 text-sm text-gray-400">
              Get started by creating your first game.
            </p>
          </div>
        )}
      </div>

      {/* Create Game Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-lg font-medium text-white mb-4">Create New Game</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Home Team
                </label>
                <select
                  value={selectedTeams.home || ''}
                  onChange={(e) => setSelectedTeams(prev => ({ ...prev, home: e.target.value || null }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select Home Team</option>
                  {teams.map((team: any) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Away Team
                </label>
                <select
                  value={selectedTeams.away || ''}
                  onChange={(e) => setSelectedTeams(prev => ({ ...prev, away: e.target.value || null }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select Away Team</option>
                  {teams.map((team: any) => (
                    <option key={team.id} value={team.id} disabled={team.id === selectedTeams.home}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedTeams({ home: null, away: null });
                }}
                className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGame}
                disabled={!selectedTeams.home || !selectedTeams.away || selectedTeams.home === selectedTeams.away || isCreating}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Creating...' : 'Create Game'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Games;
