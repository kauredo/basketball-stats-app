import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

// Import shared library
import { 
  basketballAPI, 
  Game, 
  BasketballUtils, 
  GAME_STATUSES 
} from '@basketball-stats/shared';

import { RootStackParamList } from '../navigation/AppNavigator';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [liveGames, setLiveGames] = useState<Game[]>([]);
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      const response = await basketballAPI.getGames();
      const allGames = response.games;
      
      // Separate live and recent games
      const live = allGames.filter(game => game.status === 'active' || game.status === 'paused');
      const recent = allGames.filter(game => game.status === 'completed').slice(0, 5);
      
      setLiveGames(live);
      setRecentGames(recent);
    } catch (error) {
      console.error('Failed to load games:', error);
      Alert.alert('Error', 'Failed to load games');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const handleGamePress = (game: Game) => {
    if (game.status === 'active' || game.status === 'paused') {
      navigation.navigate('LiveGame', { gameId: game.id });
    }
  };

  const renderGameCard = (game: Game, isLive = false) => {
    const gameStatus = GAME_STATUSES[game.status.toUpperCase() as keyof typeof GAME_STATUSES];
    const isGameLive = BasketballUtils.isGameLive(game);
    const winner = BasketballUtils.getWinningTeam(game);
    
    return (
      <TouchableOpacity
        key={game.id}
        style={[styles.gameCard, isLive && styles.liveGameCard]}
        onPress={() => handleGamePress(game)}
        disabled={!isLive}
      >
        <View style={styles.gameHeader}>
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
        </View>

        <View style={styles.gameInfo}>
          <View style={[styles.statusBadge, { backgroundColor: gameStatus?.color || '#6B7280' }]}>
            <Text style={styles.statusText}>
              {BasketballUtils.getGameStatusDisplayName(game.status)}
            </Text>
          </View>
          
          {isGameLive && (
            <Text style={styles.gameTime}>
              Q{game.current_quarter} • {game.time_display}
            </Text>
          )}
          
          {game.status === 'completed' && (
            <Text style={styles.gameTime}>
              Final • {BasketballUtils.formatGameDate(game.ended_at || game.created_at)}
            </Text>
          )}
          
          {game.status === 'scheduled' && (
            <Text style={styles.gameTime}>
              {BasketballUtils.formatGameDate(game.scheduled_at || game.created_at)}
            </Text>
          )}
        </View>
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
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Live Games Section */}
        {liveGames.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔴 Live Games</Text>
            {liveGames.map(game => renderGameCard(game, true))}
          </View>
        )}

        {/* Recent Games Section */}
        {recentGames.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Recent Games</Text>
            {recentGames.map(game => renderGameCard(game, false))}
          </View>
        )}

        {/* Empty State */}
        {liveGames.length === 0 && recentGames.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>🏀</Text>
            <Text style={styles.emptyTitle}>No games found</Text>
            <Text style={styles.emptyDescription}>
              Create a game to start tracking basketball statistics
            </Text>
          </View>
        )}
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
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
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
    marginBottom: 12,
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
  gameInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  gameTime: {
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