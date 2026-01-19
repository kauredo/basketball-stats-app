import React from "react";
import { PlayByPlayEvent } from "../../../types/livegame";

interface GameEventCardProps {
  event: PlayByPlayEvent;
  isHomeTeam?: boolean;
}

/**
 * Individual play-by-play event card.
 */
export const GameEventCard: React.FC<GameEventCardProps> = ({ event, isHomeTeam = false }) => {
  // Format time remaining as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get event icon/color based on type
  const getEventStyle = () => {
    switch (event.eventType) {
      case "shot_made":
        return {
          bg: "bg-green-100 dark:bg-green-900/20",
          border: "border-green-300 dark:border-green-700",
          icon: "🏀",
        };
      case "shot_missed":
        return {
          bg: "bg-gray-100 dark:bg-gray-700/30",
          border: "border-gray-300 dark:border-gray-600",
          icon: "✗",
        };
      case "free_throw_made":
        return {
          bg: "bg-green-50 dark:bg-green-900/10",
          border: "border-green-200 dark:border-green-800",
          icon: "🎯",
        };
      case "free_throw_missed":
        return {
          bg: "bg-gray-100 dark:bg-gray-700/30",
          border: "border-gray-300 dark:border-gray-600",
          icon: "○",
        };
      case "rebound":
        return {
          bg: "bg-blue-50 dark:bg-blue-900/10",
          border: "border-blue-200 dark:border-blue-800",
          icon: "⬆",
        };
      case "assist":
        return {
          bg: "bg-purple-50 dark:bg-purple-900/10",
          border: "border-purple-200 dark:border-purple-800",
          icon: "→",
        };
      case "steal":
        return {
          bg: "bg-cyan-50 dark:bg-cyan-900/10",
          border: "border-cyan-200 dark:border-cyan-800",
          icon: "⚡",
        };
      case "block":
        return {
          bg: "bg-cyan-50 dark:bg-cyan-900/10",
          border: "border-cyan-200 dark:border-cyan-800",
          icon: "🛡",
        };
      case "turnover":
        return {
          bg: "bg-amber-50 dark:bg-amber-900/10",
          border: "border-amber-200 dark:border-amber-800",
          icon: "↩",
        };
      case "foul":
        return {
          bg: "bg-red-50 dark:bg-red-900/10",
          border: "border-red-200 dark:border-red-800",
          icon: "⚠",
        };
      case "substitution":
        return {
          bg: "bg-gray-50 dark:bg-gray-700/30",
          border: "border-gray-200 dark:border-gray-700",
          icon: "🔄",
        };
      case "timeout":
        return {
          bg: "bg-yellow-50 dark:bg-yellow-900/10",
          border: "border-yellow-200 dark:border-yellow-800",
          icon: "⏸",
        };
      case "quarter_start":
      case "quarter_end":
        return {
          bg: "bg-gray-200 dark:bg-gray-600",
          border: "border-gray-400 dark:border-gray-500",
          icon: "📢",
        };
      default:
        return {
          bg: "bg-gray-50 dark:bg-gray-700/30",
          border: "border-gray-200 dark:border-gray-700",
          icon: "•",
        };
    }
  };

  const style = getEventStyle();

  return (
    <div
      className={`
        flex items-start gap-2 p-2 rounded-lg border
        ${style.bg} ${style.border}
        ${isHomeTeam ? "ml-4" : "mr-4"}
      `}
    >
      {/* Time */}
      <div className="text-[10px] text-gray-500 dark:text-gray-400 font-mono w-10 flex-shrink-0">
        {formatTime(event.timeRemaining)}
      </div>

      {/* Icon */}
      <div className="text-sm flex-shrink-0">{style.icon}</div>

      {/* Description */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-900 dark:text-white">{event.description}</p>
        {event.points && event.points > 0 && (
          <span className="text-[10px] text-green-600 dark:text-green-400 font-semibold">
            +{event.points}
          </span>
        )}
      </div>
    </div>
  );
};

export default GameEventCard;
