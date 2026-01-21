import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import Icon from "../components/Icon";
import { RootStackParamList } from "../navigation/AppNavigator";

type GameAnalysisRouteProp = RouteProp<RootStackParamList, "GameAnalysis">;

type TabType = "boxscore" | "stats" | "plays";

interface StatRowProps {
  label: string;
  homeValue: number | string;
  awayValue: number | string;
  homeWins?: boolean;
}

function StatRow({ label, homeValue, awayValue, homeWins }: StatRowProps) {
  return (
    <View className="flex-row items-center py-3 border-b border-gray-200 dark:border-gray-700">
      <Text
        className={`flex-1 text-right text-base font-semibold ${
          homeWins === true ? "text-green-500" : "text-gray-900 dark:text-white"
        }`}
      >
        {homeValue}
      </Text>
      <Text className="w-24 text-center text-sm text-gray-600 dark:text-gray-400">{label}</Text>
      <Text
        className={`flex-1 text-left text-base font-semibold ${
          homeWins === false ? "text-green-500" : "text-gray-900 dark:text-white"
        }`}
      >
        {awayValue}
      </Text>
    </View>
  );
}

interface PlayerStatRowProps {
  name: string;
  number: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  fgm: number;
  fga: number;
}

function PlayerStatRow({
  name,
  number,
  points,
  rebounds,
  assists,
  steals,
  blocks,
  fgm,
  fga,
}: PlayerStatRowProps) {
  const fgPct = fga > 0 ? ((fgm / fga) * 100).toFixed(0) : "0";

  return (
    <View className="flex-row items-center py-3 border-b border-gray-200 dark:border-gray-700">
      <View className="flex-row items-center flex-1">
        <View className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full justify-center items-center mr-2">
          <Text className="text-gray-700 dark:text-gray-300 text-xs font-bold">{number}</Text>
        </View>
        <Text className="text-gray-900 dark:text-white text-sm font-medium" numberOfLines={1}>
          {name}
        </Text>
      </View>
      <Text className="w-10 text-center text-gray-900 dark:text-white font-bold">{points}</Text>
      <Text className="w-10 text-center text-gray-600 dark:text-gray-400">{rebounds}</Text>
      <Text className="w-10 text-center text-gray-600 dark:text-gray-400">{assists}</Text>
      <Text className="w-16 text-center text-gray-600 dark:text-gray-400">
        {fgm}/{fga}
      </Text>
    </View>
  );
}

