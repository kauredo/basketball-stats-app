import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  UserIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

import { basketballAPI, Player, Team } from '@basketball-stats/shared';

const Players: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedPosition, setSelectedPosition] = useState<string>('');

  const {
    data: playersData,
    isLoading: playersLoading,
  } = useQuery({
    queryKey: ['players'],
    queryFn: () => basketballAPI.getAllPlayers(),
  });

  const {
    data: teamsData,
    isLoading: teamsLoading,
  } = useQuery({
    queryKey: ['teams'],
    queryFn: () => basketballAPI.getTeams(),
  });

  const players = playersData?.players || [];
  const teams = teamsData?.teams || [];

  const positions = [
    'Point Guard',
    'Shooting Guard',
    'Small Forward',
    'Power Forward',
    'Center',
    'Guard',
    'Forward',
  ];

  // Filter players based on search and filters
  const filteredPlayers = players.filter((player) => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.number.toString().includes(searchTerm);
    const matchesTeam = !selectedTeam || player.team?.id.toString() === selectedTeam;
    const matchesPosition = !selectedPosition || player.position === selectedPosition;
    
    return matchesSearch && matchesTeam && matchesPosition;
  });

  const getTeamName = (teamId: number) => {
    const team = teams.find(t => t.id === teamId);
    return team?.name || 'Unknown Team';
  };

  const renderPlayerCard = (player: Player) => (
    <div key={player.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
            <UserIcon className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{player.name}</h3>
            <p className="text-orange-400 font-semibold">#{player.number}</p>
            <p className="text-gray-400 text-sm">{player.team?.name || 'Unknown Team'}</p>
          </div>
        </div>
        
        <button
          className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
          title="View Stats"
        >
          <ChartBarIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Position</span>
          <span className="text-gray-200 font-medium">{player.position}</span>
        </div>
        
        {player.height_cm && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Height</span>
            <span className="text-gray-200 font-medium">
              {Math.floor(player.height_cm / 30.48)}'
              {Math.round(((player.height_cm / 30.48) % 1) * 12)}"
            </span>
          </div>
        )}
        
        {player.weight_kg && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Weight</span>
            <span className="text-gray-200 font-medium">{Math.round(player.weight_kg * 2.205)} lbs</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-gray-400">Status</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            player.active 
              ? 'bg-green-900 text-green-200' 
              : 'bg-red-900 text-red-200'
          }`}>
            {player.active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Player Statistics Preview */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-white">
              {player.season_averages?.points?.toFixed(1) || '0.0'}
            </div>
            <div className="text-xs text-gray-400">PPG</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">
              {player.season_averages?.rebounds?.toFixed(1) || '0.0'}
            </div>
            <div className="text-xs text-gray-400">RPG</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">
              {player.season_averages?.assists?.toFixed(1) || '0.0'}
            </div>
            <div className="text-xs text-gray-400">APG</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (playersLoading || teamsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Players</h1>
        <p className="text-gray-400">Browse and manage basketball players</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Team Filter */}
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
            >
              <option value="">All Teams</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id.toString()}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Position Filter */}
          <div>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Positions</option>
              {positions.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchTerm || selectedTeam || selectedPosition) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {searchTerm && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800">
                Search: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-2 inline-flex items-center p-0.5 rounded-full text-orange-600 hover:bg-orange-200"
                >
                  ×
                </button>
              </span>
            )}
            {selectedTeam && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                Team: {getTeamName(parseInt(selectedTeam))}
                <button
                  onClick={() => setSelectedTeam('')}
                  className="ml-2 inline-flex items-center p-0.5 rounded-full text-blue-600 hover:bg-blue-200"
                >
                  ×
                </button>
              </span>
            )}
            {selectedPosition && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                Position: {selectedPosition}
                <button
                  onClick={() => setSelectedPosition('')}
                  className="ml-2 inline-flex items-center p-0.5 rounded-full text-green-600 hover:bg-green-200"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Players Grid */}
      {filteredPlayers.length > 0 ? (
        <>
          <div className="flex justify-between items-center">
            <p className="text-gray-400">
              {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlayers.map(renderPlayerCard)}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-white">
            {players.length === 0 ? 'No players found' : 'No players match your filters'}
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            {players.length === 0 
              ? 'Players will appear here once teams are created and players are added.'
              : 'Try adjusting your search terms or filters.'
            }
          </p>
          {(searchTerm || selectedTeam || selectedPosition) && (
            <div className="mt-6">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedTeam('');
                  setSelectedPosition('');
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Players;