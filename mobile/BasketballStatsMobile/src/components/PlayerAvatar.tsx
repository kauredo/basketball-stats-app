import React from "react";
import { View, Text, Image, StyleSheet, useColorScheme, type ViewStyle } from "react-native";
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
  const indicatorBorderColor = isDark ? "#3d3835" : "#fdfcfb";
  const offCourtColor = isDark ? "#7a746c" : "#a69f96";

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.avatar,
          {
            width: config.width,
            height: config.height,
            borderRadius: config.width / 2,
            backgroundColor: imageUrl ? "transparent" : backgroundColor,
          },
        ]}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={[
              styles.image,
              {
                width: config.width,
                height: config.height,
                borderRadius: config.width / 2,
              },
            ]}
          />
        ) : showNumber && number !== undefined ? (
          <Text style={[styles.number, { fontSize: config.numberSize }]}>#{number}</Text>
        ) : (
          <Text style={[styles.initials, { fontSize: config.fontSize }]}>{getInitials(name)}</Text>
        )}
      </View>

      {isOnCourt !== undefined && (
        <View
          style={[
            styles.indicator,
            {
              width: config.indicatorSize,
              height: config.indicatorSize,
              borderRadius: config.indicatorSize / 2,
              backgroundColor: isOnCourt ? COLORS.accent.success : offCourtColor,
              borderColor: indicatorBorderColor,
            },
          ]}
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const nameColor = isDark ? "#fdfcfb" : "#252220";
  const numberSmallColor = isDark ? "#a69f96" : "#7a746c";
  const subtitleColor = isDark ? "#a69f96" : "#7a746c";
  const statsColor = isDark ? "#7a746c" : "#a69f96";

  return (
    <View style={[styles.detailsContainer, containerStyle]}>
      <PlayerAvatar
        name={name}
        number={number}
        imageUrl={imageUrl}
        size={size}
        isOnCourt={isOnCourt}
        style={style}
      />
      <View style={styles.details}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: nameColor }]}>{name || "Unknown"}</Text>
          {number !== undefined && (
            <Text style={[styles.numberSmall, { color: numberSmallColor }]}>#{number}</Text>
          )}
        </View>
        {(position || team) && (
          <Text style={[styles.subtitle, { color: subtitleColor }]}>
            {[position, team].filter(Boolean).join(" • ")}
          </Text>
        )}
        {stats && (
          <Text style={[styles.stats, { color: statsColor }]}>
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
  const avatarRowItemBorderColor = isDark ? "#3d3835" : "#fdfcfb";
  const overflowBadgeBg = isDark ? "#5c5650" : "#f3f0ed";
  const overflowBadgeBorderColor = isDark ? "#3d3835" : "#fdfcfb";

  return (
    <View style={[styles.avatarRow, style]}>
      {displayPlayers.map((player, index) => (
        <View
          key={index}
          style={[
            styles.avatarRowItem,
            {
              marginLeft: index > 0 ? -8 : 0,
              zIndex: displayPlayers.length - index,
              borderColor: avatarRowItemBorderColor,
            },
          ]}
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
          style={[
            styles.overflowBadge,
            {
              marginLeft: -8,
              backgroundColor: overflowBadgeBg,
              borderColor: overflowBadgeBorderColor,
            },
          ]}
        >
          <Text style={styles.overflowText}>+{overflow}</Text>
        </View>
      )}
    </View>
  );
};

// Static styles that don't depend on theme
const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  avatar: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  image: {
    resizeMode: "cover",
  },
  number: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  initials: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  indicator: {
    position: "absolute",
    bottom: -2,
    right: -2,
    borderWidth: 2,
  },
  detailsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  details: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    fontWeight: "500",
    fontSize: 14,
  },
  numberSmall: {
    fontSize: 12,
    marginLeft: 4,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  stats: {
    fontSize: 10,
    marginTop: 4,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarRowItem: {
    borderWidth: 2,
    borderRadius: 100,
  },
  overflowBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  overflowText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
});

export default PlayerAvatar;
