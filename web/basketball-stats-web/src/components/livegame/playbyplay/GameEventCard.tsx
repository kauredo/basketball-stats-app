import React from "react";
import { PlayByPlayEvent } from "../../../types/livegame";
import { Id } from "../../../../../../convex/_generated/dataModel";
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowUpIcon,
  ArrowRightIcon,
  BoltIcon,
  ShieldCheckIcon,
  ArrowUturnLeftIcon,
  ExclamationTriangleIcon,
  ArrowsRightLeftIcon,
  PauseIcon,
  MegaphoneIcon,
  MinusCircleIcon,
} from "@heroicons/react/24/solid";

interface PlayerStat {
  playerId: Id<"players">;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
}

interface GameEventCardProps {
  event: PlayByPlayEvent;
  playerStats?: PlayerStat[];
  homeTeamId?: Id<"teams">; // Used to determine team color when isHomeTeam not in event details
}

// Event styling configuration with Heroicons
const EVENT_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
  }
> = {
  shot_made: {
    icon: CheckCircleIcon,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-500/20",
  },
  shot_missed: {
    icon: XCircleIcon,
    color: "text-surface-400 dark:text-surface-500",
    bgColor: "bg-surface-100 dark:bg-surface-700/50",
  },
  shot: {
    icon: CheckCircleIcon,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-500/20",
  },
  free_throw_made: {
    icon: CheckCircleIcon,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-500/20",
  },
  free_throw_missed: {
    icon: MinusCircleIcon,
    color: "text-surface-400 dark:text-surface-500",
    bgColor: "bg-surface-100 dark:bg-surface-700/50",
  },
  freethrow: {
    icon: CheckCircleIcon,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-500/20",
  },
  rebound: {
    icon: ArrowUpIcon,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-500/20",
  },
  assist: {
    icon: ArrowRightIcon,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-500/20",
  },
  steal: {
    icon: BoltIcon,
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-100 dark:bg-cyan-500/20",
  },
  block: {
    icon: ShieldCheckIcon,
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-100 dark:bg-cyan-500/20",
  },
  turnover: {
    icon: ArrowUturnLeftIcon,
    color: "text-red-500 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-500/20",
  },
  foul: {
    icon: ExclamationTriangleIcon,
    color: "text-red-500 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-500/20",
  },
  substitution: {
    icon: ArrowsRightLeftIcon,
    color: "text-surface-500 dark:text-surface-400",
    bgColor: "bg-surface-100 dark:bg-surface-700/50",
  },
  timeout: {
    icon: PauseIcon,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-500/20",
  },
  quarter_start: {
    icon: MegaphoneIcon,
    color: "text-surface-600 dark:text-surface-300",
    bgColor: "bg-surface-200 dark:bg-surface-600",
  },
  quarter_end: {
    icon: MegaphoneIcon,
    color: "text-surface-600 dark:text-surface-300",
    bgColor: "bg-surface-200 dark:bg-surface-600",
  },
  overtime_start: {
    icon: MegaphoneIcon,
    color: "text-primary-600 dark:text-primary-400",
    bgColor: "bg-primary-100 dark:bg-primary-500/20",
  },
  note: {
    icon: MegaphoneIcon,
    color: "text-surface-500 dark:text-surface-400",
    bgColor: "bg-surface-100 dark:bg-surface-700/50",
  },
};

const DEFAULT_CONFIG = {
  icon: MegaphoneIcon,
  color: "text-surface-500 dark:text-surface-400",
  bgColor: "bg-surface-100 dark:bg-surface-700/50",
};

/**
 * Individual play-by-play event card with Heroicons.
 * Clean, professional design matching mobile.
 * Shows cumulative player stats for relevant events.
 * Colored left border indicates team (orange=home, blue=away).
 */
