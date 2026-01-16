import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import {
  UserIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

const Players: React.FC = () => {
  const { token, selectedLeague } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [selectedPosition, setSelectedPosition] = useState<string>("");

  const playersData = useQuery(
    api.players.list,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const teamsData = useQuery(
    api.teams.list,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const players = playersData?.players || [];
  const teams = teamsData?.teams || [];

  const positions = ["PG", "SG", "SF", "PF", "C"];
  const positionLabels: Record<string, string> = {
    PG: "Point Guard",
    SG: "Shooting Guard",
    SF: "Small Forward",
    PF: "Power Forward",
    C: "Center",
  };

  const filteredPlayers = players.filter((player: any) => {
    const matchesSearch =
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.number.toString().includes(searchTerm);
    const matchesTeam = !selectedTeam || player.team?.id === selectedTeam;
    const matchesPosition = !selectedPosition || player.position === selectedPosition;

    return matchesSearch && matchesTeam && matchesPosition;
  });

  const renderPlayerCard = (player: any) => (
    <div
      key={player.id}
      className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
            <UserIcon className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{player.name}</h3>
            <p className="text-orange-400 font-semibold">#{player.number}</p>
            <p className="text-gray-400 text-sm">{player.team?.name || "Unknown Team"}</p>
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
          <span className="text-gray-200 font-medium">
            {positionLabels[player.position] || player.position}
          </span>
        </div>

        {player.heightCm && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Height</span>
            <span className="text-gray-200 font-medium">{player.heightCm} cm</span>
          </div>
        )}

        {player.weightKg && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Weight</span>
            <span className="text-gray-200 font-medium">{player.weightKg} kg</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-gray-400">Status</span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              player.active ? "bg-green-900 text-green-200" : "bg-red-900 text-red-200"
            }`}
          >
            {player.active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-white">
              {player.seasonAverages?.points?.toFixed(1) || "0.0"}
            </div>
            <div className="text-xs text-gray-400">PPG</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">
              {player.seasonAverages?.rebounds?.toFixed(1) || "0.0"}
            </div>
            <div className="text-xs text-gray-400">RPG</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">
              {player.seasonAverages?.assists?.toFixed(1) || "0.0"}
            </div>
            <div className="text-xs text-gray-400">APG</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (playersData === undefined || teamsData === undefined) {
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

          <div className="relative">
            <FunnelIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
            >
              <option value="">All Teams</option>
              {teams.map((team: any) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Positions</option>
              {positions.map((position) => (
                <option key={position} value={position}>
                  {positionLabels[position]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(searchTerm || selectedTeam || selectedPosition) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {searchTerm && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800">
                Search: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm("")}
                  className="ml-2 inline-flex items-center p-0.5 rounded-full text-orange-600 hover:bg-orange-200"
                >
                  x
                </button>
              </span>
            )}
            {selectedTeam && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                Team: {teams.find((t: any) => t.id === selectedTeam)?.name}
                <button
                  onClick={() => setSelectedTeam("")}
                  className="ml-2 inline-flex items-center p-0.5 rounded-full text-blue-600 hover:bg-blue-200"
                >
                  x
                </button>
              </span>
            )}
            {selectedPosition && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                Position: {positionLabels[selectedPosition]}
                <button
                  onClick={() => setSelectedPosition("")}
                  className="ml-2 inline-flex items-center p-0.5 rounded-full text-green-600 hover:bg-green-200"
                >
                  x
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {filteredPlayers.length > 0 ? (
        <>
          <div className="flex justify-between items-center">
            <p className="text-gray-400">
              {filteredPlayers.length} player{filteredPlayers.length !== 1 ? "s" : ""} found
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
            {players.length === 0 ? "No players found" : "No players match your filters"}
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            {players.length === 0
              ? "Players will appear here once teams are created and players are added."
              : "Try adjusting your search terms or filters."}
          </p>
          {(searchTerm || selectedTeam || selectedPosition) && (
            <div className="mt-6">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedTeam("");
                  setSelectedPosition("");
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
