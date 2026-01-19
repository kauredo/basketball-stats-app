import React, { useState, useCallback, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowUturnLeftIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import Icon from "../components/Icon";
import { COLORS, svgToCourtCoords, getShotZone } from "@basketball-stats/shared";

// Action history item for undo functionality
interface ActionHistoryItem {
  id: string;
  playerId: Id<"players">;
  playerName: string;
  playerNumber: number;
  statType: StatType;
  made?: boolean;
  timestamp: number;
}

type StatType =
  | "shot2"
  | "shot3"
  | "freethrow"
  | "rebound"
  | "assist"
  | "steal"
  | "block"
  | "turnover"
  | "foul";

interface PlayerStat {
  id: Id<"playerStats">;
  playerId: Id<"players">;
  teamId: Id<"teams">;
  player: {
    number: number;
    name: string;
    position?: string;
  } | null;
  points: number;
  rebounds: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fouledOut: boolean;
  isOnCourt: boolean;
  isHomeTeam: boolean;
}

interface ShotLocation {
  x: number;
  y: number;
  made: boolean;
}

// Mini Court Component for shot recording
interface MiniCourtProps {
  onCourtClick: (x: number, y: number, is3pt: boolean) => void;
  disabled?: boolean;
  recentShots: ShotLocation[];
}

const MiniCourt: React.FC<MiniCourtProps> = ({ onCourtClick, disabled, recentShots }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);

  // Court dimensions (based on real proportions)
  // Half court is 47ft long x 50ft wide
  // We use viewBox 0 0 300 282 (300px = 50ft, so 6px per foot)
  // Basket is 5.25ft from baseline = 31.5px
  // 3PT arc is 23.75ft from basket center
  const COURT_WIDTH = 300;
  const COURT_HEIGHT = 282; // 47ft * 6px/ft
  const BASKET_Y = 31.5; // 5.25ft from baseline
  const BASKET_X = 150; // center
  const THREE_PT_RADIUS = 142.5; // 23.75ft * 6px/ft
  const PAINT_WIDTH = 96; // 16ft * 6px/ft
  const PAINT_HEIGHT = 114; // 19ft (to free throw line) * 6px/ft
  const FT_CIRCLE_RADIUS = 36; // 6ft * 6px/ft
  const RESTRICTED_RADIUS = 24; // 4ft * 6px/ft
  const CORNER_THREE_X = 18; // 3ft from sideline * 6px/ft

  const handleClick = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      if (disabled || !svgRef.current) return;

      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      const scaleX = COURT_WIDTH / rect.width;
      const scaleY = COURT_HEIGHT / rect.height;

      const svgX = (event.clientX - rect.left) * scaleX;
      const svgY = (event.clientY - rect.top) * scaleY;

      // Convert to court coordinates (feet, origin at basket)
      const courtX = ((svgX - BASKET_X) / 6); // Convert px to feet
      const courtY = ((svgY - BASKET_Y) / 6); // Convert px to feet

      // Determine if it's a 3-pointer
      const distanceFromBasket = Math.sqrt(courtX * courtX + courtY * courtY);
      // Corner 3s: beyond 22ft from sideline (3ft from corner) and within 14ft from baseline
      const isCorner3 = Math.abs(courtX) > 22 && courtY < 14;
      const is3pt = distanceFromBasket > 23.75 || isCorner3;

      // Show ripple effect
      setRipple({ x: svgX, y: svgY });
      setTimeout(() => setRipple(null), 400);

      onCourtClick(courtX, courtY, is3pt);
    },
    [disabled, onCourtClick]
  );

  // Convert court coordinates (feet) back to SVG coordinates for shot display
  const courtToSvg = (courtX: number, courtY: number) => ({
    x: BASKET_X + courtX * 6,
    y: BASKET_Y + courtY * 6,
  });

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${COURT_WIDTH} ${COURT_HEIGHT}`}
        className={`w-full rounded-lg ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-crosshair hover:shadow-lg hover:shadow-orange-500/20"}`}
        onClick={handleClick}
        style={{ aspectRatio: `${COURT_WIDTH}/${COURT_HEIGHT}` }}
      >
        {/* Court background */}
        <rect x="0" y="0" width={COURT_WIDTH} height={COURT_HEIGHT} fill={COLORS.court.background} rx="8" />

        {/* Baseline */}
        <line x1="0" y1="0" x2={COURT_WIDTH} y2="0" stroke="#4B5563" strokeWidth="2" />

        {/* Three-point line */}
        <path
          d={`M ${CORNER_THREE_X} 0
              L ${CORNER_THREE_X} ${BASKET_Y + Math.sqrt(THREE_PT_RADIUS * THREE_PT_RADIUS - (BASKET_X - CORNER_THREE_X) * (BASKET_X - CORNER_THREE_X))}
              A ${THREE_PT_RADIUS} ${THREE_PT_RADIUS} 0 0 0 ${COURT_WIDTH - CORNER_THREE_X} ${BASKET_Y + Math.sqrt(THREE_PT_RADIUS * THREE_PT_RADIUS - (BASKET_X - CORNER_THREE_X) * (BASKET_X - CORNER_THREE_X))}
              L ${COURT_WIDTH - CORNER_THREE_X} 0`}
          fill="none"
          stroke="#4B5563"
          strokeWidth="1.5"
        />

        {/* Paint area (key) */}
        <rect
          x={(COURT_WIDTH - PAINT_WIDTH) / 2}
          y="0"
          width={PAINT_WIDTH}
          height={PAINT_HEIGHT}
          fill="none"
          stroke="#4B5563"
          strokeWidth="1.5"
        />

        {/* Free throw circle */}
        <circle
          cx={BASKET_X}
          cy={PAINT_HEIGHT}
          r={FT_CIRCLE_RADIUS}
          fill="none"
          stroke="#4B5563"
          strokeWidth="1.5"
        />

        {/* Restricted area arc */}
        <path
          d={`M ${BASKET_X - RESTRICTED_RADIUS} 0 A ${RESTRICTED_RADIUS} ${RESTRICTED_RADIUS} 0 0 0 ${BASKET_X + RESTRICTED_RADIUS} 0`}
          fill="none"
          stroke="#4B5563"
          strokeWidth="1.5"
        />

        {/* Basket and backboard */}
        <rect x={BASKET_X - 18} y={BASKET_Y - 4} width="36" height="2" fill="#6B7280" rx="1" />
        <circle cx={BASKET_X} cy={BASKET_Y} r="5" fill="none" stroke={COLORS.primary[500]} strokeWidth="2" />
        <circle cx={BASKET_X} cy={BASKET_Y} r="2" fill={COLORS.primary[500]} />

        {/* Zone labels */}
        <text x={BASKET_X} y={COURT_HEIGHT - 30} textAnchor="middle" fill="#6B7280" fontSize="12" fontWeight="500">
          3PT ZONE
        </text>
        <text x={BASKET_X} y={85} textAnchor="middle" fill="#6B7280" fontSize="11" fontWeight="500">
          PAINT
        </text>
        <text x={BASKET_X} y={PAINT_HEIGHT + 50} textAnchor="middle" fill="#6B7280" fontSize="10">
          MID-RANGE
        </text>

        {/* Recent shots */}
        {recentShots.slice(-5).map((shot, index) => {
          const { x: svgX, y: svgY } = courtToSvg(shot.x, shot.y);
          return (
            <g key={index}>
              <circle
                cx={svgX}
                cy={svgY}
                r={8}
                fill={shot.made ? COLORS.shots.made2pt : COLORS.shots.missed2pt}
                stroke="#fff"
                strokeWidth="2"
                opacity={0.9}
                className="transition-all duration-300"
              />
              {!shot.made && (
                <text x={svgX} y={svgY + 3} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">
                  ×
                </text>
              )}
            </g>
          );
        })}

        {/* Ripple effect */}
        {ripple && (
          <circle
            cx={ripple.x}
            cy={ripple.y}
            r="15"
            fill={COLORS.primary[500]}
            className="animate-ping"
            opacity="0.5"
          />
        )}
      </svg>

      {!disabled && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 px-3 py-1.5 rounded-full text-xs text-white font-medium shadow-lg">
          Tap court to record shot
        </div>
      )}
    </div>
  );
};

