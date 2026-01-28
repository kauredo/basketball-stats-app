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
  UsersIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
  GlobeAltIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { SOCIAL_PLATFORMS } from "@basketball-stats/shared";
import { exportRosterCSV, exportLineupStatsCSV, exportPairStatsCSV } from "../utils/export";
import {
  TeamSeasonExportModal,
  type TeamSeasonExportOptions,
} from "../components/export/TeamSeasonExportModal";
import { downloadPDF, captureCourtAsImage } from "../utils/export/pdf-export";
import { PrintableShotChart } from "../components/export/PrintableShotChart";
import {
  TeamFormModal,
  PlayerFormModal,
  DeleteConfirmationModal,
  type TeamFormData,
  type PlayerFormData,
} from "../components/modals";

// Extended team data interface with new fields
interface ExtendedTeamData {
  id?: string;
  name?: string;
  city?: string;
  description?: string;
  logoUrl?: string;
  logoStorageId?: string;
  primaryColor?: string;
  secondaryColor?: string;
  websiteUrl?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    youtube?: string;
    tiktok?: string;
    linkedin?: string;
  };
  // Stats fields
  wins?: number;
  losses?: number;
  winPercentage?: number;
  pointsFor?: number;
  pointsAgainst?: number;
  gamesPlayed?: number;
  activePlayersCount?: number;
  // Permission flag
  canManage?: boolean;
}

// Interface for team membership items
interface TeamMembershipItem {
  id: string;
  role: "coach" | "assistant" | "player" | "manager";
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  player: {
    id: string;
    name: string;
    number: number;
  } | null;
  joinedAt: number;
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
  const [showCreatePlayerModal, setShowCreatePlayerModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
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

  // Fetch team memberships (coaches, managers, etc.)
  const teamMembershipsData = useQuery(
    api.teamMemberships.list,
    token && teamId ? { token, teamId: teamId as Id<"teams"> } : "skip"
  );

  const updateTeam = useMutation(api.teams.update);
  const removeTeam = useMutation(api.teams.remove);
  const createPlayer = useMutation(api.players.create);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const team = (teamData as any)?.team as ExtendedTeamData | undefined;
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
    setShowEditModal(true);
  };

  const handleUpdateTeam = async (
    data: TeamFormData,
    logoStorageId?: Id<"_storage"> | null,
    clearLogo?: boolean
  ) => {
    if (!token || !teamId) return;

    setIsUpdating(true);
    try {
      await updateTeam({
        token,
        teamId: teamId as Id<"teams">,
        name: data.name.trim(),
        city: data.city.trim() || undefined,
        description: data.description.trim() || undefined,
        logoStorageId: logoStorageId || undefined,
        clearLogo: clearLogo || undefined,
        primaryColor: data.primaryColor || undefined,
        secondaryColor: data.secondaryColor || undefined,
        websiteUrl: data.websiteUrl?.trim() || undefined,
        socialLinks: data.socialLinks,
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

  const handleCreatePlayer = async (data: PlayerFormData) => {
    if (!token || !teamId) return;

    setIsCreating(true);
    try {
      await createPlayer({
        token,
        teamId: teamId as Id<"teams">,
        name: data.name.trim(),
        number: parseInt(data.number),
        position: data.position,
        heightCm: data.heightCm ? parseInt(data.heightCm) : undefined,
        weightKg: data.weightKg ? parseInt(data.weightKg) : undefined,
        email: data.email?.trim() || undefined,
      });
      toast.success(`Player "${data.name.trim()}" added to ${team?.name}`);
      setShowCreatePlayerModal(false);
    } catch (error) {
      console.error("Failed to create player:", error);
      const message = getErrorMessage(error, "Failed to add player. Please try again.");
      toast.error(message);
    } finally {
      setIsCreating(false);
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
      <Breadcrumb
        items={[{ label: "Teams", href: "/app/teams" }, { label: team.name || "Team" }]}
      />

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
                {/* Website and Social Links */}
                {(team?.websiteUrl || team?.socialLinks) && (
                  <div className="flex items-center gap-3 mt-3">
                    {team?.websiteUrl && (
                      <a
                        href={team.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 transition-colors"
                      >
                        <GlobeAltIcon className="w-4 h-4" />
                        Website
                        <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                      </a>
                    )}
                    {team?.socialLinks &&
                      Object.entries(team.socialLinks).map(([key, url]) => {
                        if (!url || typeof url !== "string") return null;
                        const platform = SOCIAL_PLATFORMS.find((p) => p.key === key);
                        return (
                          <a
                            key={key}
                            href={url as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-surface-500 hover:text-primary-500 transition-colors"
                            title={platform?.label || key}
                          >
                            <span className="sr-only">{platform?.label || key}</span>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              {key === "instagram" && (
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                              )}
                              {key === "twitter" && (
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                              )}
                              {key === "facebook" && (
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                              )}
                              {key === "youtube" && (
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                              )}
                              {key === "tiktok" && (
                                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                              )}
                              {key === "linkedin" && (
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                              )}
                            </svg>
                          </a>
                        );
                      })}
                  </div>
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
              {team?.canManage && (
                <>
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
                </>
              )}
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
                {team?.canManage && (
                  <button
                    onClick={() => setShowCreatePlayerModal(true)}
                    className="btn-primary px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Player
                  </button>
                )}
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

      {/* Team Staff Section */}
      {(teamMembershipsData?.memberships?.length ?? 0) > 0 && (
        <section>
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
              <div className="flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5 text-primary-500" />
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                  Team Staff
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 text-xs font-medium text-surface-600 dark:text-surface-400">
                  {teamMembershipsData?.memberships?.length ?? 0}
                </span>
              </div>
            </div>
            <div className="divide-y divide-surface-100 dark:divide-surface-800">
              {(teamMembershipsData?.memberships as TeamMembershipItem[] | undefined)?.map(
                (membership) => (
                  <div key={membership.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                      {membership.user?.firstName?.[0]?.toUpperCase() || "?"}
                      {membership.user?.lastName?.[0]?.toUpperCase() || ""}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-surface-900 dark:text-white">
                        {membership.user
                          ? `${membership.user.firstName} ${membership.user.lastName}`
                          : "Unknown"}
                      </p>
                      <p className="text-sm text-surface-500 capitalize">{membership.role}</p>
                    </div>
                    {membership.player && (
                      <span className="px-2 py-1 rounded-lg bg-surface-100 dark:bg-surface-700 text-xs text-surface-600 dark:text-surface-400">
                        #{membership.player.number} {membership.player.name}
                      </span>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      )}

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
      <TeamFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdateTeam}
        isSubmitting={isUpdating}
        mode="edit"
        initialData={
          team
            ? {
                name: team.name || "",
                city: team.city || "",
                description: team.description || "",
                logoUrl: team.logoUrl,
                primaryColor: team.primaryColor,
                secondaryColor: team.secondaryColor,
                websiteUrl: team.websiteUrl,
                socialLinks: team.socialLinks,
              }
            : undefined
        }
      />

      {/* Add Player Modal */}
      <PlayerFormModal
        isOpen={showCreatePlayerModal}
        onClose={() => setShowCreatePlayerModal(false)}
        onSubmit={handleCreatePlayer}
        isSubmitting={isCreating}
        mode="create"
        teamName={team?.name}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteTeam}
        isDeleting={isDeleting}
        title="Delete Team?"
        itemName={team?.name || ""}
        warningMessage="This action cannot be undone and will remove all associated player data."
      />

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
