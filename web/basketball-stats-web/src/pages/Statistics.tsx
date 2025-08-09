import React, { useState, useEffect } from 'react';
import { useAuthStore, basketballAPI } from '@basketball-stats/shared';
import { 
  TrophyIcon, 
  UsersIcon, 
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import '../Statistics.css';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

function StatCard({ title, value, subtitle, icon, trend }: StatCardProps) {
  const getTrendIcon = () => {
    if (trend === 'up') return <ArrowUpIcon className="stat-trend-icon green" />;
    if (trend === 'down') return <ArrowDownIcon className="stat-trend-icon red" />;
    return null;
  };

  return (
    <div className="stat-card">
      <div className="stat-header">
        {icon && <div className="stat-icon">{icon}</div>}
        <div className="stat-content">
          <h3 className="stat-title">{title}</h3>
          <div className="stat-value-container">
            <span className="stat-value">{value}</span>
            {getTrendIcon()}
          </div>
          {subtitle && <p className="stat-subtitle">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

interface LeadersBoardProps {
  title: string;
  leaders: { [key: string]: number };
  unit?: string;
}

function LeadersBoard({ title, leaders, unit = '' }: LeadersBoardProps) {
  const leadersList = Object.entries(leaders).slice(0, 5);

  return (
    <div className="leaders-board">
      <h3 className="leaders-title">{title}</h3>
      <div className="leaders-list">
        {leadersList.map(([player, value], index) => (
          <div key={player} className="leader-item">
            <div className="leader-rank">{index + 1}</div>
            <div className="leader-info">
              <span className="leader-name">{player}</span>
              <span className="leader-value">{value.toFixed(1)}{unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface StandingsTableProps {
  standings: any[];
}

function StandingsTable({ standings }: StandingsTableProps) {
  return (
    <div className="standings-table">
      <h3 className="standings-title">League Standings</h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Team</th>
              <th>W</th>
              <th>L</th>
              <th>Win%</th>
              <th>PPG</th>
            </tr>
          </thead>
          <tbody>
            {standings.slice(0, 10).map((team, index) => (
              <tr key={team.team_id}>
                <td>
                  <div className="team-info">
                    <span className="team-rank">{index + 1}</span>
                    <span className="team-name">{team.team_name}</span>
                  </div>
                </td>
                <td className="stat-number">{team.wins}</td>
                <td className="stat-number">{team.losses}</td>
                <td className="stat-number">{team.win_percentage.toFixed(1)}%</td>
                <td className="stat-number">{team.avg_points?.toFixed(1) || '0.0'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Statistics() {
  const { selectedLeague } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [playersData, setPlayersData] = useState<any>(null);
  const [teamsData, setTeamsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'players' | 'teams' | 'charts'>('overview');
  const [sortBy, setSortBy] = useState('avg_points');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (selectedLeague) {
      loadStatistics();
    }
  }, [selectedLeague]);

  const loadStatistics = async () => {
    if (!selectedLeague) return;
    
    setLoading(true);
    try {
      // Load dashboard data
      const dashboard = await basketballAPI.getStatisticsDashboard(selectedLeague.id);
      setDashboardData(dashboard);

      // Load players data
      const players = await basketballAPI.getPlayersStatistics(selectedLeague.id, {
        per_page: 20,
        sort_by: sortBy,
        order: sortOrder
      });
      setPlayersData(players);

      // Load teams data
      const teams = await basketballAPI.getTeamsStatistics(selectedLeague.id, {
        sort_by: 'win_percentage',
        order: 'desc'
      });
      setTeamsData(teams);

    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = async (newSortBy: string) => {
    const newOrder = newSortBy === sortBy && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(newSortBy);
    setSortOrder(newOrder);
    
    if (selectedLeague) {
      const players = await basketballAPI.getPlayersStatistics(selectedLeague.id, {
        per_page: 20,
        sort_by: newSortBy,
        order: newOrder
      });
      setPlayersData(players);
    }
  };

  if (loading) {
    return (
      <div className="statistics-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (!selectedLeague) {
    return (
      <div className="statistics-container">
        <div className="empty-state">
          <TrophyIcon className="empty-icon" />
          <h3>No League Selected</h3>
          <p>Please select a league to view statistics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="statistics-container">
      <div className="statistics-header">
        <h1 className="page-title">Statistics Dashboard</h1>
        <p className="page-subtitle">{selectedLeague.name} - {selectedLeague.season}</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'players' ? 'active' : ''}`}
          onClick={() => setActiveTab('players')}
        >
          Players
        </button>
        <button
          className={`tab-button ${activeTab === 'teams' ? 'active' : ''}`}
          onClick={() => setActiveTab('teams')}
        >
          Teams
        </button>
        <button
          className={`tab-button ${activeTab === 'charts' ? 'active' : ''}`}
          onClick={() => setActiveTab('charts')}
        >
          Charts
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && dashboardData && (
        <div className="overview-content">
          {/* League Stats Overview */}
          <div className="stats-grid">
            <StatCard
              title="Total Games"
              value={dashboardData.league_info?.total_games || 0}
              subtitle="Completed games"
              icon={<TrophyIcon className="stat-card-icon" />}
            />
            <StatCard
              title="Total Teams"
              value={dashboardData.league_info?.total_teams || 0}
              subtitle="Active teams"
              icon={<UsersIcon className="stat-card-icon" />}
            />
            <StatCard
              title="Total Players"
              value={dashboardData.league_info?.total_players || 0}
              subtitle="Registered players"
              icon={<ChartBarIcon className="stat-card-icon" />}
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
              icon={<ChartBarIcon className="stat-card-icon" />}
            />
          </div>

          {/* Leaders and Standings */}
          <div className="dashboard-grid">
            <div className="leaders-section">
              <div className="leaders-grid">
                <LeadersBoard
                  title="Scoring Leaders"
                  leaders={dashboardData.leaders?.scoring || {}}
                  unit=" PPG"
                />
                <LeadersBoard
                  title="Rebounding Leaders"
                  leaders={dashboardData.leaders?.rebounding || {}}
                  unit=" RPG"
                />
                <LeadersBoard
                  title="Assists Leaders"
                  leaders={dashboardData.leaders?.assists || {}}
                  unit=" APG"
                />
                <LeadersBoard
                  title="Shooting Leaders"
                  leaders={dashboardData.leaders?.shooting || {}}
                  unit="%"
                />
              </div>
            </div>

            <div className="standings-section">
              <StandingsTable standings={dashboardData.standings || []} />
            </div>
          </div>
        </div>
      )}

      {/* Players Tab */}
      {activeTab === 'players' && playersData && (
        <div className="players-content">
          <div className="players-table">
            <div className="table-header">
              <h3>Player Statistics</h3>
              <div className="sort-controls">
                <label>Sort by:</label>
                <select 
                  value={sortBy} 
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="sort-select"
                >
                  <option value="avg_points">Points</option>
                  <option value="avg_rebounds">Rebounds</option>
                  <option value="avg_assists">Assists</option>
                  <option value="field_goal_percentage">FG%</option>
                  <option value="games_played">Games</option>
                </select>
              </div>
            </div>
            
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Team</th>
                    <th>GP</th>
                    <th>PPG</th>
                    <th>RPG</th>
                    <th>APG</th>
                    <th>FG%</th>
                    <th>3P%</th>
                    <th>FT%</th>
                  </tr>
                </thead>
                <tbody>
                  {playersData.players?.map((player: any) => (
                    <tr key={player.player_id}>
                      <td>
                        <div className="player-info">
                          <span className="player-name">{player.player_name}</span>
                          {player.position && (
                            <span className="player-position">{player.position}</span>
                          )}
                        </div>
                      </td>
                      <td>{player.team}</td>
                      <td className="stat-number">{player.games_played}</td>
                      <td className="stat-number">{player.avg_points?.toFixed(1) || '0.0'}</td>
                      <td className="stat-number">{player.avg_rebounds?.toFixed(1) || '0.0'}</td>
                      <td className="stat-number">{player.avg_assists?.toFixed(1) || '0.0'}</td>
                      <td className="stat-number">{player.field_goal_percentage?.toFixed(1) || '0.0'}%</td>
                      <td className="stat-number">{player.three_point_percentage?.toFixed(1) || '0.0'}%</td>
                      <td className="stat-number">{player.free_throw_percentage?.toFixed(1) || '0.0'}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Teams Tab */}
      {activeTab === 'teams' && teamsData && (
        <div className="teams-content">
          <div className="teams-table">
            <h3>Team Statistics</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>W</th>
                    <th>L</th>
                    <th>Win%</th>
                    <th>PPG</th>
                    <th>RPG</th>
                    <th>APG</th>
                    <th>FG%</th>
                  </tr>
                </thead>
                <tbody>
                  {teamsData.teams?.map((team: any, index: number) => (
                    <tr key={team.team_id}>
                      <td>
                        <div className="team-info">
                          <span className="team-rank">{index + 1}</span>
                          <span className="team-name">{team.team_name}</span>
                        </div>
                      </td>
                      <td className="stat-number">{team.wins}</td>
                      <td className="stat-number">{team.losses}</td>
                      <td className="stat-number">{team.win_percentage?.toFixed(1) || '0.0'}%</td>
                      <td className="stat-number">{team.avg_points?.toFixed(1) || '0.0'}</td>
                      <td className="stat-number">{team.avg_rebounds?.toFixed(1) || '0.0'}</td>
                      <td className="stat-number">{team.avg_assists?.toFixed(1) || '0.0'}</td>
                      <td className="stat-number">{team.field_goal_percentage?.toFixed(1) || '0.0'}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Charts Tab */}
      {activeTab === 'charts' && dashboardData && playersData && teamsData && (
        <div className="charts-content">
          <div className="charts-grid">
            {/* Team Performance Comparison */}
            <div className="chart-section">
              <h3>Team Performance Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={teamsData.teams?.slice(0, 8) || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="team_name" 
                    stroke="#9CA3AF"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="avg_points" fill="#EA580C" name="Points" />
                  <Bar dataKey="avg_rebounds" fill="#3B82F6" name="Rebounds" />
                  <Bar dataKey="avg_assists" fill="#10B981" name="Assists" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Win Percentage Distribution */}
            <div className="chart-section">
              <h3>Win Percentage Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={teamsData.teams?.slice(0, 6).map((team: any, index: number) => ({
                      name: team.team_name,
                      value: team.win_percentage || 0,
                      fill: `hsl(${index * 60}, 70%, 50%)`
                    })) || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                    outerRadius={80}
                    dataKey="value"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Top Players Performance Radar */}
            <div className="chart-section">
              <h3>Top Players Performance Comparison</h3>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={[
                  {
                    metric: 'Points',
                    player1: playersData.players?.[0]?.avg_points || 0,
                    player2: playersData.players?.[1]?.avg_points || 0,
                    player3: playersData.players?.[2]?.avg_points || 0,
                    fullMark: Math.max(...(playersData.players?.slice(0, 10).map((p: any) => p.avg_points) || [20]))
                  },
                  {
                    metric: 'Rebounds',
                    player1: playersData.players?.[0]?.avg_rebounds || 0,
                    player2: playersData.players?.[1]?.avg_rebounds || 0,
                    player3: playersData.players?.[2]?.avg_rebounds || 0,
                    fullMark: Math.max(...(playersData.players?.slice(0, 10).map((p: any) => p.avg_rebounds) || [10]))
                  },
                  {
                    metric: 'Assists',
                    player1: playersData.players?.[0]?.avg_assists || 0,
                    player2: playersData.players?.[1]?.avg_assists || 0,
                    player3: playersData.players?.[2]?.avg_assists || 0,
                    fullMark: Math.max(...(playersData.players?.slice(0, 10).map((p: any) => p.avg_assists) || [10]))
                  },
                  {
                    metric: 'FG%',
                    player1: playersData.players?.[0]?.field_goal_percentage || 0,
                    player2: playersData.players?.[1]?.field_goal_percentage || 0,
                    player3: playersData.players?.[2]?.field_goal_percentage || 0,
                    fullMark: 100
                  },
                  {
                    metric: 'FT%',
                    player1: playersData.players?.[0]?.free_throw_percentage || 0,
                    player2: playersData.players?.[1]?.free_throw_percentage || 0,
                    player3: playersData.players?.[2]?.free_throw_percentage || 0,
                    fullMark: 100
                  }
                ]}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 'dataMax']}
                    tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  />
                  <Radar 
                    name={playersData.players?.[0]?.player_name || 'Player 1'} 
                    dataKey="player1" 
                    stroke="#EA580C" 
                    fill="#EA580C" 
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                  <Radar 
                    name={playersData.players?.[1]?.player_name || 'Player 2'} 
                    dataKey="player2" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                  <Radar 
                    name={playersData.players?.[2]?.player_name || 'Player 3'} 
                    dataKey="player3" 
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                  <Legend wrapperStyle={{ color: '#F9FAFB' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Shooting Efficiency Analysis */}
            <div className="chart-section">
              <h3>Team Shooting Efficiency</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={teamsData.teams?.slice(0, 8) || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="team_name" 
                    stroke="#9CA3AF"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#9CA3AF" fontSize={12} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }} 
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="field_goal_percentage" 
                    stroke="#EA580C" 
                    strokeWidth={3}
                    dot={{ fill: '#EA580C', strokeWidth: 2, r: 4 }}
                    name="Field Goal %"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="three_point_percentage" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    name="3-Point %"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="free_throw_percentage" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    name="Free Throw %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}