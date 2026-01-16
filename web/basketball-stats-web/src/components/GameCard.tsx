import React from "react";
import { Link } from "react-router-dom";
import { COLORS } from "@basketball-stats/shared";
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
    label: "SCHEDULED",
    bgColor: COLORS.status.scheduled,
    textColor: "#FFFFFF",
    animate: false,
  },
  active: {
    label: "LIVE",
    bgColor: COLORS.status.active,
    textColor: "#FFFFFF",
    animate: true,
  },
  paused: {
    label: "PAUSED",
    bgColor: COLORS.status.paused,
    textColor: "#FFFFFF",
    animate: false,
  },
  completed: {
    label: "FINAL",
    bgColor: COLORS.status.completed,
    textColor: "#FFFFFF",
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

  const formatScheduledTime = (date: Date): string => {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const content = (
    <div
      className={`
        bg-gray-800 rounded-xl p-4 border border-gray-700
        transition-all duration-200
        ${onClick || showLink ? "hover:border-gray-600 hover:shadow-lg hover:shadow-black/20 cursor-pointer" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        {/* Away Team */}
        <div className="flex-1 flex flex-col items-center">
          {awayTeam.logo ? (
            <img
              src={awayTeam.logo}
              alt={awayTeam.name}
              className="w-12 h-12 mb-2 rounded-full object-cover"
            />
          ) : (
            <PlayerAvatar
              name={awayTeam.name}
              size="lg"
              showNumber={false}
              className="mb-2"
            />
          )}
          <span className="text-white font-medium text-sm text-center">
            {awayTeam.name}
          </span>
        </div>

        {/* Score Section */}
        <div className="flex flex-col items-center mx-4">
          {/* Status Badge */}
          <div
            className={`px-2 py-0.5 rounded-full text-xs font-bold mb-2 ${
              statusInfo.animate ? "animate-pulse" : ""
            }`}
            style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.textColor }}
          >
            {statusInfo.label}
          </div>

          {/* Scores */}
          <div className="flex items-center space-x-3">
            <span
              className={`text-3xl font-bold ${
                awayScore > homeScore && isCompleted ? "text-green-400" : "text-white"
              }`}
            >
              {awayScore}
            </span>
            <span className="text-gray-500">-</span>
            <span
              className={`text-3xl font-bold ${
                homeScore > awayScore && isCompleted ? "text-green-400" : "text-white"
              }`}
            >
              {homeScore}
            </span>
          </div>

          {/* Time/Quarter Info */}
          <div className="text-gray-400 text-xs mt-2">
            {isLive || status === "paused" ? (
              <span>
                Q{currentQuarter} • {timeRemaining}
              </span>
            ) : status === "scheduled" && scheduledTime ? (
              <span>{formatScheduledTime(scheduledTime)}</span>
            ) : null}
          </div>
        </div>

        {/* Home Team */}
        <div className="flex-1 flex flex-col items-center">
          {homeTeam.logo ? (
            <img
              src={homeTeam.logo}
              alt={homeTeam.name}
              className="w-12 h-12 mb-2 rounded-full object-cover"
            />
          ) : (
            <PlayerAvatar
              name={homeTeam.name}
              size="lg"
              showNumber={false}
              className="mb-2"
            />
          )}
          <span className="text-white font-medium text-sm text-center">
            {homeTeam.name}
          </span>
        </div>
      </div>
    </div>
  );

  if (showLink && !onClick) {
    return <Link to={`/games/${id}/live`}>{content}</Link>;
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
  scheduledTime,
  onClick,
  showLink = true,
  className = "",
}) => {
  const statusInfo = statusConfig[status];
  const isLive = status === "active";

  const content = (
    <div
      className={`
        bg-gray-800 rounded-lg p-3 border border-gray-700
        transition-all duration-200
        ${onClick || showLink ? "hover:border-gray-600 cursor-pointer" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-center">
        {/* Status */}
        <div
          className={`px-2 py-0.5 rounded text-xs font-bold mr-3 ${
            statusInfo.animate ? "animate-pulse" : ""
          }`}
          style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.textColor }}
        >
          {statusInfo.label}
        </div>

        {/* Teams and Score */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm">{awayTeam.name}</span>
            <span className="text-white font-bold text-sm">{awayScore}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white text-sm">{homeTeam.name}</span>
            <span className="text-white font-bold text-sm">{homeScore}</span>
          </div>
        </div>

        {/* Quarter/Time */}
        {isLive && (
          <div className="ml-3 text-gray-400 text-xs text-right">
            <div>Q{currentQuarter}</div>
            <div>{timeRemaining}</div>
          </div>
        )}
      </div>
    </div>
  );

  if (showLink && !onClick) {
    return <Link to={`/games/${id}/live`}>{content}</Link>;
  }

  return content;
};

export default GameCard;
