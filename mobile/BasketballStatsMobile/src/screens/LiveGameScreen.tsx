import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import Icon from "../components/Icon";

import {
  basketballAPI,
  Game,
  Player,
  BasketballUtils,
  gameStore,
  websocketService,
  basketballWebSocket,
} from "@basketball-stats/shared";

import { RootStackParamList } from "../navigation/AppNavigator";

type LiveGameRouteProp = RouteProp<RootStackParamList, "LiveGame">;
type LiveGameNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "LiveGame"
>;

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

const TABS = [
  { key: 'scoreboard', label: 'Scoreboard', icon: 'basketball' },
  { key: 'stats', label: 'Player Stats', icon: 'stats' },
  { key: 'substitutions', label: 'Subs', icon: 'users' },
];

export default function LiveGameScreen() {
  const route = useRoute<LiveGameRouteProp>();
  const navigation = useNavigation<LiveGameNavigationProp>();
  const { gameId } = route.params;

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
  const [activeTab, setActiveTab] = useState<'scoreboard' | 'stats' | 'substitutions'>('scoreboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGameData();
    
    // Connect to WebSocket for real-time updates
    basketballWebSocket.connect();
    basketballWebSocket.subscribeToGame(gameId);
    
    basketballWebSocket.on('game_update', (data) => {
      if (data.game) {
        setGame(data.game);
      }
      if (data.gameState) {
        setGameState(data.gameState);
      }
    });

    basketballWebSocket.on('timer_update', (data) => {
      if (data.gameState) {
        setGameState(prev => ({
          ...prev,
          timeRemaining: data.gameState.timeRemaining,
          period: data.gameState.period,
        }));
      }
    });

    basketballWebSocket.on('stats_update', (data) => {
      if (data.playerStats) {
        const { playerId, team, stats } = data.playerStats;
        const setPlayers = team === 'home' ? setHomePlayers : setAwayPlayers;
        
        setPlayers(prev => prev.map(player => 
          player.playerId === playerId ? { ...player, ...stats } : player
        ));
      }
    });

    return () => {
      basketballWebSocket.unsubscribeFromGame();
    };
  }, [gameId]);

  // Game timer effect with WebSocket sync
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (gameState.isActive && !gameState.isPaused && gameState.timeRemaining > 0) {
      interval = setInterval(() => {
        setGameState(prev => {
          const newState = {
            ...prev,
            timeRemaining: Math.max(0, prev.timeRemaining - 1)
          };
          
          // Sync timer update via WebSocket
          basketballWebSocket.updateTimer(newState.timeRemaining, newState.period);
          
          return newState;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState.isActive, gameState.isPaused, gameState.timeRemaining]);

  const loadGameData = async () => {
    try {
      setLoading(true);

      // Load game details
      const gameResponse = await basketballAPI.getGame(gameId);
      setGame(gameResponse.game);

      // Load players for both teams
      const [homePlayersResponse, awayPlayersResponse] = await Promise.all([
        basketballAPI.getTeamPlayers(gameResponse.game.home_team_id),
        basketballAPI.getTeamPlayers(gameResponse.game.away_team_id),
      ]);

      // Initialize player stats
      const initHomeStats: PlayerStats[] = homePlayersResponse.players?.map((player: Player) => ({
        playerId: player.id,
        points: 0,
        rebounds: 0,
        assists: 0,
        fouls: 0,
        isPlaying: true,
      })) || [];
      
      const initAwayStats: PlayerStats[] = awayPlayersResponse.players?.map((player: Player) => ({
        playerId: player.id,
        points: 0,
        rebounds: 0,
        assists: 0,
        fouls: 0,
        isPlaying: true,
      })) || [];
      
      setHomePlayers(initHomeStats.slice(0, 5)); // Starting 5
      setAwayPlayers(initAwayStats.slice(0, 5));
    } catch (error) {
      console.error("Failed to load game data:", error);
      Alert.alert("Error", "Failed to load game data");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleGameControl = async (action: 'start' | 'pause' | 'stop') => {
    if (!game) return;
    
    try {
      let response;
      switch (action) {
        case 'start':
          response = await basketballAPI.startGame(gameId);
          break;
        case 'pause':
          response = await basketballAPI.pauseGame(gameId);
          break;
        case 'stop':
          response = await basketballAPI.endGame(gameId);
          break;
      }
      
      // Game state will be updated via WebSocket broadcast from backend
      if (response?.game) {
        setGame(response.game);
      }
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error(`Failed to ${action} game:`, error);
      Alert.alert("Error", `Failed to ${action} game`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const updateScore = (team: 'home' | 'away', points: number) => {
    // Update local state immediately for responsive UI
    setGameState(prev => ({
      ...prev,
      [team === 'home' ? 'homeScore' : 'awayScore']: Math.max(0, prev[team === 'home' ? 'homeScore' : 'awayScore'] + points)
    }));
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Note: In a real implementation, score updates would be handled through
    // specific stat recording (field goals, free throws, etc.) which automatically
    // update the score and broadcast via ActionCable
  };

  const updatePlayerStat = async (playerId: number, team: 'home' | 'away', stat: keyof Omit<PlayerStats, 'playerId' | 'isPlaying'>, change: number) => {
    if (change === 0) return;
    
    // Update local state immediately for responsive UI
    const setPlayers = team === 'home' ? setHomePlayers : setAwayPlayers;
    setPlayers(prev => prev.map(player => 
      player.playerId === playerId
        ? { ...player, [stat]: Math.max(0, player[stat] + change) }
        : player
    ));
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      // Record the stat via API, which will broadcast via ActionCable
      await basketballAPI.recordPlayerStat(gameId, playerId, {
        stat_type: stat,
        value: change,
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to record player stat:', error);
      Alert.alert("Error", "Failed to record stat");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Revert the optimistic update on error
      setPlayers(prev => prev.map(player => 
        player.playerId === playerId
          ? { ...player, [stat]: Math.max(0, player[stat] - change) }
          : player
      ));
    }
  };

  const renderScoreCard = (teamName: string, score: number, team: 'home' | 'away') => (
    <View className="flex-1 items-center">
      <Text className="text-white text-lg font-bold mb-2">{teamName}</Text>
      <Text className="text-primary-500 text-5xl font-bold mb-4">{score}</Text>
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() => updateScore(team, 1)}
          className="bg-green-600 px-3 py-2 rounded-lg"
        >
          <Text className="text-white text-sm font-bold">+1</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => updateScore(team, 2)}
          className="bg-green-600 px-3 py-2 rounded-lg"
        >
          <Text className="text-white text-sm font-bold">+2</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => updateScore(team, 3)}
          className="bg-green-600 px-3 py-2 rounded-lg"
        >
          <Text className="text-white text-sm font-bold">+3</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => updateScore(team, -1)}
          className="bg-red-600 px-3 py-2 rounded-lg"
        >
          <Text className="text-white text-sm font-bold">-1</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPlayerStatsCard = (playerStats: PlayerStats, team: 'home' | 'away') => {
    const players = team === 'home' ? game?.home_team.players : game?.away_team.players;
    const player = players?.find(p => p.id === playerStats.playerId);
    
    if (!player) return null;

    return (
      <View key={playerStats.playerId} className="bg-gray-800 rounded-xl p-4 mb-3 border border-gray-700">
        <Text className="text-white text-base font-bold mb-2">
          #{player.jersey_number} {player.first_name} {player.last_name}
        </Text>
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-gray-300 text-sm">PTS: {playerStats.points}</Text>
          <Text className="text-gray-300 text-sm">REB: {playerStats.rebounds}</Text>
          <Text className="text-gray-300 text-sm">AST: {playerStats.assists}</Text>
          <Text className="text-gray-300 text-sm">FOULS: {playerStats.fouls}</Text>
        </View>
        <View className="flex-row justify-center gap-2">
          <TouchableOpacity
            onPress={() => updatePlayerStat(playerStats.playerId, team, 'points', 2)}
            className="bg-green-600 px-2 py-1 rounded"
          >
            <Text className="text-white text-xs">+2 PTS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => updatePlayerStat(playerStats.playerId, team, 'rebounds', 1)}
            className="bg-blue-600 px-2 py-1 rounded"
          >
            <Text className="text-white text-xs">+REB</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => updatePlayerStat(playerStats.playerId, team, 'assists', 1)}
            className="bg-purple-600 px-2 py-1 rounded"
          >
            <Text className="text-white text-xs">+AST</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => updatePlayerStat(playerStats.playerId, team, 'fouls', 1)}
            className="bg-yellow-600 px-2 py-1 rounded"
          >
            <Text className="text-white text-xs">+FOUL</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-dark-950">
        <View className="flex-1 justify-center items-center">
          <Text className="text-white text-base">Loading game...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!game) {
    return (
      <SafeAreaView className="flex-1 bg-dark-950">
        <View className="flex-1 justify-center items-center">
          <Icon name="basketball" size={48} color="#9CA3AF" />
          <Text className="text-white text-lg font-semibold mt-4 mb-2">Game not found</Text>
          <Text className="text-gray-400 text-center">The requested game could not be found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-dark-950">
      <StatusBar style="light" />
      
      {/* Header */}
      <View className="px-4 pt-2 pb-4">
        <Text className="text-white text-xl font-bold text-center mb-1">Live Game Control</Text>
        <Text className="text-gray-400 text-center">
          {game.away_team.name} @ {game.home_team.name}
        </Text>
      </View>

      {/* Main Scoreboard */}
      <View className="bg-gray-800 mx-4 rounded-xl p-4 mb-4 border border-gray-700">
        <View className="flex-row items-center">
          {/* Away Team */}
          {renderScoreCard(game.away_team.name, gameState.awayScore, 'away')}

          {/* Game Clock and Controls */}
          <View className="flex-1 items-center mx-4">
            <View className="bg-dark-950 rounded-lg p-3 mb-3">
              <Text className="text-gray-400 text-xs text-center mb-1">PERIOD {gameState.period}</Text>
              <View className="flex-row items-center justify-center">
                <Icon name="clock" size={16} color="#FFFFFF" />
                <Text className="text-white text-2xl font-mono font-bold ml-2">
                  {formatTime(gameState.timeRemaining)}
                </Text>
              </View>
            </View>
            
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => handleGameControl('start')}
                disabled={gameState.isActive && !gameState.isPaused}
                className={`flex-row items-center px-3 py-2 rounded-lg ${
                  gameState.isActive && !gameState.isPaused 
                    ? 'bg-gray-600' : 'bg-green-600'
                }`}
              >
                <Icon name="play" size={12} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleGameControl('pause')}
                disabled={!gameState.isActive}
                className={`flex-row items-center px-3 py-2 rounded-lg ${
                  !gameState.isActive ? 'bg-gray-600' : 'bg-yellow-600'
                }`}
              >
                <Icon name="pause" size={12} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleGameControl('stop')}
                className="flex-row items-center px-3 py-2 bg-red-600 rounded-lg"
              >
                <Icon name="stop" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Home Team */}
          {renderScoreCard(game.home_team.name, gameState.homeScore, 'home')}
        </View>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row mx-4 mb-4">
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-3 rounded-lg mx-1 ${
              activeTab === tab.key ? 'bg-primary-500' : 'bg-gray-700'
            }`}
          >
            <View className="items-center">
              <Icon
                name={tab.icon as any}
                size={16}
                color={activeTab === tab.key ? '#FFFFFF' : '#9CA3AF'}
              />
              <Text
                className={`text-xs mt-1 ${
                  activeTab === tab.key ? 'text-white font-semibold' : 'text-gray-400'
                }`}
              >
                {tab.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView className="flex-1 px-4">
        {activeTab === 'scoreboard' && (
          <View className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <Text className="text-white text-lg font-bold mb-4">Game Summary</Text>
            <View className="space-y-4">
              <View>
                <Text className="text-white font-semibold mb-2">Game Status</Text>
                <View className="flex-row justify-between items-center py-1">
                  <Text className="text-gray-400">Status:</Text>
                  <Text className={`font-semibold ${
                    gameState.isActive 
                      ? gameState.isPaused ? 'text-yellow-400' : 'text-green-400'
                      : 'text-gray-400'
                  }`}>
                    {gameState.isActive ? (gameState.isPaused ? 'Paused' : 'Live') : 'Not Started'}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center py-1">
                  <Text className="text-gray-400">Period:</Text>
                  <Text className="text-white">{gameState.period}</Text>
                </View>
                <View className="flex-row justify-between items-center py-1">
                  <Text className="text-gray-400">Time:</Text>
                  <Text className="text-white font-mono">{formatTime(gameState.timeRemaining)}</Text>
                </View>
              </View>
              
              <View>
                <Text className="text-white font-semibold mb-2">Score Summary</Text>
                <View className="flex-row justify-between items-center py-1">
                  <Text className="text-gray-400">{game.away_team.name}:</Text>
                  <Text className="text-white font-bold text-lg">{gameState.awayScore}</Text>
                </View>
                <View className="flex-row justify-between items-center py-1">
                  <Text className="text-gray-400">{game.home_team.name}:</Text>
                  <Text className="text-white font-bold text-lg">{gameState.homeScore}</Text>
                </View>
                <View className="flex-row justify-between items-center py-2 border-t border-gray-600 mt-2">
                  <Text className="text-gray-400">Lead:</Text>
                  <Text className="text-primary-400 font-semibold">
                    {gameState.homeScore === gameState.awayScore 
                      ? 'Tied' 
                      : `${gameState.homeScore > gameState.awayScore ? game.home_team.name : game.away_team.name} by ${Math.abs(gameState.homeScore - gameState.awayScore)}`
                    }
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'stats' && (
          <View>
            <Text className="text-white text-lg font-bold mb-4">{game.away_team.name} - Player Stats</Text>
            {awayPlayers.map(playerStats => renderPlayerStatsCard(playerStats, 'away'))}
            
            <Text className="text-white text-lg font-bold mb-4 mt-6">{game.home_team.name} - Player Stats</Text>
            {homePlayers.map(playerStats => renderPlayerStatsCard(playerStats, 'home'))}
          </View>
        )}

        {activeTab === 'substitutions' && (
          <View className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <Text className="text-white text-lg font-bold mb-4">Player Substitutions</Text>
            <Text className="text-gray-400 mb-4">
              Manage player rotations and substitutions during the game.
            </Text>
            <View className="items-center py-8">
              <Icon name="users" size={48} color="#9CA3AF" />
              <Text className="text-gray-400 mt-4">Substitution system coming soon...</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}