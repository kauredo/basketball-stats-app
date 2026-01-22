import React from "react";
import { View, Text, Image, useColorScheme, type ViewStyle } from "react-native";
import { COLORS } from "@basketball-stats/shared";

interface PlayerAvatarProps {
  name?: string;
  number?: number;
  imageUrl?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showNumber?: boolean;
  isOnCourt?: boolean;
  style?: ViewStyle;
}

const sizeConfig = {
  xs: { width: 24, height: 24, fontSize: 8, numberSize: 10, indicatorSize: 6 },
  sm: { width: 32, height: 32, fontSize: 10, numberSize: 12, indicatorSize: 8 },
  md: { width: 40, height: 40, fontSize: 12, numberSize: 14, indicatorSize: 10 },
  lg: { width: 48, height: 48, fontSize: 14, numberSize: 16, indicatorSize: 12 },
  xl: { width: 64, height: 64, fontSize: 18, numberSize: 20, indicatorSize: 14 },
};

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
const getBackgroundColor = (number?: number): string => {
  if (number !== undefined) {
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

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  name,
  number,
  imageUrl,
  size = "md",
  showNumber = true,
  isOnCourt,
  style,
}) => {
  const config = sizeConfig[size];
  const backgroundColor = getBackgroundColor(number);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View className="relative" style={style}>
      <View
        className="justify-center items-center overflow-hidden"
        style={{
          width: config.width,
          height: config.height,
          borderRadius: config.width / 2,
          backgroundColor: imageUrl ? "transparent" : backgroundColor,
        }}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{
              width: config.width,
              height: config.height,
              borderRadius: config.width / 2,
            }}
            resizeMode="cover"
          />
        ) : showNumber && number !== undefined ? (
          <Text className="text-white font-bold" style={{ fontSize: config.numberSize }}>
            #{number}
          </Text>
        ) : (
          <Text className="text-white font-semibold" style={{ fontSize: config.fontSize }}>
            {getInitials(name)}
          </Text>
        )}
      </View>

      {isOnCourt !== undefined && (
        <View
          className="absolute -bottom-0.5 -right-0.5 border-2 border-white dark:border-surface-800"
          style={{
            width: config.indicatorSize,
            height: config.indicatorSize,
            borderRadius: config.indicatorSize / 2,
            backgroundColor: isOnCourt ? COLORS.accent.success : isDark ? "#7a746c" : "#a69f96",
          }}
        />
      )}
    </View>
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
  containerStyle?: ViewStyle;
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
  style,
  containerStyle,
}) => {
  return (
    <View className="flex-row items-center" style={containerStyle}>
      <PlayerAvatar
        name={name}
        number={number}
        imageUrl={imageUrl}
        size={size}
        isOnCourt={isOnCourt}
        style={style}
      />
      <View className="flex-1 ml-3">
        <View className="flex-row items-center">
          <Text className="text-surface-900 dark:text-white font-medium text-sm">
            {name || "Unknown"}
          </Text>
          {number !== undefined && (
            <Text className="text-surface-500 dark:text-surface-400 text-xs ml-1">#{number}</Text>
          )}
        </View>
        {(position || team) && (
          <Text className="text-surface-500 dark:text-surface-400 text-xs mt-0.5">
            {[position, team].filter(Boolean).join(" • ")}
          </Text>
        )}
        {stats && (
          <Text className="text-surface-400 dark:text-surface-500 text-[10px] mt-1">
            {stats.points !== undefined && `PTS: ${stats.points}  `}
            {stats.rebounds !== undefined && `REB: ${stats.rebounds}  `}
            {stats.assists !== undefined && `AST: ${stats.assists}`}
          </Text>
        )}
      </View>
    </View>
  );
};

// Row of player avatars (for showing on-court players)
export const PlayerAvatarRow: React.FC<{
  players: Array<{
    name: string;
    number: number;
    imageUrl?: string;
    isOnCourt?: boolean;
  }>;
  size?: PlayerAvatarProps["size"];
  maxDisplay?: number;
  style?: ViewStyle;
}> = ({ players, size = "sm", maxDisplay = 5, style }) => {
  const displayPlayers = players.slice(0, maxDisplay);
  const overflow = players.length - maxDisplay;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View className="flex-row items-center" style={style}>
      {displayPlayers.map((player, index) => (
        <View
          key={index}
          className="border-2 border-white dark:border-surface-800 rounded-full"
          style={{
            marginLeft: index > 0 ? -8 : 0,
            zIndex: displayPlayers.length - index,
          }}
        >
          <PlayerAvatar
            name={player.name}
            number={player.number}
            imageUrl={player.imageUrl}
            size={size}
            isOnCourt={player.isOnCourt}
          />
        </View>
      ))}
      {overflow > 0 && (
        <View
          className="w-8 h-8 rounded-full justify-center items-center border-2 border-white dark:border-surface-800 bg-surface-200 dark:bg-surface-700"
          style={{ marginLeft: -8 }}
        >
          <Text className="text-surface-600 dark:text-surface-300 text-[10px] font-semibold">
            +{overflow}
          </Text>
        </View>
      )}
    </View>
  );
};

export default PlayerAvatar;
