import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  extractYouTubeId,
  resolveTeamColor,
  type GameSettings,
  type ExportShot,
  type GameEvent,
  type TeamSummary,
} from "@basketball-stats/shared";
import {
  TrophyIcon,
  ChartBarIcon,
  TableCellsIcon,
  PlayIcon,
  PresentationChartBarIcon,
  ClipboardDocumentListIcon,
  ArrowDownTrayIcon,
  FilmIcon,
} from "@heroicons/react/24/outline";
import { ExportModal } from "../components/export";
import type { GameExportData } from "../utils/export/types";
import Breadcrumb from "../components/Breadcrumb";
import { QuarterBreakdown } from "../components/livegame/stats/QuarterBreakdown";
import { AdvancedStats } from "../components/livegame/stats/AdvancedStats";
import { GameEventCard } from "../components/livegame/playbyplay/GameEventCard";
import { FourFactors } from "../components/FourFactors";
import { GameFlowChart } from "../components/GameFlowChart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { YouTubeEmbed } from "../components/ui/YouTubeEmbed";

type TabType = "boxscore" | "stats" | "charts" | "plays";

// Local interface for team totals used in calculations
interface TeamTotals {
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
}

// Extended team totals for Four Factors
interface ExtendedTeamTotals extends TeamTotals {
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
}

// Box score player structure from getBoxScore query (includes display strings)
interface BoxScorePlayerStat {
  player: {
    id: string;
    name: string;
    number: number;
    position?: string;
  } | null;
  playerId?: string;
  points: number;
  rebounds: number;
  offensiveRebounds?: number;
  defensiveRebounds?: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fouledOut?: boolean;
  isOnCourt?: boolean;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  // String format for display
  fieldGoals: string;
  threePointers: string;
  freeThrows: string;
  minutesPlayed: number;
  plusMinus: number;
}

// Box score team structure from getBoxScore query
interface BoxScoreTeam {
  team: TeamSummary | null;
  score: number;
  players: BoxScorePlayerStat[];
}

