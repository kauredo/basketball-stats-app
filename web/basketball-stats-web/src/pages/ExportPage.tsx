/**
 * ExportPage - Auto-export route for mobile app integration
 *
 * This page reads export parameters from URL and automatically generates
 * and downloads the requested export. It's designed to be opened from
 * the mobile app via Linking.openURL().
 *
 * URL Pattern: /app/export?type=game-report&gameId=xxx&format=pdf&theme=dark
 */

import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowLeftIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import {
  generateGameReportPDF,
  generateShotChartPDF,
  downloadPDF,
  captureCourtAsImage,
} from "../utils/export/pdf-export";
import { exportBoxScoreCSV, exportShotsCSV, exportPlayByPlayCSV } from "../utils/export/csv-export";
import type {
  GameExportData,
  ExportType,
  ExportFormat,
  ExportShotLocation,
} from "../utils/export/types";
import { PrintableShotChart } from "../components/export";

type ExportStatus = "loading" | "preparing" | "generating" | "complete" | "error";

const ExportPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, selectedLeague } = useAuth();

  const [status, setStatus] = useState<ExportStatus>("loading");
  const [message, setMessage] = useState("Loading export data...");
  const [error, setError] = useState<string | null>(null);

  // Parse URL params
  const exportType = (searchParams.get("type") as ExportType) || "game-report";
  const exportFormat = (searchParams.get("format") as ExportFormat) || "pdf";
  const gameId = searchParams.get("gameId");
  const playerId = searchParams.get("playerId");
  const teamId = searchParams.get("teamId");
  const theme = (searchParams.get("theme") as "light" | "dark") || "light";
  const includeHeatmap = searchParams.get("heatmap") === "true";

  // Court refs for PDF capture
  const homeCourtRef = useRef<HTMLDivElement>(null);
  const awayCourtRef = useRef<HTMLDivElement>(null);
  const singleCourtRef = useRef<HTMLDivElement>(null);

  // Fetch game data
  const gameData = useQuery(
    api.games.get,
    token && gameId ? { token, gameId: gameId as Id<"games"> } : "skip"
  );

  const boxScoreData = useQuery(
    api.games.getBoxScore,
    token && gameId ? { token, gameId: gameId as Id<"games"> } : "skip"
  );

  const shotsData = useQuery(
    api.shots.getGameShots,
    token && gameId ? { token, gameId: gameId as Id<"games"> } : "skip"
  );

  const gameEventsData = useQuery(
    api.games.getGameEvents,
    token && gameId ? { token, gameId: gameId as Id<"games"> } : "skip"
  );

  // Fetch player/team shot chart data
  const playerShotData = useQuery(
    api.shots.getPlayerShotChart,
    token && selectedLeague && playerId
      ? { token, leagueId: selectedLeague.id, playerId: playerId as Id<"players"> }
      : "skip"
  );

  const teamShotData = useQuery(
    api.shots.getTeamShotChart,
    token && selectedLeague && teamId
      ? { token, leagueId: selectedLeague.id, teamId: teamId as Id<"teams"> }
      : "skip"
  );

  // Transform data to export format
  const transformGameData = (): GameExportData | null => {
    if (!gameData?.game || !boxScoreData?.boxScore) return null;

    const game = gameData.game;
    const boxScore = boxScoreData.boxScore;
    const shots = shotsData?.shots || [];
    const events = gameEventsData?.events || [];

    const transformPlayer = (player: any) => ({
      id: player.player?.id || player.playerId,
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

    const calculateTotals = (players: any[]) => {
      const totals = players.reduce(
        (acc, p) => ({
          points: acc.points + (p.points || 0),
          rebounds: acc.rebounds + (p.rebounds || 0),
          assists: acc.assists + (p.assists || 0),
          steals: acc.steals + (p.steals || 0),
          blocks: acc.blocks + (p.blocks || 0),
          turnovers: acc.turnovers + (p.turnovers || 0),
          fouls: acc.fouls + (p.fouls || 0),
          fieldGoalsMade: acc.fieldGoalsMade + (p.fieldGoalsMade || 0),
          fieldGoalsAttempted: acc.fieldGoalsAttempted + (p.fieldGoalsAttempted || 0),
          threePointersMade: acc.threePointersMade + (p.threePointersMade || 0),
          threePointersAttempted: acc.threePointersAttempted + (p.threePointersAttempted || 0),
          freeThrowsMade: acc.freeThrowsMade + (p.freeThrowsMade || 0),
          freeThrowsAttempted: acc.freeThrowsAttempted + (p.freeThrowsAttempted || 0),
        }),
        {
          points: 0,
          rebounds: 0,
          assists: 0,
          steals: 0,
          blocks: 0,
          turnovers: 0,
          fouls: 0,
          fieldGoalsMade: 0,
          fieldGoalsAttempted: 0,
          threePointersMade: 0,
          threePointersAttempted: 0,
          freeThrowsMade: 0,
          freeThrowsAttempted: 0,
        }
      );

      return {
        ...totals,
        fieldGoalPercentage:
          totals.fieldGoalsAttempted > 0
            ? (totals.fieldGoalsMade / totals.fieldGoalsAttempted) * 100
            : 0,
        threePointPercentage:
          totals.threePointersAttempted > 0
            ? (totals.threePointersMade / totals.threePointersAttempted) * 100
            : 0,
        freeThrowPercentage:
          totals.freeThrowsAttempted > 0
            ? (totals.freeThrowsMade / totals.freeThrowsAttempted) * 100
            : 0,
      };
    };

    return {
      game: {
        id: game.id || gameId || "",
        homeTeamName: boxScore.homeTeam?.team?.name || "Home",
        awayTeamName: boxScore.awayTeam?.team?.name || "Away",
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        status: game.status,
        currentQuarter: game.currentQuarter,
        date: game.startedAt ? new Date(game.startedAt).toISOString() : undefined,
      },
      homeTeam: {
        id: boxScore.homeTeam?.team?.id || "",
        name: boxScore.homeTeam?.team?.name || "Home",
        city: boxScore.homeTeam?.team?.city,
        players: (boxScore.homeTeam?.players || []).map(transformPlayer),
        totals: calculateTotals(boxScore.homeTeam?.players || []),
      },
      awayTeam: {
        id: boxScore.awayTeam?.team?.id || "",
        name: boxScore.awayTeam?.team?.name || "Away",
        city: boxScore.awayTeam?.team?.city,
        players: (boxScore.awayTeam?.players || []).map(transformPlayer),
        totals: calculateTotals(boxScore.awayTeam?.players || []),
      },
      shots: shots.map((shot: any) => ({
        id: shot._id,
        playerId: shot.playerId,
        playerName: shot.player?.name || "Unknown",
        teamId: shot.teamId,
        teamName:
          (shot.teamId === boxScore.homeTeam?.team?.id
            ? boxScore.homeTeam?.team?.name
            : boxScore.awayTeam?.team?.name) || "Unknown",
        x: shot.x,
        y: shot.y,
        shotType: shot.shotType,
        made: shot.made,
        zone: shot.shotZone || "unknown",
        quarter: shot.quarter,
        timeRemaining: shot.timeRemaining,
      })),
      events: events.map((event: any) => ({
        id: event._id,
        quarter: event.quarter,
        timeRemaining: event.gameTime || event.timeRemaining || 0,
        eventType: event.eventType,
        description: event.description || event.eventType?.replace(/_/g, " "),
        playerId: event.player?.id || event.playerId,
        playerName: event.player?.name,
        teamId: event.team?.id || event.teamId,
        teamName: event.team?.name,
        homeScore: event.details?.homeScore || 0,
        awayScore: event.details?.awayScore || 0,
      })),
    };
  };

  // Get team shots for court rendering
  const getTeamShots = (teamId: string, data: GameExportData | null): ExportShotLocation[] => {
    if (!data) return [];
    return data.shots
      .filter((s) => s.teamId === teamId)
      .map((s) => ({
        x: s.x,
        y: s.y,
        made: s.made,
        is3pt: s.shotType === "3pt",
      }));
  };

  // Execute export
  useEffect(() => {
    const executeExport = async () => {
      try {
        // Wait for data to load
        if (
          (exportType === "game-report" || exportType === "box-score") &&
          (!gameData || !boxScoreData)
        ) {
          return;
        }

        if (exportType === "player-shot-chart" && !playerShotData) {
          return;
        }

        if (exportType === "team-shot-chart" && !teamShotData) {
          return;
        }

        setStatus("preparing");
        setMessage("Preparing export data...");

        // Small delay to ensure UI updates
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (exportType === "game-report" || exportType === "box-score") {
          const exportData = transformGameData();
          if (!exportData) {
            throw new Error("Failed to transform game data");
          }

          if (exportFormat === "csv") {
            setStatus("generating");
            setMessage("Generating CSV files...");
            exportBoxScoreCSV(exportData);
          } else {
            // PDF export
            let homeCourtImage: string | null = null;
            let awayCourtImage: string | null = null;

            // Wait for court elements to render
            await new Promise((resolve) => setTimeout(resolve, 500));

            if (homeCourtRef.current) {
              setMessage("Capturing home team shot chart...");
              homeCourtImage = await captureCourtAsImage(homeCourtRef.current, {
                scale: 2,
                backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
              });
            }

            if (awayCourtRef.current) {
              setMessage("Capturing away team shot chart...");
              awayCourtImage = await captureCourtAsImage(awayCourtRef.current, {
                scale: 2,
                backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
              });
            }

            setStatus("generating");
            setMessage("Generating PDF...");

            const blob = await generateGameReportPDF(exportData, {
              settings: { theme },
              homeCourtImage,
              awayCourtImage,
            });

            const filename =
              `game-report-${exportData.homeTeam.name}-vs-${exportData.awayTeam.name}`.replace(
                /\s+/g,
                "-"
              );
            downloadPDF(blob, filename);
          }
        } else if (exportType === "shot-data") {
          const exportData = transformGameData();
          if (!exportData) {
            throw new Error("Failed to transform game data");
          }

          setStatus("generating");
          setMessage("Generating shot data CSV...");
          exportShotsCSV(exportData.shots);
        } else if (exportType === "play-by-play") {
          const exportData = transformGameData();
          if (!exportData) {
            throw new Error("Failed to transform game data");
          }

          setStatus("generating");
          setMessage("Generating play-by-play CSV...");
          exportPlayByPlayCSV(exportData.events);
        } else if (exportType === "player-shot-chart" && playerShotData) {
          // Wait for court element to render
          await new Promise((resolve) => setTimeout(resolve, 500));

          if (!singleCourtRef.current) {
            throw new Error("Court element not found");
          }

          setMessage("Capturing shot chart...");
          const courtImage = await captureCourtAsImage(singleCourtRef.current, {
            scale: 2,
            backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
          });

          setStatus("generating");
          setMessage("Generating PDF...");

          const stats = playerShotData.stats;
          const blob = await generateShotChartPDF(courtImage, {
            title: `${playerShotData.player?.name || "Player"} Shot Chart`,
            subtitle: playerShotData.player?.team || undefined,
            stats: stats
              ? {
                  totalShots: stats.totalShots,
                  madeShots: stats.madeShots,
                  percentage: `${stats.overallPercentage}%`,
                  twoPoint: {
                    made: stats.twoPoint.made,
                    attempted: stats.twoPoint.attempted,
                    percentage: `${stats.twoPoint.percentage}%`,
                  },
                  threePoint: {
                    made: stats.threePoint.made,
                    attempted: stats.threePoint.attempted,
                    percentage: `${stats.threePoint.percentage}%`,
                  },
                }
              : undefined,
            settings: { theme },
          });

          const filename = `shot-chart-${playerShotData.player?.name || "player"}`.replace(
            /\s+/g,
            "-"
          );
          downloadPDF(blob, filename);
        } else if (exportType === "team-shot-chart" && teamShotData) {
          // Wait for court element to render
          await new Promise((resolve) => setTimeout(resolve, 500));

          if (!singleCourtRef.current) {
            throw new Error("Court element not found");
          }

          setMessage("Capturing shot chart...");
          const courtImage = await captureCourtAsImage(singleCourtRef.current, {
            scale: 2,
            backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
          });

          setStatus("generating");
          setMessage("Generating PDF...");

          const totalShots = teamShotData.totalShots || 0;
          const madeShots = teamShotData.madeShots || 0;
          const percentage = totalShots > 0 ? ((madeShots / totalShots) * 100).toFixed(1) : "0.0";

          const blob = await generateShotChartPDF(courtImage, {
            title: `${teamShotData.team?.name || "Team"} Shot Chart`,
            stats: {
              totalShots,
              madeShots,
              percentage: `${percentage}%`,
            },
            settings: { theme },
          });

          const filename = `shot-chart-${teamShotData.team?.name || "team"}`.replace(/\s+/g, "-");
          downloadPDF(blob, filename);
        }

        setStatus("complete");
        setMessage("Export complete!");
      } catch (err) {
        console.error("Export error:", err);
        setStatus("error");
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        setMessage("Export failed");
      }
    };

    executeExport();
  }, [
    gameData,
    boxScoreData,
    shotsData,
    gameEventsData,
    playerShotData,
    teamShotData,
    exportType,
    exportFormat,
    theme,
  ]);

  // Render courts for capture (hidden)
  const renderHiddenCourts = () => {
    if (exportFormat !== "pdf") return null;

    const exportData = transformGameData();

    if ((exportType === "game-report" || exportType === "box-score") && exportData) {
      return (
        <div className="absolute left-[-9999px] top-0 pointer-events-none">
          <div ref={homeCourtRef}>
            <PrintableShotChart
              shots={getTeamShots(exportData.homeTeam.id, exportData)}
              theme={theme}
              showHeatMap={includeHeatmap}
              title={exportData.homeTeam.name}
              width={300}
            />
          </div>
          <div ref={awayCourtRef}>
            <PrintableShotChart
              shots={getTeamShots(exportData.awayTeam.id, exportData)}
              theme={theme}
              showHeatMap={includeHeatmap}
              title={exportData.awayTeam.name}
              width={300}
            />
          </div>
        </div>
      );
    }

    if (exportType === "player-shot-chart" && playerShotData) {
      const shots: ExportShotLocation[] = (playerShotData.shots || []).map((s: any) => ({
        x: s.x,
        y: s.y,
        made: s.made,
        is3pt: s.shotType === "3pt",
      }));

      return (
        <div className="absolute left-[-9999px] top-0 pointer-events-none">
          <div ref={singleCourtRef}>
            <PrintableShotChart
              shots={shots}
              theme={theme}
              showHeatMap={includeHeatmap}
              title={playerShotData.player?.name || "Player"}
              width={300}
            />
          </div>
        </div>
      );
    }

    if (exportType === "team-shot-chart" && teamShotData) {
      const shots: ExportShotLocation[] = (teamShotData.shots || []).map((s: any) => ({
        x: s.x,
        y: s.y,
        made: s.made,
        is3pt: s.shotType === "3pt",
      }));

      return (
        <div className="absolute left-[-9999px] top-0 pointer-events-none">
          <div ref={singleCourtRef}>
            <PrintableShotChart
              shots={shots}
              theme={theme}
              showHeatMap={includeHeatmap}
              title={teamShotData.team?.name || "Team"}
              width={300}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full surface-card p-8 text-center">
        {/* Status Icon */}
        <div className="mb-6">
          {status === "loading" || status === "preparing" || status === "generating" ? (
            <div className="w-16 h-16 mx-auto rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-primary-500 border-t-transparent"></div>
            </div>
          ) : status === "complete" ? (
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircleIcon className="w-10 h-10 text-green-500" />
            </div>
          ) : (
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <ExclamationCircleIcon className="w-10 h-10 text-red-500" />
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
          {status === "complete"
            ? "Export Complete"
            : status === "error"
              ? "Export Failed"
              : "Generating Export"}
        </h1>

        {/* Message */}
        <p className="text-surface-600 dark:text-surface-400 mb-6">{error || message}</p>

        {/* Progress Bar */}
        {(status === "loading" || status === "preparing" || status === "generating") && (
          <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-primary-500 transition-all duration-500"
              style={{
                width: status === "loading" ? "20%" : status === "preparing" ? "50%" : "80%",
              }}
            ></div>
          </div>
        )}

        {/* Export Details */}
        <div className="bg-surface-100 dark:bg-surface-800 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center gap-3 text-sm">
            <DocumentArrowDownIcon className="w-5 h-5 text-primary-500" />
            <span className="text-surface-600 dark:text-surface-400">
              {exportFormat.toUpperCase()} •{" "}
              {exportType.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {status === "complete" && (
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
              Your download should start automatically. If not, check your browser's download
              settings.
            </p>
          )}

          <button
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300 font-medium hover:bg-surface-300 dark:hover:bg-surface-600 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Return to App
          </button>
        </div>
      </div>

      {/* Hidden courts for PDF capture */}
      {renderHiddenCourts()}
    </div>
  );
};

export default ExportPage;
