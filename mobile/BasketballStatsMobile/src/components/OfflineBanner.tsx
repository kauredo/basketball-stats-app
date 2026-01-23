import React from "react";
import { View, Text, Platform, StatusBar } from "react-native";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import Icon from "./Icon";

// Get status bar height for Android, iOS handles it via SafeAreaView in parent
const STATUSBAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight || 24 : 44;

export function OfflineBanner() {
  const { isOnline, wasOffline } = useOnlineStatus();

  if (isOnline && !wasOffline) return null;

  return (
    <View
      className="absolute top-0 left-0 right-0 z-[100] pb-2"
      style={{
        paddingTop: STATUSBAR_HEIGHT,
        backgroundColor: isOnline ? "#16a34a" : "#d97706",
      }}
    >
      <View className="flex-row items-center justify-center gap-2 px-4">
        {isOnline ? (
          <>
            <Icon name="check" size={16} color="#FFFFFF" />
            <Text className="text-white text-sm font-medium">Back online - Data syncing...</Text>
          </>
        ) : (
          <>
            <Icon name="alert" size={16} color="#FFFFFF" />
            <Text className="text-white text-sm font-medium">
              You're offline - Viewing cached data
            </Text>
            <Icon name="wifi" size={16} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </>
        )}
      </View>
    </View>
  );
}

export default OfflineBanner;
