import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  TrophyIcon,
  ChartBarIcon,
  TableCellsIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import Breadcrumb from "../components/Breadcrumb";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type TabType = "boxscore" | "charts" | "plays";

const GameAnalysis: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("boxscore");
  const [selectedQuarter, setSelectedQuarter] = useState<number | undefined>(undefined);

  const gameData = useQuery(
    api.games.get,
    token && gameId ? { token, gameId: gameId as Id<"games"> } : "skip"
  );

  const boxScoreData = useQuery(
    api.games.getBoxScore,
    token && gameId ? { token, gameId: gameId as Id<"games"> } : "skip"
  );

  const gameEventsData = useQuery(
    api.games.getGameEvents,
    token && gameId ? { token, gameId: gameId as Id<"games">, quarter: selectedQuarter } : "skip"
  );

  const shotsData = useQuery(
    api.shots.getGameShots,
    token && gameId ? { token, gameId: gameId as Id<"games"> } : "skip"
  );

  if (gameData === undefined || boxScoreData === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!gameData?.game) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Game not found</h3>
        <button
          onClick={() => navigate("/app/games")}
          className="mt-4 text-orange-500 hover:text-orange-400"
        >
          Back to Games
        </button>
      </div>
    );
  }

  const game = gameData.game;
  const boxScore = boxScoreData?.boxScore;
  const events = gameEventsData?.events || [];
  const shots = shotsData?.shots || [];

  const homeTeam = boxScore?.homeTeam;
  const awayTeam = boxScore?.awayTeam;

  const isHomeWinner = game.homeScore > game.awayScore;
  const isAwayWinner = game.awayScore > game.homeScore;

  // Calculate team totals for charts
  const calculateTeamTotals = (players: any[]) => {
    return players.reduce(
      (acc, p) => ({
        points: acc.points + (p.points || 0),
        rebounds: acc.rebounds + (p.rebounds || 0),
        assists: acc.assists + (p.assists || 0),
        steals: acc.steals + (p.steals || 0),
        blocks: acc.blocks + (p.blocks || 0),
        turnovers: acc.turnovers + (p.turnovers || 0),
      }),
      { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0 }
    );
  };

  const homeTotals = homeTeam ? calculateTeamTotals(homeTeam.players) : null;
  const awayTotals = awayTeam ? calculateTeamTotals(awayTeam.players) : null;

  const comparisonData = [
    { stat: "Points", home: homeTotals?.points || 0, away: awayTotals?.points || 0 },
    { stat: "Rebounds", home: homeTotals?.rebounds || 0, away: awayTotals?.rebounds || 0 },
    { stat: "Assists", home: homeTotals?.assists || 0, away: awayTotals?.assists || 0 },
    { stat: "Steals", home: homeTotals?.steals || 0, away: awayTotals?.steals || 0 },
    { stat: "Blocks", home: homeTotals?.blocks || 0, away: awayTotals?.blocks || 0 },
  ];

  // Shot chart data
  const homeShots = shots.filter((s: any) => s.teamId === homeTeam?.team?.id);
  const awayShots = shots.filter((s: any) => s.teamId === awayTeam?.team?.id);

  const calculateShootingStats = (teamShots: any[]) => {
    const made = teamShots.filter((s) => s.made).length;
    const total = teamShots.length;
    const threes = teamShots.filter((s) => s.shotType === "3pt");
    const threesMade = threes.filter((s) => s.made).length;
    const twos = teamShots.filter((s) => s.shotType === "2pt");
    const twosMade = twos.filter((s) => s.made).length;

    return {
      total,
      made,
      pct: total > 0 ? ((made / total) * 100).toFixed(1) : "0.0",
      twos: twos.length,
      twosMade,
      twosPct: twos.length > 0 ? ((twosMade / twos.length) * 100).toFixed(1) : "0.0",
      threes: threes.length,
      threesMade,
      threesPct: threes.length > 0 ? ((threesMade / threes.length) * 100).toFixed(1) : "0.0",
    };
  };

  const homeShootingStats = calculateShootingStats(homeShots);
  const awayShootingStats = calculateShootingStats(awayShots);

  const shootingComparisonData = [
    {
      name: "FG%",
      home: parseFloat(homeShootingStats.pct),
      away: parseFloat(awayShootingStats.pct),
    },
    {
      name: "2PT%",
      home: parseFloat(homeShootingStats.twosPct),
      away: parseFloat(awayShootingStats.twosPct),
    },
    {
      name: "3PT%",
      home: parseFloat(homeShootingStats.threesPct),
      away: parseFloat(awayShootingStats.threesPct),
    },
  ];

  const renderBoxScoreTable = (team: any, isHome: boolean) => {
    if (!team) return null;

    const sortedPlayers = [...team.players].sort((a, b) => (b.points || 0) - (a.points || 0));

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div
          className={`px-4 py-3 border-b border-gray-200 dark:border-gray-700 ${
            isHome ? "bg-orange-50 dark:bg-orange-900/20" : "bg-blue-50 dark:bg-blue-900/20"
          }`}
        >
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
            {team.team?.name}
            {((isHome && isHomeWinner) || (!isHome && isAwayWinner)) && (
              <TrophyIcon className="w-5 h-5 ml-2 text-yellow-500" />
            )}
            <span className="ml-auto text-2xl">{team.score}</span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Player</th>
                <th className="px-2 py-2 text-center text-gray-600 dark:text-gray-300">MIN</th>
                <th className="px-2 py-2 text-center text-gray-600 dark:text-gray-300">PTS</th>
                <th className="px-2 py-2 text-center text-gray-600 dark:text-gray-300">REB</th>
                <th className="px-2 py-2 text-center text-gray-600 dark:text-gray-300">AST</th>
                <th className="px-2 py-2 text-center text-gray-600 dark:text-gray-300">STL</th>
                <th className="px-2 py-2 text-center text-gray-600 dark:text-gray-300">BLK</th>
                <th className="px-2 py-2 text-center text-gray-600 dark:text-gray-300">TO</th>
                <th className="px-2 py-2 text-center text-gray-600 dark:text-gray-300">PF</th>
                <th className="px-2 py-2 text-center text-gray-600 dark:text-gray-300">FG</th>
                <th className="px-2 py-2 text-center text-gray-600 dark:text-gray-300">3PT</th>
                <th className="px-2 py-2 text-center text-gray-600 dark:text-gray-300">FT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedPlayers.map((player: any, index: number) => (
                <tr
                  key={player.player?.id || index}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-3 py-2 text-gray-900 dark:text-white">
                    <span className="font-medium">{player.player?.name || "Unknown"}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">
                      #{player.player?.number}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-center text-gray-600 dark:text-gray-400">
                    {player.minutesPlayed || 0}
                  </td>
                  <td className="px-2 py-2 text-center font-bold text-gray-900 dark:text-white">
                    {player.points || 0}
                  </td>
                  <td className="px-2 py-2 text-center text-gray-600 dark:text-gray-400">
                    {player.rebounds || 0}
                  </td>
                  <td className="px-2 py-2 text-center text-gray-600 dark:text-gray-400">
                    {player.assists || 0}
                  </td>
                  <td className="px-2 py-2 text-center text-gray-600 dark:text-gray-400">
                    {player.steals || 0}
                  </td>
                  <td className="px-2 py-2 text-center text-gray-600 dark:text-gray-400">
                    {player.blocks || 0}
                  </td>
                  <td className="px-2 py-2 text-center text-gray-600 dark:text-gray-400">
                    {player.turnovers || 0}
                  </td>
                  <td className="px-2 py-2 text-center text-gray-600 dark:text-gray-400">
                    {player.fouls || 0}
                  </td>
                  <td className="px-2 py-2 text-center text-gray-600 dark:text-gray-400">
                    {player.fieldGoals}
                  </td>
                  <td className="px-2 py-2 text-center text-gray-600 dark:text-gray-400">
                    {player.threePointers}
                  </td>
                  <td className="px-2 py-2 text-center text-gray-600 dark:text-gray-400">
                    {player.freeThrows}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "shot_made":
        return "🏀";
      case "shot_missed":
        return "❌";
      case "rebound":
        return "🔄";
      case "assist":
        return "🎯";
      case "steal":
        return "🔥";
      case "block":
        return "🛡️";
      case "turnover":
        return "💫";
      case "foul":
        return "⚠️";
      case "free_throw_made":
        return "✅";
      case "free_throw_missed":
        return "⭕";
      case "timeout":
        return "⏸️";
      case "substitution":
        return "🔁";
      default:
        return "📋";
    }
  };

  const tabs = [
    { id: "boxscore" as TabType, label: "Box Score", icon: TableCellsIcon },
    { id: "charts" as TabType, label: "Charts", icon: ChartBarIcon },
    { id: "plays" as TabType, label: "Play-by-Play", icon: PlayIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Games", href: "/games" },
          { label: `${homeTeam?.team?.name || "Home"} vs ${awayTeam?.team?.name || "Away"}` },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Game Analysis</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {game.status === "completed" ? "Final" : game.status}
        </p>
      </div>

      {/* Score Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className={`text-center flex-1 ${isAwayWinner ? "opacity-60" : ""}`}>
            <p className="text-lg text-gray-600 dark:text-gray-400">{homeTeam?.team?.city}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {homeTeam?.team?.name}
            </p>
            <p className="text-5xl font-bold text-orange-500 mt-2">{game.homeScore}</p>
            {isHomeWinner && (
              <span className="inline-flex items-center mt-2 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-sm font-medium rounded">
                <TrophyIcon className="w-4 h-4 mr-1" /> Winner
              </span>
            )}
          </div>

          <div className="text-center px-8">
            <p className="text-gray-500 dark:text-gray-400 text-xl">VS</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Q{game.currentQuarter || 4}
            </p>
          </div>

          <div className={`text-center flex-1 ${isHomeWinner ? "opacity-60" : ""}`}>
            <p className="text-lg text-gray-600 dark:text-gray-400">{awayTeam?.team?.city}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {awayTeam?.team?.name}
            </p>
            <p className="text-5xl font-bold text-blue-500 mt-2">{game.awayScore}</p>
            {isAwayWinner && (
              <span className="inline-flex items-center mt-2 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-sm font-medium rounded">
                <TrophyIcon className="w-4 h-4 mr-1" /> Winner
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-orange-500 text-orange-500"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <tab.icon className="w-5 h-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "boxscore" && (
        <div className="space-y-6">
          {renderBoxScoreTable(homeTeam, true)}
          {renderBoxScoreTable(awayTeam, false)}
        </div>
      )}

      {activeTab === "charts" && (
        <div className="space-y-6">
          {/* Team Comparison Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Team Comparison
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="stat" type="category" width={80} />
                <Tooltip />
                <Legend />
                <Bar dataKey="home" name={homeTeam?.team?.name || "Home"} fill="#f97316" />
                <Bar dataKey="away" name={awayTeam?.team?.name || "Away"} fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Shooting Comparison */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Shooting Percentages
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={shootingComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                <Legend />
                <Bar dataKey="home" name={homeTeam?.team?.name || "Home"} fill="#f97316" />
                <Bar dataKey="away" name={awayTeam?.team?.name || "Away"} fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Shooting Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-orange-500">
                {homeTeam?.team?.name} Shooting
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Field Goals</span>
                  <span className="text-gray-900 dark:text-white">
                    {homeShootingStats.made}/{homeShootingStats.total} ({homeShootingStats.pct}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">2-Pointers</span>
                  <span className="text-gray-900 dark:text-white">
                    {homeShootingStats.twosMade}/{homeShootingStats.twos} (
                    {homeShootingStats.twosPct}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">3-Pointers</span>
                  <span className="text-gray-900 dark:text-white">
                    {homeShootingStats.threesMade}/{homeShootingStats.threes} (
                    {homeShootingStats.threesPct}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-blue-500">
                {awayTeam?.team?.name} Shooting
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Field Goals</span>
                  <span className="text-gray-900 dark:text-white">
                    {awayShootingStats.made}/{awayShootingStats.total} ({awayShootingStats.pct}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">2-Pointers</span>
                  <span className="text-gray-900 dark:text-white">
                    {awayShootingStats.twosMade}/{awayShootingStats.twos} (
                    {awayShootingStats.twosPct}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">3-Pointers</span>
                  <span className="text-gray-900 dark:text-white">
                    {awayShootingStats.threesMade}/{awayShootingStats.threes} (
                    {awayShootingStats.threesPct}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "plays" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {/* Quarter Filter */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Filter by quarter:</span>
            <div className="flex space-x-1">
              <button
                onClick={() => setSelectedQuarter(undefined)}
                className={`px-3 py-1 text-sm rounded ${
                  selectedQuarter === undefined
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                All
              </button>
              {[1, 2, 3, 4].map((q) => (
                <button
                  key={q}
                  onClick={() => setSelectedQuarter(q)}
                  className={`px-3 py-1 text-sm rounded ${
                    selectedQuarter === q
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Q{q}
                </button>
              ))}
            </div>
          </div>

          {/* Events List */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
            {events.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                No play-by-play data available for this game.
              </div>
            ) : (
              events.map((event: any) => (
                <div
                  key={event.id}
                  className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-start space-x-3"
                >
                  <span className="text-xl">{getEventIcon(event.eventType)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {event.description || event.eventType.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {event.player?.name && (
                        <span className="font-medium">
                          #{event.player.number} {event.player.name}
                        </span>
                      )}
                      {event.team?.name && (
                        <span className="ml-2 text-gray-400">({event.team.name})</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                    <p>Q{event.quarter}</p>
                    <p>{event.gameTimeDisplay}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameAnalysis;
