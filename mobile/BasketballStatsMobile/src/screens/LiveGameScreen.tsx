import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  PanResponder,
  Animated,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import Icon from "../components/Icon";

import {
  basketballAPI,
  Game,
  Player,
  BasketballUtils,
  gameStore,
  websocketService,
} from "@basketball-stats/shared";

import { RootStackParamList } from "../navigation/AppNavigator";

type LiveGameRouteProp = RouteProp<RootStackParamList, "LiveGame">;
type LiveGameNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "LiveGame"
>;

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const STAT_ACTIONS = [
  { id: "field_goal_made", label: "FGM", icon: "target", color: "#10B981" },
  { id: "field_goal_missed", label: "FGA Miss", icon: "x", color: "#EF4444" },
  { id: "three_point_made", label: "3PM", icon: "target", color: "#8B5CF6" },
  { id: "three_point_missed", label: "3PA Miss", icon: "x", color: "#F59E0B" },
  { id: "free_throw_made", label: "FTM", icon: "check", color: "#06B6D4" },
  { id: "free_throw_missed", label: "FTA Miss", icon: "x", color: "#EF4444" },
  { id: "rebound_offensive", label: "OREB", icon: "arrow-up", color: "#F97316" },
  { id: "rebound_defensive", label: "DREB", icon: "arrow-down", color: "#3B82F6" },
  { id: "assist", label: "AST", icon: "users", color: "#10B981" },
  { id: "steal", label: "STL", icon: "activity", color: "#8B5CF6" },
  { id: "block", label: "BLK", icon: "minus", color: "#EF4444" },
  { id: "turnover", label: "TO", icon: "refresh", color: "#F59E0B" },
  { id: "foul_personal", label: "PF", icon: "trash", color: "#EAB308" },
];

interface DraggableStatProps {
  stat: { id: string; label: string; icon: string; color: string };
  onDragStart: () => void;
  onDragEnd: (stat: { id: string; label: string; icon: string; color: string }) => void;
}

function DraggableStat({ stat, onDragStart, onDragEnd }: DraggableStatProps) {
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        onDragStart();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.spring(scale, {
          toValue: 1.1,
          useNativeDriver: false,
        }).start();
      },

      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),

      onPanResponderRelease: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onDragEnd(stat);

        Animated.parallel([
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }),
          Animated.spring(scale, { toValue: 1, useNativeDriver: false }),
        ]).start();
      },
    })
  ).current;

  return (
    <Animated.View
      className="px-3 py-2 rounded-2xl min-w-[80px] flex-row items-center justify-center"
      style={[
        { backgroundColor: stat.color },
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: scale },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <Icon name={stat.icon as any} size={12} color="#FFFFFF" className="mr-1" />
      <Text className="text-white text-xs font-semibold text-center">{stat.label}</Text>
    </Animated.View>
  );
}

