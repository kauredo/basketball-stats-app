import React, { useState, useCallback, useRef } from "react";
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
} from "@heroicons/react/24/outline";
import Icon from "../components/Icon";
import { COLORS, svgToCourtCoords, getShotZone } from "@basketball-stats/shared";

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
  player: {
    number: number;
    name: string;
    position?: string;
  } | null;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
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

  const handleClick = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      if (disabled || !svgRef.current) return;

      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      const scaleX = 300 / rect.width;
      const scaleY = 180 / rect.height;

      const svgX = (event.clientX - rect.left) * scaleX;
      const svgY = (event.clientY - rect.top) * scaleY;

      // Convert to court coordinates
      const courtX = (svgX / 300) * 50 - 25;
      const courtY = (svgY / 180) * 28;

      // Determine if it's a 3-pointer
      const distanceFromBasket = Math.sqrt(courtX * courtX + (courtY - 5.25) ** 2);
      const is3pt = distanceFromBasket > 23.75 || (Math.abs(courtX) > 22 && courtY < 14);

      // Show ripple effect
      setRipple({ x: svgX, y: svgY });
      setTimeout(() => setRipple(null), 400);

      onCourtClick(courtX, courtY, is3pt);
    },
    [disabled, onCourtClick]
  );

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox="0 0 300 180"
        className={`w-full rounded-lg ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-crosshair hover:shadow-lg hover:shadow-orange-500/20"}`}
        onClick={handleClick}
      >
        {/* Court background */}
        <rect x="0" y="0" width="300" height="180" fill={COLORS.court.background} rx="8" />

        {/* Paint area */}
        <rect x="102" y="0" width="96" height="90" fill="none" stroke="#4B5563" strokeWidth="1" />

        {/* Free throw circle */}
        <circle cx="150" cy="90" r="24" fill="none" stroke="#4B5563" strokeWidth="1" />

        {/* Restricted area */}
        <path d="M 126 0 A 24 24 0 0 0 174 0" fill="none" stroke="#4B5563" strokeWidth="1" />

        {/* Basket */}
        <circle cx="150" cy="24" r="4" fill={COLORS.primary[500]} />

        {/* Three-point line */}
        <path
          d="M 18 0 L 18 60 A 120 120 0 0 0 282 60 L 282 0"
          fill="none"
          stroke="#4B5563"
          strokeWidth="1"
        />

        {/* Zone hints */}
        <circle cx="150" cy="140" r="15" fill="rgba(239, 68, 68, 0.2)" />
        <text x="150" y="143" textAnchor="middle" fill="#9CA3AF" fontSize="8">
          3PT
        </text>
        <circle cx="150" cy="60" r="12" fill="rgba(34, 197, 94, 0.2)" />
        <text x="150" y="63" textAnchor="middle" fill="#9CA3AF" fontSize="8">
          2PT
        </text>

        {/* Recent shots */}
        {recentShots.slice(-5).map((shot, index) => {
          const svgX = ((shot.x + 25) / 50) * 300;
          const svgY = (shot.y / 28) * 180;
          return (
            <circle
              key={index}
              cx={svgX}
              cy={svgY}
              r={5}
              fill={shot.made ? COLORS.shots.made2pt : COLORS.shots.missed2pt}
              stroke="#fff"
              strokeWidth="1"
              opacity={0.8}
              className="transition-all duration-300"
            />
          );
        })}

        {/* Ripple effect */}
        {ripple && (
          <circle
            cx={ripple.x}
            cy={ripple.y}
            r="10"
            fill={COLORS.primary[500]}
            className="animate-ping"
            opacity="0.5"
          />
        )}
      </svg>

      {!disabled && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 rounded text-xs text-gray-700 dark:text-gray-300">
          Click to record shot location
        </div>
      )}
    </div>
  );
};

// Shot Type Modal
interface ShotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMade: () => void;
  onMissed: () => void;
  shotType: "2pt" | "3pt";
}

