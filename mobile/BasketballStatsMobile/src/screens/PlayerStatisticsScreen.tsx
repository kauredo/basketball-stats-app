import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore, basketballAPI } from '@basketball-stats/shared';

interface StatRowProps {
  label: string;
  value: string | number;
  isHeader?: boolean;
}

function StatRow({ label, value, isHeader = false }: StatRowProps) {
  return (
    <View style={[styles.statRow, isHeader && styles.statRowHeader]}>
      <Text style={[styles.statLabel, isHeader && styles.statLabelHeader]}>{label}</Text>
      <Text style={[styles.statValue, isHeader && styles.statValueHeader]}>{value}</Text>
    </View>
  );
}

interface GameLogItemProps {
  game: {
    game_id: number;
    game_date: string;
    opponent: string;
    home_game: boolean;
    result: 'W' | 'L' | 'N/A';
    points: number;
    rebounds: number;
    assists: number;
    field_goal_percentage: number;
    minutes: number;
  };
}

function GameLogItem({ game }: GameLogItemProps) {
  const resultColor = game.result === 'W' ? '#10B981' : game.result === 'L' ? '#EF4444' : '#6B7280';
  
  return (
    <View style={styles.gameLogItem}>
      <View style={styles.gameLogHeader}>
        <Text style={styles.gameLogOpponent}>
          {game.home_game ? 'vs' : '@'} {game.opponent}
        </Text>
        <View style={styles.gameLogResult}>
          <Text style={[styles.gameLogResultText, { color: resultColor }]}>
            {game.result}
          </Text>
        </View>
      </View>
      <View style={styles.gameLogStats}>
        <View style={styles.gameLogStat}>
          <Text style={styles.gameLogStatValue}>{game.points}</Text>
          <Text style={styles.gameLogStatLabel}>PTS</Text>
        </View>
        <View style={styles.gameLogStat}>
          <Text style={styles.gameLogStatValue}>{game.rebounds}</Text>
          <Text style={styles.gameLogStatLabel}>REB</Text>
        </View>
        <View style={styles.gameLogStat}>
          <Text style={styles.gameLogStatValue}>{game.assists}</Text>
          <Text style={styles.gameLogStatLabel}>AST</Text>
        </View>
        <View style={styles.gameLogStat}>
          <Text style={styles.gameLogStatValue}>{game.field_goal_percentage}%</Text>
          <Text style={styles.gameLogStatLabel}>FG%</Text>
        </View>
        <View style={styles.gameLogStat}>
          <Text style={styles.gameLogStatValue}>{game.minutes}</Text>
          <Text style={styles.gameLogStatLabel}>MIN</Text>
        </View>
      </View>
    </View>
  );
}

interface PlayerStatisticsScreenProps {
  route: {
    params: {
      playerId: number;
      playerName: string;
    };
  };
}

