import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import type { Id } from "../../../../../convex/_generated/dataModel";
import Icon, { IconName } from "../Icon";

interface GameEvent {
  id: Id<"gameEvents">;
  eventType: string;
  quarter: number;
  gameTime: number;
  gameTimeDisplay: string;
  timestamp: number;
  description: string;
  details?: {
    made?: boolean;
    points?: number;
    shotType?: string;
    foulType?: string;
    assisted?: boolean;
    homeScore?: number;
    awayScore?: number;
    isHomeTeam?: boolean;
  };
  player?: {
    id: Id<"players">;
    name: string;
    number: number;
  } | null;
  team?: {
    id: Id<"teams">;
    name: string;
  } | null;
}

interface PlayerStat {
  playerId: Id<"players">;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
}

interface PlayByPlayTabProps {
  events: GameEvent[] | undefined;
  isLoading: boolean;
  currentQuarter: number;
  playerStats?: PlayerStat[];
  onRefresh?: () => void;
}

// Event configuration with icons and colors
const EVENT_CONFIG: Record<string, { icon: IconName; color: string }> = {
  shot: { icon: "basketball", color: "#22C55E" },
  freethrow: { icon: "basketball", color: "#3B82F6" },
  foul: { icon: "alert", color: "#EF4444" },
  timeout: { icon: "timer", color: "#F59E0B" },
  rebound: { icon: "stats", color: "#8B5CF6" },
  steal: { icon: "play", color: "#06B6D4" },
  block: { icon: "stop", color: "#06B6D4" },
  turnover: { icon: "close", color: "#EF4444" },
  overtime_start: { icon: "timer", color: "#F97316" },
  substitution: { icon: "users", color: "#6B7280" },
  note: { icon: "list", color: "#6B7280" },
  quarter_end: { icon: "timer", color: "#6B7280" },
};

const DEFAULT_CONFIG = { icon: "list" as IconName, color: "#6B7280" };

// Generate dynamic quarter filters based on current quarter (supports OT)
const getQuarterFilters = (currentQuarter: number) => {
  const filters = [
    { key: "all", label: "All" },
    { key: "1", label: "Q1" },
    { key: "2", label: "Q2" },
    { key: "3", label: "Q3" },
    { key: "4", label: "Q4" },
  ];

  // Add dynamic OT tabs if we're in overtime
  const numPeriods = Math.max(4, currentQuarter);
  for (let i = 5; i <= numPeriods; i++) {
    filters.push({ key: String(i), label: `OT${i - 4}` });
  }

  return filters;
};