export default function GameAnalysisScreen() {
  const route = useRoute<GameAnalysisRouteProp>();
  const { gameId } = route.params;
  const { token } = useAuth();
  const { resolvedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>("boxscore");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState<number | undefined>(undefined);

  const gameData = useQuery(
    api.games.get,
    token && gameId ? { token, gameId: gameId as Id<"games"> } : "skip"
  );

  const boxScoreData = useQuery(
    api.games.getBoxScore,
    token && gameId ? { token, gameId: gameId as Id<"games"> } : "skip"
  );

  const gameEventsData = useQuery(
    api.games.getGameEvents,
    token && gameId ? { token, gameId: gameId as Id<"games">, quarter: selectedQuarter } : "skip"
  );

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  if (gameData === undefined || boxScoreData === undefined) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-dark-950">
        <Text className="text-gray-600 dark:text-gray-400">Loading game analysis...</Text>
      </View>
    );
  }

  if (!gameData?.game) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-dark-950 p-8">
        <Icon name="basketball" size={64} color="#6B7280" />
        <Text className="text-gray-900 dark:text-white text-xl font-bold mt-4">Game Not Found</Text>
      </View>
    );
  }

  const game = gameData.game;
  const boxScore = boxScoreData?.boxScore;
  const homeTeam = boxScore?.homeTeam;
  const awayTeam = boxScore?.awayTeam;
  const events = gameEventsData?.events || [];

  const isHomeWinner = game.homeScore > game.awayScore;
  const isAwayWinner = game.awayScore > game.homeScore;

  // Calculate team totals
  const calculateTeamTotals = (players: any[]) => {
    return players.reduce(
      (acc, p) => ({
        points: acc.points + (p.points || 0),
        rebounds: acc.rebounds + (p.rebounds || 0),
        assists: acc.assists + (p.assists || 0),
        steals: acc.steals + (p.steals || 0),
        blocks: acc.blocks + (p.blocks || 0),
        turnovers: acc.turnovers + (p.turnovers || 0),
        fgm: acc.fgm + (p.fieldGoalsMade || 0),
        fga: acc.fga + (p.fieldGoalsAttempted || 0),
        threePm: acc.threePm + (p.threePointersMade || 0),
        threePa: acc.threePa + (p.threePointersAttempted || 0),
        ftm: acc.ftm + (p.freeThrowsMade || 0),
        fta: acc.fta + (p.freeThrowsAttempted || 0),
      }),
      {
        points: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        fgm: 0,
        fga: 0,
        threePm: 0,
        threePa: 0,
        ftm: 0,
        fta: 0,
      }
    );
  };

  const homeTotals = homeTeam ? calculateTeamTotals(homeTeam.players) : null;
  const awayTotals = awayTeam ? calculateTeamTotals(awayTeam.players) : null;

  const tabs = [
    { id: "boxscore" as TabType, label: "Box Score" },
    { id: "stats" as TabType, label: "Team Stats" },
    { id: "plays" as TabType, label: "Plays" },
  ];

  const renderBoxScore = (team: any, isHome: boolean) => {
    if (!team) return null;

    return (
      <View className="mb-6">
        <View
          className={`px-4 py-3 rounded-t-xl ${
            isHome ? "bg-orange-100 dark:bg-orange-900/30" : "bg-blue-100 dark:bg-blue-900/30"
          }`}
        >
          <Text className="text-gray-900 dark:text-white font-bold text-base">
            {team.team?.name}
          </Text>
        </View>

        <View className="bg-white dark:bg-gray-800 rounded-b-xl border border-gray-200 dark:border-gray-700 border-t-0">
          {/* Header */}
          <View className="flex-row items-center py-2 px-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
            <Text className="flex-1 text-xs text-gray-500 dark:text-gray-500 font-semibold">
              PLAYER
            </Text>
            <Text className="w-10 text-center text-xs text-gray-500 dark:text-gray-500 font-semibold">
              PTS
            </Text>
            <Text className="w-10 text-center text-xs text-gray-500 dark:text-gray-500 font-semibold">
              REB
            </Text>
            <Text className="w-10 text-center text-xs text-gray-500 dark:text-gray-500 font-semibold">
              AST
            </Text>
            <Text className="w-16 text-center text-xs text-gray-500 dark:text-gray-500 font-semibold">
              FG
            </Text>
          </View>

          {/* Players */}
          <View className="px-3">
            {team.players.map((player: any, index: number) => (
              <PlayerStatRow
                key={player.playerId || index}
                name={player.name || "Unknown"}
                number={player.number || 0}
                points={player.points || 0}
                rebounds={player.rebounds || 0}
                assists={player.assists || 0}
                steals={player.steals || 0}
                blocks={player.blocks || 0}
                fgm={player.fieldGoalsMade || 0}
                fga={player.fieldGoalsAttempted || 0}
              />
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-dark-950">
      {/* Score Header */}
      <View className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
        <View className="flex-row items-center justify-between">
          <View className={`flex-1 items-center ${isAwayWinner ? "opacity-60" : ""}`}>
            <Text className="text-gray-600 dark:text-gray-400 text-sm">
              {homeTeam?.team?.city || "Home"}
            </Text>
            <Text className="text-gray-900 dark:text-white font-bold text-lg" numberOfLines={1}>
              {homeTeam?.team?.name || "Team"}
            </Text>
            <Text className="text-primary-500 text-3xl font-bold mt-1">{game.homeScore}</Text>
            {isHomeWinner && game.status === "completed" && (
              <View className="flex-row items-center mt-1">
                <Icon name="trophy" size={14} color="#22C55E" />
                <Text className="text-green-500 text-xs font-medium ml-1">WIN</Text>
              </View>
            )}
          </View>

          <View className="items-center px-4">
            <Text className="text-gray-400 dark:text-gray-500 text-sm font-medium">
              {game.status === "completed" ? "FINAL" : game.status?.toUpperCase()}
            </Text>
          </View>

          <View className={`flex-1 items-center ${isHomeWinner ? "opacity-60" : ""}`}>
            <Text className="text-gray-600 dark:text-gray-400 text-sm">
              {awayTeam?.team?.city || "Away"}
            </Text>
            <Text className="text-gray-900 dark:text-white font-bold text-lg" numberOfLines={1}>
              {awayTeam?.team?.name || "Team"}
            </Text>
            <Text className="text-blue-500 text-3xl font-bold mt-1">{game.awayScore}</Text>
            {isAwayWinner && game.status === "completed" && (
              <View className="flex-row items-center mt-1">
                <Icon name="trophy" size={14} color="#22C55E" />
                <Text className="text-green-500 text-xs font-medium ml-1">WIN</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            className={`flex-1 py-3 items-center border-b-2 ${
              activeTab === tab.id ? "border-primary-500" : "border-transparent"
            }`}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text
              className={`font-medium ${
                activeTab === tab.id ? "text-primary-500" : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === "boxscore" && (
          <View className="p-4">
            {renderBoxScore(homeTeam, true)}
            {renderBoxScore(awayTeam, false)}
          </View>
        )}

        {activeTab === "stats" && (
          <View className="p-4">
            <View className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Team Headers */}
              <View className="flex-row items-center py-3 px-4 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
                <Text className="flex-1 text-right text-sm font-bold text-primary-500">
                  {homeTeam?.team?.name}
                </Text>
                <Text className="w-24 text-center text-xs text-gray-500 dark:text-gray-500">
                  STAT
                </Text>
                <Text className="flex-1 text-left text-sm font-bold text-blue-500">
                  {awayTeam?.team?.name}
                </Text>
              </View>

              {/* Stats */}
              <View className="px-4">
                <StatRow
                  label="Points"
                  homeValue={homeTotals?.points || 0}
                  awayValue={awayTotals?.points || 0}
                  homeWins={(homeTotals?.points || 0) > (awayTotals?.points || 0)}
                />
                <StatRow
                  label="Rebounds"
                  homeValue={homeTotals?.rebounds || 0}
                  awayValue={awayTotals?.rebounds || 0}
                  homeWins={(homeTotals?.rebounds || 0) > (awayTotals?.rebounds || 0)}
                />
                <StatRow
                  label="Assists"
                  homeValue={homeTotals?.assists || 0}
                  awayValue={awayTotals?.assists || 0}
                  homeWins={(homeTotals?.assists || 0) > (awayTotals?.assists || 0)}
                />
                <StatRow
                  label="Steals"
                  homeValue={homeTotals?.steals || 0}
                  awayValue={awayTotals?.steals || 0}
                  homeWins={(homeTotals?.steals || 0) > (awayTotals?.steals || 0)}
                />
                <StatRow
                  label="Blocks"
                  homeValue={homeTotals?.blocks || 0}
                  awayValue={awayTotals?.blocks || 0}
                  homeWins={(homeTotals?.blocks || 0) > (awayTotals?.blocks || 0)}
                />
                <StatRow
                  label="Turnovers"
                  homeValue={homeTotals?.turnovers || 0}
                  awayValue={awayTotals?.turnovers || 0}
                  homeWins={(homeTotals?.turnovers || 0) < (awayTotals?.turnovers || 0)}
                />
                <StatRow
                  label="FG%"
                  homeValue={
                    homeTotals?.fga
                      ? `${((homeTotals.fgm / homeTotals.fga) * 100).toFixed(1)}%`
                      : "0%"
                  }
                  awayValue={
                    awayTotals?.fga
                      ? `${((awayTotals.fgm / awayTotals.fga) * 100).toFixed(1)}%`
                      : "0%"
                  }
                />
                <StatRow
                  label="3P%"
                  homeValue={
                    homeTotals?.threePa
                      ? `${((homeTotals.threePm / homeTotals.threePa) * 100).toFixed(1)}%`
                      : "0%"
                  }
                  awayValue={
                    awayTotals?.threePa
                      ? `${((awayTotals.threePm / awayTotals.threePa) * 100).toFixed(1)}%`
                      : "0%"
                  }
                />
                <StatRow
                  label="FT%"
                  homeValue={
                    homeTotals?.fta
                      ? `${((homeTotals.ftm / homeTotals.fta) * 100).toFixed(1)}%`
                      : "0%"
                  }
                  awayValue={
                    awayTotals?.fta
                      ? `${((awayTotals.ftm / awayTotals.fta) * 100).toFixed(1)}%`
                      : "0%"
                  }
                />
              </View>
            </View>
          </View>
        )}

        {activeTab === "plays" && (
          <View className="p-4">
            {/* Quarter Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <TouchableOpacity
                className={`px-4 py-2 rounded-full mr-2 ${
                  selectedQuarter === undefined ? "bg-primary-500" : "bg-gray-200 dark:bg-gray-700"
                }`}
                onPress={() => setSelectedQuarter(undefined)}
              >
                <Text
                  className={
                    selectedQuarter === undefined
                      ? "text-white font-medium"
                      : "text-gray-700 dark:text-gray-300"
                  }
                >
                  All
                </Text>
              </TouchableOpacity>
              {[1, 2, 3, 4].map((q) => (
                <TouchableOpacity
                  key={q}
                  className={`px-4 py-2 rounded-full mr-2 ${
                    selectedQuarter === q ? "bg-primary-500" : "bg-gray-200 dark:bg-gray-700"
                  }`}
                  onPress={() => setSelectedQuarter(q)}
                >
                  <Text
                    className={
                      selectedQuarter === q
                        ? "text-white font-medium"
                        : "text-gray-700 dark:text-gray-300"
                    }
                  >
                    Q{q}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Events List */}
            <View className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              {events.length > 0 ? (
                events.map((event: any, index: number) => (
                  <View
                    key={event._id || index}
                    className={`p-3 flex-row items-center ${
                      index < events.length - 1
                        ? "border-b border-gray-200 dark:border-gray-700"
                        : ""
                    }`}
                  >
                    <View className="w-12 items-center">
                      <Text className="text-gray-500 dark:text-gray-500 text-xs">
                        Q{event.quarter}
                      </Text>
                      <Text className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                        {event.gameTime || "--:--"}
                      </Text>
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-gray-900 dark:text-white text-sm">
                        {event.description || event.eventType}
                      </Text>
                      {event.playerName && (
                        <Text className="text-gray-600 dark:text-gray-400 text-xs">
                          {event.playerName}
                        </Text>
                      )}
                    </View>
                    {event.pointsScored !== undefined && event.pointsScored > 0 && (
                      <View className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                        <Text className="text-green-600 dark:text-green-400 text-xs font-bold">
                          +{event.pointsScored}
                        </Text>
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <View className="p-8 items-center">
                  <Icon name="list" size={32} color="#9CA3AF" />
                  <Text className="text-gray-600 dark:text-gray-400 mt-2">No plays recorded</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
