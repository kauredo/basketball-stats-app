import React, { useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import {
  ChartBarIcon,
  UserIcon,
  TrophyIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import { exportPlayerGameLogCSV } from "../utils/export";
import { downloadPDF, captureCourtAsImage } from "../utils/export/pdf-export";
import { useToast } from "../contexts/ToastContext";
import Breadcrumb from "../components/Breadcrumb";
import {
  PlayerSeasonExportModal,
  type PlayerSeasonExportOptions,
} from "../components/export/PlayerSeasonExportModal";
import { PrintableShotChart } from "../components/export/PrintableShotChart";

interface StatCardProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

function StatCard({ label, value, highlight = false }: StatCardProps) {
  return (
    <div className="surface-card p-4">
      <p className="section-header">{label}</p>
      <p
        className={`text-stat-md font-bold tabular-nums ${
          highlight ? "text-primary-500" : "text-surface-900 dark:text-white"
        }`}
        data-stat
      >
        {value}
      </p>
    </div>
  );
}

interface StatRowProps {
  label: string;
  value: string | number;
}

// Local interface for recent game items
interface RecentGameItem {
  gameId?: string;
  gameDate?: number;
  opponent?: string;
  points?: number;
  rebounds?: number;
  assists?: number;
  steals?: number;
  blocks?: number;
  fieldGoalsMade?: number;
  fieldGoalsAttempted?: number;
  threePointersMade?: number;
  threePointersAttempted?: number;
  freeThrowsMade?: number;
  freeThrowsAttempted?: number;
  minutes?: number;
  fieldGoalPercentage?: number;
}

function StatRow({ label, value }: StatRowProps) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-surface-200 dark:border-surface-700 last:border-b-0">
      <span className="text-surface-600 dark:text-surface-400">{label}</span>
      <span className="text-surface-900 dark:text-white font-medium tabular-nums" data-stat>
        {value}
      </span>
    </div>
  );
}

