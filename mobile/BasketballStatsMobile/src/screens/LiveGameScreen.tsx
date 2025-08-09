import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  PanResponder,
  Animated,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

import { 
  basketballAPI, 
  Game, 
  Player, 
  BasketballUtils,
  gameStore,
  websocketService 
} from '@basketball-stats/shared';

import { RootStackParamList } from '../navigation/AppNavigator';

type LiveGameRouteProp = RouteProp<RootStackParamList, 'LiveGame'>;
type LiveGameNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LiveGame'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const STAT_ACTIONS = [
  { id: 'field_goal_made', label: '🏀 FGM', color: '#10B981' },
  { id: 'field_goal_missed', label: '❌ FGA Miss', color: '#EF4444' },
  { id: 'three_point_made', label: '🎯 3PM', color: '#8B5CF6' },
  { id: 'three_point_missed', label: '3️⃣ 3PA Miss', color: '#F59E0B' },
  { id: 'free_throw_made', label: '✅ FTM', color: '#06B6D4' },
  { id: 'free_throw_missed', label: '🚫 FTA Miss', color: '#EF4444' },
  { id: 'rebound_offensive', label: '↗️ OREB', color: '#F97316' },
  { id: 'rebound_defensive', label: '↙️ DREB', color: '#3B82F6' },
  { id: 'assist', label: '🤝 AST', color: '#10B981' },
  { id: 'steal', label: '🏃 STL', color: '#8B5CF6' },
  { id: 'block', label: '🚧 BLK', color: '#EF4444' },
  { id: 'turnover', label: '🔄 TO', color: '#F59E0B' },
  { id: 'foul_personal', label: '🟨 PF', color: '#EAB308' },
];

interface DraggableStatProps {
  stat: typeof STAT_ACTIONS[0];
  onDragStart: () => void;
  onDragEnd: (stat: typeof STAT_ACTIONS[0]) => void;
}

function DraggableStat({ stat, onDragStart, onDragEnd }: DraggableStatProps) {
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        onDragStart();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.spring(scale, { toValue: 1.1, useNativeDriver: false }).start();
      },

      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),

      onPanResponderRelease: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onDragEnd(stat);
        
        Animated.parallel([
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }),
          Animated.spring(scale, { toValue: 1, useNativeDriver: false }),
        ]).start();
      },
    }),
  ).current;

  return (
    <Animated.View
      style={[
        styles.statAction,
        { backgroundColor: stat.color },
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: scale },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <Text style={styles.statActionText}>{stat.label}</Text>
    </Animated.View>
  );
}