export default function LiveGameScreen() {
  const route = useRoute<LiveGameRouteProp>();
  const navigation = useNavigation<LiveGameNavigationProp>();
  const { gameId } = route.params;

  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<{ home: Player[]; away: Player[] }>({
    home: [],
    away: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    loadGameData();

    // Connect to WebSocket for real-time updates
    websocketService.connect();
    websocketService.joinGame(gameId, updatedGame => {
      setGame(updatedGame);
    });

    return () => {
      websocketService.leaveGame(gameId);
    };
  }, [gameId]);

  const loadGameData = async () => {
    try {
      setLoading(true);

      // Load game details
      const gameResponse = await basketballAPI.getGame(gameId);
      setGame(gameResponse.game);

      // Load players for both teams
      const [homePlayersResponse, awayPlayersResponse] = await Promise.all([
        basketballAPI.getTeamPlayers(gameResponse.game.home_team_id),
        basketballAPI.getTeamPlayers(gameResponse.game.away_team_id),
      ]);

      setPlayers({
        home: homePlayersResponse.players,
        away: awayPlayersResponse.players,
      });
    } catch (error) {
      console.error("Failed to load game data:", error);
      Alert.alert("Error", "Failed to load game data");
    } finally {
      setLoading(false);
    }
  };

  const handleGameAction = async (action: string) => {
    if (!game) return;

    try {
      let response;
      switch (action) {
        case "start":
          response = await basketballAPI.startGame(game.id);
          break;
        case "pause":
          response = await basketballAPI.pauseGame(game.id);
          break;
        case "resume":
          response = await basketballAPI.resumeGame(game.id);
          break;
        case "end":
          response = await basketballAPI.endGame(game.id);
          break;
        default:
          return;
      }

      setGame(response.game);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error(`Failed to ${action} game:`, error);
      Alert.alert("Error", `Failed to ${action} game`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleStatDrag = async (stat: (typeof STAT_ACTIONS)[0]) => {
    if (!selectedPlayer || !game) return;

    try {
      await basketballAPI.recordPlayerStat(game.id, selectedPlayer.id, {
        stat_type: stat.id,
        value: 1,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Clear selected player after recording stat
      setSelectedPlayer(null);
    } catch (error) {
      console.error("Failed to record stat:", error);
      Alert.alert("Error", "Failed to record stat");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const renderPlayerCard = (player: Player, isHome: boolean) => {
    const isSelected = selectedPlayer?.id === player.id;

    return (
      <TouchableOpacity
        key={player.id}
        className={`bg-gray-800 rounded-xl p-3 border min-w-[120px] ${
          isSelected ? 'border-primary-500 border-2 bg-red-900' : 'border-gray-700'
        } ${isDragging && isSelected ? 'border-green-500 border-4 bg-green-900' : ''}`}
        onPress={() => setSelectedPlayer(isSelected ? null : player)}
      >
        <View className="flex-row items-center gap-2">
          <Text className="text-primary-500 text-base font-bold">#{player.jersey_number}</Text>
          <View className="flex-1">
            <Text className="text-white text-sm font-semibold">{player.name}</Text>
            <Text className="text-gray-400 text-xs">{player.position}</Text>
          </View>
        </View>

        {isSelected && (
          <View className="flex-row items-center justify-center mt-1">
            <Icon name="check" size={10} color="#10B981" className="mr-1" />
            <Text className="text-green-400 text-xs font-semibold">Selected</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderGameControls = () => {
    if (!game) return null;

    const isActive = game.status === "active";
    const isPaused = game.status === "paused";
    const canStart = game.status === "scheduled";

    return (
      <View className="flex-row justify-center gap-3">
        {canStart && (
          <TouchableOpacity
            className="px-4 py-2 bg-green-500 rounded-lg min-w-[80px] flex-row items-center justify-center"
            onPress={() => handleGameAction("start")}
          >
            <Icon name="play" size={14} color="#FFFFFF" className="mr-2" />
            <Text className="text-white text-sm font-semibold">Start</Text>
          </TouchableOpacity>
        )}

        {isActive && (
          <TouchableOpacity
            className="px-4 py-2 bg-yellow-500 rounded-lg min-w-[80px] flex-row items-center justify-center"
            onPress={() => handleGameAction("pause")}
          >
            <Icon name="pause" size={14} color="#FFFFFF" className="mr-2" />
            <Text className="text-white text-sm font-semibold">Pause</Text>
          </TouchableOpacity>
        )}

        {isPaused && (
          <TouchableOpacity
            className="px-4 py-2 bg-blue-500 rounded-lg min-w-[80px] flex-row items-center justify-center"
            onPress={() => handleGameAction("resume")}
          >
            <Icon name="play" size={14} color="#FFFFFF" className="mr-2" />
            <Text className="text-white text-sm font-semibold">Resume</Text>
          </TouchableOpacity>
        )}

        {(isActive || isPaused) && (
          <TouchableOpacity
            className="px-4 py-2 bg-red-500 rounded-lg min-w-[80px] flex-row items-center justify-center"
            onPress={() => handleGameAction("end")}
          >
            <Icon name="stop" size={14} color="#FFFFFF" className="mr-2" />
            <Text className="text-white text-sm font-semibold">End</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-dark-950">
        <Text className="text-white text-base">Loading game...</Text>
      </View>
    );
  }

  if (!game) {
    return (
      <View className="flex-1 justify-center items-center bg-dark-950">
        <Text className="text-white text-base">Game not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-dark-950">
      <StatusBar style="light" />

      {/* Game Header */}
      <View className="bg-gray-800 p-4 border-b border-gray-700">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-1 items-center">
            <Text className="text-white text-sm font-semibold text-center">{game.away_team.name}</Text>
            <Text className="text-white text-3xl font-bold mt-1">{game.away_score}</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-red-500 text-lg font-bold">Q{game.current_quarter}</Text>
            <Text className="text-white text-base font-semibold mt-0.5">{game.time_display}</Text>
            <Text className="text-gray-400 text-xs mt-0.5">
              {BasketballUtils.getGameStatusDisplayName(game.status)}
            </Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-white text-sm font-semibold text-center">{game.home_team.name}</Text>
            <Text className="text-white text-3xl font-bold mt-1">{game.home_score}</Text>
          </View>
        </View>

        {renderGameControls()}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
      >
        {/* Player Selection */}
        {selectedPlayer && (
          <View className="bg-gray-800 p-4 rounded-xl mb-4 border-2 border-red-500">
            <Text className="text-white text-base font-bold mb-3">Recording stats for:</Text>
            <Text className="text-white text-lg font-bold mb-1">
              #{selectedPlayer.jersey_number} {selectedPlayer.name}
            </Text>
            <Text className="text-gray-400 text-sm">
              Drag a stat below onto this player to record it
            </Text>
          </View>
        )}

        {/* Away Team Players */}
        <View className="mb-6">
          <Text className="text-white text-base font-bold mb-3">{game.away_team.name} (Away)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3">
              {players.away.map(player => renderPlayerCard(player, false))}
            </View>
          </ScrollView>
        </View>

        {/* Home Team Players */}
        <View className="mb-6">
          <Text className="text-white text-base font-bold mb-3">{game.home_team.name} (Home)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3">
              {players.home.map(player => renderPlayerCard(player, true))}
            </View>
          </ScrollView>
        </View>

        {/* Stat Actions */}
        <View className="mt-4">
          <Text className="text-white text-base font-bold mb-3">Drag Stats to Players</Text>
          <View className="flex-row flex-wrap gap-3 justify-center">
            {STAT_ACTIONS.map(stat => (
              <DraggableStat
                key={stat.id}
                stat={stat}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={draggedStat => {
                  setIsDragging(false);
                  handleStatDrag(draggedStat);
                }}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

