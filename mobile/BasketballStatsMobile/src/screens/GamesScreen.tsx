import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { 
  basketballAPI, 
  Game, 
  BasketballUtils, 
  GAME_STATUSES 
} from '@basketball-stats/shared';

import { RootStackParamList } from '../navigation/AppNavigator';

type GamesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function GamesScreen() {
  const navigation = useNavigation<GamesScreenNavigationProp>();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadGames = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      const response = await basketballAPI.getGames();
      // Sort games by date, most recent first
      const sortedGames = response.games.sort((a, b) => 
        new Date(b.scheduled_at || b.created_at).getTime() - 
        new Date(a.scheduled_at || a.created_at).getTime()
      );
      setGames(sortedGames);
    } catch (error) {
      console.error('Failed to load games:', error);
      Alert.alert('Error', 'Failed to load games');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadGames(true);
  };

  const handleGamePress = (game: Game) => {
    if (game.status === 'active' || game.status === 'paused') {
      navigation.navigate('LiveGame', { gameId: game.id });
    }
  };

  const renderGame = ({ item: game }: { item: Game }) => {
    const gameStatus = GAME_STATUSES[game.status.toUpperCase() as keyof typeof GAME_STATUSES];
    const isGameLive = BasketballUtils.isGameLive(game);
    const winner = BasketballUtils.getWinningTeam(game);
    const canPress = isGameLive;

    return (
      <TouchableOpacity
        style={[styles.gameCard, isGameLive && styles.liveGameCard]}
        onPress={() => handleGamePress(game)}
        disabled={!canPress}
      >
        <View style={styles.gameHeader}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: gameStatus?.color || '#6B7280' }]}>
              <Text style={styles.statusText}>
                {BasketballUtils.getGameStatusDisplayName(game.status)}
              </Text>
            </View>
            {isGameLive && <Text style={styles.livePulse}>●</Text>}
          </View>
          
          <View style={styles.gameTimeInfo}>
            {isGameLive && (
              <Text style={styles.gameTime}>
                Q{game.current_quarter} • {game.time_display}
              </Text>
            )}
            
            {game.status === 'completed' && (
              <Text style={styles.gameTime}>
                {BasketballUtils.formatGameDate(game.ended_at || game.created_at)}
              </Text>
            )}
            
            {game.status === 'scheduled' && (
              <Text style={styles.gameTime}>
                {BasketballUtils.formatGameDate(game.scheduled_at || game.created_at)}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.teamsContainer}>
          <View style={styles.teamRow}>
            <Text style={[
              styles.teamName, 
              winner === 'away' && game.status === 'completed' && styles.winnerText
            ]}>
              {game.away_team.name}
            </Text>
            <Text style={[
              styles.score,
              winner === 'away' && game.status === 'completed' && styles.winnerText
            ]}>
              {game.away_score}
            </Text>
          </View>
          
          <Text style={styles.vsText}>@</Text>
          
          <View style={styles.teamRow}>
            <Text style={[
              styles.teamName,
              winner === 'home' && game.status === 'completed' && styles.winnerText
            ]}>
              {game.home_team.name}
            </Text>
            <Text style={[
              styles.score,
              winner === 'home' && game.status === 'completed' && styles.winnerText
            ]}>
              {game.home_score}
            </Text>
          </View>
        </View>

        {game.status === 'completed' && (
          <View style={styles.gameFooter}>
            <Text style={styles.durationText}>
              Duration: {game.duration_minutes} min
            </Text>
            {winner !== 'tie' && (
              <Text style={styles.marginText}>
                Margin: {BasketballUtils.getPointDifferential(game)}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading games...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <FlatList
        data={games}
        renderItem={renderGame}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>🏀</Text>
            <Text style={styles.emptyTitle}>No games found</Text>
            <Text style={styles.emptyDescription}>
              Games will appear here once they're scheduled
            </Text>
          </View>
        }
      />
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
  content: {
    padding: 16,
  },
  gameCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  liveGameCard: {
    borderColor: '#EF4444',
    borderWidth: 2,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  livePulse: {
    color: '#EF4444',
    fontSize: 16,
    opacity: 0.8,
  },
  gameTimeInfo: {
    alignItems: 'flex-end',
  },
  gameTime: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  teamsContainer: {
    alignItems: 'center',
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 4,
  },
  teamName: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  score: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: 'bold',
    minWidth: 30,
    textAlign: 'right',
  },
  winnerText: {
    color: '#10B981',
  },
  vsText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginVertical: 4,
  },
  gameFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  durationText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  marginText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyDescription: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});