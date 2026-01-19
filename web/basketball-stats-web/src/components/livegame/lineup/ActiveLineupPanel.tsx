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

// Jersey SVG Component
const JerseySVG: React.FC<{
  number: number;
  size?: "sm" | "md" | "lg";
  variant?: "filled" | "outline";
  color?: string;
  textColor?: string;
  fouledOut?: boolean;
  fouls?: number;
  foulLimit?: number;
}> = ({
  number,
  size = "md",
  variant = "filled",
  color = "#3b82f6",
  textColor = "#ffffff",
  fouledOut = false,
  fouls = 0,
  foulLimit = 5,
}) => {
  const sizes = {
    sm: { width: 36, height: 42, fontSize: 14 },
    md: { width: 48, height: 56, fontSize: 18 },
    lg: { width: 64, height: 74, fontSize: 24 },
  };
  const { width, height, fontSize } = sizes[size];

  // Calculate foul intensity (0-1)
  const foulIntensity = Math.min(fouls / foulLimit, 1);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 64 74"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-all duration-300 ${fouledOut ? "opacity-40 grayscale" : ""}`}
    >
      {/* Jersey Body */}
      <path
        d="M32 8C32 8 24 8 20 12L8 20V28L12 32V68C12 70 14 72 16 72H48C50 72 52 70 52 68V32L56 28V20L44 12C40 8 32 8 32 8Z"
        fill={variant === "filled" ? color : "transparent"}
        stroke={color}
        strokeWidth={variant === "outline" ? 2 : 0}
        className="transition-colors duration-300"
      />
      {/* Neck */}
      <path
        d="M26 8C26 8 28 14 32 14C36 14 38 8 38 8"
        stroke={variant === "filled" ? textColor : color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* Sleeves */}
      <path
        d="M8 20L4 28L8 32"
        stroke={variant === "filled" ? textColor : color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.3"
      />
      <path
        d="M56 20L60 28L56 32"
        stroke={variant === "filled" ? textColor : color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.3"
      />
      {/* Number */}
      <text
        x="32"
        y="48"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={variant === "filled" ? textColor : color}
        fontSize={fontSize}
        fontWeight="900"
        fontFamily="system-ui, -apple-system, sans-serif"
        className="select-none"
      >
        {number}
      </text>
      {/* Foul indicator bar at bottom */}
      {fouls > 0 && !fouledOut && (
        <rect
          x="16"
          y="66"
          width={32 * foulIntensity}
          height="3"
          rx="1.5"
          fill={foulIntensity >= 0.8 ? "#ef4444" : foulIntensity >= 0.6 ? "#f59e0b" : "#fbbf24"}
          className="transition-all duration-300"
        />
      )}
      {/* Fouled out X */}
      {fouledOut && (
        <>
          <line
            x1="20"
            y1="28"
            x2="44"
            y2="56"
            stroke="#ef4444"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <line
            x1="44"
            y1="28"
            x2="20"
            y2="56"
            stroke="#ef4444"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
};

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

  const primaryColor = isHomeTeam ? "#f97316" : "#3b82f6";
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
        ${isSelected ? "ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-500/20" : ""}
        ${
          needsSub && !isDragOver
            ? "ring-2 ring-red-500 bg-red-50 dark:bg-red-500/10 animate-pulse"
            : ""
        }
        ${
          isEmpty && !isDragOver
            ? "border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50"
            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
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
                ? "bg-gray-400 dark:bg-gray-600 text-white"
                : isHomeTeam
                  ? "bg-orange-500 text-white"
                  : "bg-blue-500 text-white"
          }
        `}
      >
        {position}
      </span>

      {player ? (
        <>
          <JerseySVG
            number={player.player?.number || 0}
            size="md"
            color={primaryColor}
            fouledOut={player.fouledOut}
            fouls={player.fouls}
            foulLimit={foulLimit}
          />
          <span className="text-[9px] sm:text-[10px] font-semibold text-gray-600 dark:text-gray-400 mt-1 truncate max-w-full">
            {player.player?.name?.split(" ").pop()}
          </span>
          {/* Points display */}
          <span className="text-[10px] sm:text-xs font-black text-gray-900 dark:text-white">
            {player.points} pts
          </span>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-3 sm:py-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-dashed border-gray-400 dark:border-gray-600 flex items-center justify-center">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
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
          <span className="text-[9px] sm:text-[10px] text-gray-400 mt-1">Empty</span>
        </div>
      )}

      {/* Drag handle indicator */}
      {player && !disabled && !player.fouledOut && (
        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>
      )}
    </div>
  );
};

// Bench player card (draggable)
const BenchPlayerCard: React.FC<{
  player: PlayerStat;
  isHomeTeam: boolean;
  isDropTarget: boolean;
  foulLimit: number;
  disabled: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClick: () => void;
}> = ({
  player,
  isHomeTeam,
  isDropTarget,
  foulLimit,
  disabled,
  onDragStart,
  onDragEnd,
  onClick,
}) => {
  const primaryColor = isHomeTeam ? "#f97316" : "#3b82f6";

  return (
    <div
      draggable={!disabled}
      onDragStart={(e) => {
        e.dataTransfer.setData("playerId", player.playerId);
        e.dataTransfer.setData("fromBench", "true");
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`
        flex flex-col items-center p-1.5 sm:p-2 rounded-lg
        transition-all duration-200 cursor-grab active:cursor-grabbing
        ${
          isDropTarget
            ? "ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-500/20 scale-105"
            : "bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-105 hover:shadow-md"}
      `}
    >
      <JerseySVG
        number={player.player?.number || 0}
        size="sm"
        variant="outline"
        color={primaryColor}
        fouls={player.fouls}
        foulLimit={foulLimit}
      />
      <span className="text-[8px] sm:text-[9px] font-medium text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[40px] sm:max-w-[48px]">
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
 * - Jersey SVG display for players
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
  // Local state to track custom position assignments (player IDs by position index)
  const [customPositions, setCustomPositions] = useState<(Id<"players"> | null)[]>([null, null, null, null, null]);

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
        (p) =>
          p.player?.position?.toUpperCase() === pos &&
          !assignedPlayerIds.has(p.playerId)
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
    const customHasInvalidPlayer = customPositions.some(
      (id) => id && !currentPlayerIds.has(id)
    );
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

  const handlePositionClick = (player: PlayerStat | null, _position: Position, positionIndex: number) => {
    if (disabled) return;

    if (player) {
      // If we have a position selected and clicking another court player, swap positions
      if (selectedPositionIndex !== null && selectedPositionIndex !== positionIndex) {
        handleSwapPositions(selectedPositionIndex, positionIndex);
        setSelectedPositionIndex(null);
        return;
      }

      // If clicking the same position that's selected, deselect it
      if (selectedPositionIndex === positionIndex) {
        setSelectedPositionIndex(null);
        return;
      }

      // If substitution is in progress from this team
      if (swappingFromThisTeam) {
        // If clicking same player, cancel
        if (swappingPlayer === player.playerId) {
          onCancelSwap();
          return;
        }
        // Clicking a different court player while swapping - swap positions instead
        const swappingPlayerIndex = positionAssignments.findIndex(p => p?.playerId === swappingPlayer);
        if (swappingPlayerIndex !== -1) {
          handleSwapPositions(swappingPlayerIndex, positionIndex);
          onCancelSwap();
          return;
        }
      }

      // Select this position for potential position swap, or start substitution
      setSelectedPositionIndex(positionIndex);
      onStartSwap(player.playerId);
    } else {
      // Clicking empty slot - clear position selection
      setSelectedPositionIndex(null);
    }
  };

  const handleBenchPlayerClick = (player: PlayerStat) => {
    if (disabled) return;

    // Clear position selection when interacting with bench
    setSelectedPositionIndex(null);

    if (swappingFromThisTeam && swappingPlayer) {
      // Complete the swap
      onSwap(swappingPlayer, player.playerId);
      return;
    }

    // If there are empty slots, clicking a bench player adds them directly
    if (needsSubs && onSubIn) {
      onSubIn(player.playerId);
    }
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
      bg-white dark:bg-gray-800
      border border-gray-200 dark:border-gray-700
      shadow-sm
      ${compact ? "p-2 sm:p-3" : "p-3 sm:p-4"}
    `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-1 h-5 sm:h-6 rounded-full ${isHomeTeam ? "bg-orange-500" : "bg-blue-500"}`}
          />
          <h3
            className={`font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wide ${compact ? "text-[10px] sm:text-xs" : "text-xs sm:text-sm"}`}
          >
            {teamName}
          </h3>
          <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-medium">
            {onCourt.length}/5
          </span>
        </div>
        {isSwapping && swappingFromThisTeam && (
          <button
            onClick={onCancelSwap}
            className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold px-2 py-1 rounded bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 transition-colors"
          >
            Cancel Sub
          </button>
        )}
      </div>

      {/* Substitution Alert */}
      {needsSubs && showAlert && onBench.length > 0 && (
        <SubstitutionAlert count={emptySlots} onClose={() => setShowAlert(false)} />
      )}

      {/* Court Formation - 5 position slots */}
      <div className="mb-2 sm:mb-3">
        <div className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-500 uppercase tracking-widest font-semibold mb-2 sm:mb-3">
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
                  isDropTarget={swappingFromThisTeam && canAcceptDropFromBench}
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
        <div className="pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-500 uppercase tracking-widest font-semibold">
              Bench ({onBench.length})
            </span>
            {swappingFromThisTeam && (
              <span className="text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold animate-pulse">
                Tap or drag to substitute
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {onBench.map((player) => (
              <BenchPlayerCard
                key={player.playerId}
                player={player}
                isHomeTeam={isHomeTeam}
                isDropTarget={swappingFromThisTeam}
                foulLimit={foulLimit}
                disabled={disabled || (!swappingFromThisTeam && !needsSubs)}
                onDragStart={() => setDraggingPlayer(player.playerId)}
                onDragEnd={() => setDraggingPlayer(null)}
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
                <JerseySVG
                  number={player.player?.number || 0}
                  size="sm"
                  color="#ef4444"
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
        <div className="pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center py-3 sm:py-4 text-gray-400 dark:text-gray-500">
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
