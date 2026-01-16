import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useAuth } from "../../contexts/AuthContext";
import Icon from "../../components/Icon";

interface League {
  id: Id<"leagues">;
  name: string;
  description?: string;
  leagueType: string;
  season: string;
  status: string;
  isPublic: boolean;
  teamsCount?: number;
  membersCount?: number;
  gamesCount?: number;
  membership?: {
    id?: string;
    role: string;
    status?: string;
    joinedAt?: number;
  } | null;
}

export default function LeagueSelectionScreen() {
  const { token, selectedLeague, selectLeague, setUserLeagues, isLoading: authLoading } = useAuth();
  const [inviteCode, setInviteCode] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const leaguesData = useQuery(api.leagues.list, token ? { token } : "skip");

  const joinLeagueMutation = useMutation(api.leagues.join);
  const joinByCodeMutation = useMutation(api.leagues.joinByCode);

  const allLeagues = leaguesData?.leagues || [];

  // Separate user's leagues (has membership) from public ones (no membership)
  const userLeagues = allLeagues.filter((league: League) => league.membership);
  const availableLeagues = allLeagues.filter(
    (league: League) => !league.membership && league.isPublic
  );

  const onRefresh = async () => {
    setRefreshing(true);
    // Data will auto-refresh with Convex
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleJoinLeague = async (leagueId: Id<"leagues">) => {
    if (!token) return;

    setIsJoining(true);
    try {
      await joinLeagueMutation({ token, leagueId });
      Alert.alert("Success", "Successfully joined the league!");
    } catch (error: any) {
      console.error("Failed to join league:", error);
      Alert.alert("Error", error.message || "Failed to join league");
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinByCode = async () => {
    if (!inviteCode.trim() || !token) {
      Alert.alert("Error", "Please enter an invite code");
      return;
    }

    setIsJoining(true);
    try {
      await joinByCodeMutation({ token, code: inviteCode.trim() });
      setInviteCode("");
      setShowJoinForm(false);
      Alert.alert("Success", "Successfully joined the league!");
    } catch (error: any) {
      console.error("Failed to join league by code:", error);
      Alert.alert("Error", error.message || "Failed to join league");
    } finally {
      setIsJoining(false);
    }
  };

  const handleSelectLeague = (league: League) => {
    selectLeague(league);
  };

  const renderUserLeague = ({ item: league }: { item: League }) => {
    const isSelected = selectedLeague?.id === league.id;

    return (
      <TouchableOpacity
        className={`bg-gray-800 rounded-xl p-4 mb-3 border-2 ${
          isSelected ? "border-primary-500 bg-primary-900" : "border-gray-700"
        }`}
        onPress={() => handleSelectLeague(league)}
      >
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-lg font-bold text-white flex-1 mr-3">{league.name}</Text>
          <View className="bg-gray-700 px-2 py-1 rounded">
            <Text className="text-white text-xs font-semibold capitalize">{league.leagueType}</Text>
          </View>
        </View>

        {league.description && (
          <Text className="text-gray-300 text-sm leading-5 mb-3" numberOfLines={2}>
            {league.description}
          </Text>
        )}

        <View className="mb-2">
          <Text className="text-gray-400 text-xs">
            {league.teamsCount || 0} teams • {league.membersCount || 0} members
          </Text>
          <Text className="text-gray-400 text-xs mt-0.5">Season: {league.season}</Text>
        </View>

        {league.membership && (
          <View className="self-start bg-court-800 px-2 py-1 rounded mt-2">
            <Text className="text-court-400 text-xs font-semibold capitalize">
              {league.membership.role}
            </Text>
          </View>
        )}

        {isSelected && (
          <View className="items-center mt-3">
            <View className="flex-row items-center">
              <Icon name="check" size={16} color="#10B981" className="mr-1" />
              <Text className="text-green-400 text-sm font-semibold">Selected</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderAvailableLeague = ({ item: league }: { item: League }) => (
    <TouchableOpacity
      className="bg-gray-800 rounded-xl p-4 mb-3 border border-gray-700"
      onPress={() => handleJoinLeague(league.id)}
      disabled={isJoining}
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-bold text-white flex-1 mr-3">{league.name}</Text>
        <View className="bg-court-800 px-2 py-1 rounded">
          <Text className="text-white text-xs font-semibold">Public</Text>
        </View>
      </View>

      {league.description && (
        <Text className="text-gray-300 text-sm leading-5 mb-3" numberOfLines={2}>
          {league.description}
        </Text>
      )}

      <View className="mb-3">
        <Text className="text-gray-400 text-xs">
          {league.teamsCount || 0} teams • {league.membersCount || 0} members
        </Text>
      </View>

      <TouchableOpacity
        className={`bg-primary-500 rounded-lg py-3 items-center mt-3 ${isJoining ? "opacity-50" : ""}`}
        onPress={() => handleJoinLeague(league.id)}
        disabled={isJoining}
      >
        <Text className="text-white text-sm font-semibold">
          {isJoining ? "Joining..." : "Join League"}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (leaguesData === undefined) {
    return (
      <View className="flex-1 bg-dark-950 justify-center items-center">
        <Text className="text-white text-base">Loading leagues...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-dark-950">
      <StatusBar style="light" />

      <View className="px-6 pt-6 pb-4">
        <Text className="text-3xl font-bold text-white mb-2">Select League</Text>
        <Text className="text-base text-gray-400">
          {userLeagues.length > 0
            ? "Choose a league to continue"
            : "Join your first league to get started"}
        </Text>
      </View>

      <FlatList
        data={userLeagues}
        renderItem={renderUserLeague}
        keyExtractor={(item) => `user-${item.id}`}
        className="px-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={() => (
          <>
            {userLeagues.length > 0 && (
              <View className="flex-row justify-between items-center mb-4 mt-6">
                <Text className="text-lg font-bold text-white">My Leagues</Text>
              </View>
            )}
          </>
        )}
        ListFooterComponent={() => (
          <>
            {/* Join by Code Section */}
            <View className="my-4">
              <View className="flex-row justify-between items-center mb-4 mt-6">
                <Text className="text-lg font-bold text-white">Join by Invite Code</Text>
                <TouchableOpacity
                  onPress={() => setShowJoinForm(!showJoinForm)}
                  className="px-3 py-1.5 bg-gray-700 rounded"
                >
                  <Text className="text-white text-sm font-semibold">
                    {showJoinForm ? "Cancel" : "Join"}
                  </Text>
                </TouchableOpacity>
              </View>

              {showJoinForm && (
                <View className="gap-3">
                  <TextInput
                    className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-base text-white"
                    value={inviteCode}
                    onChangeText={setInviteCode}
                    placeholder="Enter invite code (e.g., league-name-123)"
                    placeholderTextColor="#6B7280"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    className={`bg-primary-500 rounded-lg py-3 items-center ${
                      isJoining ? "opacity-50" : ""
                    }`}
                    onPress={handleJoinByCode}
                    disabled={isJoining}
                  >
                    <Text className="text-white text-sm font-semibold">
                      {isJoining ? "Joining..." : "Join League"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Available Public Leagues */}
            {availableLeagues.length > 0 && (
              <>
                <View className="flex-row justify-between items-center mb-4 mt-6">
                  <Text className="text-lg font-bold text-white">Public Leagues</Text>
                </View>
                {availableLeagues.map((league: League) => (
                  <View key={`available-${league.id}`}>
                    {renderAvailableLeague({ item: league })}
                  </View>
                ))}
              </>
            )}

            {/* Empty State */}
            {userLeagues.length === 0 && availableLeagues.length === 0 && (
              <View className="items-center justify-center py-16">
                <Icon name="basketball" size={48} color="#6B7280" className="mb-4" />
                <Text className="text-white text-lg font-bold mb-2">No Leagues Available</Text>
                <Text className="text-gray-400 text-sm text-center leading-5 px-8">
                  Ask a league administrator for an invite code to join a league
                </Text>
              </View>
            )}
          </>
        )}
        showsVerticalScrollIndicator={false}
      />

      {selectedLeague && (
        <View className="p-6 bg-gray-800 border-t border-gray-700">
          <TouchableOpacity className="bg-primary-500 rounded-xl py-4 items-center">
            <Text className="text-white text-base font-semibold">
              Continue to {selectedLeague.name}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
