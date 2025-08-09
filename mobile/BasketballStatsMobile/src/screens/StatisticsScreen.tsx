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
  Dimensions,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useAuthStore, basketballAPI } from '@basketball-stats/shared';

const screenWidth = Dimensions.get('window').width;

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

function StatCard({ title, value, subtitle, color = '#EA580C' }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: color }]}>
        <Text style={styles.statIcon}>📊</Text>
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

interface LeaderItemProps {
  rank: number;
  playerName: string;
  value: number;
  unit?: string;
}

function LeaderItem({ rank, playerName, value, unit = '' }: LeaderItemProps) {
  return (
    <View style={styles.leaderItem}>
      <View style={styles.leaderRank}>
        <Text style={styles.leaderRankText}>{rank}</Text>
      </View>
      <View style={styles.leaderInfo}>
        <Text style={styles.leaderName}>{playerName}</Text>
        <Text style={styles.leaderValue}>{value.toFixed(1)}{unit}</Text>
      </View>
    </View>
  );
}

interface StandingsItemProps {
  rank: number;
  teamName: string;
  wins: number;
  losses: number;
  winPercentage: number;
  avgPoints?: number;
}

function StandingsItem({ rank, teamName, wins, losses, winPercentage, avgPoints }: StandingsItemProps) {
  return (
    <View style={styles.standingsItem}>
      <View style={styles.standingsRank}>
        <Text style={styles.standingsRankText}>{rank}</Text>
      </View>
      <View style={styles.standingsTeam}>
        <Text style={styles.standingsTeamName}>{teamName}</Text>
      </View>
      <View style={styles.standingsStats}>
        <Text style={styles.standingsWins}>{wins}-{losses}</Text>
        <Text style={styles.standingsPercentage}>{winPercentage.toFixed(1)}%</Text>
        {avgPoints && <Text style={styles.standingsPoints}>{avgPoints.toFixed(1)} PPG</Text>}
      </View>
    </View>
  );
}

