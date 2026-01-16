import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import Icon from "../components/Icon";

import {
  basketballAPI,
  Game,
  Player,
  basketballWebSocket,
} from "@basketball-stats/shared";

interface GameState {
  isActive: boolean;
  isPaused: boolean;
  period: number;
  timeRemaining: number; // in seconds
  homeScore: number;
  awayScore: number;
}

interface PlayerStats {
  playerId: number;
  points: number;
  rebounds: number;
  assists: number;
  fouls: number;
  isPlaying: boolean;
}

const LiveGame: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    isActive: false,
    isPaused: false,
    period: 1,
    timeRemaining: 12 * 60, // 12 minutes in seconds
    homeScore: 0,
    awayScore: 0,
  });
  const [homePlayers, setHomePlayers] = useState<PlayerStats[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<PlayerStats[]>([]);
  const [activeTab, setActiveTab] = useState<
    "scoreboard" | "stats" | "substitutions"
  >("scoreboard");

  const { data: gameData, isLoading } = useQuery({
    queryKey: ["game", gameId],
    queryFn: () =>
      gameId
        ? basketballAPI.getGame(parseInt(gameId))
        : Promise.reject("No game ID"),
    enabled: !!gameId,
  });

  useEffect(() => {
    if (gameData?.game) {
      setGame(gameData.game);

      // Initialize player stats
      const initHomeStats: PlayerStats[] =
        gameData.game.home_team.players?.map((player: Player) => ({
          playerId: player.id,
          points: 0,
          rebounds: 0,
          assists: 0,
          fouls: 0,
          isPlaying: true, // Assuming starting lineup
        })) || [];

      const initAwayStats: PlayerStats[] =
        gameData.game.away_team.players?.map((player: Player) => ({
          playerId: player.id,
          points: 0,
          rebounds: 0,
          assists: 0,
          fouls: 0,
          isPlaying: true,
        })) || [];

      setHomePlayers(initHomeStats.slice(0, 5)); // Starting 5
      setAwayPlayers(initAwayStats.slice(0, 5));
    }
  }, [gameData]);

  useEffect(() => {
    if (gameId) {
      basketballWebSocket.connect();
      basketballWebSocket.subscribeToGame(parseInt(gameId));

      basketballWebSocket.on("game_update", data => {
        if (data.game) {
          setGame(data.game);
        }
        if (data.gameState) {
          setGameState(data.gameState);
        }
      });

      basketballWebSocket.on("timer_update", data => {
        if (data.gameState) {
          setGameState(prev => ({
            ...prev,
            timeRemaining: data.gameState.timeRemaining,
            period: data.gameState.period,
          }));
        }
      });

      basketballWebSocket.on("stats_update", data => {
        if (data.playerStats) {
          const { playerId, team, stats } = data.playerStats;
          const setPlayers = team === "home" ? setHomePlayers : setAwayPlayers;

          setPlayers(prev =>
            prev.map(player =>
              player.playerId === playerId ? { ...player, ...stats } : player
            )
          );
        }
      });

      return () => {
        basketballWebSocket.unsubscribeFromGame();
      };
    }
  }, [gameId]);

  // Game timer effect with WebSocket sync
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (
      gameState.isActive &&
      !gameState.isPaused &&
      gameState.timeRemaining > 0
    ) {
      interval = setInterval(() => {
        setGameState(prev => {
          const newState = {
            ...prev,
            timeRemaining: Math.max(0, prev.timeRemaining - 1),
          };

          // Sync timer update via WebSocket
          if (gameId) {
            basketballWebSocket.updateTimer(
              newState.timeRemaining,
              newState.period
            );
          }

          return newState;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState.isActive, gameState.isPaused, gameState.timeRemaining, gameId]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleGameControl = async (action: "start" | "pause" | "stop") => {
    if (!game || !gameId) return;

    try {
      let response;
      switch (action) {
        case "start":
          response = await basketballAPI.startGame(parseInt(gameId));
          break;
        case "pause":
          response = await basketballAPI.pauseGame(parseInt(gameId));
          break;
        case "stop":
          response = await basketballAPI.endGame(parseInt(gameId));
          break;
      }

      // Game state will be updated via WebSocket broadcast from backend
      if (response?.game) {
        setGame(response.game);
      }
    } catch (error) {
      console.error(`Failed to ${action} game:`, error);
    }
  };

  const updateScore = (team: "home" | "away", points: number) => {
    // Update local state immediately for responsive UI
    setGameState(prev => ({
      ...prev,
      [team === "home" ? "homeScore" : "awayScore"]: Math.max(
        0,
        prev[team === "home" ? "homeScore" : "awayScore"] + points
      ),
    }));

    // Note: In a real implementation, score updates would be handled through
    // specific stat recording (field goals, free throws, etc.) which automatically
    // update the score and broadcast via ActionCable
  };

  const updatePlayerStat = async (
    playerId: number,
    team: "home" | "away",
    stat: keyof Omit<PlayerStats, "playerId" | "isPlaying">,
    change: number
  ) => {
    if (!gameId || change === 0) return;

    // Update local state immediately for responsive UI
    const setPlayers = team === "home" ? setHomePlayers : setAwayPlayers;
    setPlayers(prev =>
      prev.map(player =>
        player.playerId === playerId
          ? { ...player, [stat]: Math.max(0, player[stat] + change) }
          : player
      )
    );

    try {
      // Record the stat via API, which will broadcast via ActionCable
      await basketballAPI.recordPlayerStat(parseInt(gameId), playerId, {
        stat_type: stat,
        value: change,
      });
    } catch (error) {
      console.error("Failed to record player stat:", error);
      // Revert the optimistic update on error
      setPlayers(prev =>
        prev.map(player =>
          player.playerId === playerId
            ? { ...player, [stat]: Math.max(0, player[stat] - change) }
            : player
        )
      );
    }
  };

  if (isLoading) {
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
          <Icon
            name="basketball"
            size={48}
            className="mx-auto mb-4 text-gray-400"
          />
          <h3 className="text-lg font-medium text-white mb-2">
            Game not found
          </h3>
          <p className="text-gray-400">
            The requested game could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Live Game Control
        </h1>
        <p className="text-gray-400">
          {game.away_team.name} @ {game.home_team.name}
        </p>
      </div>

      {/* Main Scoreboard */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
        <div className="grid grid-cols-3 gap-8 items-center">
          {/* Away Team */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">
              {game.away_team.name}
            </h2>
            <div className="text-5xl font-bold text-orange-500">
              {gameState.awayScore}
            </div>
            <div className="mt-4 space-x-2">
              <button
                onClick={() => updateScore("away", 1)}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                +1
              </button>
              <button
                onClick={() => updateScore("away", 2)}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                +2
              </button>
              <button
                onClick={() => updateScore("away", 3)}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                +3
              </button>
              <button
                onClick={() => updateScore("away", -1)}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                -1
              </button>
            </div>
          </div>

          {/* Game Clock and Controls */}
          <div className="text-center">
            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-400 mb-1">
                PERIOD {gameState.period}
              </div>
              <div className="text-4xl font-mono font-bold text-white flex items-center justify-center">
                <ClockIcon className="h-8 w-8 mr-2" />
                {formatTime(gameState.timeRemaining)}
              </div>
            </div>

            <div className="flex justify-center space-x-3">
              <button
                onClick={() => handleGameControl("start")}
                disabled={gameState.isActive && !gameState.isPaused}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlayIcon className="h-5 w-5 mr-2" />
                Start
              </button>
              <button
                onClick={() => handleGameControl("pause")}
                disabled={!gameState.isActive}
                className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PauseIcon className="h-5 w-5 mr-2" />
                {gameState.isPaused ? "Resume" : "Pause"}
              </button>
              <button
                onClick={() => handleGameControl("stop")}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <StopIcon className="h-5 w-5 mr-2" />
                Stop
              </button>
            </div>
          </div>

          {/* Home Team */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">
              {game.home_team.name}
            </h2>
            <div className="text-5xl font-bold text-orange-500">
              {gameState.homeScore}
            </div>
            <div className="mt-4 space-x-2">
              <button
                onClick={() => updateScore("home", 1)}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                +1
              </button>
              <button
                onClick={() => updateScore("home", 2)}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                +2
              </button>
              <button
                onClick={() => updateScore("home", 3)}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                +3
              </button>
              <button
                onClick={() => updateScore("home", -1)}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                -1
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
            {
              key: "substitutions",
              label: "Substitutions",
              icon: UserGroupIcon,
            },
          ].map(tab => (
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
          <h3 className="text-lg font-semibold text-white mb-4">
            Game Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-white mb-3">Game Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span
                    className={`font-medium ${
                      gameState.isActive
                        ? gameState.isPaused
                          ? "text-yellow-400"
                          : "text-green-400"
                        : "text-gray-400"
                    }`}
                  >
                    {gameState.isActive
                      ? gameState.isPaused
                        ? "Paused"
                        : "Live"
                      : "Not Started"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Period:</span>
                  <span className="text-white">{gameState.period}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Time:</span>
                  <span className="text-white font-mono">
                    {formatTime(gameState.timeRemaining)}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-white mb-3">Score Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">{game.away_team.name}:</span>
                  <span className="text-white font-bold text-lg">
                    {gameState.awayScore}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{game.home_team.name}:</span>
                  <span className="text-white font-bold text-lg">
                    {gameState.homeScore}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-600">
                  <span className="text-gray-400">Lead:</span>
                  <span className="text-orange-400 font-medium">
                    {gameState.homeScore === gameState.awayScore
                      ? "Tied"
                      : `${
                          gameState.homeScore > gameState.awayScore
                            ? game.home_team.name
                            : game.away_team.name
                        } by ${Math.abs(
                          gameState.homeScore - gameState.awayScore
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
              {game.away_team.name} - Player Stats
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
                      FOULS
                    </th>
                    <th className="text-center py-2 px-2 text-xs font-medium text-gray-300 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {awayPlayers.map(playerStat => {
                    const player = game.away_team.players?.find(
                      (p: Player) => p.id === playerStat.playerId
                    );
                    return (
                      <tr key={playerStat.playerId}>
                        <td className="py-2 px-3 text-sm text-white">
                          {player?.name || `Player ${playerStat.playerId}`}
                        </td>
                        <td className="py-2 px-2 text-center text-sm text-white">
                          {playerStat.points}
                        </td>
                        <td className="py-2 px-2 text-center text-sm text-white">
                          {playerStat.rebounds}
                        </td>
                        <td className="py-2 px-2 text-center text-sm text-white">
                          {playerStat.assists}
                        </td>
                        <td className="py-2 px-2 text-center text-sm text-white">
                          {playerStat.fouls}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <div className="flex justify-center space-x-1">
                            <button
                              onClick={() =>
                                updatePlayerStat(
                                  playerStat.playerId,
                                  "away",
                                  "points",
                                  2
                                )
                              }
                              className="px-1 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              +2
                            </button>
                            <button
                              onClick={() =>
                                updatePlayerStat(
                                  playerStat.playerId,
                                  "away",
                                  "rebounds",
                                  1
                                )
                              }
                              className="px-1 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              +R
                            </button>
                            <button
                              onClick={() =>
                                updatePlayerStat(
                                  playerStat.playerId,
                                  "away",
                                  "assists",
                                  1
                                )
                              }
                              className="px-1 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                            >
                              +A
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Home Team Stats */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              {game.home_team.name} - Player Stats
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
                      FOULS
                    </th>
                    <th className="text-center py-2 px-2 text-xs font-medium text-gray-300 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {homePlayers.map(playerStat => {
                    const player = game.home_team.players?.find(
                      (p: Player) => p.id === playerStat.playerId
                    );
                    return (
                      <tr key={playerStat.playerId}>
                        <td className="py-2 px-3 text-sm text-white">
                          {player?.name || `Player ${playerStat.playerId}`}
                        </td>
                        <td className="py-2 px-2 text-center text-sm text-white">
                          {playerStat.points}
                        </td>
                        <td className="py-2 px-2 text-center text-sm text-white">
                          {playerStat.rebounds}
                        </td>
                        <td className="py-2 px-2 text-center text-sm text-white">
                          {playerStat.assists}
                        </td>
                        <td className="py-2 px-2 text-center text-sm text-white">
                          {playerStat.fouls}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <div className="flex justify-center space-x-1">
                            <button
                              onClick={() =>
                                updatePlayerStat(
                                  playerStat.playerId,
                                  "home",
                                  "points",
                                  2
                                )
                              }
                              className="px-1 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              +2
                            </button>
                            <button
                              onClick={() =>
                                updatePlayerStat(
                                  playerStat.playerId,
                                  "home",
                                  "rebounds",
                                  1
                                )
                              }
                              className="px-1 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              +R
                            </button>
                            <button
                              onClick={() =>
                                updatePlayerStat(
                                  playerStat.playerId,
                                  "home",
                                  "assists",
                                  1
                                )
                              }
                              className="px-1 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                            >
                              +A
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "substitutions" && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            Player Substitutions
          </h3>
          <p className="text-gray-400 mb-4">
            Manage player rotations and substitutions during the game.
          </p>
          <div className="text-center py-8">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">Substitution system coming soon...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveGame;
