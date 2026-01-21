import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FontAwesome5 } from "@expo/vector-icons";
import { useNotifications } from "../contexts/NotificationContext";
import type { RootStackParamList } from "../navigation/AppNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface NotificationBellProps {
  color?: string;
}

export default function NotificationBell({ color = "#7a746c" }: NotificationBellProps) {
  const navigation = useNavigation<NavigationProp>();
  const { unreadCount } = useNotifications();

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("Notifications")}
      className="p-2 relative"
      accessibilityLabel={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
    >
      <FontAwesome5
        name={unreadCount > 0 ? "bell" : "bell"}
        size={20}
        color={unreadCount > 0 ? "#F97316" : color}
        solid={unreadCount > 0}
      />
      {unreadCount > 0 && (
        <View className="absolute -top-0.5 -right-0.5 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
          <Text className="text-white text-xs font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
