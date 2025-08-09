import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

import { basketballAPI, Game, Team, BasketballUtils, GAME_STATUSES } from '@basketball-stats/shared';

const Games: React.FC = () => {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<{ home: number | null; away: number | null }>({
    home: null,
    away: null,
  });

  const {
    data: gamesData,
    isLoading: gamesLoading,
  } = useQuery({
    queryKey: ['games'],
    queryFn: () => basketballAPI.getGames(),
  });

  const {
    data: teamsData,
    isLoading: teamsLoading,
  } = useQuery({
    queryKey: ['teams'],
    queryFn: () => basketballAPI.getTeams(),
  });

  const createGameMutation = useMutation({
    mutationFn: ({ homeTeamId, awayTeamId }: { homeTeamId: number; awayTeamId: number }) => {
      const homeTeam = teamsData?.teams.find(t => t.id === homeTeamId);
      const awayTeam = teamsData?.teams.find(t => t.id === awayTeamId);
      
      if (!homeTeam || !awayTeam) {
        throw new Error('Teams not found');
      }
      
      return basketballAPI.createGame({ 
        home_team: { id: homeTeam.id, name: homeTeam.name, city: homeTeam.city },
        away_team: { id: awayTeam.id, name: awayTeam.name, city: awayTeam.city },
        status: 'scheduled'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
      setShowCreateModal(false);
      setSelectedTeams({ home: null, away: null });
    },
  });

  const gameActionMutation = useMutation({
    mutationFn: ({ gameId, action }: { gameId: number; action: 'start' | 'pause' | 'resume' | 'end' }) => {
      switch (action) {
        case 'start':
          return basketballAPI.startGame(gameId);
        case 'pause':
          return basketballAPI.pauseGame(gameId);
        case 'resume':
          return basketballAPI.resumeGame(gameId);
        case 'end':
          return basketballAPI.endGame(gameId);
        default:
          throw new Error('Invalid action');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
  });

  const games = gamesData?.games || [];
  const teams = teamsData?.teams || [];

  const handleCreateGame = () => {
    if (selectedTeams.home && selectedTeams.away && selectedTeams.home !== selectedTeams.away) {
      createGameMutation.mutate({
        homeTeamId: selectedTeams.home,
        awayTeamId: selectedTeams.away,
      });
    }
  };

  const handleGameAction = (gameId: number, action: 'start' | 'pause' | 'resume' | 'end') => {
    gameActionMutation.mutate({ gameId, action });
  };

  const getStatusColor = (status: string) => {
    const gameStatus = GAME_STATUSES[status.toUpperCase() as keyof typeof GAME_STATUSES];
    return gameStatus?.color || '#6B7280';
  };

  const renderGameRow = (game: Game) => {
    const isGameLive = BasketballUtils.isGameLive(game);
    const winner = BasketballUtils.getWinningTeam(game);
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
              {BasketballUtils.getGameStatusDisplayName(game.status)}
            </div>
            {isGameLive && (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            )}
          </div>
        </td>
        
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="space-y-1">
            <div className={`font-medium ${winner === 'away' && game.status === 'completed' ? 'text-green-400' : 'text-gray-200'}`}>
              {game.away_team.name}
            </div>
            <div className="text-sm text-gray-500">@ {game.home_team.name}</div>
          </div>
        </td>
        
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-lg font-bold">
            <span className={winner === 'away' && game.status === 'completed' ? 'text-green-400' : 'text-gray-200'}>
              {game.away_score}
            </span>
            <span className="text-gray-500 mx-2">-</span>
            <span className={winner === 'home' && game.status === 'completed' ? 'text-green-400' : 'text-gray-200'}>
              {game.home_score}
            </span>
          </div>
        </td>
        
        <td className="px-6 py-4 whitespace-nowrap">
          {isGameLive && (
            <div className="text-sm text-gray-300">
              <div>Q{game.current_quarter}</div>
              <div className="font-mono">{game.time_display}</div>
            </div>
          )}
          {game.status === 'completed' && (
            <div className="text-sm text-gray-500">
              <div>Final</div>
              <div>{game.duration_minutes} min</div>
            </div>
          )}
          {game.status === 'scheduled' && (
            <div className="text-sm text-gray-500 flex items-center">
              <CalendarIcon className="w-4 h-4 mr-1" />
              {BasketballUtils.formatGameDate(game.scheduled_at || game.created_at)}
            </div>
          )}
        </td>
        
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center space-x-2">
            {/* Game Control Actions */}
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
            
            {/* View Actions */}
            {isGameLive && (
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

  if (gamesLoading || teamsLoading) {
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
                  onChange={(e) => setSelectedTeams(prev => ({ ...prev, home: e.target.value ? parseInt(e.target.value) : null }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select Home Team</option>
                  {teams.map((team) => (
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
                  onChange={(e) => setSelectedTeams(prev => ({ ...prev, away: e.target.value ? parseInt(e.target.value) : null }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select Away Team</option>
                  {teams.map((team) => (
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
                disabled={!selectedTeams.home || !selectedTeams.away || selectedTeams.home === selectedTeams.away || createGameMutation.isPending}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createGameMutation.isPending ? 'Creating...' : 'Create Game'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Games;