export default function StatisticsScreen() {
  const { selectedLeague } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'leaders' | 'standings' | 'charts'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (selectedLeague) {
      loadStatistics();
    }
  }, [selectedLeague]);

  const loadStatistics = async () => {
    if (!selectedLeague) return;
    
    try {
      setLoading(true);
      const dashboard = await basketballAPI.getStatisticsDashboard(selectedLeague.id);
      setDashboardData(dashboard);
    } catch (error) {
      console.error('Failed to load statistics:', error);
      Alert.alert('Error', 'Failed to load statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStatistics();
    setRefreshing(false);
  };

  if (loading && !dashboardData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EA580C" />
        <Text style={styles.loadingText}>Loading statistics...</Text>
      </View>
    );
  }

  if (!selectedLeague) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🏀</Text>
        <Text style={styles.emptyTitle}>No League Selected</Text>
        <Text style={styles.emptySubtitle}>Please select a league to view statistics.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Statistics Dashboard</Text>
        <Text style={styles.headerSubtitle}>{selectedLeague.name} • {selectedLeague.season}</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'leaders' && styles.activeTab]}
          onPress={() => setActiveTab('leaders')}
        >
          <Text style={[styles.tabText, activeTab === 'leaders' && styles.activeTabText]}>
            Leaders
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'standings' && styles.activeTab]}
          onPress={() => setActiveTab('standings')}
        >
          <Text style={[styles.tabText, activeTab === 'standings' && styles.activeTabText]}>
            Standings
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'charts' && styles.activeTab]}
          onPress={() => setActiveTab('charts')}
        >
          <Text style={[styles.tabText, activeTab === 'charts' && styles.activeTabText]}>
            Charts
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Overview Tab */}
        {activeTab === 'overview' && dashboardData && (
          <View style={styles.tabContent}>
            {/* League Stats Overview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>League Overview</Text>
              <View style={styles.statsGrid}>
                <StatCard
                  title="Total Games"
                  value={dashboardData.league_info?.total_games || 0}
                  subtitle="Completed games"
                  color="#10B981"
                />
                <StatCard
                  title="Total Teams"
                  value={dashboardData.league_info?.total_teams || 0}
                  subtitle="Active teams"
                  color="#3B82F6"
                />
                <StatCard
                  title="Total Players"
                  value={dashboardData.league_info?.total_players || 0}
                  subtitle="Registered players"
                  color="#8B5CF6"
                />
                <StatCard
                  title="Average PPG"
                  value={
                    dashboardData.recent_games?.length > 0
                      ? (
                          dashboardData.recent_games.reduce((sum: number, game: any) => sum + game.total_points, 0) /
                          dashboardData.recent_games.length
                        ).toFixed(1)
                      : '0.0'
                  }
                  subtitle="Points per game"
                  color="#EF4444"
                />
              </View>
            </View>

            {/* Recent Games */}
            {dashboardData.recent_games?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Games</Text>
                {dashboardData.recent_games.slice(0, 5).map((game: any, index: number) => (
                  <View key={game.id} style={styles.gameItem}>
                    <View style={styles.gameTeams}>
                      <Text style={styles.gameTeamName}>{game.home_team}</Text>
                      <Text style={styles.gameVs}>vs</Text>
                      <Text style={styles.gameTeamName}>{game.away_team}</Text>
                    </View>
                    <View style={styles.gameScore}>
                      <Text style={styles.gameScoreText}>
                        {game.home_score} - {game.away_score}
                      </Text>
                      <Text style={styles.gameTotal}>({game.total_points} pts)</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Leaders Tab */}
        {activeTab === 'leaders' && dashboardData && (
          <View style={styles.tabContent}>
            {/* Scoring Leaders */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Scoring Leaders</Text>
              {Object.entries(dashboardData.leaders?.scoring || {}).slice(0, 5).map(([player, points], index) => (
                <LeaderItem
                  key={player}
                  rank={index + 1}
                  playerName={player}
                  value={points as number}
                  unit=" PPG"
                />
              ))}
            </View>

            {/* Rebounding Leaders */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rebounding Leaders</Text>
              {Object.entries(dashboardData.leaders?.rebounding || {}).slice(0, 5).map(([player, rebounds], index) => (
                <LeaderItem
                  key={player}
                  rank={index + 1}
                  playerName={player}
                  value={rebounds as number}
                  unit=" RPG"
                />
              ))}
            </View>

            {/* Assists Leaders */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Assists Leaders</Text>
              {Object.entries(dashboardData.leaders?.assists || {}).slice(0, 5).map(([player, assists], index) => (
                <LeaderItem
                  key={player}
                  rank={index + 1}
                  playerName={player}
                  value={assists as number}
                  unit=" APG"
                />
              ))}
            </View>

            {/* Shooting Leaders */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Shooting Leaders (FG%)</Text>
              {Object.entries(dashboardData.leaders?.shooting || {}).slice(0, 5).map(([player, percentage], index) => (
                <LeaderItem
                  key={player}
                  rank={index + 1}
                  playerName={player}
                  value={percentage as number}
                  unit="%"
                />
              ))}
            </View>
          </View>
        )}

        {/* Standings Tab */}
        {activeTab === 'standings' && dashboardData && (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>League Standings</Text>
              {dashboardData.standings?.slice(0, 10).map((team: any, index: number) => (
                <StandingsItem
                  key={team.team_id}
                  rank={index + 1}
                  teamName={team.team_name}
                  wins={team.wins}
                  losses={team.losses}
                  winPercentage={team.win_percentage}
                  avgPoints={team.avg_points}
                />
              ))}
            </View>
          </View>
        )}

        {/* Charts Tab */}
        {activeTab === 'charts' && dashboardData && (
          <View style={styles.tabContent}>
            {/* Team Performance Chart */}
            {dashboardData.standings?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Team Performance</Text>
                <View style={styles.chartContainer}>
                  <BarChart
                    data={{
                      labels: dashboardData.standings.slice(0, 6).map((team: any) => 
                        team.team_name.length > 8 ? team.team_name.substring(0, 8) + '...' : team.team_name
                      ),
                      datasets: [{
                        data: dashboardData.standings.slice(0, 6).map((team: any) => team.avg_points || 0)
                      }]
                    }}
                    width={screenWidth - 64}
                    height={220}
                    chartConfig={{
                      backgroundColor: '#1F2937',
                      backgroundGradientFrom: '#1F2937',
                      backgroundGradientTo: '#374151',
                      decimalPlaces: 1,
                      color: (opacity = 1) => `rgba(234, 88, 12, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
                      style: {
                        borderRadius: 16
                      },
                      propsForLabels: {
                        fontSize: 10
                      }
                    }}
                    style={{
                      marginVertical: 8,
                      borderRadius: 16
                    }}
                    showBarTops={false}
                    fromZero
                  />
                  <Text style={styles.chartLabel}>Average Points Per Game</Text>
                </View>
              </View>
            )}

            {/* Win Distribution Pie Chart */}
            {dashboardData.standings?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Win Distribution</Text>
                <View style={styles.chartContainer}>
                  <PieChart
                    data={dashboardData.standings.slice(0, 5).map((team: any, index: number) => ({
                      name: team.team_name.length > 10 ? team.team_name.substring(0, 10) + '...' : team.team_name,
                      population: team.wins || 1,
                      color: `hsl(${index * 72}, 70%, 50%)`,
                      legendFontColor: '#9CA3AF',
                      legendFontSize: 12
                    }))}
                    width={screenWidth - 64}
                    height={220}
                    chartConfig={{
                      backgroundColor: '#1F2937',
                      backgroundGradientFrom: '#1F2937',
                      backgroundGradientTo: '#374151',
                      color: (opacity = 1) => `rgba(234, 88, 12, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
                    }}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    style={{
                      marginVertical: 8,
                      borderRadius: 16
                    }}
                  />
                  <Text style={styles.chartLabel}>Total Wins by Team</Text>
                </View>
              </View>
            )}

            {/* Scoring Leaders Chart */}
            {dashboardData.leaders?.scoring && Object.keys(dashboardData.leaders.scoring).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Top Scorers</Text>
                <View style={styles.chartContainer}>
                  <BarChart
                    data={{
                      labels: Object.keys(dashboardData.leaders.scoring).slice(0, 5).map((name: string) => 
                        name.length > 8 ? name.substring(0, 8) + '...' : name
                      ),
                      datasets: [{
                        data: Object.values(dashboardData.leaders.scoring).slice(0, 5).map((value: any) => Number(value))
                      }]
                    }}
                    width={screenWidth - 64}
                    height={220}
                    chartConfig={{
                      backgroundColor: '#1F2937',
                      backgroundGradientFrom: '#1F2937',
                      backgroundGradientTo: '#374151',
                      decimalPlaces: 1,
                      color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
                      style: {
                        borderRadius: 16
                      },
                      propsForLabels: {
                        fontSize: 10
                      }
                    }}
                    style={{
                      marginVertical: 8,
                      borderRadius: 16
                    }}
                    showBarTops={false}
                    fromZero
                  />
                  <Text style={styles.chartLabel}>Points Per Game</Text>
                </View>
              </View>
            )}

            {/* Recent Games Trend */}
            {dashboardData.recent_games?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Scoring Trends</Text>
                <View style={styles.chartContainer}>
                  <LineChart
                    data={{
                      labels: dashboardData.recent_games.slice(-7).map((_: any, index: number) => 
                        `G${index + 1}`
                      ),
                      datasets: [{
                        data: dashboardData.recent_games.slice(-7).map((game: any) => game.total_points || 0),
                        strokeWidth: 3
                      }]
                    }}
                    width={screenWidth - 64}
                    height={220}
                    chartConfig={{
                      backgroundColor: '#1F2937',
                      backgroundGradientFrom: '#1F2937',
                      backgroundGradientTo: '#374151',
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
                      style: {
                        borderRadius: 16
                      },
                      propsForDots: {
                        r: '4',
                        strokeWidth: '2',
                        stroke: '#3B82F6'
                      },
                      propsForLabels: {
                        fontSize: 10
                      }
                    }}
                    bezier
                    style={{
                      marginVertical: 8,
                      borderRadius: 16
                    }}
                  />
                  <Text style={styles.chartLabel}>Recent Games Total Points</Text>
                </View>
              </View>
            )}
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
    paddingTop: 60,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#9CA3AF',
    fontSize: 16,
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statIcon: {
    fontSize: 20,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  statValue: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statSubtitle: {
    color: '#6B7280',
    fontSize: 10,
  },
  leaderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  leaderRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  leaderRankText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  leaderInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leaderName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  leaderValue: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  standingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  standingsRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  standingsRankText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  standingsTeam: {
    flex: 1,
  },
  standingsTeamName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  standingsStats: {
    alignItems: 'flex-end',
  },
  standingsWins: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  standingsPercentage: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  standingsPoints: {
    color: '#9CA3AF',
    fontSize: 10,
  },
  gameItem: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  gameTeamName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  gameVs: {
    color: '#9CA3AF',
    fontSize: 12,
    marginHorizontal: 8,
  },
  gameScore: {
    alignItems: 'flex-end',
  },
  gameScoreText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gameTotal: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  chartContainer: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  chartLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
});