import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { 
  basketballAPI, 
  Player, 
  PlayerStat,
  BasketballUtils
} from '@basketball-stats/shared';

import { RootStackParamList } from '../navigation/AppNavigator';

type PlayerStatsRouteProp = RouteProp<RootStackParamList, 'PlayerStats'>;
type PlayerStatsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PlayerStats'>;

const { width: screenWidth } = Dimensions.get('window');

interface StatCategory {
  title: string;
  stats: Array<{
    label: string;
    value: string | number;
    highlight?: boolean;
  }>;
}

export default function PlayerStatsScreen() {
  const route = useRoute<PlayerStatsRouteProp>();
  const navigation = useNavigation<PlayerStatsNavigationProp>();
  const { playerId } = route.params;

  const [player, setPlayer] = useState<Player | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'season' | 'recent'>('season');

  useEffect(() => {
    loadPlayerData();
  }, [playerId]);

  const loadPlayerData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      // Load player details and stats
      const [playerResponse, statsResponse] = await Promise.all([
        basketballAPI.getPlayer(playerId),
        basketballAPI.getPlayerStats(playerId),
      ]);

      setPlayer(playerResponse.player);
      setPlayerStats(statsResponse.stats);

      // Set navigation title to player name
      navigation.setOptions({
        title: `${playerResponse.player.name} Stats`,
      });
    } catch (error) {
      console.error('Failed to load player data:', error);
      Alert.alert('Error', 'Failed to load player data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPlayerData(true);
  };

  const calculateAggregatedStats = () => {
    if (!playerStats.length) return null;

    // Filter stats based on selected period
    const filteredStats = selectedPeriod === 'recent' 
      ? playerStats.slice(-10) // Last 10 games
      : playerStats;

    // Calculate totals
    const totals = filteredStats.reduce((acc, stat) => {
      acc.points += stat.points || 0;
      acc.field_goals_made += stat.field_goals_made || 0;
      acc.field_goals_attempted += stat.field_goals_attempted || 0;
      acc.three_pointers_made += stat.three_pointers_made || 0;
      acc.three_pointers_attempted += stat.three_pointers_attempted || 0;
      acc.free_throws_made += stat.free_throws_made || 0;
      acc.free_throws_attempted += stat.free_throws_attempted || 0;
      acc.rebounds_offensive += stat.rebounds_offensive || 0;
      acc.rebounds_defensive += stat.rebounds_defensive || 0;
      acc.assists += stat.assists || 0;
      acc.steals += stat.steals || 0;
      acc.blocks += stat.blocks || 0;
      acc.turnovers += stat.turnovers || 0;
      acc.fouls_personal += stat.fouls_personal || 0;
      acc.minutes_played += stat.minutes_played || 0;
      return acc;
    }, {
      points: 0,
      field_goals_made: 0,
      field_goals_attempted: 0,
      three_pointers_made: 0,
      three_pointers_attempted: 0,
      free_throws_made: 0,
      free_throws_attempted: 0,
      rebounds_offensive: 0,
      rebounds_defensive: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      fouls_personal: 0,
      minutes_played: 0,
    });

    const games = filteredStats.length;
    const totalRebounds = totals.rebounds_offensive + totals.rebounds_defensive;

    // Calculate averages and percentages
    const averages = {
      points: games > 0 ? (totals.points / games).toFixed(1) : '0.0',
      rebounds: games > 0 ? (totalRebounds / games).toFixed(1) : '0.0',
      assists: games > 0 ? (totals.assists / games).toFixed(1) : '0.0',
      fg_percentage: totals.field_goals_attempted > 0 
        ? ((totals.field_goals_made / totals.field_goals_attempted) * 100).toFixed(1)
        : '0.0',
      three_percentage: totals.three_pointers_attempted > 0
        ? ((totals.three_pointers_made / totals.three_pointers_attempted) * 100).toFixed(1)
        : '0.0',
      ft_percentage: totals.free_throws_attempted > 0
        ? ((totals.free_throws_made / totals.free_throws_attempted) * 100).toFixed(1)
        : '0.0',
    };

    return { totals, averages, games };
  };

  const getStatCategories = (): StatCategory[] => {
    const stats = calculateAggregatedStats();
    if (!stats) return [];

    const { totals, averages, games } = stats;

    return [
      {
        title: 'Scoring',
        stats: [
          { label: 'PPG', value: averages.points, highlight: true },
          { label: 'Total Points', value: totals.points },
          { label: 'FG%', value: `${averages.fg_percentage}%` },
          { label: 'FGM/FGA', value: `${totals.field_goals_made}/${totals.field_goals_attempted}` },
          { label: '3P%', value: `${averages.three_percentage}%` },
          { label: '3PM/3PA', value: `${totals.three_pointers_made}/${totals.three_pointers_attempted}` },
          { label: 'FT%', value: `${averages.ft_percentage}%` },
          { label: 'FTM/FTA', value: `${totals.free_throws_made}/${totals.free_throws_attempted}` },
        ],
      },
      {
        title: 'Rebounds & Assists',
        stats: [
          { label: 'RPG', value: averages.rebounds, highlight: true },
          { label: 'Total Rebounds', value: totals.rebounds_offensive + totals.rebounds_defensive },
          { label: 'Offensive Rebounds', value: totals.rebounds_offensive },
          { label: 'Defensive Rebounds', value: totals.rebounds_defensive },
          { label: 'APG', value: averages.assists, highlight: true },
          { label: 'Total Assists', value: totals.assists },
        ],
      },
      {
        title: 'Defense & Hustle',
        stats: [
          { label: 'Steals', value: totals.steals },
          { label: 'Blocks', value: totals.blocks },
          { label: 'Turnovers', value: totals.turnovers },
          { label: 'Personal Fouls', value: totals.fouls_personal },
        ],
      },
      {
        title: 'Game Info',
        stats: [
          { label: 'Games Played', value: games },
          { label: 'Total Minutes', value: Math.round(totals.minutes_played) },
          { label: 'Avg Minutes', value: games > 0 ? (totals.minutes_played / games).toFixed(1) : '0.0' },
        ],
      },
    ];
  };

  const renderStatCard = (category: StatCategory) => (
    <View key={category.title} style={styles.statCard}>
      <Text style={styles.statCardTitle}>{category.title}</Text>
      <View style={styles.statGrid}>
        {category.stats.map((stat, index) => (
          <View key={index} style={styles.statItem}>
            <Text style={[
              styles.statValue, 
              stat.highlight && styles.highlightValue
            ]}>
              {stat.value}
            </Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderRecentGames = () => {
    const recentGames = playerStats.slice(-5).reverse(); // Last 5 games, most recent first
    
    if (!recentGames.length) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No recent games</Text>
        </View>
      );
    }

    return (
      <View style={styles.recentGamesSection}>
        <Text style={styles.sectionTitle}>Recent Games</Text>
        {recentGames.map((stat, index) => (
          <View key={stat.id} style={styles.gameStatCard}>
            <View style={styles.gameStatHeader}>
              <Text style={styles.gameDate}>
                {BasketballUtils.formatGameDate(stat.created_at)}
              </Text>
              <Text style={styles.gameOpponent}>
                vs {stat.game?.away_team?.name || stat.game?.home_team?.name || 'Opponent'}
              </Text>
            </View>
            <View style={styles.gameStatRow}>
              <View style={styles.gameStatItem}>
                <Text style={styles.gameStatValue}>{stat.points || 0}</Text>
                <Text style={styles.gameStatLabel}>PTS</Text>
              </View>
              <View style={styles.gameStatItem}>
                <Text style={styles.gameStatValue}>
                  {(stat.rebounds_offensive || 0) + (stat.rebounds_defensive || 0)}
                </Text>
                <Text style={styles.gameStatLabel}>REB</Text>
              </View>
              <View style={styles.gameStatItem}>
                <Text style={styles.gameStatValue}>{stat.assists || 0}</Text>
                <Text style={styles.gameStatLabel}>AST</Text>
              </View>
              <View style={styles.gameStatItem}>
                <Text style={styles.gameStatValue}>
                  {stat.field_goals_attempted > 0 
                    ? `${((stat.field_goals_made / stat.field_goals_attempted) * 100).toFixed(0)}%`
                    : '0%'
                  }
                </Text>
                <Text style={styles.gameStatLabel}>FG%</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading player stats...</Text>
      </View>
    );
  }

  if (!player) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Player not found</Text>
      </View>
    );
  }

  const statCategories = getStatCategories();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Player Header */}
      <View style={styles.playerHeader}>
        <View style={styles.playerInfo}>
          <Text style={styles.playerNumber}>#{player.jersey_number}</Text>
          <View style={styles.playerDetails}>
            <Text style={styles.playerName}>{player.name}</Text>
            <Text style={styles.playerMeta}>
              {player.position} • {player.height}" • {player.weight}lbs
            </Text>
            <Text style={styles.teamName}>{player.team?.name}</Text>
          </View>
        </View>
        
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'season' && styles.activePeriodButton
            ]}
            onPress={() => setSelectedPeriod('season')}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === 'season' && styles.activePeriodButtonText
            ]}>
              Season
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'recent' && styles.activePeriodButton
            ]}
            onPress={() => setSelectedPeriod('recent')}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === 'recent' && styles.activePeriodButtonText
            ]}>
              Recent
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        {statCategories.map(category => renderStatCard(category))}

        {/* Recent Games */}
        {renderRecentGames()}
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
  playerHeader: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  playerNumber: {
    color: '#EF4444',
    fontSize: 36,
    fontWeight: 'bold',
    marginRight: 16,
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    color: '#F9FAFB',
    fontSize: 20,
    fontWeight: 'bold',
  },
  playerMeta: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 2,
  },
  teamName: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activePeriodButton: {
    backgroundColor: '#EF4444',
  },
  periodButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  activePeriodButtonText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  statCardTitle: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: 'bold',
  },
  highlightValue: {
    color: '#EF4444',
    fontSize: 24,
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  recentGamesSection: {
    marginTop: 8,
  },
  gameStatCard: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  gameStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gameDate: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  gameOpponent: {
    color: '#F9FAFB',
    fontSize: 12,
    fontWeight: '600',
  },
  gameStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  gameStatItem: {
    alignItems: 'center',
  },
  gameStatValue: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gameStatLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
});