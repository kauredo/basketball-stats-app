import React, { useEffect, useState } from "react";
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
import { League, basketballAPI } from "@basketball-stats/shared";
import { useAuthStore } from "../../hooks/useAuthStore";
import Icon from "../../components/Icon";

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
        className={`bg-gray-800 rounded-xl p-4 mb-3 border-2 ${
          isSelected ? "border-primary-500 bg-primary-900" : "border-gray-700"
        }`}
        onPress={() => selectLeague(league)}
      >
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-lg font-bold text-white flex-1 mr-3">
            {league.name}
          </Text>
          <View className="bg-gray-700 px-2 py-1 rounded">
            <Text className="text-white text-xs font-semibold capitalize">
              {league.league_type}
            </Text>
          </View>
        </View>

        {league.description && (
          <Text
            className="text-gray-300 text-sm leading-5 mb-3"
            numberOfLines={2}
          >
            {league.description}
          </Text>
        )}

        <View className="mb-2">
          <Text className="text-gray-400 text-xs">
            {league.teams_count || 0} teams • {league.members_count || 0}{" "}
            members
          </Text>
          <Text className="text-gray-400 text-xs mt-0.5">
            Season: {league.season}
          </Text>
        </View>

        {league.membership && (
          <View className="self-start bg-court-800 px-2 py-1 rounded mt-2">
            <Text className="text-court-400 text-xs font-semibold">
              {league.membership.display_role}
            </Text>
          </View>
        )}

        {isSelected && (
          <View className="items-center mt-3">
            <View className="flex-row items-center">
              <Icon name="check" size={16} color="#10B981" className="mr-1" />
              <Text className="text-green-400 text-sm font-semibold">
                Selected
              </Text>
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
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-bold text-white flex-1 mr-3">
          {league.name}
        </Text>
        <View className="bg-court-800 px-2 py-1 rounded">
          <Text className="text-white text-xs font-semibold">Public</Text>
        </View>
      </View>

      {league.description && (
        <Text
          className="text-gray-300 text-sm leading-5 mb-3"
          numberOfLines={2}
        >
          {league.description}
        </Text>
      )}

      <View className="mb-3">
        <Text className="text-gray-400 text-xs">
          {league.teams_count || 0} teams • {league.members_count || 0} members
        </Text>
      </View>

      <TouchableOpacity
        className="bg-primary-500 rounded-lg py-3 items-center mt-3"
        onPress={() => handleJoinLeague(league.id)}
      >
        <Text className="text-white text-sm font-semibold">Join League</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-dark-950">
      <StatusBar style="light" />

      <View className="px-6 pt-6 pb-4">
        <Text className="text-3xl font-bold text-white mb-2">
          Select League
        </Text>
        <Text className="text-base text-gray-400">
          {userLeagues.length > 0
            ? "Choose a league to continue"
            : "Join your first league to get started"}
        </Text>
      </View>

      <FlatList
        data={userLeagues}
        renderItem={renderUserLeague}
        keyExtractor={item => `user-${item.id}`}
        className="px-6"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
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
                <Text className="text-lg font-bold text-white">
                  Join by Invite Code
                </Text>
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
                      isLoading ? "opacity-50" : ""
                    }`}
                    onPress={handleJoinByCode}
                    disabled={isLoading}
                  >
                    <Text className="text-white text-sm font-semibold">
                      {isLoading ? "Joining..." : "Join League"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Available Public Leagues */}
            {availableLeagues.length > 0 && (
              <>
                <View className="flex-row justify-between items-center mb-4 mt-6">
                  <Text className="text-lg font-bold text-white">
                    Public Leagues
                  </Text>
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
              <View className="items-center justify-center py-16">
                <Icon
                  name="basketball"
                  size={48}
                  color="#6B7280"
                  className="mb-4"
                />
                <Text className="text-white text-lg font-bold mb-2">
                  No Leagues Available
                </Text>
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
