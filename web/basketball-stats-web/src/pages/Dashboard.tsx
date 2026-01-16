import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useAuth } from '../contexts/AuthContext';
import {
  PlayIcon,
  ClockIcon,
  TrophyIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const { token, selectedLeague } = useAuth();

  const gamesData = useQuery(
    api.games.list,
    token && selectedLeague
      ? { token, leagueId: selectedLeague.id }
      : "skip"
  );

  const games = gamesData?.games || [];
  const liveGames = games.filter(game => game.status === 'active' || game.status === 'paused');
  const recentGames = games.filter(game => game.status === 'completed').slice(0, 5);
  const upcomingGames = games.filter(game => game.status === 'scheduled').slice(0, 5);

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

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderGameCard = (game: any, showActions = false) => {
    const isGameLive = game.status === 'active';
    const winner = game.status === 'completed'
      ? game.homeScore > game.awayScore ? 'home' : game.awayScore > game.homeScore ? 'away' : 'tie'
      : null;

    return (
      <div key={game.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
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

          {(game.status === 'active' || game.status === 'paused') && (
            <div className="text-right text-sm text-gray-300">
              <div>Q{game.currentQuarter}</div>
              <div className="font-mono">{formatTime(game.timeRemainingSeconds)}</div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className={`font-medium ${winner === 'away' ? 'text-green-400' : 'text-gray-200'}`}>
              {game.awayTeam?.name || 'Away Team'}
            </span>
            <span className={`font-bold text-lg ${winner === 'away' ? 'text-green-400' : 'text-gray-200'}`}>
              {game.awayScore}
            </span>
          </div>
          <div className="text-center text-gray-500 text-sm">@</div>
          <div className="flex justify-between items-center">
            <span className={`font-medium ${winner === 'home' ? 'text-green-400' : 'text-gray-200'}`}>
              {game.homeTeam?.name || 'Home Team'}
            </span>
            <span className={`font-bold text-lg ${winner === 'home' ? 'text-green-400' : 'text-gray-200'}`}>
              {game.homeScore}
            </span>
          </div>
        </div>

        {game.status === 'completed' && (
          <div className="mt-3 pt-3 border-t border-gray-700 text-sm text-gray-400">
            <div className="flex justify-between">
              <span>Final Score</span>
              {winner !== 'tie' && (
                <span>Margin: {Math.abs(game.homeScore - game.awayScore)}</span>
              )}
            </div>
          </div>
        )}

        {game.status === 'scheduled' && game.scheduledAt && (
          <div className="mt-3 pt-3 border-t border-gray-700 text-sm text-gray-400">
            <div className="flex items-center">
              <ClockIcon className="w-4 h-4 mr-1" />
              {new Date(game.scheduledAt).toLocaleDateString()}
            </div>
          </div>
        )}

        {showActions && (game.status === 'active' || game.status === 'paused') && (
          <div className="mt-4 flex space-x-2">
            <Link
              to={`/games/${game.id}/live`}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded text-sm font-medium text-center transition-colors"
            >
              Coach View
            </Link>
            <Link
              to={`/games/${game.id}/analysis`}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium text-center transition-colors"
            >
              Analysis
            </Link>
          </div>
        )}
      </div>
    );
  };

  if (gamesData === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Basketball Stats Dashboard</h1>
        <p className="text-gray-400">Monitor live games and track team performance</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-red-600 rounded-lg">
              <PlayIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-white">{liveGames.length}</div>
              <div className="text-gray-400">Live Games</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-green-600 rounded-lg">
              <TrophyIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-white">{recentGames.length}</div>
              <div className="text-gray-400">Completed</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-600 rounded-lg">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-white">{upcomingGames.length}</div>
              <div className="text-gray-400">Upcoming</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-purple-600 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-white">{games.length}</div>
              <div className="text-gray-400">Total Games</div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Games */}
      {liveGames.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
              Live Games
            </h2>
            <Link
              to="/games"
              className="text-orange-500 hover:text-orange-400 font-medium"
            >
              View All Games
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveGames.map(game => renderGameCard(game, true))}
          </div>
        </div>
      )}

      {/* Recent Games */}
      {recentGames.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Recent Games</h2>
            <Link
              to="/games"
              className="text-orange-500 hover:text-orange-400 font-medium"
            >
              View All Games
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentGames.map(game => renderGameCard(game))}
          </div>
        </div>
      )}

      {/* Upcoming Games */}
      {upcomingGames.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Upcoming Games</h2>
            <Link
              to="/games"
              className="text-orange-500 hover:text-orange-400 font-medium"
            >
              View All Games
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingGames.map(game => renderGameCard(game))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {games.length === 0 && (
        <div className="text-center py-12">
          <TrophyIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-white">No games</h3>
          <p className="mt-1 text-sm text-gray-400">
            Get started by creating your first game.
          </p>
          <div className="mt-6">
            <Link
              to="/games"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Create Game
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
