import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";
import { QuarterBreakdown } from "../components/livegame/QuarterBreakdown";
import { AdvancedStats } from "../components/livegame/AdvancedStats";
import PlayByPlayTab from "../components/livegame/PlayByPlayTab";
import type { RootStackParamList } from "../navigation/AppNavigator";

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
    <View className="flex-row items-center py-3 border-b border-surface-200 dark:border-surface-700">
      <Text
        className={`flex-1 text-right text-base font-semibold ${
          homeWins === true ? "text-green-500" : "text-surface-900 dark:text-white"
        }`}
      >
        {homeValue}
      </Text>
      <Text className="w-24 text-center text-sm text-surface-600 dark:text-surface-400">
        {label}
      </Text>
      <Text
        className={`flex-1 text-left text-base font-semibold ${
          homeWins === false ? "text-green-500" : "text-surface-900 dark:text-white"
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
  minutesPlayed: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fgm: number;
  fga: number;
  threePm: number;
  threePa: number;
  ftm: number;
  fta: number;
}

function PlayerStatRow({
  name,
  number,
  minutesPlayed,
  points,
  rebounds,
  assists,
  steals,
  blocks,
  turnovers,
  fouls,
  fgm,
  fga,
  threePm,
  threePa,
  ftm,
  fta,
}: PlayerStatRowProps) {
  return (
    <View className="flex-row items-center py-2.5 border-b border-surface-200 dark:border-surface-700">
      <View className="w-28 flex-row items-center pr-2">
        <Text className="text-surface-500 dark:text-surface-400 text-xs mr-1">#{number}</Text>
        <Text className="text-surface-900 dark:text-white text-xs font-medium" numberOfLines={1}>
          {name}
        </Text>
      </View>
      <Text className="w-9 text-center text-surface-600 dark:text-surface-400 text-xs tabular-nums">
        {minutesPlayed}
      </Text>
      <Text className="w-9 text-center text-surface-900 dark:text-white font-bold text-xs tabular-nums">
        {points}
      </Text>
      <Text className="w-9 text-center text-surface-600 dark:text-surface-400 text-xs tabular-nums">
        {rebounds}
      </Text>
      <Text className="w-9 text-center text-surface-600 dark:text-surface-400 text-xs tabular-nums">
        {assists}
      </Text>
      <Text className="w-9 text-center text-surface-600 dark:text-surface-400 text-xs tabular-nums">
        {steals}
      </Text>
      <Text className="w-9 text-center text-surface-600 dark:text-surface-400 text-xs tabular-nums">
        {blocks}
      </Text>
      <Text className="w-9 text-center text-surface-600 dark:text-surface-400 text-xs tabular-nums">
        {turnovers}
      </Text>
      <Text className="w-9 text-center text-surface-600 dark:text-surface-400 text-xs tabular-nums">
        {fouls}
      </Text>
      <Text className="w-14 text-center text-surface-600 dark:text-surface-400 text-xs tabular-nums">
        {fgm}-{fga}
      </Text>
      <Text className="w-12 text-center text-surface-600 dark:text-surface-400 text-xs tabular-nums">
        {threePm}-{threePa}
      </Text>
      <Text className="w-12 text-center text-surface-600 dark:text-surface-400 text-xs tabular-nums">
        {ftm}-{fta}
      </Text>
    </View>
  );
}

export default function GameAnalysisScreen() {
  const route = useRoute<GameAnalysisRouteProp>();
  const { gameId } = route.params;
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("boxscore");
  const [refreshing, setRefreshing] = useState(false);

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
    token && gameId ? { token, gameId: gameId as Id<"games"> } : "skip"
  );

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  if (gameData === undefined || boxScoreData === undefined) {
    return (
      <View className="flex-1 justify-center items-center bg-surface-50 dark:bg-surface-950">
        <Text className="text-surface-600 dark:text-surface-400">Loading game analysis...</Text>
      </View>
    );
  }

  if (!gameData?.game) {
    return (
      <View className="flex-1 justify-center items-center bg-surface-50 dark:bg-surface-950 p-8">
        <View className="w-16 h-16 rounded-2xl bg-primary-500/10 items-center justify-center mb-4">
          <Icon name="basketball" size={32} color="#F97316" />
        </View>
        <Text className="text-surface-900 dark:text-white text-lg font-bold mb-2">
          Game Not Found
        </Text>
        <Text className="text-surface-600 dark:text-surface-400 text-sm">
          This game may have been deleted
        </Text>
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

  // Sort players by points (highest first)
  const sortPlayers = (players: any[]) => {
    return [...players].sort((a, b) => (b.points || 0) - (a.points || 0));
  };

  const renderBoxScore = (team: any, isHome: boolean) => {
    if (!team) return null;

    const sortedPlayers = sortPlayers(team.players);
    const isWinner = isHome ? isHomeWinner : isAwayWinner;

    return (
      <View className="mb-6">
        <View
          className={`px-4 py-3 rounded-t-xl flex-row items-center justify-between ${
            isHome ? "bg-orange-100 dark:bg-orange-900/30" : "bg-blue-100 dark:bg-blue-900/30"
          }`}
        >
          <View className="flex-row items-center">
            <Text className="text-surface-900 dark:text-white font-bold text-base">
              {team.team?.name}
            </Text>
            {isWinner && game.status === "completed" && (
              <View className="ml-2">
                <Icon name="trophy" size={16} color="#EAB308" />
              </View>
            )}
          </View>
          <Text className={`text-xl font-bold ${isHome ? "text-primary-500" : "text-blue-500"}`}>
            {isHome ? game.homeScore : game.awayScore}
          </Text>
        </View>

        <View className="bg-surface-100 dark:bg-surface-800/50 rounded-b-xl overflow-hidden">
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View>
              {/* Header */}
              <View className="flex-row items-center py-2 px-3 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
                <Text className="w-28 text-xs text-surface-500 dark:text-surface-500 font-semibold">
                  PLAYER
                </Text>
                <Text className="w-9 text-center text-xs text-surface-500 dark:text-surface-500 font-semibold">
                  MIN
                </Text>
                <Text className="w-9 text-center text-xs text-surface-500 dark:text-surface-500 font-semibold">
                  PTS
                </Text>
                <Text className="w-9 text-center text-xs text-surface-500 dark:text-surface-500 font-semibold">
                  REB
                </Text>
                <Text className="w-9 text-center text-xs text-surface-500 dark:text-surface-500 font-semibold">
                  AST
                </Text>
                <Text className="w-9 text-center text-xs text-surface-500 dark:text-surface-500 font-semibold">
                  STL
                </Text>
                <Text className="w-9 text-center text-xs text-surface-500 dark:text-surface-500 font-semibold">
                  BLK
                </Text>
                <Text className="w-9 text-center text-xs text-surface-500 dark:text-surface-500 font-semibold">
                  TO
                </Text>
                <Text className="w-9 text-center text-xs text-surface-500 dark:text-surface-500 font-semibold">
                  PF
                </Text>
                <Text className="w-14 text-center text-xs text-surface-500 dark:text-surface-500 font-semibold">
                  FG
                </Text>
                <Text className="w-12 text-center text-xs text-surface-500 dark:text-surface-500 font-semibold">
                  3PT
                </Text>
                <Text className="w-12 text-center text-xs text-surface-500 dark:text-surface-500 font-semibold">
                  FT
                </Text>
              </View>

              {/* Players */}
              <View className="px-3">
                {sortedPlayers.map((player: any, index: number) => (
                  <PlayerStatRow
                    key={player.playerId || index}
                    name={player.name || "Unknown"}
                    number={player.number || 0}
                    minutesPlayed={player.minutesPlayed || 0}
                    points={player.points || 0}
                    rebounds={player.rebounds || 0}
                    assists={player.assists || 0}
                    steals={player.steals || 0}
                    blocks={player.blocks || 0}
                    turnovers={player.turnovers || 0}
                    fouls={player.fouls || 0}
                    fgm={player.fieldGoalsMade || 0}
                    fga={player.fieldGoalsAttempted || 0}
                    threePm={player.threePointersMade || 0}
                    threePa={player.threePointersAttempted || 0}
                    ftm={player.freeThrowsMade || 0}
                    fta={player.freeThrowsAttempted || 0}
                  />
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-surface-50 dark:bg-surface-950">
      {/* Score Header */}
      <View className="bg-surface-100 dark:bg-surface-800/50 p-4 mx-4 mt-4 rounded-xl">
        <View className="flex-row items-center justify-between">
          <View className={`flex-1 items-center ${isAwayWinner ? "opacity-60" : ""}`}>
            <Text className="text-surface-600 dark:text-surface-400 text-sm">
              {homeTeam?.team?.city || "Home"}
            </Text>
            <Text className="text-surface-900 dark:text-white font-bold text-lg" numberOfLines={1}>
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
            <Text className="text-surface-400 dark:text-surface-500 text-sm font-medium">
              {game.status === "completed" ? "FINAL" : game.status?.toUpperCase()}
            </Text>
          </View>

          <View className={`flex-1 items-center ${isHomeWinner ? "opacity-60" : ""}`}>
            <Text className="text-surface-600 dark:text-surface-400 text-sm">
              {awayTeam?.team?.city || "Away"}
            </Text>
            <Text className="text-surface-900 dark:text-white font-bold text-lg" numberOfLines={1}>
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

      {/* Quarter Breakdown */}
      <View className="mx-4 mt-4">
        <QuarterBreakdown
          homeTeamName={homeTeam?.team?.name || "Home"}
          awayTeamName={awayTeam?.team?.name || "Away"}
          scoreByPeriod={(game.gameSettings as any)?.scoreByPeriod}
          currentQuarter={game.currentQuarter || 4}
          homeScore={game.homeScore}
          awayScore={game.awayScore}
        />
      </View>

      {/* Tabs */}
      <View className="flex-row bg-surface-100 dark:bg-surface-800/50 mx-4 mt-4 rounded-xl overflow-hidden">
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
                activeTab === tab.id ? "text-primary-500" : "text-surface-600 dark:text-surface-400"
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
            {/* Team Comparison */}
            <View className="bg-surface-100 dark:bg-surface-800/50 rounded-xl overflow-hidden mb-4">
              {/* Team Headers */}
              <View className="flex-row items-center py-3 px-4 border-b border-surface-200 dark:border-surface-700">
                <Text className="flex-1 text-right text-sm font-bold text-primary-500">
                  {homeTeam?.team?.name}
                </Text>
                <Text className="w-24 text-center text-xs text-surface-500 dark:text-surface-500">
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

            {/* Advanced Stats */}
            <AdvancedStats
              homeStats={
                homeTeam?.players?.map((p: any) => ({
                  id: p.playerId,
                  playerId: p.playerId,
                  player: { id: p.playerId, name: p.name, number: p.number, position: p.position },
                  points: p.points || 0,
                  rebounds: p.rebounds || 0,
                  assists: p.assists || 0,
                  steals: p.steals || 0,
                  blocks: p.blocks || 0,
                  turnovers: p.turnovers || 0,
                  fouls: p.fouls || 0,
                  fieldGoalsMade: p.fieldGoalsMade || 0,
                  fieldGoalsAttempted: p.fieldGoalsAttempted || 0,
                  threePointersMade: p.threePointersMade || 0,
                  threePointersAttempted: p.threePointersAttempted || 0,
                  freeThrowsMade: p.freeThrowsMade || 0,
                  freeThrowsAttempted: p.freeThrowsAttempted || 0,
                  minutesPlayed: p.minutesPlayed || 0,
                  plusMinus: p.plusMinus || 0,
                })) || []
              }
              awayStats={
                awayTeam?.players?.map((p: any) => ({
                  id: p.playerId,
                  playerId: p.playerId,
                  player: { id: p.playerId, name: p.name, number: p.number, position: p.position },
                  points: p.points || 0,
                  rebounds: p.rebounds || 0,
                  assists: p.assists || 0,
                  steals: p.steals || 0,
                  blocks: p.blocks || 0,
                  turnovers: p.turnovers || 0,
                  fouls: p.fouls || 0,
                  fieldGoalsMade: p.fieldGoalsMade || 0,
                  fieldGoalsAttempted: p.fieldGoalsAttempted || 0,
                  threePointersMade: p.threePointersMade || 0,
                  threePointersAttempted: p.threePointersAttempted || 0,
                  freeThrowsMade: p.freeThrowsMade || 0,
                  freeThrowsAttempted: p.freeThrowsAttempted || 0,
                  minutesPlayed: p.minutesPlayed || 0,
                  plusMinus: p.plusMinus || 0,
                })) || []
              }
              homeTeamName={homeTeam?.team?.name || "Home"}
              awayTeamName={awayTeam?.team?.name || "Away"}
            />
          </View>
        )}

        {activeTab === "plays" && (
          <View className="flex-1 p-4">
            <PlayByPlayTab
              events={events.map((event: any) => ({
                id: event._id,
                eventType: event.eventType,
                quarter: event.quarter,
                gameTime: event.gameTime || 0,
                gameTimeDisplay: event.gameTimeDisplay || event.gameTime || "--:--",
                timestamp: event.timestamp || 0,
                description: event.description || event.eventType?.replace(/_/g, " "),
                details: {
                  made: event.details?.made,
                  points: event.details?.points || event.pointsScored,
                  shotType: event.details?.shotType,
                  foulType: event.details?.foulType,
                  assisted: event.details?.assisted,
                  homeScore: event.details?.homeScore,
                  awayScore: event.details?.awayScore,
                  isHomeTeam: event.details?.isHomeTeam,
                },
                player:
                  event.player ||
                  (event.playerId
                    ? {
                        id: event.playerId,
                        name: event.playerName || "Unknown",
                        number: event.playerNumber || 0,
                      }
                    : null),
                team:
                  event.team ||
                  (event.teamId
                    ? {
                        id: event.teamId,
                        name: event.teamName || "",
                      }
                    : null),
              }))}
              isLoading={false}
              currentQuarter={game.currentQuarter || 4}
              playerStats={[
                ...(homeTeam?.players?.map((p: any) => ({
                  playerId: p.player?.id,
                  points: p.points || 0,
                  rebounds: p.rebounds || 0,
                  assists: p.assists || 0,
                  steals: p.steals || 0,
                  blocks: p.blocks || 0,
                  turnovers: p.turnovers || 0,
                  fouls: p.fouls || 0,
                })) || []),
                ...(awayTeam?.players?.map((p: any) => ({
                  playerId: p.player?.id,
                  points: p.points || 0,
                  rebounds: p.rebounds || 0,
                  assists: p.assists || 0,
                  steals: p.steals || 0,
                  blocks: p.blocks || 0,
                  turnovers: p.turnovers || 0,
                  fouls: p.fouls || 0,
                })) || []),
              ]}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