export default function LiveGameScreen() {
  const route = useRoute<LiveGameRouteProp>();
  const navigation = useNavigation<LiveGameNavigationProp>();
  const { gameId } = route.params;

  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<{ home: Player[], away: Player[] }>({ home: [], away: [] });
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    loadGameData();
    
    // Connect to WebSocket for real-time updates
    websocketService.connect();
    websocketService.joinGame(gameId, (updatedGame) => {
      setGame(updatedGame);
    });

    return () => {
      websocketService.leaveGame(gameId);
    };
  }, [gameId]);

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

      setPlayers({
        home: homePlayersResponse.players,
        away: awayPlayersResponse.players,
      });
    } catch (error) {
      console.error('Failed to load game data:', error);
      Alert.alert('Error', 'Failed to load game data');
    } finally {
      setLoading(false);
    }
  };

  const handleGameAction = async (action: string) => {
    if (!game) return;

    try {
      let response;
      switch (action) {
        case 'start':
          response = await basketballAPI.startGame(game.id);
          break;
        case 'pause':
          response = await basketballAPI.pauseGame(game.id);
          break;
        case 'resume':
          response = await basketballAPI.resumeGame(game.id);
          break;
        case 'end':
          response = await basketballAPI.endGame(game.id);
          break;
        default:
          return;
      }
      
      setGame(response.game);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error(`Failed to ${action} game:`, error);
      Alert.alert('Error', `Failed to ${action} game`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleStatDrag = async (stat: typeof STAT_ACTIONS[0]) => {
    if (!selectedPlayer || !game) return;

    try {
      await basketballAPI.recordPlayerStat(game.id, selectedPlayer.id, {
        stat_type: stat.id,
        value: 1,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Clear selected player after recording stat
      setSelectedPlayer(null);
    } catch (error) {
      console.error('Failed to record stat:', error);
      Alert.alert('Error', 'Failed to record stat');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const renderPlayerCard = (player: Player, isHome: boolean) => {
    const isSelected = selectedPlayer?.id === player.id;
    
    return (
      <TouchableOpacity
        key={player.id}
        style={[
          styles.playerCard,
          isSelected && styles.selectedPlayerCard,
          isDragging && isSelected && styles.dropZoneActive,
        ]}
        onPress={() => setSelectedPlayer(isSelected ? null : player)}
      >
        <View style={styles.playerInfo}>
          <Text style={styles.playerNumber}>#{player.jersey_number}</Text>
          <View>
            <Text style={styles.playerName}>{player.name}</Text>
            <Text style={styles.playerPosition}>{player.position}</Text>
          </View>
        </View>
        
        {isSelected && (
          <Text style={styles.selectedIndicator}>Selected</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderGameControls = () => {
    if (!game) return null;

    const isActive = game.status === 'active';
    const isPaused = game.status === 'paused';
    const canStart = game.status === 'scheduled';

    return (
      <View style={styles.gameControls}>
        {canStart && (
          <TouchableOpacity 
            style={[styles.controlButton, styles.startButton]} 
            onPress={() => handleGameAction('start')}
          >
            <Text style={styles.controlButtonText}>Start Game</Text>
          </TouchableOpacity>
        )}
        
        {isActive && (
          <TouchableOpacity 
            style={[styles.controlButton, styles.pauseButton]} 
            onPress={() => handleGameAction('pause')}
          >
            <Text style={styles.controlButtonText}>Pause</Text>
          </TouchableOpacity>
        )}
        
        {isPaused && (
          <TouchableOpacity 
            style={[styles.controlButton, styles.resumeButton]} 
            onPress={() => handleGameAction('resume')}
          >
            <Text style={styles.controlButtonText}>Resume</Text>
          </TouchableOpacity>
        )}
        
        {(isActive || isPaused) && (
          <TouchableOpacity 
            style={[styles.controlButton, styles.endButton]} 
            onPress={() => handleGameAction('end')}
          >
            <Text style={styles.controlButtonText}>End Game</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading game...</Text>
      </View>
    );
  }

  if (!game) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Game not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Game Header */}
      <View style={styles.gameHeader}>
        <View style={styles.scoreSection}>
          <View style={styles.teamScore}>
            <Text style={styles.teamName}>{game.away_team.name}</Text>
            <Text style={styles.score}>{game.away_score}</Text>
          </View>
          <View style={styles.gameTime}>
            <Text style={styles.quarter}>Q{game.current_quarter}</Text>
            <Text style={styles.time}>{game.time_display}</Text>
            <Text style={styles.status}>
              {BasketballUtils.getGameStatusDisplayName(game.status)}
            </Text>
          </View>
          <View style={styles.teamScore}>
            <Text style={styles.teamName}>{game.home_team.name}</Text>
            <Text style={styles.score}>{game.home_score}</Text>
          </View>
        </View>
        
        {renderGameControls()}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Player Selection */}
        {selectedPlayer && (
          <View style={styles.selectedPlayerSection}>
            <Text style={styles.sectionTitle}>Recording stats for:</Text>
            <Text style={styles.selectedPlayerText}>
              #{selectedPlayer.jersey_number} {selectedPlayer.name}
            </Text>
            <Text style={styles.instructionText}>
              Drag a stat below onto this player to record it
            </Text>
          </View>
        )}

        {/* Away Team Players */}
        <View style={styles.teamSection}>
          <Text style={styles.sectionTitle}>{game.away_team.name} (Away)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.playersRow}>
              {players.away.map(player => renderPlayerCard(player, false))}
            </View>
          </ScrollView>
        </View>

        {/* Home Team Players */}
        <View style={styles.teamSection}>
          <Text style={styles.sectionTitle}>{game.home_team.name} (Home)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.playersRow}>
              {players.home.map(player => renderPlayerCard(player, true))}
            </View>
          </ScrollView>
        </View>

        {/* Stat Actions */}
        <View style={styles.statActionsSection}>
          <Text style={styles.sectionTitle}>Drag Stats to Players</Text>
          <View style={styles.statActionsGrid}>
            {STAT_ACTIONS.map(stat => (
              <DraggableStat
                key={stat.id}
                stat={stat}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={(draggedStat) => {
                  setIsDragging(false);
                  handleStatDrag(draggedStat);
                }}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  loadingText: {
    color: '#F9FAFB',
    fontSize: 16,
  },
  gameHeader: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  scoreSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamScore: {
    alignItems: 'center',
    flex: 1,
  },
  teamName: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  score: {
    color: '#F9FAFB',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 4,
  },
  gameTime: {
    alignItems: 'center',
    flex: 1,
  },
  quarter: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: 'bold',
  },
  time: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  status: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  gameControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  controlButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
  },
  startButton: {
    backgroundColor: '#10B981',
  },
  pauseButton: {
    backgroundColor: '#F59E0B',
  },
  resumeButton: {
    backgroundColor: '#3B82F6',
  },
  endButton: {
    backgroundColor: '#EF4444',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  selectedPlayerSection: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  selectedPlayerText: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  instructionText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  teamSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  playersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  playerCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#374151',
    minWidth: 120,
  },
  selectedPlayerCard: {
    borderColor: '#EF4444',
    borderWidth: 2,
    backgroundColor: '#7F1D1D',
  },
  dropZoneActive: {
    borderColor: '#10B981',
    borderWidth: 3,
    backgroundColor: '#064E3B',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerNumber: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerName: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '600',
  },
  playerPosition: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  selectedIndicator: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  statActionsSection: {
    marginTop: 16,
  },
  statActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  statAction: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
  },
  statActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});