import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { getErrorMessage } from "../utils/error";
import type { Position } from "@basketball-stats/shared";
import {
  UserIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  PlayerFormModal,
  DeleteConfirmationModal,
  type PlayerFormData,
} from "../components/modals";

// Local interface for player items returned from the API
interface PlayerItem {
  id: Id<"players">;
  name: string;
  number: number;
  position?: Position;
  heightCm?: number;
  weightKg?: number;
  active?: boolean;
  imageUrl?: string;
  team?: {
    id: Id<"teams">;
    name: string;
  };
  seasonAverages?: {
    points?: number;
    rebounds?: number;
    assists?: number;
  };
}

// Local interface for team items used in filters
interface TeamItem {
  id: Id<"teams">;
  name: string;
}

const Players: React.FC = () => {
  const { token, selectedLeague } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerItem | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const playersData = useQuery(
    api.players.list,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const teamsData = useQuery(
    api.teams.list,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const updatePlayer = useMutation(api.players.update);
  const removePlayer = useMutation(api.players.remove);
  const setPlayerImage = useMutation(api.players.setPlayerImage);
  const removePlayerImage = useMutation(api.players.removePlayerImage);

  const players = (playersData?.players || []) as PlayerItem[];
  const teams = (teamsData?.teams || []) as TeamItem[];

  const handleViewStats = (player: PlayerItem) => {
    navigate(`/app/shot-charts?player=${player.id}`);
  };

  const handleViewPlayer = (player: PlayerItem) => {
    navigate(`/app/players/${player.id}`);
  };

  const handleEditPlayer = (player: PlayerItem) => {
    setSelectedPlayer(player);
    setShowEditModal(true);
  };

  const handleUpdatePlayer = async (
    data: PlayerFormData,
    imageStorageId?: Id<"_storage"> | null,
    clearImage?: boolean
  ) => {
    if (!selectedPlayer || !token) return;

    setIsUpdating(true);
    try {
      // Update player info
      await updatePlayer({
        token,
        playerId: selectedPlayer.id as Id<"players">,
        name: data.name.trim(),
        number: parseInt(data.number),
        position: data.position,
        heightCm: data.heightCm ? parseInt(data.heightCm) : undefined,
        weightKg: data.weightKg ? parseInt(data.weightKg) : undefined,
        active: data.active,
      });

      // Handle image changes
      if (imageStorageId) {
        await setPlayerImage({
          token,
          playerId: selectedPlayer.id as Id<"players">,
          storageId: imageStorageId,
        });
      } else if (clearImage && selectedPlayer.imageUrl) {
        await removePlayerImage({
          token,
          playerId: selectedPlayer.id as Id<"players">,
        });
      }

      toast.success(`Player "${data.name.trim()}" updated successfully`);
      setShowEditModal(false);
      setSelectedPlayer(null);
    } catch (error) {
      console.error("Failed to update player:", error);
      const message = getErrorMessage(error, "Failed to update player. Please try again.");
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePlayer = async () => {
    if (!selectedPlayer || !token) return;

    const playerName = selectedPlayer.name;
    setIsDeleting(true);
    try {
      await removePlayer({
        token,
        playerId: selectedPlayer.id as Id<"players">,
      });
      toast.success(`Player "${playerName}" deleted successfully`);
      setShowDeleteModal(false);
      setSelectedPlayer(null);
    } catch (error) {
      console.error("Failed to delete player:", error);
      const message = getErrorMessage(error, "Failed to delete player. Please try again.");
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const positions = ["PG", "SG", "SF", "PF", "C"];
  const positionLabels: Record<string, string> = {
    PG: "Point Guard",
    SG: "Shooting Guard",
    SF: "Small Forward",
    PF: "Power Forward",
    C: "Center",
  };

  const filteredPlayers = players.filter((player: PlayerItem) => {
    const matchesSearch =
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.number.toString().includes(searchTerm);
    const matchesTeam = !selectedTeam || player.team?.id === selectedTeam;
    const matchesPosition = !selectedPosition || player.position === selectedPosition;

    return matchesSearch && matchesTeam && matchesPosition;
  });

  const renderPlayerCard = (player: PlayerItem) => (
    <div
      key={player.id}
      className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600 transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-surface-100 dark:bg-surface-700 rounded-full flex items-center justify-center overflow-hidden">
            {player.imageUrl ? (
              <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-8 h-8 text-surface-600 dark:text-surface-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-surface-900 dark:text-white">{player.name}</h3>
            <p className="text-primary-500 dark:text-primary-400 font-medium">#{player.number}</p>
            <p className="text-surface-600 dark:text-surface-400 text-sm">
              {player.team?.name || "Unknown Team"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleViewPlayer(player)}
            className="btn-primary p-2 rounded-xl"
            title="View Profile"
          >
            <EyeIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleViewStats(player)}
            className="btn-secondary p-2 rounded-xl"
            title="Shot Chart"
          >
            <ChartBarIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleEditPlayer(player)}
            className="p-2 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors"
            title="Edit player"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setSelectedPlayer(player);
              setShowDeleteModal(true);
            }}
            className="p-2 text-surface-500 dark:text-surface-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors"
            title="Delete player"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-surface-600 dark:text-surface-400">Position</span>
          <span className="text-surface-800 dark:text-surface-200 font-medium">
            {(player.position && positionLabels[player.position]) || player.position || "N/A"}
          </span>
        </div>

        {player.heightCm && (
          <div className="flex justify-between items-center">
            <span className="text-surface-600 dark:text-surface-400">Height</span>
            <span className="text-surface-800 dark:text-surface-200 font-medium" data-stat>
              {player.heightCm} cm
            </span>
          </div>
        )}

        {player.weightKg && (
          <div className="flex justify-between items-center">
            <span className="text-surface-600 dark:text-surface-400">Weight</span>
            <span className="text-surface-800 dark:text-surface-200 font-medium" data-stat>
              {player.weightKg} kg
            </span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-surface-600 dark:text-surface-400">Status</span>
          <span
            className={`text-sm font-medium ${
              player.active
                ? "text-surface-800 dark:text-surface-200"
                : "text-surface-500 dark:text-surface-500"
            }`}
          >
            {player.active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-surface-900 dark:text-white" data-stat>
              {player.seasonAverages?.points?.toFixed(1) || "0.0"}
            </div>
            <div className="text-xs text-surface-600 dark:text-surface-400">PPG</div>
          </div>
          <div>
            <div className="text-lg font-bold text-surface-900 dark:text-white" data-stat>
              {player.seasonAverages?.rebounds?.toFixed(1) || "0.0"}
            </div>
            <div className="text-xs text-surface-600 dark:text-surface-400">RPG</div>
          </div>
          <div>
            <div className="text-lg font-bold text-surface-900 dark:text-white" data-stat>
              {player.seasonAverages?.assists?.toFixed(1) || "0.0"}
            </div>
            <div className="text-xs text-surface-600 dark:text-surface-400">APG</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (playersData === undefined || teamsData === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-lg text-surface-900 dark:text-white">Players</h1>
        <p className="text-surface-600 dark:text-surface-400">
          Browse and manage basketball players
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-surface-600 dark:text-surface-400" />
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-100 dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-xl text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="relative">
            <FunnelIcon className="absolute left-3 top-3 h-5 w-5 text-surface-600 dark:text-surface-400" />
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-100 dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-xl text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
            >
              <option value="">All Teams</option>
              {teams.map((team: TeamItem) => (
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
              className="w-full px-4 py-2 bg-surface-100 dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-xl text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300">
                Search: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm("")}
                  className="ml-2 inline-flex items-center p-0.5 rounded-full text-surface-500 hover:text-surface-700 dark:hover:text-surface-200"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </span>
            )}
            {selectedTeam && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300">
                Team: {teams.find((t: TeamItem) => t.id === selectedTeam)?.name}
                <button
                  onClick={() => setSelectedTeam("")}
                  className="ml-2 inline-flex items-center p-0.5 rounded-full text-surface-500 hover:text-surface-700 dark:hover:text-surface-200"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </span>
            )}
            {selectedPosition && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300">
                Position: {positionLabels[selectedPosition]}
                <button
                  onClick={() => setSelectedPosition("")}
                  className="ml-2 inline-flex items-center p-0.5 rounded-full text-surface-500 hover:text-surface-700 dark:hover:text-surface-200"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {filteredPlayers.length > 0 ? (
        <>
          <div className="flex justify-between items-center">
            <p className="text-surface-600 dark:text-surface-400">
              {filteredPlayers.length} player{filteredPlayers.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlayers.map(renderPlayerCard)}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <UserIcon className="mx-auto h-12 w-12 text-surface-600 dark:text-surface-400" />
          <h3 className="mt-2 text-sm font-medium text-surface-900 dark:text-white">
            {players.length === 0 ? "No players found" : "No players match your filters"}
          </h3>
          <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">
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
                className="btn-secondary px-4 py-2 text-sm font-medium rounded-xl"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Edit Player Modal */}
      <PlayerFormModal
        isOpen={showEditModal && !!selectedPlayer}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPlayer(null);
        }}
        onSubmit={handleUpdatePlayer}
        isSubmitting={isUpdating}
        mode="edit"
        initialData={
          selectedPlayer
            ? {
                name: selectedPlayer.name,
                number: selectedPlayer.number.toString(),
                position: selectedPlayer.position || "PG",
                heightCm: selectedPlayer.heightCm?.toString() || "",
                weightKg: selectedPlayer.weightKg?.toString() || "",
                active: selectedPlayer.active !== false,
                imageUrl: selectedPlayer.imageUrl,
              }
            : undefined
        }
      />

      {/* Delete Player Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal && !!selectedPlayer}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedPlayer(null);
        }}
        onConfirm={handleDeletePlayer}
        isDeleting={isDeleting}
        title="Delete Player"
        itemName={selectedPlayer?.name || ""}
        warningMessage="This action cannot be undone. If the player has game statistics, they will be set to inactive instead."
      />
    </div>
  );
};

export default Players;