export default function PlayByPlayTab({
  events,
  isLoading,
  currentQuarter,
  playerStats = [],
  onRefresh,
}: PlayByPlayTabProps) {
  const [selectedQuarter, setSelectedQuarter] = useState<string>("all");
  const quarterFilters = getQuarterFilters(currentQuarter);

  const filteredEvents = events?.filter((event) => {
    if (selectedQuarter === "all") return true;
    return event.quarter === parseInt(selectedQuarter);
  });

  const formatQuarter = (quarter: number): string => {
    if (quarter <= 4) return `Q${quarter}`;
    return `OT${quarter - 4}`;
  };

  // Group events by quarter for section headers
  const groupedEvents: { quarter: number; events: GameEvent[] }[] = [];
  let currentGroup: { quarter: number; events: GameEvent[] } | null = null;

  filteredEvents?.forEach((event) => {
    if (!currentGroup || currentGroup.quarter !== event.quarter) {
      if (currentGroup) {
        groupedEvents.push(currentGroup);
      }
      currentGroup = { quarter: event.quarter, events: [] };
    }
    currentGroup.events.push(event);
  });

  if (currentGroup) {
    groupedEvents.push(currentGroup);
  }

  // Get cumulative stat for player based on event type
  const getPlayerStatLine = (event: GameEvent): string | null => {
    if (!event.player) return null;

    const stat = playerStats.find((s) => s.playerId === event.player?.id);
    if (!stat) return null;

    switch (event.eventType) {
      case "shot":
      case "freethrow":
        return `${stat.points} points`;
      case "foul":
        return `${stat.fouls} fouls`;
      case "rebound":
        return `${stat.rebounds} rebounds`;
      case "assist":
        return `${stat.assists} assists`;
      case "steal":
        return `${stat.steals} steals`;
      case "block":
        return `${stat.blocks} blocks`;
      case "turnover":
        return `${stat.turnovers} turnovers`;
      default:
        return null;
    }
  };

  // Format score display with scorer's team bold
  const getScoreDisplay = (event: GameEvent): { home: string; away: string } | null => {
    const details = event.details;
    if (!details || details.homeScore === undefined || details.awayScore === undefined) {
      return null;
    }
    // Only show score for scoring events
    if (details.points === undefined || details.points <= 0) {
      return null;
    }
    return {
      home: String(details.homeScore),
      away: String(details.awayScore),
    };
  };

  const renderEvent = (event: GameEvent) => {
    const config = EVENT_CONFIG[event.eventType] || DEFAULT_CONFIG;
    const statLine = getPlayerStatLine(event);
    const scoreDisplay = getScoreDisplay(event);
    const isHomeTeam = event.details?.isHomeTeam ?? false;

    // Team colors: orange for home, blue for away
    const teamBorderColor = isHomeTeam ? "#f97316" : "#3b82f6";

    return (
      <View
        key={event.id}
        className="flex-row items-start border-b border-surface-200 dark:border-surface-700"
      >
        {/* Colored left border for team indicator */}
        <View className="w-1 self-stretch" style={{ backgroundColor: teamBorderColor }} />

        {/* Time Column */}
        <View className="w-12 items-center flex-shrink-0 py-2.5 pl-2">
          <Text className="text-surface-500 dark:text-surface-500 text-[10px] font-medium">
            {formatQuarter(event.quarter)}
          </Text>
          <Text className="text-surface-700 dark:text-surface-300 text-xs font-semibold font-mono">
            {event.gameTimeDisplay}
          </Text>
        </View>

        {/* Icon Column */}
        <View
          className="w-7 h-7 rounded-full justify-center items-center mx-2 flex-shrink-0 mt-2"
          style={{ backgroundColor: config.color + "20" }}
        >
          <Icon name={config.icon} size={14} color={config.color} />
        </View>

        {/* Content Column */}
        <View className="flex-1 justify-center py-2.5 pr-3">
          <Text className="text-surface-900 dark:text-white text-sm leading-snug">
            {event.description}
          </Text>
          {/* Show cumulative stat total and score */}
          <View className="flex-row items-center mt-0.5 flex-wrap">
            {statLine && (
              <Text className="text-surface-500 dark:text-surface-400 text-xs font-medium">
                {statLine}
              </Text>
            )}
            {scoreDisplay && (
              <Text className="text-surface-500 dark:text-surface-400 text-xs ml-2">
                (
                <Text
                  className={isHomeTeam ? "font-bold text-surface-700 dark:text-surface-200" : ""}
                >
                  {scoreDisplay.home}
                </Text>
                {" - "}
                <Text
                  className={!isHomeTeam ? "font-bold text-surface-700 dark:text-surface-200" : ""}
                >
                  {scoreDisplay.away}
                </Text>
                )
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View className="items-center py-8 px-6 flex-1 justify-center">
      <View className="w-12 h-12 rounded-full bg-surface-200 dark:bg-surface-700 justify-center items-center mb-3">
        <Icon name="list" size={24} color="#6B7280" />
      </View>
      <Text className="text-surface-900 dark:text-white text-sm font-semibold mb-1">
        No events recorded yet
      </Text>
      <Text className="text-surface-500 dark:text-surface-400 text-xs text-center">
        Events will appear here as the game progresses
      </Text>
    </View>
  );

  // Flatten events for simple list rendering
  const flattenedEvents = groupedEvents.flatMap((group) => group.events);

  return (
    <View className="flex-1 bg-surface-50 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
      {/* Quarter Filter - Dynamic OT tabs based on current quarter */}
      <View className="flex-row items-center border-b border-surface-200 dark:border-surface-700 px-3 py-2">
        {quarterFilters.map((item) => (
          <TouchableOpacity
            key={item.key}
            className={`px-3 py-1.5 rounded-full mr-2 ${
              selectedQuarter === item.key ? "bg-primary-500" : "bg-surface-200 dark:bg-surface-700"
            }`}
            onPress={() => setSelectedQuarter(item.key)}
          >
            <Text
              className={`text-xs font-semibold ${
                selectedQuarter === item.key
                  ? "text-white"
                  : "text-surface-600 dark:text-surface-400"
              }`}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Events List - Clean flat list without quarter dividers */}
      <FlatList
        data={flattenedEvents}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#F97316" />
        }
        renderItem={({ item: event }) => renderEvent(event)}
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </View>
  );
}
