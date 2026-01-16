import React, { useState } from "react";
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

const LiveGame: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<"scoreboard" | "stats" | "substitutions">(
    "scoreboard"
  );

  // Convex queries - automatically update in real-time
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
  const stats = liveStats?.stats || [];

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

  const handleRecordStat = async (playerId: Id<"players">, statType: StatType, made?: boolean) => {
    if (!token || !gameId) return;

    try {
      await recordStat({
        token,
        gameId: gameId as Id<"games">,
        playerId,
        statType,
        made,
      });
    } catch (error) {
      console.error("Failed to record stat:", error);
    }
  };

  const handleUndoStat = async (playerId: Id<"players">, statType: StatType, wasMade?: boolean) => {
    if (!token || !gameId) return;

    try {
      await undoStat({
        token,
        gameId: gameId as Id<"games">,
        playerId,
        statType,
        wasMade,
      });
    } catch (error) {
      console.error("Failed to undo stat:", error);
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

  if (gameData === undefined || liveStats === undefined) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center py-12">
          <Icon name="basketball" size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-white mb-2">Game not found</h3>
          <p className="text-gray-400">The requested game could not be found.</p>
        </div>
      </div>
    );
  }

  const isActive = game.status === "active";
  const isPaused = game.status === "paused";
  const isCompleted = game.status === "completed";

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Live Game Control</h1>
        <p className="text-gray-400">
          {game.awayTeam?.name} @ {game.homeTeam?.name}
        </p>
      </div>

      {/* Main Scoreboard */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
        <div className="grid grid-cols-3 gap-8 items-center">
          {/* Away Team */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">{game.awayTeam?.name}</h2>
            <div className="text-5xl font-bold text-orange-500">{game.awayScore}</div>
            <div className="mt-4 space-x-2">
              <button
                onClick={() => {
                  const firstAwayPlayer = awayStats[0]?.playerId;
                  if (firstAwayPlayer) handleRecordStat(firstAwayPlayer, "freethrow", true);
                }}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                disabled={!isActive}
              >
                +1
              </button>
              <button
                onClick={() => {
                  const firstAwayPlayer = awayStats[0]?.playerId;
                  if (firstAwayPlayer) handleRecordStat(firstAwayPlayer, "shot2", true);
                }}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                disabled={!isActive}
              >
                +2
              </button>
              <button
                onClick={() => {
                  const firstAwayPlayer = awayStats[0]?.playerId;
                  if (firstAwayPlayer) handleRecordStat(firstAwayPlayer, "shot3", true);
                }}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                disabled={!isActive}
              >
                +3
              </button>
            </div>
          </div>

          {/* Game Clock and Controls */}
          <div className="text-center">
            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-400 mb-1">PERIOD {game.currentQuarter}</div>
              <div className="text-4xl font-mono font-bold text-white flex items-center justify-center">
                <ClockIcon className="h-8 w-8 mr-2" />
                {formatTime(game.timeRemainingSeconds)}
              </div>
              <div className="mt-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    isActive
                      ? "bg-green-600 text-white"
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
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <PlayIcon className="h-5 w-5 mr-2" />
                  {isPaused ? "Resume" : "Start"}
                </button>
              )}
              {isActive && (
                <button
                  onClick={() => handleGameControl("pause")}
                  className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  <PauseIcon className="h-5 w-5 mr-2" />
                  Pause
                </button>
              )}
              {!isCompleted && (isActive || isPaused) && (
                <button
                  onClick={() => handleGameControl("stop")}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <StopIcon className="h-5 w-5 mr-2" />
                  End Game
                </button>
              )}
            </div>
          </div>

          {/* Home Team */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">{game.homeTeam?.name}</h2>
            <div className="text-5xl font-bold text-orange-500">{game.homeScore}</div>
            <div className="mt-4 space-x-2">
              <button
                onClick={() => {
                  const firstHomePlayer = homeStats[0]?.playerId;
                  if (firstHomePlayer) handleRecordStat(firstHomePlayer, "freethrow", true);
                }}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                disabled={!isActive}
              >
                +1
              </button>
              <button
                onClick={() => {
                  const firstHomePlayer = homeStats[0]?.playerId;
                  if (firstHomePlayer) handleRecordStat(firstHomePlayer, "shot2", true);
                }}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                disabled={!isActive}
              >
                +2
              </button>
              <button
                onClick={() => {
                  const firstHomePlayer = homeStats[0]?.playerId;
                  if (firstHomePlayer) handleRecordStat(firstHomePlayer, "shot3", true);
                }}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                disabled={!isActive}
              >
                +3
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-700 mb-6">
        <nav className="flex space-x-8">
          {[
            { key: "scoreboard", label: "Scoreboard", icon: ChartBarIcon },
            { key: "stats", label: "Player Stats", icon: UserGroupIcon },
            { key: "substitutions", label: "Substitutions", icon: UserGroupIcon },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? "border-orange-500 text-orange-500"
                  : "border-transparent text-gray-300 hover:text-white hover:border-gray-300"
              }`}
              onClick={() => setActiveTab(tab.key as any)}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "scoreboard" && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Game Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-white mb-3">Game Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span
                    className={`font-medium ${
                      isActive ? "text-green-400" : isPaused ? "text-yellow-400" : "text-gray-400"
                    }`}
                  >
                    {isActive ? "Live" : isPaused ? "Paused" : isCompleted ? "Final" : "Scheduled"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Period:</span>
                  <span className="text-white">{game.currentQuarter}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Time:</span>
                  <span className="text-white font-mono">
                    {formatTime(game.timeRemainingSeconds)}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-white mb-3">Score Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">{game.awayTeam?.name}:</span>
                  <span className="text-white font-bold text-lg">{game.awayScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{game.homeTeam?.name}:</span>
                  <span className="text-white font-bold text-lg">{game.homeScore}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-600">
                  <span className="text-gray-400">Lead:</span>
                  <span className="text-orange-400 font-medium">
                    {game.homeScore === game.awayScore
                      ? "Tied"
                      : `${game.homeScore > game.awayScore ? game.homeTeam?.name : game.awayTeam?.name} by ${Math.abs(
                          game.homeScore - game.awayScore
                        )}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "stats" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Away Team Stats */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              {game.awayTeam?.name} - Player Stats
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-300 uppercase">
                      Player
                    </th>
                    <th className="text-center py-2 px-2 text-xs font-medium text-gray-300 uppercase">
                      PTS
                    </th>
                    <th className="text-center py-2 px-2 text-xs font-medium text-gray-300 uppercase">
                      REB
                    </th>
                    <th className="text-center py-2 px-2 text-xs font-medium text-gray-300 uppercase">
                      AST
                    </th>
                    <th className="text-center py-2 px-2 text-xs font-medium text-gray-300 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {awayStats.map((stat) => (
                    <tr key={stat.id} className={stat.isOnCourt ? "" : "opacity-50"}>
                      <td className="py-2 px-3 text-sm text-white">
                        #{stat.player?.number} {stat.player?.name}
                        {stat.isOnCourt && <span className="ml-2 text-green-400 text-xs">ON</span>}
                      </td>
                      <td className="py-2 px-2 text-center text-sm text-white">{stat.points}</td>
                      <td className="py-2 px-2 text-center text-sm text-white">{stat.rebounds}</td>
                      <td className="py-2 px-2 text-center text-sm text-white">{stat.assists}</td>
                      <td className="py-2 px-2 text-center">
                        <div className="flex justify-center space-x-1">
                          <button
                            onClick={() => handleRecordStat(stat.playerId, "shot2", true)}
                            className="px-1 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            disabled={!isActive}
                          >
                            +2
                          </button>
                          <button
                            onClick={() => handleRecordStat(stat.playerId, "rebound")}
                            className="px-1 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            disabled={!isActive}
                          >
                            +R
                          </button>
                          <button
                            onClick={() => handleRecordStat(stat.playerId, "assist")}
                            className="px-1 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                            disabled={!isActive}
                          >
                            +A
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Home Team Stats */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              {game.homeTeam?.name} - Player Stats
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-300 uppercase">
                      Player
                    </th>
                    <th className="text-center py-2 px-2 text-xs font-medium text-gray-300 uppercase">
                      PTS
                    </th>
                    <th className="text-center py-2 px-2 text-xs font-medium text-gray-300 uppercase">
                      REB
                    </th>
                    <th className="text-center py-2 px-2 text-xs font-medium text-gray-300 uppercase">
                      AST
                    </th>
                    <th className="text-center py-2 px-2 text-xs font-medium text-gray-300 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {homeStats.map((stat) => (
                    <tr key={stat.id} className={stat.isOnCourt ? "" : "opacity-50"}>
                      <td className="py-2 px-3 text-sm text-white">
                        #{stat.player?.number} {stat.player?.name}
                        {stat.isOnCourt && <span className="ml-2 text-green-400 text-xs">ON</span>}
                      </td>
                      <td className="py-2 px-2 text-center text-sm text-white">{stat.points}</td>
                      <td className="py-2 px-2 text-center text-sm text-white">{stat.rebounds}</td>
                      <td className="py-2 px-2 text-center text-sm text-white">{stat.assists}</td>
                      <td className="py-2 px-2 text-center">
                        <div className="flex justify-center space-x-1">
                          <button
                            onClick={() => handleRecordStat(stat.playerId, "shot2", true)}
                            className="px-1 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            disabled={!isActive}
                          >
                            +2
                          </button>
                          <button
                            onClick={() => handleRecordStat(stat.playerId, "rebound")}
                            className="px-1 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            disabled={!isActive}
                          >
                            +R
                          </button>
                          <button
                            onClick={() => handleRecordStat(stat.playerId, "assist")}
                            className="px-1 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                            disabled={!isActive}
                          >
                            +A
                          </button>
                        </div>
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
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              {game.awayTeam?.name} - Roster
            </h3>
            <div className="space-y-2">
              {awayStats.map((stat) => (
                <div
                  key={stat.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    stat.isOnCourt ? "bg-green-900/30 border border-green-700" : "bg-gray-700"
                  }`}
                >
                  <div>
                    <span className="text-white font-medium">
                      #{stat.player?.number} {stat.player?.name}
                    </span>
                    <span className="ml-2 text-gray-400 text-sm">{stat.player?.position}</span>
                  </div>
                  <button
                    onClick={() => handleSubstitute(stat.playerId, !stat.isOnCourt)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
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
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              {game.homeTeam?.name} - Roster
            </h3>
            <div className="space-y-2">
              {homeStats.map((stat) => (
                <div
                  key={stat.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    stat.isOnCourt ? "bg-green-900/30 border border-green-700" : "bg-gray-700"
                  }`}
                >
                  <div>
                    <span className="text-white font-medium">
                      #{stat.player?.number} {stat.player?.name}
                    </span>
                    <span className="ml-2 text-gray-400 text-sm">{stat.player?.position}</span>
                  </div>
                  <button
                    onClick={() => handleSubstitute(stat.playerId, !stat.isOnCourt)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
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
    </div>
  );
};

export default LiveGame;
