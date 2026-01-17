import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";
import {
  TrophyIcon,
  UsersIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { exportToCSV, playerStatsColumns, printPage } from "../utils/export";
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}

function StatCard({ title, value, subtitle, icon, trend }: StatCardProps) {
  const getTrendIcon = () => {
    if (trend === "up") return <ArrowUpIcon className="h-4 w-4 text-green-500" />;
    if (trend === "down") return <ArrowDownIcon className="h-4 w-4 text-red-500" />;
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        {icon && <div className="flex-shrink-0 mr-4">{icon}</div>}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{title}</h3>
          <div className="flex items-center">
            <span className="text-2xl font-bold text-gray-900 dark:text-white mr-2">{value}</span>
            {getTrendIcon()}
          </div>
          {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

interface LeadersBoardProps {
  title: string;
  leaders: Array<{ name: string; value: number }>;
  unit?: string;
}

function LeadersBoard({ title, leaders, unit = "" }: LeadersBoardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <div className="space-y-3">
        {leaders.slice(0, 5).map((leader, index) => (
          <div key={leader.name} className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center mr-3">
                {index + 1}
              </div>
              <span className="text-gray-900 dark:text-white font-medium">{leader.name}</span>
            </div>
            <span className="text-gray-700 dark:text-gray-300 font-semibold">
              {leader.value.toFixed(1)}
              {unit}
            </span>
          </div>
        ))}
        {leaders.length === 0 && (
          <p className="text-gray-600 dark:text-gray-400 text-sm">No data available</p>
        )}
      </div>
    </div>
  );
}

interface StandingsTableProps {
  standings: any[];
}

function StandingsTable({ standings }: StandingsTableProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">League Standings</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-750">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Team
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                W
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                L
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Win%
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                PPG
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {standings.slice(0, 10).map((team, index) => (
              <tr key={team.teamId} className="hover:bg-gray-100 dark:hover:bg-gray-750">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center mr-3">
                      {index + 1}
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {team.teamName}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                  {team.wins}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                  {team.losses}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                  {team.winPercentage.toFixed(1)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                  {team.avgPoints?.toFixed(1) || "0.0"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Statistics() {
  const { token, selectedLeague } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "players" | "teams" | "charts">(
    "overview"
  );
  const [sortBy, setSortBy] = useState("avgPoints");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch dashboard data from Convex
  const dashboardData = useQuery(
    api.statistics.getDashboard,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  // Fetch players statistics
  const playersData = useQuery(
    api.statistics.getPlayersStats,
    token && selectedLeague
      ? { token, leagueId: selectedLeague.id, sortBy, order: sortOrder, perPage: 20 }
      : "skip"
  );

  // Fetch teams statistics
  const teamsData = useQuery(
    api.statistics.getTeamsStats,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  const handleSortChange = (newSortBy: string) => {
    const newOrder = newSortBy === sortBy && sortOrder === "desc" ? "asc" : "desc";
    setSortBy(newSortBy);
    setSortOrder(newOrder);
  };

  if (dashboardData === undefined) {
    return (
      <div className="statistics-container">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  if (!selectedLeague) {
    return (
      <div className="statistics-container">
        <div className="text-center py-12">
          <TrophyIcon className="mx-auto h-12 w-12 text-gray-600 dark:text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            No League Selected
          </h3>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Please select a league to view statistics.
          </p>
        </div>
      </div>
    );
  }

  const leaders = dashboardData?.leaders || {
    scoring: [],
    rebounding: [],
    assists: [],
    shooting: [],
  };

  const standings = dashboardData?.standings || [];
  const leagueInfo = dashboardData?.leagueInfo || {
    totalGames: 0,
    totalTeams: 0,
    totalPlayers: 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Statistics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {selectedLeague.name} - {selectedLeague.season}
          </p>
        </div>
        {/* Export Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => {
              if (playersData?.players && playersData.players.length > 0) {
                const filename = `player_stats_${selectedLeague.name}_${new Date().toISOString().split("T")[0]}`;
                exportToCSV(playersData.players, playerStatsColumns, filename);
              }
            }}
            disabled={!playersData?.players?.length}
            className="flex items-center space-x-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export Player Stats to CSV"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={printPage}
            className="flex items-center space-x-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm transition-colors"
            title="Print / Save as PDF"
          >
            <PrinterIcon className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
        <button
          className={`px-4 py-2 font-medium ${activeTab === "overview" ? "text-orange-500 border-b-2 border-orange-500" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === "players" ? "text-orange-500 border-b-2 border-orange-500" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
          onClick={() => setActiveTab("players")}
        >
          Players
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === "teams" ? "text-orange-500 border-b-2 border-orange-500" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
          onClick={() => setActiveTab("teams")}
        >
          Teams
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === "charts" ? "text-orange-500 border-b-2 border-orange-500" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
          onClick={() => setActiveTab("charts")}
        >
          Charts
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* League Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Games"
              value={leagueInfo.totalGames}
              subtitle="Completed games"
              icon={<TrophyIcon className="h-8 w-8 text-orange-500" />}
            />
            <StatCard
              title="Total Teams"
              value={leagueInfo.totalTeams}
              subtitle="Active teams"
              icon={<UsersIcon className="h-8 w-8 text-blue-500" />}
            />
            <StatCard
              title="Total Players"
              value={leagueInfo.totalPlayers}
              subtitle="Registered players"
              icon={<ChartBarIcon className="h-8 w-8 text-green-500" />}
            />
            <StatCard
              title="Average PPG"
              value={
                dashboardData?.recentGames?.length > 0
                  ? (
                      dashboardData.recentGames.reduce(
                        (sum: number, game: any) => sum + (game.homeScore + game.awayScore),
                        0
                      ) / dashboardData.recentGames.length
                    ).toFixed(1)
                  : "0.0"
              }
              subtitle="Points per game"
              icon={<ChartBarIcon className="h-8 w-8 text-purple-500" />}
            />
          </div>

          {/* Leaders and Standings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <LeadersBoard title="Scoring Leaders" leaders={leaders.scoring} unit=" PPG" />
              <LeadersBoard title="Rebounding Leaders" leaders={leaders.rebounding} unit=" RPG" />
              <LeadersBoard title="Assists Leaders" leaders={leaders.assists} unit=" APG" />
              <LeadersBoard title="Shooting Leaders" leaders={leaders.shooting} unit="%" />
            </div>

            <div>
              <StandingsTable standings={standings} />
            </div>
          </div>
        </div>
      )}

      {/* Players Tab */}
      {activeTab === "players" && playersData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Player Statistics
            </h3>
            <div className="flex items-center space-x-2">
              <label className="text-gray-600 dark:text-gray-400 text-sm">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="avgPoints">Points</option>
                <option value="avgRebounds">Rebounds</option>
                <option value="avgAssists">Assists</option>
                <option value="fieldGoalPercentage">FG%</option>
                <option value="gamesPlayed">Games</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-750">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    Player
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    GP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    PPG
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    RPG
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    APG
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    FG%
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    3P%
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    FT%
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {playersData.players?.map((player: any) => (
                  <tr key={player.playerId} className="hover:bg-gray-100 dark:hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-gray-900 dark:text-white font-medium">
                          {player.playerName}
                        </span>
                        {player.position && (
                          <span className="text-gray-600 dark:text-gray-400 text-xs">
                            {player.position}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {player.teamName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {player.gamesPlayed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {player.avgPoints?.toFixed(1) || "0.0"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {player.avgRebounds?.toFixed(1) || "0.0"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {player.avgAssists?.toFixed(1) || "0.0"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {player.fieldGoalPercentage?.toFixed(1) || "0.0"}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {player.threePointPercentage?.toFixed(1) || "0.0"}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {player.freeThrowPercentage?.toFixed(1) || "0.0"}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Teams Tab */}
      {activeTab === "teams" && teamsData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Statistics</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-750">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    W
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    L
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    Win%
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    PPG
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    RPG
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    APG
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    FG%
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {teamsData.teams?.map((team: any, index: number) => (
                  <tr key={team.teamId} className="hover:bg-gray-100 dark:hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center mr-3">
                          {index + 1}
                        </span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {team.teamName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {team.wins}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {team.losses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {team.winPercentage?.toFixed(1) || "0.0"}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {team.avgPoints?.toFixed(1) || "0.0"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {team.avgRebounds?.toFixed(1) || "0.0"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {team.avgAssists?.toFixed(1) || "0.0"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {team.fieldGoalPercentage?.toFixed(1) || "0.0"}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charts Tab */}
      {activeTab === "charts" && teamsData && playersData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team Performance Comparison */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Team Performance Comparison
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamsData.teams?.slice(0, 8) || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="teamName"
                  stroke="#9CA3AF"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F9FAFB",
                  }}
                />
                <Legend />
                <Bar dataKey="avgPoints" fill="#EA580C" name="Points" />
                <Bar dataKey="avgRebounds" fill="#3B82F6" name="Rebounds" />
                <Bar dataKey="avgAssists" fill="#10B981" name="Assists" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Win Percentage Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Win Percentage Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={
                    teamsData.teams?.slice(0, 6).map((team: any, index: number) => ({
                      name: team.teamName,
                      value: team.winPercentage || 0,
                      fill: `hsl(${index * 60}, 70%, 50%)`,
                    })) || []
                  }
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${(value ?? 0).toFixed(1)}%`}
                  outerRadius={80}
                  dataKey="value"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F9FAFB",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Players Performance Radar */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top Players Performance Comparison
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart
                data={[
                  {
                    metric: "Points",
                    player1: playersData.players?.[0]?.avgPoints || 0,
                    player2: playersData.players?.[1]?.avgPoints || 0,
                    player3: playersData.players?.[2]?.avgPoints || 0,
                  },
                  {
                    metric: "Rebounds",
                    player1: playersData.players?.[0]?.avgRebounds || 0,
                    player2: playersData.players?.[1]?.avgRebounds || 0,
                    player3: playersData.players?.[2]?.avgRebounds || 0,
                  },
                  {
                    metric: "Assists",
                    player1: playersData.players?.[0]?.avgAssists || 0,
                    player2: playersData.players?.[1]?.avgAssists || 0,
                    player3: playersData.players?.[2]?.avgAssists || 0,
                  },
                  {
                    metric: "FG%",
                    player1: playersData.players?.[0]?.fieldGoalPercentage || 0,
                    player2: playersData.players?.[1]?.fieldGoalPercentage || 0,
                    player3: playersData.players?.[2]?.fieldGoalPercentage || 0,
                  },
                  {
                    metric: "FT%",
                    player1: playersData.players?.[0]?.freeThrowPercentage || 0,
                    player2: playersData.players?.[1]?.freeThrowPercentage || 0,
                    player3: playersData.players?.[2]?.freeThrowPercentage || 0,
                  },
                ]}
              >
                <PolarGrid stroke="#374151" />
                {/* @ts-expect-error Recharts type compatibility with React 18 */}
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, "dataMax"]}
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                />
                <Radar
                  name={playersData.players?.[0]?.playerName || "Player 1"}
                  dataKey="player1"
                  stroke="#EA580C"
                  fill="#EA580C"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Radar
                  name={playersData.players?.[1]?.playerName || "Player 2"}
                  dataKey="player2"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Radar
                  name={playersData.players?.[2]?.playerName || "Player 3"}
                  dataKey="player3"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Legend wrapperStyle={{ color: "#F9FAFB" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F9FAFB",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Shooting Efficiency Analysis */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Team Shooting Efficiency
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={teamsData.teams?.slice(0, 8) || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="teamName"
                  stroke="#9CA3AF"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#9CA3AF" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F9FAFB",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="fieldGoalPercentage"
                  stroke="#EA580C"
                  strokeWidth={3}
                  dot={{ fill: "#EA580C", strokeWidth: 2, r: 4 }}
                  name="Field Goal %"
                />
                <Line
                  type="monotone"
                  dataKey="threePointPercentage"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                  name="3-Point %"
                />
                <Line
                  type="monotone"
                  dataKey="freeThrowPercentage"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                  name="Free Throw %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
