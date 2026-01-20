import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { Id } from "../../../../../convex/_generated/dataModel";
import Icon from "../Icon";

interface GameEvent {
  id: Id<"gameEvents">;
  eventType: string;
  quarter: number;
  gameTime: number;
  gameTimeDisplay: string;
  timestamp: number;
  description: string;
  details?: any;
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

interface PlayByPlayTabProps {
  events: GameEvent[] | undefined;
  isLoading: boolean;
  currentQuarter: number;
  onRefresh?: () => void;
}

// Map event types to icon names
const EVENT_ICONS: Record<string, string> = {
  shot: "basketball",
  freethrow: "basketball",
  foul: "close",
  timeout: "timer",
  rebound: "stats",
  steal: "play",
  block: "stop",
  turnover: "close",
  overtime_start: "timer",
  substitution: "users",
  note: "list",
  quarter_end: "timer",
};

const QUARTER_FILTERS = [
  { key: "all", label: "All" },
  { key: "1", label: "Q1" },
  { key: "2", label: "Q2" },
  { key: "3", label: "Q3" },
  { key: "4", label: "Q4" },
  { key: "ot", label: "OT" },
];

export default function PlayByPlayTab({
  events,
  isLoading,
  currentQuarter,
  onRefresh,
}: PlayByPlayTabProps) {
  const [selectedQuarter, setSelectedQuarter] = useState<string>("all");

  const filteredEvents = events?.filter((event) => {
    if (selectedQuarter === "all") return true;
    if (selectedQuarter === "ot") return event.quarter > 4;
    return event.quarter === parseInt(selectedQuarter);
  });

  const formatQuarter = (quarter: number): string => {
    if (quarter <= 4) return `Q${quarter}`;
    return `OT${quarter - 4}`;
  };

  const getEventIcon = (eventType: string): string => {
    return EVENT_ICONS[eventType] || "list";
  };

  const getEventColor = (eventType: string): string => {
    switch (eventType) {
      case "shot":
        return "#22C55E";
      case "freethrow":
        return "#3B82F6";
      case "foul":
        return "#EF4444";
      case "timeout":
        return "#F59E0B";
      case "turnover":
        return "#EF4444";
      case "steal":
      case "block":
        return "#06B6D4";
      case "rebound":
        return "#8B5CF6";
      default:
        return "#6B7280";
    }
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

  const getEventDetails = (event: GameEvent): string | null => {
    if (!event.details) return null;
    const { made, points, shotType, foulType, assisted } = event.details;
    const parts: string[] = [];

    if (event.eventType === "shot" || event.eventType === "freethrow") {
      if (made !== undefined) {
        parts.push(made ? "Made" : "Missed");
      }
      if (shotType) {
        parts.push(shotType === "3pt" ? "3PT" : shotType === "2pt" ? "2PT" : "FT");
      }
      if (points !== undefined && made) {
        parts.push(`+${points} pts`);
      }
      if (assisted) {
        parts.push("Assisted");
      }
    } else if (event.eventType === "foul" && foulType) {
      parts.push(foulType.charAt(0).toUpperCase() + foulType.slice(1));
    }

    return parts.length > 0 ? parts.join(" • ") : null;
  };

  const renderEvent = (event: GameEvent) => {
    const details = getEventDetails(event);
    const iconColor = getEventColor(event.eventType);

    return (
      <View
        key={event.id}
        className="flex-row px-3 py-2 border-b border-gray-200 dark:border-gray-700"
      >
        {/* Time Column */}
        <View className="w-12 items-center">
          <Text className="text-gray-500 dark:text-gray-500 text-[10px] font-medium">
            {formatQuarter(event.quarter)}
          </Text>
          <Text className="text-gray-700 dark:text-gray-300 text-xs font-semibold">
            {event.gameTimeDisplay}
          </Text>
        </View>

        {/* Icon Column */}
        <View
          className="w-7 h-7 rounded-full justify-center items-center mx-2"
          style={{ backgroundColor: iconColor + "20" }}
        >
          <Icon name={getEventIcon(event.eventType) as any} size={14} color={iconColor} />
        </View>

        {/* Description Column */}
        <View className="flex-1 justify-center">
          <Text className="text-gray-900 dark:text-white text-sm">{event.description}</Text>
          {/* Player Info */}
          {event.player && (
            <Text className="text-gray-600 dark:text-gray-400 text-xs font-medium mt-0.5">
              #{event.player.number} {event.player.name}
            </Text>
          )}
          {/* Event Details (made/missed, points, etc.) */}
          {details && (
            <Text className="text-primary-500 text-[11px] font-semibold mt-0.5">{details}</Text>
          )}
          {/* Team Name */}
          {event.team && (
            <Text className="text-gray-500 dark:text-gray-500 text-[11px] mt-0.5">
              {event.team.name}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderQuarterHeader = (quarter: number) => (
    <View className="flex-row items-center py-2 px-3">
      <View className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
      <Text className="text-gray-500 dark:text-gray-400 text-[11px] font-semibold mx-2">
        {formatQuarter(quarter)}
      </Text>
      <View className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
    </View>
  );

  const renderEmptyState = () => (
    <View className="items-center py-8 px-6">
      <View className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 justify-center items-center mb-3">
        <Icon name="list" size={24} color="#6B7280" />
      </View>
      <Text className="text-gray-900 dark:text-white text-sm font-semibold mb-1">
        No events recorded yet
      </Text>
      <Text className="text-gray-500 dark:text-gray-400 text-xs text-center">
        Events will appear here as the game progresses
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      {/* Quarter Filter */}
      <View className="flex-row items-center border-b border-gray-200 dark:border-gray-700 px-3 py-1.5">
        {QUARTER_FILTERS.map((item) => (
          <TouchableOpacity
            key={item.key}
            className={`px-3 py-1.5 rounded-full mr-2 ${
              selectedQuarter === item.key ? "bg-primary-500" : "bg-gray-200 dark:bg-gray-700"
            }`}
            onPress={() => setSelectedQuarter(item.key)}
          >
            <Text
              className={`text-xs font-semibold ${
                selectedQuarter === item.key ? "text-white" : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Events List */}
      <FlatList
        data={groupedEvents}
        keyExtractor={(item) => item.quarter.toString()}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#F97316" />
        }
        renderItem={({ item: group }) => (
          <View>
            {renderQuarterHeader(group.quarter)}
            {group.events.map((event) => renderEvent(event))}
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 16, flexGrow: 1 }}
      />
    </View>
  );
}
