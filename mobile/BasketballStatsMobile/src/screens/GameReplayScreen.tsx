import React, { useState, useMemo, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, FlatList, Dimensions } from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "convex/react";
import Slider from "@react-native-community/slider";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import Icon, { type IconName } from "../components/Icon";
import { MiniCourt, type ShotMarker } from "../components/court/MiniCourt";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { BasketballUtils } from "@basketball-stats/shared";

type GameReplayRouteProp = RouteProp<RootStackParamList, "GameReplay">;
type GameReplayNavigationProp = NativeStackNavigationProp<RootStackParamList, "GameReplay">;

// Matches the actual API response from api.games.getGameEvents
interface GameEvent {
  id: Id<"gameEvents">;
  eventType: string;
  quarter: number;
  gameTime: number; // This is gameTimeSeconds
  gameTimeDisplay: string;
  timestamp: number;
  description: string;
  details: {
    points?: number;
    shotType?: string;
    made?: boolean;
    x?: number;
    y?: number;
    homeScore?: number;
    awayScore?: number;
  };
  player: {
    id: Id<"players">;
    name: string;
    number: number;
  } | null;
  team: {
    id: Id<"teams">;
    name: string;
  } | null;
}

export default function GameReplayScreen() {
  const route = useRoute<GameReplayRouteProp>();
  const navigation = useNavigation<GameReplayNavigationProp>();
  const { gameId } = route.params;
  const { token } = useAuth();

  const [selectedTime, setSelectedTime] = useState(0);
  const [selectedQuarter, setSelectedQuarter] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch game data
  const gameData = useQuery(
    api.games.get,
    token ? { token, gameId: gameId as Id<"games"> } : "skip"
  );

  // Fetch game events
  const gameEvents = useQuery(
    api.games.getGameEvents,
    token ? { token, gameId: gameId as Id<"games"> } : "skip"
  );

  const game = gameData?.game;
  const events = gameEvents?.events || [];

  // Sort events by time (earliest first for replay)
  const sortedEvents = useMemo((): GameEvent[] => {
    return [...events].sort((a: GameEvent, b: GameEvent) => {
      // First by quarter
      if (a.quarter !== b.quarter) return a.quarter - b.quarter;
      // Then by game time (higher time = earlier in quarter)
      return b.gameTime - a.gameTime;
    });
  }, [events]);

  // Calculate total game duration for slider
  const totalDuration = useMemo(() => {
    if (!game) return 0;
    const quarterMinutes = (game.gameSettings as { quarterMinutes?: number })?.quarterMinutes || 12;
    const totalQuarters = game.currentQuarter || 4;
    return totalQuarters * quarterMinutes * 60;
  }, [game]);

  // Get events up to selected time
  const eventsUpToTime = useMemo((): GameEvent[] => {
    if (!game) return [];
    const quarterMinutes = (game.gameSettings as { quarterMinutes?: number })?.quarterMinutes || 12;

    return sortedEvents.filter((event: GameEvent) => {
      const eventTotalSeconds =
        (event.quarter - 1) * quarterMinutes * 60 + (quarterMinutes * 60 - event.gameTime);
      return eventTotalSeconds <= selectedTime;
    });
  }, [sortedEvents, selectedTime, game]);

  // Calculate scores at selected time
  const scoresAtTime = useMemo(() => {
    let homeScore = 0;
    let awayScore = 0;

    eventsUpToTime.forEach((event: GameEvent) => {
      const points = event.details?.points;
      if (points) {
        if (event.team?.id === game?.homeTeam?.id) {
          homeScore += points;
        } else {
          awayScore += points;
        }
      }
    });

    return { homeScore, awayScore };
  }, [eventsUpToTime, game]);

  // Get shots for court visualization
  const shotsUpToTime = useMemo((): ShotMarker[] => {
    return eventsUpToTime
      .filter(
        (e: GameEvent) =>
          e.eventType === "shot" && e.details?.x !== undefined && e.details?.y !== undefined
      )
      .map((e: GameEvent) => ({
        x: e.details.x!,
        y: e.details.y!,
        made: e.details.made || false,
        is3pt: e.details.shotType === "3pt",
        playerId: e.player?.id,
      }));
  }, [eventsUpToTime]);

  // Format time display
  const formatSliderTime = (seconds: number) => {
    if (!game) return "0:00";
    const quarterMinutes = (game.gameSettings as any)?.quarterMinutes || 12;
    const quarterSeconds = quarterMinutes * 60;

    const quarter = Math.floor(seconds / quarterSeconds) + 1;
    const timeInQuarter = quarterSeconds - (seconds % quarterSeconds);

    const mins = Math.floor(timeInQuarter / 60);
    const secs = timeInQuarter % 60;

    return `Q${quarter} ${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle play/pause
  const togglePlay = () => {
    if (isPlaying) {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      playIntervalRef.current = setInterval(() => {
        setSelectedTime((prev) => {
          if (prev >= totalDuration) {
            if (playIntervalRef.current) {
              clearInterval(playIntervalRef.current);
              playIntervalRef.current = null;
            }
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 100); // 10x speed
    }
  };

  // Jump to event
  const jumpToEvent = (event: GameEvent) => {
    if (!game) return;
    const quarterMinutes = (game.gameSettings as { quarterMinutes?: number })?.quarterMinutes || 12;
    const eventTotalSeconds =
      (event.quarter - 1) * quarterMinutes * 60 + (quarterMinutes * 60 - event.gameTime);
    setSelectedTime(eventTotalSeconds);
  };

  // Get event icon
  const getEventIcon = (eventType: string): IconName => {
    switch (eventType) {
      case "shot":
        return "target";
      case "rebound":
        return "refresh";
      case "assist":
        return "users";
      case "steal":
        return "shield";
      case "block":
        return "hand";
      case "turnover":
        return "alert-triangle";
      case "foul":
        return "flag";
      case "free_throw":
        return "disc";
      case "substitution":
        return "repeat";
      default:
        return "activity";
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, []);

  if (!game) {
    return (
      <View className="flex-1 bg-surface-50 dark:bg-surface-950 items-center justify-center">
        <Text className="text-surface-500">Loading...</Text>
      </View>
    );
  }

  const screenWidth = Dimensions.get("window").width;

  return (
    <View className="flex-1 bg-surface-50 dark:bg-surface-950">
      {/* Header */}
      <View className="bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800">
        <View className="flex-row items-center px-4 py-3">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
            <Icon name="arrow-left" size={24} color="#64748B" />
          </TouchableOpacity>
          <View className="flex-1 ml-2">
            <Text className="text-lg font-bold text-surface-900 dark:text-white">Game Replay</Text>
            <Text className="text-sm text-surface-500">
              {game.homeTeam?.name} vs {game.awayTeam?.name}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Score Display */}
        <View className="bg-white dark:bg-surface-900 mx-4 mt-4 rounded-xl p-4">
          <View className="flex-row items-center justify-between">
            <View className="items-center flex-1">
              <Text className="text-surface-500 text-sm mb-1">{game.homeTeam?.name || "Home"}</Text>
              <Text className="text-4xl font-bold text-surface-900 dark:text-white">
                {scoresAtTime.homeScore}
              </Text>
            </View>
            <View className="items-center px-4">
              <Text className="text-surface-400 text-lg">vs</Text>
              <Text className="text-primary-500 font-bold mt-1">
                {formatSliderTime(selectedTime)}
              </Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-surface-500 text-sm mb-1">{game.awayTeam?.name || "Away"}</Text>
              <Text className="text-4xl font-bold text-surface-900 dark:text-white">
                {scoresAtTime.awayScore}
              </Text>
            </View>
          </View>
        </View>

        {/* Shot Chart */}
        <View className="bg-white dark:bg-surface-900 mx-4 mt-4 rounded-xl p-4">
          <Text className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">
            Shot Chart at {formatSliderTime(selectedTime)}
          </Text>
          <View className="items-center">
            <MiniCourt shots={shotsUpToTime} displayMode="all" showHeatmap={false} />
          </View>
        </View>

        {/* Timeline Slider */}
        <View className="bg-white dark:bg-surface-900 mx-4 mt-4 rounded-xl p-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm text-surface-500">Start</Text>
            <Text className="text-sm font-medium text-primary-500">
              {formatSliderTime(selectedTime)}
            </Text>
            <Text className="text-sm text-surface-500">End</Text>
          </View>
          <Slider
            value={selectedTime}
            onValueChange={setSelectedTime}
            minimumValue={0}
            maximumValue={totalDuration}
            step={1}
            minimumTrackTintColor="#F97316"
            maximumTrackTintColor="#E2E8F0"
            thumbTintColor="#F97316"
          />
          <View className="flex-row items-center justify-center gap-4 mt-4">
            <TouchableOpacity
              onPress={() => setSelectedTime(Math.max(0, selectedTime - 60))}
              className="bg-surface-100 dark:bg-surface-800 p-3 rounded-full"
            >
              <Icon name="rewind" size={20} color="#64748B" />
            </TouchableOpacity>
            <TouchableOpacity onPress={togglePlay} className="bg-primary-500 p-4 rounded-full">
              <Icon name={isPlaying ? "pause" : "play"} size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedTime(Math.min(totalDuration, selectedTime + 60))}
              className="bg-surface-100 dark:bg-surface-800 p-3 rounded-full"
            >
              <Icon name="fast-forward" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quarter Filter */}
        <View className="flex-row items-center gap-2 px-4 mt-4">
          <TouchableOpacity
            onPress={() => setSelectedQuarter(null)}
            className={`px-4 py-2 rounded-full ${
              selectedQuarter === null ? "bg-primary-500" : "bg-surface-100 dark:bg-surface-800"
            }`}
          >
            <Text
              className={`font-medium ${
                selectedQuarter === null ? "text-white" : "text-surface-600 dark:text-surface-400"
              }`}
            >
              All
            </Text>
          </TouchableOpacity>
          {[1, 2, 3, 4].map((q) => (
            <TouchableOpacity
              key={q}
              onPress={() => setSelectedQuarter(q)}
              className={`px-4 py-2 rounded-full ${
                selectedQuarter === q ? "bg-primary-500" : "bg-surface-100 dark:bg-surface-800"
              }`}
            >
              <Text
                className={`font-medium ${
                  selectedQuarter === q ? "text-white" : "text-surface-600 dark:text-surface-400"
                }`}
              >
                Q{q}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Events List */}
        <View className="bg-white dark:bg-surface-900 mx-4 mt-4 mb-6 rounded-xl">
          <View className="px-4 py-3 border-b border-surface-100 dark:border-surface-800">
            <Text className="font-semibold text-surface-900 dark:text-white">
              Play-by-Play ({sortedEvents.length} events)
            </Text>
          </View>
          {sortedEvents
            .filter((e: GameEvent) => selectedQuarter === null || e.quarter === selectedQuarter)
            .map((event: GameEvent) => {
              const isActive = eventsUpToTime.some((e: GameEvent) => e.id === event.id);
              const points = event.details?.points;
              const made = event.details?.made;
              return (
                <TouchableOpacity
                  key={event.id}
                  onPress={() => jumpToEvent(event)}
                  className={`flex-row items-center px-4 py-3 border-b border-surface-50 dark:border-surface-800 ${
                    isActive ? "bg-primary-50 dark:bg-primary-900/20" : ""
                  }`}
                >
                  <View
                    className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                      isActive ? "bg-primary-500" : "bg-surface-100 dark:bg-surface-700"
                    }`}
                  >
                    <Icon
                      name={getEventIcon(event.eventType)}
                      size={14}
                      color={isActive ? "#FFFFFF" : "#64748B"}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`font-medium ${
                        isActive
                          ? "text-primary-600 dark:text-primary-400"
                          : "text-surface-900 dark:text-white"
                      }`}
                    >
                      {event.description || event.eventType}
                    </Text>
                    <Text className="text-xs text-surface-500">
                      Q{event.quarter} {BasketballUtils.formatGameTime(event.gameTime)} •{" "}
                      {event.player?.name || event.team?.name || ""}
                    </Text>
                  </View>
                  {points && points > 0 && (
                    <View
                      className={`px-2 py-1 rounded ${
                        made ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
                      }`}
                    >
                      <Text
                        className={`text-sm font-bold ${
                          made
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        +{points}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          {sortedEvents.length === 0 && (
            <View className="py-8 items-center">
              <Icon name="film" size={40} color="#94A3B8" />
              <Text className="text-surface-500 mt-2">No events recorded</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