// Shot Recording Modal - Court-first flow
interface ShotRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecord: (playerId: Id<"players">, made: boolean) => void;
  shotType: "2pt" | "3pt";
  zoneName: string;
  onCourtPlayers: PlayerStat[];
}

const ShotRecordingModal: React.FC<ShotRecordingModalProps> = ({
  isOpen,
  onClose,
  onRecord,
  shotType,
  zoneName,
  onCourtPlayers,
}) => {
  if (!isOpen) return null;

  const points = shotType === "3pt" ? 3 : 2;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header with zone info */}
        <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {shotType === "3pt" ? "3-Point Shot" : "2-Point Shot"}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Shot from <span className="font-medium text-gray-700 dark:text-gray-300">{zoneName}</span>
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-bold ${
              shotType === "3pt" ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300" : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
            }`}>
              +{points} PTS
            </div>
          </div>
        </div>

        {/* Player list with made/missed buttons */}
        <div className="max-h-80 overflow-y-auto">
          {onCourtPlayers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No players on court
            </div>
          ) : (
            onCourtPlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">#{player.player?.number}</span>
                  </div>
                  <div>
                    <div className="text-gray-900 dark:text-white font-medium text-sm">
                      {player.player?.name}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {player.points} PTS
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onRecord(player.playerId, true)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors"
                  >
                    MADE
                  </button>
                  <button
                    onClick={() => onRecord(player.playerId, false)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors"
                  >
                    MISS
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cancel button */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper to determine shot zone name from coordinates
const getShotZoneName = (x: number, y: number, is3pt: boolean): string => {
  if (is3pt) {
    if (Math.abs(x) > 20 && y < 14) {
      return x > 0 ? "Right Corner 3" : "Left Corner 3";
    } else if (Math.abs(x) > 12) {
      return x > 0 ? "Right Wing 3" : "Left Wing 3";
    } else {
      return "Top of Key 3";
    }
  } else {
    // 2-point zones
    const distanceFromBasket = Math.sqrt(x * x + y * y);
    if (distanceFromBasket < 4) {
      return "At Rim";
    } else if (y < 8 && distanceFromBasket < 10) {
      return "Paint";
    } else if (Math.abs(x) > 12) {
      return x > 0 ? "Right Elbow" : "Left Elbow";
    } else if (y > 15) {
      return "Free Throw Line";
    } else {
      return "Mid-Range";
    }
  }
};

// Rebound Prompt Modal - appears after missed shots
interface ReboundPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayerRebound: (playerId: Id<"players">, type: "offensive" | "defensive") => void;
  onTeamRebound: (teamId: Id<"teams">, type: "offensive" | "defensive") => void;
  shooterTeamId: Id<"teams">;
  shooterTeamName: string;
  opposingTeamId: Id<"teams">;
  opposingTeamName: string;
  shooterTeamPlayers: PlayerStat[];
  opposingTeamPlayers: PlayerStat[];
  shotType: string;
}

const ReboundPromptModal: React.FC<ReboundPromptModalProps> = ({
  isOpen,
  onClose,
  onPlayerRebound,
  onTeamRebound,
  shooterTeamId,
  shooterTeamName,
  opposingTeamId,
  opposingTeamName,
  shooterTeamPlayers,
  opposingTeamPlayers,
  shotType,
}) => {
  const [autoDismissTimer, setAutoDismissTimer] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Auto-dismiss after 8 seconds
      const timer = window.setTimeout(() => {
        onClose();
      }, 8000);
      setAutoDismissTimer(timer as any);
      return () => window.clearTimeout(timer);
    }
    return () => {
      if (autoDismissTimer) window.clearTimeout(autoDismissTimer);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const shooterOnCourt = shooterTeamPlayers.filter((p) => p.isOnCourt);
  const opposingOnCourt = opposingTeamPlayers.filter((p) => p.isOnCourt);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4">
          <h3 className="text-lg font-bold text-white">Rebound</h3>
          <p className="text-blue-200 text-sm">
            Missed {shotType === "shot3" ? "3PT" : shotType === "freethrow" ? "FT" : "2PT"}
          </p>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {/* Offensive Rebound - Shooter's Team */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-orange-600 dark:text-orange-400 text-sm">
                OFFENSIVE ({shooterTeamName})
              </h4>
              <button
                onClick={() => onTeamRebound(shooterTeamId, "offensive")}
                className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium rounded hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
              >
                TEAM
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {shooterOnCourt.map((player) => (
                <button
                  key={player.id}
                  onClick={() => onPlayerRebound(player.playerId, "offensive")}
                  className="px-3 py-2 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 border border-orange-200 dark:border-orange-700 rounded-lg text-sm font-medium text-gray-900 dark:text-white transition-colors"
                >
                  #{player.player?.number}
                </button>
              ))}
            </div>
          </div>

          {/* Defensive Rebound - Opposing Team */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-blue-600 dark:text-blue-400 text-sm">
                DEFENSIVE ({opposingTeamName})
              </h4>
              <button
                onClick={() => onTeamRebound(opposingTeamId, "defensive")}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                TEAM
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {opposingOnCourt.map((player) => (
                <button
                  key={player.id}
                  onClick={() => onPlayerRebound(player.playerId, "defensive")}
                  className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-lg text-sm font-medium text-gray-900 dark:text-white transition-colors"
                >
                  #{player.player?.number}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
          >
            Dismiss / No Rebound
          </button>
        </div>
      </div>
    </div>
  );
};

// Quick Stat Modal - for recording non-shot stats
interface QuickStatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecord: (playerId: Id<"players">) => void;
  statType: StatType | null;
  onCourtPlayers: PlayerStat[];
}

const QuickStatModal: React.FC<QuickStatModalProps> = ({
  isOpen,
  onClose,
  onRecord,
  statType,
  onCourtPlayers,
}) => {
  if (!isOpen || !statType) return null;

  const getStatInfo = (type: StatType) => {
    switch (type) {
      case "assist": return { label: "Assist", color: "purple" };
      case "steal": return { label: "Steal", color: "cyan" };
      case "block": return { label: "Block", color: "cyan" };
      case "turnover": return { label: "Turnover", color: "amber" };
      case "foul": return { label: "Foul", color: "amber" };
      case "freethrow": return { label: "Free Throw", color: "green" };
      case "rebound": return { label: "Rebound", color: "blue" };
      default: return { label: type, color: "gray" };
    }
  };

  const { label, color } = getStatInfo(statType);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 bg-${color}-600`}>
          <h3 className="text-lg font-bold text-white">Record {label}</h3>
          <p className="text-white/80 text-sm">Select a player</p>
        </div>

        {/* Player list */}
        <div className="max-h-80 overflow-y-auto">
          {onCourtPlayers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No players on court
            </div>
          ) : (
            onCourtPlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => onRecord(player.playerId)}
                className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">#{player.player?.number}</span>
                  </div>
                  <div className="text-left">
                    <div className="text-gray-900 dark:text-white font-medium text-sm">
                      {player.player?.name}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {player.isHomeTeam ? "Home" : "Away"}
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 bg-${color}-100 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-300 text-sm font-medium rounded-lg`}>
                  +{label.toUpperCase().slice(0, 3)}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Cancel button */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Foul indicator dots component
interface FoulDotsProps {
  fouls: number;
  foulLimit: number;
  fouledOut?: boolean;
}

const FoulDots: React.FC<FoulDotsProps> = ({ fouls, foulLimit, fouledOut }) => {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: foulLimit }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            i < fouls
              ? fouledOut
                ? "bg-red-600"
                : fouls >= foulLimit - 1
                  ? "bg-yellow-500"
                  : "bg-orange-500"
              : "bg-gray-300 dark:bg-gray-600"
          }`}
        />
      ))}
    </div>
  );
};

