import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { PlayerStat } from "../../../types/livegame";

interface ActiveLineupPanelProps {
  teamName: string;
  teamId: Id<"teams">;
  players: PlayerStat[];
  foulLimit: number;
  onPlayerSelect?: (playerId: Id<"players">) => void;
  onSwap: (playerOut: Id<"players">, playerIn: Id<"players">) => void;
  onSubIn?: (playerId: Id<"players">) => void; // For adding player to court without swapping (empty slots)
  swappingPlayer: Id<"players"> | null;
  onStartSwap: (playerId: Id<"players">) => void;
  onCancelSwap: () => void;
  disabled?: boolean;
  compact?: boolean;
  isHomeTeam?: boolean;
}

// Basketball court positions in formation order
const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;
type Position = (typeof POSITIONS)[number];

// Position full names for tooltips
const POSITION_NAMES: Record<Position, string> = {
  PG: "Point Guard",
  SG: "Shooting Guard",
  SF: "Small Forward",
  PF: "Power Forward",
  C: "Center",
};

// Re-export JerseyIcon for use in this file
import { JerseyIcon } from "../../JerseyIcon";

// Position slot on the court formation
const PositionSlot: React.FC<{
  position: Position;
  positionIndex: number;
  player: PlayerStat | null;
  isHomeTeam: boolean;
  isDropTarget: boolean;
  isDragging: boolean;
  isSelected: boolean;
  needsSub: boolean;
  foulLimit: number;
  canAcceptDrop: boolean;
  onDragStart: (positionIndex: number) => void;
  onDragEnd: () => void;
  onDropFromBench: (benchPlayerId: Id<"players">) => void;
  onDropFromCourt: (fromPositionIndex: number) => void;
  onClick: () => void;
  disabled: boolean;
}> = ({
  position,
  positionIndex,
  player,
  isHomeTeam,
  isDropTarget,
  isDragging,
  isSelected,
  needsSub,
  foulLimit,
  canAcceptDrop,
  onDragStart,
  onDragEnd,
  onDropFromBench,
  onDropFromCourt,
  onClick,
  disabled,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      // Accept drops from bench or from other court positions
      if (!disabled) setIsDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const playerId = e.dataTransfer.getData("playerId") as Id<"players">;
      const fromBench = e.dataTransfer.getData("fromBench") === "true";
      const fromPositionStr = e.dataTransfer.getData("fromPositionIndex");

      if (fromBench && playerId && canAcceptDrop) {
        // Drop from bench - substitution or filling empty slot
        onDropFromBench(playerId);
      } else if (fromPositionStr && !fromBench) {
        // Drop from another court position - swap positions
        const fromPositionIndex = parseInt(fromPositionStr, 10);
        if (!isNaN(fromPositionIndex) && fromPositionIndex !== positionIndex) {
          onDropFromCourt(fromPositionIndex);
        }
      }
    },
    [onDropFromBench, onDropFromCourt, canAcceptDrop, positionIndex]
  );

  const primaryColor = isHomeTeam ? "#3b82f6" : "#f97316";
  const isEmpty = !player;

  return (
    <div
      draggable={!!player && !disabled && !player.fouledOut}
      onDragStart={(e) => {
        if (player) {
          e.dataTransfer.setData("playerId", player.playerId);
          e.dataTransfer.setData("fromPosition", position);
          e.dataTransfer.setData("fromPositionIndex", positionIndex.toString());
          // Don't set fromBench - this is from court
          onDragStart(positionIndex);
        }
      }}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center
        rounded-xl transition-all duration-200 cursor-pointer
        min-w-[56px] sm:min-w-[64px] p-1.5 sm:p-2
        ${
          isDragOver || isDropTarget
            ? "ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-500/20 scale-105"
            : ""
        }
        ${isSelected ? "ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-500/20" : ""}
        ${
          needsSub && !isDragOver
            ? "ring-2 ring-red-500 bg-red-50 dark:bg-red-500/10 animate-pulse"
            : ""
        }
        ${
          isEmpty && !isDragOver
            ? "border-2 border-dashed border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-800/50"
            : "bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700"
        }
        ${isDragging ? "opacity-50 scale-95" : ""}
        ${disabled ? "opacity-60 cursor-not-allowed" : "hover:scale-105 active:scale-95"}
        shadow-sm hover:shadow-md
      `}
    >
      {/* Position label */}
      <span
        title={POSITION_NAMES[position]}
        className={`
          absolute -top-2 left-1/2 -translate-x-1/2
          text-[9px] sm:text-[10px] font-bold uppercase tracking-wider
          px-1.5 py-0.5 rounded-full
          ${
            needsSub
              ? "bg-red-500 text-white"
              : isEmpty
                ? "bg-surface-400 dark:bg-surface-600 text-white"
                : isHomeTeam
                  ? "bg-blue-500 text-white"
                  : "bg-orange-500 text-white"
          }
        `}
      >
        {position}
      </span>

      {player ? (
        <>
          <JerseyIcon
            number={player.player?.number || 0}
            size="md"
            color={primaryColor}
            fouledOut={player.fouledOut}
            fouls={player.fouls}
            foulLimit={foulLimit}
          />
          <span className="text-[9px] sm:text-[10px] font-semibold text-surface-600 dark:text-surface-400 mt-1 truncate max-w-full">
            {player.player?.name?.split(" ").pop()}
          </span>
          {/* Points display */}
          <span className="text-[10px] sm:text-xs font-black text-surface-900 dark:text-white">
            {player.points} pts
          </span>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-3 sm:py-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-dashed border-surface-400 dark:border-surface-600 flex items-center justify-center">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-surface-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <span className="text-[9px] sm:text-[10px] text-surface-400 mt-1">Empty</span>
        </div>
      )}
    </div>
  );
};

// Bench player card (draggable and droppable)
const BenchPlayerCard: React.FC<{
  player: PlayerStat;
  isHomeTeam: boolean;
  isSwapTarget: boolean;
  isSelected: boolean;
  foulLimit: number;
  canInteract: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDropFromCourt: (courtPlayerId: Id<"players">) => void;
  onClick: () => void;
}> = ({
  player,
  isHomeTeam,
  isSwapTarget,
  isSelected,
  foulLimit,
  canInteract,
  onDragStart,
  onDragEnd,
  onDropFromCourt,
  onClick,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const primaryColor = isHomeTeam ? "#3b82f6" : "#f97316";

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const fromBench = e.dataTransfer.types.includes("frombench");
    // Only accept drops from court (not from other bench players)
    if (!fromBench) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const courtPlayerId = e.dataTransfer.getData("playerId") as Id<"players">;
      const fromBench = e.dataTransfer.getData("fromBench") === "true";

      // Only accept drops from court players
      if (!fromBench && courtPlayerId) {
        onDropFromCourt(courtPlayerId);
      }
    },
    [onDropFromCourt]
  );

  return (
    <div
      draggable={canInteract}
      onDragStart={(e) => {
        e.dataTransfer.setData("playerId", player.playerId);
        e.dataTransfer.setData("fromBench", "true");
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={onClick}
      className={`
        flex flex-col items-center p-1.5 sm:p-2 rounded-lg
        transition-all duration-200
        ${canInteract ? "cursor-pointer hover:scale-105 hover:shadow-md active:scale-95" : "cursor-default"}
        ${
          isDragOver
            ? "ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-500/20 scale-105"
            : isSelected
              ? "ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-500/20"
              : isSwapTarget
                ? "ring-2 ring-emerald-400 ring-dashed bg-emerald-50/50 dark:bg-emerald-500/10"
                : "bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700"
        }
      `}
    >
      <JerseyIcon
        number={player.player?.number || 0}
        size="sm"
        variant="outline"
        color={primaryColor}
        fouls={player.fouls}
        foulLimit={foulLimit}
      />
      <span className="text-[8px] sm:text-[9px] font-medium text-surface-500 dark:text-surface-400 mt-0.5 truncate max-w-[40px] sm:max-w-[48px]">
        {player.player?.name?.split(" ").pop()}
      </span>
    </div>
  );
};

// Alert banner for needing substitutions
const SubstitutionAlert: React.FC<{
  count: number;
  onClose: () => void;
}> = ({ count, onClose }) => (
  <div className="flex items-center gap-2 p-2 sm:p-2.5 mb-2 sm:mb-3 rounded-lg bg-red-100 dark:bg-red-500/20 border border-red-300 dark:border-red-500/40 animate-pulse">
    <svg
      className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 flex-shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
    <span className="text-xs sm:text-sm font-semibold text-red-700 dark:text-red-300 flex-1">
      {count} position{count > 1 ? "s need" : " needs"} a substitute!
    </span>
    <button
      onClick={onClose}
      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  </div>
);

/**
 * Redesigned ActiveLineupPanel with:
 * - JerseyIcon display for players
 * - Position-based court formation layout
 * - Drag-and-drop substitutions
 * - Foul-out detection with visual alerts
 * - Always ensures 5 players on court (prompts for subs)
 */
export const ActiveLineupPanel: React.FC<ActiveLineupPanelProps> = ({
  teamName,
  players,
  foulLimit,
  onSwap,
  onSubIn,
  swappingPlayer,
  onStartSwap,
  onCancelSwap,
  disabled = false,
  compact = false,
  isHomeTeam = false,
}) => {
  const [draggingPlayer, setDraggingPlayer] = useState<Id<"players"> | null>(null);
  const [draggingFromPosition, setDraggingFromPosition] = useState<number | null>(null);
  const [showAlert, setShowAlert] = useState(true);
  // Track selected bench player for bench-first swap flow
  const [selectedBenchPlayer, setSelectedBenchPlayer] = useState<Id<"players"> | null>(null);
  // Local state to track custom position assignments (player IDs by position index)
  const [customPositions, setCustomPositions] = useState<(Id<"players"> | null)[]>([
    null,
    null,
    null,
    null,
    null,
  ]);

  // Separate players by status
  const onCourt = players.filter((p) => p.isOnCourt && !p.fouledOut);
  const onBench = players.filter((p) => !p.isOnCourt && !p.fouledOut);
  const fouledOut = players.filter((p) => p.fouledOut);

  // Check if we need substitutions (less than 5 on court)
  const needsSubs = onCourt.length < 5;
  const emptySlots = 5 - onCourt.length;

  // Compute position assignments - use custom positions if set, otherwise auto-assign
  const positionAssignments = useMemo(() => {
    const assignedPlayerIds = new Set<Id<"players">>();

    return POSITIONS.map((pos, idx) => {
      // First check if we have a custom assignment for this position
      const customPlayerId = customPositions[idx];
      if (customPlayerId) {
        const customPlayer = onCourt.find((p) => p.playerId === customPlayerId);
        if (customPlayer && !assignedPlayerIds.has(customPlayer.playerId)) {
          assignedPlayerIds.add(customPlayer.playerId);
          return customPlayer;
        }
      }

      // Try to find a player with matching position who hasn't been assigned yet
      const matchingPlayer = onCourt.find(
        (p) => p.player?.position?.toUpperCase() === pos && !assignedPlayerIds.has(p.playerId)
      );

      if (matchingPlayer) {
        assignedPlayerIds.add(matchingPlayer.playerId);
        return matchingPlayer;
      }

      // Otherwise, find the first unassigned player
      const unassignedPlayer = onCourt.find((p) => !assignedPlayerIds.has(p.playerId));
      if (unassignedPlayer) {
        assignedPlayerIds.add(unassignedPlayer.playerId);
        return unassignedPlayer;
      }

      return null;
    });
  }, [onCourt, customPositions]);

  // Reset custom positions when players change (substitutions)
  useEffect(() => {
    const currentPlayerIds = new Set(onCourt.map((p) => p.playerId));
    const customHasInvalidPlayer = customPositions.some((id) => id && !currentPlayerIds.has(id));
    if (customHasInvalidPlayer) {
      setCustomPositions([null, null, null, null, null]);
    }
  }, [onCourt, customPositions]);

  const isSwapping = swappingPlayer !== null;
  const swappingFromThisTeam = isSwapping && players.some((p) => p.playerId === swappingPlayer);

  // Reset alert visibility when players change
  useEffect(() => {
    if (needsSubs) setShowAlert(true);
  }, [needsSubs, onCourt.length]);

  // Track which position is selected for position swapping (separate from substitution)
  const [selectedPositionIndex, setSelectedPositionIndex] = useState<number | null>(null);

  const handlePositionClick = (
    player: PlayerStat | null,
    _position: Position,
    positionIndex: number
  ) => {
    if (disabled) return;

    if (player) {
      // If a bench player is selected, complete the swap (bench → court flow)
      if (selectedBenchPlayer) {
        onSwap(player.playerId, selectedBenchPlayer);
        setSelectedBenchPlayer(null);
        setSelectedPositionIndex(null);
        onCancelSwap();
        return;
      }

      // If we have a position selected and clicking another court player, swap positions
      if (selectedPositionIndex !== null && selectedPositionIndex !== positionIndex) {
        handleSwapPositions(selectedPositionIndex, positionIndex);
        setSelectedPositionIndex(null);
        return;
      }

      // If clicking the same position that's selected, deselect it
      if (selectedPositionIndex === positionIndex) {
        setSelectedPositionIndex(null);
        onCancelSwap();
        return;
      }

      // If substitution is in progress from this team (court player selected)
      if (swappingFromThisTeam) {
        // If clicking same player, cancel
        if (swappingPlayer === player.playerId) {
          onCancelSwap();
          setSelectedPositionIndex(null);
          return;
        }
        // Clicking a different court player while swapping - swap positions instead
        const swappingPlayerIndex = positionAssignments.findIndex(
          (p) => p?.playerId === swappingPlayer
        );
        if (swappingPlayerIndex !== -1) {
          handleSwapPositions(swappingPlayerIndex, positionIndex);
          onCancelSwap();
          setSelectedPositionIndex(null);
          return;
        }
      }

      // Select this position for potential position swap, or start substitution
      setSelectedPositionIndex(positionIndex);
      onStartSwap(player.playerId);
    } else {
      // Clicking empty slot
      // If bench player is selected, add them to this slot
      if (selectedBenchPlayer && onSubIn) {
        onSubIn(selectedBenchPlayer);
        setSelectedBenchPlayer(null);
        return;
      }
      // Clear position selection
      setSelectedPositionIndex(null);
    }
  };

  const handleBenchPlayerClick = (player: PlayerStat) => {
    if (disabled) return;

    // If a court player is selected (swap in progress), complete the swap
    if (swappingFromThisTeam && swappingPlayer) {
      onSwap(swappingPlayer, player.playerId);
      setSelectedPositionIndex(null);
      setSelectedBenchPlayer(null);
      return;
    }

    // If clicking the same bench player that's already selected, deselect
    if (selectedBenchPlayer === player.playerId) {
      setSelectedBenchPlayer(null);
      return;
    }

    // If there are empty slots, clicking a bench player adds them directly
    if (needsSubs && onSubIn) {
      onSubIn(player.playerId);
      return;
    }

    // Select this bench player for bench-first swap flow
    // Clear any court selection first
    setSelectedPositionIndex(null);
    onCancelSwap();
    setSelectedBenchPlayer(player.playerId);
  };

  // Handle dropping a court player onto a bench player
  const handleDropFromCourtToBench = (
    courtPlayerId: Id<"players">,
    benchPlayerId: Id<"players">
  ) => {
    if (disabled) return;
    onSwap(courtPlayerId, benchPlayerId);
  };

  // Handle drop from bench: swap bench player with court player, or add to empty slot
  const handleDropFromBench = (benchPlayerId: Id<"players">, courtPlayer: PlayerStat | null) => {
    if (disabled) return;

    if (courtPlayer) {
      // Normal case: swap with on-court player
      onSwap(courtPlayer.playerId, benchPlayerId);
    } else if (onSubIn) {
      // Empty slot case: just add the player to the court
      onSubIn(benchPlayerId);
    }
  };

  // Handle drop from another court position: swap positions (UI only)
  const handleSwapPositions = (fromPositionIndex: number, toPositionIndex: number) => {
    if (disabled) return;

    const fromPlayer = positionAssignments[fromPositionIndex];
    const toPlayer = positionAssignments[toPositionIndex];

    // Update custom positions to swap the players
    setCustomPositions((prev) => {
      const newPositions = [...prev];
      newPositions[fromPositionIndex] = toPlayer?.playerId || null;
      newPositions[toPositionIndex] = fromPlayer?.playerId || null;
      return newPositions;
    });
  };

  return (
    <div
      className={`
      rounded-xl sm:rounded-2xl overflow-hidden
      bg-white dark:bg-surface-800
      border border-surface-200 dark:border-surface-700
      shadow-sm
      ${compact ? "p-2 sm:p-3" : "p-3 sm:p-4"}
    `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-1 h-5 sm:h-6 rounded-full ${isHomeTeam ? "bg-blue-500" : "bg-orange-500"}`}
          />
          <h3
            className={`font-bold text-surface-900 dark:text-surface-200 uppercase tracking-wide ${compact ? "text-[10px] sm:text-xs" : "text-xs sm:text-sm"}`}
          >
            {teamName}
          </h3>
          <span className="text-[10px] sm:text-xs text-surface-400 dark:text-surface-500 font-medium">
            {onCourt.length}/5
          </span>
        </div>
        {(isSwapping && swappingFromThisTeam) || selectedBenchPlayer ? (
          <button
            onClick={() => {
              onCancelSwap();
              setSelectedPositionIndex(null);
              setSelectedBenchPlayer(null);
            }}
            className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold px-2 py-1 rounded bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 transition-colors"
          >
            Cancel
          </button>
        ) : null}
      </div>

      {/* Substitution Alert */}
      {needsSubs && showAlert && onBench.length > 0 && (
        <SubstitutionAlert count={emptySlots} onClose={() => setShowAlert(false)} />
      )}

      {/* Court Formation - 5 position slots */}
      <div className="mb-2 sm:mb-3">
        <div className="text-[9px] sm:text-[10px] text-surface-500 dark:text-surface-500 uppercase tracking-widest font-semibold mb-2 sm:mb-3">
          On Court
        </div>

        {/* Formation layout: PG, SG, SF, PF, C */}
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <div className="flex justify-center gap-2 sm:gap-3">
            {POSITIONS.map((pos, idx) => {
              const player = positionAssignments[idx];
              const needsSubHere = !player && needsSubs;
              // Can accept drop from bench if: has a player to swap, OR is empty and we can add players
              const canAcceptDropFromBench = !!player || (needsSubHere && !!onSubIn);
              return (
                <PositionSlot
                  key={pos}
                  position={pos}
                  positionIndex={idx}
                  player={player}
                  isHomeTeam={isHomeTeam}
                  isDropTarget={
                    (swappingFromThisTeam && canAcceptDropFromBench) ||
                    (selectedBenchPlayer !== null && (!!player || (needsSubHere && !!onSubIn)))
                  }
                  isDragging={draggingFromPosition === idx}
                  isSelected={swappingPlayer === player?.playerId || selectedPositionIndex === idx}
                  needsSub={needsSubHere}
                  foulLimit={foulLimit}
                  canAcceptDrop={canAcceptDropFromBench}
                  onDragStart={(posIdx) => {
                    setDraggingPlayer(player?.playerId || null);
                    setDraggingFromPosition(posIdx);
                  }}
                  onDragEnd={() => {
                    setDraggingPlayer(null);
                    setDraggingFromPosition(null);
                  }}
                  onDropFromBench={(benchPlayerId) => handleDropFromBench(benchPlayerId, player)}
                  onDropFromCourt={(fromPosIdx) => handleSwapPositions(fromPosIdx, idx)}
                  onClick={() => handlePositionClick(player, pos, idx)}
                  disabled={disabled}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Bench Players */}
      {onBench.length > 0 && (
        <div className="pt-2 sm:pt-3 border-t border-surface-200 dark:border-surface-700">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[9px] sm:text-[10px] text-surface-500 dark:text-surface-500 uppercase tracking-widest font-semibold">
              Bench ({onBench.length})
            </span>
            {swappingFromThisTeam && (
              <span className="text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold animate-pulse">
                Tap or drag to substitute
              </span>
            )}
            {selectedBenchPlayer && !swappingFromThisTeam && (
              <span className="text-[9px] sm:text-[10px] text-primary-600 dark:text-primary-400 font-semibold animate-pulse">
                Now tap a court player to swap
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {onBench.map((player) => (
              <BenchPlayerCard
                key={player.playerId}
                player={player}
                isHomeTeam={isHomeTeam}
                isSwapTarget={swappingFromThisTeam}
                isSelected={selectedBenchPlayer === player.playerId}
                foulLimit={foulLimit}
                canInteract={!disabled}
                onDragStart={() => setDraggingPlayer(player.playerId)}
                onDragEnd={() => setDraggingPlayer(null)}
                onDropFromCourt={(courtPlayerId) =>
                  handleDropFromCourtToBench(courtPlayerId, player.playerId)
                }
                onClick={() => handleBenchPlayerClick(player)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Fouled Out Players */}
      {fouledOut.length > 0 && (
        <div className="pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-red-200 dark:border-red-500/30">
          <div className="text-[9px] sm:text-[10px] text-red-600 dark:text-red-400 uppercase tracking-widest font-semibold mb-1.5 sm:mb-2">
            Fouled Out ({fouledOut.length})
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {fouledOut.map((player) => (
              <div
                key={player.playerId}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30"
              >
                <JerseyIcon
                  number={player.player?.number || 0}
                  size="sm"
                  color="#ef4444"
                  fouls={5}
                  fouledOut
                />
                <span className="text-[9px] sm:text-[10px] font-medium text-red-600 dark:text-red-400 line-through">
                  {player.player?.name?.split(" ").pop()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty bench state */}
      {onBench.length === 0 && needsSubs && (
        <div className="pt-2 sm:pt-3 border-t border-surface-200 dark:border-surface-700">
          <div className="text-center py-3 sm:py-4 text-surface-400 dark:text-surface-500">
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <p className="text-[10px] sm:text-xs font-medium">No bench players available</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveLineupPanel;
