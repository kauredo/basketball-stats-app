import React, { useState, useMemo, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import type { Id } from "../../../../convex/_generated/dataModel";
import type { GameSettings, ExportShot } from "@basketball-stats/shared";
import {
  ArrowLeftIcon,
  PlayIcon,
  PauseIcon,
  BackwardIcon,
  ForwardIcon,
} from "@heroicons/react/24/solid";
import { InteractiveCourt } from "../components/livegame/court/InteractiveCourt";
import { GameEventCard } from "../components/livegame/playbyplay/GameEventCard";
import Breadcrumb from "../components/Breadcrumb";
import type { ShotLocation } from "../types/livegame";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

// Event type from API
interface GameEvent {
  id: string;
  _id?: string;
  eventType: string;
  quarter: number;
  gameTime: number;
  gameTimeDisplay?: string;
  timestamp?: number;
  description: string;
  details?: {
    points?: number;
    shotType?: string;
    made?: boolean;
    x?: number;
    y?: number;
    homeScore?: number;
    awayScore?: number;
    isHomeTeam?: boolean;
  };
  player?: {
    id: string;
    name: string;
    number: number;
  } | null;
  team?: {
    id: string;
    name: string;
  } | null;
}

const GameReplay: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [selectedTime, setSelectedTime] = useState(0);
  const [selectedQuarter, setSelectedQuarter] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eventsContainerRef = useRef<HTMLDivElement>(null);

  // Fetch game data
  const gameData = useQuery(
    api.games.get,
    token && gameId ? { token, gameId: gameId as Id<"games"> } : "skip"
  );

  // Fetch game events
  const gameEventsData = useQuery(
    api.games.getGameEvents,
    token && gameId ? { token, gameId: gameId as Id<"games"> } : "skip"
  );

  // Fetch shots data
  const shotsData = useQuery(
    api.shots.getGameShots,
    token && gameId ? { token, gameId: gameId as Id<"games"> } : "skip"
  );

  const game = gameData?.game;
  const events = (gameEventsData?.events || []) as GameEvent[];
  const shots = shotsData?.shots || [];

  // Sort events by time (earliest first for replay)
  const sortedEvents = useMemo((): GameEvent[] => {
    return [...events].sort((a, b) => {
      // First by quarter
      if (a.quarter !== b.quarter) return a.quarter - b.quarter;
      // Then by game time (higher time = earlier in quarter)
      return b.gameTime - a.gameTime;
    });
  }, [events]);

  // Calculate total game duration for slider
  const totalDuration = useMemo(() => {
    if (!game) return 0;
    const quarterMinutes = ((game.gameSettings ?? {}) as GameSettings).quarterMinutes || 12;
    const totalQuarters = game.currentQuarter || 4;
    return totalQuarters * quarterMinutes * 60;
  }, [game]);

  // Get events up to selected time
  const eventsUpToTime = useMemo((): GameEvent[] => {
    if (!game) return [];
    const quarterMinutes = ((game.gameSettings ?? {}) as GameSettings).quarterMinutes || 12;

    return sortedEvents.filter((event) => {
      const eventTotalSeconds =
        (event.quarter - 1) * quarterMinutes * 60 + (quarterMinutes * 60 - event.gameTime);
      return eventTotalSeconds <= selectedTime;
    });
  }, [sortedEvents, selectedTime, game]);

  // Calculate scores at selected time
  const scoresAtTime = useMemo(() => {
    let homeScore = 0;
    let awayScore = 0;

    eventsUpToTime.forEach((event) => {
      const points = event.details?.points;
      if (points) {
        if (event.team?.id === game?.homeTeam?.id) {
          homeScore += points;
        } else {
          awayScore += points;
        }
      }
    });

    return { homeScore, awayScore };
  }, [eventsUpToTime, game]);

  // Get shots for court visualization (filtered by time)
  const shotsUpToTime = useMemo(() => {
    if (!game) return [];
    const quarterMinutes = ((game.gameSettings ?? {}) as GameSettings).quarterMinutes || 12;

    return shots.filter((shot: ExportShot) => {
      const shotTotalSeconds =
        (shot.quarter - 1) * quarterMinutes * 60 +
        (quarterMinutes * 60 - (shot.timeRemaining || 0));
      return shotTotalSeconds <= selectedTime;
    });
  }, [shots, selectedTime, game]);

  // Convert shots to ShotLocation format for InteractiveCourt
  const courtShots = useMemo((): ShotLocation[] => {
    return shotsUpToTime.map((shot: ExportShot) => ({
      id: shot._id || shot.id,
      x: shot.x,
      y: shot.y,
      made: shot.made,
      playerId: shot.playerId as Id<"players"> | undefined,
      teamId: shot.teamId as Id<"teams"> | undefined,
      is3pt: shot.shotType === "3pt",
      isHomeTeam: shot.teamId === game?.homeTeam?.id,
    }));
  }, [shotsUpToTime, game?.homeTeam?.id]);

  // Format time display
  const formatSliderTime = (seconds: number) => {
    if (!game) return "0:00";
    const quarterMinutes = ((game.gameSettings ?? {}) as GameSettings).quarterMinutes || 12;
    const quarterSeconds = quarterMinutes * 60;

    const quarter = Math.floor(seconds / quarterSeconds) + 1;
    const timeInQuarter = quarterSeconds - (seconds % quarterSeconds);

    const mins = Math.floor(timeInQuarter / 60);
    const secs = timeInQuarter % 60;

    return `Q${quarter} ${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle play/pause
  const togglePlay = () => {
    if (isPlaying) {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      playIntervalRef.current = setInterval(() => {
        setSelectedTime((prev) => {
          if (prev >= totalDuration) {
            if (playIntervalRef.current) {
              clearInterval(playIntervalRef.current);
              playIntervalRef.current = null;
            }
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 100); // 10x speed
    }
  };

  // Jump to event
  const jumpToEvent = (event: GameEvent) => {
    if (!game) return;
    const quarterMinutes = ((game.gameSettings ?? {}) as GameSettings).quarterMinutes || 12;
    const eventTotalSeconds =
      (event.quarter - 1) * quarterMinutes * 60 + (quarterMinutes * 60 - event.gameTime);
    setSelectedTime(eventTotalSeconds);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, []);

  // Loading state
  if (gameData === undefined || gameEventsData === undefined) {
    return <LoadingSpinner label="Loading game replay" />;
  }

  if (!game) {
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

  const homeTeam = game.homeTeam;
  const awayTeam = game.awayTeam;

  // Filter events for display (by quarter if selected)
  const displayEvents = sortedEvents.filter(
    (e) => selectedQuarter === null || e.quarter === selectedQuarter
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Games", href: "/games" },
          {
            label: `${homeTeam?.name || "Home"} vs ${awayTeam?.name || "Away"}`,
            href: `/games/${gameId}/analysis`,
          },
          { label: "Replay" },
        ]}
      />

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/app/games/${gameId}/analysis`)}
          className="p-2 rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-surface-600 dark:text-surface-400" />
        </button>
        <div>
          <h1 className="text-display-sm text-surface-900 dark:text-white">Game Replay</h1>
          <p className="text-surface-600 dark:text-surface-400">
            {homeTeam?.name} vs {awayTeam?.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Score & Shot Chart */}
        <div className="space-y-6">
          {/* Score Display */}
          <div className="surface-card p-6">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <p className="text-surface-500 dark:text-surface-400 text-sm mb-1">
                  {homeTeam?.name || "Home"}
                </p>
                <p className="text-stat-xl text-primary-500" data-stat>
                  {scoresAtTime.homeScore}
                </p>
              </div>
              <div className="text-center px-4">
                <p className="text-surface-400 dark:text-surface-500 text-lg">vs</p>
                <p className="text-primary-500 font-bold mt-1">{formatSliderTime(selectedTime)}</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-surface-500 dark:text-surface-400 text-sm mb-1">
                  {awayTeam?.name || "Away"}
                </p>
                <p className="text-stat-xl text-blue-500" data-stat>
                  {scoresAtTime.awayScore}
                </p>
              </div>
            </div>
          </div>

          {/* Shot Chart */}
          <div className="surface-card p-6">
            <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4">
              Shot Chart at {formatSliderTime(selectedTime)}
            </h3>
            <div className="h-[350px]">
              <InteractiveCourt allShots={courtShots} displayMode="all" compact />
            </div>
          </div>
        </div>

        {/* Right Column: Controls & Events */}
        <div className="space-y-6">
          {/* Timeline Controls */}
          <div className="surface-card p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-surface-500 dark:text-surface-400">Start</span>
              <span className="text-sm font-medium text-primary-500">
                {formatSliderTime(selectedTime)}
              </span>
              <span className="text-sm text-surface-500 dark:text-surface-400">End</span>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={0}
              max={totalDuration}
              value={selectedTime}
              onChange={(e) => setSelectedTime(Number(e.target.value))}
              className="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setSelectedTime(Math.max(0, selectedTime - 60))}
                className="p-3 rounded-full bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                title="Back 1 minute"
              >
                <BackwardIcon className="w-5 h-5 text-surface-600 dark:text-surface-400" />
              </button>
              <button
                onClick={togglePlay}
                className="p-4 rounded-full bg-primary-500 hover:bg-primary-600 transition-colors"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <PauseIcon className="w-6 h-6 text-white" />
                ) : (
                  <PlayIcon className="w-6 h-6 text-white" />
                )}
              </button>
              <button
                onClick={() => setSelectedTime(Math.min(totalDuration, selectedTime + 60))}
                className="p-3 rounded-full bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                title="Forward 1 minute"
              >
                <ForwardIcon className="w-5 h-5 text-surface-600 dark:text-surface-400" />
              </button>
            </div>

            {/* Speed indicator */}
            <p className="text-center text-xs text-surface-500 dark:text-surface-400 mt-3">
              Playback: 10x speed
            </p>
          </div>

          {/* Quarter Filter */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedQuarter(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedQuarter === null
                  ? "bg-primary-500 text-white"
                  : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700"
              }`}
            >
              All
            </button>
            {[1, 2, 3, 4].map((q) => (
              <button
                key={q}
                onClick={() => setSelectedQuarter(q)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedQuarter === q
                    ? "bg-primary-500 text-white"
                    : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700"
                }`}
              >
                Q{q}
              </button>
            ))}
          </div>

          {/* Events List */}
          <div className="surface-card overflow-hidden">
            <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700">
              <h3 className="font-semibold text-surface-900 dark:text-white">
                Play-by-Play ({displayEvents.length} events)
              </h3>
            </div>
            <div ref={eventsContainerRef} className="max-h-[400px] overflow-y-auto">
              {displayEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                  <div className="w-12 h-12 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center mb-3">
                    <PlayIcon className="w-6 h-6 text-surface-400" />
                  </div>
                  <p className="text-surface-900 dark:text-white text-sm font-semibold mb-1">
                    No events recorded
                  </p>
                  <p className="text-surface-500 dark:text-surface-400 text-xs text-center">
                    Play-by-play data will appear here
                  </p>
                </div>
              ) : (
                displayEvents.map((event) => {
                  const isActive = eventsUpToTime.some((e) => e.id === event.id);
                  return (
                    <div
                      key={event.id || event._id}
                      onClick={() => jumpToEvent(event)}
                      className={`cursor-pointer transition-colors ${
                        isActive
                          ? "bg-primary-50 dark:bg-primary-900/20"
                          : "hover:bg-surface-50 dark:hover:bg-surface-800/50"
                      }`}
                    >
                      <GameEventCard
                        event={{
                          id: (event.id || event._id || "") as string,
                          quarter: event.quarter,
                          gameTime: event.gameTime,
                          eventType: event.eventType,
                          description:
                            event.description || event.eventType?.replace(/_/g, " ") || "",
                          playerId: event.player?.id as Id<"players"> | undefined,
                          teamId: event.team?.id as Id<"teams"> | undefined,
                          details: {
                            made: event.details?.made,
                            points: event.details?.points,
                            shotType: event.details?.shotType,
                            homeScore: event.details?.homeScore,
                            awayScore: event.details?.awayScore,
                            isHomeTeam: event.details?.isHomeTeam,
                          },
                        }}
                        homeTeamId={homeTeam?.id as Id<"teams"> | undefined}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameReplay;