const PlayerDetail: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const { token, selectedLeague } = useAuth();
  const toast = useToast();

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportTheme, setExportTheme] = useState<"light" | "dark">("light");
  const shotChartRef = useRef<HTMLDivElement>(null);

  const playerData = useQuery(
    api.players.get,
    token && playerId ? { token, playerId: playerId as Id<"players"> } : "skip"
  );

  const playerStats = useQuery(
    api.statistics.getPlayerSeasonStats,
    token && selectedLeague && playerId
      ? { token, leagueId: selectedLeague.id, playerId: playerId as Id<"players"> }
      : "skip"
  );

  // Fetch player shot chart data
  const playerShotChartData = useQuery(
    api.shots.getPlayerShotChart,
    token && selectedLeague && playerId
      ? { token, leagueId: selectedLeague.id, playerId: playerId as Id<"players"> }
      : "skip"
  );

  if (!selectedLeague) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <UserIcon className="w-16 h-16 text-surface-400 mb-4" />
        <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
          No League Selected
        </h2>
        <p className="text-surface-600 dark:text-surface-400">
          Please select a league to view player details.
        </p>
      </div>
    );
  }

  if (playerData === undefined || playerStats === undefined) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const player = playerData?.player;
  const stats = playerStats?.stats;
  const recentGames = (playerStats?.recentGames || []) as RecentGameItem[];

  const handleExportGameLog = () => {
    if (!recentGames || recentGames.length === 0) {
      toast.info("No games to export");
      return;
    }

    try {
      exportPlayerGameLogCSV(recentGames, player?.name || "Unknown Player", selectedLeague?.season);
      toast.success("Game log exported successfully");
    } catch (error) {
      console.error("Failed to export game log:", error);
      toast.error("Failed to export game log");
    }
  };

  const handleExportSeason = async (options: PlayerSeasonExportOptions) => {
    if (!player || !playerId || !stats) {
      throw new Error("Player data not available");
    }

    const { generatePlayerSeasonPDF } = await import("../utils/export/pdf-export");

    // Capture shot chart image if section is enabled
    let shotChartImage: string | undefined;
    if (options.sections.shotChart && shotChartRef.current) {
      try {
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

    // Transform zone stats
    const shootingByZone = playerShotChartData?.zoneStats
      ? {
          paint: playerShotChartData.zoneStats.paint || { made: 0, attempted: 0 },
          midRange: playerShotChartData.zoneStats.midrange || { made: 0, attempted: 0 },
          threePoint: {
            made:
              (playerShotChartData.zoneStats.corner3?.made || 0) +
              (playerShotChartData.zoneStats.wing3?.made || 0) +
              (playerShotChartData.zoneStats.top3?.made || 0),
            attempted:
              (playerShotChartData.zoneStats.corner3?.attempted || 0) +
              (playerShotChartData.zoneStats.wing3?.attempted || 0) +
              (playerShotChartData.zoneStats.top3?.attempted || 0),
          },
        }
      : undefined;

    const pdfBlob = await generatePlayerSeasonPDF({
      player: {
        id: playerId,
        name: player.name,
        number: player.number,
        position: player.position,
        team: player.team ? { id: player.team.id || "", name: player.team.name } : undefined,
      },
      season: selectedLeague?.season || new Date().getFullYear().toString(),
      stats: {
        gamesPlayed: stats.gamesPlayed || 0,
        avgPoints: stats.avgPoints || 0,
        avgRebounds: stats.avgRebounds || 0,
        avgAssists: stats.avgAssists || 0,
        avgSteals: stats.avgSteals || 0,
        avgBlocks: stats.avgBlocks || 0,
        avgTurnovers: stats.avgTurnovers || 0,
        avgMinutes: stats.avgMinutes || 0,
        totalPoints: stats.totalPoints || 0,
        totalRebounds: stats.totalRebounds || 0,
        totalAssists: stats.totalAssists || 0,
        totalSteals: stats.totalSteals || 0,
        totalBlocks: stats.totalBlocks || 0,
        totalTurnovers: stats.totalTurnovers || 0,
        totalFouls: stats.totalFouls || 0,
        totalFieldGoalsMade: stats.totalFieldGoalsMade || 0,
        totalFieldGoalsAttempted: stats.totalFieldGoalsAttempted || 0,
        totalThreePointersMade: stats.totalThreePointersMade || 0,
        totalThreePointersAttempted: stats.totalThreePointersAttempted || 0,
        totalFreeThrowsMade: stats.totalFreeThrowsMade || 0,
        totalFreeThrowsAttempted: stats.totalFreeThrowsAttempted || 0,
        fieldGoalPercentage: stats.fieldGoalPercentage || 0,
        threePointPercentage: stats.threePointPercentage || 0,
        freeThrowPercentage: stats.freeThrowPercentage || 0,
        trueShootingPercentage: stats.trueShootingPercentage,
        effectiveFieldGoalPercentage: stats.effectiveFieldGoalPercentage,
        playerEfficiencyRating: stats.playerEfficiencyRating,
      },
      games: recentGames.map((g: RecentGameItem) => ({
        id: g.gameId || "",
        date: g.gameDate,
        opponent: g.opponent,
        points: g.points || 0,
        rebounds: g.rebounds || 0,
        assists: g.assists || 0,
        steals: g.steals || 0,
        blocks: g.blocks || 0,
        fieldGoalsMade: g.fieldGoalsMade || 0,
        fieldGoalsAttempted: g.fieldGoalsAttempted || 0,
        threePointersMade: g.threePointersMade || 0,
        threePointersAttempted: g.threePointersAttempted || 0,
        freeThrowsMade: g.freeThrowsMade || 0,
        freeThrowsAttempted: g.freeThrowsAttempted || 0,
        minutes: g.minutes || 0,
      })),
      shotChartImage,
      shootingByZone,
      options: {
        sections: options.sections,
        theme: options.theme,
      },
    });

    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `${player.name.replace(/\s+/g, "-")}-season-${selectedLeague?.season || "report"}-${dateStr}.pdf`;
    downloadPDF(pdfBlob, filename);

    toast.success("Season report exported successfully");
  };

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <UserIcon className="w-16 h-16 text-surface-400 mb-4" />
        <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
          Player Not Found
        </h2>
        <button
          onClick={() => navigate("/app/players")}
          className="text-primary-500 hover:underline"
        >
          Back to Players
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: "Players", href: "/players" }, { label: player.name }]} />

      {/* Header */}
      <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl p-8 text-white shadow-elevated">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
            <span className="text-4xl font-bold tracking-tight">#{player.number}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-display-sm">{player.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-white/80">
              <span className="font-medium">{player.position || "N/A"}</span>
              {player.heightCm && <span>{player.heightCm} cm</span>}
              {player.weightKg && <span>{player.weightKg} kg</span>}
            </div>
            <Link
              to={`/app/teams`}
              className="text-white/90 hover:text-white mt-1 inline-block transition-colors"
            >
              {player.team?.name || "No Team"}
            </Link>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/app/shot-charts?player=${playerId}`)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl flex items-center gap-2 transition-colors"
            >
              <ChartBarIcon className="w-5 h-5" />
              Shot Chart
            </button>
            <button
              onClick={() => navigate(`/app/compare?player1=${playerId}`)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl flex items-center gap-2 transition-colors"
            >
              <TrophyIcon className="w-5 h-5" />
              Compare
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              disabled={!stats}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export Season Report"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Export Season</span>
              <span className="sm:hidden">Export</span>
            </button>
            <button
              onClick={handleExportGameLog}
              disabled={recentGames.length === 0}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export Game Log CSV"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <StatCard label="Games Played" value={stats.gamesPlayed || 0} />
            <StatCard label="PPG" value={stats.avgPoints?.toFixed(1) || "0.0"} highlight />
            <StatCard label="RPG" value={stats.avgRebounds?.toFixed(1) || "0.0"} highlight />
            <StatCard label="APG" value={stats.avgAssists?.toFixed(1) || "0.0"} highlight />
            <StatCard label="FG%" value={`${stats.fieldGoalPercentage?.toFixed(1) || "0.0"}%`} />
            <StatCard label="3P%" value={`${stats.threePointPercentage?.toFixed(1) || "0.0"}%`} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Scoring Stats */}
            <div className="surface-card p-6">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
                Scoring
              </h3>
              <div className="space-y-1">
                <StatRow label="Total Points" value={stats.totalPoints || 0} />
                <StatRow
                  label="Field Goals"
                  value={`${stats.totalFieldGoalsMade || 0}/${stats.totalFieldGoalsAttempted || 0}`}
                />
                <StatRow
                  label="3-Pointers"
                  value={`${stats.totalThreePointersMade || 0}/${stats.totalThreePointersAttempted || 0}`}
                />
                <StatRow
                  label="Free Throws"
                  value={`${stats.totalFreeThrowsMade || 0}/${stats.totalFreeThrowsAttempted || 0}`}
                />
                <StatRow label="FT%" value={`${stats.freeThrowPercentage?.toFixed(1) || "0.0"}%`} />
              </div>
            </div>

            {/* Other Stats */}
            <div className="surface-card p-6">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
                Other Stats
              </h3>
              <div className="space-y-1">
                <StatRow label="Total Rebounds" value={stats.totalRebounds || 0} />
                <StatRow label="Total Assists" value={stats.totalAssists || 0} />
                <StatRow label="Total Steals" value={stats.totalSteals || 0} />
                <StatRow label="Total Blocks" value={stats.totalBlocks || 0} />
                <StatRow label="Total Turnovers" value={stats.totalTurnovers || 0} />
                <StatRow label="Total Fouls" value={stats.totalFouls || 0} />
                <StatRow label="Total Minutes" value={Math.round(stats.totalMinutes || 0)} />
              </div>
            </div>
          </div>

          {/* Inline Shot Chart */}
          {playerShotChartData &&
            playerShotChartData.shots &&
            playerShotChartData.shots.length > 0 && (
              <div className="surface-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                    Shot Chart
                  </h3>
                  <button
                    onClick={() => navigate(`/app/shot-charts?player=${playerId}`)}
                    className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                  >
                    View Full Chart
                  </button>
                </div>
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Mini Court */}
                  <div className="flex-shrink-0 flex justify-center">
                    <div className="w-[280px]">
                      <PrintableShotChart
                        shots={playerShotChartData.shots.map(
                          (s: { x: number; y: number; made: boolean; shotType: string }) => ({
                            x: s.x,
                            y: s.y,
                            made: s.made,
                            is3pt: s.shotType === "3pt",
                          })
                        )}
                        theme="light"
                        showHeatMap={true}
                        width={280}
                        height={264}
                      />
                    </div>
                  </div>

                  {/* Zone Stats */}
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      {
                        label: "Paint",
                        stats: playerShotChartData.zoneStats?.paint,
                        benchmark: 60,
                      },
                      {
                        label: "Mid-Range",
                        stats: playerShotChartData.zoneStats?.midrange,
                        benchmark: 42,
                      },
                      {
                        label: "Corner 3",
                        stats: playerShotChartData.zoneStats?.corner3,
                        benchmark: 38,
                      },
                      {
                        label: "Wing 3",
                        stats: playerShotChartData.zoneStats?.wing3,
                        benchmark: 36,
                      },
                      {
                        label: "Top 3",
                        stats: playerShotChartData.zoneStats?.top3,
                        benchmark: 36,
                      },
                      {
                        label: "Overall",
                        stats: {
                          made: playerShotChartData.stats?.madeShots || 0,
                          attempted: playerShotChartData.stats?.totalShots || 0,
                          percentage:
                            (playerShotChartData.stats?.totalShots || 0) > 0
                              ? Math.round(
                                  ((playerShotChartData.stats?.madeShots || 0) /
                                    (playerShotChartData.stats?.totalShots || 1)) *
                                    1000
                                ) / 10
                              : 0,
                        },
                        benchmark: 45,
                      },
                    ].map((zone) => {
                      const pct = zone.stats?.percentage || 0;
                      const made = zone.stats?.made || 0;
                      const attempted = zone.stats?.attempted || 0;
                      const pctColor =
                        attempted === 0
                          ? "text-surface-400"
                          : pct >= zone.benchmark
                            ? "text-green-500"
                            : pct < zone.benchmark - 10
                              ? "text-red-500"
                              : "text-surface-900 dark:text-white";

                      return (
                        <div
                          key={zone.label}
                          className="bg-surface-50 dark:bg-surface-800 rounded-lg p-3 text-center"
                        >
                          <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">
                            {zone.label}
                          </p>
                          <p className={`text-xl font-bold tabular-nums ${pctColor}`} data-stat>
                            {attempted > 0 ? `${pct}%` : "-"}
                          </p>
                          <p className="text-xs text-surface-400 tabular-nums" data-stat>
                            {made}/{attempted}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
        </>
      )}

      {/* Recent Games */}
      <div className="surface-card overflow-hidden">
        <div className="p-6 border-b border-surface-200 dark:border-surface-700">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Recent Games</h3>
        </div>
        {recentGames.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-50 dark:bg-surface-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                    Opponent
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                    PTS
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                    REB
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                    AST
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                    FG%
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                {recentGames.slice(0, 10).map((game: RecentGameItem, index: number) => (
                  <tr
                    key={game.gameId || index}
                    className="hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-900 dark:text-white">
                      {game.gameDate ? new Date(game.gameDate).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-900 dark:text-white">
                      vs {game.opponent || "Unknown"}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-surface-900 dark:text-white tabular-nums"
                      data-stat
                    >
                      {game.points || 0}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-center text-surface-700 dark:text-surface-300 tabular-nums"
                      data-stat
                    >
                      {game.rebounds || 0}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-center text-surface-700 dark:text-surface-300 tabular-nums"
                      data-stat
                    >
                      {game.assists || 0}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-center text-surface-700 dark:text-surface-300 tabular-nums"
                      data-stat
                    >
                      {game.fieldGoalPercentage?.toFixed(0) || 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-surface-500 dark:text-surface-400">
            No games played yet this season.
          </div>
        )}
      </div>

      {/* Export Season Modal */}
      <PlayerSeasonExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        playerName={player?.name || "Player"}
        playerId={playerId || ""}
        onExport={handleExportSeason}
      />

      {/* Off-screen shot chart for PDF export capture */}
      <div className="absolute left-[-9999px] top-0 pointer-events-none">
        <div ref={shotChartRef}>
          <PrintableShotChart
            shots={
              playerShotChartData?.shots?.map(
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
            title={`${player?.name || "Player"} Shot Chart`}
            subtitle={`${selectedLeague?.season || ""} Season`}
            width={400}
            height={376}
          />
        </div>
      </div>
    </div>
  );
};

export default PlayerDetail;
