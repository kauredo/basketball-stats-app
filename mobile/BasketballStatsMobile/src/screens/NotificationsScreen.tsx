import React from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FontAwesome5 } from "@expo/vector-icons";
import { useNotifications } from "../contexts/NotificationContext";
import { Id } from "../../../../convex/_generated/dataModel";
import { RootStackParamList } from "../navigation/AppNavigator";
import Icon from "../components/Icon";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Notification {
  _id: Id<"notifications">;
  type: string;
  title: string;
  body: string;
  data?: { gameId?: string; teamId?: string; playerId?: string };
  read: boolean;
  createdAt: number;
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function getNotificationIcon(type: string): { name: string; color: string } {
  switch (type) {
    case "game_reminder":
      return { name: "clock", color: "#3B82F6" };
    case "game_start":
      return { name: "play", color: "#22C55E" };
    case "game_end":
      return { name: "flag-checkered", color: "#8B5CF6" };
    case "score_update":
      return { name: "chart-bar", color: "#EAB308" };
    case "team_update":
      return { name: "users", color: "#F97316" };
    case "league_announcement":
      return { name: "bullhorn", color: "#EC4899" };
    default:
      return { name: "bell", color: "#6B7280" };
  }
}

export default function NotificationsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    // Convex auto-refreshes, just show the spinner briefly
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    const { type, data } = notification;

    switch (type) {
      case "game_reminder":
      case "game_start":
        if (data?.gameId) {
          navigation.navigate("LiveGame", { gameId: data.gameId });
        }
        break;
      case "game_end":
        // Navigate to game analysis when implemented
        // For now, just mark as read
        break;
      case "score_update":
        // Navigate to statistics
        break;
      case "team_update":
        if (data?.teamId) {
          // Navigate to team detail when we have the team name
          // For now, just mark as read
        }
        break;
      default:
        break;
    }
  };

  const handleDelete = (notificationId: Id<"notifications">) => {
    Alert.alert("Delete Notification", "Are you sure you want to delete this notification?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteNotification(notificationId),
      },
    ]);
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const icon = getNotificationIcon(item.type);

    return (
      <TouchableOpacity
        onPress={() => handleNotificationPress(item)}
        onLongPress={() => handleDelete(item._id)}
        className={`flex-row p-4 border-b border-surface-200 dark:border-surface-700 ${
          !item.read ? "bg-primary-500/5 dark:bg-primary-500/10" : "bg-white dark:bg-surface-800"
        }`}
        activeOpacity={0.7}
      >
        {/* Unread indicator */}
        {!item.read && (
          <View className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary-500" />
        )}

        {/* Icon */}
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${icon.color}20` }}
        >
          <FontAwesome5 name={icon.name} size={16} color={icon.color} />
        </View>

        {/* Content */}
        <View className="flex-1">
          <Text
            className={`text-base font-semibold ${
              item.read ? "text-surface-700 dark:text-surface-300" : "text-surface-900 dark:text-white"
            }`}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text className="text-sm text-surface-600 dark:text-surface-400 mt-0.5" numberOfLines={2}>
            {item.body}
          </Text>
          <Text className="text-xs text-surface-500 dark:text-surface-500 mt-1">
            {formatTime(item.createdAt)}
          </Text>
        </View>

        {/* Actions */}
        <View className="justify-center ml-2">
          {!item.read && (
            <TouchableOpacity
              onPress={() => markAsRead(item._id)}
              className="p-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome5 name="check" size={14} color="#22C55E" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center p-8">
      <View className="w-20 h-20 rounded-full bg-surface-200 dark:bg-surface-700 items-center justify-center mb-4">
        <FontAwesome5 name="bell" size={32} color="#9CA3AF" />
      </View>
      <Text className="text-surface-900 dark:text-white text-xl font-bold mb-2">No Notifications</Text>
      <Text className="text-surface-600 dark:text-surface-400 text-center">
        You&apos;ll see game updates and announcements here when they arrive.
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-surface-50 dark:bg-surface-950">
      {/* Header Actions */}
      {notifications.length > 0 && unreadCount > 0 && (
        <View className="bg-white dark:bg-surface-800 px-4 py-3 border-b border-surface-200 dark:border-surface-700 flex-row justify-between items-center">
          <Text className="text-surface-600 dark:text-surface-400 text-sm">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </Text>
          <TouchableOpacity onPress={markAllAsRead}>
            <Text className="text-primary-500 font-medium text-sm">Mark all as read</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notification List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={renderNotification}
        ListEmptyComponent={renderEmptyState}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={notifications.length === 0 ? { flex: 1 } : undefined}
      />

      {/* Help Text */}
      {notifications.length > 0 && (
        <View className="bg-surface-100 dark:bg-surface-800 px-4 py-3 border-t border-surface-200 dark:border-surface-700">
          <Text className="text-surface-500 dark:text-surface-500 text-xs text-center">
            Long press a notification to delete it
          </Text>
        </View>
      )}
    </View>
  );
}