const ShotModal: React.FC<ShotModalProps> = ({ isOpen, onClose, onMade, onMissed, shotType }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-96 border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
          {shotType === "3pt" ? "3-Point Shot" : "2-Point Shot"}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">Did the shot go in?</p>

        <div className="flex gap-4">
          <button
            onClick={onMade}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold transition-colors"
          >
            <div>MADE</div>
            <div className="text-green-200 text-sm">+{shotType === "3pt" ? "3" : "2"} PTS</div>
          </button>
          <button
            onClick={onMissed}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold transition-colors"
          >
            <div>MISSED</div>
            <div className="text-red-200 text-sm">0 PTS</div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// Player Selection Modal
interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (player: PlayerStat) => void;
  players: PlayerStat[];
}

const PlayerModal: React.FC<PlayerModalProps> = ({ isOpen, onClose, onSelect, players }) => {
  if (!isOpen) return null;

  const onCourtPlayers = players.filter((p) => p.isOnCourt);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-96 max-h-[70vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Select Player</h3>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <Icon name="x" size={24} />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 text-xs uppercase">
            On Court
          </div>
          {onCourtPlayers.map((player) => (
            <button
              key={player.id}
              onClick={() => {
                onSelect(player);
                onClose();
              }}
              className="w-full p-4 border-b border-gray-200 dark:border-gray-700 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-bold">#{player.player?.number}</span>
              </div>
              <div className="flex-1 text-left">
                <div className="text-gray-900 dark:text-white font-medium">
                  {player.player?.name}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">
                  PTS: {player.points} • REB: {player.rebounds} • AST: {player.assists}
                </div>
              </div>
              <div className="bg-green-600 px-2 py-1 rounded text-white text-xs">ON</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Stat Button Component
interface StatButtonProps {
  label: string;
  shortLabel: string;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}

const StatButton: React.FC<StatButtonProps> = ({ label, shortLabel, color, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex-1 py-4 rounded-xl font-bold transition-all ${
      disabled
        ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700"
        : "hover:scale-105 active:scale-95"
    }`}
    style={{ backgroundColor: disabled ? undefined : color }}
  >
    <div className="text-white text-sm">{label}</div>
    <div className="text-white/70 text-xs">{shortLabel}</div>
  </button>
);

const LiveGame: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<"court" | "stats" | "substitutions">("court");
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStat | null>(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [pendingShot, setPendingShot] = useState<{ x: number; y: number; is3pt: boolean } | null>(
    null
  );
  const [recentShots, setRecentShots] = useState<ShotLocation[]>([]);

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

  const game = gameData?.game;
  const stats = (liveStats?.stats || []) as PlayerStat[];
  const homeStats = stats.filter((s) => s.isHomeTeam);
  const awayStats = stats.filter((s) => !s.isHomeTeam);

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
          await startGame({ token, gameId: gameIdTyped });
          break;
        case "pause":
          await pauseGame({ token, gameId: gameIdTyped });
          break;
        case "resume":
          await resumeGame({ token, gameId: gameIdTyped });
          break;
        case "stop":
          await endGame({ token, gameId: gameIdTyped });
          break;
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

    try {
      await recordStat({
        token,
        gameId: gameId as Id<"games">,
        playerId,
        statType,
        made,
      });

      // Track recent shots for visualization
      if (shotLocation && (statType === "shot2" || statType === "shot3")) {
        setRecentShots((prev) => [...prev.slice(-4), { ...shotLocation, made: made || false }]);
      }
    } catch (error) {
      console.error("Failed to record stat:", error);
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

  const handleCourtClick = (x: number, y: number, is3pt: boolean) => {
    if (!selectedPlayer) {
      setShowPlayerModal(true);
      return;
    }
    setPendingShot({ x, y, is3pt });
  };

  const handleShotResult = (made: boolean) => {
    if (!pendingShot || !selectedPlayer) return;

    const statType = pendingShot.is3pt ? "shot3" : "shot2";
    handleRecordStat(selectedPlayer.playerId, statType, made, {
      x: pendingShot.x,
      y: pendingShot.y,
    });
    setPendingShot(null);
  };

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
  const canRecordStats = isActive;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Compact Header with Scoreboard */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-8 items-center">
          {/* Away Team */}
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
              {game.awayTeam?.name}
            </h2>
            <div className="text-5xl font-bold text-gray-900 dark:text-white">{game.awayScore}</div>
          </div>

          {/* Game Clock and Controls */}
          <div className="text-center">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                PERIOD {game.currentQuarter}
              </div>
              <div className="text-4xl font-mono font-bold text-gray-900 dark:text-white flex items-center justify-center">
                <ClockIcon className="h-8 w-8 mr-2" />
                {formatTime(game.timeRemainingSeconds)}
              </div>
              <div className="mt-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
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
              </div>
            </div>

            <div className="flex justify-center space-x-3">
              {!isActive && !isCompleted && (
                <button
                  onClick={() => handleGameControl(isPaused ? "resume" : "start")}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <PlayIcon className="h-5 w-5 mr-2" />
                  {isPaused ? "Resume" : "Start"}
                </button>
              )}
              {isActive && (
                <button
                  onClick={() => handleGameControl("pause")}
                  className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  <PauseIcon className="h-5 w-5 mr-2" />
                  Pause
                </button>
              )}
              {!isCompleted && (isActive || isPaused) && (
                <button
                  onClick={() => handleGameControl("stop")}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <StopIcon className="h-5 w-5 mr-2" />
                  End
                </button>
              )}
            </div>
          </div>

          {/* Home Team */}
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
              {game.homeTeam?.name}
            </h2>
            <div className="text-5xl font-bold text-gray-900 dark:text-white">{game.homeScore}</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-6">
        {[
          { key: "court", label: "Court", icon: ChartBarIcon },
          { key: "stats", label: "Player Stats", icon: UserGroupIcon },
          { key: "substitutions", label: "Substitutions", icon: UserGroupIcon },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-orange-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
            onClick={() => setActiveTab(tab.key as any)}
          >
            <tab.icon className="h-5 w-5 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "court" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Court and Player Selection */}
          <div className="space-y-6">
            {/* Player Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-gray-900 dark:text-white font-semibold mb-3">Selected Player</h3>
              <button
                onClick={() => setShowPlayerModal(true)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {selectedPlayer ? (
                  <>
                    <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white font-bold">#{selectedPlayer.player?.number}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-gray-900 dark:text-white font-medium">
                        {selectedPlayer.player?.name}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400 text-sm">
                        {selectedPlayer.isHomeTeam ? game.homeTeam?.name : game.awayTeam?.name}
                      </div>
                    </div>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Change</span>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mr-3">
                      <Icon name="user" size={20} className="text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-gray-600 dark:text-gray-400">Select Player</div>
                      <div className="text-gray-500 text-sm">
                        Click to choose who to record stats for
                      </div>
                    </div>
                  </>
                )}
              </button>
            </div>

            {/* Mini Court */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-gray-900 dark:text-white font-semibold mb-3">Shot Location</h3>
              <MiniCourt
                onCourtClick={handleCourtClick}
                disabled={!canRecordStats}
                recentShots={recentShots}
              />
            </div>
          </div>

          {/* Right Column - Stat Buttons */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Quick Stats</h3>

            {/* Scoring */}
            <div className="mb-4">
              <div className="text-gray-500 text-xs uppercase mb-2">Scoring</div>
              <div className="flex gap-2">
                <StatButton
                  label="2PT"
                  shortLabel="+2"
                  color="#22C55E"
                  disabled={!canRecordStats || !selectedPlayer}
                  onClick={() =>
                    selectedPlayer && handleRecordStat(selectedPlayer.playerId, "shot2", true)
                  }
                />
                <StatButton
                  label="3PT"
                  shortLabel="+3"
                  color="#22C55E"
                  disabled={!canRecordStats || !selectedPlayer}
                  onClick={() =>
                    selectedPlayer && handleRecordStat(selectedPlayer.playerId, "shot3", true)
                  }
                />
                <StatButton
                  label="FT"
                  shortLabel="+1"
                  color="#22C55E"
                  disabled={!canRecordStats || !selectedPlayer}
                  onClick={() =>
                    selectedPlayer && handleRecordStat(selectedPlayer.playerId, "freethrow", true)
                  }
                />
                <StatButton
                  label="MISS"
                  shortLabel="×"
                  color="#EF4444"
                  disabled={!canRecordStats || !selectedPlayer}
                  onClick={() =>
                    selectedPlayer && handleRecordStat(selectedPlayer.playerId, "shot2", false)
                  }
                />
              </div>
            </div>

            {/* Other Stats */}
            <div>
              <div className="text-gray-500 text-xs uppercase mb-2">Other</div>
              <div className="flex gap-2 mb-2">
                <StatButton
                  label="REB"
                  shortLabel="+R"
                  color="#3B82F6"
                  disabled={!canRecordStats || !selectedPlayer}
                  onClick={() =>
                    selectedPlayer && handleRecordStat(selectedPlayer.playerId, "rebound")
                  }
                />
                <StatButton
                  label="AST"
                  shortLabel="+A"
                  color="#8B5CF6"
                  disabled={!canRecordStats || !selectedPlayer}
                  onClick={() =>
                    selectedPlayer && handleRecordStat(selectedPlayer.playerId, "assist")
                  }
                />
                <StatButton
                  label="STL"
                  shortLabel="+S"
                  color="#06B6D4"
                  disabled={!canRecordStats || !selectedPlayer}
                  onClick={() =>
                    selectedPlayer && handleRecordStat(selectedPlayer.playerId, "steal")
                  }
                />
                <StatButton
                  label="BLK"
                  shortLabel="+B"
                  color="#06B6D4"
                  disabled={!canRecordStats || !selectedPlayer}
                  onClick={() =>
                    selectedPlayer && handleRecordStat(selectedPlayer.playerId, "block")
                  }
                />
              </div>
              <div className="flex gap-2">
                <StatButton
                  label="TO"
                  shortLabel="+T"
                  color="#F59E0B"
                  disabled={!canRecordStats || !selectedPlayer}
                  onClick={() =>
                    selectedPlayer && handleRecordStat(selectedPlayer.playerId, "turnover")
                  }
                />
                <StatButton
                  label="FOUL"
                  shortLabel="+F"
                  color="#F59E0B"
                  disabled={!canRecordStats || !selectedPlayer}
                  onClick={() =>
                    selectedPlayer && handleRecordStat(selectedPlayer.playerId, "foul")
                  }
                />
                <div className="flex-1" />
                <div className="flex-1" />
              </div>
            </div>
          </div>
        </div>
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

      {activeTab === "substitutions" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Away Team Substitutions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {game.awayTeam?.name} - Roster
            </h3>
            <div className="space-y-2">
              {awayStats.map((stat) => (
                <div
                  key={stat.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    stat.isOnCourt
                      ? "bg-green-900/30 border border-green-700"
                      : "bg-gray-100 dark:bg-gray-700"
                  }`}
                >
                  <div>
                    <span className="text-gray-900 dark:text-white font-medium">
                      #{stat.player?.number} {stat.player?.name}
                    </span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400 text-sm">
                      {stat.player?.position}
                    </span>
                  </div>
                  <button
                    onClick={() => handleSubstitute(stat.playerId, !stat.isOnCourt)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      stat.isOnCourt
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                    disabled={!isActive && !isPaused}
                  >
                    {stat.isOnCourt ? "Sub Out" : "Sub In"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Home Team Substitutions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {game.homeTeam?.name} - Roster
            </h3>
            <div className="space-y-2">
              {homeStats.map((stat) => (
                <div
                  key={stat.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    stat.isOnCourt
                      ? "bg-green-900/30 border border-green-700"
                      : "bg-gray-100 dark:bg-gray-700"
                  }`}
                >
                  <div>
                    <span className="text-gray-900 dark:text-white font-medium">
                      #{stat.player?.number} {stat.player?.name}
                    </span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400 text-sm">
                      {stat.player?.position}
                    </span>
                  </div>
                  <button
                    onClick={() => handleSubstitute(stat.playerId, !stat.isOnCourt)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      stat.isOnCourt
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                    disabled={!isActive && !isPaused}
                  >
                    {stat.isOnCourt ? "Sub Out" : "Sub In"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <PlayerModal
        isOpen={showPlayerModal}
        onClose={() => setShowPlayerModal(false)}
        onSelect={setSelectedPlayer}
        players={stats}
      />

      <ShotModal
        isOpen={!!pendingShot}
        onClose={() => setPendingShot(null)}
        onMade={() => handleShotResult(true)}
        onMissed={() => handleShotResult(false)}
        shotType={pendingShot?.is3pt ? "3pt" : "2pt"}
      />
    </div>
  );
};

export default LiveGame;
