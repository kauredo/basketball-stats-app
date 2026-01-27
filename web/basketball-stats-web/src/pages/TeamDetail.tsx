import React, { useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { getErrorMessage } from "../utils/error";
import Breadcrumb from "../components/Breadcrumb";
import LineupStatsTable from "../components/LineupStatsTable";
import PairStatsGrid from "../components/PairStatsGrid";
import {
  UserIcon,
  TrophyIcon,
  ChartBarIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CalendarIcon,
  XMarkIcon,
  UsersIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { exportRosterCSV, exportLineupStatsCSV, exportPairStatsCSV } from "../utils/export";
import {
  TeamSeasonExportModal,
  type TeamSeasonExportOptions,
} from "../components/export/TeamSeasonExportModal";
import { downloadPDF, captureCourtAsImage } from "../utils/export/pdf-export";
import { PrintableShotChart } from "../components/export/PrintableShotChart";
import type { ShotLocation } from "../types/livegame";

interface EditFormState {
  name: string;
  city: string;
  description: string;
}

// Local interface for player items
interface PlayerItem {
  id: Id<"players">;
  name: string;
  number: number;
  position?: string;
  heightCm?: number;
  weightKg?: number;
  status?: "active" | "inactive" | "injured";
  active?: boolean;
}

// Local interface for game items
interface GameItem {
  id: Id<"games">;
  status: string;
  homeScore: number;
  awayScore: number;
  scheduledAt?: number;
  startedAt?: number;
  homeTeam?: {
    id: Id<"teams">;
    name: string;
  };
  awayTeam?: {
    id: Id<"teams">;
    name: string;
  };
}

// Local interface for team stats items
interface TeamStatsItem {
  teamId: string;
  avgPoints?: number;
  avgRebounds?: number;
  avgAssists?: number;
  avgSteals?: number;
  avgBlocks?: number;
  fieldGoalPercentage?: number;
  threePointPercentage?: number;
  freeThrowPercentage?: number;
}

const TeamDetail: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const { token, selectedLeague } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({ name: "", city: "", description: "" });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exportTheme, setExportTheme] = useState<"light" | "dark">("light");

  // Ref for capturing shot chart image
  const shotChartRef = useRef<HTMLDivElement>(null);

  // Fetch team data
  const teamData = useQuery(
    api.teams.get,
    token && teamId ? { token, teamId: teamId as Id<"teams"> } : "skip"
  );

  // Fetch team's players
  const playersData = useQuery(
    api.players.list,
    token && selectedLeague && teamId
      ? { token, leagueId: selectedLeague.id, teamId: teamId as Id<"teams"> }
      : "skip"
  );

  // Fetch team's recent games
  const gamesData = useQuery(
    api.games.list,
    token && selectedLeague && teamId
      ? { token, leagueId: selectedLeague.id, teamId: teamId as Id<"teams">, limit: 10 }
      : "skip"
  );

  // Fetch team statistics
  const teamsStatsData = useQuery(
    api.statistics.getTeamsStats,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  // Fetch lineup stats
  const lineupStatsData = useQuery(
    api.lineups.getTeamLineupStats,
    token && teamId ? { token, teamId: teamId as Id<"teams">, limit: 10 } : "skip"
  );

  // Fetch pair stats
  const pairStatsData = useQuery(
    api.lineups.getTeamPairStats,
    token && teamId ? { token, teamId: teamId as Id<"teams">, limit: 20 } : "skip"
  );

  // Fetch player stats for advanced analytics export
  const playersStatsData = useQuery(
    api.statistics.getPlayersStats,
    token && selectedLeague ? { token, leagueId: selectedLeague.id, perPage: 100 } : "skip"
  );

  // Fetch team shot chart for zone breakdown
  const teamShotChartData = useQuery(
    api.shots.getTeamShotChart,
    token && selectedLeague && teamId
      ? { token, leagueId: selectedLeague.id, teamId: teamId as Id<"teams"> }
      : "skip"
  );

  const updateTeam = useMutation(api.teams.update);
  const removeTeam = useMutation(api.teams.remove);

  const team = teamData?.team;
  const players = (playersData?.players || []) as PlayerItem[];
  const games = (gamesData?.games || []) as GameItem[];

  // Find this team's stats from the league stats
  const teamStats = teamsStatsData?.teams?.find((t: TeamStatsItem) => t.teamId === teamId);

  // Get win/loss record from team data
  const wins = team?.wins ?? 0;
  const losses = team?.losses ?? 0;
  const winPct = team?.winPercentage?.toFixed(1) ?? "0.0";

  // Export handlers
  const handleExportRoster = () => {
    if (!players || players.length === 0) {
      toast.info("No players to export");
      return;
    }
    try {
      exportRosterCSV(players, team?.name || "Team");
      toast.success("Roster exported successfully");
    } catch (error) {
      console.error("Failed to export roster:", error);
      toast.error("Failed to export roster");
    }
  };

  const handleExportLineups = () => {
    const lineups = lineupStatsData?.lineups || [];
    if (lineups.length === 0) {
      toast.info("No lineup data to export");
      return;
    }
    try {
      exportLineupStatsCSV(lineups, team?.name || "Team");
      toast.success("Lineup stats exported successfully");
    } catch (error) {
      console.error("Failed to export lineup stats:", error);
      toast.error("Failed to export lineup stats");
    }
  };

  const handleExportPairs = () => {
    const pairs = pairStatsData?.pairs || [];
    if (pairs.length === 0) {
      toast.info("No pair data to export");
      return;
    }
    try {
      exportPairStatsCSV(pairs, team?.name || "Team");
      toast.success("Pair stats exported successfully");
    } catch (error) {
      console.error("Failed to export pair stats:", error);
      toast.error("Failed to export pair stats");
    }
  };

  const handleExportSeason = async (options: TeamSeasonExportOptions) => {
    if (!team || !teamId) {
      throw new Error("Team data not available");
    }

    const teamName = team.name || "Team";
    const season = selectedLeague?.season || new Date().getFullYear().toString();
    const dateStr = new Date().toISOString().split("T")[0];

    // Export CSVs if requested
    if (options.format === "csv" || options.format === "both") {
      if (options.sections.playerStats && players.length > 0) {
        exportRosterCSV(players, teamName);
      }
      if (options.sections.lineupAnalysis) {
        const lineups = lineupStatsData?.lineups || [];
        const pairs = pairStatsData?.pairs || [];
        if (lineups.length > 0) {
          exportLineupStatsCSV(lineups, teamName);
        }
        if (pairs.length > 0) {
          exportPairStatsCSV(pairs, teamName);
        }
      }
    }

    // Generate PDF if requested
    if (options.format === "pdf" || options.format === "both") {
      // Import dynamically to avoid loading jspdf unnecessarily
      const { generateTeamSeasonPDF } = await import("../utils/export/pdf-export");

      // Capture shot chart image if section is enabled and chart is available
      let shotChartImage: string | undefined;
      if (options.sections.shotCharts && shotChartRef.current) {
        try {
          // Update theme and wait for re-render
          setExportTheme(options.theme);
          await new Promise((resolve) => setTimeout(resolve, 100));

          shotChartImage = await captureCourtAsImage(shotChartRef.current, {
            scale: 2,
            backgroundColor: options.theme === "dark" ? "#3d3835" : "#fdfcfb",
          });
        } catch (error) {
          console.warn("Failed to capture shot chart:", error);
        }
      }

      // Get player stats for this team from the league-wide player stats
      const teamPlayerStats =
        playersStatsData?.players?.filter((ps: { teamId: string }) => ps.teamId === teamId) || [];

      // Create a map of player ID to stats for quick lookup
      const playerStatsMap = new Map(
        teamPlayerStats.map((ps: { playerId: string }) => [ps.playerId, ps])
      );

      const pdfBlob = await generateTeamSeasonPDF({
        team: {
          id: teamId,
          name: teamName,
          city: team.city,
          wins,
          losses,
          winPercentage: parseFloat(winPct) / 100,
        },
        season,
        players: players.map((p) => {
          const pStats = playerStatsMap.get(p.id) as
            | {
                gamesPlayed?: number;
                avgPoints?: number;
                avgRebounds?: number;
                avgAssists?: number;
                avgSteals?: number;
                avgBlocks?: number;
                avgTurnovers?: number;
                fieldGoalPercentage?: number;
                threePointPercentage?: number;
                freeThrowPercentage?: number;
                trueShootingPercentage?: number;
                effectiveFieldGoalPercentage?: number;
                playerEfficiencyRating?: number;
                assistToTurnoverRatio?: number;
              }
            | undefined;
          return {
            id: p.id,
            name: p.name,
            number: p.number,
            position: p.position,
            gamesPlayed: pStats?.gamesPlayed,
            stats: pStats
              ? {
                  avgPoints: pStats.avgPoints,
                  avgRebounds: pStats.avgRebounds,
                  avgAssists: pStats.avgAssists,
                  avgSteals: pStats.avgSteals,
                  avgBlocks: pStats.avgBlocks,
                  avgTurnovers: pStats.avgTurnovers,
                  fieldGoalPercentage: pStats.fieldGoalPercentage,
                  threePointPercentage: pStats.threePointPercentage,
                  freeThrowPercentage: pStats.freeThrowPercentage,
                  trueShootingPercentage: pStats.trueShootingPercentage,
                  effectiveFieldGoalPercentage: pStats.effectiveFieldGoalPercentage,
                  playerEfficiencyRating: pStats.playerEfficiencyRating,
                  assistToTurnoverRatio: pStats.assistToTurnoverRatio,
                }
              : undefined,
          };
        }),
        games: games.map((g) => {
          const isHome = g.homeTeam?.name === team.name;
          return {
            id: g.id,
            date: g.scheduledAt || g.startedAt,
            opponent: isHome ? g.awayTeam?.name : g.homeTeam?.name,
            homeGame: isHome,
            teamScore: isHome ? g.homeScore : g.awayScore,
            opponentScore: isHome ? g.awayScore : g.homeScore,
            result:
              g.status === "completed"
                ? (isHome ? g.homeScore : g.awayScore) > (isHome ? g.awayScore : g.homeScore)
                  ? ("W" as const)
                  : ("L" as const)
                : ("N/A" as const),
          };
        }),
        lineups: lineupStatsData?.lineups || [],
        pairs: pairStatsData?.pairs || [],
        // Transform zone stats for shooting breakdown
        shootingByZone: teamShotChartData?.zoneStats
          ? {
              paint: teamShotChartData.zoneStats.paint || { made: 0, attempted: 0 },
              midRange: teamShotChartData.zoneStats.midrange || { made: 0, attempted: 0 },
              threePoint: {
                made:
                  (teamShotChartData.zoneStats.corner3?.made || 0) +
                  (teamShotChartData.zoneStats.wing3?.made || 0) +
                  (teamShotChartData.zoneStats.top3?.made || 0),
                attempted:
                  (teamShotChartData.zoneStats.corner3?.attempted || 0) +
                  (teamShotChartData.zoneStats.wing3?.attempted || 0) +
                  (teamShotChartData.zoneStats.top3?.attempted || 0),
              },
            }
          : undefined,
        shotChartImage,
        options: {
          sections: options.sections,
          theme: options.theme,
        },
      });

      const filename = `${teamName.replace(/\s+/g, "-")}-season-${season}-${dateStr}.pdf`;
      downloadPDF(pdfBlob, filename);
    }

    toast.success("Season data exported successfully");
  };

  const openEditModal = () => {
    if (team) {
      setEditForm({
        name: team.name || "",
        city: team.city || "",
        description: team.description || "",
      });
    }
    setShowEditModal(true);
  };

  const handleUpdateTeam = async () => {
    if (!editForm.name.trim() || !token || !teamId) return;

    setIsUpdating(true);
    try {
      await updateTeam({
        token,
        teamId: teamId as Id<"teams">,
        name: editForm.name.trim(),
        city: editForm.city.trim() || undefined,
        description: editForm.description.trim() || undefined,
      });
      toast.success("Team updated successfully");
      setShowEditModal(false);
    } catch (error) {
      console.error("Failed to update team:", error);
      const message = getErrorMessage(error, "Failed to update team. Please try again.");
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!token || !teamId) return;

    setIsDeleting(true);
    try {
      await removeTeam({
        token,
        teamId: teamId as Id<"teams">,
      });
      toast.success("Team deleted successfully");
      navigate("/app/teams");
    } catch (error) {
      console.error("Failed to delete team:", error);
      const message = getErrorMessage(error, "Failed to delete team. Please try again.");
      toast.error(message);
      setIsDeleting(false);
    }
  };

  const getPositionColor = (position?: string) => {
    switch (position) {
      case "PG":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400";
      case "SG":
        return "bg-violet-500/15 text-violet-600 dark:text-violet-400";
      case "SF":
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
      case "PF":
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
      case "C":
        return "bg-red-500/15 text-red-600 dark:text-red-400";
      default:
        return "bg-surface-500/15 text-surface-600 dark:text-surface-400";
    }
  };

  if (teamData === undefined || playersData === undefined) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-3">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-surface-200 dark:border-surface-700" />
          <div className="absolute inset-0 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-surface-500">Loading team...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
          <UsersIcon className="w-8 h-8 text-surface-400" />
        </div>
        <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
          Team not found
        </h3>
        <p className="text-surface-500 text-sm mb-4">
          This team may have been deleted or doesn't exist.
        </p>
        <button
          onClick={() => navigate("/app/teams")}
          className="btn-secondary px-4 py-2 rounded-xl"
        >
          Back to Teams
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: "Teams", href: "/app/teams" }, { label: team.name }]} />

      {/* Team Header */}
      <header className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex items-start gap-5">
              {team.logoUrl ? (
                <img
                  src={team.logoUrl}
                  alt={team.name}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover bg-surface-100 dark:bg-surface-700 flex-shrink-0"
                />
              ) : (
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-500/10 flex items-center justify-center flex-shrink-0">
                  <UsersIcon className="w-10 h-10 md:w-12 md:h-12 text-primary-500" />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white tracking-tight">
                  {team.name}
                </h1>
                {team.city && (
                  <p className="text-surface-500 dark:text-surface-400 mt-1">{team.city}</p>
                )}
                {team.description && (
                  <p className="text-sm text-surface-500 mt-2 max-w-lg line-clamp-2">
                    {team.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <button
                onClick={() => setShowExportModal(true)}
                className="btn-primary px-3 md:px-4 py-2 rounded-xl flex items-center gap-2 text-sm"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Export Season</span>
              </button>
              <button
                onClick={openEditModal}
                className="btn-secondary px-3 md:px-4 py-2 rounded-xl flex items-center gap-2 text-sm"
              >
                <PencilIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Edit</span>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 md:px-4 py-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <TrashIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="border-t border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-900/50 px-6 md:px-8 py-4">
          <div className="flex items-center gap-8 md:gap-12 overflow-x-auto">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <TrophyIcon className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-white tabular-nums tracking-tight">
                  {wins}-{losses}
                </p>
                <p className="text-xs text-surface-500 font-medium">{winPct}% Win Rate</p>
              </div>
            </div>

            <div className="w-px h-10 bg-surface-200 dark:bg-surface-700 flex-shrink-0" />

            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-surface-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-white tabular-nums tracking-tight">
                  {players.length}
                </p>
                <p className="text-xs text-surface-500 font-medium">Players</p>
              </div>
            </div>

            {teamStats && (
              <>
                <div className="w-px h-10 bg-surface-200 dark:bg-surface-700 flex-shrink-0" />
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
                    <ArrowTrendingUpIcon className="w-5 h-5 text-surface-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-surface-900 dark:text-white tabular-nums tracking-tight">
                      {teamStats.avgPoints?.toFixed(1) ?? "0.0"}
                    </p>
                    <p className="text-xs text-surface-500 font-medium">PPG</p>
                  </div>
                </div>

                <div className="w-px h-10 bg-surface-200 dark:bg-surface-700 flex-shrink-0" />
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
                    <ChartBarIcon className="w-5 h-5 text-surface-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-surface-900 dark:text-white tabular-nums tracking-tight">
                      {teamStats.fieldGoalPercentage?.toFixed(1) ?? "0.0"}%
                    </p>
                    <p className="text-xs text-surface-500 font-medium">FG%</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Team Statistics Section */}
      {teamStats && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="section-header">Season Averages</h2>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: "RPG", value: teamStats.avgRebounds?.toFixed(1) ?? "0.0" },
              { label: "APG", value: teamStats.avgAssists?.toFixed(1) ?? "0.0" },
              { label: "SPG", value: teamStats.avgSteals?.toFixed(1) ?? "0.0" },
              { label: "BPG", value: teamStats.avgBlocks?.toFixed(1) ?? "0.0" },
              { label: "3P%", value: `${teamStats.threePointPercentage?.toFixed(1) ?? "0.0"}%` },
              { label: "FT%", value: `${teamStats.freeThrowPercentage?.toFixed(1) ?? "0.0"}%` },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 text-center"
              >
                <p className="text-xl md:text-2xl font-bold text-surface-900 dark:text-white tabular-nums">
                  {stat.value}
                </p>
                <p className="text-xs text-surface-500 font-medium mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roster */}
        <section className="lg:col-span-2">
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Roster</h2>
                <span className="px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 text-xs font-medium text-surface-600 dark:text-surface-400">
                  {players.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportRoster}
                  disabled={players.length === 0}
                  className="btn-secondary px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Export Roster"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Export
                </button>
                <Link
                  to={`/app/teams/${teamId}/players/new`}
                  className="btn-primary px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Player
                </Link>
              </div>
            </div>

            {players.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-surface-100 to-surface-200 dark:from-surface-700 dark:to-surface-800 flex items-center justify-center mb-4 shadow-soft">
                  <UserIcon className="w-7 h-7 text-surface-400" />
                </div>
                <p className="text-surface-900 dark:text-white font-semibold mb-1">
                  No players yet
                </p>
                <p className="text-surface-500 text-sm text-center max-w-xs">
                  Add players to this team to start tracking their stats
                </p>
              </div>
            ) : (
              <div className="divide-y divide-surface-100 dark:divide-surface-800">
                {players.map((player: PlayerItem) => (
                  <Link
                    key={player.id}
                    to={`/app/players/${player.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-surface-900 dark:text-white tabular-nums">
                        {player.number}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-surface-900 dark:text-white truncate group-hover:text-primary-500 transition-colors">
                        {player.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {player.position && (
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${getPositionColor(player.position)}`}
                          >
                            {player.position}
                          </span>
                        )}
                        <span
                          className={`text-xs font-medium ${
                            player.status === "active" || player.active !== false
                              ? "text-emerald-600 dark:text-emerald-400"
                              : player.status === "injured"
                                ? "text-red-500"
                                : "text-surface-500"
                          }`}
                        >
                          {player.status === "active" || player.active !== false
                            ? "Active"
                            : player.status === "injured"
                              ? "Injured"
                              : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-surface-300 dark:text-surface-600 group-hover:text-surface-400 transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Recent Games */}
        <section>
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200 dark:border-surface-700">
              <h2 className="font-semibold text-surface-900 dark:text-white">Recent Games</h2>
              <Link
                to="/app/games"
                className="text-sm font-medium text-primary-500 hover:text-primary-400 transition-colors"
              >
                View All
              </Link>
            </div>

            {games.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-surface-100 to-surface-200 dark:from-surface-700 dark:to-surface-800 flex items-center justify-center mb-3">
                  <CalendarIcon className="w-6 h-6 text-surface-400" />
                </div>
                <p className="text-surface-500 text-sm text-center">No games scheduled yet</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-100 dark:divide-surface-800">
                {games.slice(0, 5).map((game: GameItem) => {
                  const isHome = game.homeTeam?.id === teamId;
                  const opponent = isHome ? game.awayTeam : game.homeTeam;
                  const teamScore = isHome ? game.homeScore : game.awayScore;
                  const opponentScore = isHome ? game.awayScore : game.homeScore;
                  const won = teamScore > opponentScore;
                  const isCompleted = game.status === "completed";

                  return (
                    <Link
                      key={game.id}
                      to={`/app/games/${game.id}/analysis`}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors group"
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          isCompleted
                            ? won
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-red-500/15 text-red-600 dark:text-red-400"
                            : "bg-surface-100 dark:bg-surface-700 text-surface-400"
                        }`}
                      >
                        {isCompleted ? (won ? "W" : "L") : "-"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-900 dark:text-white truncate group-hover:text-primary-500 transition-colors">
                          {isHome ? "vs" : "@"} {opponent?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-surface-500 mt-0.5">
                          {game.scheduledAt
                            ? new Date(game.scheduledAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })
                            : "No date"}
                        </p>
                      </div>
                      {isCompleted && (
                        <div className="text-sm font-bold tabular-nums text-surface-900 dark:text-white flex-shrink-0">
                          {teamScore}-{opponentScore}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Lineup Analysis Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="section-header">Lineup Analysis</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 5-Man Lineups */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
                  <UsersIcon className="w-4 h-4 text-primary-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-white">5-Man Lineups</h3>
                  <p className="text-xs text-surface-500">Best performing combinations</p>
                </div>
              </div>
              <button
                onClick={handleExportLineups}
                disabled={!lineupStatsData?.lineups?.length}
                className="btn-secondary px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export Lineup Stats"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                Export
              </button>
            </div>
            <LineupStatsTable
              lineups={lineupStatsData?.lineups || []}
              isLoading={lineupStatsData === undefined}
            />
          </div>

          {/* Player Pairs / Chemistry */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
                  <UserGroupIcon className="w-4 h-4 text-primary-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-white">
                    Player Chemistry
                  </h3>
                  <p className="text-xs text-surface-500">Two-player pair performance</p>
                </div>
              </div>
              <button
                onClick={handleExportPairs}
                disabled={!pairStatsData?.pairs?.length}
                className="btn-secondary px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export Pair Stats"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                Export
              </button>
            </div>
            <PairStatsGrid
              pairs={pairStatsData?.pairs || []}
              isLoading={pairStatsData === undefined}
            />
          </div>
        </div>
      </section>

      {/* Edit Team Modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}
        >
          <div className="bg-white dark:bg-surface-800 rounded-2xl w-full max-w-md shadow-dramatic border border-surface-200 dark:border-surface-700 animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-700">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Edit Team</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 -m-2 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Team Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                  placeholder="Enter team name"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, city: e.target.value }))}
                  className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                  placeholder="Enter city (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                  className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow resize-none"
                  placeholder="Enter description (optional)"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-900/50">
              <button
                onClick={() => setShowEditModal(false)}
                className="btn-secondary px-4 py-2.5 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTeam}
                disabled={!editForm.name.trim() || isUpdating}
                className="btn-primary px-5 py-2.5 rounded-xl"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowDeleteConfirm(false)}
        >
          <div className="bg-white dark:bg-surface-800 rounded-2xl w-full max-w-sm shadow-dramatic border border-surface-200 dark:border-surface-700 animate-scale-in">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrashIcon className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                Delete Team?
              </h3>
              <p className="text-surface-500 text-sm leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-medium text-surface-700 dark:text-surface-300">
                  "{team.name}"
                </span>
                ? This action cannot be undone and will remove all associated player data.
              </p>
            </div>

            <div className="flex gap-3 p-6 border-t border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-900/50">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 btn-secondary px-4 py-2.5 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTeam}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-surface-800 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Team"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Season Modal */}
      <TeamSeasonExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        teamName={team?.name || "Team"}
        teamId={teamId || ""}
        onExport={handleExportSeason}
      />

      {/* Off-screen shot chart for PDF export capture */}
      <div className="absolute left-[-9999px] top-0 pointer-events-none">
        <div ref={shotChartRef}>
          <PrintableShotChart
            shots={
              teamShotChartData?.shots?.map(
                (s: { x: number; y: number; made: boolean; shotType: string }) => ({
                  x: s.x,
                  y: s.y,
                  made: s.made,
                  is3pt: s.shotType === "3pt",
                })
              ) || []
            }
            theme={exportTheme}
            showHeatMap={true}
            title={`${team?.name || "Team"} Shot Chart`}
            subtitle={`${selectedLeague?.season || ""} Season`}
            width={400}
            height={376}
          />
        </div>
      </div>
    </div>
  );
};

export default TeamDetail;
