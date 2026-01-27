import React, { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
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
    <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700 shadow-soft">
      <div className="flex items-center">
        {icon && <div className="flex-shrink-0 mr-4">{icon}</div>}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
            {title}
          </h3>
          <div className="flex items-center">
            <span className="text-2xl font-bold text-surface-900 dark:text-white mr-2" data-stat>
              {value}
            </span>
            {getTrendIcon()}
          </div>
          {subtitle && (
            <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface LeadersBoardProps {
  title: string;
  leaders: Array<{ id?: string; name: string; value: number; team?: string }>;
  unit?: string;
}

function LeadersBoard({ title, leaders, unit = "" }: LeadersBoardProps) {
  return (
    <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700 shadow-soft">
      <h3 className="section-header mb-4">{title}</h3>
      <div className="space-y-3">
        {leaders.slice(0, 5).map((leader, index) => (
          <div key={leader.id || leader.name} className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center mr-3">
                {index + 1}
              </div>
              <div className="flex flex-col">
                {leader.id ? (
                  <Link
                    to={`/app/players/${leader.id}`}
                    className="text-surface-900 dark:text-white font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {leader.name}
                  </Link>
                ) : (
                  <span className="text-surface-900 dark:text-white font-medium">
                    {leader.name}
                  </span>
                )}
                {leader.team && (
                  <span className="text-surface-500 dark:text-surface-400 text-xs">
                    {leader.team}
                  </span>
                )}
              </div>
            </div>
            <span className="text-surface-700 dark:text-surface-300 font-semibold" data-stat>
              {leader.value.toFixed(1)}
              {unit}
            </span>
          </div>
        ))}
        {leaders.length === 0 && (
          <p className="text-surface-600 dark:text-surface-400 text-sm">No data available</p>
        )}
      </div>
    </div>
  );
}

/** Recent game item from dashboard data */
interface DashboardRecentGame {
  id: string;
  date?: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  totalPoints: number;
}

/** Standings entry from dashboard data */
interface StandingsEntry {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  winPercentage: number;
  avgPoints?: number;
}

interface StandingsTableProps {
  standings: StandingsEntry[];
}

function StandingsTable({ standings }: StandingsTableProps) {
  return (
    <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-soft">
      <div className="p-6 border-b border-surface-200 dark:border-surface-700">
        <h3 id="standings-table-heading" className="section-header">
          League Standings
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table
          className="min-w-full divide-y divide-surface-200 dark:divide-surface-700"
          aria-labelledby="standings-table-heading"
        >
          <thead className="bg-surface-100 dark:bg-surface-700">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-surface-700 dark:text-surface-300 uppercase tracking-wider"
              >
                Team
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-surface-700 dark:text-surface-300 uppercase tracking-wider"
              >
                <abbr title="Wins">W</abbr>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-surface-700 dark:text-surface-300 uppercase tracking-wider"
              >
                <abbr title="Losses">L</abbr>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-surface-700 dark:text-surface-300 uppercase tracking-wider"
              >
                <abbr title="Win Percentage">Win%</abbr>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-surface-700 dark:text-surface-300 uppercase tracking-wider"
              >
                <abbr title="Points Per Game">PPG</abbr>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-surface-800 divide-y divide-surface-200 dark:divide-surface-700">
            {standings.slice(0, 10).map((team, index) => (
              <tr key={team.teamId} className="hover:bg-surface-100 dark:hover:bg-surface-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center mr-3">
                      {index + 1}
                    </span>
                    <span className="text-surface-900 dark:text-white font-medium">
                      {team.teamName}
                    </span>
                  </div>
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300"
                  data-stat
                >
                  {team.wins}
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300"
                  data-stat
                >
                  {team.losses}
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300"
                  data-stat
                >
                  {team.winPercentage.toFixed(1)}%
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300"
                  data-stat
                >
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
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL params or defaults
  const [activeTab, setActiveTab] = useState<"overview" | "players" | "teams" | "charts">(() => {
    const tab = searchParams.get("tab");
    if (tab === "overview" || tab === "players" || tab === "teams" || tab === "charts") {
      return tab;
    }
    return "overview";
  });
  const [sortBy, setSortBy] = useState(() => searchParams.get("sortBy") || "avgPoints");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(() => {
    const order = searchParams.get("order");
    return order === "asc" ? "asc" : "desc";
  });
  const [selectedRadarPlayers, setSelectedRadarPlayers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Sync state changes to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== "overview") params.set("tab", activeTab);
    if (sortBy !== "avgPoints") params.set("sortBy", sortBy);
    if (sortOrder !== "desc") params.set("order", sortOrder);
    setSearchParams(params, { replace: true });
  }, [activeTab, sortBy, sortOrder, setSearchParams]);

  // Fetch dashboard data from Convex
  const dashboardData = useQuery(
    api.statistics.getDashboard,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  // Fetch players statistics
  const playersData = useQuery(
    api.statistics.getPlayersStats,
    token && selectedLeague
      ? { token, leagueId: selectedLeague.id, sortBy, order: sortOrder, page: currentPage, perPage }
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
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  if (dashboardData === undefined) {
    return (
      <div className="statistics-container">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (!selectedLeague) {
    return (
      <div className="statistics-container">
        <div className="text-center py-12">
          <TrophyIcon className="mx-auto h-12 w-12 text-surface-600 dark:text-surface-400" />
          <h3 className="mt-2 text-lg font-medium text-surface-900 dark:text-white">
            No League Selected
          </h3>
          <p className="mt-1 text-surface-600 dark:text-surface-400">
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
          <h1 className="text-display-lg text-surface-900 dark:text-white">Statistics Dashboard</h1>
          <p className="text-surface-600 dark:text-surface-400">
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
            className="btn-secondary flex items-center space-x-1 px-3 py-2 rounded-lg text-sm"
            title="Export Player Stats to CSV"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={printPage}
            className="btn-secondary flex items-center space-x-1 px-3 py-2 rounded-lg text-sm"
            title="Print / Save as PDF"
          >
            <PrinterIcon className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        className="flex space-x-4 border-b border-surface-200 dark:border-surface-700"
        role="tablist"
        aria-label="Statistics views"
      >
        <button
          role="tab"
          aria-selected={activeTab === "overview"}
          aria-controls="panel-overview"
          id="tab-overview"
          tabIndex={activeTab === "overview" ? 0 : -1}
          className={`px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-t ${activeTab === "overview" ? "text-primary-500 border-b-2 border-primary-500" : "text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white"}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "players"}
          aria-controls="panel-players"
          id="tab-players"
          tabIndex={activeTab === "players" ? 0 : -1}
          className={`px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-t ${activeTab === "players" ? "text-primary-500 border-b-2 border-primary-500" : "text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white"}`}
          onClick={() => setActiveTab("players")}
        >
          Players
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "teams"}
          aria-controls="panel-teams"
          id="tab-teams"
          tabIndex={activeTab === "teams" ? 0 : -1}
          className={`px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-t ${activeTab === "teams" ? "text-primary-500 border-b-2 border-primary-500" : "text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white"}`}
          onClick={() => setActiveTab("teams")}
        >
          Teams
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "charts"}
          aria-controls="panel-charts"
          id="tab-charts"
          tabIndex={activeTab === "charts" ? 0 : -1}
          className={`px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-t ${activeTab === "charts" ? "text-primary-500 border-b-2 border-primary-500" : "text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white"}`}
          onClick={() => setActiveTab("charts")}
        >
          Charts
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div
          role="tabpanel"
          id="panel-overview"
          aria-labelledby="tab-overview"
          className="space-y-6"
        >
          {/* League Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Games"
              value={leagueInfo.totalGames}
              subtitle="Completed games"
              icon={<TrophyIcon className="h-8 w-8 text-primary-500" />}
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
                        (sum: number, game: DashboardRecentGame) =>
                          sum + (game.homeScore + game.awayScore),
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
        <div
          role="tabpanel"
          id="panel-players"
          aria-labelledby="tab-players"
          className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-soft"
        >
          <div className="p-6 border-b border-surface-200 dark:border-surface-700 flex justify-between items-center">
            <h3 className="section-header">Player Statistics</h3>
            <div className="flex items-center space-x-2">
              <label className="text-surface-600 dark:text-surface-400 text-sm">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="bg-surface-100 dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-md px-3 py-1 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            <table
              className="min-w-full divide-y divide-surface-200 dark:divide-surface-700"
              aria-label="Player statistics"
            >
              <thead className="bg-surface-100 dark:bg-surface-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-700 dark:text-surface-300 uppercase"
                  >
                    Player
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-700 dark:text-surface-300 uppercase"
                  >
                    Team
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-700 dark:text-surface-300 uppercase"
                  >
                    <abbr title="Games Played">GP</abbr>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-700 dark:text-surface-300 uppercase"
                  >
                    <abbr title="Points Per Game">PPG</abbr>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-700 dark:text-surface-300 uppercase"
                  >
                    <abbr title="Rebounds Per Game">RPG</abbr>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-700 dark:text-surface-300 uppercase"
                  >
                    <abbr title="Assists Per Game">APG</abbr>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-700 dark:text-surface-300 uppercase"
                  >
                    <abbr title="Field Goal Percentage">FG%</abbr>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-700 dark:text-surface-300 uppercase"
                  >
                    <abbr title="3-Point Percentage">3P%</abbr>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-700 dark:text-surface-300 uppercase"
                  >
                    <abbr title="Free Throw Percentage">FT%</abbr>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-surface-800 divide-y divide-surface-200 dark:divide-surface-700">
                {playersData.players?.map((player) => (
                  <tr
                    key={player.playerId}
                    className="hover:bg-surface-100 dark:hover:bg-surface-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-surface-900 dark:text-white font-medium">
                          {player.playerName}
                        </span>
                        {player.position && (
                          <span className="text-surface-600 dark:text-surface-400 text-xs">
                            {player.position}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300">
                      {player.teamName}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300"
                      data-stat
                    >
                      {player.gamesPlayed}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300"
                      data-stat
                    >
                      {player.avgPoints?.toFixed(1) || "0.0"}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300"
                      data-stat
                    >
                      {player.avgRebounds?.toFixed(1) || "0.0"}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300"
                      data-stat
                    >
                      {player.avgAssists?.toFixed(1) || "0.0"}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300"
                      data-stat
                    >
                      {player.fieldGoalPercentage?.toFixed(1) || "0.0"}%
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300"
                      data-stat
                    >
                      {player.threePointPercentage?.toFixed(1) || "0.0"}%
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300"
                      data-stat
                    >
                      {player.freeThrowPercentage?.toFixed(1) || "0.0"}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {playersData.pagination && (
            <div className="px-6 py-4 border-t border-surface-200 dark:border-surface-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                <span>
                  Showing{" "}
                  {(playersData.pagination.currentPage - 1) * playersData.pagination.perPage + 1} to{" "}
                  {Math.min(
                    playersData.pagination.currentPage * playersData.pagination.perPage,
                    playersData.pagination.totalCount
                  )}{" "}
                  of {playersData.pagination.totalCount} players
                </span>
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="ml-2 bg-surface-100 dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded px-2 py-1 text-sm"
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
              <div className="flex items-center gap-2" role="navigation" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="btn-ghost px-3 py-2 min-h-[44px] rounded border border-surface-300 dark:border-surface-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-100 dark:hover:bg-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="btn-ghost px-3 py-2 min-h-[44px] rounded border border-surface-300 dark:border-surface-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-100 dark:hover:bg-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-surface-700 dark:text-surface-300">
                  Page {playersData.pagination.currentPage} of {playersData.pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(playersData.pagination.totalPages, currentPage + 1))
                  }
                  disabled={currentPage >= playersData.pagination.totalPages}
                  className="btn-ghost px-3 py-2 min-h-[44px] rounded border border-surface-300 dark:border-surface-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-100 dark:hover:bg-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(playersData.pagination.totalPages)}
                  disabled={currentPage >= playersData.pagination.totalPages}
                  className="btn-ghost px-3 py-2 min-h-[44px] rounded border border-surface-300 dark:border-surface-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-100 dark:hover:bg-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Teams Tab */}
      {activeTab === "teams" && teamsData && (
        <div
          role="tabpanel"
          id="panel-teams"
          aria-labelledby="tab-teams"
          className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-soft"
        >
          <div className="p-6 border-b border-surface-200 dark:border-surface-700">
            <h3 className="section-header">Team Statistics</h3>
          </div>
          <div className="overflow-x-auto">
            <table
              className="min-w-full divide-y divide-surface-200 dark:divide-surface-700"
              aria-label="Team statistics"
            >
              <thead className="bg-surface-100 dark:bg-surface-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-700 dark:text-surface-300 uppercase"
                  >
                    Team
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-700 dark:text-surface-300 uppercase"
                  >
                    <abbr title="Wins">W</abbr>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-700 dark:text-surface-300 uppercase"
                  >
                    <abbr title="Losses">L</abbr>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-700 dark:text-surface-300 uppercase"
                  >
                    <abbr title="Win Percentage">Win%</abbr>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-700 dark:text-surface-300 uppercase"
                  >
                    <abbr title="Points Per Game">PPG</abbr>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-700 dark:text-surface-300 uppercase"
                  >
                    <abbr title="Rebounds Per Game">RPG</abbr>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-700 dark:text-surface-300 uppercase"
                  >
                    <abbr title="Assists Per Game">APG</abbr>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-700 dark:text-surface-300 uppercase"
                  >
                    <abbr title="Field Goal Percentage">FG%</abbr>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-surface-800 divide-y divide-surface-200 dark:divide-surface-700">
                {teamsData.teams?.map((team, index) => (
                  <tr key={team.teamId} className="hover:bg-surface-100 dark:hover:bg-surface-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center mr-3">
                          {index + 1}
                        </span>
                        <span className="text-surface-900 dark:text-white font-medium">
                          {team.teamName}
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300"
                      data-stat
                    >
                      {team.wins}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300"
                      data-stat
                    >
                      {team.losses}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300"
                      data-stat
                    >
                      {team.winPercentage?.toFixed(1) || "0.0"}%
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300"
                      data-stat
                    >
                      {team.avgPoints?.toFixed(1) || "0.0"}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300"
                      data-stat
                    >
                      {team.avgRebounds?.toFixed(1) || "0.0"}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300"
                      data-stat
                    >
                      {team.avgAssists?.toFixed(1) || "0.0"}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300"
                      data-stat
                    >
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
        <div
          role="tabpanel"
          id="panel-charts"
          aria-labelledby="tab-charts"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Team Performance Comparison */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700 shadow-soft">
            <h3 id="team-performance-heading" className="section-header mb-4">
              Team Performance Comparison
            </h3>
            <div
              role="img"
              aria-labelledby="team-performance-heading"
              aria-describedby="team-performance-desc"
            >
              <p id="team-performance-desc" className="sr-only">
                Bar chart comparing points, rebounds, and assists across teams
              </p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamsData.teams?.slice(0, 8) || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#5c5650" />
                <XAxis
                  dataKey="teamName"
                  stroke="#a69f96"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#a69f96" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                  }}
                  labelStyle={{ color: "#f1f5f9", fontWeight: 600, marginBottom: 4 }}
                  cursor={{ fill: "rgba(255,255,255,0.1)" }}
                />
                <Legend />
                <Bar dataKey="avgPoints" fill="#EA580C" name="Points" />
                <Bar dataKey="avgRebounds" fill="#3B82F6" name="Rebounds" />
                <Bar dataKey="avgAssists" fill="#10B981" name="Assists" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Points For vs Against */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700 shadow-soft">
            <h3 id="points-comparison-heading" className="section-header mb-4">
              Points For vs Against
            </h3>
            <div
              role="img"
              aria-labelledby="points-comparison-heading"
              aria-describedby="points-comparison-desc"
            >
              <p id="points-comparison-desc" className="sr-only">
                Bar chart comparing points scored vs points allowed per team
              </p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={
                  teamsData.teams?.slice(0, 8).map((team) => ({
                    name: team.teamName,
                    scored: team.avgPoints || 0,
                    allowed: team.avgPointsAllowed || 0,
                  })) || []
                }
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#5c5650" />
                <XAxis type="number" stroke="#a69f96" fontSize={12} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  stroke="#a69f96"
                  fontSize={11}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                  }}
                  labelStyle={{ color: "#f1f5f9", fontWeight: 600, marginBottom: 4 }}
                  itemStyle={{ color: "#e2e8f0" }}
                  formatter={(value) => (typeof value === "number" ? value.toFixed(1) : value)}
                  cursor={{ fill: "rgba(255,255,255,0.1)" }}
                />
                <Legend />
                <Bar
                  dataKey="scored"
                  fill="#10B981"
                  name="Points For (PPG)"
                  radius={[0, 4, 4, 0]}
                />
                <Bar
                  dataKey="allowed"
                  fill="#EF4444"
                  name="Points Against (PPG)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Players Performance Radar */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700 shadow-soft">
            <div
              role="img"
              aria-labelledby="player-radar-heading"
              aria-describedby="player-radar-desc"
            >
              <p id="player-radar-desc" className="sr-only">
                Radar chart comparing player performance across points, rebounds, assists, field
                goal percentage, and free throw percentage
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h3 id="player-radar-heading" className="section-header">
                Player Performance Comparison
              </h3>
              <div className="flex flex-wrap gap-2">
                <select
                  className="bg-surface-100 dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-md px-3 py-1.5 text-sm text-surface-900 dark:text-white"
                  value=""
                  onChange={(e) => {
                    if (
                      e.target.value &&
                      selectedRadarPlayers.length < 5 &&
                      !selectedRadarPlayers.includes(e.target.value)
                    ) {
                      setSelectedRadarPlayers([...selectedRadarPlayers, e.target.value]);
                    }
                  }}
                >
                  <option value="">Add player...</option>
                  {playersData?.players
                    ?.filter((p) => !selectedRadarPlayers.includes(p.playerId))
                    .map((player) => (
                      <option key={player.playerId} value={player.playerId}>
                        {player.playerName} ({player.teamName})
                      </option>
                    ))}
                </select>
                {selectedRadarPlayers.length > 0 && (
                  <button
                    onClick={() => setSelectedRadarPlayers([])}
                    className="btn-ghost px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
            {/* Selected players chips */}
            {selectedRadarPlayers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedRadarPlayers.map((playerId, index) => {
                  const player = playersData?.players?.find((p) => p.playerId === playerId);
                  const colors = ["#EA580C", "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B"];
                  return (
                    <span
                      key={playerId}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    >
                      {player?.playerName || "Unknown"}
                      <button
                        onClick={() =>
                          setSelectedRadarPlayers(
                            selectedRadarPlayers.filter((id) => id !== playerId)
                          )
                        }
                        className="ml-2 hover:text-surface-200"
                      >
                        &times;
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            <ResponsiveContainer width="100%" height={400}>
              {(() => {
                // Use selected players or default to top 3
                const playersToShow =
                  selectedRadarPlayers.length > 0
                    ? selectedRadarPlayers
                        .map((id) => playersData?.players?.find((p) => p.playerId === id))
                        .filter((p) => p !== undefined)
                    : playersData?.players?.slice(0, 3) || [];

                // Get league-wide max for normalization (so all stats are on 0-100 scale)
                const allPlayers = playersData?.players || [];
                const getMax = (
                  key:
                    | "avgPoints"
                    | "avgRebounds"
                    | "avgAssists"
                    | "fieldGoalPercentage"
                    | "freeThrowPercentage"
                ) => Math.max(...allPlayers.map((p) => p[key] || 0), 1);

                const maxPoints = getMax("avgPoints");
                const maxRebounds = getMax("avgRebounds");
                const maxAssists = getMax("avgAssists");
                const maxFG = getMax("fieldGoalPercentage");
                const maxFT = getMax("freeThrowPercentage");

                // Normalize to 0-100 scale based on league max
                const normalize = (value: number, max: number) =>
                  max > 0 ? (value / max) * 100 : 0;

                // Build data with both normalized and actual values
                const radarData = [
                  {
                    metric: "Points",
                    unit: " PPG",
                    ...Object.fromEntries(
                      playersToShow.map((p, i) => [
                        `player${i}`,
                        normalize(p?.avgPoints || 0, maxPoints),
                      ])
                    ),
                    ...Object.fromEntries(
                      playersToShow.map((p, i) => [`actual${i}`, p?.avgPoints?.toFixed(1) || "0.0"])
                    ),
                  },
                  {
                    metric: "Rebounds",
                    unit: " RPG",
                    ...Object.fromEntries(
                      playersToShow.map((p, i) => [
                        `player${i}`,
                        normalize(p?.avgRebounds || 0, maxRebounds),
                      ])
                    ),
                    ...Object.fromEntries(
                      playersToShow.map((p, i) => [
                        `actual${i}`,
                        p?.avgRebounds?.toFixed(1) || "0.0",
                      ])
                    ),
                  },
                  {
                    metric: "Assists",
                    unit: " APG",
                    ...Object.fromEntries(
                      playersToShow.map((p, i) => [
                        `player${i}`,
                        normalize(p?.avgAssists || 0, maxAssists),
                      ])
                    ),
                    ...Object.fromEntries(
                      playersToShow.map((p, i) => [
                        `actual${i}`,
                        p?.avgAssists?.toFixed(1) || "0.0",
                      ])
                    ),
                  },
                  {
                    metric: "FG%",
                    unit: "%",
                    ...Object.fromEntries(
                      playersToShow.map((p, i) => [
                        `player${i}`,
                        normalize(p?.fieldGoalPercentage || 0, maxFG),
                      ])
                    ),
                    ...Object.fromEntries(
                      playersToShow.map((p, i) => [
                        `actual${i}`,
                        p?.fieldGoalPercentage?.toFixed(1) || "0.0",
                      ])
                    ),
                  },
                  {
                    metric: "FT%",
                    unit: "%",
                    ...Object.fromEntries(
                      playersToShow.map((p, i) => [
                        `player${i}`,
                        normalize(p?.freeThrowPercentage || 0, maxFT),
                      ])
                    ),
                    ...Object.fromEntries(
                      playersToShow.map((p, i) => [
                        `actual${i}`,
                        p?.freeThrowPercentage?.toFixed(1) || "0.0",
                      ])
                    ),
                  },
                ];

                const colors = ["#EA580C", "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B"];

                return (
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#5c5650" />
                    {/* @ts-expect-error - recharts types incompatible with React 19 */}
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: "#a69f96" }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    {playersToShow.map((player, index) => (
                      <Radar
                        key={player?.playerId || index}
                        name={player?.playerName || `Player ${index + 1}`}
                        dataKey={`player${index}`}
                        stroke={colors[index % colors.length]}
                        fill={colors[index % colors.length]}
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                    ))}
                    <Legend wrapperStyle={{ color: "#e2e8f0" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "12px",
                      }}
                      labelStyle={{ color: "#f1f5f9", fontWeight: 600, marginBottom: 4 }}
                      itemStyle={{ color: "#e2e8f0" }}
                      formatter={(value, name, props) => {
                        // Extract player index from dataKey (e.g., "player0" -> 0)
                        const dataKey = String(props.dataKey || "");
                        const playerIndex = parseInt(dataKey.replace("player", ""), 10);
                        const actualValue = props.payload?.[`actual${playerIndex}`];
                        const unit = props.payload?.unit || "";
                        return actualValue ? `${actualValue}${unit}` : value;
                      }}
                    />
                  </RadarChart>
                );
              })()}
            </ResponsiveContainer>
            {selectedRadarPlayers.length === 0 && (
              <p className="text-center text-sm text-surface-500 dark:text-surface-400 mt-2">
                Showing top 3 players by default. Use the dropdown to customize.
              </p>
            )}
          </div>

          {/* Shooting Efficiency Analysis */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700 shadow-soft">
            <h3 id="shooting-efficiency-heading" className="section-header mb-4">
              Team Shooting Efficiency
            </h3>
            <div
              role="img"
              aria-labelledby="shooting-efficiency-heading"
              aria-describedby="shooting-efficiency-desc"
            >
              <p id="shooting-efficiency-desc" className="sr-only">
                Line chart comparing field goal, 3-point, and free throw percentages across teams
              </p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={teamsData.teams?.slice(0, 8) || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#5c5650" />
                <XAxis
                  dataKey="teamName"
                  stroke="#a69f96"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#a69f96" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                  }}
                  labelStyle={{ color: "#f1f5f9", fontWeight: 600, marginBottom: 4 }}
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