// Inline Substitution Panel Component
interface InlineSubPanelProps {
  teamName: string;
  teamId: Id<"teams">;
  players: PlayerStat[];
  foulLimit: number;
  onSwap: (playerOutId: Id<"players">, playerInId: Id<"players">) => void;
  swappingPlayer: Id<"players"> | null;
  onStartSwap: (playerId: Id<"players">) => void;
  onCancelSwap: () => void;
  disabled?: boolean;
}

const InlineSubPanel: React.FC<InlineSubPanelProps> = ({
  teamName,
  players,
  foulLimit,
  onSwap,
  swappingPlayer,
  onStartSwap,
  onCancelSwap,
  disabled,
}) => {
  const onCourtPlayers = players.filter((p) => p.isOnCourt);
  const benchPlayers = players.filter((p) => !p.isOnCourt && !p.fouledOut);
  const fouledOutPlayers = players.filter((p) => p.fouledOut);
  const isSwapping = !!swappingPlayer && onCourtPlayers.some((p) => p.playerId === swappingPlayer);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{teamName}</h4>
          <span className="text-xs text-gray-500">
            {onCourtPlayers.length}/5 on court
          </span>
        </div>
      </div>

      {/* On Court Players */}
      <div className="px-3 py-2">
        <div className="text-xs text-gray-500 uppercase mb-1.5">On Court</div>
        <div className="space-y-1.5">
          {onCourtPlayers.map((player) => (
            <div
              key={player.id}
              className={`flex items-center justify-between py-1.5 px-2 rounded-lg transition-colors ${
                swappingPlayer === player.playerId
                  ? "bg-orange-100 dark:bg-orange-900/30 border border-orange-400"
                  : "bg-gray-50 dark:bg-gray-700/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xs">#{player.player?.number}</span>
                </div>
                <div>
                  <div className="text-gray-900 dark:text-white text-sm font-medium leading-tight">
                    {player.player?.name}
                  </div>
                  <FoulDots fouls={player.fouls} foulLimit={foulLimit} />
                </div>
              </div>
              {!disabled && (
                swappingPlayer === player.playerId ? (
                  <button
                    onClick={onCancelSwap}
                    className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded transition-colors"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    onClick={() => onStartSwap(player.playerId)}
                    disabled={isSwapping && swappingPlayer !== player.playerId}
                    className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium rounded hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors disabled:opacity-50"
                  >
                    SWAP
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bench */}
      <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700">
        <div className="text-xs text-gray-500 uppercase mb-1.5">Bench</div>
        <div className="flex flex-wrap gap-1.5">
          {benchPlayers.map((player) => (
            <button
              key={player.id}
              onClick={() => {
                if (isSwapping && swappingPlayer) {
                  onSwap(swappingPlayer, player.playerId);
                }
              }}
              disabled={!isSwapping || disabled}
              className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                isSwapping
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 cursor-pointer"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              #{player.player?.number}
            </button>
          ))}
          {benchPlayers.length === 0 && (
            <span className="text-xs text-gray-400 italic">No bench players</span>
          )}
        </div>
      </div>

      {/* Fouled Out */}
      {fouledOutPlayers.length > 0 && (
        <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-red-50 dark:bg-red-900/10">
          <div className="text-xs text-red-500 uppercase mb-1">Fouled Out</div>
          <div className="flex flex-wrap gap-1.5">
            {fouledOutPlayers.map((player) => (
              <span
                key={player.id}
                className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-xs line-through"
              >
                #{player.player?.number}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const LiveGame: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<"court" | "stats" | "substitutions">("court");
  const [pendingShot, setPendingShot] = useState<{
    x: number;
    y: number;
    is3pt: boolean;
    zoneName: string;
  } | null>(null);
  const [recentShots, setRecentShots] = useState<ShotLocation[]>([]);

  // New state for enhanced features
  const [actionHistory, setActionHistory] = useState<ActionHistoryItem[]>([]);
  const [showQuarterSelector, setShowQuarterSelector] = useState(false);
  const [showEndPeriodConfirm, setShowEndPeriodConfirm] = useState(false);
  const [showActionHistory, setShowActionHistory] = useState(false);
  const [quarterMinutes, setQuarterMinutes] = useState(12);
  const [foulLimitSetting, setFoulLimitSetting] = useState<5 | 6>(5);
  const [homeStarters, setHomeStarters] = useState<Id<"players">[]>([]);
  const [awayStarters, setAwayStarters] = useState<Id<"players">[]>([]);

  // State for rebound prompt after missed shots
  const [pendingRebound, setPendingRebound] = useState<{
    shooterPlayerId: Id<"players">;
    shooterTeamId: Id<"teams">;
    shotType: string;
    isHomeTeam: boolean;
  } | null>(null);

  // State for quick stat modal (non-shot stats)
  const [pendingQuickStat, setPendingQuickStat] = useState<StatType | null>(null);

  // Convex queries
  const gameData = useQuery(
    api.games.get,
    token && gameId ? { token, gameId: gameId as Id<"games"> } : "skip"
  );

  const liveStats = useQuery(
    api.stats.getLiveStats,
    token && gameId ? { token, gameId: gameId as Id<"games"> } : "skip"
  );

  // Convex mutations
  const startGame = useMutation(api.games.start);
  const pauseGame = useMutation(api.games.pause);
  const resumeGame = useMutation(api.games.resume);
  const endGame = useMutation(api.games.end);
  const recordStat = useMutation(api.stats.recordStat);
  const undoStat = useMutation(api.stats.undoStat);
  const substitute = useMutation(api.stats.substitute);
  const swapSubstituteMutation = useMutation(api.stats.swapSubstitute);
  const recordTeamReboundMutation = useMutation(api.stats.recordTeamRebound);
  const setQuarter = useMutation(api.games.setQuarter);
  const updateGameSettings = useMutation(api.games.updateGameSettings);

  // State for inline substitution swap
  const [swappingPlayer, setSwappingPlayer] = useState<Id<"players"> | null>(null);

  const game = gameData?.game;
  const stats = (liveStats?.stats || []) as PlayerStat[];
  const homeStats = stats.filter((s) => s.isHomeTeam);
  const awayStats = stats.filter((s) => !s.isHomeTeam);

  // Initialize starters with first 5 players from each team when data loads
  useEffect(() => {
    if (game?.status === "scheduled" && homeStats.length > 0 && awayStats.length > 0) {
      // Check if starters are already configured in gameSettings
      const settings = game.gameSettings as any;
      const existingStarters = settings?.startingFive;

      if (existingStarters?.homeTeam?.length > 0) {
        setHomeStarters(existingStarters.homeTeam);
      } else if (homeStarters.length === 0) {
        // Default to first 5 home players
        setHomeStarters(homeStats.slice(0, 5).map((s) => s.playerId));
      }

      if (existingStarters?.awayTeam?.length > 0) {
        setAwayStarters(existingStarters.awayTeam);
      } else if (awayStarters.length === 0) {
        // Default to first 5 away players
        setAwayStarters(awayStats.slice(0, 5).map((s) => s.playerId));
      }

      // Set quarter minutes from settings if available
      if (settings?.quarterMinutes && quarterMinutes === 12) {
        setQuarterMinutes(settings.quarterMinutes);
      }
    }
  }, [game?.status, game?.gameSettings, homeStats.length, awayStats.length]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleGameControl = async (action: "start" | "pause" | "resume" | "stop") => {
    if (!token || !gameId) return;

    try {
      const gameIdTyped = gameId as Id<"games">;
      switch (action) {
        case "start":
          // Save settings before starting if this is first start
          if (game?.status === "scheduled") {
            await handleUpdateSettings();
          }
          await startGame({ token, gameId: gameIdTyped });
          break;
        case "pause":
          await pauseGame({ token, gameId: gameIdTyped });
          break;
        case "resume":
          await resumeGame({ token, gameId: gameIdTyped });
          break;
        case "stop":
          // Show end period confirmation
          setShowEndPeriodConfirm(true);
          return;
      }
    } catch (error) {
      console.error(`Failed to ${action} game:`, error);
    }
  };

  const handleRecordStat = async (
    playerId: Id<"players">,
    statType: StatType,
    made?: boolean,
    shotLocation?: { x: number; y: number }
  ) => {
    if (!token || !gameId) return;

    // Find player info for action history
    const playerStat = stats.find((s) => s.playerId === playerId);
    if (!playerStat) return;

    try {
      await recordStat({
        token,
        gameId: gameId as Id<"games">,
        playerId,
        statType,
        made,
      });

      // Track action history for undo
      setActionHistory((prev) => [
        {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          playerId,
          playerName: playerStat.player?.name || "Unknown",
          playerNumber: playerStat.player?.number || 0,
          statType,
          made,
          timestamp: Date.now(),
        },
        ...prev.slice(0, 19), // Keep last 20 actions
      ]);

      // Track recent shots for visualization
      if (shotLocation && (statType === "shot2" || statType === "shot3")) {
        setRecentShots((prev) => [...prev.slice(-4), { ...shotLocation, made: made || false }]);
      }

      // Show rebound prompt after missed shots (with 500ms delay)
      const isMissedShot =
        (statType === "shot2" || statType === "shot3" || statType === "freethrow") &&
        made === false;

      if (isMissedShot) {
        setTimeout(() => {
          setPendingRebound({
            shooterPlayerId: playerId,
            shooterTeamId: playerStat.teamId,
            shotType: statType,
            isHomeTeam: playerStat.isHomeTeam,
          });
        }, 500);
      }
    } catch (error) {
      console.error("Failed to record stat:", error);
    }
  };

  // Undo the last recorded stat
  const handleUndo = async (action: ActionHistoryItem) => {
    if (!token || !gameId) return;

    try {
      await undoStat({
        token,
        gameId: gameId as Id<"games">,
        playerId: action.playerId,
        statType: action.statType,
        wasMade: action.made,
      });

      // Remove from action history
      setActionHistory((prev) => prev.filter((a) => a.id !== action.id));
    } catch (error) {
      console.error("Failed to undo stat:", error);
    }
  };

  // Handle quarter change
  const handleQuarterChange = async (quarter: number) => {
    if (!token || !gameId) return;

    try {
      await setQuarter({
        token,
        gameId: gameId as Id<"games">,
        quarter,
        resetTime: true,
      });
      setShowQuarterSelector(false);
    } catch (error) {
      console.error("Failed to change quarter:", error);
    }
  };

  // Handle end period - advances to next quarter or ends game if Q4
  const handleEndPeriod = async () => {
    if (!token || !gameId || !game) return;

    try {
      const currentQ = game.currentQuarter;

      if (currentQ >= 4) {
        // Q4 or later - end the game
        await endGame({
          token,
          gameId: gameId as Id<"games">,
          forceEnd: true,
        });
      } else {
        // Advance to next quarter (pause the game and set next quarter)
        await pauseGame({ token, gameId: gameId as Id<"games"> });
        await setQuarter({
          token,
          gameId: gameId as Id<"games">,
          quarter: currentQ + 1,
        });
      }
      setShowEndPeriodConfirm(false);
    } catch (error) {
      console.error("Failed to end period:", error);
    }
  };

  // Handle pre-game settings update
  const handleUpdateSettings = async () => {
    if (!token || !gameId) return;

    try {
      const startingFive = {
        homeTeam: homeStarters,
        awayTeam: awayStarters,
      };

      await updateGameSettings({
        token,
        gameId: gameId as Id<"games">,
        quarterMinutes,
        foulLimit: foulLimitSetting,
        startingFive: homeStarters.length > 0 || awayStarters.length > 0 ? startingFive : undefined,
      });
    } catch (error) {
      console.error("Failed to update settings:", error);
    }
  };

  // Toggle player in starting lineup
  const toggleStarter = (playerId: Id<"players">, isHomeTeam: boolean) => {
    const setStarters = isHomeTeam ? setHomeStarters : setAwayStarters;
    const starters = isHomeTeam ? homeStarters : awayStarters;

    if (starters.includes(playerId)) {
      setStarters(starters.filter((id) => id !== playerId));
    } else if (starters.length < 5) {
      setStarters([...starters, playerId]);
    }
  };

  const handleSubstitute = async (playerId: Id<"players">, isOnCourt: boolean) => {
    if (!token || !gameId) return;

    try {
      await substitute({
        token,
        gameId: gameId as Id<"games">,
        playerId,
        isOnCourt,
      });
    } catch (error) {
      console.error("Failed to substitute:", error);
    }
  };

  // Handle atomic swap substitution
  const handleSwapSubstitute = async (playerOutId: Id<"players">, playerInId: Id<"players">) => {
    if (!token || !gameId) return;

    try {
      await swapSubstituteMutation({
        token,
        gameId: gameId as Id<"games">,
        playerOutId,
        playerInId,
      });
      setSwappingPlayer(null);
    } catch (error) {
      console.error("Failed to swap players:", error);
      alert((error as Error).message || "Failed to swap players");
    }
  };

  // Handle player rebound from modal
  const handlePlayerRebound = async (playerId: Id<"players">, type: "offensive" | "defensive") => {
    if (!token || !gameId) return;

    try {
      const statType = type === "offensive" ? "offensiveRebound" : "defensiveRebound";
      await recordStat({
        token,
        gameId: gameId as Id<"games">,
        playerId,
        statType: statType as any,
      });
      setPendingRebound(null);
    } catch (error) {
      console.error("Failed to record rebound:", error);
    }
  };

  // Handle team rebound from modal
  const handleTeamRebound = async (teamId: Id<"teams">, type: "offensive" | "defensive") => {
    if (!token || !gameId) return;

    try {
      await recordTeamReboundMutation({
        token,
        gameId: gameId as Id<"games">,
        teamId,
        reboundType: type,
      });
      setPendingRebound(null);
    } catch (error) {
      console.error("Failed to record team rebound:", error);
    }
  };

  // Handle quick stat from modal (non-shot stats)
  const handleQuickStatFromModal = (playerId: Id<"players">) => {
    if (!pendingQuickStat) return;

    // For free throws, default to "made"
    const made = pendingQuickStat === "freethrow" ? true : undefined;
    handleRecordStat(playerId, pendingQuickStat, made);
    setPendingQuickStat(null);
  };

  // New court-first flow: click court -> show modal with all on-court players
  const handleCourtClick = (x: number, y: number, is3pt: boolean) => {
    const zoneName = getShotZoneName(x, y, is3pt);
    setPendingShot({ x, y, is3pt, zoneName });
  };

  // Handle shot recording from the new modal (player + made/missed in one action)
  const handleShotFromModal = (playerId: Id<"players">, made: boolean) => {
    if (!pendingShot) return;

    const statType = pendingShot.is3pt ? "shot3" : "shot2";
    handleRecordStat(playerId, statType, made, {
      x: pendingShot.x,
      y: pendingShot.y,
    });
    setPendingShot(null);
  };

  // Get all on-court players for the shot modal
  const allOnCourtPlayers = stats.filter((s) => s.isOnCourt);

  if (gameData === undefined || liveStats === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center py-12">
          <Icon
            name="basketball"
            size={48}
            className="mx-auto mb-4 text-gray-600 dark:text-gray-400"
          />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Game not found</h3>
          <p className="text-gray-600 dark:text-gray-400">The requested game could not be found.</p>
        </div>
      </div>
    );
  }

  const isActive = game.status === "active";
  const isPaused = game.status === "paused";
  const isCompleted = game.status === "completed";
  const isScheduled = game.status === "scheduled";
  const canRecordStats = isActive || isPaused;

  // Extract game settings
  const gameSettings = game.gameSettings as any || {};
  const quartersCompleted = gameSettings.quartersCompleted || [];
  const isQuickGame = gameSettings.isQuickGame || false;
  const configuredQuarterMinutes = gameSettings.quarterMinutes || 12;
  const foulLimit = (liveStats?.game as any)?.foulLimit || gameSettings.foulLimit || 5;

  // Get stat type label for action history
  const getStatLabel = (statType: StatType, made?: boolean) => {
    switch (statType) {
      case "shot2": return made ? "2PT Made" : "2PT Miss";
      case "shot3": return made ? "3PT Made" : "3PT Miss";
      case "freethrow": return made ? "FT Made" : "FT Miss";
      case "rebound": return "Rebound";
      case "assist": return "Assist";
      case "steal": return "Steal";
      case "block": return "Block";
      case "turnover": return "Turnover";
      case "foul": return "Foul";
      default: return statType;
    }
  };

  // Show pre-game configuration if game is scheduled
  if (isScheduled) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Cog6ToothIcon className="h-8 w-8 text-orange-500" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pre-Game Setup</h1>
                  <p className="text-gray-600 dark:text-gray-400">Configure game settings before starting</p>
                </div>
              </div>
              {isQuickGame && (
                <span className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full">Quick Game</span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-8 items-center py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300">{game.awayTeam?.name}</h2>
              </div>
              <div className="text-center text-2xl font-bold text-gray-500">VS</div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300">{game.homeTeam?.name}</h2>
              </div>
            </div>
          </div>

          {/* Game Settings Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Quarter Duration */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quarter Duration</h3>
              <div className="flex flex-wrap gap-3">
                {[5, 8, 10, 12].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setQuarterMinutes(mins)}
                    className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
                      quarterMinutes === mins
                        ? "bg-orange-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={quarterMinutes}
                    onChange={(e) => setQuarterMinutes(Math.min(20, Math.max(1, parseInt(e.target.value) || 12)))}
                    className="w-16 px-2 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                  />
                  <span className="text-gray-600 dark:text-gray-400 text-sm">min</span>
                </div>
              </div>
            </div>

            {/* Foul Limit */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Foul Limit</h3>
              <p className="text-sm text-gray-500 mb-4">Players foul out after this many fouls</p>
              <div className="flex gap-3">
                {[5, 6].map((limit) => (
                  <button
                    key={limit}
                    onClick={() => setFoulLimitSetting(limit as 5 | 6)}
                    className={`flex-1 px-6 py-3 rounded-xl font-medium transition-colors ${
                      foulLimitSetting === limit
                        ? "bg-orange-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {limit} Fouls
                    <div className="text-xs opacity-75 mt-0.5">
                      {limit === 5 ? "(HS/College)" : "(NBA/Pro)"}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Starting Five Selection */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Starting Lineups</h3>
            <p className="text-sm text-gray-500">First 5 players are selected by default. Tap to change.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Away Team Starters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{game.awayTeam?.name}</h3>
                <span className={`text-sm font-medium ${awayStarters.length === 5 ? "text-green-500" : "text-orange-500"}`}>{awayStarters.length}/5 selected</span>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {awayStats.map((stat) => (
                  <button
                    key={stat.id}
                    onClick={() => toggleStarter(stat.playerId, false)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      awayStarters.includes(stat.playerId)
                        ? "bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-500"
                        : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    <span className="text-gray-900 dark:text-white font-medium">
                      #{stat.player?.number} {stat.player?.name}
                    </span>
                    {awayStarters.includes(stat.playerId) && (
                      <CheckIcon className="h-5 w-5 text-orange-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Home Team Starters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{game.homeTeam?.name}</h3>
                <span className={`text-sm font-medium ${homeStarters.length === 5 ? "text-green-500" : "text-orange-500"}`}>{homeStarters.length}/5 selected</span>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {homeStats.map((stat) => (
                  <button
                    key={stat.id}
                    onClick={() => toggleStarter(stat.playerId, true)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      homeStarters.includes(stat.playerId)
                        ? "bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-500"
                        : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    <span className="text-gray-900 dark:text-white font-medium">
                      #{stat.player?.number} {stat.player?.name}
                    </span>
                    {homeStarters.includes(stat.playerId) && (
                      <CheckIcon className="h-5 w-5 text-orange-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Start Game Button */}
          <button
            onClick={() => handleGameControl("start")}
            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white text-lg font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <PlayIcon className="h-6 w-6" />
            Start Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Compact Scoreboard */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 mb-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {/* Away Team */}
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold text-gray-900 dark:text-white w-12 text-center">{game.awayScore}</div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 max-w-[100px] truncate">
              {game.awayTeam?.name}
            </div>
          </div>

          {/* Center: Period, Status, Controls */}
          <div className="flex items-center gap-3">
            {/* Quarter indicators */}
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((q) => (
                <div
                  key={q}
                  title={`Q${q}`}
                  className={`w-2 h-2 rounded-full ${
                    quartersCompleted.includes(q)
                      ? "bg-green-500"
                      : game.currentQuarter === q
                        ? "bg-orange-500"
                        : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
              ))}
            </div>

            {/* Period selector */}
            <div className="relative">
              <button
                onClick={() => !isCompleted && setShowQuarterSelector(!showQuarterSelector)}
                disabled={isCompleted}
                className={`text-sm font-bold px-2 py-1 rounded ${!isCompleted ? "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" : ""}`}
              >
                Q{game.currentQuarter}
              </button>
              {showQuarterSelector && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 p-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((q) => (
                      <button
                        key={q}
                        onClick={() => handleQuarterChange(q)}
                        className={`w-8 h-8 rounded font-bold text-sm ${
                          game.currentQuarter === q
                            ? "bg-orange-600 text-white"
                            : quartersCompleted.includes(q)
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700"
                              : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Status badge */}
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                isActive
                  ? "bg-red-600 text-white animate-pulse"
                  : isPaused
                    ? "bg-yellow-600 text-white"
                    : isCompleted
                      ? "bg-gray-600 text-white"
                      : "bg-blue-600 text-white"
              }`}
            >
              {isActive ? "LIVE" : isPaused ? "PAUSED" : isCompleted ? "FINAL" : "SCHEDULED"}
            </span>

            {/* Control buttons */}
            {!isCompleted && (
              <div className="flex gap-1">
                {actionHistory.length > 0 && (
                  <button
                    onClick={() => setShowActionHistory(!showActionHistory)}
                    className="p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    title="Undo"
                  >
                    <ArrowUturnLeftIcon className="h-4 w-4" />
                  </button>
                )}
                {!isActive && (
                  <button
                    onClick={() => handleGameControl(isPaused ? "resume" : "start")}
                    className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700"
                    title={isPaused ? "Resume" : "Start"}
                  >
                    <PlayIcon className="h-4 w-4" />
                  </button>
                )}
                {isActive && (
                  <button
                    onClick={() => handleGameControl("pause")}
                    className="p-1.5 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                    title="Pause"
                  >
                    <PauseIcon className="h-4 w-4" />
                  </button>
                )}
                {(isActive || isPaused) && (
                  <button
                    onClick={() => handleGameControl("stop")}
                    className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700"
                    title={`End Q${game.currentQuarter}`}
                  >
                    <StopIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Home Team */}
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 max-w-[100px] truncate text-right">
              {game.homeTeam?.name}
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white w-12 text-center">{game.homeScore}</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-6">
        {[
          { key: "court", label: "Court & Subs", icon: ChartBarIcon },
          { key: "stats", label: "Box Score", icon: UserGroupIcon },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-orange-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
            onClick={() => setActiveTab(tab.key as "court" | "stats")}
          >
            <tab.icon className="h-5 w-5 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "court" && (
        <>
        {/* Court and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Court - Takes up 2 columns on large screens */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-900 dark:text-white font-semibold">Tap Court to Record Shot</h3>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">2PT</span>
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">3PT</span>
              </div>
            </div>
            <MiniCourt
              onCourtClick={handleCourtClick}
              disabled={!canRecordStats}
              recentShots={recentShots}
            />
          </div>

          {/* Quick Stat Buttons - Opens modal to select player */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Quick Stats</h3>
            <p className="text-gray-500 text-xs mb-4">Tap a stat, then select the player</p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPendingQuickStat("assist")}
                disabled={!canRecordStats}
                className="py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl font-bold transition-colors"
              >
                <div className="text-sm">AST</div>
              </button>
              <button
                onClick={() => setPendingQuickStat("steal")}
                disabled={!canRecordStats}
                className="py-3 px-4 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl font-bold transition-colors"
              >
                <div className="text-sm">STL</div>
              </button>
              <button
                onClick={() => setPendingQuickStat("block")}
                disabled={!canRecordStats}
                className="py-3 px-4 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl font-bold transition-colors"
              >
                <div className="text-sm">BLK</div>
              </button>
              <button
                onClick={() => setPendingQuickStat("turnover")}
                disabled={!canRecordStats}
                className="py-3 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl font-bold transition-colors"
              >
                <div className="text-sm">TO</div>
              </button>
              <button
                onClick={() => setPendingQuickStat("foul")}
                disabled={!canRecordStats}
                className="py-3 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl font-bold transition-colors"
              >
                <div className="text-sm">FOUL</div>
              </button>
              <button
                onClick={() => setPendingQuickStat("freethrow")}
                disabled={!canRecordStats}
                className="py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl font-bold transition-colors"
              >
                <div className="text-sm">FT</div>
              </button>
            </div>
          </div>
        </div>

        {/* Inline Substitution Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          <InlineSubPanel
            teamName={game.awayTeam?.name || "Away"}
            teamId={game.awayTeam?.id as Id<"teams">}
            players={awayStats}
            foulLimit={foulLimit}
            onSwap={handleSwapSubstitute}
            swappingPlayer={swappingPlayer}
            onStartSwap={setSwappingPlayer}
            onCancelSwap={() => setSwappingPlayer(null)}
            disabled={isCompleted}
          />
          <InlineSubPanel
            teamName={game.homeTeam?.name || "Home"}
            teamId={game.homeTeam?.id as Id<"teams">}
            players={homeStats}
            foulLimit={foulLimit}
            onSwap={handleSwapSubstitute}
            swappingPlayer={swappingPlayer}
            onStartSwap={setSwappingPlayer}
            onCancelSwap={() => setSwappingPlayer(null)}
            disabled={isCompleted}
          />
        </div>
        </>
      )}

      {activeTab === "stats" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Away Team Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {game.awayTeam?.name} - Player Stats
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-300 dark:border-gray-600">
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Player
                    </th>
                    <th className="text-center py-2 px-2 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      PTS
                    </th>
                    <th className="text-center py-2 px-2 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      REB
                    </th>
                    <th className="text-center py-2 px-2 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      AST
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {awayStats.map((stat) => (
                    <tr key={stat.id} className={stat.isOnCourt ? "" : "opacity-50"}>
                      <td className="py-3 px-3 text-sm text-gray-900 dark:text-white">
                        #{stat.player?.number} {stat.player?.name}
                        {stat.isOnCourt && <span className="ml-2 text-green-400 text-xs">ON</span>}
                      </td>
                      <td className="py-3 px-2 text-center text-sm text-gray-900 dark:text-white font-bold">
                        {stat.points}
                      </td>
                      <td className="py-3 px-2 text-center text-sm text-gray-900 dark:text-white">
                        {stat.rebounds}
                      </td>
                      <td className="py-3 px-2 text-center text-sm text-gray-900 dark:text-white">
                        {stat.assists}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Home Team Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {game.homeTeam?.name} - Player Stats
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-300 dark:border-gray-600">
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Player
                    </th>
                    <th className="text-center py-2 px-2 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      PTS
                    </th>
                    <th className="text-center py-2 px-2 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      REB
                    </th>
                    <th className="text-center py-2 px-2 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      AST
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {homeStats.map((stat) => (
                    <tr key={stat.id} className={stat.isOnCourt ? "" : "opacity-50"}>
                      <td className="py-3 px-3 text-sm text-gray-900 dark:text-white">
                        #{stat.player?.number} {stat.player?.name}
                        {stat.isOnCourt && <span className="ml-2 text-green-400 text-xs">ON</span>}
                      </td>
                      <td className="py-3 px-2 text-center text-sm text-gray-900 dark:text-white font-bold">
                        {stat.points}
                      </td>
                      <td className="py-3 px-2 text-center text-sm text-gray-900 dark:text-white">
                        {stat.rebounds}
                      </td>
                      <td className="py-3 px-2 text-center text-sm text-gray-900 dark:text-white">
                        {stat.assists}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ShotRecordingModal
        isOpen={!!pendingShot}
        onClose={() => setPendingShot(null)}
        onRecord={handleShotFromModal}
        shotType={pendingShot?.is3pt ? "3pt" : "2pt"}
        zoneName={pendingShot?.zoneName || ""}
        onCourtPlayers={allOnCourtPlayers}
      />

      {/* Quick Stat Modal */}
      <QuickStatModal
        isOpen={!!pendingQuickStat}
        onClose={() => setPendingQuickStat(null)}
        onRecord={handleQuickStatFromModal}
        statType={pendingQuickStat}
        onCourtPlayers={allOnCourtPlayers}
      />

      {/* Rebound Prompt Modal */}
      {pendingRebound && game && (
        <ReboundPromptModal
          isOpen={!!pendingRebound}
          onClose={() => setPendingRebound(null)}
          onPlayerRebound={handlePlayerRebound}
          onTeamRebound={handleTeamRebound}
          shooterTeamId={pendingRebound.shooterTeamId}
          shooterTeamName={pendingRebound.isHomeTeam ? (game.homeTeam?.name || "Home") : (game.awayTeam?.name || "Away")}
          opposingTeamId={pendingRebound.isHomeTeam ? (game.awayTeam?.id as Id<"teams">) : (game.homeTeam?.id as Id<"teams">)}
          opposingTeamName={pendingRebound.isHomeTeam ? (game.awayTeam?.name || "Away") : (game.homeTeam?.name || "Home")}
          shooterTeamPlayers={pendingRebound.isHomeTeam ? homeStats : awayStats}
          opposingTeamPlayers={pendingRebound.isHomeTeam ? awayStats : homeStats}
          shotType={pendingRebound.shotType}
        />
      )}

      {/* Action History Panel */}
      {showActionHistory && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-96 max-h-[70vh] overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ArrowUturnLeftIcon className="h-5 w-5" />
                Action History
              </h3>
              <button
                onClick={() => setShowActionHistory(false)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <Icon name="x" size={24} />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(70vh-120px)]">
              {actionHistory.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No actions recorded yet
                </div>
              ) : (
                actionHistory.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div>
                      <div className="text-gray-900 dark:text-white font-medium">
                        #{action.playerNumber} {action.playerName}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400 text-sm">
                        {getStatLabel(action.statType, action.made)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUndo(action)}
                      className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      Undo
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <button
                onClick={() => setShowActionHistory(false)}
                className="w-full py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Period Confirmation Modal */}
      {showEndPeriodConfirm && game && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-96 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                game.currentQuarter >= 4
                  ? "bg-red-100 dark:bg-red-900/30"
                  : "bg-orange-100 dark:bg-orange-900/30"
              }`}>
                <StopIcon className={`h-6 w-6 ${
                  game.currentQuarter >= 4 ? "text-red-600" : "text-orange-600"
                }`} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {game.currentQuarter >= 4 ? "End Game?" : `End Quarter ${game.currentQuarter}?`}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {game.currentQuarter >= 4
                    ? "This will mark the game as complete"
                    : `Move to Q${game.currentQuarter + 1}`
                  }
                </p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4].map((q) => (
                  <div
                    key={q}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                      quartersCompleted.includes(q)
                        ? "bg-green-500 text-white"
                        : game.currentQuarter === q
                          ? "bg-orange-500 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                    }`}
                  >
                    Q{q}
                  </div>
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
                {game.currentQuarter >= 4
                  ? "The game will be marked as final."
                  : `Quarter ${game.currentQuarter} will be marked complete and the game will pause for Q${game.currentQuarter + 1}.`
                }
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEndPeriodConfirm(false)}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEndPeriod}
                className={`flex-1 py-3 text-white rounded-xl font-medium transition-colors ${
                  game.currentQuarter >= 4
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-orange-600 hover:bg-orange-700"
                }`}
              >
                {game.currentQuarter >= 4 ? "End Game" : `End Q${game.currentQuarter}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveGame;
