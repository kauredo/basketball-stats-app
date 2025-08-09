import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { League, basketballAPI } from "@basketball-stats/shared";
import { useAuthStore } from "../../hooks/useAuthStore";

export default function LeagueSelectionScreen() {
  const {
    userLeagues,
    selectedLeague,
    selectLeague,
    joinLeague,
    joinLeagueByCode,
    loadUserLeagues,
    isLoading,
  } = useAuthStore();
  const [availableLeagues, setAvailableLeagues] = useState<League[]>([]);
  const [inviteCode, setInviteCode] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);

  useEffect(() => {
    loadAvailableLeagues();
  }, []);

  const loadAvailableLeagues = async () => {
    try {
      const response = await basketballAPI.getLeagues();
      const publicLeagues = response.leagues.filter(
        (league: League) =>
          league.is_public && !userLeagues.some(ul => ul.id === league.id)
      );
      setAvailableLeagues(publicLeagues);
    } catch (error) {
      console.error("Failed to load available leagues:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadUserLeagues();
      await loadAvailableLeagues();
    } finally {
      setRefreshing(false);
    }
  };

  const handleJoinLeague = async (leagueId: number) => {
    try {
      await joinLeague(leagueId);
      await loadAvailableLeagues();
      Alert.alert("Success", "Successfully joined the league!");
    } catch (error) {
      console.error("Failed to join league:", error);
    }
  };

  const handleJoinByCode = async () => {
    if (!inviteCode.trim()) {
      Alert.alert("Error", "Please enter an invite code");
      return;
    }

    try {
      await joinLeagueByCode(inviteCode.trim());
      setInviteCode("");
      setShowJoinForm(false);
      await loadAvailableLeagues();
      Alert.alert("Success", "Successfully joined the league!");
    } catch (error) {
      console.error("Failed to join league by code:", error);
    }
  };

  const renderUserLeague = ({ item: league }: { item: League }) => {
    const isSelected = selectedLeague?.id === league.id;

    return (
      <TouchableOpacity
        style={[styles.leagueCard, isSelected && styles.selectedLeagueCard]}
        onPress={() => selectLeague(league)}
      >
        <View style={styles.leagueHeader}>
          <Text style={styles.leagueName}>{league.name}</Text>
          <View style={styles.leagueTypeBadge}>
            <Text style={styles.leagueTypeText}>{league.league_type}</Text>
          </View>
        </View>

        {league.description && (
          <Text style={styles.leagueDescription} numberOfLines={2}>
            {league.description}
          </Text>
        )}

        <View style={styles.leagueStats}>
          <Text style={styles.leagueStatText}>
            {league.teams_count || 0} teams • {league.members_count || 0}{" "}
            members
          </Text>
          <Text style={styles.leagueSeason}>Season: {league.season}</Text>
        </View>

        {league.membership && (
          <View style={styles.membershipBadge}>
            <Text style={styles.membershipText}>
              {league.membership.display_role}
            </Text>
          </View>
        )}

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedText}>✓ Selected</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderAvailableLeague = ({ item: league }: { item: League }) => (
    <TouchableOpacity
      style={styles.availableLeagueCard}
      onPress={() => handleJoinLeague(league.id)}
    >
      <View style={styles.leagueHeader}>
        <Text style={styles.leagueName}>{league.name}</Text>
        <View style={[styles.leagueTypeBadge, styles.publicBadge]}>
          <Text style={styles.leagueTypeText}>Public</Text>
        </View>
      </View>

      {league.description && (
        <Text style={styles.leagueDescription} numberOfLines={2}>
          {league.description}
        </Text>
      )}

      <View style={styles.leagueStats}>
        <Text style={styles.leagueStatText}>
          {league.teams_count || 0} teams • {league.members_count || 0} members
        </Text>
      </View>

      <TouchableOpacity
        style={styles.joinButton}
        onPress={() => handleJoinLeague(league.id)}
      >
        <Text style={styles.joinButtonText}>Join League</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.title}>Select League</Text>
        <Text style={styles.subtitle}>
          {userLeagues.length > 0
            ? "Choose a league to continue"
            : "Join your first league to get started"}
        </Text>
      </View>

      <FlatList
        data={userLeagues}
        renderItem={renderUserLeague}
        keyExtractor={item => `user-${item.id}`}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={() => (
          <>
            {userLeagues.length > 0 && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>My Leagues</Text>
              </View>
            )}
          </>
        )}
        ListFooterComponent={() => (
          <>
            {/* Join by Code Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Join by Invite Code</Text>
                <TouchableOpacity
                  onPress={() => setShowJoinForm(!showJoinForm)}
                  style={styles.toggleButton}
                >
                  <Text style={styles.toggleButtonText}>
                    {showJoinForm ? "Cancel" : "Join"}
                  </Text>
                </TouchableOpacity>
              </View>

              {showJoinForm && (
                <View style={styles.joinForm}>
                  <TextInput
                    style={styles.codeInput}
                    value={inviteCode}
                    onChangeText={setInviteCode}
                    placeholder="Enter invite code (e.g., league-name-123)"
                    placeholderTextColor="#6B7280"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={[
                      styles.joinCodeButton,
                      isLoading && styles.disabledButton,
                    ]}
                    onPress={handleJoinByCode}
                    disabled={isLoading}
                  >
                    <Text style={styles.joinCodeButtonText}>
                      {isLoading ? "Joining..." : "Join League"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Available Public Leagues */}
            {availableLeagues.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Public Leagues</Text>
                </View>
                {availableLeagues.map(league => (
                  <View key={`available-${league.id}`}>
                    {renderAvailableLeague({ item: league })}
                  </View>
                ))}
              </>
            )}

            {/* Empty State */}
            {userLeagues.length === 0 && availableLeagues.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>🏀</Text>
                <Text style={styles.emptyTitle}>No Leagues Available</Text>
                <Text style={styles.emptyDescription}>
                  Ask a league administrator for an invite code to join a league
                </Text>
              </View>
            )}
          </>
        )}
        showsVerticalScrollIndicator={false}
      />

      {selectedLeague && (
        <View style={styles.continueSection}>
          <TouchableOpacity style={styles.continueButton}>
            <Text style={styles.continueButtonText}>
              Continue to {selectedLeague.name}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#F9FAFB",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  content: {
    paddingHorizontal: 24,
  },
  section: {
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F9FAFB",
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#374151",
    borderRadius: 6,
  },
  toggleButtonText: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "600",
  },
  leagueCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#374151",
  },
  selectedLeagueCard: {
    borderColor: "#EF4444",
    backgroundColor: "#7F1D1D",
  },
  availableLeagueCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  leagueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  leagueName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F9FAFB",
    flex: 1,
    marginRight: 12,
  },
  leagueTypeBadge: {
    backgroundColor: "#374151",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  publicBadge: {
    backgroundColor: "#065F46",
  },
  leagueTypeText: {
    color: "#F9FAFB",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  leagueDescription: {
    color: "#D1D5DB",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  leagueStats: {
    marginBottom: 8,
  },
  leagueStatText: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  leagueSeason: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 2,
  },
  membershipBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#065F46",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  membershipText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "600",
  },
  selectedIndicator: {
    alignItems: "center",
    marginTop: 12,
  },
  selectedText: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "600",
  },
  joinButton: {
    backgroundColor: "#EF4444",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  joinButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  joinForm: {
    gap: 12,
  },
  codeInput: {
    backgroundColor: "#1F2937",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#F9FAFB",
  },
  joinCodeButton: {
    backgroundColor: "#EF4444",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  joinCodeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: "#F9FAFB",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptyDescription: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  continueSection: {
    padding: 24,
    backgroundColor: "#1F2937",
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  continueButton: {
    backgroundColor: "#EF4444",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
