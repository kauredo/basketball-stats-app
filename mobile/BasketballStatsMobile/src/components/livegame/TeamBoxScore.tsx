import React from "react";
import { View, Text, ScrollView, useWindowDimensions, StyleSheet } from "react-native";
import type { Id } from "../../../../../convex/_generated/dataModel";

interface PlayerStat {
  id: string;
  playerId: Id<"players">;
  player: {
    id: Id<"players">;
    name: string;
    number: number;
    position?: string;
  } | null;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fouledOut?: boolean;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  minutesPlayed: number;
  plusMinus: number;
  isOnCourt: boolean;
}

interface TeamBoxScoreProps {
  teamName: string;
  players: PlayerStat[];
  foulLimit: number;
  isHomeTeam?: boolean;
}

/**
 * Compact box score table for a single team.
 * Responsive - wider columns in landscape mode.
 */
export function TeamBoxScore({
  teamName,
  players,
  foulLimit,
  isHomeTeam = false,
}: TeamBoxScoreProps) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Sort players: on-court first, then by points
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.isOnCourt && !b.isOnCourt) return -1;
    if (!a.isOnCourt && b.isOnCourt) return 1;
    return b.points - a.points;
  });

  // Calculate team totals
  const totals = players.reduce(
    (acc, p) => ({
      points: acc.points + p.points,
      rebounds: acc.rebounds + p.rebounds,
      assists: acc.assists + p.assists,
      steals: acc.steals + p.steals,
      blocks: acc.blocks + p.blocks,
      turnovers: acc.turnovers + p.turnovers,
      fouls: acc.fouls + p.fouls,
      fgm: acc.fgm + (p.fieldGoalsMade || 0),
      fga: acc.fga + (p.fieldGoalsAttempted || 0),
      tpm: acc.tpm + (p.threePointersMade || 0),
      tpa: acc.tpa + (p.threePointersAttempted || 0),
      ftm: acc.ftm + (p.freeThrowsMade || 0),
      fta: acc.fta + (p.freeThrowsAttempted || 0),
      plusMinus: acc.plusMinus + (p.plusMinus || 0),
    }),
    {
      points: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      fouls: 0,
      fgm: 0,
      fga: 0,
      tpm: 0,
      tpa: 0,
      ftm: 0,
      fta: 0,
      plusMinus: 0,
    }
  );

  const formatPlusMinus = (value: number) => {
    if (value > 0) return `+${value}`;
    if (value < 0) return `${value}`;
    return "0";
  };

  const getPlusMinusColor = (value: number) => {
    if (value > 0) return styles.textGreen;
    if (value < 0) return styles.textRed;
    return styles.textMuted;
  };

  const getFoulStyle = (fouls: number) => {
    if (fouls >= foulLimit) return styles.textRedBold;
    if (fouls >= foulLimit - 1) return styles.textYellow;
    return styles.textSecondary;
  };

  // Dynamic column widths based on orientation
  const cols = {
    player: isLandscape ? 150 : 112,
    pts: isLandscape ? 44 : 36,
    stat: isLandscape ? 38 : 32,
    shooting: isLandscape ? 54 : 48,
    plusMinus: isLandscape ? 46 : 40,
  };

  // Calculate total table width
  const tableWidth =
    cols.player + cols.pts + cols.stat * 6 + cols.shooting * 3 + cols.plusMinus;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isHomeTeam && styles.headerHome]}>
        <Text style={styles.headerText}>{teamName}</Text>
      </View>

      {/* Table */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={isLandscape}
        contentContainerStyle={[
          styles.tableContainer,
          isLandscape && { minWidth: width - 32 },
        ]}
      >
        <View style={{ width: Math.max(tableWidth, isLandscape ? width - 32 : 0) }}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={[styles.cell, { width: cols.player }]}>
              <Text style={styles.headerCell}>Player</Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: cols.pts }]}>
              <Text style={styles.headerCell}>PTS</Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: cols.stat }]}>
              <Text style={styles.headerCell}>REB</Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: cols.stat }]}>
              <Text style={styles.headerCell}>AST</Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: cols.stat }]}>
              <Text style={styles.headerCell}>STL</Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: cols.stat }]}>
              <Text style={styles.headerCell}>BLK</Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: cols.stat }]}>
              <Text style={styles.headerCell}>TO</Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: cols.stat }]}>
              <Text style={styles.headerCell}>PF</Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: cols.shooting }]}>
              <Text style={styles.headerCell}>FG</Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: cols.shooting }]}>
              <Text style={styles.headerCell}>3P</Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: cols.shooting }]}>
              <Text style={styles.headerCell}>FT</Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: cols.plusMinus }]}>
              <Text style={styles.headerCell}>+/-</Text>
            </View>
          </View>

          {/* Player Rows */}
          {sortedPlayers.map((player) => (
            <View
              key={player.playerId}
              style={[
                styles.row,
                player.fouledOut && styles.rowFouledOut,
                player.isOnCourt && !player.fouledOut && styles.rowOnCourt,
              ]}
            >
              <View style={[styles.cell, styles.playerCell, { width: cols.player }]}>
                {player.isOnCourt && !player.fouledOut && <View style={styles.onCourtDot} />}
                <Text
                  style={[styles.playerNumber, player.fouledOut && styles.textStrikethrough]}
                  numberOfLines={1}
                >
                  #{player.player?.number}
                </Text>
                <Text style={styles.playerName} numberOfLines={1}>
                  {isLandscape ? player.player?.name : player.player?.name?.split(" ").pop()}
                </Text>
              </View>
              <View style={[styles.cell, styles.cellCenter, { width: cols.pts }]}>
                <Text style={styles.textBold}>{player.points}</Text>
              </View>
              <View style={[styles.cell, styles.cellCenter, { width: cols.stat }]}>
                <Text style={styles.textSecondary}>{player.rebounds}</Text>
              </View>
              <View style={[styles.cell, styles.cellCenter, { width: cols.stat }]}>
                <Text style={styles.textSecondary}>{player.assists}</Text>
              </View>
              <View style={[styles.cell, styles.cellCenter, { width: cols.stat }]}>
                <Text style={styles.textSecondary}>{player.steals}</Text>
              </View>
              <View style={[styles.cell, styles.cellCenter, { width: cols.stat }]}>
                <Text style={styles.textSecondary}>{player.blocks}</Text>
              </View>
              <View style={[styles.cell, styles.cellCenter, { width: cols.stat }]}>
                <Text style={styles.textSecondary}>{player.turnovers}</Text>
              </View>
              <View style={[styles.cell, styles.cellCenter, { width: cols.stat }]}>
                <Text style={[styles.textSecondary, getFoulStyle(player.fouls)]}>
                  {player.fouls}
                </Text>
              </View>
              <View style={[styles.cell, styles.cellCenter, { width: cols.shooting }]}>
                <Text style={styles.textMuted}>
                  {player.fieldGoalsMade}/{player.fieldGoalsAttempted}
                </Text>
              </View>
              <View style={[styles.cell, styles.cellCenter, { width: cols.shooting }]}>
                <Text style={styles.textMuted}>
                  {player.threePointersMade}/{player.threePointersAttempted}
                </Text>
              </View>
              <View style={[styles.cell, styles.cellCenter, { width: cols.shooting }]}>
                <Text style={styles.textMuted}>
                  {player.freeThrowsMade}/{player.freeThrowsAttempted}
                </Text>
              </View>
              <View style={[styles.cell, styles.cellCenter, { width: cols.plusMinus }]}>
                <Text style={[styles.textSecondary, getPlusMinusColor(player.plusMinus)]}>
                  {formatPlusMinus(player.plusMinus)}
                </Text>
              </View>
            </View>
          ))}

          {/* Totals Row */}
          <View style={styles.totalsRow}>
            <View style={[styles.cell, { width: cols.player }]}>
              <Text style={styles.totalsLabel}>TOTAL</Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: cols.pts }]}>
              <Text style={styles.totalsBold}>{totals.points}</Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: cols.stat }]}>
              <Text style={styles.totalsText}>{totals.rebounds}</Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: cols.stat }]}>
              <Text style={styles.totalsText}>{totals.assists}</Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: cols.stat }]}>
              <Text style={styles.totalsText}>{totals.steals}</Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: cols.stat }]}>
              <Text style={styles.totalsText}>{totals.blocks}</Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: cols.stat }]}>
              <Text style={styles.totalsText}>{totals.turnovers}</Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: cols.stat }]}>
              <Text style={styles.totalsText}>{totals.fouls}</Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: cols.shooting }]}>
              <Text style={styles.totalsMuted}>
                {totals.fgm}/{totals.fga}
              </Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: cols.shooting }]}>
              <Text style={styles.totalsMuted}>
                {totals.tpm}/{totals.tpa}
              </Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: cols.shooting }]}>
              <Text style={styles.totalsMuted}>
                {totals.ftm}/{totals.fta}
              </Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: cols.plusMinus }]}>
              <Text style={[styles.totalsText, getPlusMinusColor(totals.plusMinus)]}>
                {formatPlusMinus(totals.plusMinus)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
    overflow: "hidden",
    marginBottom: 16,
  },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#374151",
  },
  headerHome: {
    backgroundColor: "rgba(249, 115, 22, 0.2)",
  },
  headerText: {
    fontWeight: "600",
    color: "#FFFFFF",
    fontSize: 14,
  },
  tableContainer: {
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#374151",
    borderBottomWidth: 1,
    borderBottomColor: "#4B5563",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  rowOnCourt: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
  },
  rowFouledOut: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  totalsRow: {
    flexDirection: "row",
    backgroundColor: "#374151",
    borderTopWidth: 2,
    borderTopColor: "#4B5563",
  },
  cell: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  cellCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  playerCell: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  headerCell: {
    fontSize: 10,
    fontWeight: "500",
    color: "#9CA3AF",
    textTransform: "uppercase",
  },
  onCourtDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
    marginRight: 4,
  },
  playerNumber: {
    fontSize: 11,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  playerName: {
    fontSize: 11,
    color: "#9CA3AF",
    marginLeft: 4,
    flex: 1,
  },
  textBold: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  textSecondary: {
    fontSize: 11,
    color: "#D1D5DB",
  },
  textMuted: {
    fontSize: 10,
    color: "#9CA3AF",
  },
  textGreen: {
    color: "#4ADE80",
  },
  textRed: {
    color: "#F87171",
  },
  textYellow: {
    color: "#FBBF24",
  },
  textRedBold: {
    color: "#EF4444",
    fontWeight: "700",
  },
  textStrikethrough: {
    textDecorationLine: "line-through",
    color: "#6B7280",
  },
  totalsLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    paddingLeft: 8,
  },
  totalsBold: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  totalsText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#D1D5DB",
  },
  totalsMuted: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9CA3AF",
  },
});

export default TeamBoxScore;
