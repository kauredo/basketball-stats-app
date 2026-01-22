import React, { useState, useMemo, useRef, useEffect } from "react";
import { XMarkIcon, MagnifyingGlassIcon, UserIcon } from "@heroicons/react/24/outline";
import type { Id } from "../../../../convex/_generated/dataModel";

interface PlayerOption {
  id: Id<"players">;
  name: string;
  team: string;
  teamId: Id<"teams">;
  number: number;
  position?: string;
}

interface PlayerSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (playerId: Id<"players">) => void;
  players: PlayerOption[];
  selectedId?: Id<"players"> | null;
  excludeIds?: Id<"players">[];
  title?: string;
}

/**
 * Modal for selecting a player with search and team grouping.
 * Designed for large leagues with many teams and players.
 */
export const PlayerSelectorModal: React.FC<PlayerSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  players,
  selectedId,
  excludeIds = [],
  title = "Select Player",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Filter and group players by team
  const groupedPlayers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    // Filter players by search query
    const filtered = players.filter((player) => {
      if (excludeIds.includes(player.id)) return false;
      if (!query) return true;

      return (
        player.name.toLowerCase().includes(query) ||
        player.team.toLowerCase().includes(query) ||
        player.number.toString().includes(query) ||
        (player.position?.toLowerCase().includes(query) ?? false)
      );
    });

    // Group by team
    const groups: Record<string, PlayerOption[]> = {};
    for (const player of filtered) {
      if (!groups[player.team]) {
        groups[player.team] = [];
      }
      groups[player.team].push(player);
    }

    // Sort teams alphabetically, sort players by number within team
    const sortedTeams = Object.keys(groups).sort();
    return sortedTeams.map((teamName) => ({
      teamName,
      players: groups[teamName].sort((a, b) => a.number - b.number),
    }));
  }, [players, searchQuery, excludeIds]);

  const totalFilteredCount = groupedPlayers.reduce((sum, g) => sum + g.players.length, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-surface-800 rounded-2xl w-full max-w-lg shadow-dramatic border border-surface-200 dark:border-surface-700 animate-scale-in max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, team, or number..."
              className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl pl-10 pr-4 py-3 text-surface-900 dark:text-surface-50 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
            />
          </div>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-2">
            {totalFilteredCount} player{totalFilteredCount !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Player List */}
        <div className="flex-1 overflow-y-auto p-2">
          {groupedPlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserIcon className="w-10 h-10 text-surface-400 mb-3" />
              <p className="text-surface-600 dark:text-surface-400 font-medium">No players found</p>
              <p className="text-sm text-surface-500 dark:text-surface-500 mt-1">
                Try adjusting your search
              </p>
            </div>
          ) : (
            groupedPlayers.map(({ teamName, players: teamPlayers }) => (
              <div key={teamName} className="mb-4">
                {/* Team Header */}
                <div className="px-3 py-2 sticky top-0 bg-surface-100 dark:bg-surface-700/50 rounded-lg mb-1">
                  <span className="text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase tracking-wide">
                    {teamName}
                  </span>
                </div>

                {/* Players */}
                <div className="space-y-1">
                  {teamPlayers.map((player) => {
                    const isSelected = player.id === selectedId;
                    return (
                      <button
                        key={player.id}
                        onClick={() => {
                          onSelect(player.id);
                          onClose();
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                          isSelected
                            ? "bg-primary-500/10 border-2 border-primary-500"
                            : "hover:bg-surface-100 dark:hover:bg-surface-700/50 border-2 border-transparent"
                        }`}
                      >
                        {/* Jersey Number */}
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                            isSelected
                              ? "bg-primary-500 text-white"
                              : "bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300"
                          }`}
                        >
                          #{player.number}
                        </div>

                        {/* Player Info */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium truncate ${
                              isSelected
                                ? "text-primary-600 dark:text-primary-400"
                                : "text-surface-900 dark:text-white"
                            }`}
                          >
                            {player.name}
                          </p>
                          {player.position && (
                            <p className="text-xs text-surface-500 dark:text-surface-400">
                              {player.position}
                            </p>
                          )}
                        </div>

                        {/* Selected Indicator */}
                        {isSelected && <div className="w-2 h-2 rounded-full bg-primary-500"></div>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerSelectorModal;
