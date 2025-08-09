import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { basketballAPI, Team } from '@basketball-stats/shared';

export default function TeamsScreen() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTeams = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      const response = await basketballAPI.getTeams();
      setTeams(response.teams);
    } catch (error) {
      console.error('Failed to load teams:', error);
      Alert.alert('Error', 'Failed to load teams');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadTeams(true);
  };

  const renderTeam = ({ item: team }: { item: Team }) => (
    <TouchableOpacity style={styles.teamCard}>
      <View style={styles.teamHeader}>
        <Text style={styles.teamName}>{team.name}</Text>
        {team.city && <Text style={styles.teamCity}>{team.city}</Text>}
      </View>
      
      <View style={styles.teamStats}>
        <Text style={styles.playersCount}>
          {team.active_players_count} Active Players
        </Text>
      </View>
      
      {team.description && (
        <Text style={styles.teamDescription} numberOfLines={2}>
          {team.description}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading teams...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <FlatList
        data={teams}
        renderItem={renderTeam}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>🏀</Text>
            <Text style={styles.emptyTitle}>No teams found</Text>
            <Text style={styles.emptyDescription}>
              Teams will appear here once they're added
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  loadingText: {
    color: '#F9FAFB',
    fontSize: 16,
  },
  content: {
    padding: 16,
  },
  teamCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  teamHeader: {
    marginBottom: 8,
  },
  teamName: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: 'bold',
  },
  teamCity: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 2,
  },
  teamStats: {
    marginBottom: 8,
  },
  playersCount: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
  teamDescription: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyDescription: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});