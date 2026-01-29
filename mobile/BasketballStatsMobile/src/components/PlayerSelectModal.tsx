import React, { useState, useMemo, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, SectionList } from "react-native";
import Icon from "./Icon";
import { BaseModal, ModalHeader } from "./ui";
import type { Id } from "../../../../convex/_generated/dataModel";

export interface PlayerOption {
  id: Id<"players">;
  name: string;
  team: string;
  teamId?: Id<"teams">;
  number: number;
  position?: string;
}

interface PlayerSelectModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (player: PlayerOption) => void;
  players: PlayerOption[];
  excludeIds?: Id<"players">[];
  selectedId?: Id<"players"> | null;
  title?: string;
}

interface TeamSection {
  title: string;
  data: PlayerOption[];
}

/**
 * Enhanced player selection modal with search and team grouping.
 * Designed for large leagues with many teams and players.
 */
export function PlayerSelectModal({
  visible,
  onClose,
  onSelect,
  players,
  excludeIds = [],
  selectedId,
  title = "Select Player",
}: PlayerSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<TextInput>(null);

  // Reset search when modal closes
  useEffect(() => {
    if (!visible) {
      setSearchQuery("");
    }
  }, [visible]);

  // Focus search input when modal opens
  useEffect(() => {
    if (visible && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 300);
    }
  }, [visible]);

  // Filter and group players by team
  const sections: TeamSection[] = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    // Filter players
    const filtered = players.filter((player) => {
      if (excludeIds.includes(player.id)) return false;
      if (!query) return true;

      return (
        player.name.toLowerCase().includes(query) ||
        player.team.toLowerCase().includes(query) ||
        player.number.toString().includes(query) ||
        (player.position?.toLowerCase().includes(query) ?? false)
      );
    });

    // Group by team
    const groups: Record<string, PlayerOption[]> = {};
    for (const player of filtered) {
      if (!groups[player.team]) {
        groups[player.team] = [];
      }
      groups[player.team].push(player);
    }

    // Sort teams alphabetically, sort players by number within team
    const sortedTeams = Object.keys(groups).sort();
    return sortedTeams.map((teamName) => ({
      title: teamName,
      data: groups[teamName].sort((a, b) => a.number - b.number),
    }));
  }, [players, searchQuery, excludeIds]);

  const totalFilteredCount = sections.reduce((sum, s) => sum + s.data.length, 0);

  const renderSectionHeader = ({ section }: { section: TeamSection }) => (
    <View className="px-4 py-2 bg-surface-100 dark:bg-surface-700/50">
      <Text className="text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase tracking-wide">
        {section.title}
      </Text>
    </View>
  );

  const renderPlayer = ({ item: player }: { item: PlayerOption }) => {
    const isSelected = player.id === selectedId;

    return (
      <TouchableOpacity
        className={`px-4 py-3 flex-row items-center border-b border-surface-100 dark:border-surface-700 ${
          isSelected ? "bg-primary-500/10" : ""
        }`}
        onPress={() => {
          onSelect(player);
          onClose();
        }}
      >
        <View
          className={`w-11 h-11 rounded-xl justify-center items-center mr-3 ${
            isSelected ? "bg-primary-500" : "bg-surface-200 dark:bg-surface-700"
          }`}
        >
          <Text
            className={`font-bold text-sm ${
              isSelected ? "text-white" : "text-surface-700 dark:text-surface-300"
            }`}
          >
            #{player.number}
          </Text>
        </View>
        <View className="flex-1">
          <Text
            className={`font-medium text-base ${
              isSelected ? "text-primary-500" : "text-surface-900 dark:text-white"
            }`}
          >
            {player.name}
          </Text>
          {player.position && (
            <Text className="text-surface-500 dark:text-surface-400 text-xs">
              {player.position}
            </Text>
          )}
        </View>
        {isSelected && <View className="w-2 h-2 rounded-full bg-primary-500 mr-2" />}
      </TouchableOpacity>
    );
  };

  return (
    <BaseModal visible={visible} onClose={onClose} title={title} maxWidth="lg">
      <ModalHeader title={title} onClose={onClose} />

      {/* Search */}
      <View className="px-4 py-3 border-b border-surface-200 dark:border-surface-700">
        <View className="flex-row items-center bg-surface-100 dark:bg-surface-700 rounded-xl px-3 py-2">
          <Icon name="search" size={20} color="#9CA3AF" />
          <TextInput
            ref={searchInputRef}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name, team, or number..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-2 text-surface-900 dark:text-white text-base py-1"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Icon name="close" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        <Text className="text-xs text-surface-500 dark:text-surface-400 mt-2">
          {totalFilteredCount} player{totalFilteredCount !== 1 ? "s" : ""} found
        </Text>
      </View>

      {/* Player List */}
      {sections.length === 0 ? (
        <View className="py-12 items-center">
          <Icon name="user" size={32} color="#9CA3AF" />
          <Text className="text-surface-600 dark:text-surface-400 font-medium mt-3">
            No players found
          </Text>
          <Text className="text-surface-500 text-sm mt-1">Try adjusting your search</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderPlayer}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          style={{ maxHeight: 400 }}
        />
      )}
    </BaseModal>
  );
}

export default PlayerSelectModal;