export const GameEventCard: React.FC<GameEventCardProps> = ({ event, playerStats = [], homeTeamId }) => {
  // Format time remaining as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Format quarter display
  const formatQuarter = (quarter: number): string => {
    if (quarter <= 4) return `Q${quarter}`;
    return `OT${quarter - 4}`;
  };

  // Get cumulative stat line for player based on event type
  const getPlayerStatLine = (): string | null => {
    if (!event.playerId) return null;

    const stat = playerStats.find((s) => s.playerId === event.playerId);
    if (!stat) return null;

    // Map event types to stat display
    const eventType = event.eventType;
    if (
      eventType === "shot_made" ||
      eventType === "shot_missed" ||
      eventType === "shot" ||
      eventType === "free_throw_made" ||
      eventType === "free_throw_missed" ||
      eventType === "freethrow"
    ) {
      return `${stat.points} points`;
    }
    if (eventType === "foul") return `${stat.fouls} fouls`;
    if (eventType === "rebound") return `${stat.rebounds} rebounds`;
    if (eventType === "assist") return `${stat.assists} assists`;
    if (eventType === "steal") return `${stat.steals} steals`;
    if (eventType === "block") return `${stat.blocks} blocks`;
    if (eventType === "turnover") return `${stat.turnovers} turnovers`;

    return null;
  };

  // Get score display for scoring events
  const getScoreDisplay = (): { home: number; away: number } | null => {
    const details = event.details as
      | { homeScore?: number; awayScore?: number; points?: number }
      | undefined;
    if (!details || details.homeScore === undefined || details.awayScore === undefined) {
      return null;
    }
    // Only show score for scoring events
    if (details.points === undefined || details.points <= 0) {
      return null;
    }
    return { home: details.homeScore, away: details.awayScore };
  };

  const config = EVENT_CONFIG[event.eventType] || DEFAULT_CONFIG;
  const IconComponent = config.icon;
  const statLine = getPlayerStatLine();
  const scoreDisplay = getScoreDisplay();

  // Get isHomeTeam from event details, or fallback to comparing teamId with homeTeamId
  const details = event.details as { isHomeTeam?: boolean } | undefined;
  let isHomeTeam: boolean | undefined = details?.isHomeTeam;

  // Fallback: if isHomeTeam not in details but we have teamId and homeTeamId, compute it
  if (isHomeTeam === undefined && event.teamId && homeTeamId) {
    isHomeTeam = event.teamId === homeTeamId;
  }

  // Team colors: blue for home, orange for away, neutral gray for game events
  // If isHomeTeam is still undefined (game-level events like quarter_start, overtime_start, note)
  // use a neutral color
  const teamBorderColor = isHomeTeam === true
    ? "#3b82f6" // Home = Blue
    : isHomeTeam === false
      ? "#f97316" // Away = Orange
      : "#6b7280"; // Neutral gray for game-level events

  return (
    <div className="flex items-stretch border-b border-surface-200 dark:border-surface-700 last:border-b-0">
      {/* Colored left border for team indicator */}
      <div className="w-1 flex-shrink-0" style={{ backgroundColor: teamBorderColor }} />

      {/* Time Column */}
      <div className="w-12 flex-shrink-0 text-center py-2.5 pl-2">
        <span className="text-[10px] text-surface-500 dark:text-surface-500 font-medium block">
          {formatQuarter(event.quarter)}
        </span>
        <span className="text-xs text-surface-700 dark:text-surface-300 font-semibold font-mono">
          {formatTime(event.timeRemaining)}
        </span>
      </div>

      {/* Icon */}
      <div className="flex items-start py-2.5 mx-2">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${config.bgColor}`}
        >
          <IconComponent className={`w-3.5 h-3.5 ${config.color}`} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-2.5 pr-3">
        <p className="text-sm text-surface-900 dark:text-white leading-snug">{event.description}</p>
        {/* Show cumulative stat total and score */}
        {(statLine || scoreDisplay) && (
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {statLine && (
              <span className="text-xs text-surface-500 dark:text-surface-400 font-medium">
                {statLine}
              </span>
            )}
            {scoreDisplay && (
              <span className="text-xs text-surface-500 dark:text-surface-400">
                (
                <span
                  className={isHomeTeam ? "font-bold text-surface-700 dark:text-surface-200" : ""}
                >
                  {scoreDisplay.home}
                </span>
                {" - "}
                <span
                  className={!isHomeTeam ? "font-bold text-surface-700 dark:text-surface-200" : ""}
                >
                  {scoreDisplay.away}
                </span>
                )
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameEventCard;
