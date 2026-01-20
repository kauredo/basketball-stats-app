import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { getErrorMessage } from "../utils/error";
import ImageUpload from "../components/ImageUpload";
import {
  UserIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

const Players: React.FC = () => {
  const { token, selectedLeague } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [playerForm, setPlayerForm] = useState({
    name: "",
    number: "",
    position: "PG" as "PG" | "SG" | "SF" | "PF" | "C",
    heightCm: "",
    weightKg: "",
    active: true,
  });
  const [playerFormErrors, setPlayerFormErrors] = useState<{ name?: string; number?: string }>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingImageStorageId, setPendingImageStorageId] = useState<Id<"_storage"> | null>(null);
  const [clearImage, setClearImage] = useState(false);

  // Validation functions
  const validatePlayerName = (name: string) => {
    if (!name.trim()) return "Player name is required";
    if (name.trim().length < 2) return "Player name must be at least 2 characters";
    return undefined;
  };

  const validateJerseyNumber = (number: string) => {
    if (!number) return "Jersey number is required";
    const num = parseInt(number);
    if (isNaN(num)) return "Jersey number must be a valid number";
    if (num < 0 || num > 99) return "Jersey number must be between 0 and 99";
    return undefined;
  };

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

  const players = playersData?.players || [];
  const teams = teamsData?.teams || [];

  const handleViewStats = (player: any) => {
    navigate(`/app/shot-charts?player=${player.id}`);
  };

  const handleViewPlayer = (player: any) => {
    navigate(`/app/players/${player.id}`);
  };

  const handleEditPlayer = (player: any) => {
    setSelectedPlayer(player);
    setPlayerForm({
      name: player.name,
      number: player.number.toString(),
      position: player.position,
      heightCm: player.heightCm?.toString() || "",
      weightKg: player.weightKg?.toString() || "",
      active: player.active !== false,
    });
    setPlayerFormErrors({});
    setPendingImageStorageId(null);
    setClearImage(false);
    setShowEditModal(true);
  };

  const handleUpdatePlayer = async () => {
    if (!selectedPlayer || !playerForm.name.trim() || !playerForm.number || !token) return;

    setIsUpdating(true);
    try {
      // Update player info
      await updatePlayer({
        token,
        playerId: selectedPlayer.id as Id<"players">,
        name: playerForm.name.trim(),
        number: parseInt(playerForm.number),
        position: playerForm.position,
        heightCm: playerForm.heightCm ? parseInt(playerForm.heightCm) : undefined,
        weightKg: playerForm.weightKg ? parseInt(playerForm.weightKg) : undefined,
        active: playerForm.active,
      });

      // Handle image changes
      if (pendingImageStorageId) {
        await setPlayerImage({
          token,
          playerId: selectedPlayer.id as Id<"players">,
          storageId: pendingImageStorageId,
        });
      } else if (clearImage && selectedPlayer.imageUrl) {
        await removePlayerImage({
          token,
          playerId: selectedPlayer.id as Id<"players">,
        });
      }

      toast.success(`Player "${playerForm.name.trim()}" updated successfully`);
      setShowEditModal(false);
      setSelectedPlayer(null);
      setPlayerForm({
        name: "",
        number: "",
        position: "PG",
        heightCm: "",
        weightKg: "",
        active: true,
      });
      setPlayerFormErrors({});
      setPendingImageStorageId(null);
      setClearImage(false);
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
      className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
            {player.imageUrl ? (
              <img
                src={player.imageUrl}
                alt={player.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{player.name}</h3>
            <p className="text-orange-500 dark:text-orange-400 font-medium">#{player.number}</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {player.team?.name || "Unknown Team"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleViewPlayer(player)}
            className="p-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white transition-colors"
            title="View Profile"
          >
            <EyeIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleViewStats(player)}
            className="p-2 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-lg text-gray-600 dark:text-gray-400 transition-colors"
            title="Shot Chart"
          >
            <ChartBarIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleEditPlayer(player)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Edit player"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setSelectedPlayer(player);
              setShowDeleteModal(true);
            }}
            className="p-2 text-gray-500 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Delete player"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Position</span>
          <span className="text-gray-800 dark:text-gray-200 font-medium">
            {positionLabels[player.position] || player.position}
          </span>
        </div>

        {player.heightCm && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Height</span>
            <span className="text-gray-800 dark:text-gray-200 font-medium">
              {player.heightCm} cm
            </span>
          </div>
        )}

        {player.weightKg && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Weight</span>
            <span className="text-gray-800 dark:text-gray-200 font-medium">
              {player.weightKg} kg
            </span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Status</span>
          <span
            className={`text-sm font-medium ${
              player.active ? "text-gray-800 dark:text-gray-200" : "text-gray-500 dark:text-gray-500"
            }`}
          >
            {player.active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {player.seasonAverages?.points?.toFixed(1) || "0.0"}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">PPG</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {player.seasonAverages?.rebounds?.toFixed(1) || "0.0"}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">RPG</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {player.seasonAverages?.assists?.toFixed(1) || "0.0"}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">APG</div>
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Players</h1>
        <p className="text-gray-600 dark:text-gray-400">Browse and manage basketball players</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-600 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="relative">
            <FunnelIcon className="absolute left-3 top-3 h-5 w-5 text-gray-600 dark:text-gray-400" />
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
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
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
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
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                Search: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm("")}
                  className="ml-2 inline-flex items-center p-0.5 rounded-full text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  x
                </button>
              </span>
            )}
            {selectedTeam && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                Team: {teams.find((t: any) => t.id === selectedTeam)?.name}
                <button
                  onClick={() => setSelectedTeam("")}
                  className="ml-2 inline-flex items-center p-0.5 rounded-full text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  x
                </button>
              </span>
            )}
            {selectedPosition && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                Position: {positionLabels[selectedPosition]}
                <button
                  onClick={() => setSelectedPosition("")}
                  className="ml-2 inline-flex items-center p-0.5 rounded-full text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
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
            <p className="text-gray-600 dark:text-gray-400">
              {filteredPlayers.length} player{filteredPlayers.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlayers.map(renderPlayerCard)}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <UserIcon className="mx-auto h-12 w-12 text-gray-600 dark:text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            {players.length === 0 ? "No players found" : "No players match your filters"}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
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
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Edit Player Modal */}
      {showEditModal && selectedPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Edit Player</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Player Name *
                </label>
                <input
                  type="text"
                  value={playerForm.name}
                  onChange={(e) => {
                    setPlayerForm((prev) => ({ ...prev, name: e.target.value }));
                    if (playerFormErrors.name) {
                      setPlayerFormErrors((prev) => ({ ...prev, name: validatePlayerName(e.target.value) }));
                    }
                  }}
                  onBlur={(e) => setPlayerFormErrors((prev) => ({ ...prev, name: validatePlayerName(e.target.value) }))}
                  className={`w-full bg-gray-100 dark:bg-gray-700 border rounded-md px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    playerFormErrors.name
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="Enter player name"
                />
                {playerFormErrors.name && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                    {playerFormErrors.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Jersey # *
                  </label>
                  <input
                    type="number"
                    value={playerForm.number}
                    onChange={(e) => {
                      setPlayerForm((prev) => ({ ...prev, number: e.target.value }));
                      if (playerFormErrors.number) {
                        setPlayerFormErrors((prev) => ({ ...prev, number: validateJerseyNumber(e.target.value) }));
                      }
                    }}
                    onBlur={(e) => setPlayerFormErrors((prev) => ({ ...prev, number: validateJerseyNumber(e.target.value) }))}
                    className={`w-full bg-gray-100 dark:bg-gray-700 border rounded-md px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      playerFormErrors.number
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder="00"
                    min="0"
                    max="99"
                  />
                  {playerFormErrors.number && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                      {playerFormErrors.number}
                    </p>
                  )}
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

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="activeStatus"
                  checked={playerForm.active}
                  onChange={(e) => setPlayerForm((prev) => ({ ...prev, active: e.target.checked }))}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="activeStatus"
                  className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                >
                  Active player
                </label>
              </div>

              <ImageUpload
                currentImageUrl={clearImage ? undefined : selectedPlayer.imageUrl}
                onImageUploaded={(storageId) => {
                  setPendingImageStorageId(storageId);
                  setClearImage(false);
                }}
                onImageCleared={() => {
                  setPendingImageStorageId(null);
                  setClearImage(true);
                }}
                label="Player Photo"
                placeholder="Click to upload player photo"
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedPlayer(null);
                  setPlayerForm({
                    name: "",
                    number: "",
                    position: "PG",
                    heightCm: "",
                    weightKg: "",
                    active: true,
                  });
                  setPlayerFormErrors({});
                  setPendingImageStorageId(null);
                  setClearImage(false);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePlayer}
                disabled={!playerForm.name.trim() || !playerForm.number || !!playerFormErrors.name || !!playerFormErrors.number || isUpdating}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Player Confirmation Modal */}
      {showDeleteModal && selectedPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Delete Player</h3>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {selectedPlayer.name}
              </span>
              ?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              This action cannot be undone. If the player has game statistics, they will be set to
              inactive instead.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedPlayer(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePlayer}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete Player"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Players;
