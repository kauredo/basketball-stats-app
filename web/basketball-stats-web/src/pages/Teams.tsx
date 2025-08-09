import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlusIcon,
  UsersIcon,
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

import { basketballAPI, Team } from '@basketball-stats/shared';

const Teams: React.FC = () => {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreatePlayerModal, setShowCreatePlayerModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamForm, setTeamForm] = useState({ name: '', city: '', description: '' });
  const [playerForm, setPlayerForm] = useState({
    name: '',
    jersey_number: '',
    position: 'Guard',
    height: '',
    weight: '',
  });

  const {
    data: teamsData,
    isLoading,
  } = useQuery({
    queryKey: ['teams'],
    queryFn: () => basketballAPI.getTeams(),
  });

  const createTeamMutation = useMutation({
    mutationFn: (teamData: { name: string; city?: string; description?: string }) =>
      basketballAPI.createTeam(teamData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setShowCreateModal(false);
      setTeamForm({ name: '', city: '', description: '' });
    },
  });

  const createPlayerMutation = useMutation({
    mutationFn: (playerData: {
      team_id: number;
      name: string;
      jersey_number: number;
      position: string;
      height?: number;
      weight?: number;
    }) => basketballAPI.createPlayer(playerData.team_id, {
      name: playerData.name,
      number: playerData.jersey_number,
      position: playerData.position as any,
      height_cm: playerData.height,
      weight_kg: playerData.weight,
      active: true
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setShowCreatePlayerModal(false);
      setPlayerForm({ name: '', jersey_number: '', position: 'Guard', height: '', weight: '' });
      setSelectedTeam(null);
    },
  });

  const teams = teamsData?.teams || [];

  const handleCreateTeam = () => {
    if (teamForm.name.trim()) {
      createTeamMutation.mutate({
        name: teamForm.name.trim(),
        city: teamForm.city.trim() || undefined,
        description: teamForm.description.trim() || undefined,
      });
    }
  };

  const handleCreatePlayer = () => {
    if (selectedTeam && playerForm.name.trim() && playerForm.jersey_number) {
      createPlayerMutation.mutate({
        team_id: selectedTeam.id,
        name: playerForm.name.trim(),
        jersey_number: parseInt(playerForm.jersey_number),
        position: playerForm.position,
        height: playerForm.height ? parseInt(playerForm.height) : undefined,
        weight: playerForm.weight ? parseInt(playerForm.weight) : undefined,
      });
    }
  };

  const renderTeamCard = (team: Team) => (
    <div key={team.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">{team.name}</h3>
          {team.city && (
            <p className="text-gray-400 text-sm mt-1">{team.city}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
            <PencilIcon className="w-4 h-4" />
          </button>
          <button className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {team.description && (
        <p className="text-gray-300 text-sm mb-4 line-clamp-2">
          {team.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center text-sm text-gray-400">
          <UsersIcon className="w-4 h-4 mr-2" />
          <span>{team.active_players_count || 0} Active Players</span>
        </div>
        
        <button
          onClick={() => {
            setSelectedTeam(team);
            setShowCreatePlayerModal(true);
          }}
          className="inline-flex items-center px-3 py-2 border border-gray-600 text-xs font-medium rounded text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        >
          <UserPlusIcon className="w-4 h-4 mr-1" />
          Add Player
        </button>
      </div>

      {/* Team Statistics */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-white">
              {team.active_players_count || 0}
            </div>
            <div className="text-xs text-gray-400">Players</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-400">
              0
            </div>
            <div className="text-xs text-gray-400">Wins</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-400">
              0
            </div>
            <div className="text-xs text-gray-400">Games</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
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
          <h1 className="text-3xl font-bold text-white">Teams</h1>
          <p className="text-gray-400">Manage basketball teams and their players</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Team
        </button>
      </div>

      {/* Teams Grid */}
      {teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map(renderTeamCard)}
        </div>
      ) : (
        <div className="text-center py-12">
          <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-white">No teams</h3>
          <p className="mt-1 text-sm text-gray-400">
            Get started by creating your first team.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Team
            </button>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-lg font-medium text-white mb-4">Create New Team</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter team name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={teamForm.city}
                  onChange={(e) => setTeamForm(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter city"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={teamForm.description}
                  onChange={(e) => setTeamForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter team description"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setTeamForm({ name: '', city: '', description: '' });
                }}
                className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTeam}
                disabled={!teamForm.name.trim() || createTeamMutation.isPending}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Player Modal */}
      {showCreatePlayerModal && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-lg font-medium text-white mb-4">
              Add Player to {selectedTeam.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Player Name *
                </label>
                <input
                  type="text"
                  value={playerForm.name}
                  onChange={(e) => setPlayerForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter player name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Jersey # *
                  </label>
                  <input
                    type="number"
                    value={playerForm.jersey_number}
                    onChange={(e) => setPlayerForm(prev => ({ ...prev, jersey_number: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="00"
                    min="0"
                    max="99"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Position *
                  </label>
                  <select
                    value={playerForm.position}
                    onChange={(e) => setPlayerForm(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Point Guard">Point Guard</option>
                    <option value="Shooting Guard">Shooting Guard</option>
                    <option value="Small Forward">Small Forward</option>
                    <option value="Power Forward">Power Forward</option>
                    <option value="Center">Center</option>
                    <option value="Guard">Guard</option>
                    <option value="Forward">Forward</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Height (inches)
                  </label>
                  <input
                    type="number"
                    value={playerForm.height}
                    onChange={(e) => setPlayerForm(prev => ({ ...prev, height: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="72"
                    min="60"
                    max="90"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Weight (lbs)
                  </label>
                  <input
                    type="number"
                    value={playerForm.weight}
                    onChange={(e) => setPlayerForm(prev => ({ ...prev, weight: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="180"
                    min="120"
                    max="400"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreatePlayerModal(false);
                  setPlayerForm({ name: '', jersey_number: '', position: 'Guard', height: '', weight: '' });
                  setSelectedTeam(null);
                }}
                className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlayer}
                disabled={!playerForm.name.trim() || !playerForm.jersey_number || createPlayerMutation.isPending}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createPlayerMutation.isPending ? 'Adding...' : 'Add Player'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;