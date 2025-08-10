import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "../hooks/useAuthStore";

export default function ProfileScreen() {
  const { user, selectedLeague, userLeagues, logout, selectLeague } =
    useAuthStore();

  const handleLogout = () => {
    Alert.alert("Confirm Logout", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: logout,
      },
    ]);
  };

  const handleSwitchLeague = () => {
    Alert.alert("Switch League", "Select a different league:", [
      { text: "Cancel", style: "cancel" },
      ...userLeagues.map(league => ({
        text: league.name,
        onPress: () => selectLeague(league),
      })),
      {
        text: "League Selection",
        onPress: () => selectLeague(null),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView style={styles.content}>
        {/* User Info */}
        <View style={styles.userSection}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {user?.first_name?.[0]}
              {user?.last_name?.[0]}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.full_name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.userBadge}>
            <Text style={styles.userBadgeText}>
              {user?.role === "admin" ? "Administrator" : "User"}
            </Text>
          </View>
        </View>

        {/* Current League */}
        {selectedLeague && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current League</Text>
            <View style={styles.leagueCard}>
              <View style={styles.leagueInfo}>
                <Text style={styles.leagueName}>{selectedLeague.name}</Text>
                <Text style={styles.leagueType}>
                  {selectedLeague.league_type}
                </Text>
                <Text style={styles.leagueSeason}>
                  Season: {selectedLeague.season}
                </Text>
                {selectedLeague.membership && (
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>
                      {selectedLeague.membership.display_role}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.switchButton}
                onPress={handleSwitchLeague}
              >
                <Text style={styles.switchButtonText}>Switch</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* League Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Leagues</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userLeagues.length}</Text>
              <Text style={styles.statLabel}>Total Leagues</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {userLeagues.filter(l => l.membership?.role === "admin").length}
              </Text>
              <Text style={styles.statLabel}>As Admin</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {userLeagues.filter(l => l.membership?.role === "coach").length}
              </Text>
              <Text style={styles.statLabel}>As Coach</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {userLeagues.filter(l => l.status === "active").length}
              </Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Account Settings</Text>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Notifications</Text>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Help & Support</Text>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  userSection: {
    alignItems: "center",
    paddingVertical: 32,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#F9FAFB",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#9CA3AF",
    marginBottom: 12,
  },
  userBadge: {
    backgroundColor: "#065F46",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userBadgeText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F9FAFB",
    marginBottom: 16,
  },
  leagueCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#374151",
  },
  leagueInfo: {
    flex: 1,
  },
  leagueName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#F9FAFB",
    marginBottom: 4,
  },
  leagueType: {
    fontSize: 14,
    color: "#9CA3AF",
    textTransform: "capitalize",
  },
  leagueSeason: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#065F46",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  roleBadgeText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "600",
  },
  switchButton: {
    backgroundColor: "#374151",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  switchButtonText: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statItem: {
    backgroundColor: "#1F2937",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    flex: 1,
    minWidth: "45%",
    borderWidth: 1,
    borderColor: "#374151",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#EF4444",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },
  settingItem: {
    backgroundColor: "#1F2937",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  settingText: {
    fontSize: 16,
    color: "#F9FAFB",
  },
  settingArrow: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  logoutButton: {
    backgroundColor: "#DC2626",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
