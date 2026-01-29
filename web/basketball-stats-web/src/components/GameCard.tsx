import React from "react";
import { Link } from "react-router-dom";
import PlayerAvatar from "./PlayerAvatar";

interface Team {
  id: string;
  name: string;
  logo?: string;
}

interface GameCardProps {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  status: "scheduled" | "active" | "paused" | "completed";
  currentQuarter?: number;
  timeRemaining?: string;
  scheduledTime?: Date;
  onClick?: () => void;
  showLink?: boolean;
  className?: string;
}

const statusConfig = {
  scheduled: {
    label: "Scheduled",
    classes: "bg-status-scheduled/10 text-status-scheduled",
    animate: false,
  },
  active: {
    label: "Live",
    classes: "bg-status-active/15 text-status-active",
    animate: true,
  },
  paused: {
    label: "Paused",
    classes: "bg-status-paused/10 text-status-paused",
    animate: false,
  },
  completed: {
    label: "Final",
    classes: "bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300",
    animate: false,
  },
};

const GameCard: React.FC<GameCardProps> = ({
  id,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  status,
  currentQuarter,
  timeRemaining,
  scheduledTime,
  onClick,
  showLink = true,
  className = "",
}) => {
  const statusInfo = statusConfig[status];
  const isLive = status === "active";
  const isCompleted = status === "completed";
  const homeWon = isCompleted && homeScore > awayScore;
  const awayWon = isCompleted && awayScore > homeScore;

  const formatScheduledTime = (date: Date): string => {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isInteractive = onClick || showLink;

  const content = (
    <div
      className={`
        group relative rounded-2xl p-5
        bg-white dark:bg-surface-800
        border border-surface-200 dark:border-surface-700
        transition-all duration-200
        ${isLive ? "ring-2 ring-status-active/20 shadow-glow-red" : ""}
        ${isInteractive ? "hover:border-surface-300 dark:hover:border-surface-600 hover:shadow-elevated cursor-pointer" : ""}
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-50 dark:focus:ring-offset-surface-950
        ${className}
      `}
      onClick={onClick}
      onKeyDown={isInteractive ? (e) => e.key === "Enter" && onClick?.() : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive && onClick ? 0 : undefined}
      aria-label={isInteractive ? `View game: ${awayTeam.name} vs ${homeTeam.name}` : undefined}
    >
      {/* Status Badge - Top left */}
      <div className="flex items-center justify-between mb-4">
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusInfo.classes}`}
        >
          {statusInfo.animate && (
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-live" />
          )}
          {statusInfo.label}
        </div>

        {/* Quarter/Time for live games */}
        {(isLive || status === "paused") && (
          <div className="text-right">
            <div className="text-xs font-medium text-surface-500 dark:text-surface-400">
              Q{currentQuarter}
            </div>
            <div
              className="font-mono text-sm font-semibold text-surface-900 dark:text-surface-50"
              data-stat
            >
              {timeRemaining}
            </div>
          </div>
        )}
      </div>

      {/* Teams and Scores */}
      <div className="flex items-center justify-between gap-4">
        {/* Away Team */}
        <div className="flex-1 flex items-center gap-3">
          {awayTeam.logo ? (
            <img
              src={awayTeam.logo}
              alt={`${awayTeam.name} logo`}
              width={40}
              height={40}
              loading="lazy"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-surface-100 dark:ring-surface-700"
            />
          ) : (
            <PlayerAvatar name={awayTeam.name} size="md" showNumber={false} />
          )}
          <div className="min-w-0">
            <div
              className={`font-semibold truncate ${
                awayWon
                  ? "text-surface-900 dark:text-surface-50"
                  : isCompleted
                    ? "text-surface-500 dark:text-surface-400"
                    : "text-surface-900 dark:text-surface-50"
              }`}
            >
              {awayTeam.name}
            </div>
            {status === "scheduled" && scheduledTime && (
              <div className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                {formatScheduledTime(scheduledTime)}
              </div>
            )}
          </div>
        </div>

        {/* Scores */}
        <div className="flex items-center gap-3 px-2">
          <span
            className={`text-2xl font-bold tabular-nums ${
              awayWon
                ? "text-surface-900 dark:text-surface-50"
                : isCompleted
                  ? "text-surface-400 dark:text-surface-500"
                  : "text-surface-900 dark:text-surface-50"
            }`}
            data-stat
          >
            {awayScore}
          </span>
          <span className="text-surface-300 dark:text-surface-600 text-lg">–</span>
          <span
            className={`text-2xl font-bold tabular-nums ${
              homeWon
                ? "text-surface-900 dark:text-surface-50"
                : isCompleted
                  ? "text-surface-400 dark:text-surface-500"
                  : "text-surface-900 dark:text-surface-50"
            }`}
            data-stat
          >
            {homeScore}
          </span>
        </div>

        {/* Home Team */}
        <div className="flex-1 flex items-center gap-3 justify-end">
          <div className="min-w-0 text-right">
            <div
              className={`font-semibold truncate ${
                homeWon
                  ? "text-surface-900 dark:text-surface-50"
                  : isCompleted
                    ? "text-surface-500 dark:text-surface-400"
                    : "text-surface-900 dark:text-surface-50"
              }`}
            >
              {homeTeam.name}
            </div>
          </div>
          {homeTeam.logo ? (
            <img
              src={homeTeam.logo}
              alt={`${homeTeam.name} logo`}
              width={40}
              height={40}
              loading="lazy"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-surface-100 dark:ring-surface-700"
            />
          ) : (
            <PlayerAvatar name={homeTeam.name} size="md" showNumber={false} />
          )}
        </div>
      </div>
    </div>
  );

  if (showLink && !onClick) {
    return <Link to={`/app/games/${id}/live`}>{content}</Link>;
  }

  return content;
};

// Compact version for lists
export const GameCardCompact: React.FC<GameCardProps> = ({
  id,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  status,
  currentQuarter,
  timeRemaining,
  onClick,
  showLink = true,
  className = "",
}) => {
  const statusInfo = statusConfig[status];
  const isLive = status === "active";
  const isCompleted = status === "completed";
  const homeWon = isCompleted && homeScore > awayScore;
  const awayWon = isCompleted && awayScore > homeScore;
  const isInteractive = onClick || showLink;

  const content = (
    <div
      className={`
        group flex items-center gap-4 p-3 rounded-xl
        bg-surface-100 dark:bg-surface-800/50
        transition-colors
        ${isInteractive ? "hover:bg-surface-200 dark:hover:bg-surface-800 cursor-pointer" : ""}
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${className}
      `}
      onClick={onClick}
      onKeyDown={isInteractive ? (e) => e.key === "Enter" && onClick?.() : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive && onClick ? 0 : undefined}
      aria-label={isInteractive ? `View game: ${awayTeam.name} vs ${homeTeam.name}` : undefined}
    >
      {/* Status */}
      <div
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold shrink-0 ${statusInfo.classes}`}
      >
        {statusInfo.animate && (
          <span className="w-1 h-1 rounded-full bg-current animate-pulse-live" />
        )}
        {statusInfo.label}
      </div>

      {/* Teams and Score */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span
            className={`text-sm truncate ${
              awayWon
                ? "font-semibold text-surface-900 dark:text-surface-50"
                : "text-surface-700 dark:text-surface-300"
            }`}
          >
            {awayTeam.name}
          </span>
          <span
            className={`font-mono text-sm font-semibold tabular-nums ${
              awayWon
                ? "text-surface-900 dark:text-surface-50"
                : "text-surface-600 dark:text-surface-400"
            }`}
            data-stat
          >
            {awayScore}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span
            className={`text-sm truncate ${
              homeWon
                ? "font-semibold text-surface-900 dark:text-surface-50"
                : "text-surface-700 dark:text-surface-300"
            }`}
          >
            {homeTeam.name}
          </span>
          <span
            className={`font-mono text-sm font-semibold tabular-nums ${
              homeWon
                ? "text-surface-900 dark:text-surface-50"
                : "text-surface-600 dark:text-surface-400"
            }`}
            data-stat
          >
            {homeScore}
          </span>
        </div>
      </div>

      {/* Quarter/Time */}
      {isLive && (
        <div className="text-right shrink-0">
          <div className="text-xs text-surface-500 dark:text-surface-400">Q{currentQuarter}</div>
          <div
            className="font-mono text-xs font-medium text-surface-700 dark:text-surface-300"
            data-stat
          >
            {timeRemaining}
          </div>
        </div>
      )}
    </div>
  );

  if (showLink && !onClick) {
    return <Link to={`/app/games/${id}/live`}>{content}</Link>;
  }

  return content;
};

export default GameCard;