const GameAnalysis: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("boxscore");
  const [selectedQuarter, setSelectedQuarter] = useState<number | undefined>(undefined);
  const [showExportModal, setShowExportModal] = useState(false);

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

  const scoringTimelineData = useQuery(
    api.games.getScoringTimeline,
    token && gameId ? { token, gameId: gameId as Id<"games"> } : "skip"
  );

  if (gameData === undefined || boxScoreData === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!gameData?.game) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Game not found</h3>
        <button
          onClick={() => navigate("/app/games")}
          className="mt-4 text-primary-500 hover:text-primary-400 transition-colors"
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
  const calculateTeamTotals = (
    players: Array<{
      points?: number;
      rebounds?: number;
      offensiveRebounds?: number;
      defensiveRebounds?: number;
      assists?: number;
      steals?: number;
      blocks?: number;
      turnovers?: number;
      fieldGoalsMade?: number;
      fieldGoalsAttempted?: number;
      threePointersMade?: number;
      freeThrowsMade?: number;
      freeThrowsAttempted?: number;
    }>
  ): ExtendedTeamTotals => {
    return players.reduce<ExtendedTeamTotals>(
      (acc, p) => ({
        points: acc.points + (p.points || 0),
        rebounds: acc.rebounds + (p.rebounds || 0),
        offensiveRebounds: acc.offensiveRebounds + (p.offensiveRebounds || 0),
        defensiveRebounds: acc.defensiveRebounds + (p.defensiveRebounds || 0),
        assists: acc.assists + (p.assists || 0),
        steals: acc.steals + (p.steals || 0),
        blocks: acc.blocks + (p.blocks || 0),
        turnovers: acc.turnovers + (p.turnovers || 0),
        fieldGoalsMade: acc.fieldGoalsMade + (p.fieldGoalsMade || 0),
        fieldGoalsAttempted: acc.fieldGoalsAttempted + (p.fieldGoalsAttempted || 0),
        threePointersMade: acc.threePointersMade + (p.threePointersMade || 0),
        freeThrowsMade: acc.freeThrowsMade + (p.freeThrowsMade || 0),
        freeThrowsAttempted: acc.freeThrowsAttempted + (p.freeThrowsAttempted || 0),
      }),
      {
        points: 0,
        rebounds: 0,
        offensiveRebounds: 0,
        defensiveRebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        fieldGoalsMade: 0,
        fieldGoalsAttempted: 0,
        threePointersMade: 0,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
      }
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
  const homeShots = shots.filter((s: ExportShot) => s.teamId === homeTeam?.team?.id);
  const awayShots = shots.filter((s: ExportShot) => s.teamId === awayTeam?.team?.id);

  const calculateShootingStats = (teamShots: ExportShot[]) => {
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

  const renderBoxScoreTable = (team: BoxScoreTeam | undefined, isHome: boolean) => {
    if (!team) return null;

    const sortedPlayers = [...team.players].sort((a, b) => (b.points || 0) - (a.points || 0));

    return (
      <div className="surface-card overflow-hidden">
        <div
          className={`px-4 py-3 border-b border-surface-200 dark:border-surface-700 ${
            isHome ? "bg-primary-50 dark:bg-primary-900/20" : "bg-blue-50 dark:bg-blue-900/20"
          }`}
        >
          <h3 className="font-bold text-surface-900 dark:text-white flex items-center">
            {team.team?.name}
            {((isHome && isHomeWinner) || (!isHome && isAwayWinner)) && (
              <TrophyIcon className="w-5 h-5 ml-2 text-yellow-500" />
            )}
            <span className="ml-auto text-2xl tabular-nums" data-stat>
              {team.score}
            </span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 dark:bg-surface-800/50">
              <tr>
                <th className="px-3 py-2 text-left text-surface-600 dark:text-surface-400">
                  Player
                </th>
                <th className="px-2 py-2 text-center text-surface-600 dark:text-surface-400">
                  MIN
                </th>
                <th className="px-2 py-2 text-center text-surface-600 dark:text-surface-400">
                  PTS
                </th>
                <th className="px-2 py-2 text-center text-surface-600 dark:text-surface-400">
                  REB
                </th>
                <th className="px-2 py-2 text-center text-surface-600 dark:text-surface-400">
                  AST
                </th>
                <th className="px-2 py-2 text-center text-surface-600 dark:text-surface-400">
                  STL
                </th>
                <th className="px-2 py-2 text-center text-surface-600 dark:text-surface-400">
                  BLK
                </th>
                <th className="px-2 py-2 text-center text-surface-600 dark:text-surface-400">TO</th>
                <th className="px-2 py-2 text-center text-surface-600 dark:text-surface-400">PF</th>
                <th className="px-2 py-2 text-center text-surface-600 dark:text-surface-400">FG</th>
                <th className="px-2 py-2 text-center text-surface-600 dark:text-surface-400">
                  3PT
                </th>
                <th className="px-2 py-2 text-center text-surface-600 dark:text-surface-400">FT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
              {sortedPlayers.map((player: BoxScorePlayerStat, index: number) => (
                <tr
                  key={player.player?.id || index}
                  className="hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
                >
                  <td className="px-3 py-2">
                    {player.player?.id ? (
                      <Link
                        to={`/app/players/${player.player.id}`}
                        className="text-surface-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      >
                        <span className="font-medium">{player.player?.name || "Unknown"}</span>
                        <span className="text-surface-500 dark:text-surface-400 ml-1">
                          #{player.player?.number}
                        </span>
                      </Link>
                    ) : (
                      <span className="text-surface-900 dark:text-white">
                        <span className="font-medium">Unknown</span>
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-center text-surface-600 dark:text-surface-400 tabular-nums">
                    {player.minutesPlayed || 0}
                  </td>
                  <td className="px-2 py-2 text-center font-bold text-surface-900 dark:text-white tabular-nums">
                    {player.points || 0}
                  </td>
                  <td className="px-2 py-2 text-center text-surface-600 dark:text-surface-400 tabular-nums">
                    {player.rebounds || 0}
                  </td>
                  <td className="px-2 py-2 text-center text-surface-600 dark:text-surface-400 tabular-nums">
                    {player.assists || 0}
                  </td>
                  <td className="px-2 py-2 text-center text-surface-600 dark:text-surface-400 tabular-nums">
                    {player.steals || 0}
                  </td>
                  <td className="px-2 py-2 text-center text-surface-600 dark:text-surface-400 tabular-nums">
                    {player.blocks || 0}
                  </td>
                  <td className="px-2 py-2 text-center text-surface-600 dark:text-surface-400 tabular-nums">
                    {player.turnovers || 0}
                  </td>
                  <td className="px-2 py-2 text-center text-surface-600 dark:text-surface-400 tabular-nums">
                    {player.fouls || 0}
                  </td>
                  <td className="px-2 py-2 text-center text-surface-600 dark:text-surface-400 tabular-nums">
                    {player.fieldGoals}
                  </td>
                  <td className="px-2 py-2 text-center text-surface-600 dark:text-surface-400 tabular-nums">
                    {player.threePointers}
                  </td>
                  <td className="px-2 py-2 text-center text-surface-600 dark:text-surface-400 tabular-nums">
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

  const tabs = [
    { id: "boxscore" as TabType, label: "Box Score", icon: TableCellsIcon },
    { id: "stats" as TabType, label: "Team Stats", icon: PresentationChartBarIcon },
    { id: "charts" as TabType, label: "Charts", icon: ChartBarIcon },
    { id: "plays" as TabType, label: "Play-by-Play", icon: PlayIcon },
  ];

  // Prepare player stats for AdvancedStats component
  const preparePlayerStats = (
    players: BoxScorePlayerStat[],
    teamId: Id<"teams">,
    isHomeTeam: boolean
  ) => {
    return players.map((p) => ({
      id: (p.player?.id || p.playerId || "") as Id<"playerStats">,
      playerId: (p.player?.id || p.playerId || "") as Id<"players">,
      teamId,
      player: p.player
        ? { number: p.player.number, name: p.player.name, position: p.player.position }
        : { number: 0, name: "Unknown" },
      points: p.points || 0,
      rebounds: p.rebounds || 0,
      offensiveRebounds: p.offensiveRebounds || 0,
      defensiveRebounds: p.defensiveRebounds || 0,
      assists: p.assists || 0,
      steals: p.steals || 0,
      blocks: p.blocks || 0,
      turnovers: p.turnovers || 0,
      fouls: p.fouls || 0,
      fouledOut: p.fouledOut || false,
      isOnCourt: p.isOnCourt || false,
      isHomeTeam,
      fieldGoalsMade: p.fieldGoalsMade || 0,
      fieldGoalsAttempted: p.fieldGoalsAttempted || 0,
      threePointersMade: p.threePointersMade || 0,
      threePointersAttempted: p.threePointersAttempted || 0,
      freeThrowsMade: p.freeThrowsMade || 0,
      freeThrowsAttempted: p.freeThrowsAttempted || 0,
      minutesPlayed: p.minutesPlayed || 0,
      plusMinus: p.plusMinus || 0,
    }));
  };

  const homePlayerStats = homeTeam
    ? preparePlayerStats(homeTeam.players, homeTeam.team?.id as Id<"teams">, true)
    : [];
  const awayPlayerStats = awayTeam
    ? preparePlayerStats(awayTeam.players, awayTeam.team?.id as Id<"teams">, false)
    : [];

  // Prepare export data
  const prepareExportData = (): GameExportData | undefined => {
    if (!homeTeam || !awayTeam) return undefined;

    const transformPlayer = (player: BoxScorePlayerStat) => ({
      id: player.player?.id || player.playerId || "",
      name: player.player?.name || "Unknown",
      number: player.player?.number || 0,
      position: player.player?.position,
      minutesPlayed: player.minutesPlayed || 0,
      points: player.points || 0,
      rebounds: player.rebounds || 0,
      assists: player.assists || 0,
      steals: player.steals || 0,
      blocks: player.blocks || 0,
      turnovers: player.turnovers || 0,
      fouls: player.fouls || 0,
      fieldGoalsMade: player.fieldGoalsMade || 0,
      fieldGoalsAttempted: player.fieldGoalsAttempted || 0,
      threePointersMade: player.threePointersMade || 0,
      threePointersAttempted: player.threePointersAttempted || 0,
      freeThrowsMade: player.freeThrowsMade || 0,
      freeThrowsAttempted: player.freeThrowsAttempted || 0,
      plusMinus: player.plusMinus || 0,
    });

    const calculateTotals = (totals: TeamTotals | null) => ({
      points: totals?.points || 0,
      rebounds: totals?.rebounds || 0,
      assists: totals?.assists || 0,
      steals: totals?.steals || 0,
      blocks: totals?.blocks || 0,
      turnovers: totals?.turnovers || 0,
      fouls: 0,
      fieldGoalsMade: 0,
      fieldGoalsAttempted: 0,
      fieldGoalPercentage: parseFloat(homeShootingStats.pct),
      threePointersMade: homeShootingStats.threesMade,
      threePointersAttempted: homeShootingStats.threes,
      threePointPercentage: parseFloat(homeShootingStats.threesPct),
      freeThrowsMade: 0,
      freeThrowsAttempted: 0,
      freeThrowPercentage: 0,
    });

    return {
      game: {
        id: gameId || "",
        homeTeamName: homeTeam.team?.name || "Home",
        awayTeamName: awayTeam.team?.name || "Away",
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        status: game.status,
        currentQuarter: game.currentQuarter || 4,
        date: game.startedAt ? new Date(game.startedAt).toISOString() : undefined,
      },
      homeTeam: {
        id: homeTeam.team?.id || "",
        name: homeTeam.team?.name || "Home",
        city: homeTeam.team?.city,
        players: homeTeam.players.map(transformPlayer),
        totals: calculateTotals(homeTotals),
      },
      awayTeam: {
        id: awayTeam.team?.id || "",
        name: awayTeam.team?.name || "Away",
        city: awayTeam.team?.city,
        players: awayTeam.players.map(transformPlayer),
        totals: calculateTotals(awayTotals),
      },
      shots: shots.map((shot: ExportShot) => ({
        id: shot._id || shot.id || "",
        playerId: shot.playerId,
        playerName: shot.player?.name || shot.playerName || "Unknown",
        teamId: shot.teamId,
        teamName:
          (shot.teamId === homeTeam.team?.id ? homeTeam.team?.name : awayTeam.team?.name) ||
          "Unknown",
        x: shot.x,
        y: shot.y,
        shotType: shot.shotType,
        made: shot.made,
        zone: shot.shotZone || shot.zone || "unknown",
        quarter: shot.quarter,
        timeRemaining: shot.timeRemaining || 0,
      })),
      events: events.map((event: GameEvent) => ({
        id: event._id || event.id || "",
        quarter: event.quarter,
        timeRemaining: event.gameTime || event.timeRemaining || 0,
        eventType: event.eventType,
        description: event.description || event.eventType?.replace(/_/g, " ") || "",
        playerId: event.player?.id || event.playerId,
        playerName: event.player?.name,
        teamId: event.team?.id || event.teamId,
        teamName: event.team?.name,
        homeScore: event.details?.homeScore || 0,
        awayScore: event.details?.awayScore || 0,
      })),
    };
  };

  const exportData = prepareExportData();

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-display-sm text-surface-900 dark:text-white">Game Analysis</h1>
          <p className="text-surface-600 dark:text-surface-400">
            {game.status === "completed" ? "Final" : game.status}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {game.status === "completed" && (
            <Link
              to={`/app/games/${gameId}/replay`}
              className="flex items-center gap-2 px-4 py-2 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 font-medium rounded-xl transition-colors"
            >
              <FilmIcon className="w-5 h-5" />
              Watch Replay
            </Link>
          )}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>

      {/* Video Embed (if available) */}
      {game.videoUrl && extractYouTubeId(game.videoUrl) && (
        <div className="surface-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <FilmIcon className="w-5 h-5 text-surface-500" />
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Game Video</h3>
          </div>
          <YouTubeEmbed
            url={game.videoUrl}
            title={`${homeTeam?.team?.name} vs ${awayTeam?.team?.name}`}
          />
        </div>
      )}

      {/* Score Card */}
      <div className="surface-card p-8">
        <div className="flex items-center justify-between">
          <div className={`text-center flex-1 ${isAwayWinner ? "opacity-60" : ""}`}>
            {homeTeam?.team?.logoUrl && (
              <img
                src={homeTeam.team.logoUrl}
                alt={`${homeTeam.team.name} logo`}
                className="w-16 h-16 mx-auto mb-2 object-contain"
              />
            )}
            <p className="text-lg text-surface-600 dark:text-surface-400">{homeTeam?.team?.city}</p>
            <p className="text-2xl font-bold text-surface-900 dark:text-white">
              {homeTeam?.team?.name}
            </p>
            <p
              className="text-stat-xl mt-2"
              data-stat
              style={{
                color: resolveTeamColor(
                  (homeTeam?.team as { primaryColor?: string })?.primaryColor,
                  true
                ),
              }}
            >
              {game.homeScore}
            </p>
            {isHomeWinner && (
              <span className="inline-flex items-center mt-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-sm font-medium rounded-full">
                <TrophyIcon className="w-4 h-4 mr-1" /> Winner
              </span>
            )}
          </div>

          <div className="text-center px-8">
            <p className="text-surface-500 dark:text-surface-400 text-xl font-medium">VS</p>
            <p className="text-sm text-surface-500 dark:text-surface-500 mt-2 tabular-nums">
              Q{game.currentQuarter || 4}
            </p>
          </div>

          <div className={`text-center flex-1 ${isHomeWinner ? "opacity-60" : ""}`}>
            {awayTeam?.team?.logoUrl && (
              <img
                src={awayTeam.team.logoUrl}
                alt={`${awayTeam.team.name} logo`}
                className="w-16 h-16 mx-auto mb-2 object-contain"
              />
            )}
            <p className="text-lg text-surface-600 dark:text-surface-400">{awayTeam?.team?.city}</p>
            <p className="text-2xl font-bold text-surface-900 dark:text-white">
              {awayTeam?.team?.name}
            </p>
            <p
              className="text-stat-xl mt-2"
              data-stat
              style={{
                color: resolveTeamColor(
                  (awayTeam?.team as { primaryColor?: string })?.primaryColor,
                  false
                ),
              }}
            >
              {game.awayScore}
            </p>
            {isAwayWinner && (
              <span className="inline-flex items-center mt-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-sm font-medium rounded-full">
                <TrophyIcon className="w-4 h-4 mr-1" /> Winner
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quarter Breakdown */}
      <QuarterBreakdown
        homeTeamName={homeTeam?.team?.name || "Home"}
        awayTeamName={awayTeam?.team?.name || "Away"}
        scoreByPeriod={(game.gameSettings as GameSettings | undefined)?.scoreByPeriod}
        currentQuarter={game.currentQuarter || 4}
        homeScore={game.homeScore}
        awayScore={game.awayScore}
      />

      {/* Tabs */}
      <div className="border-b border-surface-200 dark:border-surface-700">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-primary-500 text-primary-500"
                  : "border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
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

      {activeTab === "stats" && (
        <div className="space-y-6">
          {/* Game Flow Chart */}
          {scoringTimelineData && (
            <GameFlowChart
              timeline={scoringTimelineData.timeline}
              quarterBoundaries={scoringTimelineData.quarterBoundaries}
              runs={scoringTimelineData.runs}
              homeTeamName={homeTeam?.team?.name || "Home"}
              awayTeamName={awayTeam?.team?.name || "Away"}
              homeTeamColor={(homeTeam?.team as { primaryColor?: string })?.primaryColor}
              awayTeamColor={(awayTeam?.team as { primaryColor?: string })?.primaryColor}
              summary={scoringTimelineData.summary}
            />
          )}

          {/* Four Factors Analysis */}
          {homeTotals && awayTotals && (
            <FourFactors
              homeTeamName={homeTeam?.team?.name || "Home"}
              awayTeamName={awayTeam?.team?.name || "Away"}
              homeStats={homeTotals}
              awayStats={awayTotals}
            />
          )}

          {/* Team Comparison */}
          <div className="surface-card overflow-hidden">
            <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
              <h3 className="font-bold text-surface-900 dark:text-white">Team Comparison</h3>
            </div>
            <div className="divide-y divide-surface-200 dark:divide-surface-700">
              {/* Header */}
              <div className="flex items-center py-3 px-4">
                <span className="flex-1 text-right text-sm font-bold text-primary-500">
                  {homeTeam?.team?.name}
                </span>
                <span className="w-24 text-center text-xs text-surface-500 dark:text-surface-400 font-medium">
                  STAT
                </span>
                <span className="flex-1 text-left text-sm font-bold text-blue-500">
                  {awayTeam?.team?.name}
                </span>
              </div>
              {/* Stats rows */}
              {[
                {
                  label: "Points",
                  home: homeTotals?.points || 0,
                  away: awayTotals?.points || 0,
                  higher: true,
                },
                {
                  label: "Rebounds",
                  home: homeTotals?.rebounds || 0,
                  away: awayTotals?.rebounds || 0,
                  higher: true,
                },
                {
                  label: "Assists",
                  home: homeTotals?.assists || 0,
                  away: awayTotals?.assists || 0,
                  higher: true,
                },
                {
                  label: "Steals",
                  home: homeTotals?.steals || 0,
                  away: awayTotals?.steals || 0,
                  higher: true,
                },
                {
                  label: "Blocks",
                  home: homeTotals?.blocks || 0,
                  away: awayTotals?.blocks || 0,
                  higher: true,
                },
                {
                  label: "Turnovers",
                  home: homeTotals?.turnovers || 0,
                  away: awayTotals?.turnovers || 0,
                  higher: false,
                },
              ].map((stat) => {
                const homeWins = stat.higher ? stat.home > stat.away : stat.home < stat.away;
                const awayWins = stat.higher ? stat.away > stat.home : stat.away < stat.home;
                return (
                  <div key={stat.label} className="flex items-center py-3 px-4">
                    <span
                      className={`flex-1 text-right text-base font-semibold tabular-nums ${
                        homeWins ? "text-green-500" : "text-surface-900 dark:text-white"
                      }`}
                    >
                      {stat.home}
                    </span>
                    <span className="w-24 text-center text-sm text-surface-600 dark:text-surface-400">
                      {stat.label}
                    </span>
                    <span
                      className={`flex-1 text-left text-base font-semibold tabular-nums ${
                        awayWins ? "text-green-500" : "text-surface-900 dark:text-white"
                      }`}
                    >
                      {stat.away}
                    </span>
                  </div>
                );
              })}
              {/* Shooting percentages */}
              <div className="flex items-center py-3 px-4">
                <span className="flex-1 text-right text-base font-semibold tabular-nums text-surface-900 dark:text-white">
                  {homeShootingStats.pct}%
                </span>
                <span className="w-24 text-center text-sm text-surface-600 dark:text-surface-400">
                  FG%
                </span>
                <span className="flex-1 text-left text-base font-semibold tabular-nums text-surface-900 dark:text-white">
                  {awayShootingStats.pct}%
                </span>
              </div>
              <div className="flex items-center py-3 px-4">
                <span className="flex-1 text-right text-base font-semibold tabular-nums text-surface-900 dark:text-white">
                  {homeShootingStats.threesPct}%
                </span>
                <span className="w-24 text-center text-sm text-surface-600 dark:text-surface-400">
                  3P%
                </span>
                <span className="flex-1 text-left text-base font-semibold tabular-nums text-surface-900 dark:text-white">
                  {awayShootingStats.threesPct}%
                </span>
              </div>
            </div>
          </div>

          {/* Advanced Stats */}
          <AdvancedStats
            homeStats={homePlayerStats}
            awayStats={awayPlayerStats}
            homeTeamName={homeTeam?.team?.name || "Home"}
            awayTeamName={awayTeam?.team?.name || "Away"}
          />
        </div>
      )}

      {activeTab === "charts" && (
        <div className="space-y-6">
          {/* Team Comparison Chart */}
          <div className="surface-card p-6">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-4">
              Team Comparison
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-700)" />
                <XAxis type="number" stroke="var(--color-surface-500)" />
                <YAxis
                  dataKey="stat"
                  type="category"
                  width={80}
                  stroke="var(--color-surface-500)"
                />
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
                <Bar
                  dataKey="home"
                  name={homeTeam?.team?.name || "Home"}
                  fill="#f97316"
                  radius={[0, 4, 4, 0]}
                />
                <Bar
                  dataKey="away"
                  name={awayTeam?.team?.name || "Away"}
                  fill="#3b82f6"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Shooting Comparison */}
          <div className="surface-card p-6">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-4">
              Shooting Percentages
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={shootingComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-700)" />
                <XAxis dataKey="name" stroke="var(--color-surface-500)" />
                <YAxis domain={[0, 100]} stroke="var(--color-surface-500)" />
                <Tooltip
                  formatter={(value) =>
                    typeof value === "number" ? `${value.toFixed(1)}%` : value
                  }
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                  }}
                  labelStyle={{ color: "#f1f5f9", fontWeight: 600, marginBottom: 4 }}
                  cursor={{ fill: "rgba(255,255,255,0.1)" }}
                />
                <Legend />
                <Bar
                  dataKey="home"
                  name={homeTeam?.team?.name || "Home"}
                  fill="#f97316"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="away"
                  name={awayTeam?.team?.name || "Away"}
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Shooting Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="surface-card p-6">
              <h4 className="font-bold text-surface-900 dark:text-white mb-4 text-primary-500">
                {homeTeam?.team?.name} Shooting
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-surface-600 dark:text-surface-400">Field Goals</span>
                  <span className="text-surface-900 dark:text-white tabular-nums">
                    {homeShootingStats.made}/{homeShootingStats.total} ({homeShootingStats.pct}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-600 dark:text-surface-400">2-Pointers</span>
                  <span className="text-surface-900 dark:text-white tabular-nums">
                    {homeShootingStats.twosMade}/{homeShootingStats.twos} (
                    {homeShootingStats.twosPct}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-600 dark:text-surface-400">3-Pointers</span>
                  <span className="text-surface-900 dark:text-white tabular-nums">
                    {homeShootingStats.threesMade}/{homeShootingStats.threes} (
                    {homeShootingStats.threesPct}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="surface-card p-6">
              <h4 className="font-bold text-surface-900 dark:text-white mb-4 text-blue-500">
                {awayTeam?.team?.name} Shooting
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-surface-600 dark:text-surface-400">Field Goals</span>
                  <span className="text-surface-900 dark:text-white tabular-nums">
                    {awayShootingStats.made}/{awayShootingStats.total} ({awayShootingStats.pct}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-600 dark:text-surface-400">2-Pointers</span>
                  <span className="text-surface-900 dark:text-white tabular-nums">
                    {awayShootingStats.twosMade}/{awayShootingStats.twos} (
                    {awayShootingStats.twosPct}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-600 dark:text-surface-400">3-Pointers</span>
                  <span className="text-surface-900 dark:text-white tabular-nums">
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
        <div className="surface-card overflow-hidden">
          {/* Quarter Filter */}
          <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700 flex items-center gap-2">
            <span className="text-sm text-surface-600 dark:text-surface-400">
              Filter by quarter:
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setSelectedQuarter(undefined)}
                className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors ${
                  selectedQuarter === undefined
                    ? "bg-primary-500 text-white"
                    : "bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600"
                }`}
              >
                All
              </button>
              {[1, 2, 3, 4].map((q) => (
                <button
                  key={q}
                  onClick={() => setSelectedQuarter(q)}
                  className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors ${
                    selectedQuarter === q
                      ? "bg-primary-500 text-white"
                      : "bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600"
                  }`}
                >
                  Q{q}
                </button>
              ))}
            </div>
          </div>

          {/* Events List */}
          <div className="max-h-[500px] overflow-y-auto">
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <div className="w-12 h-12 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center mb-3">
                  <ClipboardDocumentListIcon className="w-6 h-6 text-surface-400" />
                </div>
                <p className="text-surface-900 dark:text-white text-sm font-semibold mb-1">
                  No events recorded
                </p>
                <p className="text-surface-500 dark:text-surface-400 text-xs text-center">
                  Play-by-play data will appear here
                </p>
              </div>
            ) : (
              events.map((event: GameEvent) => (
                <GameEventCard
                  key={event.id || event._id}
                  event={{
                    _id: (event.id || event._id || "") as string,
                    quarter: event.quarter,
                    timeRemaining: event.gameTime || event.timeRemaining || 0,
                    eventType: event.eventType,
                    description: event.description || event.eventType?.replace(/_/g, " ") || "",
                    playerId: (event.player?.id || event.playerId) as Id<"players"> | undefined,
                    teamId: (event.team?.id || event.teamId) as Id<"teams"> | undefined,
                    details: {
                      made: event.details?.made,
                      points: event.details?.points || event.pointsScored,
                      shotType: event.details?.shotType,
                      foulType: event.details?.foulType,
                      homeScore: event.details?.homeScore,
                      awayScore: event.details?.awayScore,
                      isHomeTeam: event.details?.isHomeTeam,
                    },
                  }}
                  playerStats={[
                    ...(homeTeam?.players?.map((p) => ({
                      playerId: (p.player?.id || "") as Id<"players">,
                      points: p.points || 0,
                      rebounds: p.rebounds || 0,
                      assists: p.assists || 0,
                      steals: p.steals || 0,
                      blocks: p.blocks || 0,
                      turnovers: p.turnovers || 0,
                      fouls: p.fouls || 0,
                    })) || []),
                    ...(awayTeam?.players?.map((p) => ({
                      playerId: (p.player?.id || "") as Id<"players">,
                      points: p.points || 0,
                      rebounds: p.rebounds || 0,
                      assists: p.assists || 0,
                      steals: p.steals || 0,
                      blocks: p.blocks || 0,
                      turnovers: p.turnovers || 0,
                      fouls: p.fouls || 0,
                    })) || []),
                  ]}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        gameData={exportData}
        defaultExportType="game-report"
      />
    </div>
  );
};

export default GameAnalysis;
