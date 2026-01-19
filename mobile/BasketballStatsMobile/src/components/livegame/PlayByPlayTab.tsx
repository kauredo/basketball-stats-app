import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Id } from "../../../../../convex/_generated/dataModel";

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

const EVENT_ICONS: Record<string, string> = {
  shot: "🏀",
  freethrow: "🎯",
  foul: "🚫",
  timeout: "⏸️",
  rebound: "⬆️",
  steal: "💨",
  block: "✋",
  turnover: "❌",
  overtime_start: "⏰",
  substitution: "🔄",
  note: "📝",
  quarter_end: "⏰",
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
    return EVENT_ICONS[eventType] || "📋";
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

  const renderEvent = (event: GameEvent, isFirstInGroup: boolean) => (
    <View key={event.id} style={styles.eventContainer}>
      {/* Time Column */}
      <View style={styles.timeColumn}>
        <Text style={styles.quarterText}>{formatQuarter(event.quarter)}</Text>
        <Text style={styles.timeText}>{event.gameTimeDisplay}</Text>
      </View>

      {/* Icon Column */}
      <View style={[styles.iconColumn, { backgroundColor: getEventColor(event.eventType) + "20" }]}>
        <Text style={styles.eventIcon}>{getEventIcon(event.eventType)}</Text>
      </View>

      {/* Description Column */}
      <View style={styles.descriptionColumn}>
        <Text style={styles.descriptionText}>{event.description}</Text>
        {event.team && (
          <Text style={styles.teamText}>{event.team.name}</Text>
        )}
      </View>
    </View>
  );

  const renderQuarterHeader = (quarter: number) => (
    <View style={styles.quarterHeader}>
      <View style={styles.quarterHeaderLine} />
      <Text style={styles.quarterHeaderText}>{formatQuarter(quarter)}</Text>
      <View style={styles.quarterHeaderLine} />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📋</Text>
      <Text style={styles.emptyStateText}>No events recorded yet</Text>
      <Text style={styles.emptyStateSubtext}>
        Events will appear here as the game progresses
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Quarter Filter */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={QUARTER_FILTERS}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedQuarter === item.key && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedQuarter(item.key)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedQuarter === item.key && styles.filterButtonTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Events List */}
      <FlatList
        data={groupedEvents}
        keyExtractor={(item) => item.quarter.toString()}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor="#F97316"
          />
        }
        renderItem={({ item: group }) => (
          <View>
            {renderQuarterHeader(group.quarter)}
            {group.events.map((event, index) =>
              renderEvent(event, index === 0)
            )}
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  filterList: {
    paddingHorizontal: 8,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#374151",
  },
  filterButtonActive: {
    backgroundColor: "#F97316",
  },
  filterButtonText: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "600",
  },
  filterButtonTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    paddingBottom: 16,
  },
  quarterHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  quarterHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#374151",
  },
  quarterHeaderText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
    marginHorizontal: 12,
  },
  eventContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
  },
  timeColumn: {
    width: 50,
    alignItems: "center",
  },
  quarterText: {
    color: "#6B7280",
    fontSize: 10,
    fontWeight: "500",
  },
  timeText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  iconColumn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
  },
  eventIcon: {
    fontSize: 16,
  },
  descriptionColumn: {
    flex: 1,
    justifyContent: "center",
  },
  descriptionText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  teamText: {
    color: "#6B7280",
    fontSize: 11,
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
  },
});
