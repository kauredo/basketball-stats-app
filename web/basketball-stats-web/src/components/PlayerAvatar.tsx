import React from "react";
import { COLORS } from "@basketball-stats/shared";

interface PlayerAvatarProps {
  name?: string;
  number?: number;
  imageUrl?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showNumber?: boolean;
  isOnCourt?: boolean;
  className?: string;
}

const sizeConfig = {
  xs: { width: 24, height: 24, fontSize: 8, numberSize: 10 },
  sm: { width: 32, height: 32, fontSize: 10, numberSize: 12 },
  md: { width: 40, height: 40, fontSize: 12, numberSize: 14 },
  lg: { width: 48, height: 48, fontSize: 14, numberSize: 16 },
  xl: { width: 64, height: 64, fontSize: 18, numberSize: 20 },
};

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  name,
  number,
  imageUrl,
  size = "md",
  showNumber = true,
  isOnCourt,
  className = "",
}) => {
  const { width, height, fontSize, numberSize } = sizeConfig[size];

  // Generate initials from name
  const getInitials = (name?: string): string => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Generate a consistent background color based on the name or number
  const getBackgroundColor = (): string => {
    if (number !== undefined) {
      // Use number to determine color
      const colors = [
        COLORS.primary[500],
        COLORS.accent.info,
        COLORS.statButtons.playmaking,
        COLORS.statButtons.defense,
        COLORS.statButtons.scoring,
      ];
      return colors[number % colors.length];
    }
    return COLORS.primary[500];
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      <div
        className="rounded-full flex items-center justify-center overflow-hidden"
        style={{
          width,
          height,
          backgroundColor: imageUrl ? "transparent" : getBackgroundColor(),
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name || "Player"}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              e.currentTarget.style.display = "none";
            }}
          />
        ) : showNumber && number !== undefined ? (
          <span className="text-white font-bold" style={{ fontSize: numberSize }}>
            #{number}
          </span>
        ) : (
          <span className="text-white font-semibold" style={{ fontSize }}>
            {getInitials(name)}
          </span>
        )}
      </div>

      {/* On-court indicator */}
      {isOnCourt !== undefined && (
        <div
          className={`absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white dark:border-gray-900 ${
            isOnCourt ? "bg-green-500" : "bg-gray-400 dark:bg-gray-600"
          }`}
          style={{
            width: Math.max(8, width * 0.25),
            height: Math.max(8, width * 0.25),
          }}
          aria-hidden="true"
        />
      )}
      {isOnCourt !== undefined && (
        <span className="sr-only">{isOnCourt ? "On court" : "On bench"}</span>
      )}
    </div>
  );
};

// Player Avatar with name and details
interface PlayerAvatarWithDetailsProps extends PlayerAvatarProps {
  position?: string;
  team?: string;
  stats?: {
    points?: number;
    rebounds?: number;
    assists?: number;
  };
}

export const PlayerAvatarWithDetails: React.FC<PlayerAvatarWithDetailsProps> = ({
  name,
  number,
  imageUrl,
  position,
  team,
  stats,
  size = "md",
  isOnCourt,
  className = "",
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <PlayerAvatar
        name={name}
        number={number}
        imageUrl={imageUrl}
        size={size}
        isOnCourt={isOnCourt}
      />
      <div className="ml-3 flex-1">
        <div className="flex items-center">
          <span className="text-gray-900 dark:text-white font-medium">{name || "Unknown"}</span>
          {number !== undefined && (
            <span className="text-gray-600 dark:text-gray-400 text-sm ml-1">#{number}</span>
          )}
        </div>
        {(position || team) && (
          <div className="text-gray-600 dark:text-gray-400 text-sm">
            {[position, team].filter(Boolean).join(" • ")}
          </div>
        )}
        {stats && (
          <div className="text-gray-500 text-xs mt-1">
            {stats.points !== undefined && <span className="mr-2">PTS: {stats.points}</span>}
            {stats.rebounds !== undefined && <span className="mr-2">REB: {stats.rebounds}</span>}
            {stats.assists !== undefined && <span>AST: {stats.assists}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerAvatar;
