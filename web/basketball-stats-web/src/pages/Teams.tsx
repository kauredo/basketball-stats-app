import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import {
  PlusIcon,
  UsersIcon,
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const Teams: React.FC = () => {
  const { token, selectedLeague } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreatePlayerModal, setShowCreatePlayerModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [teamForm, setTeamForm] = useState({ name: "", city: "", description: "" });
  const [playerForm, setPlayerForm] = useState({
    name: "",
    number: "",
    position: "PG" as "PG" | "SG" | "SF" | "PF" | "C",
    heightCm: "",
    weightKg: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  const teamsData = useQuery(
    api.teams.list,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const createTeam = useMutation(api.teams.create);
  const createPlayer = useMutation(api.players.create);

  const teams = teamsData?.teams || [];

  const handleCreateTeam = async () => {
    if (!teamForm.name.trim() || !token || !selectedLeague) return;

    setIsCreating(true);
    try {
      await createTeam({
        token,
        leagueId: selectedLeague.id,
        name: teamForm.name.trim(),
        city: teamForm.city.trim() || undefined,
        description: teamForm.description.trim() || undefined,
      });
      setShowCreateModal(false);
      setTeamForm({ name: "", city: "", description: "" });
    } catch (error) {
      console.error("Failed to create team:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreatePlayer = async () => {
    if (!selectedTeam || !playerForm.name.trim() || !playerForm.number || !token) return;

    setIsCreating(true);
    try {
      await createPlayer({
        token,
        teamId: selectedTeam.id as Id<"teams">,
        name: playerForm.name.trim(),
        number: parseInt(playerForm.number),
        position: playerForm.position,
        heightCm: playerForm.heightCm ? parseInt(playerForm.heightCm) : undefined,
        weightKg: playerForm.weightKg ? parseInt(playerForm.weightKg) : undefined,
      });
      setShowCreatePlayerModal(false);
      setPlayerForm({ name: "", number: "", position: "PG", heightCm: "", weightKg: "" });
      setSelectedTeam(null);
    } catch (error) {
      console.error("Failed to create player:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const renderTeamCard = (team: any) => (
    <div
      key={team.id}
      className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{team.name}</h3>
          {team.city && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{team.city}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <PencilIcon className="w-4 h-4" />
          </button>
          <button className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {team.description && (
        <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-2">
          {team.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <UsersIcon className="w-4 h-4 mr-2" />
          <span>{team.activePlayersCount || 0} Active Players</span>
        </div>

        <button
          onClick={() => {
            setSelectedTeam(team);
            setShowCreatePlayerModal(true);
          }}
          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <UserPlusIcon className="w-4 h-4 mr-1" />
          Add Player
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {team.activePlayersCount || 0}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Players</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-400">{team.wins || 0}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Wins</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-400">{team.losses || 0}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Losses</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (teamsData === undefined) {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Teams</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage basketball teams and their players
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Team
        </button>
      </div>

      {teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map(renderTeamCard)}
        </div>
      ) : (
        <div className="text-center py-12">
          <UsersIcon className="mx-auto h-12 w-12 text-gray-600 dark:text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No teams</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Get started by creating your first team.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Create New Team
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter team name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={teamForm.city}
                  onChange={(e) => setTeamForm((prev) => ({ ...prev, city: e.target.value }))}
                  className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter city"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={teamForm.description}
                  onChange={(e) =>
                    setTeamForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter team description"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setTeamForm({ name: "", city: "", description: "" });
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTeam}
                disabled={!teamForm.name.trim() || isCreating}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? "Creating..." : "Create Team"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Player Modal */}
      {showCreatePlayerModal && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Add Player to {selectedTeam.name}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Player Name *
                </label>
                <input
                  type="text"
                  value={playerForm.name}
                  onChange={(e) => setPlayerForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter player name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Jersey # *
                  </label>
                  <input
                    type="number"
                    value={playerForm.number}
                    onChange={(e) => setPlayerForm((prev) => ({ ...prev, number: e.target.value }))}
                    className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="00"
                    min="0"
                    max="99"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Position *
                  </label>
                  <select
                    value={playerForm.position}
                    onChange={(e) =>
                      setPlayerForm((prev) => ({ ...prev, position: e.target.value as any }))
                    }
                    className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="PG">Point Guard</option>
                    <option value="SG">Shooting Guard</option>
                    <option value="SF">Small Forward</option>
                    <option value="PF">Power Forward</option>
                    <option value="C">Center</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={playerForm.heightCm}
                    onChange={(e) =>
                      setPlayerForm((prev) => ({ ...prev, heightCm: e.target.value }))
                    }
                    className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="183"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={playerForm.weightKg}
                    onChange={(e) =>
                      setPlayerForm((prev) => ({ ...prev, weightKg: e.target.value }))
                    }
                    className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="82"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreatePlayerModal(false);
                  setPlayerForm({
                    name: "",
                    number: "",
                    position: "PG",
                    heightCm: "",
                    weightKg: "",
                  });
                  setSelectedTeam(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlayer}
                disabled={!playerForm.name.trim() || !playerForm.number || isCreating}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? "Adding..." : "Add Player"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;