export default function PlayerStatisticsScreen({ route }: PlayerStatisticsScreenProps) {
  const { playerId, playerName } = route.params;
  const { selectedLeague } = useAuthStore();
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'season' | 'games'>('season');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (selectedLeague) {
      loadPlayerStats();
    }
  }, [selectedLeague, playerId]);

  const loadPlayerStats = async () => {
    if (!selectedLeague) return;
    
    try {
      setLoading(true);
      const stats = await basketballAPI.getPlayerStatistics(selectedLeague.id, playerId);
      setPlayerStats(stats);
    } catch (error) {
      console.error('Failed to load player statistics:', error);
      Alert.alert('Error', 'Failed to load player statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlayerStats();
    setRefreshing(false);
  };

  if (loading && !playerStats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EA580C" />
        <Text style={styles.loadingText}>Loading player statistics...</Text>
      </View>
    );
  }

  if (!selectedLeague || !playerStats) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🏀</Text>
        <Text style={styles.emptyTitle}>No Data Available</Text>
        <Text style={styles.emptySubtitle}>Player statistics could not be loaded.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Player Info Header */}
      <View style={styles.header}>
        <Text style={styles.playerName}>{playerName}</Text>
        <Text style={styles.playerTeam}>{playerStats.player?.team || 'Unknown Team'}</Text>
        <Text style={styles.playerPosition}>{playerStats.player?.position || ''}</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'season' && styles.activeTab]}
          onPress={() => setActiveTab('season')}
        >
          <Text style={[styles.tabText, activeTab === 'season' && styles.activeTabText]}>
            Season Stats
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'games' && styles.activeTab]}
          onPress={() => setActiveTab('games')}
        >
          <Text style={[styles.tabText, activeTab === 'games' && styles.activeTabText]}>
            Game Log
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Season Stats Tab */}
        {activeTab === 'season' && playerStats.season_stats && (
          <View style={styles.tabContent}>
            {/* Basic Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Statistics</Text>
              <View style={styles.statsTable}>
                <StatRow label="Games Played" value={playerStats.season_stats.games_played} isHeader />
                <StatRow label="Points per Game" value={playerStats.season_stats.avg_points?.toFixed(1) || '0.0'} />
                <StatRow label="Rebounds per Game" value={playerStats.season_stats.avg_rebounds?.toFixed(1) || '0.0'} />
                <StatRow label="Assists per Game" value={playerStats.season_stats.avg_assists?.toFixed(1) || '0.0'} />
                <StatRow label="Steals per Game" value={playerStats.season_stats.avg_steals?.toFixed(1) || '0.0'} />
                <StatRow label="Blocks per Game" value={playerStats.season_stats.avg_blocks?.toFixed(1) || '0.0'} />
                <StatRow label="Minutes per Game" value={playerStats.season_stats.avg_minutes?.toFixed(1) || '0.0'} />
              </View>
            </View>

            {/* Shooting Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Shooting Statistics</Text>
              <View style={styles.statsTable}>
                <StatRow 
                  label="Field Goal %" 
                  value={`${playerStats.season_stats.field_goal_percentage?.toFixed(1) || '0.0'}%`} 
                  isHeader 
                />
                <StatRow 
                  label="Three Point %" 
                  value={`${playerStats.season_stats.three_point_percentage?.toFixed(1) || '0.0'}%`} 
                />
                <StatRow 
                  label="Free Throw %" 
                  value={`${playerStats.season_stats.free_throw_percentage?.toFixed(1) || '0.0'}%`} 
                />
                <StatRow 
                  label="Effective FG%" 
                  value={`${playerStats.season_stats.effective_field_goal_percentage?.toFixed(1) || '0.0'}%`} 
                />
                <StatRow 
                  label="True Shooting %" 
                  value={`${playerStats.season_stats.true_shooting_percentage?.toFixed(1) || '0.0'}%`} 
                />
              </View>
            </View>

            {/* Advanced Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Advanced Statistics</Text>
              <View style={styles.statsTable}>
                <StatRow 
                  label="Player Efficiency Rating" 
                  value={playerStats.season_stats.player_efficiency_rating?.toFixed(1) || '0.0'} 
                  isHeader 
                />
                <StatRow 
                  label="Usage Rate" 
                  value={`${playerStats.season_stats.usage_rate?.toFixed(1) || '0.0'}%`} 
                />
                <StatRow 
                  label="Assist/Turnover Ratio" 
                  value={playerStats.season_stats.assist_to_turnover_ratio?.toFixed(2) || '0.00'} 
                />
                <StatRow 
                  label="Turnovers per Game" 
                  value={playerStats.season_stats.avg_turnovers?.toFixed(1) || '0.0'} 
                />
                <StatRow 
                  label="Fouls per Game" 
                  value={playerStats.season_stats.avg_fouls?.toFixed(1) || '0.0'} 
                />
              </View>
            </View>

            {/* Season Totals */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Season Totals</Text>
              <View style={styles.statsTable}>
                <StatRow label="Total Points" value={playerStats.season_stats.total_points || 0} isHeader />
                <StatRow label="Total Rebounds" value={playerStats.season_stats.total_rebounds || 0} />
                <StatRow label="Total Assists" value={playerStats.season_stats.total_assists || 0} />
                <StatRow label="Total Minutes" value={playerStats.season_stats.total_minutes || 0} />
                <StatRow label="Field Goals Made" value={playerStats.season_stats.total_field_goals_made || 0} />
                <StatRow label="Field Goals Attempted" value={playerStats.season_stats.total_field_goals_attempted || 0} />
              </View>
            </View>
          </View>
        )}

        {/* Game Log Tab */}
        {activeTab === 'games' && playerStats.recent_games && (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Games</Text>
              {playerStats.recent_games.length > 0 ? (
                playerStats.recent_games.map((game: any, index: number) => (
                  <GameLogItem key={game.game_id || index} game={game} />
                ))
              ) : (
                <Text style={styles.noGamesText}>No games played yet this season.</Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#374151',
    padding: 20,
    alignItems: 'center',
  },
  playerName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  playerTeam: {
    color: '#EA580C',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  playerPosition: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#374151',
    borderBottomWidth: 1,
    borderBottomColor: '#4B5563',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#EA580C',
  },
  tabText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#EA580C',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsTable: {
    backgroundColor: '#374151',
    borderRadius: 8,
    overflow: 'hidden',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#4B5563',
  },
  statRowHeader: {
    backgroundColor: '#4B5563',
  },
  statLabel: {
    color: '#D1D5DB',
    fontSize: 14,
    flex: 1,
  },
  statLabelHeader: {
    color: 'white',
    fontWeight: '500',
  },
  statValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  statValueHeader: {
    fontWeight: 'bold',
  },
  gameLogItem: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  gameLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameLogOpponent: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  gameLogResult: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameLogResultText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  gameLogStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  gameLogStat: {
    alignItems: 'center',
  },
  gameLogStatValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gameLogStatLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 2,
  },
  noGamesText: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 32,
  },
});